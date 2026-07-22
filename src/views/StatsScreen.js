import { state } from '../store/state.js';
import { escapeHtml } from '../utils/helpers.js';

export function getHistoryLogs() {
  try {
    const raw = localStorage.getItem("routines:history");
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

export function renderStats() {
  const allLogs = getHistoryLogs();
  const filterVal = state.statsFilter || "all";
  const logs = filterVal === "all" ? allLogs : allLogs.filter(l => l.routineId === filterVal);
  const totalCompleted = logs.length;
  let totalSeconds = 0;
  logs.forEach(l => totalSeconds += l.durationSeconds);
  const totalMinutes = Math.round(totalSeconds / 60);

  return `
    <div class="main-tabs">
      <button class="main-tab-btn" onclick="window.goScreen('list')">내 루틴</button>
      <button class="main-tab-btn active" onclick="window.goStatsTab()">통계</button>
    </div>
    <div style="font-size:22px; font-weight:var(--fw-black); color:var(--text-primary); margin-bottom:16px;">운동 통계 & 기록</div>
    <div class="card" style="text-align:center; padding:24px; background:#ffffff; border-radius:24px; border:1px solid var(--border-base);">
      <div style="display:flex; justify-content:space-around;">
        <div>
          <div style="font-size:32px; font-weight:var(--fw-black); color:#00c6b8;">${totalCompleted}회</div>
          <div style="font-size:var(--text-sm); color:var(--text-secondary);">총 완료 세트</div>
        </div>
        <div>
          <div style="font-size:32px; font-weight:var(--fw-black); color:#00c6b8;">${totalMinutes}분</div>
          <div style="font-size:var(--text-sm); color:var(--text-secondary);">총 운동 시간</div>
        </div>
      </div>
    </div>`;
}
