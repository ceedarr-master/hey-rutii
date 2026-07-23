import { state } from '../store/state.js';

export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

export function escapeAttr(str) { return escapeHtml(str); }

export function parseLogDate(l) {
  if (!l) return new Date();
  
  if (l.completedAt) {
    if (typeof l.completedAt === 'number') return new Date(l.completedAt);
    const parsed = new Date(l.completedAt);
    if (!isNaN(parsed.getTime())) return parsed;
    
    const cleaned = String(l.completedAt).replace(/\./g, '-');
    const parsedCleaned = new Date(cleaned);
    if (!isNaN(parsedCleaned.getTime())) return parsedCleaned;
  }
  
  if (l.date) {
    const parsed = new Date(l.date);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  if (l.id && !isNaN(Number(l.id)) && Number(l.id) > 1000000000000) {
    return new Date(Number(l.id));
  }

  return new Date();
}

export function renderAvatarHtml(avatar, sizePx = 64) {
  if (!avatar || avatar === "👤") {
    return `<div style="width:${sizePx}px; height:${sizePx}px; border-radius:50%; background:#def7f2; display:inline-flex; align-items:center; justify-content:center;">
      <svg width="${sizePx * 0.5}" height="${sizePx * 0.5}" viewBox="0 0 24 24" fill="none" stroke="#00c6b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </div>`;
  }
  if (avatar.startsWith("http")) {
    return `<img src="${escapeHtml(avatar)}" style="width:${sizePx}px; height:${sizePx}px; border-radius:50%; object-fit:cover;" />`;
  }
  return `<div style="font-size:${sizePx * 0.8}px; line-height:${sizePx}px;">${escapeHtml(avatar)}</div>`;
}

export function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export function showConfirm(message, onConfirm) {
  if (confirm(message)) {
    onConfirm();
  }
}

export function initTooltipListeners() {
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip]');
    const tooltip = document.getElementById('custom-tooltip');
    if (target && tooltip) {
      tooltip.innerHTML = target.getAttribute('data-tooltip');
      tooltip.style.opacity = '1';
      const rect = target.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = (rect.top - 8) + 'px';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tooltip]');
    const tooltip = document.getElementById('custom-tooltip');
    if (target && tooltip) {
      tooltip.style.opacity = '0';
    }
  });
}

export function showConfirmModal({ icon = '❓', title, message, confirmText = '확인', cancelText = '취소', isDanger = false, onConfirm }) {
  const existing = document.getElementById('common-modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'common-modal-backdrop';
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon">${icon}</div>
      <div class="modal-title">${escapeHtml(title)}</div>
      <div class="modal-desc">${escapeHtml(message)}</div>
      <div class="modal-btn-row">
        <button class="btn-md btn-tertiary btn-flex" id="modal-cancel-btn">${escapeHtml(cancelText)}</button>
        <button class="btn-md ${isDanger ? 'btn-danger' : 'btn-primary'} btn-flex" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.querySelector('#modal-cancel-btn').onclick = close;
  backdrop.querySelector('#modal-confirm-btn').onclick = () => {
    close();
    if (onConfirm) onConfirm();
  };
  backdrop.onclick = (e) => {
    if (e.target === backdrop) close();
  };
}

export function showPromptModal({ icon = '⏳', title, message, defaultValue = '15', confirmText = '추가하기', cancelText = '취소', onConfirm }) {
  const existing = document.getElementById('common-modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'common-modal-backdrop';
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon">${icon}</div>
      <div class="modal-title">${escapeHtml(title)}</div>
      <div class="modal-desc">${escapeHtml(message)}</div>
      <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <input id="modal-input-val" class="form-input-num" type="number" min="1" value="${escapeAttr(defaultValue)}" style="font-size: 24px; text-align: center; width: 100px;" />
        <span style="font-size: 16px; font-weight: var(--fw-bold); color: var(--text-secondary);">초</span>
      </div>
      <div class="modal-btn-row">
        <button class="btn-md btn-tertiary btn-flex" id="modal-cancel-btn">${escapeHtml(cancelText)}</button>
        <button class="btn-md btn-primary btn-flex" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const inputEl = backdrop.querySelector('#modal-input-val');
  if (inputEl) setTimeout(() => inputEl.focus(), 100);

  const close = () => backdrop.remove();
  backdrop.querySelector('#modal-cancel-btn').onclick = close;
  backdrop.querySelector('#modal-confirm-btn').onclick = () => {
    const val = inputEl ? inputEl.value : defaultValue;
    close();
    if (onConfirm) onConfirm(val);
  };
  backdrop.onclick = (e) => {
    if (e.target === backdrop) close();
  };
}
