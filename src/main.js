import { getSfSymbol } from './utils/icons.js';
import { playBeep } from './utils/audio.js';
import { state, DEFAULT_TVA_ROUTINE, formDraft, saveLocalUserProfile } from './store/state.js';
import { supabaseClient, initSupabaseAuth } from './config/supabase.js';
import { renderHeader } from './components/Header.js';
import { renderList } from './views/ListScreen.js';
import { renderBuilder, renderInlineStepEditor } from './views/BuilderScreen.js';
import { renderPlay, renderDone } from './views/PlayScreen.js';
import { renderStats } from './views/StatsScreen.js';
import { renderProfile } from './views/ProfileScreen.js';
import { renderAuth, renderResetPassword } from './views/AuthScreen.js';
import { renderIntro } from './views/IntroScreen.js';
import { clearTimer, startTimer, requestWakeLock } from './utils/timer.js';
import { triggerCloudSync, persistRoutine, persistList, deleteRoutineStorage } from './store/sync.js';
import { showToast, showConfirm, showConfirmModal, showPromptModal, escapeHtml, initTooltipListeners } from './utils/helpers.js';

// ---- Sortable Initializer ----
function initSortable() {
  const el = document.querySelector(".step-list");
  if (!el || typeof Sortable === "undefined") return;
  try {
    Sortable.create(el, {
      animation: 150,
      handle: ".step-drag-handle",
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === newIndex || oldIndex == null || newIndex == null) return;
        const b = state.builder;
        if (!b || !b.steps) return;
        const moved = b.steps.splice(oldIndex, 1)[0];
        b.steps.splice(newIndex, 0, moved);
        render();
      }
    });
  } catch(e) {
    console.warn("Sortable initialize failed", e);
  }
}

// ---- Main Render Function ----
export function render() {
  clearTimer();
  const app = document.getElementById("app");
  if (!app) return;

  const topBarHtml = renderHeader();

  let screenContent = "";
  if (state.screen === "auth") { screenContent = renderAuth(); }
  else if (state.screen === "reset_password") { screenContent = renderResetPassword(); }
  else if (state.screen === "list") { screenContent = renderList(); }
  else if (state.screen === "stats") { screenContent = renderStats(); }
  else if (state.screen === "intro") { screenContent = renderIntro(); }
  else if (state.screen === "builder") { screenContent = renderBuilder(); }
  else if (state.screen === "profile") { screenContent = renderProfile(); }
  else if (state.screen === "play") {
    const routine = state.routines[state.currentId];
    if (state.play.current >= (routine ? routine.steps.length : 0)) {
      screenContent = renderDone(routine);
    } else {
      screenContent = renderPlay(routine);
    }
  }

  app.innerHTML = topBarHtml + screenContent;

  if (state.screen === "builder") {
    initSortable();
  } else if (state.screen === "play") {
    requestWakeLock();
    const routine = state.routines[state.currentId];
    if (routine && state.play.current < routine.steps.length) {
      const s = routine.steps[state.play.current];
      if ((s.type === "timer" || s.type === "transition" || state.play.isResting) && !state.play.paused) {
        startTimer(window.nextStep);
      }
    }
  }
}

// ---- Global Action Bindings for HTML inline events ----
window.render = render;
window.goScreen = (scr) => { state.screen = scr; render(); };
window.goList = () => { state.screen = "list"; render(); };
window.goAuth = () => { state.screen = "auth"; render(); };
window.goStatsTab = () => { state.screen = "stats"; render(); };

window.deleteLog = (logId) => {
  showConfirm("정말 이 기록을 삭제하시겠습니까?", async () => {
    const historyRaw = localStorage.getItem("routines:history") || "[]";
    let history = [];
    try { history = JSON.parse(historyRaw); } catch(e) {}
    history = history.filter(l => (l.id || l.completedAt) !== logId);
    localStorage.setItem("routines:history", JSON.stringify(history));
    await triggerCloudSync();
    render();
  });
};


window.filterStatsByRoutine = (val) => {
  state.statsFilter = val;
  render();
};

window.changeCalendarMonth = (delta) => {
  state.statsCalendarOffset = (state.statsCalendarOffset || 0) + delta;
  render();
};

window.changeWeeklyChartWeek = (delta) => {
  state.statsWeekOffset = (state.statsWeekOffset || 0) + delta;
  render();
};

window.changeActivityPage = (delta) => {
  state.activityPage = (state.activityPage || 0) + delta;
  render();
};


window.goIntro = (id) => {
  state.currentId = id;
  state.screen = "intro";
  render();
};

window.startPlay = () => {
  const routine = state.routines[state.currentId];
  if (!routine || routine.steps.length === 0) return showToast("운동 목록이 비어있습니다.");
  state.play = { current: 0, remaining: 0, paused: false, timerId: null, currentSet: 1, isResting: false };
  state.screen = "play";
  render();
};

window.resumePlay = (id) => {
  state.currentId = id;
  state.screen = "play";
  render();
};

window.confirmResetAndStart = (id) => {
  showConfirmModal({
    icon: getSfSymbol('arrow.clockwise', 36, 'var(--text-brand-accent)'),
    title: '처음부터 다시 시작',
    message: '루틴 진행 상황을 초기화하고 첫 번째 동작부터 시작하시겠습니까?',
    confirmText: '시작하기',
    cancelText: '취소',
    onConfirm: () => {
      delete state.routines[id].progress;
      persistRoutine(state.routines[id]);
      state.currentId = id;
      state.play = { current: 0, remaining: 0, paused: false, timerId: null, currentSet: 1, isResting: false };
      state.screen = "play";
      render();
    }
  });
};

window.nextStep = () => {
  clearTimer();
  playBeep('finish');
  const routine = state.routines[state.currentId];
  if (!routine) return;
  const s = routine.steps[state.play.current];

  if (!state.play.isResting && s.restSeconds > 0 && state.play.currentSet < (s.sets || 1)) {
    state.play.isResting = true;
    state.play.remaining = s.restSeconds;
    render();
    return;
  }

  if (state.play.isResting) {
    state.play.isResting = false;
    state.play.currentSet++;
    state.play.remaining = 0;
    render();
    return;
  }

  if (state.play.currentSet < (s.sets || 1)) {
    state.play.currentSet++;
    state.play.remaining = 0;
    render();
    return;
  }

  state.play.current++;
  state.play.currentSet = 1;
  state.play.remaining = 0;
  state.play.isResting = false;

  if (state.play.current < routine.steps.length) {
    render();
  } else {
    // Routine completed! Log history
    const historyRaw = localStorage.getItem("routines:history") || "[]";
    let history = [];
    try { history = JSON.parse(historyRaw); } catch(e) {}
    history.unshift({
      id: Date.now().toString(),
      routineId: routine.id,
      routineName: routine.name,
      completedAt: new Date().toISOString(),
      durationSeconds: routine.steps.reduce((acc, step) => acc + (step.seconds || 30), 0)
    });
    localStorage.setItem("routines:history", JSON.stringify(history));
    triggerCloudSync();
    render();
  }
};


window.prevStep = () => {
  clearTimer();
  const routine = state.routines[state.currentId];
  if (!routine) return;

  let targetIdx = -1;
  for (let i = state.play.current - 1; i >= 0; i--) {
    if (routine.steps[i] && routine.steps[i].type !== 'transition') {
      targetIdx = i;
      break;
    }
  }

  if (targetIdx !== -1) {
    state.play.current = targetIdx;
    state.play.currentSet = 1;
    state.play.remaining = 0;
    state.play.isResting = false;
    state.play.paused = false;
    render();
  } else {
    // If on the first exercise step, go back to Intro screen!
    state.screen = "intro";
    render();
  }
};

window.skipStep = () => {
  clearTimer();
  const routine = state.routines[state.currentId];
  if (!routine) return;

  let targetIdx = -1;
  for (let i = state.play.current + 1; i < routine.steps.length; i++) {
    if (routine.steps[i] && routine.steps[i].type !== 'transition') {
      targetIdx = i;
      break;
    }
  }

  if (targetIdx !== -1) {
    state.play.current = targetIdx;
    state.play.currentSet = 1;
    state.play.remaining = 0;
    state.play.isResting = false;
    state.play.paused = false;
    render();
  } else {
    state.play.current = routine.steps.length;
    window.nextStep();
  }
};


window.togglePause = () => {
  state.play.paused = !state.play.paused;
  render();
};

window.toggleSound = () => {
  state.soundEnabled = !state.soundEnabled;
  render();
};

window.confirmExitPlay = () => {
  showConfirm("운동을 중단하고 목록으로 나가시겠습니까?", () => {
    state.screen = "list";
    render();
  });
};

window.restartRoutine = () => {
  state.play = { current: 0, remaining: 0, paused: false, timerId: null, currentSet: 1, isResting: false };
  state.screen = "play";
  render();
};

window.goNewRoutine = () => {
  state.builder = { editingId: null, name: "", desc: "", steps: [], editingStepIndex: null, editingStep: null, original_author: null, is_modified: false };
  state.screen = "builder";
  render();
};

window.goEditRoutine = (id) => {
  const r = state.routines[id];
  if (!r) return;
  state.builder = {
    editingId: id,
    name: r.name,
    desc: r.desc || '',
    steps: JSON.parse(JSON.stringify(r.steps)),
    editingStepIndex: null,
    editingStep: null,
    original_author: r.original_author || null,
    initial_steps_json: JSON.stringify(r.steps),
    initial_name: r.name || '',
    is_modified: r.is_modified || false
  };
  state.screen = "builder";
  render();
};

window.deleteRoutine = (id) => {
  if (!id) {
    state.screen = "list";
    render();
    return;
  }
  showConfirmModal({
    icon: getSfSymbol('trash.fill', 36, 'var(--color-danger)'),
    title: '루틴 삭제',
    message: '정말 이 루틴을 삭제하시겠습니까? 삭제된 루틴은 복구할 수 없습니다.',
    confirmText: '삭제하기',
    cancelText: '취소',
    isDanger: true,
    onConfirm: async () => {
      delete state.routines[id];
      state.routineOrder = state.routineOrder.filter(rId => rId !== id);
      await deleteRoutineStorage(id);
      await persistList();
      state.screen = "list";
      render();
      showToast("루틴이 삭제되었습니다.");
    }
  });
};

window.updateBuilderName = (val) => { state.builder.name = val; };
window.updateBuilderDesc = (val) => { state.builder.desc = val; };

window.updateForm = (field, val) => {
  if (['mm', 'ss', 'reps', 'sets', 'restSeconds'].includes(field)) {
    formDraft[field] = parseInt(val) || 0;
  } else {
    formDraft[field] = val;
  }
};

window.setFormType = (type) => {
  formDraft.type = type;
  render();
};

window.addExerciseFromForm = () => {
  if (!formDraft.name.trim()) return showToast("운동 이름을 입력해 주세요.");
  const b = state.builder;
  const seconds = (formDraft.mm || 0) * 60 + (formDraft.ss || 0);
  const step = {
    name: formDraft.name.trim(),
    target: formDraft.target.trim(),
    desc: formDraft.desc.trim(),
    type: formDraft.type,
    seconds: formDraft.type === 'timer' ? seconds : 0,
    reps: formDraft.type === 'manual' ? formDraft.reps : 0,
    sets: formDraft.sets || 1,
    restSeconds: formDraft.restSeconds || 0
  };
  b.steps.push(step);
  formDraft.name = "";
  formDraft.target = "";
  formDraft.desc = "";
  render();
};

window.saveRoutine = async () => {
  const b = state.builder;
  if (!b.name.trim()) return showToast("루틴 이름을 입력해 주세요.");
  if (b.steps.length === 0) return showToast("최소 1개 이상의 운동을 추가해 주세요.");

  const id = b.editingId || "rt-" + Date.now();
  const existing = state.routines[id] || {};

  let isModified = false;
  if (b.original_author) {
    const stepsChanged = JSON.stringify(b.steps) !== (b.initial_steps_json || "");
    const nameChanged = b.name.trim() !== (b.initial_name || "").trim();
    const descChanged = (b.desc || "").trim() !== (b.initial_desc || "").trim();
    isModified = stepsChanged || nameChanged || descChanged || (existing.is_modified || false);
  }

  const routineObj = {
    ...existing,
    id,
    name: b.name.trim(),
    desc: (b.desc || "").trim(),
    steps: b.steps,
    original_author: b.original_author || null,
    is_modified: b.original_author ? isModified : false,
    updatedAt: new Date().toISOString()
  };

  state.routines[id] = routineObj;
  if (!state.routineOrder.includes(id)) {
    state.routineOrder.push(id);
  }

  await persistRoutine(routineObj);
  await persistList();
  showToast("루틴이 저장되었습니다.");
  state.screen = "list";
  render();
};

window.startInlineEdit = (i) => {
  state.builder.editingStepIndex = i;
  render();
};

window.toggleInlineType = (i, type) => {
  const s = state.builder.steps[i];
  if (!s || s.type === type) return;

  const nameEl = document.getElementById(`edit-name-${i}`);
  const targetEl = document.getElementById(`edit-target-${i}`);
  const descEl = document.getElementById(`edit-desc-${i}`);
  const setsEl = document.getElementById(`edit-sets-${i}`);
  const restEl = document.getElementById(`edit-rest-${i}`);

  if (nameEl) s.name = nameEl.value;
  if (targetEl) s.target = targetEl.value;
  if (descEl) s.desc = descEl.value;
  if (setsEl) s.sets = parseInt(setsEl.value) || s.sets || 1;
  if (restEl) s.restSeconds = parseInt(restEl.value) || s.restSeconds || 0;

  if (s.type === 'timer') {
    const mmEl = document.getElementById(`edit-mm-${i}`);
    const ssEl = document.getElementById(`edit-ss-${i}`);
    const mm = mmEl ? (parseInt(mmEl.value) || 0) : 0;
    const ss = ssEl ? (parseInt(ssEl.value) || 0) : 0;
    s.seconds = mm * 60 + ss;
  } else {
    const repsEl = document.getElementById(`edit-reps-${i}`);
    if (repsEl) s.reps = parseInt(repsEl.value) || s.reps || 10;
  }

  s.type = type;
  if (type === 'timer' && !s.seconds) s.seconds = 30;
  if (type === 'manual' && !s.reps) s.reps = 10;

  render();
};

window.cancelInlineEdit = () => {
  state.builder.editingStepIndex = null;
  render();
};

window.saveInlineEdit = (i) => {
  const s = state.builder.steps[i];
  if (s.type === 'transition') {
    const ssEl = document.getElementById(`edit-ss-${i}`);
    s.seconds = ssEl ? (parseInt(ssEl.value) || 15) : 15;
    state.builder.editingStepIndex = null;
    render();
    return;
  }
  const nameEl = document.getElementById(`edit-name-${i}`);
  const targetEl = document.getElementById(`edit-target-${i}`);
  const descEl = document.getElementById(`edit-desc-${i}`);
  const setsEl = document.getElementById(`edit-sets-${i}`);
  const restEl = document.getElementById(`edit-rest-${i}`);

  if (!nameEl || !nameEl.value.trim()) return showToast("운동 이름을 입력하세요.");

  s.name = nameEl.value.trim();
  s.target = targetEl ? targetEl.value.trim() : "";
  s.desc = descEl ? descEl.value.trim() : "";
  s.sets = setsEl ? (parseInt(setsEl.value) || 1) : 1;
  s.restSeconds = restEl ? (parseInt(restEl.value) || 0) : 0;

  if (s.type === 'timer') {
    const mmEl = document.getElementById(`edit-mm-${i}`);
    const ssEl = document.getElementById(`edit-ss-${i}`);
    const mm = mmEl ? (parseInt(mmEl.value) || 0) : 0;
    const ss = ssEl ? (parseInt(ssEl.value) || 0) : 0;
    s.seconds = mm * 60 + ss;
  } else {
    const repsEl = document.getElementById(`edit-reps-${i}`);
    s.reps = repsEl ? (parseInt(repsEl.value) || 10) : 10;
  }

  state.builder.editingStepIndex = null;
  render();
};

window.removeStep = (i) => {
  state.builder.steps.splice(i, 1);
  render();
};

window.promptInsertTransitions = () => {
  const b = state.builder;
  if (!b) return;
  const hasTrans = b.steps.some(s => s.type === 'transition');
  const existingTrans = b.steps.find(s => s.type === 'transition');
  const defaultVal = existingTrans ? String(existingTrans.seconds || 15) : '15';

  showPromptModal({
    icon: getSfSymbol('stopwatch', 36, 'var(--text-brand-accent)'),
    title: hasTrans ? '트랜지션타임 일괄수정' : '휴식 및 전환 추가',
    message: hasTrans 
      ? '모든 휴식 및 전환 시간을 일괄 수정할 시간(초)을 입력하세요:' 
      : '모든 운동 사이에 자동으로 삽입할 휴식 및 전환 시간(초)을 입력하세요:',
    defaultValue: defaultVal,
    confirmText: hasTrans ? '일괄 수정' : '전환 추가',
    cancelText: '취소',
    onConfirm: (sec) => {
      if (!sec || isNaN(sec)) return;
      const restSec = parseInt(sec);
      
      if (hasTrans) {
        b.steps.forEach(s => {
          if (s.type === 'transition') {
            s.seconds = restSec;
          }
        });
      } else {
        const newSteps = [];
        b.steps.forEach((s, idx) => {
          newSteps.push(s);
          if (idx < b.steps.length - 1 && s.type !== 'transition' && b.steps[idx + 1].type !== 'transition') {
            newSteps.push({ name: "휴식 및 전환", type: "transition", seconds: restSec, sets: 1, restSeconds: 0 });
          }
        });
        b.steps = newSteps;
      }
      render();
      showToast(hasTrans ? "트랜지션타임이 일괄 수정되었습니다." : "휴식 및 전환이 추가되었습니다.");
    }
  });
};

window.handleLogout = async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  state.user = null;
  state.userProfile = null;
  saveLocalUserProfile(null);
  showToast("로그아웃 되었습니다.");
  render();
};

window.saveProfile = async () => {
  const nameEl = document.getElementById("profName");
  const avatarEl = document.getElementById("profAvatar");
  const name = nameEl ? nameEl.value.trim() : "";
  const avatar = avatarEl ? avatarEl.value : "";

  if (!name) return showToast("닉네임을 입력해 주세요.");

  state.userProfile = { display_name: name, avatar_url: avatar };
  saveLocalUserProfile(state.userProfile);

  if (state.user && supabaseClient) {
    await supabaseClient.from('profiles').upsert({
      id: state.user.id,
      display_name: name,
      avatar_url: avatar,
      updated_at: new Date().toISOString()
    });
  }

  showToast("프로필이 저장되었습니다.");
  render();
};

window.uploadAvatar = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!state.user || !supabaseClient) return showToast("로그인이 필요합니다.");

  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${state.user.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const avatarInput = document.getElementById("profAvatar");
    if (avatarInput) avatarInput.value = publicUrl;

    state.userProfile = state.userProfile || {};
    state.userProfile.avatar_url = publicUrl;
    saveLocalUserProfile(state.userProfile);

    const container = document.getElementById("avatarPreviewContainer");
    if (container) container.innerHTML = `<img src="${publicUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;

    showToast("프로필 사진이 업데이트되었습니다.");
  } catch (e) {
    alert("이미지 업로드에 실패했습니다: " + e.message);
  }
};

// ---- App Initialization ----
export function init() {
  try {
    const listRaw = localStorage.getItem("routines:list");
    if (!listRaw) {
      state.routineOrder = [DEFAULT_TVA_ROUTINE.id];
      state.routines = { [DEFAULT_TVA_ROUTINE.id]: DEFAULT_TVA_ROUTINE };
      localStorage.setItem("routines:list", JSON.stringify(state.routineOrder));
      localStorage.setItem("routines:" + DEFAULT_TVA_ROUTINE.id, JSON.stringify(DEFAULT_TVA_ROUTINE));
    } else {
      const ids = JSON.parse(listRaw);
      const routines = {};
      for (const id of ids) {
        const raw = localStorage.getItem("routines:" + id);
        if (raw) {
          try { routines[id] = JSON.parse(raw); } catch(e) {}
        }
      }
      state.routineOrder = ids.filter(id => routines[id]);
      state.routines = routines;
      if (state.routineOrder.length === 0) {
        state.routineOrder = [DEFAULT_TVA_ROUTINE.id];
        state.routines = { [DEFAULT_TVA_ROUTINE.id]: DEFAULT_TVA_ROUTINE };
        localStorage.setItem("routines:list", JSON.stringify(state.routineOrder));
        localStorage.setItem("routines:" + DEFAULT_TVA_ROUTINE.id, JSON.stringify(DEFAULT_TVA_ROUTINE));
      }
    }
  } catch (e) {
    state.routineOrder = [DEFAULT_TVA_ROUTINE.id];
    state.routines = { [DEFAULT_TVA_ROUTINE.id]: DEFAULT_TVA_ROUTINE };
  }

  state.screen = "list";
  render();
}

// Start App immediately with fail-safe error handling
function startApp() {
  try {
    init();
    initTooltipListeners();
    initSupabaseAuth(render);
  } catch (e) {
    console.error("App startup error:", e);
    render();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

const generate6CharShareCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

window.shareRoutine = async (id) => {
  const r = state.routines[id];
  if (!r) return;

  const currentAuthorName = (state.userProfile && state.userProfile.display_name) || (state.user && state.user.email ? state.user.email.split('@')[0] : "나");
  const currentAuthorAvatar = (state.userProfile && state.userProfile.avatar_url) || "";

  let code = r.shareCode;
  if (!code) {
    code = generate6CharShareCode();
    r.shareCode = code;
    await persistRoutine(r);
  }

  // Option 3: If modified by current user, current user becomes the new author of this shared variant!
  let sharedAuthor = r.original_author;
  let sharedIsModified = r.is_modified || false;

  if (r.is_modified || !r.original_author) {
    sharedAuthor = {
      name: currentAuthorName,
      avatar: currentAuthorAvatar
    };
    sharedIsModified = false;
  }

  // Upload shared copy with author info to cloud
  const sharedPayload = {
    ...r,
    original_author: sharedAuthor,
    is_modified: sharedIsModified
  };

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('shared_routines')
        .upsert({
          share_code: code,
          routine_data: sharedPayload,
          author_name: sharedPayload.original_author.name,
          author_avatar: sharedPayload.original_author.avatar,
          created_at: new Date().toISOString()
        });
    } catch(e) {
      console.warn("Shared routine cloud upsert warning:", e);
    }
  }

  try {
    const sharedRegistry = JSON.parse(localStorage.getItem("routines:shared") || "{}");
    sharedRegistry[code] = sharedPayload;
    localStorage.setItem("routines:shared", JSON.stringify(sharedRegistry));
  } catch(e) {}

  try {
    await navigator.clipboard.writeText(code);
    showToast(`공유 코드(${code})가 복사되었습니다!`);
  } catch(e) {
    showToast(`공유 코드: ${code}`);
  }
  render();
};

window.promptImportRoutineToBuilder = () => {
  showPromptModal({
    icon: getSfSymbol('link', 36, 'var(--text-brand-accent)'),
    title: '루틴 코드로 불러오기',
    message: '공유받은 6자리 루틴 코드를 입력해 주세요 (예: X7K9M2):',
    defaultValue: '',
    placeholder: 'X7K9M2',
    inputType: 'text',
    unitLabel: '',
    confirmText: '불러오기',
    cancelText: '취소',
    onConfirm: async (codeVal) => {
      if (!codeVal || !codeVal.trim()) return;
      const code = codeVal.trim().toUpperCase();
      let importedRoutine = null;

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('shared_routines')
            .select('routine_data, author_name, author_avatar')
            .eq('share_code', code)
            .maybeSingle();

          if (data && data.routine_data) {
            importedRoutine = data.routine_data;
            if (!importedRoutine.original_author && data.author_name) {
              importedRoutine.original_author = {
                name: data.author_name,
                avatar: data.author_avatar || ""
              };
            }
          }
        } catch(e) {
          console.warn("Supabase fetch shared routine error:", e);
        }
      }

      if (!importedRoutine) {
        try {
          const sharedRegistry = JSON.parse(localStorage.getItem("routines:shared") || "{}");
          if (sharedRegistry[code]) {
            importedRoutine = sharedRegistry[code];
          }
        } catch(e) {}
      }

      if (!importedRoutine) {
        showToast("유효하지 않거나 존재하지 않는 루틴 코드입니다.");
        return;
      }

      const authorObj = importedRoutine.original_author || {
        name: "익명",
        avatar: ""
      };

      state.builder = {
        editingId: null,
        name: importedRoutine.name || "불러온 루틴",
        desc: importedRoutine.desc || "",
        steps: JSON.parse(JSON.stringify(importedRoutine.steps || [])),
        editingStepIndex: null,
        editingStep: null,
        original_author: authorObj,
        initial_steps_json: JSON.stringify(importedRoutine.steps || []),
        initial_name: (importedRoutine.name || "").trim(),
        initial_desc: (importedRoutine.desc || "").trim(),
        is_modified: false
      };

      state.screen = "builder";
      render();
      showToast(`${authorObj.name}님의 루틴을 불러왔습니다!`);
    }
  });
};

window.promptImportRoutine = window.promptImportRoutineToBuilder;