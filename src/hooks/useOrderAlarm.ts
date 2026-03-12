import { useCallback, useEffect, useRef } from "react";

// Alarm pattern: two-tone descending siren (like a restaurant order bell)
// Plays a high-low pair every 1.2 seconds until stopped.
const ALARM_INTERVAL_MS = 1200;

export const useOrderAlarm = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const canUseAudio = () =>
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window);

  const ensureAudioContext = useCallback(async () => {
    if (!canUseAudio()) return null;

    if (!audioContextRef.current) {
      const AudioCtx = (
        window.AudioContext || (window as any).webkitAudioContext
      ) as typeof AudioContext;
      audioContextRef.current = new AudioCtx();
    }

    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        return null;
      }
    }

    return audioContextRef.current;
  }, []);

  /**
   * Plays a two-tone "ding-dong" alarm chime:
   *   - High note (880 Hz, sine) for 0.18s with fast attack/decay
   *   - Low note (660 Hz, sine) for 0.22s starting at 0.20s
   * Together they sound like a restaurant order bell / notification chime.
   */
  const playAlarmChime = useCallback(async () => {
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
    // Low note: 660 Hz (E5) — starts 0.20s after high note
    playTone(660, 0.20, 0.28, 0.45);
  }, [ensureAudioContext]);

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
  }, []);

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
