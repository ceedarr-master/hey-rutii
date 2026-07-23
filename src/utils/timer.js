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
    
    if (state.play.remaining > 1) {
      state.play.remaining--;
      const elements = document.querySelectorAll(".digital-timer, .typo-highlight-timer");
      elements.forEach(el => {
        el.textContent = fmt(state.play.remaining);
        if (state.play.remaining <= 3) {
          el.classList.add("warning");
        } else {
          el.classList.remove("warning");
        }
      });

      // 3초, 2초, 1초 저음 카운트다운 알림음 (520Hz)
      if (state.play.remaining <= 3 && state.play.remaining >= 1) {
        playBeep('count');
      }
    } else if (state.play.remaining === 1) {
      // 0:00 초에 고음 알림음 (1046.5Hz) 즉시 울리고 0:00 렌더 후 다음 화면으로 이동
      state.play.remaining = 0;
      const elements = document.querySelectorAll(".digital-timer, .typo-highlight-timer");
      elements.forEach(el => {
        el.textContent = fmt(0);
        el.classList.add("warning");
      });

      playBeep('finish');

      setTimeout(() => {
        if (nextStepCallback) nextStepCallback(true);
      }, 120);
    } else {
      if (nextStepCallback) nextStepCallback(true);
    }
  }, 1000);
}
