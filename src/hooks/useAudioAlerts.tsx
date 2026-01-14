import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAudioAlertsOptions {
  enabled?: boolean;
  volume?: number;
}

export function useAudioAlerts(options: UseAudioAlertsOptions = {}) {
  const { enabled = true, volume = 0.7 } = options;
  const [audioEnabled, setAudioEnabled] = useState(enabled);
  const [audioVolume, setAudioVolume] = useState(volume);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasInteractedRef = useRef(false);

  // Initialize audio context on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    hasInteractedRef.current = true;
  }, []);

  // Track user interaction to enable audio
  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [initAudioContext]);

  const playNewOrderAlert = useCallback(() => {
    if (!audioEnabled || !hasInteractedRef.current) {
      console.log('❌ Audio alert skipped - enabled:', audioEnabled, 'interacted:', hasInteractedRef.current);
      return;
    }

    try {
      const ctx = audioContextRef.current;
      if (!ctx) {
        console.error('❌ No audio context available');
        return;
      }

      console.log('🔊 Starting audio alert - context state:', ctx.state);

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error('Failed to resume audio context:', e));
      }

      // Create a master gain node for overall control
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, ctx.currentTime); // 70% volume overall
      masterGain.connect(ctx.destination);

      // Create LOUD, PERSISTENT alarm (5.5 seconds total)
      const totalDuration = 5.5;
      const beepDuration = 0.2; // 200ms beeps
      const beepInterval = 0.3; // 300ms interval
      let currentTime = ctx.currentTime;

      while (currentTime < ctx.currentTime + totalDuration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(masterGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, currentTime); // 1000Hz

        // Envelope: attack, sustain, release
        gain.gain.setValueAtTime(0, currentTime); // Start silent
        gain.gain.linearRampToValueAtTime(1.0, currentTime + 0.05); // Quick attack
        gain.gain.setValueAtTime(1.0, currentTime + beepDuration - 0.05); // Sustain
        gain.gain.linearRampToValueAtTime(0, currentTime + beepDuration); // Quick release

        osc.start(currentTime);
        osc.stop(currentTime + beepDuration);

        currentTime += beepInterval;
      }

      console.log('✅ Audio alert created successfully - 5.5 seconds of beeps');
    } catch (err) {
      console.error('❌ Failed to play audio alert:', err);
    }
  }, [audioEnabled]);

  const playStatusChangeAlert = useCallback(() => {
    if (!audioEnabled || !hasInteractedRef.current) return;

    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);

      gainNode.gain.setValueAtTime(audioVolume * 0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.error('Failed to play status change alert:', err);
    }
  }, [audioEnabled, audioVolume]);

  const playUrgentAlert = useCallback(() => {
    if (!audioEnabled || !hasInteractedRef.current) return;

    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // More urgent sound pattern
      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime + i * 0.15);

        gainNode.gain.setValueAtTime(audioVolume * 0.15, ctx.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.1);

        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.1);
      }
    } catch (err) {
      console.error('Failed to play urgent alert:', err);
    }
  }, [audioEnabled, audioVolume]);

  return {
    audioEnabled,
    setAudioEnabled,
    audioVolume,
    setAudioVolume,
    playNewOrderAlert,
    playStatusChangeAlert,
    playUrgentAlert,
    initAudioContext,
  };
}
