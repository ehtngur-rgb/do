/**
 * Typecast Voice Manager for Voice Buddy Robot
 * Specially designed for elementary school children!
 * 
 * Supports:
 * 1. Pre-generated Typecast Audio Cache (.mp3 in audio_cache/)
 * 2. Real-time Typecast API synthesis via backend proxy or direct fetch
 * 3. Fallback to child-friendly "Typecast-style Cute Robot" Web Speech TTS tuning
 */
class TypecastVoiceManager {
    constructor() {
        this.apiKey = localStorage.getItem('typecast_api_key') || '';
        this.selectedActor = localStorage.getItem('typecast_actor') || 'ttotto'; // ttotto, hodu, chaerin, alpha
        this.enabled = localStorage.getItem('typecast_enabled') !== 'false'; // default true
        this.currentAudio = null;

        // Elementary school children's favorite Typecast character profiles
        this.characters = {
            ttotto: {
                id: '60c1d6b9d885a6a570020d2a', // Cute & energetic child robot
                name: '또또 (귀여운 꼬마 로봇)',
                tag: '초등 저학년 최애!',
                sampleText: '안녕! 난 너의 손이 되어줄 꼬마 로봇 또또야!',
                ttsPitch: 1.28,
                ttsRate: 1.25
            },
            hodu: {
                id: '61a72d8a43f4125b03517c2f', // Playful cartoon kid
                name: '호두 (장난꾸러기 친구)',
                tag: '발랄하고 통통 튀는 목소리',
                sampleText: '와! 나랑 같이 방 안의 물건들을 옮겨보자!',
                ttsPitch: 1.22,
                ttsRate: 1.30
            },
            chaerin: {
                id: '5f92461971161d2d38be47b5', // Smart & kind child helper
                name: '채린 (다정한 도우미)',
                tag: '똑똑하고 상냥한 목소리',
                sampleText: '상자와 인형을 어디로 옮겨드릴까요?',
                ttsPitch: 1.18,
                ttsRate: 1.20
            },
            alpha: {
                id: '61ee6246f4812300b9576e8e', // Sci-fi AI Mini Bot
                name: '알파 (신비한 AI 로봇)',
                tag: '애니메이션 속 도우미 봇',
                sampleText: '음성 명령을 수신했습니다! 지금 바로 이동합니다!',
                ttsPitch: 1.32,
                ttsRate: 1.35
            }
        };

        // Standard dialogue keys mapped to cached mp3 filenames in audio_cache/
        this.dialogueMap = {
            '네! 준비됐어요. 말씀하세요!': 'wake',
            '안녕! 난 도우미 로봇이야. 반가워!': 'greet',
            '난 손이 불편한 친구들을 돕는 AI 도우미 로봇이야!': 'intro',
            '신나게 춤춰볼게요, 룰루랄라~!': 'dance',
            '고마워요! 저도 정말 기뻐요!': 'praise',
            '네! 방 불을 켤게요!': 'light_on',
            '네! 방 불을 끌게요. 굿나잇!': 'light_off',
            '네! 모든 물건을 제자리로 정리할게요!': 'clean',
            '모두 제자리에 정리했어요!': 'done_clean',
            '슝슝~ 바로 앞으로 갈게요!': 'come',
            '네! 상자를 책상으로 옮길게요!': 'box_desk',
            '네! 상자를 침대로 옮길게요!': 'box_bed',
            '네! 상자를 선반으로 옮길게요!': 'box_shelf',
            '네! 상자를 바닥으로 옮길게요!': 'box_floor',
            '네! 곰인형을 침대로 옮길게요!': 'bear_bed',
            '네! 곰인형을 책상으로 옮길게요!': 'bear_desk',
            '네! 곰인형을 상자 안으로 넣을게요!': 'bear_box',
            '네! 곰인형을 선반으로 옮길게요!': 'bear_shelf',
            '네! 책을 책상으로 옮길게요!': 'book_desk',
            '네! 책을 선반으로 옮길게요!': 'book_shelf',
            '상자를 책상으로 옮겼어요!': 'done_box_desk',
            '곰인형을 침대로 옮겼어요!': 'done_bear_bed',
            '곰인형을 상자 안으로 넣었어요!': 'done_bear_box',
            '책을 책상으로 옮겼어요!': 'done_book_desk'
        };
    }

    setApiKey(key) {
        this.apiKey = key.trim();
        localStorage.setItem('typecast_api_key', this.apiKey);
    }

    setActor(actorKey) {
        if (this.characters[actorKey]) {
            this.selectedActor = actorKey;
            localStorage.setItem('typecast_actor', actorKey);
        }
    }

    getCurrentActorInfo() {
        return this.characters[this.selectedActor] || this.characters.ttotto;
    }

    /**
     * Check if a local cached mp3 exists for this exact text
     */
    findCacheFile(text) {
        const key = this.dialogueMap[text.trim()];
        if (key) {
            return `audio_cache/${key}.mp3`;
        }
        return null;
    }

    /**
     * Play TTS via Typecast cache or API, fallback to fine-tuned Web Speech
     */
    async speak(text, onStart, onEnd) {
        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        const cachePath = this.findCacheFile(text);

        // 1. Check if cached audio file exists
        if (cachePath) {
            try {
                const audio = new Audio(cachePath);
                
                const playPromise = new Promise((resolve, reject) => {
                    audio.onplay = () => {
                        if (onStart) onStart();
                    };
                    audio.onended = () => {
                        this.currentAudio = null;
                        if (onEnd) onEnd();
                        resolve(true);
                    };
                    audio.onerror = () => {
                        reject(new Error('Audio cache file not found or failed to load'));
                    };
                });

                audio.play();
                this.currentAudio = audio;
                await playPromise;
                return;
            } catch (e) {
                // Cache file doesn't exist on disk yet, fall through to API or Web Speech
            }
        }

        // 2. If Typecast API Key is provided, call Typecast synthesis
        if (this.apiKey) {
            try {
                const audioUrl = await this.fetchTypecastAudio(text);
                if (audioUrl) {
                    const audio = new Audio(audioUrl);
                    if (onStart) onStart();
                    audio.onended = () => {
                        this.currentAudio = null;
                        if (onEnd) onEnd();
                    };
                    audio.play();
                    this.currentAudio = audio;
                    return;
                }
            } catch (err) {
                console.warn('Typecast API synthesis failed, falling back to tuned TTS:', err);
            }
        }

        // 3. Fallback: Typecast-style tuned Web Speech TTS
        this.fallbackWebSpeech(text, onStart, onEnd);
    }

    /**
     * Typecast API Request
     */
    async fetchTypecastAudio(text) {
        const actorInfo = this.getCurrentActorInfo();
        const response = await fetch('/api/typecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                actor_id: actorInfo.id,
                api_key: this.apiKey
            })
        });

        if (!response.ok) {
            throw new Error(`Typecast API error: ${response.status}`);
        }

        const data = await response.json();
        return data.audio_url || null;
    }

    /**
     * Web Speech Fallback tuned to sound like a cute animated kid robot
     */
    fallbackWebSpeech(text, onStart, onEnd) {
        const actorInfo = this.getCurrentActorInfo();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';

        // Select the most natural Korean voice available
        const voices = window.speechSynthesis.getVoices();
        const krVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('KR'));
        
        // Prefer natural female/child voice
        const preferredVoice = krVoices.find(v => 
            v.name.includes('Natural') || 
            v.name.includes('Online') || 
            v.name.includes('Heami') || 
            v.name.includes('Google')
        ) || krVoices[0] || null;

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Apply Character-specific Cute Tuning!
        utterance.pitch = actorInfo.ttsPitch;
        utterance.rate = actorInfo.ttsRate;

        utterance.onstart = () => {
            if (onStart) onStart();
        };

        utterance.onend = () => {
            setTimeout(() => {
                if (onEnd) onEnd();
            }, 100);
        };

        utterance.onerror = () => {
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
    }
}

window.typecastVoice = new TypecastVoiceManager();
