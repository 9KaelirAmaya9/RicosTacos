import { useCallback, useRef } from "react";

export const useOrderAlarm = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playAlarm = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }

      const ctx = audioCtxRef.current;

      // Play 3 loud urgent beeps
      const beepCount = 3;
      const beepDuration = 0.18;
      const beepGap = 0.12;

      for (let i = 0; i < beepCount; i++) {
        const startTime = ctx.currentTime + i * (beepDuration + beepGap);

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, startTime); // A5 - sharp, loud tone
        oscillator.frequency.setValueAtTime(1100, startTime + beepDuration / 2);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.01); // max volume
        gainNode.gain.setValueAtTime(1.0, startTime + beepDuration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);

        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
      }
    } catch (err) {
      console.error("Failed to play order alarm:", err);
    }
  }, []);

  return { playAlarm };
};
