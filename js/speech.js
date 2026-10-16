/**
 * Speech Manager - STT (Speech to Text) and TTS (Text to Speech)
 * Featuring:
 * 1. 100% Consistent Typecast Robot Voice (Robo) with Web Audio API Zero-Lag Playback
 * 2. Unlocked Dedicated Audio Player Element (Permanently eliminates Autoplay restrictions)
 * 3. Smart Utterance Buffer & Non-Chopping STT Engine (Understands kids seamlessly)
 * 4. Multi-part Debouncing for Pauses and Natural Speech Patterns
 * 5. Full 56-phrase Audio Cache with Intelligent Semantic Fallback Resolver
 */
class SpeechController {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis || null;
        this.isListening = false;
        this.isSpeaking = false;
        this.isSupported = false;
        this.koreanVoice = null;

        // Dedicated DOM audio element
        this.audioPlayer = null;
        this.audioBufferCache = {}; // Pre-decoded Web Audio buffers for instant 0ms playback
        this.currentBufferSource = null;
        this.currentAudio = null;

        // Speech buffer & Debouncing for natural child speech
        this.speechBuffer = '';
        this.evalTimer = null;
        this.lastSpokenText = '';
        this.lastSpeakEndTime = 0;

        // Speed multiplier setting
        this.speedMultiplier = 1.0;
        this.speechRate = 1.30;
        this.speechPitch = 1.45; // Default: cheerful kid robot tone

        // Dedicated Single Voice: Robo (로보)
        this.characters = {
            'robot_robo': {
                id: 'robot_robo',
                typecastId: 'tc_61377fdaa23e3c47ccf5e93e',
                name: '로보 (Robo)',
                desc: '도우미 AI 꼬마 로봇',
                icon: '🤖',
                pitch: 1.48,
                rate: 1.32,
                voiceGender: 'robot_cute',
                beepFreq: 880,
                audioSample: 'audio_cache/intro.mp3',
                sampleText: '안녕하세요! 저는 여러분의 도우미 로봇 로보에요! 손을 쓰지 않고 목소리로 저에게 명령을 내려보세요!'
            }
        };

        // Complete Audio Cache Map for 100% Consistent Robot Voice
        this.audioFileMap = {
            // 1. Initial Intro & Greeting
            '안녕하세요! 저는 여러분의 도우미 로봇 로보에요! 손을 쓰지 않고 목소리로 저에게 명령을 내려보세요!': 'intro',
            '안녕하세요! 저는 여러분의 도우미 로봇 로보예요! 손을 쓰지 않고 목소리로 저에게 명령을 내려보세요!': 'intro',
            '난 손이 불편한 친구들을 돕는 AI 도우미 로봇이야!': 'intro_short',
            '안녕! 난 도우미 로봇이야. 반가워!': 'greet',
            '네! 준비됐어요. 말씀하세요!': 'wake',
            '새로운 친구 안녕! 난 도우미 로봇이야! 손을 등 뒤로 하고 나를 "로봇아!" 하고 불러봐!': 'next_student',
            '새로운 친구 안녕! 난 도우미 로봇이야! 손을 등 뒤로 하고 나를 로봇아 하고 불러봐!': 'next_student',

            // 2. Box commands
            '네! 상자를 책상으로 옮길게요!': 'box_desk',
            '상자를 책상으로 옮겼어요!': 'done_box_desk',
            '네! 상자를 침대로 옮길게요!': 'box_bed',
            '상자를 침대로 옮겼어요!': 'done_box_bed',
            '네! 상자를 선반으로 옮길게요!': 'box_shelf',
            '상자를 선반으로 옮겼어요!': 'done_box_shelf',
            '네! 상자를 바닥으로 옮길게요!': 'box_floor',
            '상자를 바닥으로 옮겼어요!': 'done_box_floor',

            // 3. Bear commands
            '네! 곰인형을 상자 위로 올릴게요!': 'bear_box',
            '곰인형을 상자 위에 올렸어요!': 'done_bear_box',
            '네! 곰인형을 침대로 옮길게요!': 'bear_bed',
            '곰인형을 침대로 옮겼어요!': 'done_bear_bed',
            '네! 곰인형을 책상으로 옮길게요!': 'bear_desk',
            '곰인형을 책상으로 옮겼어요!': 'done_bear_desk',
            '네! 곰인형을 선반으로 옮길게요!': 'bear_shelf',
            '곰인형을 선반으로 옮겼어요!': 'done_bear_shelf',

            // 4. Ball commands
            '네! 공을 침대로 옮길게요!': 'ball_bed',
            '공을 침대로 옮겼어요!': 'done_ball_bed',
            '네! 공을 책상으로 옮길게요!': 'ball_desk',
            '공을 책상으로 옮겼어요!': 'done_ball_desk',
            '네! 공을 바구니에 넣을게요!': 'ball_basket',
            '공을 바구니에 넣었어요!': 'done_ball_basket',
            '네! 공을 선반으로 옮길게요!': 'ball_shelf',
            '공을 선반으로 옮겼어요!': 'done_ball_shelf',

            // 5. Book commands
            '네! 책을 선반으로 옮길게요!': 'book_shelf',
            '책을 선반으로 옮겼어요!': 'done_book_shelf',
            '네! 책을 책상으로 옮길게요!': 'book_desk',
            '책을 책상으로 옮겼어요!': 'done_book_desk',
            '네! 책을 침대로 옮길게요!': 'book_bed',
            '책을 침대로 옮겼어요!': 'done_book_bed',

            // 6. Action & Fun
            '네! 방 불을 켤게요!': 'light_on',
            '네! 방 불을 끌게요. 굿나잇!': 'light_off',
            '신나게 춤춰볼게요, 룰루랄라~!': 'dance',
            '고마워요! 저도 정말 기뻐요!': 'praise',
            '네! 모든 물건을 제자리로 정리할게요!': 'clean',
            '모두 제자리에 정리했어요!': 'done_clean',
            '슝슝~ 바로 앞으로 갈게요!': 'come',

            // 7. Already at location
            '상자는 이미 책상에 있어요!': 'already_box_desk',
            '곰인형은 이미 상자 위에 있어요!': 'already_bear_box',
            '공은 이미 침대에 있어요!': 'already_ball_bed',
            '책은 이미 선반에 있어요!': 'already_book_shelf',

            // 8. Quest completion & Finish
            '와아 대단해요! 모든 퀘스트를 성공했어요! 친구는 멋진 AI 로봇 마스터예요!': 'all_quests_done',
            '오늘 체험을 멋지게 마쳤어요! 다음 친구를 맞이할 준비를 할게요!': 'finish_exp',

            // 9. Feedback & Guidance
            '잘 못 알아들었어요. 다시 한 번 말씀해 주시겠어요?': 'unknown',
            '잘 못 들었어요. "상자를 책상으로 옮겨줘"라고 해보세요!': 'unknown_hint',
            '잘 못 들었어요. 상자를 책상으로 옮겨줘라고 해보세요!': 'unknown_hint',
            '네! 상자나 인형을 어디로 옮겨줄까요?': 'unknown_where',
            '어떤 물건을 옮길까요? 상자, 곰인형, 공, 책 중에 말씀해 주세요!': 'need_item',
            '어디로 옮길까요? 책상, 침대, 선반 중에 말씀해 주세요!': 'need_dest',
            '속도를 변경했어요!': 'speed_change',
            '방에서 그 물건을 못 찾았어요.': 'not_found_item',
            '그 위치로는 옮길 수 없어요.': 'cannot_move_slot'
        };

        this.typecastVoice = 'robot_robo';
        this.speechToken = 0;
        this.speakTimeout = null;

        // Hands-Free & Speech State
        this.volumeAnimId = null;
        this.isUserSpeaking = false;
        this.shouldKeepListening = true;
        this.isStarting = false;
        this.restartTimer = null;

        // Callbacks
        this.onInterimResult = null;   // (text) => {}
        this.onFinalResult = null;     // (text) => {}
        this.onListenStateChange = null; // (boolean) => {}
        this.onVolumeLevel = null;     // (level 0~100) => {}
        this.onSpeakStart = null;      // () => {}
        this.onSpeakEnd = null;        // () => {}
        this.onError = null;           // (err, code) => {}

        this.initTTS();
        this.initSTT();

        // Bind DOM elements on load
        window.addEventListener('DOMContentLoaded', () => {
            this.audioPlayer = document.getElementById('robot-audio-player');
        });
    }

    /**
     * Unlocks audio player & Web Audio API on the very first user click/touch
     */
    unlockAudio() {
        if (!this.audioPlayer) {
            this.audioPlayer = document.getElementById('robot-audio-player');
        }

        // 1. Ensure SoundManager is initialized and context resumed
        if (window.soundManager) {
            window.soundManager.init();
            if (window.soundManager.ctx) {
                if (window.soundManager.ctx.state === 'suspended') {
                    window.soundManager.ctx.resume().catch(() => {});
                }
                // Play silent frame to fully unlock Web Audio API on iOS Safari / Android Chrome
                try {
                    const ctx = window.soundManager.ctx;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    gain.gain.value = 0;
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(0);
                    osc.stop(ctx.currentTime + 0.001);
                } catch (e) {}
            }
        }

        // 2. Silent unlock of DOM Audio element
        if (this.audioPlayer) {
            try {
                this.audioPlayer.play().then(() => {
                    this.audioPlayer.pause();
                }).catch(() => {});
            } catch (e) {}
        }

        // 3. Preload core and all robot voice audio files in the background
        this.preloadAudioCache();
    }

    /**
     * Asynchronously preloads all MP3 files into memory/buffers for instant playback
     */
    async preloadAudioCache() {
        const priorityKeys = [
            'intro', 'intro_short', 'greet', 'wake', 'next_student',
            'box_desk', 'done_box_desk', 'bear_box', 'done_bear_box',
            'ball_bed', 'done_ball_bed', 'clean', 'done_clean', 'dance', 'praise'
        ];
        const allKeys = Array.from(new Set(Object.values(this.audioFileMap)));
        const sortedKeys = Array.from(new Set([...priorityKeys, ...allKeys]));
        const ctx = window.soundManager ? window.soundManager.ctx : null;

        for (const key of sortedKeys) {
            const url = `audio_cache/${key}.mp3`;
            if (this.audioBufferCache[key]) continue;

            fetch(url)
                .then(r => {
                    if (!r.ok) return null;
                    return r.arrayBuffer();
                })
                .then(arrayBuf => {
                    if (arrayBuf && ctx) {
                        ctx.decodeAudioData(arrayBuf, (decoded) => {
                            this.audioBufferCache[key] = decoded;
                        }, () => {});
                    }
                })
                .catch(() => {});
        }
    }

    setVoice(voiceId = 'robot_robo') {
        this.typecastVoice = 'robot_robo';
        this.applyCharacterSettings();
    }

    applyCharacterSettings() {
        const char = this.characters['robot_robo'];
        if (!char) return;

        this.speechPitch = char.pitch || 1.48;
        this.speechRate = (char.rate || 1.32) * (this.speedMultiplier || 1.0);

        if (!this.synthesis || !this.koreanVoices || this.koreanVoices.length === 0) return;
        this.koreanVoice = this.koreanVoices[0];
    }

    getVoiceInfo() {
        return this.characters['robot_robo'];
    }

    /**
     * Smooth Volume Simulation based on STT events (eliminates getUserMedia / Call Volume issues)
     */
    startVolumeSimulation(isIdle = true) {
        if (this.volumeAnimId) cancelAnimationFrame(this.volumeAnimId);
        let step = 0;
        const animate = () => {
            if (!this.isListening) {
                if (this.onVolumeLevel) this.onVolumeLevel(0);
                return;
            }
            step += 0.15;
            let lvl = 0;
            if (this.isUserSpeaking) {
                // Natural speech fluctuations: 40% ~ 85%
                lvl = 45 + Math.sin(step * 3.1) * 20 + Math.sin(step * 7.3) * 15;
            } else {
                // Gentle resting pulse: 6% ~ 14% to indicate live mic
                lvl = 10 + Math.sin(step) * 4;
            }
            if (this.onVolumeLevel) {
                this.onVolumeLevel(Math.round(lvl));
            }
            this.volumeAnimId = requestAnimationFrame(animate);
        };
        this.volumeAnimId = requestAnimationFrame(animate);
    }

    stopVolumeSimulation() {
        if (this.volumeAnimId) {
            cancelAnimationFrame(this.volumeAnimId);
            this.volumeAnimId = null;
        }
        if (this.onVolumeLevel) {
            this.onVolumeLevel(0);
        }
    }

    /**
     * Eliminates consecutive duplicate words or multi-word repeated phrases
     * e.g. "상자를 상자를 상자를" -> "상자를"
     */
    deduplicateWords(text) {
        if (!text) return '';
        const cleaned = text.trim().replace(/\s+/g, ' ');
        if (!cleaned) return '';

        // 1. Single-word consecutive duplicate removal
        const tokens = cleaned.split(' ');
        const resultTokens = [];
        for (let i = 0; i < tokens.length; i++) {
            if (resultTokens.length === 0 || resultTokens[resultTokens.length - 1] !== tokens[i]) {
                resultTokens.push(tokens[i]);
            }
        }
        let deduped = resultTokens.join(' ');

        // 2. 2-gram phrase duplicate removal (e.g. "상자 위에 상자 위에" -> "상자 위에")
        const words = deduped.split(' ');
        if (words.length >= 4) {
            const out = [];
            let i = 0;
            while (i < words.length) {
                if (i + 3 < words.length && 
                    words[i] === words[i + 2] && 
                    words[i + 1] === words[i + 3]) {
                    out.push(words[i], words[i + 1]);
                    i += 4;
                } else {
                    out.push(words[i]);
                    i++;
                }
            }
            deduped = out.join(' ');
        }

        return deduped;
    }

    /**
     * Initialize Web Speech API STT with Smart Non-Chopping Utterance Aggregation
     */
    initSTT() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser.');
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ko-KR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.isStarting = false;
            this.startVolumeSimulation(true);
            if (this.onListenStateChange) this.onListenStateChange(true);
        };

        this.recognition.onspeechstart = () => {
            this.isUserSpeaking = true;
        };

        this.recognition.onspeechend = () => {
            this.isUserSpeaking = false;
        };

        this.recognition.onresult = (event) => {
            this.isUserSpeaking = true;
            // Discard recognition while robot is speaking or immediately after (prevent self-echo)
            if (this.isSpeaking || (Date.now() - this.lastSpeakEndTime < 500)) {
                return;
            }

            let fullFinalText = '';
            let interimText = '';
            let hasFinal = false;

            for (let i = 0; i < event.results.length; ++i) {
                const res = event.results[i];
                const transcript = res[0].transcript;
                if (res.isFinal) {
                    fullFinalText += ' ' + transcript;
                    hasFinal = true;
                } else {
                    interimText += ' ' + transcript;
                }
            }

            // Build full candidate directly from current session results (never accumulates indefinitely)
            let currentCandidate = (fullFinalText + ' ' + interimText).trim();
            currentCandidate = this.deduplicateWords(currentCandidate);

            if (currentCandidate && this.onInterimResult) {
                this.onInterimResult(currentCandidate);
            }

            // Smart evaluate candidate text without prematurely failing on pauses
            this.evaluateSpeechInput(currentCandidate, hasFinal);
        };

        this.recognition.onerror = (event) => {
            this.isStarting = false;
            if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'audio-capture') {
                return;
            }

            if (event.error === 'not-allowed') {
                this.isListening = false;
                this.shouldKeepListening = false;
                this.stopVolumeSimulation();
                if (this.onListenStateChange) this.onListenStateChange(false);
                if (this.onError) {
                    this.onError('마이크 권한이 허용되지 않았습니다. 브라우저 주소창 왼쪽의 자물쇠 또는 설정 아이콘을 눌러 마이크를 "허용"해 주세요.');
                }
                return;
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.isStarting = false;
            this.isUserSpeaking = false;
            this.stopVolumeSimulation();
            if (this.onListenStateChange) this.onListenStateChange(false);

            if (this.shouldKeepListening) {
                clearTimeout(this.restartTimer);
                // If robot is currently speaking, wait until speak ends
                if (this.isSpeaking) {
                    return;
                }
                this.restartTimer = setTimeout(() => {
                    this.startListening();
                }, 250);
            }
        };
    }

    /**
     * Smart Speech Evaluator
     * Waits until the user FINISHES speaking their full command before acting!
     * Never interrupts in the middle of sentences like "상자를 책상..." or "인형을 상자..."
     */
    evaluateSpeechInput(candidateText, hasFinalChunk) {
        if (!candidateText || this.isSpeaking) return;

        const intent = window.nluParser ? window.nluParser.parse(candidateText) : null;
        if (!intent) return;

        // Actionable intents (MOVE, LIGHT, DANCE, etc.)
        const isActionable = [
            'MOVE', 'LIGHT_ON', 'LIGHT_OFF', 'DANCE', 'RESET', 
            'COME', 'PRAISE', 'FINISH_EXPERIENCE', 'GREET'
        ].includes(intent.type);

        if (isActionable) {
            // Case 1: Complete command with an explicit ending verb
            // (e.g. "상자를 책상으로 옮겨줘", "인형을 상자에 올려줘", "불 켜줘", "신나게 춤춰줘")
            if (intent.hasEndingVerb) {
                clearTimeout(this.evalTimer);
                // When browser speech engine finalized the utterance chunk, wait 280ms
                // If interim, wait 450ms of quiet pause after speaking the verb
                const waitTime = hasFinalChunk ? 280 : 450;
                this.evalTimer = setTimeout(() => {
                    this.commitCommand(candidateText);
                }, waitTime);
                return;
            }

            // Case 2: Partial noun-only command WITHOUT an ending verb
            // (e.g. "상자를 책상...", "인형을 상자...", "공을 침대...")
            // The student is in the middle of speaking! NEVER cut them off!
            clearTimeout(this.evalTimer);
            if (hasFinalChunk) {
                // Only if the student completely stopped speaking and stayed silent for a full 1.2s:
                this.evalTimer = setTimeout(() => {
                    this.commitCommand(candidateText);
                }, 1200);
            }
            // If still interim, DO NOT schedule premature execution! Wait for the verb!
            return;
        }

        // Case 3: Wake Word ("로보야!", "로봇아!")
        if (intent.type === 'WAKE_WORD') {
            clearTimeout(this.evalTimer);
            // Wait 800ms to allow multi-part phrases ("로봇아! (pause) 상자 책상에 옮겨줘")
            this.evalTimer = setTimeout(() => {
                this.commitCommand(candidateText);
            }, 800);
            return;
        }

        // Case 4: Incomplete / Ambiguous / Unknown speech
        clearTimeout(this.evalTimer);
        if (hasFinalChunk) {
            this.evalTimer = setTimeout(() => {
                this.commitCommand(candidateText);
            }, 1200);
        }
    }

    /**
     * Finalizes and dispatches recognized command
     */
    commitCommand(text) {
        if (!text || this.isSpeaking) return;
        clearTimeout(this.evalTimer);
        this.evalTimer = null;

        const finalCommand = this.deduplicateWords(text).trim();

        // Stop current recognition session so robot's own voice isn't captured
        // and next student command starts with completely fresh event.results
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }

        if (this.onFinalResult && finalCommand) {
            this.onFinalResult(finalCommand);
        }
    }

    initTTS() {
        if (!this.synthesis) return;

        const loadVoices = () => {
            const voices = this.synthesis.getVoices();
            this.koreanVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('KR'));
            this.applyCharacterSettings(this.typecastVoice);
        };

        loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }

    setSpeed(speedVal) {
        this.speedMultiplier = Math.max(0.7, Math.min(2.0, speedVal));
        this.applyCharacterSettings(this.typecastVoice);
    }

    async startListening() {
        if (!this.isSupported) {
            if (this.onError) {
                this.onError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 이용해 주세요.');
            }
            return false;
        }

        this.shouldKeepListening = true;

        if (this.isListening || this.isStarting || this.isSpeaking) {
            return true;
        }

        this.isStarting = true;

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            this.isStarting = false;
            if (e.name === 'InvalidStateError') {
                this.isListening = true;
                return true;
            }
            return false;
        }
    }

    stopListening() {
        this.shouldKeepListening = false;
        this.isStarting = false;
        this.isUserSpeaking = false;
        this.stopVolumeSimulation();
        clearTimeout(this.restartTimer);
        clearTimeout(this.evalTimer);

        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
    }

    pauseForBackground() {
        clearTimeout(this.restartTimer);
        clearTimeout(this.evalTimer);
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (e) {}
        }
        this.isListening = false;
        this.isStarting = false;
        this.isUserSpeaking = false;
        this.stopVolumeSimulation();
        if (this.onListenStateChange) this.onListenStateChange(false);
    }

    resumeFromBackground() {
        this.shouldKeepListening = true;
        this.isStarting = false;
        clearTimeout(this.restartTimer);

        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (e) {}
        }

        // Wait 300ms for hardware audio driver to re-bind on screen wake
        setTimeout(() => {
            if (this.shouldKeepListening && !this.isListening && !this.isSpeaking) {
                this.startListening();
            }
        }, 300);
    }

    toggleListening() {
        if (this.shouldKeepListening && this.isListening) {
            this.stopListening();
            return false;
        } else {
            return this.startListening();
        }
    }

    stopSpeaking() {
        this.speechToken = (this.speechToken || 0) + 1;
        this.speechBuffer = '';
        clearTimeout(this.evalTimer);

        if (this.currentBufferSource) {
            try {
                this.currentBufferSource.onended = null;
                this.currentBufferSource.stop();
                this.currentBufferSource.disconnect();
            } catch (e) {}
            this.currentBufferSource = null;
        }

        if (this.currentAudio) {
            try {
                this.currentAudio.onended = null;
                this.currentAudio.onerror = null;
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } catch (e) {}
            this.currentAudio = null;
        }

        if (this.audioPlayer) {
            try {
                this.audioPlayer.onended = null;
                this.audioPlayer.onerror = null;
                this.audioPlayer.pause();
                this.audioPlayer.currentTime = 0;
            } catch (e) {}
        }

        if (this.synthesis) {
            try {
                this.synthesis.cancel();
            } catch (e) {}
        }

        if (this.speakTimeout) {
            clearTimeout(this.speakTimeout);
            this.speakTimeout = null;
        }

        if (this.isSpeaking) {
            this.isSpeaking = false;
            this.lastSpeakEndTime = Date.now();
            if (this.onSpeakEnd) this.onSpeakEnd();
        }
    }

    /**
     * Comprehensive Semantic & Keyword Resolver
     * Ensures EVERY response maps 100% to a studio Typecast robot voice file!
     */
    resolveCacheKey(text) {
        if (!text) return null;
        const trimmed = text.trim();

        // 1. Direct match
        if (this.audioFileMap[trimmed]) {
            return this.audioFileMap[trimmed];
        }

        // 2. Normalized match (strip punctuation, whitespace, quotes)
        const clean = (s) => s.replace(/[\s.,?!~"'“”]/g, '');
        const targetClean = clean(trimmed);

        for (const [key, val] of Object.entries(this.audioFileMap)) {
            if (clean(key) === targetClean) {
                return val;
            }
        }

        // 3. Item & Location Movements
        const hasBox = targetClean.includes('상자') || targetClean.includes('박스');
        const hasBear = targetClean.includes('인형') || targetClean.includes('곰인형') || targetClean.includes('곰돌이');
        const hasBall = targetClean.includes('공') || targetClean.includes('축구공');
        const hasBook = targetClean.includes('책') && !targetClean.includes('책상') && !targetClean.includes('책장');

        const hasDesk = targetClean.includes('책상') || targetClean.includes('테이블');
        const hasBed = targetClean.includes('침대');
        const hasShelf = targetClean.includes('선반') || targetClean.includes('책장');
        const hasFloor = targetClean.includes('바닥');
        const hasBasket = targetClean.includes('바구니');

        const isDone = targetClean.includes('옮겼') || targetClean.includes('올렸') || targetClean.includes('넣었');

        // Box
        if (hasBox && hasDesk) return isDone ? 'done_box_desk' : 'box_desk';
        if (hasBox && hasBed) return isDone ? 'done_box_bed' : 'box_bed';
        if (hasBox && hasShelf) return isDone ? 'done_box_shelf' : 'box_shelf';
        if (hasBox && hasFloor) return isDone ? 'done_box_floor' : 'box_floor';

        // Bear
        if (hasBear && (hasBox || targetClean.includes('상자위'))) return isDone ? 'done_bear_box' : 'bear_box';
        if (hasBear && hasBed) return isDone ? 'done_bear_bed' : 'bear_bed';
        if (hasBear && hasDesk) return isDone ? 'done_bear_desk' : 'bear_desk';
        if (hasBear && hasShelf) return isDone ? 'done_bear_shelf' : 'bear_shelf';

        // Ball
        if (hasBall && hasBed) return isDone ? 'done_ball_bed' : 'ball_bed';
        if (hasBall && hasDesk) return isDone ? 'done_ball_desk' : 'ball_desk';
        if (hasBall && hasBasket) return isDone ? 'done_ball_basket' : 'ball_basket';
        if (hasBall && hasShelf) return isDone ? 'done_ball_shelf' : 'ball_shelf';

        // Book
        if (hasBook && hasShelf) return isDone ? 'done_book_shelf' : 'book_shelf';
        if (hasBook && hasDesk) return isDone ? 'done_book_desk' : 'book_desk';
        if (hasBook && hasBed) return isDone ? 'done_book_bed' : 'book_bed';

        // Already at location
        if (targetClean.includes('이미')) {
            if (hasDesk) return 'already_box_desk';
            if (hasBox) return 'already_bear_box';
            if (hasBed) return 'already_ball_bed';
            if (hasShelf) return 'already_book_shelf';
        }

        // System & Quest events
        if (targetClean.includes('대단해요') || targetClean.includes('모든퀘스트') || targetClean.includes('로봇마스터')) return 'all_quests_done';
        if (targetClean.includes('체험을멋지게') || targetClean.includes('오늘체험') || targetClean.includes('다음친구를맞이')) return 'finish_exp';
        if (targetClean.includes('새로운친구') || (targetClean.includes('친구') && targetClean.includes('로봇아'))) return 'next_student';
        if (targetClean.includes('모두제자리') || targetClean.includes('제자리로정리') || targetClean.includes('정리했어')) return 'done_clean';
        if (targetClean.includes('정리할게') || targetClean.includes('제자리로정리')) return 'clean';
        if (targetClean.includes('불을켤') || targetClean.includes('불켤') || targetClean.includes('방불을켤')) return 'light_on';
        if (targetClean.includes('불을끌') || targetClean.includes('불끌') || targetClean.includes('굿나잇')) return 'light_off';
        if (targetClean.includes('춤춰') || targetClean.includes('룰루랄라')) return 'dance';
        if (targetClean.includes('고마워') || targetClean.includes('정말기뻐')) return 'praise';
        if (targetClean.includes('앞으로갈') || targetClean.includes('슝슝')) return 'come';
        if (targetClean.includes('준비됐') || targetClean.includes('말씀하세')) return 'wake';
        if (targetClean.includes('반가워') || targetClean.includes('도우미로봇이야')) return 'greet';
        if (targetClean.includes('도우미로봇로보') || targetClean.includes('명령을내려보')) return 'intro';
        if (targetClean.includes('손이불편한친구')) return 'intro_short';

        if (targetClean.includes('어떤물건')) return 'need_item';
        if (targetClean.includes('어디로옮길')) return 'need_dest';
        if (targetClean.includes('어디로옮겨줄')) return 'unknown_where';
        if (targetClean.includes('못찾았')) return 'not_found_item';
        if (targetClean.includes('옮길수없어')) return 'cannot_move_slot';
        if (targetClean.includes('못들었') || targetClean.includes('못알아') || targetClean.includes('다시한번')) return 'unknown_hint';

        return null;
    }

    /**
     * Primary Speech Output Function
     * Plays authentic Typecast robot voice from audio cache with 100% consistency.
     */
    async speak(text, onComplete = null) {
        this.stopSpeaking();
        const token = this.speechToken;

        // Electronic robot chirp on speak start
        const char = this.getVoiceInfo();
        if (window.soundManager && char) {
            window.soundManager.playRobotChirp(char.beepFreq || 880);
        }

        const trimmed = (text || '').trim();
        const cacheKey = this.resolveCacheKey(trimmed);

        if (cacheKey) {
            const ok = await this.playAudioFile(`audio_cache/${cacheKey}.mp3`, onComplete);
            if (ok || this.speechToken !== token) return;
        }

        // Web Speech synthesis is ONLY used if an unmapped phrase is explicitly requested
        this.speakWebSpeech(trimmed, onComplete, token);
    }

    notifySpeakEnded() {
        this.isSpeaking = false;
        this.lastSpeakEndTime = Date.now();
        if (this.onSpeakEnd) this.onSpeakEnd();

        // Automatically resume speech recognition after robot speech finishes
        if (this.shouldKeepListening && !this.isListening && !this.isStarting) {
            clearTimeout(this.restartTimer);
            this.restartTimer = setTimeout(() => {
                this.startListening();
            }, 300);
        }
    }

    /**
     * Robust Audio Playback using Web Audio API buffer sources or unlocked DOM player
     */
    playAudioFile(src, onComplete = null) {
        this.stopSpeaking();
        const currentToken = this.speechToken;

        return new Promise(async (resolve) => {
            const cacheKeyMatch = src.match(/audio_cache\/(.+)\.mp3$/);
            const cacheKey = cacheKeyMatch ? cacheKeyMatch[1] : null;

            // Method 1: Web Audio API Buffer Playback (Zero-lag, 100% bypasses Autoplay blocks)
            const ctx = window.soundManager ? window.soundManager.ctx : null;
            if (ctx) {
                if (ctx.state === 'suspended') {
                    try { await ctx.resume(); } catch (e) {}
                }

                // If not in cache yet, fetch and decode immediately!
                if (cacheKey && !this.audioBufferCache[cacheKey]) {
                    try {
                        const resp = await fetch(src);
                        if (resp.ok) {
                            const arr = await resp.arrayBuffer();
                            const decoded = await new Promise((res, rej) => {
                                ctx.decodeAudioData(arr, res, rej);
                            });
                            this.audioBufferCache[cacheKey] = decoded;
                        }
                    } catch (e) {
                        console.warn('On-demand audio decode failed:', e);
                    }
                }

                if (cacheKey && this.audioBufferCache[cacheKey]) {
                    try {
                        const source = ctx.createBufferSource();
                        source.buffer = this.audioBufferCache[cacheKey];
                        source.playbackRate.value = 1.05 * (this.speedMultiplier || 1.0);
                        source.connect(ctx.destination);

                        this.currentBufferSource = source;
                        this.isSpeaking = true;
                        if (this.onSpeakStart) this.onSpeakStart();

                        source.onended = () => {
                            if (this.speechToken !== currentToken) {
                                resolve(false);
                                return;
                            }
                            this.currentBufferSource = null;
                            this.notifySpeakEnded();
                            if (onComplete) onComplete();
                            resolve(true);
                        };

                        source.start(0);
                        return;
                    } catch (e) {
                        console.warn('Web Audio buffer playback error, using audio player fallback:', e);
                    }
                }
            }

            // Method 2: Dedicated Unlocked Audio Element
            if (!this.audioPlayer) {
                this.audioPlayer = document.getElementById('robot-audio-player');
            }
            const player = this.audioPlayer || new Audio();
            player.src = src;
            player.playbackRate = 1.05 * (this.speedMultiplier || 1.0);
            this.currentAudio = player;
            this.isSpeaking = true;
            if (this.onSpeakStart) this.onSpeakStart();

            const cleanup = () => {
                player.onended = null;
                player.onerror = null;
                if (this.currentAudio === player) {
                    this.currentAudio = null;
                    this.notifySpeakEnded();
                }
            };

            player.onended = () => {
                if (this.speechToken !== currentToken) {
                    resolve(false);
                    return;
                }
                cleanup();
                if (onComplete) onComplete();
                resolve(true);
            };

            player.onerror = () => {
                cleanup();
                resolve(false);
            };

            player.play().catch(() => {
                cleanup();
                resolve(false);
            });
        });
    }

    /**
     * Fallback Web Speech Synthesis (Child robot tone)
     */
    speakWebSpeech(text, onComplete = null, token = this.speechToken) {
        if (!this.synthesis) {
            if (onComplete) onComplete();
            return;
        }

        this.synthesis.cancel();

        if (this.speakTimeout) clearTimeout(this.speakTimeout);

        this.speakTimeout = setTimeout(() => {
            if (this.speechToken !== token) return;

            this.applyCharacterSettings();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            
            if (!this.koreanVoice && this.synthesis) {
                const allVoices = this.synthesis.getVoices() || [];
                this.koreanVoice = allVoices.find(v => v.lang && (v.lang.startsWith('ko') || v.lang.includes('KR'))) || null;
            }
            if (this.koreanVoice) {
                utterance.voice = this.koreanVoice;
            }

            utterance.rate = Math.max(0.7, Math.min(2.0, this.speechRate));
            utterance.pitch = Math.max(0.5, Math.min(2.0, this.speechPitch));

            utterance.onstart = () => {
                if (this.speechToken !== token) {
                    this.synthesis.cancel();
                    return;
                }
                this.isSpeaking = true;
                if (this.onSpeakStart) this.onSpeakStart();
            };

            utterance.onend = () => {
                if (this.speechToken !== token) return;
                this.notifySpeakEnded();
                if (onComplete) onComplete();
            };

            utterance.onerror = () => {
                if (this.speechToken !== token) return;
                this.notifySpeakEnded();
                if (onComplete) onComplete();
            };

            this.synthesis.speak(utterance);
        }, 35);
    }
}

window.speechController = new SpeechController();
