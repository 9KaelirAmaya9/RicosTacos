/**
 * AuthContext — shared auth + role state for the entire app.
 *
 * v4 — fixes PWA infinite spinner after sign-in:
 *
 *  Problem 1: fetchRoles() called supabase.auth.getSession() internally to
 *  get the JWT. In PWA/standalone mode, getSession() deadlocks when called
 *  while the GoTrueClient lock is held by the auth state change handler.
 *  Fix: fetchRoles() now accepts an optional accessToken parameter. The
 *  caller (initialize) passes the token it already has — no extra getSession().
 *
 *  Problem 2: SIGNED_IN fires twice in PWA mode (once from the auth state
 *  change subscription, once from the initial session check). The second call
 *  hits the initInProgress guard and returns immediately, leaving loading=true
 *  forever if the first call is still running.
 *  Fix: add a pendingSignIn ref. If SIGNED_IN arrives while initInProgress is
 *  true, store the session and re-run initialize() after the current one ends.
 *
 *  Problem 3 (original): supabase.from('user_roles') deadlocks under the same
 *  GoTrueClient lock. Fix retained from v3: use raw fetch() to the REST API.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setUser as setSentryUser, clearUser as clearSentryUser } from "@/utils/sentry";

export type AppRole = "admin" | "kitchen";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  rolesLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  hasRole: (role: AppRole) => boolean;
  signOut: () => Promise<void>;
  refetchRoles: () => Promise<void>;
}

// ─── localStorage role cache (90s TTL) ───────────────────────────────────────
// localStorage persists across PWA restarts (unlike sessionStorage which clears
// on every app open in standalone mode). userId guard + TTL keep it safe.
const CACHE_KEY = "rt_roles_cache";
const CACHE_TTL = 90 * 1000;

function readCache(userId: string): AppRole[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c.userId !== userId || Date.now() - c.fetchedAt > CACHE_TTL) return null;
    return c.roles;
  } catch { return null; }
}

function writeCache(userId: string, roles: AppRole[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, roles, fetchedAt: Date.now() })); } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, roles: [], loading: true, rolesLoading: false, error: null,
  });

  const initInProgress = useRef(false);
  // If SIGNED_IN fires while init is running, store the session here and
  // re-run initialize() after the current one completes.
  const pendingSignIn = useRef<{ session: Session | null; force: boolean } | null>(null);

  // ── Fetch roles via raw fetch() — bypasses GoTrueClient lock entirely ────────
  // supabase.from() deadlocks when the GoTrueClient lock is held on mount.
  // Raw fetch() goes directly to the REST API with no lock dependency.
  // accessToken: pass the JWT from the session you already have — avoids
  // calling getSession() (which also acquires the lock) inside this function.
  const fetchRoles = useCallback(async (
    userId: string,
    force = false,
    accessToken?: string
  ): Promise<AppRole[]> => {
    if (!force) {
      const cached = readCache(userId);
      if (cached) return cached;
    }
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '';

      // If no accessToken is provided, we cannot make an authenticated request.
      // Falling back to the anon key returns [] due to RLS (anon can't read user_roles).
      // Return empty and let the auth state change handler retry with the real token.
      if (!accessToken) {
        console.warn("[Auth] fetchRoles called without accessToken — skipping to avoid anon fallback");
        return [];
      }
      const authHeader = `Bearer ${accessToken}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_roles?select=role&user_id=eq.${userId}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': authHeader,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        console.error("[Auth] role fetch HTTP error:", response.status);
        return [];
      }
      const data = await response.json();
      const roles: AppRole[] = (data || []).map((r: { role: AppRole }) => r.role);
      writeCache(userId, roles);
      return roles;
    } catch (e: any) {
      console.error("[Auth] role fetch failed:", e.message);
      return [];
    }
  }, []);

  // ── Core initializer ─────────────────────────────────────────────────────────
  const initialize = useCallback(async (session: Session | null, forceRoles = false) => {
    if (initInProgress.current) {
      // Queue this sign-in so we process it after the current init finishes
      if (forceRoles) {
        pendingSignIn.current = { session, force: true };
      }
      return;
    }
    initInProgress.current = true;
    pendingSignIn.current = null;

    let settled = false;
    const hardStop = setTimeout(() => {
      if (settled) return; // setState already called — don't overwrite good state
      console.warn("[Auth] Hard stop after 8s");
      setState(prev => ({ ...prev, loading: false, rolesLoading: false, error: "Session check timed out. Please sign in again." }));
      initInProgress.current = false;
    }, 8000);

    try {
      if (!session) {
        // getSession() already read localStorage — if it returned null, there is no session.
        // Calling getUser() here would acquire the GoTrueClient lock with no token to send,
        // deadlocking any concurrent signInWithPassword() call.
        settled = true;
        setState({ user: null, session: null, roles: [], loading: false, rolesLoading: false, error: null });
        initInProgress.current = false;
        return;
      } else {
        // Fresh sign-in: set user+session immediately (loading=true) so ProtectedRoute
        // shows spinner instead of redirecting with stale user=null state
        if (forceRoles) {
          setState(prev => ({ ...prev, rolesLoading: true, loading: false, user: session.user, session }));
        }
        // Session already in hand — pass its access_token directly to fetchRoles
        // NOTE: hardStop stays active until fetchRoles completes (not cleared early)
        const roles = await fetchRoles(session.user.id, forceRoles, session.access_token);
        settled = true;
        setSentryUser({ id: session.user.id, email: session.user.email });
        setState({ user: session.user, session, roles, loading: false, rolesLoading: false, error: null });
      }
    } catch (e: any) {
      settled = true;
      console.error("[Auth] init error:", e.message);
      setState({ user: null, session: null, roles: [], loading: false, rolesLoading: false, error: "Authentication error. Please sign in again." });
    } finally {
      clearTimeout(hardStop);
      initInProgress.current = false;
      // Process any SIGNED_IN that arrived while we were running
      if (pendingSignIn.current) {
        const { session: pendingSession, force } = pendingSignIn.current;
        pendingSignIn.current = null;
        console.log("[Auth] processing queued SIGNED_IN");
        initialize(pendingSession, force);
      }
    }
  }, [fetchRoles]);

  // ── Mount ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // getSession() reads localStorage — no network call unless token needs refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialize(session, false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] event:", event);
      if (event === "SIGNED_OUT") {
        clearCache();
        clearSentryUser();
        setState({ user: null, session: null, roles: [], loading: false, rolesLoading: false, error: null });
        return;
      }
      if (event === "SIGNED_IN") {
        // Force fresh role fetch — queue if init is already running
        initialize(session, true);
        return;
      }
      if (event === "TOKEN_REFRESHED" && session) {
        // Background token refresh — update session/user silently, keep roles
        setState(prev => ({ ...prev, session, user: session.user }));
        return;
      }
    });

    return () => subscription.unsubscribe();
  }, [initialize]);

  const hasRole = useCallback((role: AppRole) => state.roles.includes(role), [state.roles]);

  const signOut = useCallback(async () => {
    clearCache();
    await supabase.auth.signOut();
  }, []);

  const refetchRoles = useCallback(async () => {
    if (!state.user) return;
    clearCache();
    setState(prev => ({ ...prev, rolesLoading: true }));
    const roles = await fetchRoles(state.user.id, true, state.session?.access_token);
    setState(prev => ({ ...prev, roles, rolesLoading: false }));
  }, [state.user, state.session, fetchRoles]);

  return (
    <AuthContext.Provider value={{ ...state, hasRole, signOut, refetchRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
