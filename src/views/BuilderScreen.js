import { getSfSymbol } from '../utils/icons.js';
import { state, formDraft } from '../store/state.js';
import { escapeHtml, escapeAttr } from '../utils/helpers.js';
import { stepDetail } from '../utils/format.js';

function renderExerciseFields({
  name = '',
  target = '',
  desc = '',
  type = 'timer',
  mm = 0,
  ss = 0,
  reps = 10,
  secPerRep = 3,
  sets = 1,
  rest = 0,
  idBuilder = null,
  onNameInput = '',
  onTargetInput = '',
  onDescInput = '',
  onMmInput = '',
  onSsInput = '',
  onRepsInput = '',
  onSecPerRepInput = '',
  onSetsInput = '',
  onRestInput = '',
  onTypeToggle = (t) => ''
}) {
  const isTimer = type === 'timer';
  const idAttr = (field) => idBuilder ? `id="${idBuilder(field)}"` : '';

  return `
    <label>운동 이름<span class="lbl-req">*</span></label>
    <input class="form-input-text" ${idAttr('name')} type="text" value="${escapeAttr(name)}" placeholder="예: 플랭크" ${onNameInput ? `oninput="${onNameInput}"` : ''} />
    
    <label>타겟 부위</label>
    <input class="form-input-text" ${idAttr('target')} type="text" value="${escapeAttr(target)}" placeholder="예: 복직근, 복사근, 복횡근" ${onTargetInput ? `oninput="${onTargetInput}"` : ''} />

    <label>설명</label>
    <textarea class="form-textarea-underline" ${idAttr('desc')} placeholder="엎드린 상태에서 팔꿈치를 어깨 아래에 두고, 머리, 등, 엉덩이, 발뒤꿈치가 일직선이 되도록 합니다. 엉덩이가 너무 솟거나 처지지 않도록 복부와 엉덩이에 강하게 힘을 줍니다." ${onDescInput ? `oninput="${onDescInput}"` : ''}>${escapeHtml(desc)}</textarea>

    <label>진행 방식<span class="lbl-req">*</span></label>
    <div class="tabs-sm">
      <button class="tabs-sm-btn ${isTimer ? 'active' : ''}" onclick="${onTypeToggle('timer')}">${getSfSymbol("stopwatch", 14)}시간 진행</button>
      <button class="tabs-sm-btn ${!isTimer ? 'active' : ''}" onclick="${onTypeToggle('manual')}">${getSfSymbol("checkmark", 14)}횟수 진행</button>
    </div>

    ${isTimer ? `
      <div class="num-row">
        <div class="num-group">
          <input class="form-input-num" ${idAttr('mm')} type="number" inputmode="numeric" pattern="[0-9]*" min="0" value="${mm}" ${onMmInput ? `oninput="${onMmInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">분</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('ss')} type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="59" value="${ss}" ${onSsInput ? `oninput="${onSsInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">초</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('sets')} type="number" inputmode="numeric" pattern="[0-9]*" min="1" value="${sets}" ${onSetsInput ? `oninput="${onSetsInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">세트</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('rest')} type="number" inputmode="numeric" pattern="[0-9]*" min="0" value="${rest}" ${onRestInput ? `oninput="${onRestInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">초 휴식</span>
        </div>
      </div>` : `
      <div class="num-row">
        <div class="num-group">
          <input class="form-input-num" ${idAttr('reps')} type="number" inputmode="numeric" pattern="[0-9]*" min="1" value="${reps}" ${onRepsInput ? `oninput="${onRepsInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">개</span>
        </div>
        <div class="num-group">
          <span class="num-unit">회당</span>
          <input class="form-input-num" ${idAttr('secPerRep')} type="number" inputmode="decimal" step="0.5" min="0.5" value="${secPerRep}" ${onSecPerRepInput ? `oninput="${onSecPerRepInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">초</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('sets')} type="number" inputmode="numeric" pattern="[0-9]*" min="1" value="${sets}" ${onSetsInput ? `oninput="${onSetsInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">세트</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('rest')} type="number" inputmode="numeric" pattern="[0-9]*" min="0" value="${rest}" ${onRestInput ? `oninput="${onRestInput}"` : ''} onfocus="this.select()" />
          <span class="num-unit">초 휴식</span>
        </div>
      </div>`}
  `;
}

export function renderInlineStepEditor(i, s) {
  if (s.type === 'transition') {
    return `
      <div class="exercise-form-card-transition">
        <label>트랜지션 시간<span class="lbl-req">*</span></label>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-top:var(--space-12); width:100%;">
          <div class="num-group" style="display:flex; align-items:baseline; gap:6px; max-width:140px;">
            <input class="form-input-num" id="edit-ss-${i}" type="number" inputmode="numeric" pattern="[0-9]*" min="1" value="${s.seconds || 15}" style="flex:1;" onfocus="this.select()" />
            <span class="num-unit">초</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-sm btn-tertiary" onclick="window.cancelInlineEdit()">취소</button>
            <button class="btn-sm btn-primary" onclick="window.saveInlineEdit(${i})">저장</button>
          </div>
        </div>
      </div>`;
  }

  const isTimer = s.type === "timer";
  const mm = isTimer ? Math.floor((s.seconds || 0) / 60) : 0;
  const ss = isTimer ? (s.seconds || 0) % 60 : 0;
  const reps = s.reps || 10;
  const secPerRep = s.secPerRep || 3;
  const sets = s.sets || 1;
  const rest = s.restSeconds || 0;

  return `
    <div class="exercise-form-card">
      ${renderExerciseFields({
        name: s.name,
        target: s.target || '',
        desc: s.desc || '',
        type: s.type,
        mm,
        ss,
        reps,
        secPerRep,
        sets,
        rest,
        idBuilder: (field) => `edit-${field}-${i}`,
        onTypeToggle: (t) => `window.toggleInlineType(${i}, '${t}')`
      })}
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:var(--space-20);">
        <button class="btn-sm btn-tertiary" onclick="window.cancelInlineEdit()">취소</button>
        <button class="btn-sm btn-primary" onclick="window.saveInlineEdit(${i})">저장</button>
      </div>
    </div>`;
}

function renderInsertZone(insertIdx) {
  const b = state.builder;
  const isMenuActive = b.activeInsertMenuIndex === insertIdx;

  return `
    <div class="step-insert-zone ${isMenuActive ? 'active' : ''}" data-insert-index="${insertIdx}">
      <div class="step-insert-line"></div>
      ${isMenuActive ? `
        <div class="step-insert-menu">
          <button type="button" class="btn-xs btn-secondary" onclick="window.insertTransitionAt(${insertIdx})">
            ${getSfSymbol("stopwatch", 13)} 트랜지션
          </button>
          <button type="button" class="btn-xs btn-primary" onclick="window.insertExerciseAt(${insertIdx})">
            ${getSfSymbol("plus", 13)} 새 운동
          </button>
          <button type="button" class="step-insert-close-btn" onclick="window.toggleInsertMenu(${insertIdx})" title="닫기">
            ${getSfSymbol("xmark", 12, "var(--text-tertiary)")}
          </button>
        </div>
      ` : `
        <button type="button" class="step-insert-btn" onclick="window.toggleInsertMenu(${insertIdx})" title="이 위치에 스텝 추가">
          ${getSfSymbol("plus", 14)}
        </button>
      `}
    </div>`;
}

export function renderBuilder() {
  const b = state.builder;
  if (!b) return "";

  let stepsHtml = "";
  if (b.steps.length === 0) {
    stepsHtml = `<div class="empty-state" style="font-size:var(--typo-body-sm); font-weight:var(--fw-medium); color:var(--text-tertiary); padding:var(--space-20);">아직 추가된 운동이 없습니다.</div>`;
  } else {
    const items = [];
    b.steps.forEach((s, i) => {
      items.push(renderInsertZone(i));
      if (b.editingStepIndex === i) {
        items.push(renderInlineStepEditor(i, s));
      } else {
        const isTrans = s.type === 'transition';
        items.push(`
          <div class="step-item-figma ${isTrans ? 'transition-type' : ''}" data-id="${i}">
            <div style="display:flex; align-items:center; flex:1; gap:10px;">
              <div class="step-drag-handle" style="${isTrans ? 'color:var(--text-tertiary);' : ''}">≡</div>
              ${isTrans ? `
                <div class="step-break" style="display:flex; align-items:center; gap:8px; white-space:nowrap;">
                  <span>트랜지션</span>
                  <span style="font-weight:var(--fw-medium); opacity:0.85;">⏱ ${s.seconds || 15}초</span>
                </div>
              ` : `
                <div>
                  <div class="step-list-title">${escapeHtml(s.name)}</div>
                  <div class="step-list-subtitle">${stepDetail(s)}</div>
                </div>
              `}
            </div>
            <div style="display:flex; gap: var(--space-8);">
              <button class="btn-sm btn-secondary btn-icon" onclick="window.duplicateStep(${i})" title="복제">${getSfSymbol("doc.on.doc", 14, "var(--text-secondary)")}</button>
              <button class="btn-sm btn-secondary btn-icon" onclick="window.startInlineEdit(${i})" title="수정">${getSfSymbol("pencil", 14, "var(--text-secondary)")}</button>
              <button class="btn-sm btn-warning btn-icon" onclick="window.removeStep(${i})" title="삭제">${getSfSymbol("trash.fill", 14, "#ff5e3a")}</button>
            </div>
          </div>`);
      }
    });
    items.push(renderInsertZone(b.steps.length));
    stepsHtml = `<div class="step-list">${items.join("")}</div>`;
  }

  return `
    <div class="builder-title" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-18);">
      <span style="font-size:22px; font-weight:var(--fw-black); color:var(--text-primary);">${b.editingId ? "루틴 수정" : "새 루틴 만들기"}</span>
      ${b.editingId ? `
        <div style="font-size:var(--text-sm); display:flex; align-items:center; gap:var(--space-8);">
          ${state.routines[b.editingId]?.shareCode 
            ? `<button class="btn-sm btn-outlined" onclick="window.shareRoutine('${b.editingId}')">공유 코드 복사 (${state.routines[b.editingId].shareCode})</button>` 
            : `<button class="btn-sm btn-outlined" onclick="window.shareRoutine('${b.editingId}')">공유 코드 발급</button>`}
          <button class="btn-sm btn-warning btn-icon" onclick="window.deleteRoutine('${b.editingId}')" title="루틴 삭제">${getSfSymbol("trash.fill", 14, "#ff5e3a")}</button>
        </div>
      ` : `
        <button class="btn-xs btn-secondary" onclick="window.promptImportRoutineToBuilder()">루틴코드로 불러오기</button>
      `}
    </div>

    <label>루틴 이름<span class="lbl-req">*</span></label>
    <input class="form-input-text" style="font-size:20px; font-weight:var(--fw-black); margin-bottom:var(--space-12);" type="text" placeholder="예: TVA 코어 루틴" value="${escapeAttr(b.name)}" oninput="window.updateBuilderName(this.value)" />

    <label>루틴 설명</label>
    <input class="form-input-text" style="font-size:14px; margin-bottom:var(--space-20);" type="text" placeholder="예: 코어 근육 강화 및 자세 교정 루틴" value="${escapeAttr(b.desc || '')}" oninput="window.updateBuilderDesc(this.value)" />

    <div class="steps-section-title" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-12);">
      <span style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary);">운동 목록 (${b.steps.length})</span>
      ${b.steps.some(s => s.type === 'transition')
        ? '<button class="btn-xs btn-secondary" onclick="window.promptInsertTransitions()">트랜지션 타임 일괄수정</button>' 
        : '<button class="btn-xs btn-secondary" onclick="window.promptInsertTransitions()">트랜지션 타임 추가</button>'}
    </div>
    ${stepsHtml}

    <div class="exercise-form-card" style="margin-top:var(--space-16);">
      ${renderExerciseFields({
        name: formDraft.name,
        target: formDraft.target,
        desc: formDraft.desc,
        type: formDraft.type,
        mm: formDraft.mm,
        ss: formDraft.ss,
        reps: formDraft.reps,
        secPerRep: formDraft.secPerRep || 3,
        sets: formDraft.sets,
        rest: formDraft.restSeconds,
        onNameInput: "window.updateForm('name', this.value)",
        onTargetInput: "window.updateForm('target', this.value)",
        onDescInput: "window.updateForm('desc', this.value)",
        onMmInput: "window.updateForm('mm', this.value)",
        onSsInput: "window.updateForm('ss', this.value)",
        onRepsInput: "window.updateForm('reps', this.value)",
        onSecPerRepInput: "window.updateForm('secPerRep', this.value)",
        onSetsInput: "window.updateForm('sets', this.value)",
        onRestInput: "window.updateForm('restSeconds', this.value)",
        onTypeToggle: (t) => `window.setFormType('${t}')`
      })}
      <button class="btn-lg btn-secondary" style="width:100%; margin-top:var(--space-20);" onclick="window.addExerciseFromForm()">+ 운동 추가</button>
    </div>

    <div style="display:flex; gap:var(--space-10); margin-top:var(--space-20);">
      <button class="btn-lg btn-secondary btn-flex" onclick="window.goScreen('list')">취소</button>
      <button class="btn-lg btn-primary btn-flex" onclick="window.saveRoutine()">루틴 저장</button>
    </div>`;
}
