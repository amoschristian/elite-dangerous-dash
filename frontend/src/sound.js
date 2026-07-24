import holdSoundUrl from "./assets/holdbutton.mp3";
import pressSoundUrl from "./assets/pressbutton.mp3";

let audioContext = null;

// Adjust this value (0 = silent, 1 = max)
const VOLUME = 1;

// Preloaded audio buffers
let pressBuffer = null;
let pressArrayBuffer = null;
let holdBuffer = null;
let holdArrayBuffer = null;

// Start fetching immediately, don't wait for first press
fetch(pressSoundUrl)
  .then((r) => r.arrayBuffer())
  .then((buf) => { pressArrayBuffer = buf; })
  .catch(() => {});
fetch(holdSoundUrl)
  .then((r) => r.arrayBuffer())
  .then((buf) => { holdArrayBuffer = buf; })
  .catch(() => {});

// Hold charge state
let holdSource = null;
let holdGain = null;

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

async function getPressBuffer() {
  if (pressBuffer) return pressBuffer;
  const ctx = getContext();
  const buf = pressArrayBuffer ?? await fetch(pressSoundUrl).then((r) => r.arrayBuffer());
  pressBuffer = await ctx.decodeAudioData(buf.slice(0));
  return pressBuffer;
}

async function getHoldBuffer() {
  if (holdBuffer) return holdBuffer;
  const ctx = getContext();
  const buf = holdArrayBuffer ?? await fetch(holdSoundUrl).then((r) => r.arrayBuffer());
  holdBuffer = await ctx.decodeAudioData(buf.slice(0));
  return holdBuffer;
}

export async function playClick() {
  if (VOLUME <= 0) return;
  const ctx = getContext();
  const buffer = await getPressBuffer();

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(VOLUME, ctx.currentTime);
  gain.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(ctx.currentTime);
}

export async function startHoldCharge() {
  if (VOLUME <= 0) return;
  stopHoldCharge();

  const ctx = getContext();
  const buffer = await getHoldBuffer();

  holdGain = ctx.createGain();
  holdGain.gain.setValueAtTime(VOLUME * 0.6, ctx.currentTime);
  holdGain.connect(ctx.destination);

  holdSource = ctx.createBufferSource();
  holdSource.buffer = buffer;
  holdSource.loop = true;
  holdSource.connect(holdGain);
  holdSource.start(ctx.currentTime);
}

export function updateHoldCharge(progress) {
  if (!holdGain || VOLUME <= 0) return;
  const p = Math.min(progress, 1);
  holdGain.gain.linearRampToValueAtTime(VOLUME * (0.6 + p * 0.4), holdGain.context.currentTime + 0.02);
}

export function stopHoldCharge() {
  if (!holdSource) return;
  const ctx = getContext();
  const now = ctx.currentTime;

  try {
    holdGain.gain.setValueAtTime(holdGain.gain.value, now);
    holdSource.stop(now);
  } catch (_) { /* already stopped */ }

  holdSource = null;
  holdGain = null;
}
