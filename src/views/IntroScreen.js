import { state } from '../store/state.js';
import { escapeHtml, renderAvatarHtml } from '../utils/helpers.js';
import { estimateMinutes } from '../utils/format.js';
import { renderList } from './ListScreen.js';

export function renderIntro() {
  const r = state.routines[state.currentId];
  if (!r) { state.screen = "list"; return renderList(); }
  return `
    <div class="card">
      <div class="card-group-header">
        <div class="intro-emoji">🧘</div>
        ${r.original_author ? `
          <div style="font-size:var(--text-sm); color:var(--text-tertiary); display:flex; align-items:center; justify-content:center; gap:var(--space-6); margin-bottom:var(--space-4);">
            <span style="display:inline-flex; align-items:center;">${renderAvatarHtml(r.original_author.avatar, 18)}</span>
            <span>${escapeHtml(r.original_author.name || '알 수 없음')}님의 루틴${r.is_modified ? '을 바탕으로 제작' : ''}</span>
          </div>
        ` : ''}
        <div class="intro-title">${escapeHtml(r.name)}</div>
      </div>

      <div class="card-group-body">
        <div class="intro-list">
          <div class="intro-list-item">총 <b>${r.steps.filter(s => s.type !== 'transition').length}단계</b>, 약 <b>${estimateMinutes(r)}분</b></div>
          <div class="intro-list-item">⏱ 시간 진행 단계는 자동 카운트다운 + 종료 시 알림음</div>
          <div class="intro-list-item">🔢 횟수 진행 단계는 직접 "다음" 버튼으로 넘기기</div>
        </div>
      </div>

      <div class="card-group-footer" style="display:flex; flex-direction:column; gap:var(--space-10);">
        <button class="btn-lg btn-primary" onclick="window.startPlay()">시작하기</button>
        <button class="btn-sm btn-tertiary" onclick="window.goScreen('list')">← 돌아가기</button>
      </div>
    </div>`;
}
