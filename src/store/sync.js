import { state, DEFAULT_TVA_ROUTINE } from './state.js';
import { supabaseClient } from '../config/supabase.js';

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

// Helper to merge local and cloud history seamlessly by unique log ID/completedAt
function mergeHistoryLogs(localLogs = [], cloudLogs = []) {
  const map = new Map();
  
  // Add cloud logs
  (cloudLogs || []).forEach(log => {
    if (log && (log.id || log.completedAt)) {
      const key = log.id || `${log.routineId}_${log.completedAt}`;
      map.set(key, log);
    }
  });

  // Add local logs (gives priority or union)
  (localLogs || []).forEach(log => {
    if (log && (log.id || log.completedAt)) {
      const key = log.id || `${log.routineId}_${log.completedAt}`;
      map.set(key, log);
    }
  });

  // Convert back to array sorted descending by completedAt
  const merged = Array.from(map.values()).sort((a, b) => {
    return new Date(b.completedAt || 0) - new Date(a.completedAt || 0);
  });

  return merged;
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
      if (raw) {
        try { localRoutines[id] = JSON.parse(raw); } catch(e) {}
      }
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

    // Always merge history logs from both local and cloud so no device loses workout completions!
    const mergedHistory = mergeHistoryLogs(localHistory, data.history || []);
    localStorage.setItem("routines:history", JSON.stringify(mergedHistory));
    
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
      state.syncStatus = "synced";
    } else {
      const now = new Date().toISOString();
      await supabaseClient
        .from('user_sync')
        .update({
          routine_order: localOrder,
          routines: localRoutines,
          history: mergedHistory,
          updated_at: now
        })
        .eq('user_id', state.user.id);
      state.syncStatus = "synced";
    }

    // If on stats or list screen, trigger UI update
    if (typeof window !== 'undefined' && typeof window.render === 'function') {
      window.render();
    }
  } catch (e) {
    console.error("Sync error:", e);
    state.syncStatus = "error";
  }
}
