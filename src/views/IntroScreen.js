import { state } from '../store/state.js';
import { escapeHtml, renderAvatarHtml } from '../utils/helpers.js';
import { estimateMinutes } from '../utils/format.js';
import { renderList } from './ListScreen.js';

export function renderIntro() {
  const r = state.routines[state.currentId];
  if (!r) { state.screen = "list"; return renderList(); }

  const exerciseSteps = r.steps.filter(s => s.type !== 'transition');
  const segs = exerciseSteps.map(() => '<div class="progress-seg"></div>').join('');

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-12); width:100%;">
      <div style="font-size:var(--typo-display-sm); font-weight:var(--fw-medium); color:var(--text-brand-accent);">0 of ${exerciseSteps.length}</div>
      <div style="font-size:var(--typo-display-sm); font-weight:var(--fw-medium); color:var(--text-tertiary);">${escapeHtml(r.name)}</div>
      <div style="display:flex; gap:12px;">
        <button class="btn-xs btn-tertiary btn-icon" onclick="window.toggleSound()">${state.soundEnabled ? "🔊" : "🔇"}</button>
        <button class="btn-xs btn-tertiary btn-icon" onclick="window.goScreen('list')">✕</button>
      </div>
    </div>
    <div class="progress-bar" style="margin-bottom:var(--space-16);">${segs}</div>
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
        ${r.desc ? `
          <div style="font-size:var(--text-sm); color:var(--text-secondary); margin-top:var(--space-6); text-align:center; line-height:1.4;">
            ${escapeHtml(r.desc)}
          </div>
        ` : ''}
      </div>

      <div class="card-group-body">
        <div class="intro-list">
          <div class="intro-list-item">총 <b>${exerciseSteps.length}단계</b>, 약 <b>${estimateMinutes(r)}분</b></div>
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
