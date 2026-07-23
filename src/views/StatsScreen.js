import { state } from '../store/state.js';
import { escapeHtml } from '../utils/helpers.js';

export function getHistoryLogs() {
  try {
    const raw = localStorage.getItem("routines:history");
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  const dates = Array.from(new Set(logs.map(l => {
    const d = new Date(l.completedAt);
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  })));
  
  let streak = 0;
  let checkDate = new Date();
  
  while (true) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()+1}-${checkDate.getDate()}`;
    if (dates.includes(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()+1}-${checkDate.getDate()}`;
        if (dates.includes(yesterdayKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}

function generateWeeklyChart(logs) {
  const weekOffset = state.statsWeekOffset || 0;
  const now = new Date();
  now.setDate(now.getDate() + (weekOffset * 7));
  const currentDay = now.getDay();
  const diffToMon = (currentDay === 0 ? -6 : 1 - currentDay);
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0,0,0,0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23,59,59,999);
  
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const minutesPerDay = [0, 0, 0, 0, 0, 0, 0];
  
  logs.forEach(l => {
    const d = new Date(l.completedAt);
    if (d >= monday && d <= sunday) {
      let dayIdx = d.getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;
      minutesPerDay[dayIdx] += Math.round((l.durationSeconds || 0) / 60);
    }
  });
  
  const maxMin = Math.max(...minutesPerDay, 30);
  
  const bars = minutesPerDay.map((min, idx) => {
    const heightPercent = Math.min(100, Math.round((min / maxMin) * 100));
    return `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
        <div style="font-size:11px; font-weight:var(--fw-bold); color:var(--text-secondary);">${min > 0 ? min + '분' : ''}</div>
        <div style="width:100%; height:100px; background:#edf8f6; border-radius:8px; display:flex; align-items:flex-end; overflow:hidden;">
          <div style="width:100%; height:${heightPercent}%; background:var(--brand-gradient); border-radius:8px; transition:height 0.3s ease;"></div>
        </div>
        <div style="font-size:12px; font-weight:var(--fw-bold); color:var(--text-primary);">${days[idx]}</div>
      </div>`;
  }).join('');
  
  const monStr = `${monday.getMonth()+1}/${monday.getDate()}`;
  const sunStr = `${sunday.getMonth()+1}/${sunday.getDate()}`;
  
  return `
    <div style="background:#ffffff; border-radius:20px; padding:20px; border:1px solid var(--border-base);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <button class="btn-xs btn-secondary" onclick="window.changeWeeklyChartWeek(-1)">← 이전 주</button>
        <span style="font-size:14px; font-weight:var(--fw-bold); color:var(--text-primary);">${monStr} ~ ${sunStr}</span>
        <button class="btn-xs btn-secondary" onclick="window.changeWeeklyChartWeek(1)" ${weekOffset >= 0 ? 'disabled' : ''}>다음 주 →</button>
      </div>
      <div style="display:flex; gap:8px; align-items:flex-end;">
        ${bars}
      </div>
    </div>`;
}

function generateCalendarGrid(logs) {
  const offset = state.statsCalendarOffset || 0;
  const now = new Date();
  now.setMonth(now.getMonth() + offset);
  
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  const completedDates = new Set();
  logs.forEach(l => {
    const d = new Date(l.completedAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      completedDates.add(d.getDate());
    }
  });
  
  const headers = ['일', '월', '화', '수', '목', '금', '토'].map(h => `<div class="cal-header">${h}</div>`).join('');
  
  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += `<div class="cal-day empty"></div>`;
  }
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  
  for (let date = 1; date <= lastDate; date++) {
    const isToday = isCurrentMonth && today.getDate() === date;
    const isDone = completedDates.has(date);
    let cls = 'cal-day';
    if (isDone) cls += ' completed';
    if (isToday) cls += ' today';
    
    cells += `
      <div class="${cls}">
        <span class="day-num">${date}</span>
        ${isDone ? '<span class="completed-check">✓</span>' : ''}
      </div>`;
  }
  
  return `
    <div style="background:#ffffff; border-radius:20px; padding:20px; border:1px solid var(--border-base);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <button class="btn-xs btn-secondary" onclick="window.changeCalendarMonth(-1)">← 이전 달</button>
        <span style="font-size:16px; font-weight:var(--fw-black); color:var(--text-primary);">${year}년 ${month + 1}월</span>
        <button class="btn-xs btn-secondary" onclick="window.changeCalendarMonth(1)" ${offset >= 0 ? 'disabled' : ''}>다음 달 →</button>
      </div>
      <div class="calendar-grid">
        ${headers}
        ${cells}
      </div>
    </div>`;
}

function generateRecentActivity(logs) {
  if (!logs || logs.length === 0) {
    return `<div class="empty-state">완료한 운동 기록이 없습니다.</div>`;
  }
  
  const page = state.activityPage || 0;
  const pageSize = 5;
  const totalPages = Math.ceil(logs.length / pageSize);
  const startIdx = page * pageSize;
  const pageLogs = logs.slice(startIdx, startIdx + pageSize);
  
  const items = pageLogs.map(l => {
    const d = new Date(l.completedAt);
    const dateStr = `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${d.getHours() < 10 ? '0':''}${d.getHours()}:${d.getMinutes() < 10 ? '0':''}${d.getMinutes()}`;
    const min = Math.round((l.durationSeconds || 0) / 60);
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f4faf8; border-radius:12px; margin-bottom:8px;">
        <div>
          <div style="font-size:15px; font-weight:var(--fw-bold); color:var(--text-primary);">${escapeHtml(l.routineName || '루틴')}</div>
          <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${dateStr}</div>
        </div>
        <div style="font-size:14px; font-weight:var(--fw-black); color:#00c6b8;">${min}분 완료</div>
      </div>`;
  }).join('');
  
  return `
    <div style="background:#ffffff; border-radius:20px; padding:20px; border:1px solid var(--border-base);">
      ${items}
      ${totalPages > 1 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
          <button class="btn-xs btn-secondary" onclick="window.changeActivityPage(-1)" ${page <= 0 ? 'disabled' : ''}>← 이전</button>
          <span style="font-size:12px; color:var(--text-secondary);">${page + 1} / ${totalPages} 페이지</span>
          <button class="btn-xs btn-secondary" onclick="window.changeActivityPage(1)" ${page >= totalPages - 1 ? 'disabled' : ''}>다음 →</button>
        </div>
      ` : ''}
    </div>`;
}

export function renderStats() {
  const allLogs = getHistoryLogs();
  
  const filterVal = state.statsFilter || "all";
  const logs = filterVal === "all" 
    ? allLogs 
    : allLogs.filter(l => l.routineId === filterVal);
  
  const totalCompleted = logs.length;
  let totalSeconds = 0;
  logs.forEach(l => totalSeconds += l.durationSeconds || 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  
  const streak = calculateStreak(logs);
  const chartHtml = generateWeeklyChart(logs);
  const calendarHtml = generateCalendarGrid(logs);
  const recentActivityHtml = generateRecentActivity(logs);

  const options = (state.routineOrder || []).map(id => {
    const r = state.routines[id];
    if (!r) return "";
    const isSelected = filterVal === id ? "selected" : "";
    return `<option value="${id}" ${isSelected}>${escapeHtml(r.name)}</option>`;
  }).join("");

  return `
    <div class="main-tabs">
      <button class="main-tab-btn" onclick="window.goScreen('list')">내 루틴</button>
      <button class="main-tab-btn active" onclick="window.goStatsTab()">통계</button>
    </div>
    
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px; background:#ffffff; border:1px solid var(--border-base); border-radius:16px; padding:12px 16px;">
      <label for="stats-routine-filter" style="font-weight:var(--fw-bold); font-size:14px; color:var(--text-secondary); white-space:nowrap;">📊 분석 대상:</label>
      <select id="stats-routine-filter" style="flex:1; border:none; background:transparent; font-size:16px; font-weight:var(--fw-black); color:#00c6b8; outline:none; cursor:pointer;" onchange="window.filterStatsByRoutine(this.value)">
        <option value="all" ${filterVal === "all" ? "selected" : ""}>전체 루틴 (통합)</option>
        ${options}
      </select>
    </div>
    
    <div class="stats-dashboard" style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; gap:12px;">
        <div style="flex:1; background:#ffffff; border:1px solid var(--border-base); border-radius:20px; padding:16px; text-align:center;">
          <div style="font-size:12px; color:var(--text-secondary); font-weight:var(--fw-bold);">총 완료</div>
          <div style="font-size:24px; font-weight:var(--fw-black); color:#00c6b8; margin-top:4px;">${totalCompleted}회</div>
        </div>
        <div style="flex:1; background:#ffffff; border:1px solid var(--border-base); border-radius:20px; padding:16px; text-align:center;">
          <div style="font-size:12px; color:var(--text-secondary); font-weight:var(--fw-bold);">누적 시간</div>
          <div style="font-size:24px; font-weight:var(--fw-black); color:#00c6b8; margin-top:4px;">${totalMinutes}분</div>
        </div>
        <div style="flex:1; background:#ffffff; border:1px solid var(--border-base); border-radius:20px; padding:16px; text-align:center;">
          <div style="font-size:12px; color:var(--text-secondary); font-weight:var(--fw-bold);">연속 일수</div>
          <div style="font-size:24px; font-weight:var(--fw-black); color:#00c6b8; margin-top:4px;">${streak}일</div>
        </div>
      </div>
      
      <div>
        <div style="font-size:14px; font-weight:var(--fw-black); color:var(--text-secondary); margin-bottom:8px;">📊 주간 운동 통계 (분)</div>
        ${chartHtml}
      </div>

      <div>
        <div style="font-size:14px; font-weight:var(--fw-black); color:var(--text-secondary); margin-bottom:8px;">📅 기록 달력</div>
        ${calendarHtml}
      </div>

      <div>
        <div style="font-size:14px; font-weight:var(--fw-black); color:var(--text-secondary); margin-bottom:8px;">⏱ 최근 활동 로그</div>
        ${recentActivityHtml}
      </div>
    </div>`;
}
