import { getSfSymbol } from '../utils/icons.js';
import { state } from '../store/state.js';
import { escapeHtml, escapeAttr, parseLogDate, formatDuration } from '../utils/helpers.js';

export function getHistoryLogs() {
  try {
    const raw = localStorage.getItem("routines:history");
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function calculateStreak(logs) {
  if (!logs || logs.length === 0) return 0;
  const dates = Array.from(new Set(logs.map(l => {
    const d = parseLogDate(l);
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
  const dayLogsMap = [[], [], [], [], [], [], []];
  
  logs.forEach(l => {
    const d = parseLogDate(l);
    if (d >= monday && d <= sunday) {
      let dayIdx = d.getDay() - 1;
      if (dayIdx === -1) dayIdx = 6;
      dayLogsMap[dayIdx].push(l);
    }
  });
  
  const minutesPerDay = dayLogsMap.map(dayLogs => {
    return dayLogs.reduce((sum, l) => sum + Math.round((l.durationSeconds || 0) / 60), 0);
  });
  
  const maxMin = Math.max(...minutesPerDay, 30);
  
  const bars = minutesPerDay.map((min, idx) => {
    const heightPercent = Math.min(100, Math.round((min / maxMin) * 100));
    const dayLogs = dayLogsMap[idx];
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + idx);
    const dateStr = `${targetDate.getFullYear()}.${targetDate.getMonth()+1}.${targetDate.getDate()}`;
    
    let tooltipHtml = `<div style="font-size:11px; color:#9cb3b0; margin-bottom:4px; font-weight:600; text-align:left;">${dateStr} (${days[idx]})</div>`;
    if (dayLogs.length === 0) {
      tooltipHtml += `<div style="color:#6e8d89; font-size:13px;">운동 기록 없음</div>`;
    } else {
      const rows = dayLogs.map(l => {
        return `<div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:2px; font-size:13px;"><span style="color:#ffffff;">${escapeHtml(l.routineName || '루틴')}</span><span style="color:#46efc5; font-weight:800;">${formatDuration(l.durationSeconds)}</span></div>`;
      }).join('');
      tooltipHtml += rows;
    }

    return `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
        <div style="font-size:11px; font-weight:var(--fw-bold); color:var(--text-secondary);">${min > 0 ? min + '분' : ''}</div>
        <div style="width:100%; height:100px; background:#edf8f6; border-radius:8px; display:flex; align-items:flex-end; overflow:hidden; cursor:pointer;" data-tooltip="${escapeAttr(tooltipHtml)}">
          <div style="width:100%; height:${heightPercent}%; background:var(--brand-gradient); border-radius:8px; transition:height 0.3s ease; pointer-events:none;"></div>
        </div>
        <div style="font-size:12px; font-weight:var(--fw-bold); color:var(--text-primary);">${days[idx]}</div>
      </div>`;
  }).join('');
  
  const monStr = `${monday.getMonth()+1}/${monday.getDate()}`;
  const sunStr = `${sunday.getMonth()+1}/${sunday.getDate()}`;
  
  return `
    <div class="card-fit">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <button class="btn-xs btn-tertiary" onclick="window.changeWeeklyChartWeek(-1)">←</button>
        <span style="font-size: var(--typo-body-sm); font-weight:var(--fw-bold); color:var(--text-primary);">${monStr} ~ ${sunStr}</span>
        <button class="btn-xs btn-secondary-tertiary" onclick="window.changeWeeklyChartWeek(1)" ${weekOffset >= 0 ? 'disabled' : ''}>→</button>
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
  
  const dayLogsMap = {};
  logs.forEach(l => {
    const d = parseLogDate(l);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dateNum = d.getDate();
      if (!dayLogsMap[dateNum]) dayLogsMap[dateNum] = [];
      dayLogsMap[dateNum].push(l);
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
    const dayLogs = dayLogsMap[date] || [];
    const isDone = dayLogs.length > 0;
    
    let cls = 'cal-day';
    if (isDone) cls += ' completed';
    if (isToday) cls += ' today';
    
    let tooltipAttr = '';
    if (isDone) {
      const dateStr = `${year}.${month + 1}.${date}`;
      const rows = dayLogs.map(l => `<div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:2px; font-size:13px;"><span style="color:#ffffff;">${escapeHtml(l.routineName || '루틴')}</span><span style="color:#46efc5; font-weight:800;">${formatDuration(l.durationSeconds)}</span></div>`).join('');
      const tooltipHtml = `<div style="font-size:11px; color:#9cb3b0; margin-bottom:4px; font-weight:600; text-align:left;">${dateStr} (완료 ${dayLogs.length}회)</div>${rows}`;
      tooltipAttr = `data-tooltip="${escapeAttr(tooltipHtml)}" style="cursor:pointer;"`;
    }

    cells += `
      <div class="${cls}" ${tooltipAttr}>
        <span class="day-num">${date}</span>
        ${isDone ? '<span class="completed-check">✓</span>' : ''}
      </div>`;
  }
  
  return `
    <div class="card-fit">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <button class="btn-xs btn-tertiary" onclick="window.changeCalendarMonth(-1)">←</button>
        <span class="stat-title">${year}년 ${month + 1}월</span>
        <button class="btn-xs btn-tertiary" onclick="window.changeCalendarMonth(1)" ${offset >= 0 ? 'disabled' : ''}>→</button>
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
  
  const pageSize = 5;
  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  let page = state.activityPage || 0;
  if (page >= totalPages) {
    page = Math.max(0, totalPages - 1);
    state.activityPage = page;
  }
  const startIdx = page * pageSize;
  const pageLogs = logs.slice(startIdx, startIdx + pageSize);
  
  const items = pageLogs.map((l, idx) => {
    const d = parseLogDate(l);
    const logId = String(l.id || l.completedAt || '');
    const dateStr = `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} ${d.getHours() < 10 ? '0':''}${d.getHours()}:${d.getMinutes() < 10 ? '0':''}${d.getMinutes()}`;
    const durStr = formatDuration(l.durationSeconds);
    const isLast = idx === pageLogs.length - 1;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; ${!isLast ? 'margin-bottom: var(--space-16);' : ''}">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <div class="log-title" style="margin:0;">${escapeHtml(l.routineName || '루틴')}</div>  
          <div class="log-meta" style="display:flex; align-items:center; gap:var(--space-4);">
            <span>${dateStr}</span>
            <span style="opacity:0.6;">.</span>
            <span>${durStr}</span>
          </div>
        </div>
        <button class="btn-xs btn-tertiary btn-icon" onclick="window.deleteLog('${escapeAttr(logId)}')" title="삭제">${getSfSymbol("trash.fill", 14, "var(--text-warning)")}</button>
      </div>`;
  }).join('');
  
  return `
    <div class="card-fit">
      ${items}
      ${totalPages > 1 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
          <button class="btn-xs btn-tertiary" onclick="window.changeActivityPage(1)" ${page <= 1 ? 'disabled' : ''}>← </button>
          <span style="font-size:12px; color:var(--text-secondary);">${page + 1} / ${totalPages}</span>
          <button class="btn-xs btn-tertiary" onclick="window.changeActivityPage(-1)" ${page >= totalPages - 0 ? 'disabled' : ''}> →</button>
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
  
  const options = (state.routineOrder || []).map(id => {
    const r = state.routines[id];
    if (!r) return "";
    const isSelected = filterVal === id ? "selected" : "";
    return `<option value="${id}" ${isSelected}>${escapeHtml(r.name)}</option>`;
  }).join("");

  const filterBarHtml = `
    <div style="display:flex; align-items:center; gap:var(--space-10); margin-bottom:var(--space-16); background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-lg); padding:var(--space-12) var(--space-16);">
      <label for="stats-routine-filter" style="font-weight:var(--fw-bold); font-size:var(--typo-body-sm); color:var(--text-secondary); white-space:nowrap; margin:0;">${getSfSymbol("chart.bar.fill", 16, "var(--text-brand-accent)")} 분석 대상:</label>
      <select id="stats-routine-filter" style="flex:1; border:none; background:transparent; font-size: var(--typo-body-sm); font-weight:var(--fw-black); color:var(--text-primary); outline:none; cursor:pointer;" onchange="window.filterStatsByRoutine(this.value)">
        <option value="all" ${filterVal === "all" ? "selected" : ""}>전체 루틴 (통합)</option>
        ${options}
      </select>
    </div>`;

  const tabsHtml = `
    <div class="main-tabs">
      <button class="main-tab-btn" onclick="window.goScreen('list')">내 루틴</button>
      <button class="main-tab-btn active" onclick="window.goStatsTab()">통계</button>
    </div>`;

  // Case A: Entirely empty history (No logs at all)
  if (!allLogs || allLogs.length === 0) {
    return `
      ${tabsHtml}
      ${filterBarHtml}
      <div class="stats-dashboard" style="display:flex; flex-direction:column; gap:var(--space-16);">
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:var(--space-12);">
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">루틴 실행 횟수</div>
            <div style="font-size:var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0회</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">완주 횟수</div>
            <div style="font-size:var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0회</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">누적 시간</div>
            <div style="font-size:var(--typo-display-xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0초</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">연속 일수</div>
            <div style="font-size:var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0일</div>
          </div>
        </div>

        <div class="card-fit">
          <div style="width:72px; height:72px; border-radius:50%; background:var(--color-brand-secondary); display:flex; align-items:center; justify-content:center; margin-bottom:var(--space-16); box-shadow:0 8px 24px var(--shadow-card-light);">
            ${getSfSymbol("chart.bar.doc.horizontal", 36, "var(--text-brand-accent)")}
          </div>
          <h3 style="font-size:var(--typo-display-xl); font-weight:var(--fw-black); color:var(--text-primary); margin:0 0 var(--space-8) 0; letter-spacing:-0.3px;">아직 운동 기록이 없어요</h3>
          <p style="font-size:var(--typo-body-sm); font-weight:var(--fw-medium); color:var(--text-secondary); max-width:320px; margin:0 0 var(--space-24) 0; line-height:var(--lh-150);">
            첫 번째 루틴을 완료하고 주간 분석 그래프와 달력을 기록으로 채워보세요!
          </p>
          <button class="btn-md btn-primary" onclick="window.goScreen('list')" style="padding:var(--space-12) var(--space-24); font-weight:var(--fw-black); font-size:var(--typo-display-md); border-radius:var(--radius-md);">
            지금 운동 시작하기 →
          </button>
        </div>
      </div>`;
  }

  // Case B: Selected routine has no history logs
  if (logs.length === 0) {
    const selectedRoutine = state.routines[filterVal];
    const selectedRoutineName = selectedRoutine ? selectedRoutine.name : "선택한 루틴";
    return `
      ${tabsHtml}
      ${filterBarHtml}
      <div class="stats-dashboard" style="display:flex; flex-direction:column; gap:var(--space-16);">
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:var(--space-12);">
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">루틴 실행 횟수</div>
            <div style="font-size:var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0회</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">완주 횟수</div>
            <div style="font-size:var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0회</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">누적 시간</div>
            <div style="font-size:var(--typo-display-xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0초</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center; opacity:0.6;">
            <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); font-weight:var(--fw-bold);">연속 일수</div>
            <div style="font-size:var(--typo-display-2xl); font-weight:var(--fw-black); color:var(--text-secondary); margin-top:var(--space-4);">0일</div>
          </div>
        </div>

        <div style="background:var(--bg-card); border-radius:var(--radius-xl); border:1px solid var(--border-base); padding:var(--space-30) var(--space-20); text-align:center;">
          <div style="width:56px; height:56px; border-radius:50%; background:var(--surface-light); display:flex; align-items:center; justify-content:center; margin:0 auto var(--space-14) auto;">
            ${getSfSymbol("info.circle", 28, "var(--text-brand-accent)")}
          </div>
          <div style="font-size:var(--typo-display-md); font-weight:var(--fw-black); color:var(--text-primary); margin-bottom:var(--space-6);">
            '${escapeHtml(selectedRoutineName)}' 운동 기록이 없습니다
          </div>
          <div style="font-size:var(--typo-body-xs); color:var(--text-secondary); margin-bottom:var(--space-20);">
            이 루틴을 실행하여 첫 기록을 남기거나 전체 통합 통계를 확인해 보세요.
          </div>
          <div style="display:flex; justify-content:center; gap:var(--space-10);">
            <button class="btn-xs btn-secondary" onclick="window.filterStatsByRoutine('all')">전체 통계 보기</button>
            <button class="btn-xs btn-primary" onclick="window.goIntro('${filterVal}')">이 루틴 시작하기</button>
          </div>
        </div>
      </div>`;
  }

  const totalExecutions = logs.length;
  const fullCompletions = logs.filter(l => l.completed !== false && !l.routineName?.includes('(중단)')).length;
  let totalSeconds = 0;
  logs.forEach(l => totalSeconds += (l.durationSeconds || 0));
  const totalDurationStr = formatDuration(totalSeconds);
  
  const streak = calculateStreak(logs);
  const chartHtml = generateWeeklyChart(logs);
  const calendarHtml = generateCalendarGrid(logs);
  const recentActivityHtml = generateRecentActivity(logs);

  return `
    ${tabsHtml}
    ${filterBarHtml}
    
    <div class="stats-dashboard" style="display:flex; flex-direction:column; gap:var(--space-16);">
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:var(--space-12);">
        <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center;">
          <label>루틴 실행 횟수</label>
          <div class="stat-hero">${totalExecutions}회</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center;">
          <label>완주 횟수</label>
          <div class="stat-hero">${fullCompletions}회</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-base); border-radius:var(--radius-xl); padding:var(--space-16); text-align:center;">
          <label>누적 시간</label>
          <div class="stat-hero">${totalDurationStr}</div>
        </div>
        <div >
          <label>연속 일수</label>
          <div class="stat-hero">${streak}일</div>
        </div>
      </div>
      
      <div>
        <div style="font-size:var(--typo-body-sm); font-weight:var(--fw-black); color:var(--text-secondary); margin-bottom:var(--space-8);">${getSfSymbol("chart.bar.fill", 16, "var(--text-secondary)")} 주간 운동 통계 (분)</div>
        ${chartHtml}
      </div>

      <div>
        <div style="font-size:var(--typo-body-sm); font-weight:var(--fw-black); color:var(--text-secondary); margin-bottom:var(--space-8);">${getSfSymbol("calendar", 16, "var(--text-secondary)")} 기록 달력</div>
        ${calendarHtml}
      </div>

      <div>
        <div style="font-size:var(--typo-body-sm); font-weight:var(--fw-black); color:var(--text-secondary); margin-bottom:var(--space-8);">${getSfSymbol("stopwatch", 16, "var(--text-secondary)")} 최근 활동 로그</div>
        ${recentActivityHtml}
      </div>
    </div>`;
}
