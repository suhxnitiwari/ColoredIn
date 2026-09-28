// Tiny synthesized sound effects. Soft and short on purpose: feedback, not noise.
let ctx;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('coloredin:muted') === '1'; } catch { return false; }
}

export function isMuted() { return muted; }

export function setMuted(value) {
  muted = value;
  try { localStorage.setItem('coloredin:muted', value ? '1' : '0'); } catch { /* ignore */ }
}

function tone({ freq, to, duration = 0.12, type = 'sine', gain = 0.08, delay = 0 }) {
  if (muted) return;
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sfx = {
  pick: () => tone({ freq: 880, to: 1175, duration: 0.08, gain: 0.05 }),
  tool: () => tone({ freq: 520, duration: 0.07, type: 'triangle', gain: 0.06 }),
  fill: () => tone({ freq: 330, to: 660, duration: 0.18, gain: 0.07 }),
  undo: () => tone({ freq: 600, to: 400, duration: 0.1, type: 'triangle', gain: 0.05 }),
  save: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, duration: 0.22, gain: 0.06, delay: i * 0.09 })),
};
