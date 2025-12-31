/**
 * Alert Sound Hook
 * 
 * Plays notification sounds for connection quality alerts.
 * Uses Web Audio API for privacy-first, no external requests.
 */

import { useCallback, useRef } from 'react';
import { useConnectionAlertPreferences, AlertSoundType } from './useConnectionAlertPreferences';

// Generate sounds using Web Audio API (no external files needed)
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  // Fade in and out for smoother sound
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

const SOUND_CONFIGS: Record<AlertSoundType, (ctx: AudioContext, volume: number, isWarning: boolean) => void> = {
  none: () => {},
  
  subtle: (ctx, volume, isWarning) => {
    // Soft blip
    const freq = isWarning ? 440 : 880;
    playTone(ctx, freq, 0.15, volume, 'sine');
  },
  
  chime: (ctx, volume, isWarning) => {
    // Two-tone chime
    const baseFreq = isWarning ? 392 : 523;
    playTone(ctx, baseFreq, 0.2, volume, 'sine');
    setTimeout(() => {
      playTone(ctx, baseFreq * 1.25, 0.25, volume * 0.8, 'sine');
    }, 150);
  },
  
  alert: (ctx, volume, isWarning) => {
    // More urgent beep pattern
    const freq = isWarning ? 600 : 800;
    playTone(ctx, freq, 0.1, volume, 'square');
    setTimeout(() => playTone(ctx, freq, 0.1, volume, 'square'), 150);
    if (isWarning) {
      setTimeout(() => playTone(ctx, freq, 0.1, volume, 'square'), 300);
    }
  },
};

export function useAlertSound() {
  const { thresholds } = useConnectionAlertPreferences();
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((isWarning: boolean = false) => {
    if (!thresholds.soundEnabled || thresholds.soundType === 'none') {
      return;
    }

    // Lazy init audio context (must be after user interaction)
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Resume if suspended (browsers require user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const volume = thresholds.soundVolume / 100 * 0.3; // Max 30% to avoid being too loud
    const soundFn = SOUND_CONFIGS[thresholds.soundType];
    soundFn(ctx, volume, isWarning);
  }, [thresholds.soundEnabled, thresholds.soundType, thresholds.soundVolume]);

  const playTestSound = useCallback(() => {
    // Force play even if disabled, for testing
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const volume = thresholds.soundVolume / 100 * 0.3;
    const soundFn = SOUND_CONFIGS[thresholds.soundType] || SOUND_CONFIGS.subtle;
    soundFn(ctx, volume, false);
  }, [thresholds.soundType, thresholds.soundVolume]);

  return {
    playSound,
    playTestSound,
  };
}
