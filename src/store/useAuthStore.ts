import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface AuthState {
  ready: boolean;
  user: User | null;
  session: Session | null;

  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;

  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;

  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
  setSyncedNow: (at: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  ready: !isSupabaseConfigured,
  user: null,
  session: null,
  syncStatus: isSupabaseConfigured ? 'idle' : 'offline',
  syncError: null,
  lastSyncedAt: null,

  signIn: async (email, password) => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return error ? { error: error.message } : {};
  },

  signUp: async (email, password) => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };
    return { needsConfirmation: !data.session };
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  setSyncStatus: (syncStatus, syncError = null) =>
    set({ syncStatus, syncError }),
  setSyncedNow: (lastSyncedAt) =>
    set({ lastSyncedAt, syncStatus: 'synced', syncError: null }),
}));

export function initAuth() {
  if (!supabase) return;

  supabase.auth.getSession().then(({ data }) => {
    useAuthStore.setState({
      session: data.session,
      user: data.session?.user ?? null,
      ready: true,
    });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({
      session,
      user: session?.user ?? null,
      ready: true,
    });
  });
}
