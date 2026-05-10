// Web Audio API procedural sound system
let ctx: AudioContext | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let driftNoise: AudioBufferSourceNode | null = null;
let driftGain: GainNode | null = null;
let isEngineRunning = false;
let isDriftPlaying = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function createNoiseBuffer(duration = 2): AudioBuffer {
  const c = getCtx();
  const len = c.sampleRate * duration;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function startEngine() {
  if (isEngineRunning) return;
  const c = getCtx();
  engineOsc = c.createOscillator();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = 60;
  engineGain = c.createGain();
  engineGain.gain.value = 0.06;
  
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  
  engineOsc.connect(filter);
  filter.connect(engineGain);
  engineGain.connect(c.destination);
  engineOsc.start();
  isEngineRunning = true;
}

export function updateEngineSound(speed: number) {
  if (!engineOsc || !engineGain) return;
  // Map speed (0-80) to frequency (60-300) and gain
  const t = Math.min(speed / 80, 1);
  engineOsc.frequency.value = 60 + t * 240;
  engineGain.gain.value = 0.03 + t * 0.08;
}

export function stopEngine() {
  if (engineOsc) { try { engineOsc.stop(); } catch {} engineOsc = null; }
  if (engineGain) { engineGain = null; }
  isEngineRunning = false;
}

export function startDriftSound() {
  if (isDriftPlaying) return;
  const c = getCtx();
  driftGain = c.createGain();
  driftGain.gain.value = 0.04;
  
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;
  
  driftNoise = c.createBufferSource();
  driftNoise.buffer = createNoiseBuffer(2);
  driftNoise.loop = true;
  driftNoise.connect(filter);
  filter.connect(driftGain);
  driftGain.connect(c.destination);
  driftNoise.start();
  isDriftPlaying = true;
}

export function updateDriftSound(intensity: number) {
  if (driftGain) driftGain.gain.value = Math.min(intensity * 0.08, 0.12);
}

export function stopDriftSound() {
  if (driftNoise) { try { driftNoise.stop(); } catch {} driftNoise = null; }
  if (driftGain) { driftGain = null; }
  isDriftPlaying = false;
}

export function playCollisionSound() {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.value = 80;
  const g = c.createGain();
  g.gain.value = 0.15;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.3);
}

export function playUIClick() {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 800;
  const g = c.createGain();
  g.gain.value = 0.05;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.08);
}
