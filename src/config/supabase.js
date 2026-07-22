import { state, saveLocalUserProfile } from '../store/state.js';

export const supabaseUrl = "https://jqgyjmampztcagqtzfol.supabase.co";
export const supabaseKey = "sb_publishable_4Br2T12uYJ338QOCvuuTYA_3rcU1ueY";
export let supabaseClient = null;

try {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
} catch(e) {
  console.error("Supabase initialize failed", e);
}

export function initSupabaseAuth(onAuthChanged) {
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        state.screen = "reset_password";
      } else if (session) {
        state.user = session.user;
        await loadUserProfileCloud();
      } else {
        state.user = null;
        state.userProfile = null;
        saveLocalUserProfile(null);
      }
      onAuthChanged();
    });
  }
}

export async function loadUserProfileCloud() {
  if (!state.user || !supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', state.user.id)
      .maybeSingle();

    if (!error && data && (data.display_name || data.avatar_url)) {
      state.userProfile = {
        display_name: data.display_name || "",
        avatar_url: data.avatar_url || ""
      };
      saveLocalUserProfile(state.userProfile);
    }
  } catch (e) {
    console.error("Failed to load user profile from cloud:", e);
  }
}
