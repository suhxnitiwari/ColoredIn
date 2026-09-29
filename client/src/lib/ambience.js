// Gentle, synthesized nature sounds for the adventure map: a babbling brook
// under everything, plus birds, wind or waves depending on the world.
// Kept very quiet; it should feel like a place, not a soundtrack.
import { isMuted } from './sound.js';

let ctx;
let master;
let noise;
let layers = {};
let birdTimer;
let current = null;

function noiseBuffer() {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
    d[i] = last * 3.5;
  }
  return buf;
}

function noiseSource() {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  src.start();
  return src;
}

function lfo(target, rate, depth, base) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = rate;
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  target.value = base;
  osc.start();
}

function ensureGraph() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  noise = noiseBuffer();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // brook: filtered noise with a wandering filter
  const brookFilter = ctx.createBiquadFilter();
  brookFilter.type = 'bandpass';
  brookFilter.Q.value = 0.8;
  lfo(brookFilter.frequency, 0.35, 220, 700);
  const brook = ctx.createGain();
  brook.gain.value = 0.5;
  noiseSource().connect(brookFilter).connect(brook).connect(master);

  // wind: low swelling whoosh
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'lowpass';
  lfo(windFilter.frequency, 0.08, 250, 450);
  const wind = ctx.createGain();
  wind.gain.value = 0;
  noiseSource().connect(windFilter).connect(wind).connect(master);

  // waves: slow surf swells
  const waveFilter = ctx.createBiquadFilter();
  waveFilter.type = 'lowpass';
  waveFilter.frequency.value = 900;
  const waveAmp = ctx.createGain();
  lfo(waveAmp.gain, 0.12, 0.45, 0.5);
  const waves = ctx.createGain();
  waves.gain.value = 0;
  noiseSource().connect(waveFilter).connect(waveAmp).connect(waves).connect(master);

  layers = { brook, wind, waves };
}

function chirp() {
  const t = ctx.currentTime;
  const notes = 2 + Math.floor(Math.random() * 3);
  const base = 2200 + Math.random() * 1600;
  for (let i = 0; i < notes; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const start = t + i * 0.11;
    osc.frequency.setValueAtTime(base, start);
    osc.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), start + 0.07);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + 0.1);
  }
}

function scheduleBirds(on) {
  clearTimeout(birdTimer);
  if (!on) return;
  const next = () => {
    birdTimer = setTimeout(() => { if (!isMuted()) chirp(); next(); }, 2200 + Math.random() * 4500);
  };
  next();
}

/** Switch to a world's soundscape: 'jungle' | 'forest' | 'garden' | 'wind' | 'waves'. */
export function setAmbience(kind) {
  if (!ctx || kind === current) return;
  current = kind;
  const t = ctx.currentTime;
  layers.wind.gain.setTargetAtTime(kind === 'wind' ? 0.9 : 0, t, 0.8);
  layers.waves.gain.setTargetAtTime(kind === 'waves' ? 0.8 : 0, t, 0.8);
  layers.brook.gain.setTargetAtTime(kind === 'waves' ? 0.25 : 0.5, t, 0.8);
  scheduleBirds(['jungle', 'forest', 'garden'].includes(kind));
}

/** Must be called from a user gesture (browsers block audio until then). */
export function startAmbience(kind) {
  ensureGraph();
  if (ctx.state === 'suspended') ctx.resume();
  master.gain.setTargetAtTime(isMuted() ? 0 : 0.06, ctx.currentTime, 0.6);
  current = null;
  setAmbience(kind);
}

export function refreshAmbienceVolume() {
  if (!ctx) return;
  master.gain.setTargetAtTime(isMuted() ? 0 : 0.06, ctx.currentTime, 0.3);
  if (isMuted()) clearTimeout(birdTimer);
  else if (['jungle', 'forest', 'garden'].includes(current)) scheduleBirds(true);
}

export function stopAmbience() {
  if (!ctx) return;
  clearTimeout(birdTimer);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  current = null;
}
