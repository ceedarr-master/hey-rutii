import { state, audioCtx, setAudioCtx } from '../store/state.js';

export function playBeep(times = 1) {
  if (state.soundEnabled === false) return;
  try {
    let ctx = audioCtx;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') ctx.resume();
    let count = 0;
    const interval = setInterval(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      count++;
      if (count >= times) clearInterval(interval);
    }, 200);
  } catch (e) {}
}
