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
    if (!audioEnabled || !hasInteractedRef.current) return;

    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a LOUD, PERSISTENT alarm sound for kitchen staff (4-7 seconds)
      // Alternating frequency pattern to keep attention
      const totalDuration = 5.5; // seconds - middle of 4-7 range
      const patternDuration = 0.3;
      const patterns = Math.floor(totalDuration / patternDuration);
      
      for (let i = 0; i < patterns; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'square'; // Square wave = more harsh/attention-grabbing than sine
        
        // Alternate between 1000Hz and 1200Hz for more attention-grabbing effect
        const frequency = i % 2 === 0 ? 1000 : 1200;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + i * patternDuration);

        // LOUD volume (80% of max)
        gainNode.gain.setValueAtTime(0.8, ctx.currentTime + i * patternDuration);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * patternDuration + patternDuration);

        oscillator.start(ctx.currentTime + i * patternDuration);
        oscillator.stop(ctx.currentTime + i * patternDuration + patternDuration);
      }

      // Log for debugging
      console.log('🔊 NEW ORDER ALERT PLAYED - LOUD FOR 5.5 SECONDS');
    } catch (err) {
      console.error('Failed to play audio alert:', err);
    }
  }, [audioEnabled, audioVolume]);

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
