// Prozeduraler Sound über die Web Audio API — keine Assets, alles synthetisiert.
// Der Kontext entsteht erst nach einer Nutzer-Interaktion (Autoplay-Richtlinie);
// alle Aufrufe sind no-ops, solange kein Kontext läuft.

let ctx = null;

let masterGain = null;

let sfxGain = null;

let musicGain = null;

let noiseBuffer = null;

let volumes = { master: 80, sfx: 85, music: 60 };

export function initAudio() {
  if (ctx) {
    ctx.resume?.().catch(() => {});
    return;
  }
  try {
    ctx = new (window.AudioContext ?? window.webkitAudioContext)();
  } catch {
    ctx = null;
    return;
  }
  masterGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain.connect(masterGain);
  musicGain.connect(masterGain);
  masterGain.connect(ctx.destination);
  const length = Math.floor(ctx.sampleRate * 0.5);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) channel[i] = Math.random() * 2 - 1;
  applyVolumes();
  startMusic();
}

export function setVolumes(next) {
  volumes = { ...volumes, ...next };
  if (ctx) applyVolumes();
}

function applyVolumes() {
  masterGain.gain.value = volumes.master / 100;
  sfxGain.gain.value = (volumes.sfx / 100) ** 1.5;
  musicGain.gain.value = (volumes.music / 100) ** 2 * 0.5;
}

function tone({ type = 'sine', from = 440, to = from, dur = 0.15, gain = 0.2, delay = 0 }) {
  if (!ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, from), t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(env);
  env.connect(sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst({ dur = 0.2, gain = 0.2, cutoff = 1000, delay = 0 }) {
  if (!ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + delay;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, cutoff * 0.2), t0 + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, t0);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  source.connect(filter);
  filter.connect(env);
  env.connect(sfxGain);
  source.start(t0);
  source.stop(t0 + dur + 0.05);
}

// Dunkler Drone (zwei verstimmte Dreiecke + langsamer Filter-Lauf) als Musik.
let musicNodes = null;

function startMusic() {
  if (musicNodes) return;
  const a = ctx.createOscillator();
  a.type = 'triangle';
  a.frequency.value = 55;
  const b = ctx.createOscillator();
  b.type = 'triangle';
  b.frequency.value = 55.6;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 220;
  filter.Q.value = 2;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 130;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  const g = ctx.createGain();
  g.gain.value = 0.4;
  a.connect(filter);
  b.connect(filter);
  filter.connect(g);
  g.connect(musicGain);
  a.start();
  b.start();
  lfo.start();
  musicNodes = { a, b, lfo };
}

export const sfx = {
  hit: () => tone({ type: 'triangle', from: 95, to: 62, dur: 0.07, gain: 0.07 }),
  crit: () => {
    tone({ type: 'square', from: 240, to: 170, dur: 0.06, gain: 0.1 });
    noiseBurst({ dur: 0.08, gain: 0.12, cutoff: 2600 });
  },
  kill: () => {
    noiseBurst({ dur: 0.22, gain: 0.16, cutoff: 900 });
    tone({ type: 'triangle', from: 130, to: 55, dur: 0.18, gain: 0.12 });
  },
  boss: () => {
    tone({ type: 'sawtooth', from: 58, to: 55, dur: 0.7, gain: 0.16 });
    tone({ type: 'sawtooth', from: 61, to: 57, dur: 0.7, gain: 0.12 });
    noiseBurst({ dur: 0.5, gain: 0.1, cutoff: 300 });
  },
  enrage: () => {
    tone({ type: 'sawtooth', from: 70, to: 150, dur: 0.35, gain: 0.14 });
    noiseBurst({ dur: 0.3, gain: 0.1, cutoff: 600 });
  },
  levelUp: () => {
    tone({ type: 'sine', from: 523, to: 523, dur: 0.12, gain: 0.14 });
    tone({ type: 'sine', from: 784, to: 784, dur: 0.2, gain: 0.14, delay: 0.1 });
  },
  rare: () => tone({ type: 'sine', from: 660, to: 880, dur: 0.25, gain: 0.12 }),
  epic: () => {
    tone({ type: 'sine', from: 1046, to: 1046, dur: 0.3, gain: 0.12 });
    tone({ type: 'sine', from: 1568, to: 1568, dur: 0.35, gain: 0.1, delay: 0.12 });
    tone({ type: 'sine', from: 2093, to: 2093, dur: 0.3, gain: 0.08, delay: 0.24 });
  },
  legendary: () => {
    [784, 988, 1175, 1568].forEach((freq, i) => tone({ type: 'sine', from: freq, to: freq, dur: 0.28, gain: 0.13, delay: i * 0.13 }));
    noiseBurst({ dur: 0.3, gain: 0.08, cutoff: 2400, delay: 0.05 });
  },
  unlock: () => {
    tone({ type: 'sine', from: 392, to: 392, dur: 0.15, gain: 0.12 });
    tone({ type: 'sine', from: 587, to: 587, dur: 0.25, gain: 0.12, delay: 0.12 });
  },
  death: () => tone({ type: 'sawtooth', from: 220, to: 48, dur: 0.8, gain: 0.16 }),
  victory: () => {
    [523, 659, 784, 1046].forEach((freq, i) => tone({ type: 'sine', from: freq, to: freq, dur: 0.3, gain: 0.13, delay: i * 0.16 }));
  },
};

// Herzschlag bei niedriger Lebenskraft: dumpfer Doppelschlag, ~1,1 s Takt.
let heartbeatTimer = null;

export function setLowHp(on) {
  if (!ctx) return;
  if (on && !heartbeatTimer) {
    const beat = () => {
      tone({ type: 'sine', from: 58, to: 40, dur: 0.12, gain: 0.2 });
      setTimeout(() => tone({ type: 'sine', from: 50, to: 36, dur: 0.1, gain: 0.13 }), 190);
    };
    beat();
    heartbeatTimer = setInterval(beat, 1100);
  } else if (!on && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// Boss-Trommeln: dumpfer Kriegspuls, solange ein Boss auf dem Feld steht.
let drumsTimer = null;

export function setBossFight(on) {
  if (!ctx) return;
  if (on && !drumsTimer) {
    const drum = () => noiseBurst({ dur: 0.14, gain: 0.16, cutoff: 170 });
    drum();
    drumsTimer = setInterval(() => {
      drum();
      setTimeout(drum, 320);
    }, 640);
  } else if (!on && drumsTimer) {
    clearInterval(drumsTimer);
    drumsTimer = null;
  }
}
