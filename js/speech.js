/**
 * Speech Manager - STT (Speech to Text) and TTS (Text to Speech)
 * Featuring:
 * 1. Typecast AI Voice Integration (Kid-friendly characters: Robo, Junwoo, Dohee, Roro)
 * 2. Persistent Microphone Permission (Lock-in)
 * 3. 100% Hands-Free Continuous Listening with Silent Auto-Restart
 * 4. High-Speed, Cheerful TTS Engine with fallback to tuned child-robot voice
 * 5. Audio Cache support (.mp3 / .wav in audio_cache/)
 */
class SpeechController {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis || null;
        this.isListening = false;
        this.isSpeaking = false;
        this.isSupported = false;
        this.koreanVoice = null;

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
        this.typecastAvailable = false;
        this.typecastApiWorking = false;

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
        this.initTypecast();
    }

    /**
     * Check Typecast API connectivity via local backend proxy
     */
    async initTypecast() {
        try {
            const resp = await fetch('/api/typecast/status');
            if (resp.ok) {
                const data = await resp.json();
                this.typecastAvailable = !!data.configured;
                this.typecastStatus = data;
                console.log('[Typecast AI] 상태 확인 완료:', data);
                if (this.onTypecastStatus) {
                    this.onTypecastStatus(data);
                }
            }
        } catch (e) {
            console.log('[Typecast AI] 오프라인 또는 서버 미실행 상태');
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
     * Play authentic studio-recorded Typecast audio sample for character
     */
    playCharacterSample(voiceId = this.typecastVoice, onComplete = null) {
        this.stopSpeaking();
        const char = this.getVoiceInfo(voiceId);
        if (!char || !char.audioSample) return;

        if (window.soundManager) {
            window.soundManager.playRobotChirp(char.beepFreq || 880);
        }

        const subtitle = document.getElementById('robot-subtitle');
        if (subtitle && char.sampleText) {
            subtitle.textContent = char.sampleText;
            subtitle.classList.add('active');
        }

        this.playAudioFile(char.audioSample, () => {
            if (onComplete) onComplete();
        });
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
            if (this.isSpeaking) {
                return;
            }

            let interimText = '';
            let finalText = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += transcript;
                } else {
                    interimText += transcript;
                }
            }

            if (interimText && this.onInterimResult) {
                this.onInterimResult(interimText.trim());
            }

            if (finalText && this.onFinalResult) {
                this.onFinalResult(finalText.trim());
            }
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
                }, 300);
            }
        };
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

        if (this.currentAudio) {
            try {
                this.currentAudio.onended = null;
                this.currentAudio.onerror = null;
                this.currentAudio.oncanplaythrough = null;
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } catch (e) {}
            this.currentAudio = null;
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
            if (this.onSpeakEnd) this.onSpeakEnd();
        }
    }

    /**
     * Primary Speech Output Function
     * Eliminates overlap by canceling any prior audio/speech immediately.
     * Uses audio_cache to maintain 100% consistent robot voice throughout the whole experience.
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

        // 1. Direct match in audioFileMap
        let cacheKey = this.audioFileMap[trimmed];

        // 2. Fuzzy match (strip punctuation, whitespace, quotes)
        if (!cacheKey) {
            const clean = (s) => s.replace(/[\s.,?!~"'“”]/g, '');
            const targetClean = clean(trimmed);
            for (const [key, val] of Object.entries(this.audioFileMap)) {
                if (clean(key) === targetClean) {
                    cacheKey = val;
                    break;
                }
            }
        }

        // 3. Keyword / Semantic matching
        if (!cacheKey) {
            if (trimmed.includes('이미') && trimmed.includes('책상')) cacheKey = 'already_box_desk';
            else if (trimmed.includes('이미') && trimmed.includes('상자')) cacheKey = 'already_bear_box';
            else if (trimmed.includes('이미') && trimmed.includes('침대')) cacheKey = 'already_ball_bed';
            else if (trimmed.includes('이미') && trimmed.includes('선반')) cacheKey = 'already_book_shelf';
            else if (trimmed.includes('새로운 친구') || (trimmed.includes('친구') && trimmed.includes('안녕') && trimmed.includes('로봇아'))) cacheKey = 'next_student';
            else if (trimmed.includes('대단해요') || trimmed.includes('모든 퀘스트')) cacheKey = 'all_quests_done';
            else if (trimmed.includes('오늘 체험을') || trimmed.includes('체험을 멋지게')) cacheKey = 'finish_exp';
            else if (trimmed.includes('어떤 물건')) cacheKey = 'need_item';
            else if (trimmed.includes('어디로 옮길')) cacheKey = 'need_dest';
            else if (trimmed.includes('못 들었') || trimmed.includes('못 알아')) cacheKey = 'unknown_hint';
            else if (trimmed.includes('못 찾았')) cacheKey = 'not_found_item';
            else if (trimmed.includes('옮길 수 없어')) cacheKey = 'cannot_move_slot';
            else if (trimmed.includes('어디로 옮겨줄')) cacheKey = 'unknown_where';
        }

        // Play authentic, high-quality consistent robot voice from audio cache
        if (cacheKey) {
            const ok = await this.playAudioFile(`audio_cache/${cacheKey}.mp3`, onComplete);
            if (ok || this.speechToken !== token) return;
        }

        // Fallback Web Speech with matching lively robot pitch & rate
        this.speakWebSpeech(trimmed, onComplete, token);
    }

    playAudioFile(src, onComplete = null) {
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } catch (e) {}
            this.currentAudio = null;
        }
        if (this.synthesis) {
            try { this.synthesis.cancel(); } catch (e) {}
        }
        const currentToken = this.speechToken;

        return new Promise((resolve) => {
            const audio = new Audio(src);
            // Crisp, clear Korean speaking speed
            audio.playbackRate = 1.05 * (this.speedMultiplier || 1.0);
            this.currentAudio = audio;
            this.isSpeaking = true;
            if (this.onSpeakStart) this.onSpeakStart();

            const cleanup = () => {
                audio.onended = null;
                audio.onerror = null;
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                    this.isSpeaking = false;
                    if (this.onSpeakEnd) this.onSpeakEnd();
                }
            };

            audio.onended = () => {
                if (this.speechToken !== currentToken) {
                    resolve(false);
                    return;
                }
                cleanup();
                if (onComplete) onComplete();
                resolve(true);
            };

            audio.onerror = () => {
                cleanup();
                resolve(false);
            };

            audio.play().catch(() => {
                cleanup();
                resolve(false);
            });
        });
    }

    /**
     * Fallback & Primary Web Speech Synthesis
     * Specially tuned for elementary school kids (cute cheerful animated robot tone)
     * Guaranteed zero overlap via queue cancellation and debounced flushing.
     */
    speakWebSpeech(text, onComplete = null, token = this.speechToken) {
        if (!this.synthesis) {
            if (onComplete) onComplete();
            return;
        }

        // Cancel previous speech to guarantee no overlap
        this.synthesis.cancel();

        if (this.speakTimeout) clearTimeout(this.speakTimeout);

        // Debounce to allow Chrome/Edge TTS audio thread to cleanly reset
        this.speakTimeout = setTimeout(() => {
            if (this.speechToken !== token) return;

            this.applyCharacterSettings();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            
            // Dynamic check for Korean voice to avoid defaulting to English/foreign voice
            if (!this.koreanVoice && this.synthesis) {
                const allVoices = this.synthesis.getVoices() || [];
                this.koreanVoice = allVoices.find(v => v.lang && (v.lang.startsWith('ko') || v.lang.includes('KR'))) || null;
            }
            if (this.koreanVoice) {
                utterance.voice = this.koreanVoice;
            }

            // Cheerful kid-robot pitch and rate
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
                if (this.onSpeakEnd) this.onSpeakEnd();
                if (onComplete) onComplete();
            };

            utterance.onerror = (e) => {
                if (this.speechToken !== token) return;
                this.isSpeaking = false;
                if (this.onSpeakEnd) this.onSpeakEnd();
                if (onComplete) onComplete();
            };

            this.synthesis.speak(utterance);
        }, 35);
    }
}

window.speechController = new SpeechController();
