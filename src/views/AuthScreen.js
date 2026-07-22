import { state } from '../store/state.js';

export function renderAuth() {
  const isLogin = state.authMode !== 'signup';
  return `
    <div class="auth-container" style="width:100%; margin:0 auto;">
      <button class="btn-md btn-tertiary" onclick="window.goScreen('list')" style="margin-bottom:var(--space-20); display:flex; align-items:center; gap:var(--space-6); padding:0;">
        ← 목록으로 돌아가기
      </button>
      <div class="card" style="text-align:left; padding:var(--space-30) var(--space-24);">
        <div style="text-align:center; margin-bottom:var(--space-26);">
          <h2 style="font-size: var(--text-2xl); font-weight: var(--fw-black); color:var(--text-primary); margin-bottom:var(--space-8);">${isLogin ? '로그인' : '회원가입'}</h2>
          <p style="font-size: var(--text-sm); color:var(--text-secondary); font-weight: var(--fw-bold); line-height:1.45;">${isLogin ? '루틴과 기록을 기기 간에 동기화하세요' : '새 계정을 만들고 기록을 안전하게 보관하세요'}</p>
        </div>

        <label style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:4px;">이메일 주소</label>
        <input id="authEmail" type="email" placeholder="email@example.com" class="form-input-text" style="margin-bottom:var(--space-16);" value="${state.authEmail || localStorage.getItem('savedEmail') || ''}" onkeydown="if(event.key === 'Enter') window.handleAuthSubmit()" />

        <label style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:4px;">비밀번호</label>
        <input id="authPassword" type="password" placeholder="••••••••" class="form-input-text" style="margin-bottom:var(--space-24);" onkeydown="if(event.key === 'Enter') window.handleAuthSubmit()" />

        <button onclick="window.handleAuthSubmit()" class="btn-lg btn-primary" style="width:100%; margin-bottom:var(--space-16);">${isLogin ? '로그인' : '회원가입'}</button>

        <div style="display:flex; justify-content:space-between; font-size:var(--text-sm);">
          <button class="btn-sm btn-tertiary" onclick="state.authMode = '${isLogin ? 'signup' : 'login'}'; window.render();">${isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}</button>
          ${isLogin ? `<button class="btn-sm btn-tertiary" onclick="window.handleResetPasswordPrompt()">비밀번호 찾기</button>` : ''}
        </div>
      </div>
    </div>`;
}

export function renderResetPassword() {
  return `
    <div class="auth-container" style="width:100%; margin:0 auto;">
      <button class="btn-md btn-tertiary" onclick="window.goScreen('list')" style="margin-bottom:var(--space-20); display:flex; align-items:center; gap:var(--space-6); padding:0;">
        ← 목록으로 돌아가기
      </button>
      <div class="card" style="text-align:left; padding:var(--space-30) var(--space-24);">
        <div style="text-align:center; margin-bottom:var(--space-26);">
          <h2 style="font-size: var(--text-2xl); font-weight: var(--fw-black); color:var(--text-primary); margin-bottom:var(--space-8);">새 비밀번호 설정</h2>
          <p style="font-size: var(--text-sm); color:var(--text-secondary); font-weight: var(--fw-bold); line-height:1.45;">새롭게 사용할 비밀번호를 입력해 주세요.</p>
        </div>

        <label style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary); display:block; margin-bottom:4px;">새 비밀번호 (6자리 이상)</label>
        <input id="newPassword" type="password" placeholder="••••••••" class="form-input-text" style="margin-bottom:var(--space-24);" onkeydown="if(event.key === 'Enter') window.handleUpdatePassword()" />

        <button onclick="window.handleUpdatePassword()" class="btn-lg btn-primary" style="width:100%;">비밀번호 변경 완료</button>
      </div>
    </div>`;
}
