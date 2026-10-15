/**
 * Audio Synthesizer using Web Audio API
 * No external mp3 files required - 100% standalone sound generation
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterVolume = 0.5;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.muted = muted;
    }

    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }

    play(name) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            switch (name) {
                case 'micStart':
                    this.playChime([523.25, 659.25, 783.99], 0.08, 'sine'); // C5, E5, G5
                    break;
                case 'micEnd':
                    this.playChime([783.99, 523.25], 0.08, 'sine');
                    break;
                case 'pickup':
                    this.playSlide(300, 600, 0.15, 'triangle');
                    break;
                case 'drop':
                    this.playSlide(500, 220, 0.12, 'sine');
                    break;
                case 'success':
                    this.playChime([523.25, 659.25, 783.99, 1046.50], 0.12, 'triangle'); // C5, E5, G5, C6
                    break;
                case 'lightSwitch':
                    this.playClick();
                    break;
                case 'cheer':
                    this.playMelody();
                    break;
                case 'robotMove':
                    this.playServo();
                    break;
                case 'confused':
                    this.playSlide(400, 300, 0.25, 'sawtooth', 0.2);
                    break;
                    break;
                case 'button':
                    this.playClick(600);
                    break;
                case 'questSuccess':
                    this.playChime([523.25, 659.25, 783.99, 1046.50], 0.09, 'triangle'); // Sparkling C5-E5-G5-C6
                    break;
                case 'fanfare':
                    this.playFanfare();
                    break;
                case 'robotBeep':
                    this.playRobotChirp();
                    break;
            }
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }

    playRobotChirp(freq = 880) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.05);

        gain.gain.setValueAtTime(0.08 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    playFanfare() {
        if (!this.ctx) return;
        // Triumphal brass-like synth fanfare for experience completion!
        const notes = [
            { f: 523.25, t: 0.0, d: 0.15 },   // C5
            { f: 523.25, t: 0.15, d: 0.15 },  // C5
            { f: 523.25, t: 0.30, d: 0.15 },  // C5
            { f: 659.25, t: 0.45, d: 0.35 },  // E5
            { f: 587.33, t: 0.85, d: 0.15 },  // D5
            { f: 659.25, t: 1.00, d: 0.15 },  // E5
            { f: 783.99, t: 1.18, d: 0.65 }   // G5 (Long victory hold)
        ];
        const now = this.ctx.currentTime;
        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0, now + n.t);
            gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + n.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + n.t);
            osc.stop(now + n.t + n.d + 0.05);
        });
    }

    playChime(freqs, stepDuration = 0.1, type = 'sine') {
        const now = this.ctx.currentTime;
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + idx * stepDuration);

            const startTime = now + idx * stepDuration;
            const duration = 0.25;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }

    playSlide(fromFreq, toFreq, duration = 0.15, type = 'sine', vol = 0.25) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(fromFreq, now);
        osc.frequency.exponentialRampToValueAtTime(toFreq, now + duration);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol * this.masterVolume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    playClick(freq = 800) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    playServo() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(240, now + 0.2);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.04);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playMelody() {
        // C5, E5, G5, A5, C6 joyful notes
        const notes = [
            { f: 523.25, d: 0.12 },
            { f: 659.25, d: 0.12 },
            { f: 783.99, d: 0.12 },
            { f: 880.00, d: 0.15 },
            { f: 1046.50, d: 0.3 }
        ];

        let cursor = this.ctx.currentTime;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, cursor);

            gain.gain.setValueAtTime(0, cursor);
            gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, cursor + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, cursor + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(cursor);
            osc.stop(cursor + note.d);

            cursor += note.d * 0.85;
        });
    }
}

window.soundManager = new SoundManager();
