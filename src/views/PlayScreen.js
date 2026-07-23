import { state } from '../store/state.js';
import { escapeHtml } from '../utils/helpers.js';
import { fmt } from '../utils/format.js';
import { renderList } from './ListScreen.js';

export function renderDone(routine) {
  return `
    <div class="card" style="text-align:center; padding:var(--space-30) var(--space-20);">
      <div style="font-size:64px; margin-bottom:var(--space-16);">🎉</div>
      <h2 style="font-size:var(--text-2xl); font-weight:var(--fw-black); color:var(--text-primary); margin-bottom:var(--space-8);">수고하셨습니다!</h2>
      <p style="font-size:var(--text-base); color:var(--text-secondary); font-weight:var(--fw-bold); margin-bottom:var(--space-24);">"${escapeHtml(routine.name)}" 루틴을 완료했습니다.</p>
      <div style="display:flex; gap:var(--space-10);">
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
  const segs = routine.steps.map((_, i) => {
    let cls = "progress-seg";
    if (i < state.play.current) cls += " done";
    else if (i === state.play.current) cls += " current";
    return `<div class="${cls}"></div>`;
  }).join("");

  const prevEx = state.play.current > 0 ? routine.steps[state.play.current - 1] : null;
  const nextEx = state.play.current < routine.steps.length - 1 ? routine.steps[state.play.current + 1] : null;
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
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:var(--space-16);">
        <span class="badge" style="background:#def7f2; color:#00c6b8; font-weight:var(--fw-bold); border-radius:20px; padding:6px 12px;">✓ ${s.type === 'transition' ? '준비' : '휴식 중'}</span>
        ${setTrackHtml}
      </div>
      <div style="font-size:var(--text-base); color:var(--text-secondary); margin-bottom:4px; text-align:center;">${escapeHtml(s.name)}</div>
      <div style="font-size:36px; font-weight:var(--fw-black); color:var(--text-primary); text-align:center; margin-bottom:4px;">트랜지션</div>
      <div style="font-size:var(--text-base); color:var(--text-secondary); text-align:center; margin-bottom: var(--space-16);">다음 세트를 준비하세요</div>
      <div class="typo-highlight-timer">${fmt(state.play.remaining)}</div>
      <button class="btn-lg btn-secondary" style="width:100%;" onclick="window.nextStep()">바로 시작</button>`;
  } else if (s.type === "timer") {
    if (!state.play.remaining) state.play.remaining = s.seconds;
    body = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:var(--space-16);">
        <span class="badge" style="background:#def7f2; color:#00c6b8; font-weight:var(--fw-bold); border-radius:20px; padding:6px 12px;">⏱ 시간 진행</span>
        ${setTrackHtml}
      </div>
      <div style="font-size:28px; font-weight:var(--fw-black); color:var(--text-primary); text-align:center; margin-bottom:4px;">${escapeHtml(s.name)}</div>
      ${s.target ? `<div style="font-size:var(--text-base); font-weight:var(--fw-bold); color:var(--text-secondary); text-align:center; margin-bottom:8px;">${escapeHtml(s.target)}</div>` : ""}
      ${s.desc ? `<div style="font-size:var(--text-sm); color:var(--text-secondary); text-align:center; margin-bottom:16px;">${escapeHtml(s.desc)}</div>` : ""}
      <div class="typo-highlight-timer" style="font-size:64px; font-weight:900; color:#00c6b8; margin:20px 0; text-align:center;">${fmt(state.play.remaining)}</div>
      <div class="btn-row">
        <button class="btn-lg btn-secondary btn-flex" onclick="window.togglePause()">${state.play.paused ? "▶ 시작" : "⏸ 일시정지"}</button>
        <button class="btn-lg btn-primary btn-flex" onclick="window.nextStep()">다음 →</button>
      </div>`;
  } else {
    body = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:var(--space-16);">
        <span class="badge" style="background:#def7f2; color:#00c6b8; font-weight:var(--fw-bold); border-radius:20px; padding:6px 12px;">✓ 횟수 진행</span>
        ${setTrackHtml}
      </div>
      <div style="font-size: var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-primary); text-align:center; margin-bottom: var(--space-8);">${escapeHtml(s.name)}</div>
      ${s.target ? `<div style="font-size:var(--text-base); font-weight:var(--fw-bold); color:var(--text-secondary); text-align:center; margin-bottom:var(--space-8);">${escapeHtml(s.target)}</div>` : ""}
      ${s.desc ? `<div style="font-size:var(--text-md); color:var(--text-tertiary); font-weight: var(--fw-medium); text-align:center; margin-bottom:var(--space-16);">${escapeHtml(s.desc)}</div>` : ""}
      <div style="font-size: var(--typo-counter); font-weight:var(--fw-black); color: var(--text-brand-accent); text-align:center; margin: var(--space-20) 0;">${s.reps} 개</div>
      <button class="btn-lg btn-primary" style="width:100%;" onclick="window.nextStep()">세트 완료 ✓</button>`;
  }

  const prevText = prevEx ? `← 이전 세트 ( ${escapeHtml(prevEx.name)} )`: '← 이전';
  const nextText = nextEx ? `건너뛰기 ( ${escapeHtml(nextEx.name)} ) →` : '건너뛰기 →';

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-12); width:100%;">
      <div style="font-size:var(--typo-display-sm); font-weight:var(--fw-medium); color:var(--text-brand-accent);">${state.play.current + 1} of ${routine.steps.length}</div>
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
      <button class="btn-sm btn-tertiary" onclick="window.nextStep()">${nextText}</button>
    </div>`;
}
