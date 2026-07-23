import { getSfSymbol } from '../utils/icons.js';
import { state } from '../store/state.js';
import { escapeHtml } from '../utils/helpers.js';

export function renderHeader() {
  let userStatusHtml = "";
  if (state.user) {
    userStatusHtml = `
      <div style="display:flex; align-items:center; gap:var(--space-8);">
        <span class="header-status" title="계정: ${escapeHtml(state.user.email)}">
          <span style="display:inline-block; width:6px; height:6px; background:var(--accent-color); border-radius:50%;"></span>
          루틴과 기록 동기화 중
        </span>
        <button class="btn-xs btn-secondary" onclick="window.goScreen('profile')" style="margin-right:var(--space-4);">프로필</button>
        <button class="btn-xs btn-secondary" onclick="window.handleLogout()">로그아웃</button>
      </div>`;
  } else {
    userStatusHtml = `
      <button class="btn-xs btn-secondary" onclick="window.goScreen('auth')">로그인 / 회원가입</button>`;
  }

  return `
    <div class="global-top-bar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-18); padding-bottom:var(--space-12); border-bottom:1px solid rgba(255,140,90,0.08);">
      <div class="logo-title" style="font-size:19px; font-weight: var(--fw-black); background:var(--brand-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent; cursor:pointer; letter-spacing:-0.5px;" onclick="window.goScreen('list')">Hey Rutii</div>
      <div class="user-status-area">
        ${userStatusHtml}
      </div>
    </div>`;
}
