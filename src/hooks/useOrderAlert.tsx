import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to play a loud alert sound for new orders in the kitchen
 * Uses Web Audio API to generate a loud, attention-grabbing sound
 */
export const useOrderAlert = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  // Initialize AudioContext
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API not supported:', error);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playAlert = useCallback(() => {
    if (isPlayingRef.current || !audioContextRef.current) return;
    
    isPlayingRef.current = true;
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Create oscillators for a loud, multi-tone alert
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const oscillator3 = ctx.createOscillator();
    
    const gainNode = ctx.createGain();
    
    // Connect oscillators to gain node
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Set loud volume (0.8 = 80% of max)
    gainNode.gain.setValueAtTime(0.8, now);

    // Three-tone alert pattern (like a kitchen timer)
    // Tone 1: 1000 Hz
    oscillator1.frequency.setValueAtTime(1000, now);
    oscillator1.frequency.setValueAtTime(1200, now + 0.15);
    oscillator1.frequency.setValueAtTime(1000, now + 0.3);

    // Tone 2: 1500 Hz (harmony)
    oscillator2.frequency.setValueAtTime(1500, now);
    oscillator2.frequency.setValueAtTime(1700, now + 0.15);
    oscillator2.frequency.setValueAtTime(1500, now + 0.3);

    // Tone 3: 800 Hz (bass)
    oscillator3.frequency.setValueAtTime(800, now);
    oscillator3.frequency.setValueAtTime(900, now + 0.15);
    oscillator3.frequency.setValueAtTime(800, now + 0.3);

    // Create pulsing effect
    gainNode.gain.setValueAtTime(0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    gainNode.gain.setValueAtTime(0.8, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    gainNode.gain.setValueAtTime(0.8, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Start and stop oscillators
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator3.start(now);
    
    oscillator1.stop(now + 0.5);
    oscillator2.stop(now + 0.5);
    oscillator3.stop(now + 0.5);

    // Repeat the alert 3 times for maximum attention
    setTimeout(() => {
      if (audioContextRef.current) {
        const ctx2 = audioContextRef.current;
        const now2 = ctx2.currentTime;

        const osc1 = ctx2.createOscillator();
        const osc2 = ctx2.createOscillator();
        const osc3 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();

        osc1.connect(gain2);
        osc2.connect(gain2);
        osc3.connect(gain2);
        gain2.connect(ctx2.destination);

        gain2.gain.setValueAtTime(0.8, now2);

        osc1.frequency.setValueAtTime(1000, now2);
        osc2.frequency.setValueAtTime(1500, now2);
        osc3.frequency.setValueAtTime(800, now2);

        gain2.gain.exponentialRampToValueAtTime(0.01, now2 + 0.5);

        osc1.start(now2);
        osc2.start(now2);
        osc3.start(now2);
        
        osc1.stop(now2 + 0.5);
        osc2.stop(now2 + 0.5);
        osc3.stop(now2 + 0.5);
      }
    }, 600);

    setTimeout(() => {
      if (audioContextRef.current) {
        const ctx3 = audioContextRef.current;
        const now3 = ctx3.currentTime;

        const osc1 = ctx3.createOscillator();
        const osc2 = ctx3.createOscillator();
        const osc3 = ctx3.createOscillator();
        const gain3 = ctx3.createGain();

        osc1.connect(gain3);
        osc2.connect(gain3);
        osc3.connect(gain3);
        gain3.connect(ctx3.destination);

        gain3.gain.setValueAtTime(0.8, now3);

        osc1.frequency.setValueAtTime(1000, now3);
        osc2.frequency.setValueAtTime(1500, now3);
        osc3.frequency.setValueAtTime(800, now3);

        gain3.gain.exponentialRampToValueAtTime(0.01, now3 + 0.5);

        osc1.start(now3);
        osc2.start(now3);
        osc3.start(now3);
        
        osc1.stop(now3 + 0.5);
        osc2.stop(now3 + 0.5);
        osc3.stop(now3 + 0.5);
      }
      isPlayingRef.current = false;
    }, 1200);

  }, []);

  return { playAlert };
};
