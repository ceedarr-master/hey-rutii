import { state, DEFAULT_TVA_ROUTINE } from './state.js';
import { supabaseClient } from '../config/supabase.js';
import { showToast } from '../utils/helpers.js';

export async function triggerCloudSync() {
  const now = Date.now();
  localStorage.setItem("routines:updated_at", now.toString());
  if (state.user) {
    await syncData();
  }
}

export async function persistList() {
  try { localStorage.setItem("routines:list", JSON.stringify(state.routineOrder)); }
  catch (e) { console.error("list save failed", e); }
  await triggerCloudSync();
}

export async function persistRoutine(routine) {
  try { localStorage.setItem("routines:" + routine.id, JSON.stringify(routine)); }
  catch (e) { console.error("routine save failed", e); }
  await triggerCloudSync();
}

export async function deleteRoutineStorage(id) {
  try { localStorage.removeItem("routines:" + id); } catch (e) {}
  await triggerCloudSync();
}

export async function syncData() {
  if (!state.user || !supabaseClient) return;
  try {
    state.syncStatus = "syncing";
    
    const { data, error } = await supabaseClient
      .from('user_sync')
      .select('*')
      .eq('user_id', state.user.id)
      .maybeSingle();
      
    const localOrder = JSON.parse(localStorage.getItem("routines:list") || "[]");
    const localHistory = JSON.parse(localStorage.getItem("routines:history") || "[]");
    const localUpdatedAt = parseInt(localStorage.getItem("routines:updated_at") || "0");
    
    const localRoutines = {};
    localOrder.forEach(id => {
      const raw = localStorage.getItem("routines:" + id);
      if (raw) localRoutines[id] = JSON.parse(raw);
    });
    
    if (!data) {
      const now = new Date().toISOString();
      await supabaseClient
        .from('user_sync')
        .insert({
          user_id: state.user.id,
          routine_order: localOrder,
          routines: localRoutines,
          history: localHistory,
          updated_at: now
        });
      state.syncStatus = "synced";
      return;
    }
    
    const cloudUpdatedAt = new Date(data.updated_at).getTime();
    if (cloudUpdatedAt > localUpdatedAt) {
      if (data.routine_order) {
        state.routineOrder = data.routine_order;
        localStorage.setItem("routines:list", JSON.stringify(data.routine_order));
      }
      if (data.routines) {
        state.routines = data.routines;
        Object.keys(data.routines).forEach(id => {
          localStorage.setItem("routines:" + id, JSON.stringify(data.routines[id]));
        });
      }
      if (data.history) {
        localStorage.setItem("routines:history", JSON.stringify(data.history));
      }
      state.syncStatus = "synced";
    } else {
      const now = new Date().toISOString();
      await supabaseClient
        .from('user_sync')
        .update({
          routine_order: localOrder,
          routines: localRoutines,
          history: localHistory,
          updated_at: now
        })
        .eq('user_id', state.user.id);
      state.syncStatus = "synced";
    }
  } catch (e) {
    console.error("Sync error:", e);
    state.syncStatus = "error";
  }
}
