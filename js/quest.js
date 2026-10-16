/**
 * Quest & Mission Manager for Barrier-Free Voice Robot Experience
 * Manages 4 step-by-step missions for elementary school kids:
 * 1. 로봇 깨우기 ("로봇아!")
 * 2. 무거운 상자 옮기기 ("상자를 책상으로 옮겨줘")
 * 3. 인형 정리하기 ("인형을 상자에 넣어줘")
 * 4. 함께 춤추기 또는 불 끄기 ("신나게 춤춰줘" / "불 꺼줘")
 */
class QuestManager {
    constructor(app) {
        this.app = app;
        this.container = document.getElementById('quest-panel');
        this.listEl = document.getElementById('quest-list');
        this.progressBadge = document.getElementById('quest-progress-badge');

        this.quests = [
            {
                id: 'wake',
                title: '로봇 깨우기',
                desc: '"로봇아!" 하고 부르기',
                icon: '🗣️',
                completed: false
            },
            {
                id: 'box_desk',
                title: '상자를 책상으로 옮기기',
                desc: '"상자를 책상으로 옮겨줘"',
                icon: '📦',
                completed: false
            },
            {
                id: 'bear_box',
                title: '인형을 상자에 올리기',
                desc: '"인형을 상자에 올려줘"',
                icon: '🧸',
                completed: false
            },
            {
                id: 'ball_bed',
                title: '공을 침대로 옮기기',
                desc: '"공을 침대로 옮겨줘"',
                icon: '⚽',
                completed: false
            },
            {
                id: 'book_shelf',
                title: '책을 선반으로 옮기기',
                desc: '"책을 선반으로 옮겨줘"',
                icon: '📚',
                completed: false
            },
            {
                id: 'fun_action',
                title: '신나게 춤추기 / 불 끄기',
                desc: '"신나게 춤춰줘" 또는 "불 꺼줘"',
                icon: '💃',
                completed: false
            }
        ];

        this.render();
    }

    render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        const completedCount = this.quests.filter(q => q.completed).length;
        if (this.progressBadge) {
            this.progressBadge.textContent = `${completedCount} / ${this.quests.length} 완료`;
            if (completedCount === this.quests.length) {
                this.progressBadge.classList.add('all-done');
                this.progressBadge.textContent = '🎉 모든 퀘스트 완료!';
            } else {
                this.progressBadge.classList.remove('all-done');
            }
        }

        this.quests.forEach((q, idx) => {
            const card = document.createElement('div');
            card.className = `quest-card ${q.completed ? 'completed' : ''}`;
            card.dataset.questId = q.id;

            card.innerHTML = `
                <div class="quest-check">${q.completed ? '⭐' : (idx + 1)}</div>
                <div class="quest-info">
                    <div class="quest-item-title">
                        <span class="q-icon">${q.icon}</span>
                        <strong>${q.title}</strong>
                        ${q.completed ? '<span class="badge-done">완료!</span>' : ''}
                    </div>
                    <div class="quest-hint">🗣️ <code>${q.desc}</code></div>
                </div>
            `;

            this.listEl.appendChild(card);
        });
    }

    checkCommand(intent, stage = 'done') {
        if (!intent) return;
        let matchedQuest = null;

        if (intent.type === 'WAKE_WORD' && stage === 'done') {
            matchedQuest = this.quests.find(q => q.id === 'wake');
        } else if (intent.type === 'MOVE' && (stage === 'done' || stage === 'already')) {
            if (intent.item === 'box' && intent.destination === 'desk') {
                matchedQuest = this.quests.find(q => q.id === 'box_desk');
            } else if (intent.item === 'bear' && (intent.destination === 'box' || intent.destination === 'basket')) {
                matchedQuest = this.quests.find(q => q.id === 'bear_box');
            } else if (intent.item === 'ball' && intent.destination === 'bed') {
                matchedQuest = this.quests.find(q => q.id === 'ball_bed');
            } else if (intent.item === 'book' && intent.destination === 'shelf') {
                matchedQuest = this.quests.find(q => q.id === 'book_shelf');
            }
        } else if ((intent.type === 'DANCE' || intent.type === 'LIGHT_OFF' || intent.type === 'LIGHT_ON') && stage === 'done') {
            matchedQuest = this.quests.find(q => q.id === 'fun_action');
        }

        if (matchedQuest && !matchedQuest.completed) {
            this.completeQuest(matchedQuest.id);
        }
    }

    completeQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest || quest.completed) return;

        quest.completed = true;
        this.render();

        if (window.soundManager) {
            window.soundManager.play('questSuccess');
        }

        if (this.app.world && this.app.robot) {
            this.app.world.spawnConfetti(this.app.robot.mesh.position, 25);
        }

        const remaining = this.quests.filter(q => !q.completed).length;
        if (remaining === 0) {
            // All quests done!
            setTimeout(() => {
                this.app.handleAllQuestsCompleted();
            }, 1200);
        } else {
            this.app.showNotification(`🎉 퀘스트 완료: [${quest.title}]! (${this.quests.length - remaining}/${this.quests.length})`, 'success');
        }
    }

    isAllCompleted() {
        return this.quests.every(q => q.completed);
    }

    reset() {
        this.quests.forEach(q => q.completed = false);
        this.render();
    }
}

window.QuestManager = QuestManager;
