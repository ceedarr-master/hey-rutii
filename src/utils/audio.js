import { state, audioCtx, setAudioCtx } from '../store/state.js';

let isUnlocked = false;

export function initAudio() {
  if (state.soundEnabled === false) return null;
  try {
    let ctx = audioCtx;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  } catch (e) {
    console.error("Audio init error:", e);
    return null;
  }
}

export function unlockAudio() {
  if (state.soundEnabled === false) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;

    if (!isUnlocked || ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // Play 1ms silent buffer to force unlock WebAudio on iOS Safari & mobile browsers
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        isUnlocked = true;
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("Audio unlock warning:", e);
  }
}

export function playRoutineCompleteSound() {
  if (state.soundEnabled === false) return;
  try {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, duration: 0.14, gain: 0.4 },   // C5
      { freq: 659.25, time: 0.1, duration: 0.14, gain: 0.4 },  // E5
      { freq: 783.99, time: 0.2, duration: 0.14, gain: 0.4 },  // G5
      { freq: 1046.50, time: 0.3, duration: 0.45, gain: 0.5 }  // C6
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      const startTime = now + n.time;
      const stopTime = startTime + n.duration;

      osc.frequency.setValueAtTime(n.freq, startTime);
      gain.gain.setValueAtTime(n.gain, startTime);
      gain.gain.linearRampToValueAtTime(0.0001, stopTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(stopTime);
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
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    if (type === 'rep' || type === 'repStart' || type === 'repTick') {
      // "똑" - 횟수 시작 시점 알람음 (1046.5 Hz C6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.50, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'repHalf' || type === 'repTack') {
      // "딱" - 회당 소요시간 중간 지점 알람음 (1318.51 Hz E6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.51, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'count' || type === 1) {
      // 3초, 2초, 1초 카운트다운 부드럽고 뚜렷한 비프 (600 Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // 0초 도달 (타이머 종료 / 휴식 / 트랜지션 완료): "띵-동" 2단 차임벨 (880 Hz A5 -> 587.33 Hz D5)
      const notes = [
        { freq: 587.00, time: 0, duration: 0.18, gain: 0.45 },    // "띵"
        { freq: 880.00, time: 0.14, duration: 0.35, gain: 0.50 }   // "동"
      ];

      notes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';

        const startTime = now + n.time;
        const stopTime = startTime + n.duration;

        osc.frequency.setValueAtTime(n.freq, startTime);
        gain.gain.setValueAtTime(n.gain, startTime);
        gain.gain.linearRampToValueAtTime(0.0001, stopTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(stopTime);
      });
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
}

