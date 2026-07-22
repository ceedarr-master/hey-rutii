export function fmt(sec) {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function estimateMinutes(routine) {
  if (!routine || !routine.steps) return 0;
  let totalSec = 0;
  routine.steps.forEach(s => {
    const sets = s.sets || 1;
    const rest = s.restSeconds || 0;
    let stepSec = 0;
    if (s.type === 'timer' || s.type === 'transition') {
      stepSec = s.seconds || 0;
    } else {
      stepSec = (s.reps || 10) * 3; // 1 rep = 3 seconds
    }
    totalSec += (stepSec + rest) * sets;
  });
  return Math.max(1, Math.round(totalSec / 60));
}

export function stepDetail(s) {
  const sets = s.sets || 1;
  const rest = s.restSeconds ? ` (${s.restSeconds}초 휴식)` : '';
  if (s.type === 'transition') return `${s.seconds}초 휴식 및 전환`;
  if (s.type === 'timer') return `${s.seconds}초 • ${sets}세트${rest}`;
  return `${s.reps}개 • ${sets}세트${rest}`;
}
