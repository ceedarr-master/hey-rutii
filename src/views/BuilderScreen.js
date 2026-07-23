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
  sets = 1,
  rest = 0,
  idBuilder = null,
  onNameInput = '',
  onTargetInput = '',
  onDescInput = '',
  onMmInput = '',
  onSsInput = '',
  onRepsInput = '',
  onSetsInput = '',
  onRestInput = '',
  onTypeToggle = (t) => ''
}) {
  const isTimer = type === 'timer';
  const idAttr = (field) => idBuilder ? `id="${idBuilder(field)}"` : '';

  return `
    <label>운동 이름<span class="lbl-req">*</span></label>
    <input class="form-input-text" ${idAttr('name')} type="text" value="${escapeAttr(name)}" placeholder="운동 이름을 입력하세요" ${onNameInput ? `oninput="${onNameInput}"` : ''} />
    
    <label>타겟 부위</label>
    <input class="form-input-text" ${idAttr('target')} type="text" value="${escapeAttr(target)}" placeholder="예: 대흉근, 코어" ${onTargetInput ? `oninput="${onTargetInput}"` : ''} />

    <label>설명</label>
    <textarea class="form-textarea-underline" ${idAttr('desc')} placeholder="동작 방법이나 주의사항" ${onDescInput ? `oninput="${onDescInput}"` : ''}>${escapeHtml(desc)}</textarea>

    <label>진행 방식<span class="lbl-req">*</span></label>
    <div class="tabs-sm">
      <button class="tabs-sm-btn ${isTimer ? 'active' : ''}" onclick="${onTypeToggle('timer')}">${getSfSymbol("stopwatch", 14)} 시간 진행</button>
      <button class="tabs-sm-btn ${!isTimer ? 'active' : ''}" onclick="${onTypeToggle('manual')}">${getSfSymbol("checkmark", 14)} 횟수 진행</button>
    </div>

    ${isTimer ? `
      <div class="num-row">
        <div class="num-group">
          <input class="form-input-num" ${idAttr('mm')} type="number" min="0" value="${mm}" ${onMmInput ? `oninput="${onMmInput}"` : ''} />
          <span class="num-unit">분</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('ss')} type="number" min="0" max="59" value="${ss}" ${onSsInput ? `oninput="${onSsInput}"` : ''} />
          <span class="num-unit">초</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('sets')} type="number" min="1" value="${sets}" ${onSetsInput ? `oninput="${onSetsInput}"` : ''} />
          <span class="num-unit">세트</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('rest')} type="number" min="0" value="${rest}" ${onRestInput ? `oninput="${onRestInput}"` : ''} />
          <span class="num-unit">초 휴식</span>
        </div>
      </div>` : `
      <div class="num-row">
        <div class="num-group">
          <input class="form-input-num" ${idAttr('reps')} type="number" min="1" value="${reps}" ${onRepsInput ? `oninput="${onRepsInput}"` : ''} />
          <span class="num-unit">개</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('sets')} type="number" min="1" value="${sets}" ${onSetsInput ? `oninput="${onSetsInput}"` : ''} />
          <span class="num-unit">세트</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" ${idAttr('rest')} type="number" min="0" value="${rest}" ${onRestInput ? `oninput="${onRestInput}"` : ''} />
          <span class="num-unit">초 휴식</span>
        </div>
      </div>`}
  `;
}

export function renderInlineStepEditor(i, s) {
  if (s.type === 'transition') {
    return `
      <div class="exercise-form-card">
        <label style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary); margin:0;">휴식 및 전환 시간<span class="lbl-req">*</span></label>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-top:var(--space-12); width:100%;">
          <div class="num-group" style="display:flex; align-items:baseline; gap:6px; max-width:140px;">
            <input class="form-input-num" id="edit-ss-${i}" type="number" min="1" value="${s.seconds || 15}" style="flex:1;" />
            <span class="num-unit">초</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-xs btn-tertiary" onclick="window.cancelInlineEdit()">취소</button>
            <button class="btn-xs btn-primary" onclick="window.saveInlineEdit(${i})">저장</button>
          </div>
        </div>
      </div>`;
  }

  const isTimer = s.type === "timer";
  const mm = isTimer ? Math.floor((s.seconds || 0) / 60) : 0;
  const ss = isTimer ? (s.seconds || 0) % 60 : 0;
  const reps = s.reps || 10;
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
        sets,
        rest,
        idBuilder: (field) => `edit-${field}-${i}`,
        onTypeToggle: (t) => `window.toggleInlineType(${i}, '${t}')`
      })}
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:var(--space-20);">
        <button class="btn-xs btn-tertiary" onclick="window.cancelInlineEdit()">취소</button>
        <button class="btn-xs btn-primary" onclick="window.saveInlineEdit(${i})">저장</button>
      </div>
    </div>`;
}

export function renderBuilder() {
  const b = state.builder;
  if (!b) return "";

  let stepsHtml = "";
  if (b.steps.length === 0) {
    stepsHtml = `<div class="empty-state" style="font-size:var(--typo-body-sm); font-weight:var(--fw-medium); color:var(--text-tertiary); padding:var(--space-20);">아직 추가된 운동이 없습니다.</div>`;
  } else {
    stepsHtml = `<div class="step-list">` +
      b.steps.map((s, i) => {
        if (b.editingStepIndex === i) {
          return renderInlineStepEditor(i, s);
        } else {
          const isTrans = s.type === 'transition';
          return `
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
                <button class="btn-sm btn-secondary btn-icon" onclick="window.startInlineEdit(${i})" title="수정">${getSfSymbol("pencil", 14, "var(--text-secondary)")}</button>
                <button class="btn-sm btn-warning btn-icon" onclick="window.removeStep(${i})" title="삭제">${getSfSymbol("trash.fill", 14, "#ff5e3a")}</button>
              </div>
            </div>`;
        }
      }).join("") + `</div>`;
  }

  return `
    <div class="builder-title" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-18);">
      <span style="font-size:22px; font-weight:var(--fw-black); color:var(--text-primary);">${b.editingId ? "루틴 수정" : "새 루틴 만들기"}</span>
      ${b.editingId ? `
        <div style="font-size:var(--text-sm); display:flex; align-items:center; gap:var(--space-8);">
          ${state.routines[b.editingId]?.shareCode 
            ? `<button class="btn-sm btn-tertiary" onclick="window.shareRoutine('${b.editingId}')">공유 코드 복사 (${state.routines[b.editingId].shareCode})</button>` 
            : `<button class="btn-sm btn-tertiary" onclick="window.shareRoutine('${b.editingId}')">공유 코드 발급</button>`}
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
        sets: formDraft.sets,
        rest: formDraft.restSeconds,
        onNameInput: "window.updateForm('name', this.value)",
        onTargetInput: "window.updateForm('target', this.value)",
        onDescInput: "window.updateForm('desc', this.value)",
        onMmInput: "window.updateForm('mm', this.value)",
        onSsInput: "window.updateForm('ss', this.value)",
        onRepsInput: "window.updateForm('reps', this.value)",
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
