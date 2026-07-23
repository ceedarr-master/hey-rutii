import { getSfSymbol } from '../utils/icons.js';
import { state, formDraft } from '../store/state.js';
import { escapeHtml, escapeAttr } from '../utils/helpers.js';
import { stepDetail } from '../utils/format.js';

export function renderInlineStepEditor(i, s) {
  const isTimer = s.type === "timer";
  const mm = isTimer ? Math.floor((s.seconds || 0) / 60) : 0;
  const ss = isTimer ? (s.seconds || 0) % 60 : 0;
  const reps = s.reps || 10;
  const sets = s.sets || 1;
  const rest = s.restSeconds || 0;

  return `
    <div class="inline-edit-box">
      <label>운동 이름<span class="lbl-req">*</span></label>
      <input class="form-input-text" id="edit-name-${i}" type="text" value="${escapeAttr(s.name)}" />
      
      <label>타겟 부위</label>
      <input class="form-input-text" id="edit-target-${i}" type="text" value="${escapeAttr(s.target || '')}" placeholder="예: 둔근" />

      <label>설명</label>
      <textarea class="form-textarea-underline" id="edit-desc-${i}" placeholder="동작 주의사항">${escapeHtml(s.desc || '')}</textarea>

      <label>진행 방식<span class="lbl-req">*</span></label>
      <div class="main-tabs">
        <button class="main-tab-btn active ${isTimer ? 'btn-secondary' : 'btn-tertiary'}" onclick="window.toggleInlineType(${i}, 'timer')">${getSfSymbol("stopwatch", 14)} 시간</button>
        <button class="main-tab-btn ${!isTimer ? 'btn-secondary' : 'btn-tertiary'}" onclick="window.toggleInlineType(${i}, 'manual')">${getSfSymbol("checkmark", 14)} 횟수</button>
      </div>

      <div style="display:flex; gap:12px; margin-top:12px; flex-wrap:wrap;">
        ${isTimer ? `
          <div class="num-group">
            <input class="form-input-num" id="edit-mm-${i}" type="number" min="0" value="${mm}" />
            <span class="num-unit">분</span>
          </div>
          <div class="num-group">
            <input class="form-input-num" id="edit-ss-${i}" type="number" min="0" max="59" value="${ss}" />
            <span class="num-unit">초</span>
          </div>
        ` : `
          <div class="num-group">
            <input class="form-input-num" id="edit-reps-${i}" type="number" min="1" value="${reps}" />
            <span class="num-unit">개</span>
          </div>
        `}
        <div class="num-group">
          <input class="form-input-num" id="edit-sets-${i}" type="number" min="1" value="${sets}" />
          <span class="num-unit">세트</span>
        </div>
        <div class="num-group">
          <input class="form-input-num" id="edit-rest-${i}" type="number" min="0" value="${rest}" />
          <span class="num-unit">초 휴식</span>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
        <button class="btn-xs btn-secondary" onclick="window.cancelInlineEdit()">취소</button>
        <button class="btn-xs btn-primary" onclick="window.saveInlineEdit(${i})">저장</button>
      </div>
    </div>`;
}

export function renderBuilder() {
  const b = state.builder;
  if (!b) return "";
  const isTimer = formDraft.type === "timer";

  let stepsHtml = "";
  if (b.steps.length === 0) {
    stepsHtml = `<div class="empty-state" style="padding:var(--space-20);">아직 추가된 운동이 없습니다.</div>`;
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
                  <div style="display:flex; align-items:center; gap:8px; font-size:14px; font-weight:var(--fw-bold); color:var(--text-tertiary); white-space:nowrap;">
                    <span>휴식 및 전환</span>
                    <span style="font-weight:var(--fw-medium); opacity:0.85;">⏱ ${s.seconds || 15}초</span>
                  </div>
                ` : `
                  <div>
                    <div style="font-size:15px; font-weight:var(--fw-bold); color:var(--text-primary);">${escapeHtml(s.name)}</div>
                    <div style="font-size:var(--text-xs); color:var(--text-secondary); margin-top:2px;">${stepDetail(s)}</div>
                  </div>
                `}
              </div>
              <div style="display:flex; gap: var(--space-6);">
                <button class="btn-sm btn-secondary btn-icon" onclick="window.startInlineEdit(${i})" title="수정">${getSfSymbol("pencil", 14, "var(--text-secondary)")}</button>
                <button class="btn-sm btn-warning btn-icon" onclick="window.removeStep(${i})" title="삭제">${getSfSymbol("trash.fill", 14, "var(--color-danger)")}</button>
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
            ? `<button class="btn-sm btn-tertiary" onclick="navigator.clipboard.writeText('${state.routines[b.editingId].shareCode}').then(() => showToast('코드가 복사되었습니다.'));">공유 코드 복사</button>` 
            : `<button class="btn-sm btn-tertiary" onclick="window.shareRoutine('${b.editingId}')">공유 코드 발급</button>`}
          <button class="btn-sm btn-warning btn-icon" onclick="window.deleteRoutine('${b.editingId}')" title="루틴 삭제">${getSfSymbol("trash.fill", 14, "var(--color-danger)")}</button>
        </div>
      ` : `
        <button class="btn-xs btn-secondary" onclick="window.promptImportRoutineToBuilder()">🔗 루틴코드로 불러오기</button>
        <button class="btn-xs btn-warning btn-icon" onclick="window.deleteRoutine('${id}')">${getSfSymbol("trash.fill", 14, "var(--color-danger)")}</button>
      `}
    </div>

    <label>루틴 이름<span class="lbl-req">*</span></label>
    <input class="form-input-text" style="font-size:20px; font-weight:var(--fw-black); margin-bottom:var(--space-12);" type="text" placeholder="예: TVA 코어 루틴" value="${escapeAttr(b.name)}" oninput="window.updateBuilderName(this.value)" />

    <label>루틴 설명 (선택)</label>
    <input class="form-input-text" style="font-size:14px; margin-bottom:var(--space-20);" type="text" placeholder="예: 코어 근육 강화 및 자세 교정 루틴" value="${escapeAttr(b.desc || '')}" oninput="window.updateBuilderDesc(this.value)" />

    <div class="steps-section-title" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-12);">
      <span style="font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-secondary);">운동 목록 (${b.steps.length})</span>
      ${b.steps.some(s => s.type === 'transition')
        ? '<button class="btn-xs btn-secondary" onclick="window.promptInsertTransitions()">트랜지션 타임 일괄수정</button>' 
        : '<button class="btn-xs btn-secondary" onclick="window.promptInsertTransitions()">트랜지션 타임 추가</button>'}
    </div>
    ${stepsHtml}

    <div class="card" style="background:#ffffff; border-radius:20px; padding:20px; text-align:left; margin-top:var(--space-16); border:1px solid var(--border-base);">
      <label>운동 이름<span class="lbl-req">*</span></label>
      <input class="form-input-text" type="text" placeholder="푸쉬업" value="${escapeAttr(formDraft.name)}" oninput="window.updateForm('name', this.value)" />

      <label>타겟 부위</label>
      <input class="form-input-text" type="text" placeholder="예: 갑빠, 둔근" value="${escapeAttr(formDraft.target)}" oninput="window.updateForm('target', this.value)" />

      <label>설명</label>
      <textarea class="form-textarea-underline" placeholder="동작 방법이나 주의사항" oninput="window.updateForm('desc', this.value)">${escapeHtml(formDraft.desc)}</textarea>

      <label>진행 방식<span class="lbl-req">*</span></label>
      <div class="main-tabs" style="display:flex; gap:var(--space-8); margin-top:var(--space-6);">
        <button class="btn-sm btn-flex ${isTimer ? 'btn-secondary' : 'btn-tertiary'}" onclick="window.setFormType('timer')">${getSfSymbol("stopwatch", 14)} 시간 진행</button>
        <button class="btn-sm btn-flex ${!isTimer ? 'btn-secondary' : 'btn-tertiary'}" onclick="window.setFormType('manual')">${getSfSymbol("checkmark", 14)} 횟수 진행</button>
      </div>

      ${isTimer ? `
        <div class="num-row">
          <div class="num-group">
            <input class="form-input-num" type="number" min="0" value="${formDraft.mm}" oninput="window.updateForm('mm', this.value)" />
            <span class="num-unit">분</span>
          </div>
          <div class="num-group">
            <input class="form-input-num" type="number" min="0" max="59" value="${formDraft.ss}" oninput="window.updateForm('ss', this.value)" />
            <span class="num-unit">초</span>
          </div>
        </div>
        <div class="num-row">
          <div class="num-group">
            <input class="form-input-num" type="number" min="1" value="${formDraft.sets}" oninput="window.updateForm('sets', this.value)" />
            <span class="num-unit">세트</span>
          </div>
          <div class="num-group">
            <input class="form-input-num" type="number" min="0" value="${formDraft.restSeconds}" oninput="window.updateForm('restSeconds', this.value)" />
            <span class="num-unit">초 휴식</span>
          </div>
        </div>` : `
        <div class="num-row">
          <div class="num-group">
            <input class="form-input-num" type="number" min="1" value="${formDraft.reps}" oninput="window.updateForm('reps', this.value)" />
            <span class="num-unit">개</span>
          </div>
          <div class="num-group">
            <input class="form-input-num" type="number" min="1" value="${formDraft.sets}" oninput="window.updateForm('sets', this.value)" />
            <span class="num-unit">세트</span>
          </div>
          <div class="num-group">
            <input class="form-input-num" type="number" min="0" value="${formDraft.restSeconds}" oninput="window.updateForm('restSeconds', this.value)" />
            <span class="num-unit">초 휴식</span>
          </div>
        </div>`}

      <button class="btn-lg btn-secondary" style="width:100%; margin-top:var(--space-20);" onclick="window.addExerciseFromForm()">+ 운동 추가</button>
    </div>

    <div style="display:flex; gap:var(--space-10); margin-top:var(--space-20);">
      <button class="btn-lg btn-secondary btn-flex" onclick="window.goScreen('list')">취소</button>
      <button class="btn-lg btn-primary btn-flex" onclick="window.saveRoutine()">루틴 저장</button>
    </div>`;
}
