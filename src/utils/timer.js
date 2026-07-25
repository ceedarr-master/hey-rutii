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
  if (state.play) {
    if (state.play.timerId) {
      clearInterval(state.play.timerId);
      state.play.timerId = null;
    }
    if (state.play.halfTimerId) {
      clearTimeout(state.play.halfTimerId);
      state.play.halfTimerId = null;
    }
  }
}

function triggerRepStart(secPerRep) {
  playBeep('repStart'); // "똑" (740Hz)
  if (state.play) {
    if (state.play.halfTimerId) {
      clearTimeout(state.play.halfTimerId);
      state.play.halfTimerId = null;
    }
    const halfMs = (secPerRep / 2) * 1000;
    state.play.halfTimerId = setTimeout(() => {
      if (state.play && !state.play.paused && state.screen === 'play') {
        playBeep('repHalf'); // "딱" (580Hz)
      }
      if (state.play) state.play.halfTimerId = null;
    }, halfMs);
  }
}

export function startTimer(nextStepCallback) {
  clearTimer();

  const routine = state.routines[state.currentId];
  if (routine && routine.steps && routine.steps[state.play.current]) {
    const s = routine.steps[state.play.current];
    if (s.type === 'manual' && !state.play.isResting && !state.play.paused) {
      const secPerRep = s.secPerRep || 3;
      if (state.play.remainingReps === undefined || state.play.remainingReps === null) {
        state.play.remainingReps = s.reps;
      }
      if (state.play.repSec === undefined || state.play.repSec === null) {
        state.play.repSec = secPerRep;
      }
      // 진입 즉시(t=0ms) 첫 횟수 시작 "똑"(740Hz) + 중간지점(1.5초 등) "딱"(580Hz) 알람음 즉시 예약
      if (!state.play.repStarted) {
        state.play.repStarted = true;
        triggerRepStart(secPerRep);
      }
    }
  }

  state.play.timerId = setInterval(() => {
    if (!state.play || state.play.paused) return;

    const routine = state.routines[state.currentId];
    if (!routine || !routine.steps || !routine.steps[state.play.current]) return;
    const s = routine.steps[state.play.current];

    if (s.type === 'manual' && !state.play.isResting) {
      const secPerRep = s.secPerRep || 3;
      if (state.play.remainingReps === undefined || state.play.remainingReps === null) {
        state.play.remainingReps = s.reps;
      }
      if (state.play.repSec === undefined || state.play.repSec === null) {
        state.play.repSec = secPerRep;
      }

      state.play.repSec--;

      if (state.play.repSec <= 0) {
        if (state.play.remainingReps > 1) {
          state.play.remainingReps--;
          state.play.repSec = secPerRep;

          // 다음 횟수 시작 시점 "똑" + 중간 지점 "딱" 알람음 재생
          triggerRepStart(secPerRep);

          // DOM update
          const elements = document.querySelectorAll(".rep-digital-counter");
          elements.forEach(el => {
            const numSpan = el.querySelector(".rep-val");
            if (numSpan) numSpan.textContent = state.play.remainingReps;
            if (state.play.remainingReps <= 3) {
              el.classList.add("warning");
            } else {
              el.classList.remove("warning");
            }
          });
        } else if (state.play.remainingReps === 1) {
          state.play.remainingReps = 0;
          if (state.play.halfTimerId) {
            clearTimeout(state.play.halfTimerId);
            state.play.halfTimerId = null;
          }
          const elements = document.querySelectorAll(".rep-digital-counter");
          elements.forEach(el => {
            const numSpan = el.querySelector(".rep-val");
            if (numSpan) numSpan.textContent = 0;
            el.classList.add("warning");
          });

          playBeep('finish');

          setTimeout(() => {
            if (nextStepCallback) nextStepCallback(true);
          }, 120);
        } else {
          if (nextStepCallback) nextStepCallback(true);
        }
      }
    } else {
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
    }
  }, 1000);
}
