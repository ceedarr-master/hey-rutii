import { state } from '../store/state.js';
import { fmt } from './format.js';
import { playBeep } from './audio.js';

let wakeLock = null;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    if (wakeLock === null) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (err) {
    console.warn("Wake Lock request failed:", err);
  }
}

export function releaseWakeLock() {
  if (wakeLock !== null) {
    try {
      wakeLock.release();
    } catch(e) {}
    wakeLock = null;
  }
}

export function clearTimer() {
  if (state.play && state.play.timerId) {
    clearInterval(state.play.timerId);
    state.play.timerId = null;
  }
}

export function startTimer(nextStepCallback) {
  clearTimer();
  state.play.timerId = setInterval(() => {
    if (!state.play || state.play.paused) return;
    if (state.play.remaining > 0) {
      state.play.remaining--;
      const el = document.querySelector(".digital-timer");
      if (el) el.textContent = fmt(state.play.remaining);
    } else {
      playBeep(2);
      if (nextStepCallback) nextStepCallback();
    }
  }, 1000);
}
