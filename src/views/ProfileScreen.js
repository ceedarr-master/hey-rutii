import { state } from '../store/state.js';
import { escapeHtml, renderAvatarHtml } from '../utils/helpers.js';

export function renderProfile() {
  const p = state.userProfile || { display_name: "", avatar_url: "" };
  return `
    <div style="padding-bottom:var(--space-60);">
      <div class="card-fit" style="text-align:left; padding:var(--space-24); margin-bottom:var(--space-16); background:var(--bg-card); border-radius:var(--radius-xl); border:1px solid var(--border-base);">
        <div style="display:flex; align-items:center; gap:var(--space-20); margin-bottom:var(--space-20);">
          <div style="position:relative; flex-shrink:0;">
            <div id="avatarPreviewContainer" style="width:93px; height:93px; border-radius:50%; overflow:hidden; border:2px solid var(--border-accent); display:flex; align-items:center; justify-content:center;">
              ${renderAvatarHtml(p.avatar_url, 93)}
            </div>
            <label for="avatarUpload" style="position:absolute; bottom:0; right:0; background:var(--accent-color); color:var(--text-white); border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:var(--typo-body-xs); box-shadow:0 2px 6px rgba(0,0,0,0.15);">📷</label>
            <input type="file" id="avatarUpload" accept="image/*" style="display:none;" onchange="window.uploadAvatar(event)" />
            <input type="hidden" id="profAvatar" value="${escapeHtml(p.avatar_url)}" />
          </div>
          <div style="flex:1;">
            <label style="font-size:var(--typo-body-xs); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:var(--space-4);">닉네임<span class="lbl-req">*</span></label>
            <input id="profName" type="text" class="form-input-text" placeholder="닉네임을 입력하세요" value="${escapeHtml(p.display_name)}" />
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:var(--space-8);">
          ${state.userProfile && state.userProfile.display_name ? `<button class="btn-xs btn-warning" onclick="window.resetProfile()">프로필 초기화 하기</button>` : ''}
          <button class="btn-xs btn-secondary" onclick="window.saveProfile()">변경사항 저장하기</button>
        </div>
      </div>
      
      <div class="card-fit" style="text-align:left; padding:var(--space-24); background:var(--bg-card); border-radius:var(--radius-xl); border:1px solid var(--border-base);">
        <div style="font-size:var(--typo-display-lg); font-weight:var(--fw-black); color:var(--text-primary); margin-bottom:var(--space-12);">로그인된 계정</div>
        <p style="font-size:var(--typo-display-lg); font-weight:var(--fw-bold); color:var(--text-primary); margin-bottom:var(--space-20);">${state.user ? escapeHtml(state.user.email) : '로그인 정보 없음'}</p>
        
        <label style="font-size:var(--typo-body-xs); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:var(--space-4);">비밀번호 변경</label>
        <input id="profNewPassword" type="password" class="form-input-text" style="margin-bottom:var(--space-16);" placeholder="새 비밀번호 입력 (6자리 이상)" />
        <div style="display:flex; justify-content:flex-end;">
          <button class="btn-xs btn-secondary" onclick="window.handleProfileUpdatePassword()">변경하기</button>
        </div>

        ${state.user ? `
        <div style="margin-top:var(--space-24); padding-top:var(--space-16); border-top:1px solid var(--border-base); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:var(--typo-body-sm); font-weight:var(--fw-bold); color:var(--text-primary);">로그아웃</div>
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary);">이 기기에서 세션을 종료하고 로컬 데이터를 정돈합니다.</div>
          </div>
          <button class="btn-xs btn-danger" onclick="window.handleLogout()">로그아웃</button>
        </div>` : ''}
      </div>
    </div>`;
}
