import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore, type SyncStatus } from '../store/useAuthStore';
import { syncNow } from '../store/sync';
import { useProjectStore } from '../store/useProjectStore';
import { computeDashboard } from '../lib/dashboardStats';
import AttributeSheet from '../components/dashboard/AttributeSheet';
import Achievements from '../components/dashboard/Achievements';

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: 'Not synced yet',
  syncing: 'Syncing…',
  synced: 'Up to date',
  error: 'Sync error',
  offline: 'Offline — changes saved locally',
};

export default function Profile() {
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const syncError = useAuthStore((s) => s.syncError);
  const lastSyncedAt = useAuthStore((s) => s.lastSyncedAt);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);

  const projects = useProjectStore((s) => s.projects);
  const tasks = useProjectStore((s) => s.tasks);
  const data = useMemo(
    () => computeDashboard(projects, tasks),
    [projects, tasks]
  );

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'error' | 'info';
    text: string;
  } | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setMessage(null);
    const res =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
    setBusy(false);
    if (res.error) {
      setMessage({ kind: 'error', text: res.error });
    } else if ('needsConfirmation' in res && res.needsConfirmation) {
      setMessage({
        kind: 'info',
        text: 'Check your email to confirm your account, then sign in.',
      });
      setMode('signin');
    }
  };

  return (
    <div>
      <header className="mb-4 flex items-center gap-1">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          className="-ml-1 p-1 text-slate-300 active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-100">
          Profile
        </h1>
      </header>

      <section className="mb-2.5 flex flex-col gap-2.5">
        <AttributeSheet attributes={data.attributes} />
        <Achievements metrics={data.metrics} />
      </section>

      <section className="rounded-xl border border-ink-line bg-ink-soft p-4">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-100">
          {syncStatus === 'offline' || !user ? (
            <CloudOff size={16} className="text-slate-400" />
          ) : (
            <Cloud size={16} className="text-accent" />
          )}
          Cloud sync
        </h2>
        <p className="mb-3 text-xs text-slate-400">
          Your projects are always saved on this device. Sign in to back them up
          and sync across devices.
        </p>

        {!isSupabaseConfigured ? (
          <div className="rounded-lg border border-ink-line bg-ink p-3 text-xs text-slate-300">
            <p className="mb-1 font-semibold text-slate-100">
              Backend not configured
            </p>
            <p>
              Add <code className="text-accent">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-accent">VITE_SUPABASE_ANON_KEY</code> to a{' '}
              <code className="text-accent">.env.local</code> file (see{' '}
              <code className="text-accent">.env.example</code>) and restart the
              dev server.
            </p>
          </div>
        ) : !ready ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : user ? (
          <div>
            <div className="mb-3 rounded-lg border border-ink-line bg-ink p-3">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="break-all text-sm font-medium text-slate-100">
                {user.email}
              </p>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-lg border border-ink-line bg-ink px-3 py-2.5">
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    syncStatus === 'error'
                      ? 'text-rose-300'
                      : 'text-slate-100'
                  }`}
                >
                  {SYNC_LABEL[syncStatus]}
                </p>
                {syncStatus === 'error' && syncError && (
                  <p className="break-words text-xs text-rose-400">
                    {syncError}
                  </p>
                )}
                {lastSyncedAt && syncStatus !== 'error' && (
                  <p className="text-xs text-slate-500">
                    Last synced {new Date(lastSyncedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => void syncNow()}
                disabled={syncStatus === 'syncing'}
                aria-label="Sync now"
                className="ml-2 shrink-0 rounded-lg border border-ink-line p-2 text-slate-300 active:scale-95 disabled:opacity-40"
              >
                <RefreshCw
                  size={16}
                  className={syncStatus === 'syncing' ? 'animate-spin' : ''}
                />
              </button>
            </div>

            <button
              onClick={() => void signOut()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-line bg-ink py-2 text-sm font-semibold text-slate-200 active:scale-95"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mb-2 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
            <input
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Password"
              className="mb-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />

            {message && (
              <p
                className={`mb-3 text-xs ${
                  message.kind === 'error' ? 'text-rose-400' : 'text-accent'
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              onClick={submit}
              disabled={busy || !email.trim() || !password}
              className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink transition-transform active:scale-95 disabled:opacity-40"
            >
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
            </button>

            <button
              onClick={() => {
                setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                setMessage(null);
              }}
              className="mt-3 w-full text-center text-xs text-slate-400 active:scale-95"
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
