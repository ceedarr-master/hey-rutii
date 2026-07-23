import { state, audioCtx, setAudioCtx } from '../store/state.js';

export function playRoutineCompleteSound() {
  if (state.soundEnabled === false) return;
  try {
    let ctx = audioCtx;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // 경쾌한 상승음 (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.14 },   // C5
      { freq: 659.25, time: 0.1, duration: 0.14 },  // E5
      { freq: 783.99, time: 0.2, duration: 0.14 },  // G5
      { freq: 1046.50, time: 0.3, duration: 0.45 }  // C6 (하이라이트)
    ];

    const now = ctx.currentTime;

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // 따뜻하고 경쾌한 차임벨 톤

      osc.frequency.setValueAtTime(n.freq, now + n.time);
      gain.gain.setValueAtTime(0.3, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration);
    });
  } catch (e) {
    console.error("Audio error:", e);
  }
}

export function playBeep(type = 'finish') {
  if (type === 'routineComplete' || type === 'complete') {
    return playRoutineCompleteSound();
  }

  if (state.soundEnabled === false) return;
  try {
    let ctx = audioCtx;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    if (type === 'count' || type === 1) {
      // 3초, 2초, 1초 카운트다운 부드럽고 작은 저음 비프 (520 Hz)
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // 0초 도달 (타이머 종료), 전환/휴식 시작, 세트 완료 버튼 클릭 고음 비프 (1046.5 Hz C6)
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
}

