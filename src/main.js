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
import { showToast, showConfirm, escapeHtml } from './utils/helpers.js';

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
      if ((s.type === "timer" || state.play.isResting) && !state.play.paused) {
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

window.goIntro = (id) => {
  state.currentId = id;
  state.screen = "intro";
  render();
};

window.startPlay = () => {
  const routine = state.routines[state.currentId];
  if (!routine || routine.steps.length === 0) return alert("운동 목록이 비어있습니다.");
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
  showConfirm("처음부터 다시 시작하시겠습니까?", () => {
    delete state.routines[id].progress;
    persistRoutine(state.routines[id]);
    state.currentId = id;
    state.play = { current: 0, remaining: 0, paused: false, timerId: null, currentSet: 1, isResting: false };
    state.screen = "play";
    render();
  });
};

window.nextStep = () => {
  clearTimer();
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
  if (state.play.current > 0) {
    state.play.current--;
    state.play.currentSet = 1;
    state.play.remaining = 0;
    state.play.isResting = false;
    render();
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
  state.builder = { editingId: null, name: "", steps: [], editingStepIndex: null, editingStep: null };
  state.screen = "builder";
  render();
};

window.goEditRoutine = (id) => {
  const r = state.routines[id];
  if (!r) return;
  state.builder = {
    editingId: id,
    name: r.name,
    steps: JSON.parse(JSON.stringify(r.steps)),
    editingStepIndex: null,
    editingStep: null
  };
  state.screen = "builder";
  render();
};

window.deleteRoutine = (id) => {
  showConfirm("정말 이 루틴을 삭제하시겠습니까?", async () => {
    delete state.routines[id];
    state.routineOrder = state.routineOrder.filter(i => i !== id);
    await deleteRoutineStorage(id);
    await persistList();
    render();
  });
};

window.updateBuilderName = (val) => { state.builder.name = val; };

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
  if (!formDraft.name.trim()) return alert("운동 이름을 입력해 주세요.");
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
  if (!b.name.trim()) return alert("루틴 이름을 입력해 주세요.");
  if (b.steps.length === 0) return alert("최소 1개 이상의 운동을 추가해 주세요.");

  const id = b.editingId || "rt-" + Date.now();
  const routineObj = {
    id,
    name: b.name.trim(),
    steps: b.steps,
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

window.cancelInlineEdit = () => {
  state.builder.editingStepIndex = null;
  render();
};

window.saveInlineEdit = (i) => {
  const s = state.builder.steps[i];
  const nameEl = document.getElementById(`edit-name-${i}`);
  const targetEl = document.getElementById(`edit-target-${i}`);
  const descEl = document.getElementById(`edit-desc-${i}`);
  const setsEl = document.getElementById(`edit-sets-${i}`);
  const restEl = document.getElementById(`edit-rest-${i}`);

  if (!nameEl || !nameEl.value.trim()) return alert("운동 이름을 입력하세요.");

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
  const sec = prompt("운동 사이에 추가할 휴식 시간(초)을 입력해 주세요:", "15");
  if (!sec || isNaN(sec)) return;
  const restSec = parseInt(sec);
  const b = state.builder;
  const newSteps = [];
  b.steps.forEach((s, idx) => {
    newSteps.push(s);
    if (idx < b.steps.length - 1 && s.type !== 'transition' && b.steps[idx + 1].type !== 'transition') {
      newSteps.push({ name: "휴식 및 전환", type: "transition", seconds: restSec, sets: 1, restSeconds: 0 });
    }
  });
  b.steps = newSteps;
  render();
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

  if (!name) return alert("닉네임을 입력해 주세요.");

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
  if (!state.user || !supabaseClient) return alert("로그인이 필요합니다.");

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

// Start App when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSupabaseAuth(render);
    init();
  });
} else {
  initSupabaseAuth(render);
  init();
}
