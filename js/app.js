/**
 * Main Application Orchestrator
 * Fully Hands-Free Barrier-Free Experience for Children without using hands/mouse!
 */
class VoiceRobotApp {
    constructor() {
        this.world = null;
        this.robot = null;
        this.clock = new THREE.Clock();
        this.isProcessingCommand = false;
        this.isAppStarted = false;

        this.init();
    }

    init() {
        const container = document.getElementById('canvas-container');
        this.world = new WorldManager(container);
        this.robot = new HelperRobot(this.world);
        this.questManager = new QuestManager(this);

        // Bind Speech & VAD Events
        this.setupSpeechEvents();

        // Bind UI & Foot Switch Events
        this.setupUIEvents();

        // Start 3D Animation Loop
        this.animate();

    }

    /**
     * Start the Hands-Free Experience
     * Triggered on user's first click or foot tap to grant persistent microphone access.
     */
    async startExperience() {
        if (this.isAppStarted) return;
        this.isAppStarted = true;

        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) {
            startOverlay.classList.add('hidden');
        }

        // 1. Initialize sound system and resume Web Audio immediately
        if (window.soundManager) {
            window.soundManager.init();
            if (window.soundManager.ctx && window.soundManager.ctx.state === 'suspended') {
                window.soundManager.ctx.resume().catch(() => {});
            }
        }

        // 2. Unlock speechController audio
        if (window.speechController && window.speechController.unlockAudio) {
            window.speechController.unlockAudio();
        }

        // 3. Play immediate gentle chime for instant auditory verification
        if (window.soundManager) {
            window.soundManager.play('pickup');
        }

        // 4. Start speech recognition
        await window.speechController.startListening();
        this.showNotification('🎉 마이크 켜짐! 손을 쓰지 않고 편하게 말하세요.', 'info');

        // 5. Crisp welcome speech using dedicated robot voice
        setTimeout(() => {
            this.handleRobotResponse('안녕하세요! 저는 여러분의 도우미 로봇 로보에요! 손을 쓰지 않고 목소리로 저에게 명령을 내려보세요!', () => {
                if (this.robot) this.robot.wave();
            });
        }, 350);
    }

    setupSpeechEvents() {
        const speech = window.speechController;
        const micBtn = document.getElementById('btn-mic');
        const micStatus = document.getElementById('mic-status');
        const userSubtitle = document.getElementById('user-subtitle');
        const vadLevelBar = document.getElementById('vad-level-bar');
        const vadPill = document.getElementById('vad-pill');

        // State changes
        speech.onListenStateChange = (isListening) => {
            if (isListening) {
                micBtn.classList.add('listening');
                if (vadPill) vadPill.classList.add('active');
                micStatus.textContent = '🟢 손 없이 상시 듣는 중... 언제든 말씀하세요!';
                micStatus.classList.add('active');
            } else {
                micBtn.classList.remove('listening');
                if (vadPill) vadPill.classList.remove('active');
                micStatus.textContent = '마이크 상시 대기 중...';
                micStatus.classList.remove('active');
            }
        };

        // Realtime Volume Level (VAD) from Web Audio Analyser
        speech.onVolumeLevel = (level) => {
            if (vadLevelBar) {
                vadLevelBar.style.width = `${Math.min(100, level * 1.8)}%`;
                if (level > 25) {
                    vadLevelBar.style.backgroundColor = '#10b981'; // Green active
                } else {
                    vadLevelBar.style.backgroundColor = '#38bdf8'; // Soft cyan
                }
            }

            // Antenna reaction
            if (this.robot && this.robot.state === 'idle' && level > 30) {
                this.robot.antennaLed.scale.setScalar(1.25);
            } else if (this.robot && this.robot.state === 'idle') {
                this.robot.antennaLed.scale.setScalar(1.0);
            }
        };

        // Interim recognized speech (realtime transcription)
        speech.onInterimResult = (text) => {
            userSubtitle.textContent = `"${text}..."`;
            userSubtitle.classList.add('active');
        };

        // Final recognized speech
        speech.onFinalResult = (text) => {
            userSubtitle.textContent = `"${text}"`;
            userSubtitle.classList.add('active');
            this.processCommand(text);
        };

        speech.onSpeakStart = () => {
            this.robot.setTalking(true);
        };

        speech.onSpeakEnd = () => {
            this.robot.setTalking(false);
        };

        speech.onError = (msg) => {
            this.showNotification(msg, 'warning');
        };

        // Typecast AI status badge sync
        speech.onTypecastStatus = (status) => {
            const badge = document.getElementById('typecast-badge');
            const statusText = document.getElementById('typecast-status-text');
            if (!badge || !statusText) return;

            if (status.configured) {
                badge.classList.add('active');
                badge.classList.remove('fallback');
                statusText.textContent = '✨ Typecast AI 연결됨';
                badge.title = `Typecast API 연결됨 (Plan: ${status.plan || 'Free'}, 잔여: ${(status.credits || 0).toLocaleString()}크레딧, 키: ${status.maskedKey || '정상'})`;
            } else {
                badge.classList.remove('active');
                badge.classList.add('fallback');
                statusText.textContent = '브라우저 기본 음성';
                badge.title = 'Typecast API 키가 없어 브라우저 내장 음성으로 동작 중입니다.';
            }
        };

        if (speech.typecastStatus && speech.typecastStatus.configured) {
            speech.onTypecastStatus(speech.typecastStatus);
        }
    }

    setupUIEvents() {
        const startOverlay = document.getElementById('start-overlay');
        const btnStartExp = document.getElementById('btn-start-experience');
        const micBtn = document.getElementById('btn-mic');
        const textInput = document.getElementById('text-command-input');
        const btnSend = document.getElementById('btn-send-text');
        const modalBtn = document.getElementById('btn-info-modal');
        const closeHelpBtn = document.getElementById('btn-close-help');
        const helpModal = document.getElementById('help-modal');
        const btnSpeed = document.getElementById('btn-speed');

        // Start overlay trigger with touch support
        const handleStart = (e) => {
            if (e && e.type === 'touchend') {
                e.preventDefault();
            }
            this.startExperience();
        };

        if (btnStartExp) {
            btnStartExp.addEventListener('click', handleStart);
            btnStartExp.addEventListener('touchend', handleStart);
        }
        if (startOverlay) {
            startOverlay.addEventListener('click', handleStart);
            startOverlay.addEventListener('touchend', handleStart);
        }

        // Global touch / click listener to keep Web Audio API unlocked on mobile tablets
        const resumeAudio = () => {
            if (window.soundManager && window.soundManager.ctx && window.soundManager.ctx.state === 'suspended') {
                window.soundManager.ctx.resume().catch(() => {});
            }
        };
        window.addEventListener('touchstart', resumeAudio, { passive: true });
        window.addEventListener('click', resumeAudio, { passive: true });

        // Speed Toggle Button (1.1x -> 1.35x -> 1.55x)
        const speeds = [
            { rate: 1.35, label: '⚡ 말 속도: 빠름' },
            { rate: 1.55, label: '🚀 말 속도: 매우 빠름' },
            { rate: 1.10, label: '🐢 말 속도: 보통' }
        ];
        let currentSpeedIdx = 0;

        if (btnSpeed) {
            btnSpeed.addEventListener('click', () => {
                currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
                const spd = speeds[currentSpeedIdx];
                window.speechController.setSpeed(spd.rate);
                btnSpeed.textContent = spd.label;
                this.showNotification(`로봇 말하기 속도: ${spd.rate}배속으로 변경되었습니다!`, 'info');
                this.handleRobotResponse(`속도를 변경했어요!`);
            });
        }

        // Foot-Switch or Keyboard Trigger
        window.addEventListener('keydown', (e) => {
            if (!this.isAppStarted) {
                this.startExperience();
                return;
            }

            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                window.soundManager.init();
                if (!window.speechController.isListening) {
                    window.speechController.startListening();
                } else {
                    this.robot.setExpression('surprised');
                    setTimeout(() => this.robot.setExpression('happy'), 400);
                }
            }
        });

        // Mic Button Click
        micBtn.addEventListener('click', () => {
            if (!this.isAppStarted) {
                this.startExperience();
                return;
            }
            window.soundManager.init();
            window.speechController.toggleListening();
        });

        // Text input submit
        const handleTextSubmit = () => {
            const text = textInput.value.trim();
            if (text) {
                document.getElementById('user-subtitle').textContent = `"${text}"`;
                document.getElementById('user-subtitle').classList.add('active');
                this.processCommand(text);
                textInput.value = '';
            }
        };

        // Character display info
        const updateVoiceUI = () => {
            const vInfo = window.speechController.getVoiceInfo();
            const voiceLabel = document.getElementById('current-voice-label');
            const voiceIcon = document.getElementById('current-voice-icon');
            const robotAvatar = document.querySelector('.robot-avatar');
            if (!vInfo) return;
            if (voiceLabel) voiceLabel.textContent = `목소리: ${vInfo.name}`;
            if (voiceIcon) voiceIcon.textContent = vInfo.icon;
            if (robotAvatar) robotAvatar.textContent = vInfo.icon;
        };
        updateVoiceUI();

        // Suggestion Chips
        const chips = document.querySelectorAll('.suggestion-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const cmd = chip.dataset.command || chip.textContent.trim().replace(/^[^a-zA-Z가-힣0-9]+/, '');
                document.getElementById('user-subtitle').textContent = `"${cmd}"`;
                document.getElementById('user-subtitle').classList.add('active');
                if (window.soundManager) window.soundManager.play('button');
                this.processCommand(cmd);
            });
        });

        // Camera Views
        document.querySelectorAll('.camera-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.camera-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const preset = btn.dataset.view;
                this.world.setCameraPreset(preset);
                if (window.soundManager) window.soundManager.play('button');
            });
        });

        // Help Modal
        modalBtn.addEventListener('click', () => {
            helpModal.classList.add('open');
            if (window.soundManager) window.soundManager.play('button');
        });

        closeHelpBtn.addEventListener('click', () => {
            helpModal.classList.remove('open');
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.classList.remove('open');
        });

        // Mute Audio Toggle
        const muteBtn = document.getElementById('btn-mute');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = !window.soundManager.muted;
                window.soundManager.setMuted(isMuted);
                muteBtn.classList.toggle('muted', isMuted);
                muteBtn.title = isMuted ? '소리 켜기' : '소리 끄기';
            });
        }

        // Quest Finish & Next Student Buttons
        const btnFinishQuest = document.getElementById('btn-finish-quest');
        if (btnFinishQuest) {
            btnFinishQuest.addEventListener('click', () => {
                this.completeExperience();
            });
        }

        const btnNextStudent = document.getElementById('btn-next-student');
        if (btnNextStudent) {
            btnNextStudent.addEventListener('click', () => {
                this.resetForNextStudent();
            });
        }

        // Tablet Connection Modal & QR Code
        const tabletModalBtn = document.getElementById('btn-tablet-modal');
        const tabletModal = document.getElementById('tablet-modal');
        const closeTabletBtn = document.getElementById('btn-close-tablet');
        const closeTabletBottomBtn = document.getElementById('btn-close-tablet-bottom');
        const btnCopyUrl = document.getElementById('btn-copy-url');
        const btnApplyCustomUrl = document.getElementById('btn-apply-custom-url');
        const customQrInput = document.getElementById('custom-qr-url');
        const tabletUrlInput = document.getElementById('tablet-url-input');

        const openTabletModal = async () => {
            if (window.soundManager) window.soundManager.play('button');
            if (tabletModal) tabletModal.classList.add('open');

            let targetUrl = window.location.href;
            try {
                const res = await fetch('/api/network-info');
                if (res.ok) {
                    const data = await res.json();
                    if (data.localUrl) {
                        targetUrl = data.localUrl;
                    }
                }
            } catch (e) {}

            if (tabletUrlInput) tabletUrlInput.value = targetUrl;
            this.renderQRCode(targetUrl);
        };

        if (tabletModalBtn && tabletModal) {
            tabletModalBtn.addEventListener('click', openTabletModal);

            if (closeTabletBtn) {
                closeTabletBtn.addEventListener('click', () => tabletModal.classList.remove('open'));
            }
            if (closeTabletBottomBtn) {
                closeTabletBottomBtn.addEventListener('click', () => tabletModal.classList.remove('open'));
            }

            tabletModal.addEventListener('click', (e) => {
                if (e.target === tabletModal) tabletModal.classList.remove('open');
            });

            if (btnCopyUrl && tabletUrlInput) {
                btnCopyUrl.addEventListener('click', () => {
                    const url = tabletUrlInput.value;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(url).then(() => {
                            this.showNotification('📋 태블릿 접속 주소가 복사되었습니다!', 'success');
                        }).catch(() => {
                            tabletUrlInput.select();
                            document.execCommand('copy');
                            this.showNotification('📋 태블릿 접속 주소가 복사되었습니다!', 'success');
                        });
                    } else {
                        tabletUrlInput.select();
                        document.execCommand('copy');
                        this.showNotification('📋 태블릿 접속 주소가 복사되었습니다!', 'success');
                    }
                });
            }

            if (btnApplyCustomUrl && customQrInput) {
                btnApplyCustomUrl.addEventListener('click', () => {
                    const custom = customQrInput.value.trim();
                    if (custom) {
                        if (tabletUrlInput) tabletUrlInput.value = custom;
                        this.renderQRCode(custom);
                        this.showNotification('✨ QR코드가 새 인터넷 주소로 변경되었습니다!', 'info');
                    }
                });
            }
        }
    }

    renderQRCode(url) {
        const qrContainer = document.getElementById('tablet-qrcode');
        if (!qrContainer) return;
        qrContainer.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(qrContainer, {
                    text: url,
                    width: 190,
                    height: 190,
                    colorDark: "#1e1b4b",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (e) {
                console.warn('QR code generation error:', e);
            }
        }
    }

    processCommand(rawText) {
        if (this.isProcessingCommand) {
            this.showNotification('이전 명령을 수행하고 있어요! 잠시만 기다려주세요.', 'info');
            return;
        }

        const intent = window.nluParser.parse(rawText);
        console.log('Interpreted Intent:', intent);

        // Check if completion modal is open and user speaks next student or reset
        const compModal = document.getElementById('completion-modal');
        const isCompModalOpen = compModal && compModal.classList.contains('open');

        if (intent.type === 'FINISH_EXPERIENCE') {
            if (isCompModalOpen) {
                this.resetForNextStudent();
            } else {
                this.completeExperience();
            }
            return;
        }

        // If completion modal is open and student speaks wake/greeting to start anew
        if (isCompModalOpen && (intent.type === 'WAKE_WORD' || intent.type === 'GREET')) {
            this.resetForNextStudent();
            return;
        }

        // Notify Quest Manager of command invocation
        if (this.questManager) {
            this.questManager.checkCommand(intent, 'start');
        }

        switch (intent.type) {
            case 'WAKE_WORD':
                this.robot.setExpression('surprised');
                if (window.soundManager) window.soundManager.play('button');
                this.handleRobotResponse(intent.reply, () => {
                    this.robot.wave();
                });
                break;

            case 'MOVE':
                this.executeMoveCommand(intent);
                break;

            case 'LIGHT_ON':
                this.executeLightCommand(true, intent.reply);
                break;

            case 'LIGHT_OFF':
                this.executeLightCommand(false, intent.reply);
                break;

            case 'GREET':
                this.isProcessingCommand = true;
                this.handleRobotResponse(intent.reply, () => {
                    this.robot.wave(() => {
                        this.isProcessingCommand = false;
                    });
                });
                break;

            case 'DANCE':
                this.isProcessingCommand = true;
                this.handleRobotResponse(intent.reply, () => {
                    this.robot.dance(() => {
                        this.isProcessingCommand = false;
                    });
                });
                break;

            case 'RESET':
                this.executeResetCommand(intent.reply);
                break;

            case 'COME':
                this.isProcessingCommand = true;
                this.handleRobotResponse(intent.reply, () => {
                    this.robot.moveTo(new THREE.Vector3(0, 0, 3.0), () => {
                        this.robot.wave(() => {
                            this.isProcessingCommand = false;
                        });
                    });
                });
                break;

            case 'PRAISE':
                this.isProcessingCommand = true;
                this.handleRobotResponse(intent.reply, () => {
                    this.robot.cheer(() => {
                        this.isProcessingCommand = false;
                    });
                });
                break;

            case 'INTRO':
            case 'NEED_ITEM':
            case 'UNKNOWN':
            default:
                if (window.soundManager && intent.type === 'UNKNOWN') {
                    window.soundManager.play('confused');
                    this.robot.setExpression('surprised');
                }
                this.handleRobotResponse(intent.reply);
                break;
        }
    }

    executeMoveCommand(intent) {
        const itemObj = this.world.items[intent.item];
        const destSlot = this.world.slots[intent.destination];

        if (!itemObj) {
            this.handleRobotResponse('방에서 그 물건을 못 찾았어요.');
            return;
        }
        if (!destSlot) {
            this.handleRobotResponse('그 위치로는 옮길 수 없어요.');
            return;
        }

        // Already at that slot?
        if (itemObj.currentSlot === intent.destination) {
            const itemTopic = window.josa ? window.josa(itemObj.name, '은/는') : `${itemObj.name}은`;
            this.handleRobotResponse(`${itemTopic} 이미 ${destSlot.name}에 있어요!`);
            this.robot.setExpression('happy');
            if (this.questManager) {
                this.questManager.checkCommand(intent, 'already');
            }
            return;
        }

        this.isProcessingCommand = true;
        this.updateRobotBadge(`작업 중: ${itemObj.name} ➔ ${destSlot.name}`);

        // Wait until robot speech finishes before physically moving
        this.handleRobotResponse(intent.reply, () => {
            this.robot.carryItemTo(intent.item, intent.destination, (success) => {
                this.isProcessingCommand = false;
                this.updateRobotBadge('🟢 항상 대기 중 (말씀하세요)');
                if (success) {
                    const itemObjJosa = window.josa ? window.josa(itemObj.name, '을/를') : `${itemObj.name}을`;
                    const destSlotJosa = window.josa ? window.josa(destSlot.name, '으로/로') : `${destSlot.name}으로`;
                    const isPutOn = intent.destination === 'box';
                    const isPutIn = intent.destination === 'basket';
                    const actionDone = isPutOn ? '올렸어요!' : (isPutIn ? '넣었어요!' : '옮겼어요!');
                    const locText = isPutOn ? '상자 위에' : (isPutIn ? '바구니에' : destSlotJosa);
                    const completeMsg = `${itemObjJosa} ${locText} ${actionDone}`;
                    this.handleRobotResponse(completeMsg);

                    // Notify Quest Manager that item move succeeded!
                    if (this.questManager) {
                        this.questManager.checkCommand(intent, 'done');
                    }
                }
            });
        });
    }

    executeLightCommand(isOn, replyMsg) {
        this.isProcessingCommand = true;
        // Wait until speech finishes before switching lamp and cheering
        this.handleRobotResponse(replyMsg, () => {
            if (window.soundManager) window.soundManager.play('lightSwitch');
            this.world.setLamp(isOn);
            this.robot.cheer(() => {
                this.isProcessingCommand = false;
            });
        });
    }

    executeResetCommand(replyMsg) {
        this.isProcessingCommand = true;
        this.updateRobotBadge('방 정리 중...');
        // Wait until speech finishes before starting room cleanup
        this.handleRobotResponse(replyMsg, () => {

        const resetItem = (keys, index = 0) => {
            if (index >= keys.length) {
                this.robot.moveTo(new THREE.Vector3(0, 0, 0), () => {
                    this.robot.cheer(() => {
                        this.isProcessingCommand = false;
                        this.updateRobotBadge('🟢 항상 대기 중 (말씀하세요)');
                        this.handleRobotResponse('모두 제자리에 정리했어요!');
                    });
                });
                return;
            }

            const k = keys[index];
            const item = this.world.items[k];
            if (item.currentSlot !== item.defaultSlot) {
                this.robot.carryItemTo(k, item.defaultSlot, () => {
                    resetItem(keys, index + 1);
                });
            } else {
                resetItem(keys, index + 1);
            }
        };

        const itemKeys = Object.keys(this.world.items);
        resetItem(itemKeys, 0);
        });
    }

    handleRobotResponse(text, onComplete = null) {
        const robotSubtitle = document.getElementById('robot-subtitle');
        if (robotSubtitle) {
            robotSubtitle.textContent = text;
            robotSubtitle.classList.add('active');
        }

        // Play audio and invoke onComplete once the robot finishes speaking
        window.speechController.speak(text, () => {
            if (onComplete) onComplete();
        });
    }

    updateRobotBadge(statusText) {
        const badge = document.getElementById('robot-status-badge');
        if (badge) badge.textContent = statusText;
    }

    showNotification(msg, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = msg;
        toast.className = `toast show ${type}`;

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    /**
     * Triggered when all 4 quests are completed
     */
    handleAllQuestsCompleted() {
        this.handleRobotResponse('와아 대단해요! 모든 퀘스트를 성공했어요! 친구는 멋진 AI 로봇 마스터예요!', () => {
            if (window.soundManager) window.soundManager.playFanfare();
            if (this.world && this.robot) {
                this.world.spawnConfetti(this.robot.mesh.position, 60);
            }
            if (this.robot) this.robot.cheer();
            this.showNotification('🏆 모든 퀘스트 완료! 배리어프리 AI 수료증이 발급되었습니다!', 'success');

            setTimeout(() => {
                const modal = document.getElementById('completion-modal');
                if (modal) modal.classList.add('open');
            }, 600);
        });
    }

    /**
     * Manual or Voice triggered Experience Completion
     */
    completeExperience() {
        if (window.soundManager) window.soundManager.playFanfare();
        if (this.world && this.robot) {
            this.world.spawnConfetti(this.robot.mesh.position, 40);
        }
        this.robot.cheer();
        this.handleRobotResponse('오늘 체험을 멋지게 마쳤어요! 다음 친구를 맞이할 준비를 할게요!');
        this.showNotification('🏁 체험이 종료되었습니다. 다음 학생을 맞이해 주세요.', 'info');

        const modal = document.getElementById('completion-modal');
        if (modal) modal.classList.add('open');
    }

    /**
     * Reset the room and state for the next student without refreshing browser
     * or losing microphone permissions!
     */
    resetForNextStudent() {
        const modal = document.getElementById('completion-modal');
        if (modal) modal.classList.remove('open');

        // Reset 3D Room objects to default slots
        if (this.world) this.world.resetToDefaults();

        // Reset Robot to center position and neutral happy state
        if (this.robot) this.robot.resetPosition();

        // Reset Quests checklist
        if (this.questManager) this.questManager.reset();

        // Reset subtitles
        const userSubtitle = document.getElementById('user-subtitle');
        if (userSubtitle) {
            userSubtitle.textContent = '"마이크가 켜져 있어요. 말해보세요!"';
        }

        this.isProcessingCommand = false;
        this.updateRobotBadge('🟢 항상 대기 중 (말씀하세요)');

        if (window.soundManager) window.soundManager.play('success');
        this.showNotification('🎉 다음 친구 체험 준비 완료! 마이크가 상시 켜져 있으니 바로 말씀하세요.', 'success');

        // Cheerful welcome for the new student
        setTimeout(() => {
            this.handleRobotResponse('새로운 친구 안녕! 난 도우미 로봇이야! 손을 등 뒤로 하고 나를 "로봇아!" 하고 불러봐!', () => {
                if (this.robot) this.robot.wave();
            });
        }, 600);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.robot) this.robot.update(delta);
        if (this.world) {
            this.world.update(delta);
            this.world.render();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new VoiceRobotApp();
});
