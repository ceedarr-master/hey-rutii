export const DEFAULT_TVA_ROUTINE = {
  id: "tva-core",
  name: "TVA 코어 루틴 (데모)",
  steps: [
    { name: "복식호흡 브레이싱", type: "timer", seconds: 120, sets: 1, restSeconds: 0 },
    { name: "데드버그", type: "manual", reps: 15, sets: 2, restSeconds: 10 },
    { name: "버드독", type: "manual", reps: 14, sets: 2, restSeconds: 10 },
    { name: "브레이싱 플랭크", type: "timer", seconds: 30, sets: 4, restSeconds: 5 },
    { name: "크런치", type: "manual", reps: 20, sets: 2, restSeconds: 10 },
    { name: "사이드 크런치", type: "manual", reps: 20, sets: 2, restSeconds: 10 },
    { name: "러시안트위스트", type: "manual", reps: 20, sets: 3, restSeconds: 10 },
    { name: "펠빅틸트", type: "manual", reps: 10, sets: 2, restSeconds: 15 }
  ]
};

export function saveLocalUserProfile(profile) {
  try {
    if (profile) localStorage.setItem("user_profile", JSON.stringify(profile));
    else localStorage.removeItem("user_profile");
  } catch(e) {}
}

export function getLocalUserProfile() {
  try {
    const raw = localStorage.getItem("user_profile");
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

export const state = {
  screen: "loading",
  routineOrder: [],
  routines: {},
  currentId: null,
  play: { current: 0, remaining: 0, paused: false, timerId: null, currentSet: 1, isResting: false, startTime: null },
  progress: {},
  builder: { editingId: null, name: "", steps: [], editingStepIndex: null, editingStep: null },
  statsFilter: "all",
  soundEnabled: true,
  statsCalendarOffset: 0,
  statsWeekOffset: 0,
  activityPage: 0,
  user: null,
  userProfile: getLocalUserProfile(),
  authEmail: "",
  syncStatus: "idle"
};

export const formDraft = { type: "timer", name: "", target: "", desc: "", mm: 0, ss: 30, reps: 10, sets: 2, restSeconds: 15 };
export let audioCtx = null;
export function setAudioCtx(ctx) { audioCtx = ctx; }
