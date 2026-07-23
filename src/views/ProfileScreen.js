import { state } from '../store/state.js';
import { escapeHtml, renderAvatarHtml } from '../utils/helpers.js';

export function renderProfile() {
  const p = state.userProfile || { display_name: "", avatar_url: "" };
  return `
    <div style="padding-bottom:var(--space-60);">
      <div class="card-fit" style="text-align:left; padding:24px; margin-bottom:16px; background:#ffffff; border-radius:24px; border:1px solid var(--border-base);">
        <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px;">
          <div style="position:relative; flex-shrink:0;">
            <div id="avatarPreviewContainer" style="width:93px; height:93px; border-radius:50%; overflow:hidden; border:2px solid #00c6b8; display:flex; align-items:center; justify-content:center;">
              ${renderAvatarHtml(p.avatar_url, 93)}
            </div>
            <label for="avatarUpload" style="position:absolute; bottom:0; right:0; background:#00c6b8; color:#fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">📷</label>
            <input type="file" id="avatarUpload" accept="image/*" style="display:none;" onchange="window.uploadAvatar(event)" />
            <input type="hidden" id="profAvatar" value="${escapeHtml(p.avatar_url)}" />
          </div>
          <div style="flex:1;">
            <label style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:4px;">닉네임<span class="lbl-req">*</span></label>
            <input id="profName" type="text" class="form-input-text" placeholder="닉네임을 입력하세요" value="${escapeHtml(p.display_name)}" />
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          ${state.userProfile && state.userProfile.display_name ? `<button class="btn-xs btn-warning" onclick="window.resetProfile()">프로필 초기화 하기</button>` : ''}
          <button class="btn-xs btn-secondary" onclick="window.saveProfile()">변경사항 저장하기</button>
        </div>
      </div>
      
      <div class="card-fit" style="text-align:left; padding:24px; background:#ffffff; border-radius:24px; border:1px solid var(--border-base);">
        <div style="font-size:18px; font-weight:var(--fw-black); color:var(--text-primary); margin-bottom:12px;">로그인된 계정</div>
        <p style="font-size:18px; font-weight:var(--fw-bold); color:var(--text-primary); margin-bottom:20px;">${state.user ? escapeHtml(state.user.email) : ''}</p>
        
        <label style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:4px;">비밀번호 변경</label>
        <input id="profNewPassword" type="password" class="form-input-text" style="margin-bottom:16px;" placeholder="새 비밀번호 입력 (6자리 이상)" />
        <div style="display:flex; justify-content:flex-end;">
          <button class="btn-xs btn-secondary" onclick="window.handleProfileUpdatePassword()">변경하기</button>
        </div>
      </div>
    </div>`;
}
