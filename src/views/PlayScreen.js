import { state } from '../store/state.js';
import { escapeHtml } from '../utils/helpers.js';
import { fmt } from '../utils/format.js';
import { renderList } from './ListScreen.js';

export function renderDone(routine) {
  return `
    <div class="card">
      <div class="card-group-header">
        <div style="font-size:64px; margin-bottom:var(--space-16);">🎉</div>
        <h2 style="font-size:var(--text-2xl); font-weight:var(--fw-black); color:var(--text-primary); margin-bottom:var(--space-8);">수고하셨습니다!</h2>
      </div>

      <div class="card-group-body">
        <p style="font-size:var(--text-base); color:var(--text-secondary); font-weight:var(--fw-bold); margin-bottom:var(--space-24);">"${escapeHtml(routine.name)}" 루틴을 완료했습니다.</p>
      </div>

      <div class="card-group-footer" style="display:flex; gap:var(--space-10);">
        <button class="btn-lg btn-secondary btn-flex" onclick="window.restartRoutine()">다시 시작 🔄</button>
        <button class="btn-lg btn-primary btn-flex" onclick="window.goScreen('list')">완료 ✓</button>
      </div>
    </div>`;
}

export function renderPlay(routine) {
  if (!routine || !routine.steps || !routine.steps[state.play.current]) {
    state.screen = "list";
    return renderList();
  }
  const s = routine.steps[state.play.current];

  // 1. Exclude transition steps from step count & progress bar segments
  const exerciseStepIndices = [];
  routine.steps.forEach((step, idx) => {
    if (step.type !== 'transition') {
      exerciseStepIndices.push(idx);
    }
  });

  const totalExerciseSteps = exerciseStepIndices.length;

  // Calculate current exercise step index (1-indexed)
  let currentExerciseIndex = 1;
  let activeExerciseStepOriginalIdx = exerciseStepIndices[0];

  if (s.type === 'transition') {
    // If transition step, find next exercise step or last exercise step
    const nextExerciseIdx = exerciseStepIndices.find(idx => idx > state.play.current);
    if (nextExerciseIdx !== undefined) {
      currentExerciseIndex = exerciseStepIndices.indexOf(nextExerciseIdx) + 1;
      activeExerciseStepOriginalIdx = nextExerciseIdx;
    } else {
      currentExerciseIndex = totalExerciseSteps;
      activeExerciseStepOriginalIdx = exerciseStepIndices[totalExerciseSteps - 1];
    }
  } else {
    // If exercise step
    const foundIdx = exerciseStepIndices.indexOf(state.play.current);
    currentExerciseIndex = foundIdx !== -1 ? (foundIdx + 1) : 1;
    activeExerciseStepOriginalIdx = state.play.current;
  }

  // 2. Render Progress Bar Segments (only for exercise steps)
  const segs = exerciseStepIndices.map((origIdx) => {
    let cls = "progress-seg";
    if (state.play.current > origIdx) {
      cls += " done";
    } else if (state.play.current === origIdx) {
      cls += " current";
    } else if (s.type === 'transition' && origIdx === activeExerciseStepOriginalIdx) {
      cls += " current";
    }
    return `<div class="${cls}"></div>`;
  }).join("");

  let prevEx = null;
  for (let i = state.play.current - 1; i >= 0; i--) {
    if (routine.steps[i] && routine.steps[i].type !== 'transition') {
      prevEx = routine.steps[i];
      break;
    }
  }

  let nextEx = null;
  for (let i = state.play.current + 1; i < routine.steps.length; i++) {
    if (routine.steps[i] && routine.steps[i].type !== 'transition') {
      nextEx = routine.steps[i];
      break;
    }
  }
  const totalSets = s.sets || 1;

  let dotsHtml = "";
  for (let i = 1; i <= totalSets; i++) {
    let dCls = "set-dot";
    if (i < state.play.currentSet) dCls += " done";
    else if (i === state.play.currentSet) dCls += " current";
    else dCls += " upcoming";
    dotsHtml += `<div class="${dCls}">${i < state.play.currentSet ? '✓' : i}</div>`;
  }
  const setTrackHtml = `
    <div class="set-progress-track">
      <div class="set-progress-line"></div>
      ${dotsHtml}
    </div>`;

  let body = "";
  if (s.type === 'transition' || state.play.isResting) {
    if (!state.play.remaining) state.play.remaining = s.type === 'transition' ? s.seconds : (s.restSeconds || 15);
    body = `
      <div class="card-group-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span class="badge" style="background:#def7f2; color:#00c6b8; font-weight:var(--fw-bold); border-radius:20px; padding:6px 12px; margin-bottom:0;">${s.type === 'transition' ? '준비' : '휴식 중'}</span>
        ${setTrackHtml}
      </div>

      <div class="card-group-body">
        <div style="font-size:28px; font-weight:var(--fw-black); color:var(--text-primary); text-align:center; margin-bottom:4px;">${escapeHtml(s.name)}</div>
        <div style="font-size:var(--text-base); color:var(--text-secondary); text-align:center;">다음 세트를 준비하세요</div>
      </div>

      <div class="card-group-timer">
        <div class="digital-timer typo-highlight-timer">${fmt(state.play.remaining)}</div>
      </div>

      <div class="card-group-footer">
        <button class="btn-lg btn-secondary" style="width:100%;" onclick="window.nextStep()">바로 시작</button>
      </div>`;
  } else if (s.type === "timer") {
    if (!state.play.remaining) state.play.remaining = s.seconds;
    body = `
      <div class="card-group-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span class="badge" style="background:#def7f2; color:#00c6b8; font-weight:var(--fw-bold); border-radius:20px; padding:6px 12px; margin-bottom:0;">⏱ 시간 진행</span>
        ${setTrackHtml}
      </div>

      <div class="card-group-body">
        <div style="font-size:28px; font-weight:var(--fw-black); color:var(--text-primary); text-align:center; margin-bottom:4px;">${escapeHtml(s.name)}</div>
        ${s.target ? `<div style="font-size:var(--text-base); font-weight:var(--fw-bold); color:var(--text-secondary); text-align:center; margin-bottom:8px;">${escapeHtml(s.target)}</div>` : ""}
        ${s.desc ? `<div style="font-size:var(--text-sm); color:var(--text-secondary); text-align:center;">${escapeHtml(s.desc)}</div>` : ""}
      </div>

      <div class="card-group-timer">
        <div class="digital-timer typo-highlight-timer" style="font-size:64px; font-weight:900; color:#00c6b8; text-align:center;">${fmt(state.play.remaining)}</div>
      </div>

      <div class="card-group-footer" style="display:flex; gap:12px;">
        <button class="btn-lg btn-secondary btn-flex" onclick="window.togglePause()">${state.play.paused ? "▶ 시작" : "⏸ 일시정지"}</button>
        <button class="btn-lg btn-primary btn-flex" onclick="window.nextStep()">다음 →</button>
      </div>`;
  } else {
    body = `
      <div class="card-group-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
        <span class="badge" style="background:#def7f2; color:#00c6b8; font-weight:var(--fw-bold); border-radius:20px; padding:6px 12px; margin-bottom:0;">✓ 횟수 진행</span>
        ${setTrackHtml}
      </div>

      <div class="card-group-body">
        <div style="font-size: var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-primary); text-align:center; margin-bottom: var(--space-8);">${escapeHtml(s.name)}</div>
        ${s.target ? `<div style="font-size:var(--text-base); font-weight:var(--fw-bold); color:var(--text-secondary); text-align:center; margin-bottom:var(--space-8);">${escapeHtml(s.target)}</div>` : ""}
        ${s.desc ? `<div style="font-size:var(--text-md); color:var(--text-tertiary); font-weight: var(--fw-medium); text-align:center;">${escapeHtml(s.desc)}</div>` : ""}
      </div>

      <div class="card-group-timer">
        <div style="font-size: var(--typo-counter); color: var(--text-brand-accent); text-align:center;"><span style="font-family: 'Panchang', -apple-system, sans-serif; font-weight: 800;">${s.reps}</span><span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: var(--fw-black); font-size: 0.75em; margin-left: 6px;">개</span></div>
      </div>

      <div class="card-group-footer">
        <button class="btn-lg btn-primary" style="width:100%;" onclick="window.nextStep()">세트 완료 ✓</button>
      </div>`;
  }

  const prevText = prevEx ? `← 이전 세트 ( ${escapeHtml(prevEx.name)} )`: '← 이전';
  const nextText = nextEx ? `건너뛰기 ( ${escapeHtml(nextEx.name)} ) →` : '건너뛰기 →';

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-12); width:100%;">
      <div style="font-size:var(--typo-display-sm); font-weight:var(--fw-medium); color:var(--text-brand-accent);">${currentExerciseIndex} of ${totalExerciseSteps}</div>
      <div style="font-size:var(--typo-display-sm); font-weight:var(--fw-medium); color:var(--text-tertiary);">${escapeHtml(routine.name)}</div>
      <div style="display:flex; gap:12px;">
        <button class="btn-xs btn-tertiary btn-icon" onclick="window.toggleSound()">${state.soundEnabled ? "🔊" : "🔇"}</button>
        <button class="btn-xs btn-tertiary btn-icon" onclick="window.confirmExitPlay()">✕</button>
      </div>
    </div>
    <div class="progress-bar" style="margin-bottom:var(--space-16);">${segs}</div>
    <div class="card">
      ${body}
    </div>
    <div style="display:flex; justify-content:space-between; margin-top: var(--space-16);">
      <button class="btn-sm btn-tertiary" onclick="window.prevStep()">${prevText}</button>
      <button class="btn-sm btn-tertiary" onclick="window.skipStep()">${nextText}</button>
    </div>`;
}
