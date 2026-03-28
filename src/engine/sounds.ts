let _ctx: AudioContext | null = null;
let _masterVolume = 0.5; // 0–1, controlled by settings

export function setMasterVolume(v: number) {
  _masterVolume = Math.max(0, Math.min(1, v));
}

function ac(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

function tone(
  freq: number,
  duration: number,
  delay = 0,
  type: OscillatorType = 'sine',
  vol = 0.25,
) {
  try {
    const ctx = ac();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const scaled = vol * _masterVolume;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(scaled, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  } catch {
    // audio unavailable
  }
}

/** Ascending C-E-G arpeggio — warm win sound */
export function playWin() {
  tone(523.25, 0.14, 0.00, 'sine', 0.22);
  tone(659.25, 0.14, 0.10, 'sine', 0.22);
  tone(783.99, 0.28, 0.20, 'sine', 0.25);
}

/** Triumphant C-E-G-C fanfare — blackjack celebration */
export function playBlackjack() {
  tone(523.25, 0.10, 0.00, 'sine', 0.22);
  tone(659.25, 0.10, 0.08, 'sine', 0.22);
  tone(783.99, 0.10, 0.16, 'sine', 0.25);
  tone(1046.5, 0.50, 0.26, 'sine', 0.30);
}

/** Descending minor — gentle lose */
export function playLose() {
  tone(392.00, 0.18, 0.00, 'triangle', 0.16);
  tone(311.13, 0.30, 0.16, 'triangle', 0.12);
}

/** Double neutral ding — push */
export function playPush() {
  tone(523.25, 0.10, 0.00, 'sine', 0.18);
  tone(523.25, 0.10, 0.18, 'sine', 0.13);
}

/** Card slide — short filtered noise burst, sounds like a card hitting felt */
export function playCardSlide() {
  try {
    const ctx = ac();
    const len = Math.floor(ctx.sampleRate * 0.045);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, 4);
      d[i] = (Math.random() * 2 - 1) * env * 0.18 * _masterVolume;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3500;
    bp.Q.value = 1.2;
    src.connect(bp);
    bp.connect(ctx.destination);
    src.start();
  } catch {
    // ignore
  }
}

/** Soft card-deal snap — crisp white noise burst (used for initial deal start) */
export function playDeal() {
  try {
    const ctx = ac();
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * 0.20 * _masterVolume;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 2000;
    src.connect(highpass);
    highpass.connect(ctx.destination);
    src.start();
  } catch {
    // ignore
  }
}

/** Button press — bright tap */
export function playButtonPress() {
  tone(880, 0.04, 0, 'sine', 0.10);
  tone(1100, 0.03, 0.02, 'sine', 0.07);
}

/** Deal button — bright two-note "let's go" */
export function playDealButton() {
  tone(660, 0.06, 0, 'sine', 0.13);
  tone(990, 0.10, 0.05, 'sine', 0.15);
}

/** Next Hand button — quick hopeful triplet, slightly different from Deal */
export function playNextHand() {
  tone(880, 0.05, 0, 'sine', 0.11);
  tone(1047, 0.05, 0.04, 'sine', 0.11);
  tone(1319, 0.08, 0.08, 'sine', 0.13);
}

/** Chip click — bright poker chip tap */
export function playChip() {
  tone(1400, 0.03, 0, 'sine', 0.09);
  tone(1800, 0.025, 0.02, 'sine', 0.06);
}

/** Lock-in thud — short low-frequency impact, cards pressed onto felt */
export function playLockIn() {
  tone(150, 0.08, 0, 'triangle', 0.18);
  tone(120, 0.12, 0.02, 'sine', 0.14);
}

/** Tension drone — low sustained tone during dealer turn */
let _tensionOsc: OscillatorNode | null = null;
let _tensionGain: GainNode | null = null;

export function playTensionStart() {
  try {
    const ctx = ac();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 90;
    const scaled = 0.07 * _masterVolume;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(scaled, ctx.currentTime + 0.3);
    osc.start();
    _tensionOsc = osc;
    _tensionGain = gain;
  } catch {
    // audio unavailable
  }
}

export function playTensionStop() {
  try {
    if (_tensionGain && _tensionOsc) {
      const ctx = ac();
      _tensionGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      const osc = _tensionOsc;
      setTimeout(() => { try { osc.stop(); } catch { /* already stopped */ } }, 400);
      _tensionOsc = null;
      _tensionGain = null;
    }
  } catch {
    // ignore
  }
}

/** Sweep whoosh — cards being cleared off the table */
export function playSweep() {
  try {
    const ctx = ac();
    const len = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      d[i] = (Math.random() * 2 - 1) * env * 0.12 * _masterVolume;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    src.connect(hp);
    hp.connect(ctx.destination);
    src.start();
  } catch {
    // ignore
  }
}
