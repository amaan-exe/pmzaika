'use client';

/**
 * Dual-Engine Background-Resilient Kitchen Order Alarm.
 *
 * Browsers (Chrome, Edge, Safari) aggressively freeze Web Audio AudioContext
 * when a tab is in the background (e.g. user browsing Instagram in another tab).
 *
 * To guarantee loud playback in background tabs:
 * 1. An HTML5 `<audio>` element is pre-unlocked during the first user interaction.
 * 2. When an order arrives, HTML5 Audio with native looping (`loop = true`) is triggered.
 *    Because the media element was previously authorized by user gesture, Chrome allows
 *    it to play freely and loop in background tabs!
 * 3. Web Audio API multi-harmonic synthesizer serves as a synchronized parallel layer.
 */

export type SoundProfile = 'zomato_swiggy' | 'urgent_alarm' | 'golden_bell' | 'pos_ping';

export interface SoundConfig {
  enabled: boolean;
  repeatUntilAcknowledged: boolean;
  profile: SoundProfile;
  volume: number; // 0.1 to 1.0
}

export const SOUND_PROFILES: Array<{ id: SoundProfile; name: string; description: string; icon: string }> = [
  {
    id: 'zomato_swiggy',
    name: 'Zomato / Swiggy Kitchen Chime',
    description: 'Acoustic 4-tone rising chord with metallic bell shimmer. Highly audible in busy kitchens.',
    icon: '🛎️',
  },
  {
    id: 'urgent_alarm',
    name: 'Urgent Kitchen Alarm',
    description: 'Fast double-strike piercing dual tone (880Hz / 1320Hz) for loud environments.',
    icon: '🚨',
  },
  {
    id: 'golden_bell',
    name: 'Golden Counter Bell',
    description: 'Deep resonant brass reception bell with acoustic decay.',
    icon: '✨',
  },
  {
    id: 'pos_ping',
    name: 'Modern POS Cash Register',
    description: 'Crisp, high-fidelity double digital ping.',
    icon: '💳',
  },
];

const STORAGE_KEY = 'pm_zaika_sound_config_v2';

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,
  repeatUntilAcknowledged: true,
  profile: 'zomato_swiggy',
  volume: 0.95,
};

export function loadSoundConfig(): SoundConfig {
  if (typeof window === 'undefined') return DEFAULT_SOUND_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SOUND_CONFIG.enabled,
      repeatUntilAcknowledged:
        typeof parsed.repeatUntilAcknowledged === 'boolean'
          ? parsed.repeatUntilAcknowledged
          : DEFAULT_SOUND_CONFIG.repeatUntilAcknowledged,
      profile: SOUND_PROFILES.some((p) => p.id === parsed.profile)
        ? parsed.profile
        : DEFAULT_SOUND_CONFIG.profile,
      volume: typeof parsed.volume === 'number' ? Math.max(0.1, Math.min(1.0, parsed.volume)) : DEFAULT_SOUND_CONFIG.volume,
    };
  } catch {
    return DEFAULT_SOUND_CONFIG;
  }
}

export function saveSoundConfig(config: SoundConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

const PROFILE_AUDIO_FILES: Record<SoundProfile, string> = {
  zomato_swiggy: '/sounds/kitchen-order-alarm.wav',
  urgent_alarm: '/sounds/urgent-alarm.wav',
  golden_bell: '/sounds/golden-bell.wav',
  pos_ping: '/sounds/pos-ping.wav',
};

// ---------------------------------------------------------------------------
// Web Audio API Synthesizer & AudioBuffer Pre-caching
// ---------------------------------------------------------------------------
let sharedAudioContext: AudioContext | null = null;
let keepAliveOscillator: OscillatorNode | null = null;
let keepAliveGain: GainNode | null = null;
const audioBufferCache = new Map<SoundProfile, AudioBuffer>();
let activeBufferSource: AudioBufferSourceNode | null = null;
let activeSourceGain: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    void sharedAudioContext.resume().catch(() => undefined);
  }
  return sharedAudioContext;
}

/**
 * Activates an inaudible audio keep-alive carrier.
 *
 * Browsers (especially Chromium) aggressively suspend AudioContexts if they are idle
 * when a tab goes into the background. By keeping a near-zero gain carrier node actively
 * connected to the audio destination, the browser flags this tab as actively outputting audio,
 * keeping the OS audio thread and Web Audio rendering pipeline 100% active in background tabs!
 */
export function activateKeepAliveCarrier(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (keepAliveOscillator) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    // Inaudible to human ear, but keeps the audio processing graph continuously pumping frames
    gain.gain.setValueAtTime(0.00001, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    keepAliveOscillator = osc;
    keepAliveGain = gain;
  } catch (e) {
    console.warn('[pm-zaika] Keep-alive carrier failed to initialize', e);
  }
}

/**
 * Pre-caches and decodes the 4 alert sound WAV files into memory as AudioBuffers.
 * Once decoded, these can be played via AudioBufferSourceNode directly through
 * the hardware audio pipeline without DOM restrictions or network latency.
 */
export async function precacheAudioBuffers(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();

  const loadTasks = (Object.keys(PROFILE_AUDIO_FILES) as SoundProfile[]).map(async (profile) => {
    if (audioBufferCache.has(profile)) return;
    try {
      const url = PROFILE_AUDIO_FILES[profile];
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuf = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      audioBufferCache.set(profile, decoded);
    } catch {
      // Ignore pre-cache failure; fallback synthesizer will handle it
    }
  });

  await Promise.allSettled(loadTasks);
}

// ---------------------------------------------------------------------------
// HTML5 Background Audio Player (Plays even when tab is in background!)
// ---------------------------------------------------------------------------
let sharedAudioElement: HTMLAudioElement | null = null;
let isAudioUnlocked = false;
const armedListeners = new Set<(armed: boolean) => void>();

export function getAlarmAudioElement(profile: SoundProfile = 'zomato_swiggy'): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  const targetSrc = PROFILE_AUDIO_FILES[profile] || PROFILE_AUDIO_FILES.zomato_swiggy;

  if (!sharedAudioElement) {
    sharedAudioElement = new Audio(targetSrc);
    sharedAudioElement.preload = 'auto';
  } else if (!sharedAudioElement.src.endsWith(targetSrc)) {
    sharedAudioElement.src = targetSrc;
    sharedAudioElement.load();
  }
  return sharedAudioElement;
}

/**
 * Primes and unlocks both HTML5 audio and Web Audio on user gesture.
 * Also starts the Keep-Alive carrier and preloads audio buffers.
 */
export function unlockAudioPlayback(): void {
  if (typeof window === 'undefined') return;

  // 1. Prime Web Audio Context & Keep-Alive carrier
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    activateKeepAliveCarrier();
    void precacheAudioBuffers();
  } catch {
    // Ignore
  }

  // 2. Prime HTML5 Audio element
  const audio = getAlarmAudioElement();
  if (audio) {
    audio.volume = 0.01;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = DEFAULT_SOUND_CONFIG.volume;
          isAudioUnlocked = true;
          armedListeners.forEach((fn) => fn(true));
        })
        .catch(() => {
          // May fail if not in direct user gesture yet; will retry on next interaction
        });
    }
  }

  isAudioUnlocked = true;
  armedListeners.forEach((fn) => fn(true));
}

export function isAudioArmed(): boolean {
  return isAudioUnlocked;
}

export function onAudioArmed(listener: (armed: boolean) => void): () => void {
  armedListeners.add(listener);
  return () => armedListeners.delete(listener);
}

/**
 * Plays a short, pleasant 150ms rising chord to confirm to the user
 * that background monitoring audio is 100% armed and ready.
 */
export function playArmingChime(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime + 0.02;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.35, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  } catch {
    // Ignore
  }
}

/**
 * Starts continuous background alarm ringing with the selected sound profile.
 * Employs dual-engine playback:
 * 1. Looping in-memory AudioBuffer on the active Web Audio pipeline.
 * 2. Native HTML5 Audio looping player as parallel layer.
 */
export function startAlarmLoop(profile: SoundProfile = 'zomato_swiggy', volume = 0.95): void {
  // 1. Web Audio in-memory AudioBuffer loop (Zero latency, unthrottled)
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    activateKeepAliveCarrier();

    const cachedBuffer = audioBufferCache.get(profile);
    if (cachedBuffer) {
      if (activeBufferSource) {
        try {
          activeBufferSource.stop();
          activeBufferSource.disconnect();
        } catch {
          // Ignore
        }
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.1, Math.min(1.0, volume)), ctx.currentTime);

      source.buffer = cachedBuffer;
      source.loop = true;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      activeBufferSource = source;
      activeSourceGain = gain;
    }
  } catch (err) {
    console.warn('[pm-zaika] Web Audio buffer loop error', err);
  }

  // 2. HTML5 Audio backup element with native loop
  const audio = getAlarmAudioElement(profile);
  if (audio) {
    try {
      audio.volume = Math.max(0.1, Math.min(1.0, volume));
      audio.loop = true;
      audio.currentTime = 0;
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn('[pm-zaika] HTML5 audio play error', err);
        });
      }
    } catch (e) {
      console.warn('[pm-zaika] Failed to start HTML5 audio alarm', e);
    }
  }

  // 3. Fallback synthesizer if no AudioBuffer was cached yet
  if (!audioBufferCache.has(profile)) {
    try {
      playAlertSound(profile, volume);
    } catch {
      // Ignore
    }
  }
}

/**
 * Stops the continuous alarm immediately across both engines.
 */
export function stopAlarmLoop(): void {
  // 1. Stop Web Audio buffer source
  if (activeBufferSource) {
    try {
      activeBufferSource.stop();
      activeBufferSource.disconnect();
    } catch {
      // Ignore
    }
    activeBufferSource = null;
    activeSourceGain = null;
  }

  // 2. Stop HTML5 audio
  const audio = getAlarmAudioElement();
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
    } catch {
      // Ignore
    }
  }
}


function playHarmonicTone(
  ctx: AudioContext,
  dest: AudioNode,
  frequency: number,
  startTime: number,
  duration: number,
  gainLevel = 0.5,
  waveform: OscillatorType = 'sine'
) {
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = waveform;
  osc1.frequency.setValueAtTime(frequency, startTime);

  gain1.gain.setValueAtTime(0.0001, startTime);
  gain1.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(gain1);
  gain1.connect(dest);
  osc1.start(startTime);
  osc1.stop(startTime + duration + 0.05);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(frequency * 2, startTime);

  gain2.gain.setValueAtTime(0.0001, startTime);
  gain2.gain.exponentialRampToValueAtTime(gainLevel * 0.45, startTime + 0.008);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.65);

  osc2.connect(gain2);
  gain2.connect(dest);
  osc2.start(startTime);
  osc2.stop(startTime + duration * 0.7);

  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 3.5, startTime);

  gain3.gain.setValueAtTime(0.0001, startTime);
  gain3.gain.exponentialRampToValueAtTime(gainLevel * 0.25, startTime + 0.005);
  gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.4);

  osc3.connect(gain3);
  gain3.connect(dest);
  osc3.start(startTime);
  osc3.stop(startTime + duration * 0.45);
}

export function playAlertSound(profile: SoundProfile = 'zomato_swiggy', volume = 0.95): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.1, Math.min(1.0, volume)) * 1.25, ctx.currentTime);

    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime + 0.05;

    switch (profile) {
      case 'zomato_swiggy': {
        const notes = [
          { freq: 392.0, time: 0.0, dur: 0.45, gain: 0.6 },
          { freq: 523.25, time: 0.12, dur: 0.5, gain: 0.65 },
          { freq: 659.25, time: 0.24, dur: 0.55, gain: 0.75 },
          { freq: 783.99, time: 0.38, dur: 0.9, gain: 0.85 },
          { freq: 1046.5, time: 0.44, dur: 0.85, gain: 0.5 },
        ];
        notes.forEach(({ freq, time, dur, gain }) => {
          playHarmonicTone(ctx, compressor, freq, now + time, dur, gain, 'triangle');
        });
        break;
      }

      case 'urgent_alarm': {
        const strikes = [
          { freq: 880, time: 0.0, dur: 0.3, gain: 0.8 },
          { freq: 1320, time: 0.14, dur: 0.35, gain: 0.85 },
          { freq: 880, time: 0.32, dur: 0.3, gain: 0.8 },
          { freq: 1320, time: 0.46, dur: 0.65, gain: 0.9 },
        ];
        strikes.forEach(({ freq, time, dur, gain }) => {
          playHarmonicTone(ctx, compressor, freq, now + time, dur, gain, 'sawtooth');
        });
        break;
      }

      case 'golden_bell': {
        const bellNotes = [
          { freq: 587.33, time: 0.0, dur: 1.1, gain: 0.9 },
          { freq: 880.0, time: 0.02, dur: 0.9, gain: 0.6 },
          { freq: 1174.66, time: 0.04, dur: 0.7, gain: 0.5 },
        ];
        bellNotes.forEach(({ freq, time, dur, gain }) => {
          playHarmonicTone(ctx, compressor, freq, now + time, dur, gain, 'sine');
        });
        break;
      }

      case 'pos_ping': {
        const pings = [
          { freq: 1046.5, time: 0.0, dur: 0.3, gain: 0.7 },
          { freq: 1567.98, time: 0.16, dur: 0.75, gain: 0.85 },
        ];
        pings.forEach(({ freq, time, dur, gain }) => {
          playHarmonicTone(ctx, compressor, freq, now + time, dur, gain, 'sine');
        });
        break;
      }
    }
  } catch (error) {
    console.warn('[pm-zaika] Web Audio alert playback failed', error);
  }
}
