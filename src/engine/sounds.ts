let _ctx: AudioContext | null = null;

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
  vol = 0.28,
) {
  try {
    const ctx = ac();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  } catch {
    // audio unavailable
  }
}

/** Ascending C-E-G arpeggio */
export function playWin() {
  tone(523.25, 0.12, 0.00);
  tone(659.25, 0.12, 0.10);
  tone(783.99, 0.25, 0.20);
}

/** Triumphant C-E-G-C fanfare */
export function playBlackjack() {
  tone(523.25, 0.10, 0.00);
  tone(659.25, 0.10, 0.08);
  tone(783.99, 0.10, 0.16);
  tone(1046.5, 0.45, 0.26, 'sine', 0.35);
}

/** Descending sawtooth thud */
export function playLose() {
  tone(349.23, 0.20, 0.00, 'sawtooth', 0.20);
  tone(293.66, 0.35, 0.18, 'sawtooth', 0.15);
}

/** Double neutral ding */
export function playPush() {
  tone(523.25, 0.09, 0.00, 'sine', 0.22);
  tone(523.25, 0.09, 0.18, 'sine', 0.16);
}

/** Soft card-deal snap */
export function playDeal() {
  try {
    const ctx = ac();
    const len = Math.floor(ctx.sampleRate * 0.055);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5) * 0.22;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  } catch {
    // ignore
  }
}

/** Chip click */
export function playChip() {
  tone(1100, 0.04, 0.00, 'square', 0.09);
  tone(800, 0.03, 0.04, 'square', 0.07);
}
