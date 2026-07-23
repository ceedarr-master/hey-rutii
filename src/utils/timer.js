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
      const elements = document.querySelectorAll(".digital-timer, .typo-highlight-timer");
      elements.forEach(el => {
        el.textContent = fmt(state.play.remaining);
      });

      // 3초, 2초, 1초 카운트다운 비프음 울리기 (soundEnabled 확인)
      if (state.play.remaining <= 3 && state.play.remaining > 0) {
        if (state.soundEnabled !== false) {
          playBeep(1);
        }
      }
    } else {
      if (state.soundEnabled !== false) {
        playBeep(2);
      }
      if (nextStepCallback) nextStepCallback();
    }
  }, 1000);
}
