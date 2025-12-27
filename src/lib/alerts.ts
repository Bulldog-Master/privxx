/**
 * Alert utilities for mobile notifications
 * 
 * Provides haptic feedback and audio alerts for important events.
 */

// Vibration patterns (in milliseconds)
export const VIBRATION_PATTERNS = {
  short: [100],
  warning: [100, 50, 100],
  urgent: [200, 100, 200, 100, 200],
} as const;

/**
 * Trigger device vibration if supported
 */
export function vibrate(pattern: keyof typeof VIBRATION_PATTERNS | number[] = "short"): boolean {
  if (!("vibrate" in navigator)) {
    return false;
  }

  try {
    const vibrationPattern = Array.isArray(pattern) 
      ? pattern 
      : VIBRATION_PATTERNS[pattern];
    
    navigator.vibrate(vibrationPattern);
    return true;
  } catch (e) {
    console.debug("[Alert] Vibration failed:", e);
    return false;
  }
}

/**
 * Play a simple alert tone using Web Audio API
 */
export function playAlertTone(
  frequency: number = 440,
  duration: number = 150,
  volume: number = 0.3
): boolean {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) {
      return false;
    }

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    // Fade in/out for smoother sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);

    // Clean up
    oscillator.onended = () => {
      ctx.close();
    };

    return true;
  } catch (e) {
    console.debug("[Alert] Audio playback failed:", e);
    return false;
  }
}

/**
 * Play a warning alert (vibration + optional sound)
 */
export function alertWarning(): void {
  vibrate("warning");
  playAlertTone(520, 100, 0.2);
}

/**
 * Play an urgent alert (stronger vibration + sound)
 */
export function alertUrgent(): void {
  vibrate("urgent");
  playAlertTone(660, 150, 0.3);
  setTimeout(() => playAlertTone(880, 150, 0.3), 200);
}
