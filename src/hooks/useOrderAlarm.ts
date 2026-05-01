import { useCallback, useEffect, useRef } from "react";

// Alarm pattern: two-tone descending siren (restaurant order bell).
// Plays a high-low pair every 1.2 seconds until stopped.
const ALARM_INTERVAL_MS = 1200;
// Auto-stop after 5 minutes so the alarm can't ring indefinitely if nobody
// is watching the screen. syncAlarmState will re-arm it on the next poll
// if unaccepted orders still exist.
const ALARM_MAX_DURATION_MS = 5 * 60 * 1000;

export const useOrderAlarm = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const maxDurationRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // Pre-load the alarm WAV so it's ready to play instantly
  const getAudioElement = useCallback((): HTMLAudioElement => {
    if (!audioElementRef.current) {
      const audio = new Audio('/alarm.wav');
      audio.preload = 'auto';
      audio.loop = false;
      audioElementRef.current = audio;
    }
    return audioElementRef.current;
  }, []);

  const canUseAudio = () =>
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window);

  // Only attempt vibration on touch-capable devices (Android PWA).
  // Desktop Chrome has navigator.vibrate but blocks it with an [Intervention]
  // console warning — checking maxTouchPoints avoids that noise entirely.
  const canVibrate = () =>
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    navigator.maxTouchPoints > 0;

  // ── AudioContext lifecycle ─────────────────────────────────────────────────
  // On Android Chrome the context survives screen lock but goes "suspended".
  // On iOS Safari it can be "closed" after a long background period.
  // We handle both: recreate if closed, resume if suspended.
  const ensureAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    if (!canUseAudio()) return null;

    // Closed contexts cannot be resumed — create a fresh one.
    if (audioContextRef.current?.state === "closed") {
      audioContextRef.current = null;
    }

    if (!audioContextRef.current) {
      const AudioCtx = (
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ) as typeof AudioContext;
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        // resume() blocked — browser requires a fresh user gesture.
        // Audio will be silent this cycle; vibration still fires (Android).
        return null;
      }
    }

    return audioContextRef.current;
  }, []);

  // ── Chime + vibration ──────────────────────────────────────────────────────
  /**
   * Plays a two-tone "ding-dong" chime AND vibrates the device.
   *
   * Vibration (navigator.vibrate) is supported on:
   *   ✅ Android Chrome / WebView / installed PWA
   *   ❌ iOS Safari (API not implemented — no-op, no error thrown)
   *
   * Audio (Web Audio API) is supported on:
   *   ✅ Android Chrome — works after first user gesture; survives screen lock
   *   ⚠️  iOS Safari  — requires user gesture; may be suppressed on lock screen
   *
   * Vibration fires BEFORE the async audio path so Android devices alert
   * staff even if the AudioContext is temporarily suspended.
   */
  const playAlarmChime = useCallback(async () => {
    // ── Vibration (Android PWA only) ─────────────────────────────────────────
    if (canVibrate()) {
      try { navigator.vibrate([250, 100, 250, 100, 250]); } catch { /* ignore */ }
    }

    // ── Primary: Web Audio API oscillators (unlocked context) ────────────────
    const ctx = await ensureAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      const playTone = (freq: number, startOffset: number, duration: number, peakGain: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.01);
      };
      playTone(880, 0, 0.22, 0.85);
      playTone(660, 0.20, 0.28, 0.75);
      return;
    }

    // ── Fallback: HTML Audio element (works even if AudioContext is suspended) ─
    try {
      const audio = getAudioElement();
      audio.currentTime = 0;
      await audio.play();
    } catch {
      // Browser blocked even HTML audio — nothing more we can do without gesture
    }
  }, [ensureAudioContext, getAudioElement]);

  // ── Unlock audio context during a user gesture ───────────────────────────
  // Call this once on tap/click so the AudioContext is already "running" when
  // the alarm fires asynchronously. Without this, browsers suspend new contexts
  // created outside a user activation window and resume() silently fails.
  const unlockAudio = useCallback(async (): Promise<boolean> => {
    // Pre-load the HTML Audio fallback regardless of Web Audio support
    try { getAudioElement().load(); } catch { /* ignore */ }

    if (!canUseAudio()) return true; // HTML audio still available
    try {
      const ctx = await ensureAudioContext();
      if (!ctx) return true; // fallback still works
      // Play a silent tone to unlock the context for future async calls
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.001);
      return true;
    } catch {
      return true; // HTML audio fallback still available
    }
  }, [ensureAudioContext, getAudioElement]);

  // ── Start / stop ──────────────────────────────────────────────────────────
  const startAlarm = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    await playAlarmChime();
    intervalRef.current = window.setInterval(() => {
      void playAlarmChime();
    }, ALARM_INTERVAL_MS);

    // Auto-stop after max duration — syncAlarmState will re-arm on next poll
    // if the order is still unaccepted, preventing truly infinite ringing.
    maxDurationRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        maxDurationRef.current = null;
      }
    }, ALARM_MAX_DURATION_MS);
  }, [playAlarmChime]);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (maxDurationRef.current !== null) {
      window.clearTimeout(maxDurationRef.current);
      maxDurationRef.current = null;
    }
    // Cancel any pending vibration pattern (touch devices only)
    if (canVibrate()) {
      try { navigator.vibrate(0); } catch { /* ignore */ }
    }
  }, []);

  // ── Screen unlock / tab-focus recovery (Android + iOS) ────────────────────
  // When the device screen is locked the browser suspends the AudioContext.
  // When staff unlocks and the tab regains visibility we immediately resume
  // the context so the next interval tick plays correctly.
  // On Android Chrome this is reliable.  On iOS Safari it still requires a
  // user tap — the service-worker push notification (which IS visible on the
  // lock screen) prompts staff to tap, satisfying the gesture requirement.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isPlayingRef.current) {
        // Re-ensure context is live; if it succeeds the next interval tick
        // will play audio.  If not (iOS, no gesture yet) vibration still ran.
        void ensureAudioContext();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ensureAudioContext]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => undefined);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, [stopAlarm]);

  return { startAlarm, stopAlarm, unlockAudio };
};
