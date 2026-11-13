'use strict';

// ==================== 9b. SONS & MUSIQUE 16-BIT (synthèse WebAudio) ====================
const _ = null;
// Pistes : mesures de 16 doubles-croches. lead = notes MIDI (_ = silence/tenue), bass = fondamentale par mesure,
// bassPattern = intervalle joué sur chaque pas, pad/arp/hat = volumes (0 = absent), leadType / leadVol = timbre du lead (défaut : pulse, 0.1)
const MUSIC = {
    town: {
        bpm: 100,
        chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [57, 60, 64], [53, 57, 60], [50, 53, 57], [55, 59, 62]],
        bass: [48, 45, 41, 43, 45, 41, 38, 43],
        bassPattern: [0, _, _, _, 7, _, _, _, 12, _, _, _, 7, _, _, _],
        lead: [
            72, _, _, _, 76, _, 79, _, _, _, 77, _, 76, _, 74, _,
            72, _, _, _, _, _, 69, _, 72, _, 76, _, _, _, _, _,
            77, _, _, _, 76, _, 74, _, _, _, 72, _, 74, _, 76, _,
            74, _, _, _, _, _, _, _, 71, _, 74, _, 79, _, _, _,
            81, _, _, _, 79, _, 76, _, _, _, 79, _, 81, _, _, _,
            77, _, _, _, 76, _, 77, _, 81, _, _, _, 79, _, 77, _,
            76, _, _, _, 74, _, 72, _, _, _, 74, _, 77, _, _, _,
            79, _, _, _, _, _, _, _, _, _, _, _, 74, _, 71, _
        ],
        pad: 0.022, arp: 0.028, kick: [0, 10], snare: [4, 12], hatEvery: 2, hat: 0.022, fill: true
    },
    dungeon: {
        bpm: 84,
        chords: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59], [57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]],
        bass: [45, 41, 38, 40, 45, 43, 41, 40],
        bassPattern: [0, _, 0, _, 12, _, 0, _, 0, _, 0, _, 12, _, 7, _],
        lead: [
            69, _, _, _, _, _, 72, _, 71, _, 69, _, _, _, 64, _,
            65, _, _, _, 69, _, 72, _, _, _, 74, _, 72, _, _, _,
            74, _, _, _, 77, _, 76, _, 74, _, _, _, 72, _, 74, _,
            71, _, _, _, _, _, 68, _, _, _, 71, _, 76, _, _, _,
            76, _, _, _, _, _, 74, _, 76, _, 77, _, _, _, 76, _,
            74, _, _, _, 71, _, _, _, 67, _, _, _, 71, _, 74, _,
            72, _, _, _, _, _, 69, _, 72, _, 77, _, _, _, 76, _,
            76, _, _, _, _, _, _, _, 74, _, _, _, 71, _, 68, _
        ],
        pad: 0.032, arp: 0.02, kick: [0, 6, 8], snare: [4, 12], hatEvery: 2, hat: 0.018, fill: false
    },
    // ---- Une piste d'exploration par biome (la Prison Souterraine utilise « dungeon ») ----
    // Château en Ruines : marche royale en ré mineur harmonique, roulements de caisse claire
    castle: {
        bpm: 96,
        chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52], [50, 53, 57], [43, 46, 50], [45, 49, 52], [50, 53, 57]],
        bass: [38, 46, 36, 45, 38, 43, 45, 38],
        bassPattern: [0, _, _, _, 7, _, 0, _, 0, _, _, _, 7, _, 12, _],
        lead: [
            74, _, _, _, 74, _, 76, _, 77, _, _, _, 76, _, 74, _,
            70, _, _, _, _, _, 74, _, 77, _, _, _, 74, _, _, _,
            72, _, _, _, 76, _, 79, _, _, _, 77, _, 76, _, 72, _,
            73, _, _, _, _, _, _, _, 69, _, 73, _, 76, _, _, _,
            77, _, _, _, 76, _, 74, _, 77, _, 81, _, _, _, 77, _,
            79, _, _, _, 77, _, 74, _, 70, _, _, _, 74, _, 77, _,
            76, _, _, _, 73, _, 76, _, 79, _, _, _, 77, _, 76, _,
            74, _, _, _, _, _, _, _, _, _, _, _, 69, _, 73, _
        ],
        pad: 0.03, arp: 0.018, kick: [0, 8], snare: [4, 12, 14, 15], hatEvery: 4, hat: 0.015, fill: true
    },
    // Caveau Funéraire : lent et funèbre en mi phrygien, voix d'orgue (sinus) et boîte à musique
    crypt: {
        bpm: 66,
        chords: [[52, 55, 59], [48, 52, 55], [45, 48, 52], [47, 51, 54], [52, 55, 59], [53, 57, 60], [45, 48, 52], [47, 51, 54]],
        bass: [40, 36, 45, 47, 40, 41, 45, 47],
        bassPattern: [0, _, _, _, _, _, _, _, 7, _, _, _, _, _, _, _],
        bassLen: 6,
        lead: [
            71, _, _, _, _, _, _, _, 72, _, 71, _, 67, _, _, _,
            64, _, _, _, _, _, _, _, 67, _, _, _, 72, _, _, _,
            69, _, _, _, _, _, 72, _, 71, _, _, _, 69, _, _, _,
            71, _, _, _, _, _, _, _, 75, _, _, _, 78, _, _, _,
            76, _, _, _, _, _, _, _, 74, _, 72, _, 71, _, _, _,
            77, _, _, _, _, _, 76, _, 72, _, _, _, 69, _, _, _,
            72, _, _, _, 71, _, 69, _, 67, _, _, _, 64, _, _, _,
            63, _, _, _, _, _, _, _, _, _, _, _, 66, _, 71, _
        ],
        leadType: 'sine', leadVol: 0.13,
        pad: 0.045, arp: 0.012, kick: [0, 8], snare: [], hatEvery: 4, hat: 0.01, fill: false
    },
    // Pyramide Oubliée : mode hijaz (mi phrygien dominant), rythme de darbouka
    pyramid: {
        bpm: 92,
        chords: [[52, 56, 59], [53, 57, 60], [52, 56, 59], [50, 53, 57], [52, 56, 59], [53, 57, 60], [45, 48, 52], [52, 56, 59]],
        bass: [40, 41, 40, 38, 40, 41, 45, 40],
        bassPattern: [0, _, _, 0, _, _, 7, _, 0, _, _, 0, _, _, 12, _],
        lead: [
            76, _, 77, _, 80, _, _, _, 77, _, 76, _, 77, _, 76, _,
            77, _, _, _, 80, _, 81, _, 83, _, _, _, 81, _, 80, _,
            76, _, _, _, _, _, 74, _, 72, _, 74, _, 76, _, _, _,
            74, _, 72, _, 71, _, 69, _, 68, _, _, _, 69, _, 71, _,
            76, _, 77, _, 80, _, 81, _, 83, _, _, _, 84, _, 83, _,
            81, _, _, _, 80, _, 77, _, 80, _, 81, _, 80, _, 77, _,
            76, _, _, _, 72, _, 74, _, 76, _, _, _, 69, _, 72, _,
            68, _, _, _, _, _, 69, _, 68, _, 65, _, 64, _, _, _
        ],
        leadType: 'square', leadVol: 0.07,
        pad: 0.02, arp: 0.02, kick: [0, 3, 8, 11], snare: [4, 12, 14], hatEvery: 1, hat: 0.012, fill: true
    },
    // Temple Maudit : rituel pentatonique en do mineur, cloches et tambours graves
    temple: {
        bpm: 76,
        chords: [[48, 51, 55], [44, 48, 51], [53, 56, 60], [46, 50, 53], [48, 51, 55], [51, 55, 58], [53, 56, 60], [43, 47, 50]],
        bass: [48, 44, 41, 46, 48, 51, 41, 43],
        bassPattern: [0, _, _, _, _, _, 0, _, _, _, 7, _, _, _, _, _],
        bassLen: 3,
        lead: [
            72, _, _, _, 75, _, 77, _, 79, _, _, _, 77, _, 75, _,
            75, _, _, _, 72, _, _, _, 68, _, _, _, 70, _, 72, _,
            77, _, _, _, 79, _, 82, _, 80, _, _, _, 77, _, _, _,
            74, _, _, _, _, _, 70, _, 74, _, 77, _, _, _, _, _,
            84, _, _, _, 82, _, 79, _, _, _, 77, _, 79, _, 82, _,
            79, _, _, _, 75, _, _, _, 70, _, 75, _, 79, _, _, _,
            80, _, _, _, 77, _, 72, _, 75, _, _, _, 77, _, 80, _,
            79, _, _, _, _, _, _, _, 74, _, _, _, 71, _, _, _
        ],
        leadType: 'triangle', leadVol: 0.14,
        pad: 0.035, arp: 0.03, kick: [0, 6, 10], snare: [8], hatEvery: 4, hat: 0.012, fill: false
    },
    // Jungle Luxuriante : tribal et entraînant en sol mixolydien, percussions denses
    jungle: {
        bpm: 118,
        chords: [[43, 47, 50], [41, 45, 48], [48, 52, 55], [43, 47, 50], [52, 55, 59], [48, 52, 55], [50, 54, 57], [43, 47, 50]],
        bass: [43, 41, 36, 43, 40, 36, 38, 43],
        bassPattern: [0, _, 12, _, 0, _, 7, _, 0, _, 12, _, 0, 7, _, 12],
        bassLen: 1,
        lead: [
            74, _, 74, _, 71, _, 74, _, _, _, 76, _, 74, _, 71, _,
            72, _, 69, _, 72, _, _, _, 77, _, 76, _, 72, _, _, _,
            76, _, 76, _, 79, _, 76, _, _, _, 72, _, 74, _, 76, _,
            74, _, _, _, 71, _, _, _, 67, _, 69, _, 71, _, _, _,
            79, _, 79, _, 76, _, 79, _, _, _, 83, _, 81, _, 79, _,
            76, _, 72, _, 76, _, _, _, 79, _, 77, _, 76, _, 72, _,
            74, _, 78, _, 81, _, _, _, 78, _, 76, _, 74, _, 72, _,
            71, _, _, _, 74, _, _, _, 67, _, _, _, _, _, _, _
        ],
        leadType: 'triangle', leadVol: 0.14,
        pad: 0.015, arp: 0.026, kick: [0, 3, 6, 10, 12], snare: [4, 12], hatEvery: 1, hat: 0.02, fill: true
    },
    // Forêt Sombre : complainte folk en si mineur, flûte (triangle) et nappes brumeuses
    forest: {
        bpm: 72,
        chords: [[47, 50, 54], [43, 47, 50], [45, 49, 52], [42, 45, 49], [47, 50, 54], [52, 55, 59], [43, 47, 50], [42, 46, 49]],
        bass: [47, 43, 45, 42, 47, 40, 43, 42],
        bassPattern: [0, _, _, _, _, _, 7, _, _, _, 12, _, _, _, _, _],
        bassLen: 3,
        lead: [
            78, _, _, _, _, _, 76, _, 74, _, 73, _, 74, _, _, _,
            71, _, _, _, _, _, _, _, 74, _, 76, _, 78, _, _, _,
            76, _, _, _, 73, _, _, _, 69, _, 71, _, 73, _, 76, _,
            73, _, _, _, _, _, _, _, 69, _, _, _, 66, _, _, _,
            83, _, _, _, 81, _, 78, _, _, _, 76, _, 78, _, _, _,
            79, _, _, _, 76, _, _, _, 71, _, 74, _, 76, _, _, _,
            74, _, 76, _, 78, _, _, _, 79, _, 78, _, 76, _, 74, _,
            73, _, _, _, _, _, _, _, 70, _, _, _, 73, _, 78, _
        ],
        leadType: 'triangle', leadVol: 0.15,
        pad: 0.04, arp: 0.018, kick: [0, 10], snare: [], hatEvery: 4, hat: 0.012, fill: false
    },
    // Catacombes Profondes : infernal en do# mineur (sixte napolitaine), basse martelée, lead en dents de scie
    catacombs: {
        bpm: 108,
        chords: [[49, 52, 56], [45, 49, 52], [50, 54, 57], [44, 48, 51], [49, 52, 56], [42, 45, 49], [50, 54, 57], [44, 48, 51]],
        bass: [49, 45, 50, 44, 49, 42, 50, 44],
        bassPattern: [0, _, 0, _, 0, _, 12, _, 0, _, 0, _, 0, _, 12, _],
        bassLen: 1,
        lead: [
            73, _, _, _, 76, _, 73, _, 72, _, _, _, 73, _, _, _,
            69, _, _, _, 73, _, 76, _, 81, _, _, _, 80, _, 76, _,
            74, _, _, _, _, _, 78, _, 81, _, 78, _, 74, _, _, _,
            72, _, _, _, 75, _, 80, _, 84, _, _, _, 80, _, 75, _,
            85, _, _, _, 84, _, 85, _, 88, _, _, _, 85, _, 81, _,
            81, _, _, _, 78, _, 73, _, 78, _, 81, _, 85, _, _, _,
            86, _, _, _, 85, _, 81, _, 78, _, _, _, 74, _, 78, _,
            80, _, _, _, _, _, _, _, 75, _, 72, _, 68, _, _, _
        ],
        leadType: 'sawtooth', leadVol: 0.06,
        pad: 0.035, arp: 0.02, kick: [0, 2, 8, 10], snare: [4, 12], hatEvery: 2, hat: 0.02, fill: true
    },
    boss: {
        bpm: 140,
        chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
        bass: [45, 41, 43, 40],
        bassPattern: [0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 7, 12, 0],
        bassLen: 0.8,
        lead: [
            69, _, 72, _, 76, _, 72, _, 81, _, 76, _, 72, _, 76, _,
            65, _, 69, _, 72, _, 69, _, 77, _, 72, _, 69, _, 72, _,
            67, _, 71, _, 74, _, 71, _, 79, _, 74, _, 71, _, 74, _,
            68, _, 71, _, 76, _, 71, _, 80, _, 76, _, 83, _, 80, _
        ],
        pad: 0.03, arp: 0.032, kick: [0, 4, 8, 12], snare: [4, 12], hatEvery: 1, hat: 0.025, fill: true
    }
};
const ARP_ORDER = [0, 1, 2, 3, 2, 1];

const Sound = {
    ctx: null,
    muted: false,
    track: null,
    step: 0,
    nextTime: 0,
    last: {},

    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        try { this.muted = localStorage.getItem('chroniques_muted') === '1'; } catch (e) { /* stockage indisponible */ }
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.7;
        this.sfxBus.connect(this.master);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.32;
        this.musicBus.connect(this.master);

        // Onde pulse 25 % (timbre chiptune) + bruit blanc pour percussions et impacts
        const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
        for (let i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * 0.25);
        this.pulse = this.ctx.createPeriodicWave(real, imag);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        // Réverbération (réponse impulsionnelle générée) et écho de la mélodie
        const irLen = Math.floor(this.ctx.sampleRate * 2.2);
        const ir = this.ctx.createBuffer(2, irLen, this.ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = ir.getChannelData(ch);
            for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 3);
        }
        const reverb = this.ctx.createConvolver();
        reverb.buffer = ir;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.3;
        this.musicBus.connect(reverb).connect(wet).connect(this.master);
        this.echo = this.ctx.createDelay(1);
        this.echo.delayTime.value = 0.32;
        const fb = this.ctx.createGain();
        fb.gain.value = 0.3;
        const echoTone = this.ctx.createBiquadFilter();
        echoTone.type = 'lowpass';
        echoTone.frequency.value = 2200;
        const echoOut = this.ctx.createGain();
        echoOut.gain.value = 0.25;
        this.echo.connect(fb).connect(this.echo);
        this.echo.connect(echoTone).connect(echoOut).connect(this.musicBus);

        setInterval(() => this.schedule(), 30);
        if (this.pendingTrack) this.music(this.pendingTrack);
    },

    toggleMute() {
        this.init();
        if (!this.ctx) return;
        this.muted = !this.muted;
        this.master.gain.value = this.muted ? 0 : 0.5;
        try { localStorage.setItem('chroniques_muted', this.muted ? '1' : '0'); } catch (e) { /* stockage indisponible */ }
        UI.toast(this.muted ? '🔇 Son coupé [M]' : '🔊 Son activé [M]', 'amber');
    },

    midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

    tone(freq, dur, type, vol, slideTo, when, bus) {
        const c = this.ctx, t = when || c.currentTime;
        const o = c.createOscillator(), gn = c.createGain();
        if (type === 'pulse') o.setPeriodicWave(this.pulse); else o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        gn.gain.setValueAtTime(vol, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(gn).connect(bus || this.sfxBus);
        o.start(t);
        o.stop(t + dur + 0.02);
    },

    noise(dur, vol, filterType, freq, when, bus) {
        const c = this.ctx, t = when || c.currentTime;
        const src = c.createBufferSource(), f = c.createBiquadFilter(), gn = c.createGain();
        src.buffer = this.noiseBuf;
        f.type = filterType;
        f.frequency.value = freq;
        gn.gain.setValueAtTime(vol, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f).connect(gn).connect(bus || this.sfxBus);
        src.start(t, Math.random() * 0.5);
        src.stop(t + dur + 0.02);
    },

    play(name) {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        if (now - (this.last[name] || 0) < 0.045) return; // évite la saturation sur les coups de zone
        this.last[name] = now;
        const t = now;
        switch (name) {
            case 'swing': this.noise(0.09, 0.25, 'highpass', 2500); this.tone(420, 0.08, 'triangle', 0.15, 160); break;
            case 'hit': this.tone(190, 0.09, 'square', 0.2, 60); this.noise(0.06, 0.25, 'lowpass', 1800); break;
            case 'crit': this.tone(900, 0.14, 'pulse', 0.22, 200); this.noise(0.1, 0.35, 'bandpass', 2500); break;
            case 'hurt': this.tone(160, 0.22, 'sawtooth', 0.22, 50); this.noise(0.12, 0.2, 'lowpass', 900); break;
            case 'death': this.noise(0.35, 0.35, 'lowpass', 700); this.tone(240, 0.3, 'square', 0.18, 40); break;
            case 'boom': this.noise(0.45, 0.45, 'lowpass', 500); this.tone(110, 0.4, 'square', 0.2, 30); break;
            case 'skill': this.tone(220, 0.18, 'sawtooth', 0.15, 660); this.noise(0.15, 0.15, 'bandpass', 1500); break;
            case 'shoot': this.tone(700, 0.1, 'pulse', 0.1, 280); break;
            case 'bow': this.noise(0.07, 0.2, 'bandpass', 3000); this.tone(520, 0.09, 'triangle', 0.18, 1100); break;
            case 'swap': this.noise(0.05, 0.2, 'highpass', 5000); this.tone(1200, 0.05, 'pulse', 0.1, _, this.ctx.currentTime + 0.05); break;
            case 'coin': this.tone(1568, 0.06, 'pulse', 0.15, _, t); this.tone(2093, 0.12, 'pulse', 0.15, _, t + 0.06); break;
            case 'pickup': [784, 988, 1319].forEach((f, i) => this.tone(f, 0.08, 'pulse', 0.14, _, t + i * 0.05)); break;
            case 'potion': this.tone(400, 0.25, 'triangle', 0.25, 950); this.tone(600, 0.2, 'pulse', 0.06, 1400, t + 0.05); break;
            case 'chest': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'pulse', 0.14, _, t + i * 0.07)); break;
            case 'levelup': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => this.tone(this.midi(m), 0.16, 'pulse', 0.16, _, t + i * 0.07)); break;
            case 'ui': this.tone(880, 0.04, 'pulse', 0.08); break;
            case 'dodge': this.noise(0.1, 0.15, 'highpass', 4000); break;
        }
    },

    music(name) {
        if (!this.ctx) { this.pendingTrack = name; return; }
        if (this.track === (MUSIC[name] || null)) return;
        this.track = MUSIC[name] || null;
        this.step = 0;
        // Fondu d'entrée du nouveau morceau
        const t = this.ctx.currentTime;
        this.musicBus.gain.cancelScheduledValues(t);
        this.musicBus.gain.setValueAtTime(0.0001, t);
        this.musicBus.gain.linearRampToValueAtTime(0.32, t + 1.2);
        this.nextTime = t + 0.1;
    },

    // Voix musicale : enveloppe ADSR, oscillateurs désaccordés, vibrato et filtre optionnels
    voice(freq, t, dur, o) {
        const c = this.ctx;
        const gn = c.createGain();
        const att = o.attack || 0.01, rel = o.release || 0.1, sus = o.vol * (o.sustain === undefined ? 0.7 : o.sustain);
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.linearRampToValueAtTime(o.vol, t + att);
        gn.gain.linearRampToValueAtTime(sus, t + att + 0.08);
        gn.gain.setValueAtTime(sus, t + Math.max(dur, att + 0.08));
        gn.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, att + 0.08) + rel);
        const end = t + Math.max(dur, att + 0.08) + rel + 0.02;
        let out = gn;
        if (o.cutoff) {
            const f = c.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = o.cutoff;
            gn.connect(f);
            out = f;
        }
        out.connect(this.musicBus);
        if (o.echo) out.connect(this.echo);
        (o.detune ? [-o.detune, o.detune] : [0]).forEach(dt => {
            const osc = c.createOscillator();
            if (o.type === 'pulse') osc.setPeriodicWave(this.pulse); else osc.type = o.type;
            osc.frequency.value = freq;
            osc.detune.value = dt;
            if (o.vibrato && dur > 0.25) {
                const lfo = c.createOscillator(), depth = c.createGain();
                lfo.frequency.value = 5.5;
                depth.gain.setValueAtTime(0, t);
                depth.gain.linearRampToValueAtTime(freq * 0.012, t + 0.3);
                lfo.connect(depth).connect(osc.frequency);
                lfo.start(t);
                lfo.stop(end);
            }
            osc.connect(gn);
            osc.start(t);
            osc.stop(end);
        });
    },

    // Note d'accord la plus haute sous la mélodie (seconde voix)
    harmony(note, chord) {
        let best = null;
        [0, 12, 24].forEach(o => chord.forEach(n => {
            const h = n + o;
            if (h < note - 2 && (best === null || h > best)) best = h;
        }));
        return best;
    },

    // Séquenceur avec anticipation : programme les notes ~150 ms à l'avance
    schedule() {
        const tr = this.track;
        if (!tr || !this.ctx) return;
        const sd = 60 / tr.bpm / 4;
        const bus = this.musicBus;
        const bars = tr.lead.length / 16;
        while (this.nextTime < this.ctx.currentTime + 0.15) {
            const t = this.nextTime, s = this.step, bar = Math.floor(s / 16), b = s % 16;
            const chord = tr.chords[bar];

            const note = tr.lead[s];
            if (note !== _) {
                let len = 1;
                while (len < 12 && tr.lead[(s + len) % tr.lead.length] === _) len++;
                const dur = sd * len * 0.92;
                this.voice(this.midi(note), t, dur, { type: tr.leadType || 'pulse', vol: tr.leadVol || 0.1, detune: 7, vibrato: true, echo: true, cutoff: 3400 });
                const harm = this.harmony(note, chord);
                if (harm) this.voice(this.midi(harm), t, dur, { type: 'triangle', vol: 0.07, cutoff: 2200 });
            }

            const bp = tr.bassPattern[b];
            if (bp !== _) this.voice(this.midi(tr.bass[bar] - 12 + bp), t, sd * (tr.bassLen || 1.6), { type: 'triangle', vol: 0.36, sustain: 0.5, release: 0.05 });

            if (b === 0 && tr.pad) {
                chord.forEach(n => this.voice(this.midi(n), t, sd * 15, { type: 'sawtooth', vol: tr.pad, attack: 0.5, sustain: 0.85, release: 0.7, detune: 9, cutoff: 900 }));
            }
            if (tr.arp) {
                const tones = [...chord, chord[0] + 12];
                this.voice(this.midi(tones[ARP_ORDER[b % ARP_ORDER.length]] + 12), t, sd * 0.7, { type: 'square', vol: tr.arp, sustain: 0.4, release: 0.05, cutoff: 2600 });
            }

            if (tr.kick.includes(b)) this.tone(150, 0.14, 'sine', 0.55, 40, t, bus);
            if (tr.snare.includes(b)) {
                this.noise(0.14, 0.2, 'bandpass', 1800, t, bus);
                this.tone(220, 0.06, 'triangle', 0.12, 120, t, bus);
            } else if (tr.fill && bar === bars - 1 && b >= 12) {
                this.noise(0.08, 0.06 + (b - 12) * 0.03, 'bandpass', 2200, t, bus);
            }
            if (b % tr.hatEvery === 0) this.noise(0.03, tr.hat * (b % 4 === 2 ? 1.6 : 1), 'highpass', 7500, t, bus);

            this.nextTime += sd;
            this.step = (s + 1) % tr.lead.length;
        }
    }
};
