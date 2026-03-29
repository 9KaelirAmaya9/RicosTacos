import { useCallback, useEffect, useRef } from "react";

// Alarm pattern: two-tone descending siren (restaurant order bell).
// Plays a high-low pair every 1.2 seconds until stopped.
const ALARM_INTERVAL_MS = 1200;

export const useOrderAlarm = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const canUseAudio = () =>
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window);

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
    // ── Android / Android PWA vibration ──────────────────────────────────────
    // Three short pulses — hard to miss even in a noisy kitchen.
    // Pattern: [vibrate, pause, vibrate, pause, vibrate] ms
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 250]);
      } catch {
        // vibrate() can throw on some Android WebViews — safe to ignore.
      }
    }

    // ── Web Audio chime ───────────────────────────────────────────────────────
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playTone = (
      freq: number,
      startOffset: number,
      duration: number,
      peakGain: number,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);

      // Smooth attack + decay envelope
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.01);
    };

    // High note: 880 Hz (A5)
    playTone(880, 0, 0.22, 0.55);
    // Low note: 660 Hz (E5) — starts 0.20 s after high note
    playTone(660, 0.20, 0.28, 0.45);
  }, [ensureAudioContext]);

  // ── Start / stop ──────────────────────────────────────────────────────────
  const startAlarm = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    await playAlarmChime();
    intervalRef.current = window.setInterval(() => {
      void playAlarmChime();
    }, ALARM_INTERVAL_MS);
  }, [playAlarmChime]);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Cancel any pending vibration pattern
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
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
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, [stopAlarm]);

  return { startAlarm, stopAlarm };
};
