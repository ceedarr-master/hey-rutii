import { getSfSymbol } from '../utils/icons.js';
import { state } from '../store/state.js';
import { escapeHtml, renderAvatarHtml } from '../utils/helpers.js';
import { estimateMinutes } from '../utils/format.js';

export function renderList() {
  let cards = "";
  if (state.routineOrder.length === 0) {
    cards = `<div class="empty-state">아직 만든 루틴이 없어요.<br/>새 루틴을 만들어보세요!</div>`;
  } else {
    cards = state.routineOrder.map(id => {
      const r = state.routines[id];
      if (!r) return "";
      return `
        <div class="routine-card">
          <div class="routine-card-top" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div onclick="window.goIntro('${id}')" style="flex:1;cursor:pointer;">
              ${r.original_author ? `
                <div style="font-size:var(--text-xs); color:var(--text-secondary); display:flex; align-items:center; gap:var(--space-4); margin-bottom:var(--space-2);">
                  <span style="display:inline-flex; align-items:center;">${renderAvatarHtml(r.original_author.avatar, 14)}</span>
                  <span>${escapeHtml(r.original_author.name || '알 수 없음')}님의 루틴${r.is_modified ? '을 바탕으로 제작' : ''}</span>
                </div>
              ` : ''}
              <div class="routine-name">${escapeHtml(r.name)}</div>
              <div class="routine-meta">
                ${r.steps.filter(s => s.type !== 'transition').length}단계 • 약 ${estimateMinutes(r)}분
              </div>
            </div>
            <div class="icon-btns" style="display:flex; gap:8px;">
              <button class="btn-xs btn-secondary btn-icon" onclick="window.goEditRoutine('${id}')" title="루틴 수정">${getSfSymbol("pencil", 14, "var(--text-secondary)")}</button>
              <button class="btn-xs btn-secondary btn-icon" onclick="window.shareRoutine('${id}')" title="루틴 공유하기">${getSfSymbol("square.and.arrow.up", 14, "var(--text-secondary)")}</button>
            </div>
          </div>
          ${(state.routines[id] && state.routines[id].progress) 
    ? `<div style="display:flex; gap:var(--space-8); margin-top:var(--space-16);">
         <button class="btn-md btn-secondary btn-flex" onclick="window.confirmResetAndStart('${id}')">처음부터 시작</button>
         <button class="btn-md btn-primary btn-flex" onclick="window.resumePlay('${id}')">이어서 하기 ▶</button>
       </div>`
    : `<button class="btn-md btn-primary" style="width:100%; margin-top:var(--space-16);" onclick="window.goIntro('${id}')">시작하기</button>`}
        </div>`;
    }).join("");
  }
  const nameDisplay = (state.userProfile && state.userProfile.display_name) ? escapeHtml(state.userProfile.display_name) : '나';
  return `
    <div class="main-tabs">
      <button class="main-tab-btn active" onclick="window.goScreen('list')">내 루틴</button>
      <button class="main-tab-btn" onclick="window.goStatsTab()">통계</button>
    </div>
    <div style="display:flex; align-items:center; gap: var(--space-10); margin-bottom:4px;">
      ${state.userProfile && state.userProfile.display_name ? renderAvatarHtml(state.userProfile.avatar_url, 32) : ''}
      <div style="font-size: var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-primary);">${nameDisplay}의 루틴</div>
    </div>
    <div style="font-size:var(--typo-display-md); color:var(--text-secondary); margin-bottom:var(--space-16);">저장된 루틴을 선택하거나 새로 만들어 보세요</div>
    <button class="btn-md btn-outlined" style="width:100%; margin-bottom:var(--space-12);" onclick="window.goNewRoutine()">+ 새 루틴 만들기</button>
    ${cards}`;
}
