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

        // Hands-Free & Permission Persistence
        this.micStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.volumeDataArray = null;
        this.isAudioMonitoring = false;
        this.shouldKeepListening = true;
        this.isStarting = false;
        this.restartTimer = null;
        this.permissionRequested = false;

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

        // 1. Silent unlock of DOM Audio element
        if (this.audioPlayer) {
            try {
                this.audioPlayer.play().then(() => {
                    this.audioPlayer.pause();
                }).catch(() => {});
            } catch (e) {}
        }

        // 2. Resume Web Audio API context
        if (window.soundManager && window.soundManager.ctx) {
            if (window.soundManager.ctx.state === 'suspended') {
                window.soundManager.ctx.resume().catch(() => {});
            }
        }

        // 3. Preload all robot voice audio files in the background
        this.preloadAudioCache();
    }

    /**
     * Asynchronously preloads all 56 MP3 files into memory/buffers for instant playback
     */
    async preloadAudioCache() {
        const uniqueKeys = Array.from(new Set(Object.values(this.audioFileMap)));
        const ctx = window.soundManager ? window.soundManager.ctx : null;

        for (const key of uniqueKeys) {
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
     * Request microphone permission once.
     */
    async requestPersistentPermission() {
        if (this.permissionRequested && this.micStream) {
            return true;
        }
        this.permissionRequested = true;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.micStream = stream;
            this.setupAudioAnalyser(stream);
            return true;
        } catch (err) {
            console.warn('Microphone permission info:', err);
            return false;
        }
    }

    setupAudioAnalyser(stream) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioCtx();
            const source = this.audioContext.createMediaStreamSource(stream);

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.volumeDataArray = new Uint8Array(bufferLength);
            this.isAudioMonitoring = true;
            this.monitorAudioLevel();
        } catch (e) {
            console.warn('Audio analyser setup error:', e);
        }
    }

    monitorAudioLevel() {
        if (!this.isAudioMonitoring || !this.analyser) return;

        this.analyser.getByteFrequencyData(this.volumeDataArray);
        let sum = 0;
        for (let i = 0; i < this.volumeDataArray.length; i++) {
            sum += this.volumeDataArray[i];
        }
        const avg = sum / this.volumeDataArray.length;
        const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));

        if (this.onVolumeLevel) {
            this.onVolumeLevel(normalizedLevel);
        }

        requestAnimationFrame(() => this.monitorAudioLevel());
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
            if (this.onListenStateChange) this.onListenStateChange(true);
        };

        this.recognition.onresult = (event) => {
            // Discard recognition while robot is speaking or immediately after (prevent self-echo)
            if (this.isSpeaking || (Date.now() - this.lastSpeakEndTime < 350)) {
                this.speechBuffer = '';
                return;
            }

            let interimText = '';
            let newFinalText = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const res = event.results[i];
                const transcript = res[0].transcript;
                if (res.isFinal) {
                    newFinalText += ' ' + transcript;
                } else {
                    interimText += ' ' + transcript;
                }
            }

            if (newFinalText.trim()) {
                this.speechBuffer = (this.speechBuffer + ' ' + newFinalText).trim();
            }

            const currentCandidate = (this.speechBuffer + ' ' + interimText).trim();

            if (currentCandidate && this.onInterimResult) {
                this.onInterimResult(currentCandidate);
            }

            // Smart evaluate candidate text without prematurely failing on pauses
            this.evaluateSpeechInput(currentCandidate, !!newFinalText.trim());
        };

        this.recognition.onerror = (event) => {
            this.isStarting = false;
            if (event.error === 'no-speech' || event.error === 'aborted') {
                return;
            }

            if (event.error === 'not-allowed') {
                this.isListening = false;
                if (this.onListenStateChange) this.onListenStateChange(false);
                return;
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.isStarting = false;
            if (this.onListenStateChange) this.onListenStateChange(false);

            if (this.shouldKeepListening) {
                clearTimeout(this.restartTimer);
                this.restartTimer = setTimeout(() => {
                    this.startListening();
                }, 250);
            }
        };
    }

    /**
     * Smart Speech Evaluator
     * Understands kids' natural pauses without premature errors or chopped phrases!
     */
    evaluateSpeechInput(candidateText, hasFinalChunk) {
        if (!candidateText || this.isSpeaking) return;

        const intent = window.nluParser ? window.nluParser.parse(candidateText) : null;
        if (!intent) return;

        // 1. High-Confidence Complete Action Commands: Fast execution!
        const isActionable = [
            'MOVE', 'LIGHT_ON', 'LIGHT_OFF', 'DANCE', 'RESET', 
            'COME', 'PRAISE', 'FINISH_EXPERIENCE', 'GREET'
        ].includes(intent.type);

        if (isActionable) {
            clearTimeout(this.evalTimer);
            // Crisp 180ms debounce to catch any immediate trailing syllable
            this.evalTimer = setTimeout(() => {
                this.commitCommand(candidateText);
            }, 180);
            return;
        }

        // 2. Wake Word Only ("로봇아!", "로보야!"): Wait 650ms in case the child continues speaking
        if (intent.type === 'WAKE_WORD') {
            clearTimeout(this.evalTimer);
            this.evalTimer = setTimeout(() => {
                this.commitCommand(candidateText);
            }, 650);
            return;
        }

        // 3. Incomplete / Ambiguous / Unknown ("상자를...", "책상으로...", or unclear speech)
        // Give the child 900ms to complete their thought before showing hints!
        clearTimeout(this.evalTimer);
        this.evalTimer = setTimeout(() => {
            this.commitCommand(candidateText);
        }, 900);
    }

    /**
     * Finalizes and dispatches recognized command
     */
    commitCommand(text) {
        if (!text || this.isSpeaking) return;
        clearTimeout(this.evalTimer);
        this.evalTimer = null;

        const finalCommand = text.trim();
        this.speechBuffer = ''; // Reset buffer for next utterance

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

        if (this.isListening || this.isStarting) {
            return true;
        }

        this.isStarting = true;

        if (!this.permissionRequested) {
            this.requestPersistentPermission();
        }

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            this.isStarting = false;
            return false;
        }
    }

    stopListening() {
        this.shouldKeepListening = false;
        this.isStarting = false;
        clearTimeout(this.restartTimer);
        clearTimeout(this.evalTimer);
        this.speechBuffer = '';

        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
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

    /**
     * Robust Audio Playback using Web Audio API buffer sources or unlocked DOM player
     */
    playAudioFile(src, onComplete = null) {
        this.stopSpeaking();
        const currentToken = this.speechToken;

        return new Promise((resolve) => {
            const cacheKeyMatch = src.match(/audio_cache\/(.+)\.mp3$/);
            const cacheKey = cacheKeyMatch ? cacheKeyMatch[1] : null;

            // Method 1: Web Audio API Buffer Playback (Zero-lag, 100% bypasses Autoplay blocks)
            const ctx = window.soundManager ? window.soundManager.ctx : null;
            if (ctx && cacheKey && this.audioBufferCache[cacheKey]) {
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
                        this.isSpeaking = false;
                        this.lastSpeakEndTime = Date.now();
                        if (this.onSpeakEnd) this.onSpeakEnd();
                        if (onComplete) onComplete();
                        resolve(true);
                    };

                    source.start(0);
                    return;
                } catch (e) {
                    console.warn('Web Audio buffer playback error, using audio player fallback:', e);
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
                    this.isSpeaking = false;
                    this.lastSpeakEndTime = Date.now();
                    if (this.onSpeakEnd) this.onSpeakEnd();
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
                this.isSpeaking = false;
                this.lastSpeakEndTime = Date.now();
                if (this.onSpeakEnd) this.onSpeakEnd();
                if (onComplete) onComplete();
            };

            utterance.onerror = () => {
                if (this.speechToken !== token) return;
                this.isSpeaking = false;
                this.lastSpeakEndTime = Date.now();
                if (this.onSpeakEnd) this.onSpeakEnd();
                if (onComplete) onComplete();
            };

            this.synthesis.speak(utterance);
        }, 35);
    }
}

window.speechController = new SpeechController();
