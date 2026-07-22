import { state } from '../store/state.js';

export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

export function escapeAttr(str) { return escapeHtml(str); }

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
