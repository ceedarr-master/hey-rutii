import { getSfSymbol } from './icons.js';
import { state } from '../store/state.js';

export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

export function escapeAttr(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

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
  showConfirmModal({
    icon: '❓',
    title: '확인',
    message: message,
    confirmText: '확인',
    cancelText: '취소',
    onConfirm: onConfirm
  });
}

export function formatDuration(totalSec) {
  if (!totalSec || totalSec <= 0) return '0초';
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0 && s > 0) return `${m}분 ${s}초`;
  if (m > 0) return `${m}분`;
  return `${s}초`;
}

function getOrCreateTooltip() {
  let tooltip = document.getElementById('custom-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'custom-tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

export function initTooltipListeners() {
  if (typeof window === 'undefined' || window.__tooltip_listeners_attached) return;
  window.__tooltip_listeners_attached = true;

  const show = (target) => {
    const content = target.getAttribute('data-tooltip');
    if (!content) return;
    const tooltip = getOrCreateTooltip();
    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    const rect = target.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
    tooltip.style.top = rect.top + 'px';
  };

  const hide = () => {
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (target) show(target);
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (target) hide();
  });

  document.addEventListener('mousemove', (e) => {
    const target = e.target.closest('[data-tooltip]');
    const tooltip = document.getElementById('custom-tooltip');
    if (target && tooltip && tooltip.style.display === 'block') {
      const rect = target.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = rect.top + 'px';
    }
  });
}

// Auto-run listener initialization upon module import
initTooltipListeners();
export function showConfirmModal({ icon = getSfSymbol('questionmark.circle', 36, 'var(--text-brand-accent)'), title, message, confirmText = '확인', cancelText = '취소', isDanger = false, onConfirm }) {
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

export function showPromptModal({
  icon = getSfSymbol('stopwatch', 36, 'var(--text-brand-accent)'),
  title,
  message,
  defaultValue = '15',
  placeholder = '',
  inputType = 'number',
  unitLabel = '초',
  confirmText = '확인',
  cancelText = '취소',
  onConfirm
}) {
  const existing = document.getElementById('common-modal-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'common-modal-backdrop';
  backdrop.className = 'modal-backdrop';

  const inputStyle = inputType === 'text'
    ? 'font-size: 18px; text-align: center; width: 100%; text-transform: uppercase; letter-spacing: 2px;'
    : 'font-size: 24px; text-align: center; width: 100px;';

  const unitHtml = unitLabel ? `<span style="font-size: 16px; font-weight: var(--fw-bold); color: var(--text-secondary);">${escapeHtml(unitLabel)}</span>` : '';

  backdrop.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon">${icon}</div>
      <div class="modal-title">${escapeHtml(title)}</div>
      <div class="modal-desc">${escapeHtml(message)}</div>
      <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <input id="modal-input-val" class="${inputType === 'text' ? 'form-input-text' : 'form-input-num'}" type="${inputType}" ${inputType === 'number' ? 'min="1"' : ''} value="${escapeAttr(defaultValue)}" placeholder="${escapeAttr(placeholder)}" style="${inputStyle}" />
        ${unitHtml}
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