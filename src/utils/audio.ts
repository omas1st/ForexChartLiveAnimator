import { AudioTrack } from '../types';

/**
 * Web Audio API Engine for sound effects, procedural music synthesis,
 * file decoding, audio trimming, and video recording sync.
 */

let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

// ----------------------------------------------------
// UI Sound Effects
// ----------------------------------------------------
export function playTickSound(pitchMultiplier = 1.0, volume = 0.08) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 800 + Math.random() * 200;
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch {
    // Ignore audio errors gracefully
  }
}

export function playStructureBreakSound(volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore
  }
}

export function playTargetReachedChime(volume = 0.22) {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.5);
    });
  } catch {
    // Ignore
  }
}

// ----------------------------------------------------
// Procedural Music Synthesis (Offline Audio Context)
// Generates rich, authentic, royalty-free audio tracks on the fly
// ----------------------------------------------------

export interface PresetTrackMeta {
  id: string;
  name: string;
  artist: string;
  genre: string;
  bpm: number;
  durationSeconds: number;
}

export const PRESET_TRACKS_META: PresetTrackMeta[] = [
  {
    id: 'midnight-alpha',
    name: 'Midnight Alpha',
    artist: 'Cyber Synthwave',
    genre: 'Synthwave / Retro',
    bpm: 120,
    durationSeconds: 60,
  },
  {
    id: 'lofi-market-flow',
    name: 'Lo-Fi Market Flow',
    artist: 'Chill Beats',
    genre: 'Lo-Fi / Hip-Hop',
    bpm: 85,
    durationSeconds: 60,
  },
  {
    id: 'bull-run-energy',
    name: 'Bull Run Energy',
    artist: 'Future Pulse',
    genre: 'Electronic / EDM',
    bpm: 128,
    durationSeconds: 60,
  },
  {
    id: 'deep-zen-ambient',
    name: 'Deep Zen Ambient',
    artist: 'Aura Soundscapes',
    genre: 'Ambient / Focus',
    bpm: 60,
    durationSeconds: 60,
  },
];

/**
 * Procedurally synthesizes a complete soundtrack into an AudioBuffer using OfflineAudioContext.
 */
export async function generatePresetAudioBuffer(trackId: string, durationSeconds = 60): Promise<AudioBuffer> {
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);

  if (trackId === 'midnight-alpha') {
    // Synthwave / Cyberpunk: 120 BPM driving bass, 80s chords, synth lead
    const bpm = 120;
    const beatSec = 60 / bpm;
    const totalBeats = Math.floor(durationSeconds / beatSec);

    // Chords: Am -> F -> C -> G
    const chordProgressions = [
      [220, 261.63, 329.63, 440], // Am
      [174.61, 220, 261.63, 349.23], // F
      [130.81, 164.81, 196, 261.63], // C
      [196, 246.94, 293.66, 392], // G
    ];

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat * beatSec;
      const progIndex = Math.floor(beat / 8) % chordProgressions.length;
      const currentChord = chordProgressions[progIndex];

      // Bassline (16th notes or 8th notes)
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = 'sawtooth';
      const rootFreq = currentChord[0] / 2;
      bassOsc.frequency.setValueAtTime(rootFreq, beatTime);
      bassGain.gain.setValueAtTime(0.18, beatTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 0.45);

      const bassFilter = offlineCtx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, beatTime);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(offlineCtx.destination);
      bassOsc.start(beatTime);
      bassOsc.stop(beatTime + beatSec * 0.5);

      // Kick drum on beats 0, 2 (4 on the floor)
      if (beat % 2 === 0) {
        const kickOsc = offlineCtx.createOscillator();
        const kickGain = offlineCtx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(40, beatTime + 0.12);
        kickGain.gain.setValueAtTime(0.35, beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(offlineCtx.destination);
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.15);
      }

      // Snare on beat 1, 3
      if (beat % 2 === 1) {
        const snareOsc = offlineCtx.createOscillator();
        const snareGain = offlineCtx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, beatTime);
        snareGain.gain.setValueAtTime(0.2, beatTime);
        snareGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.18);

        snareOsc.connect(snareGain);
        snareGain.connect(offlineCtx.destination);
        snareOsc.start(beatTime);
        snareOsc.stop(beatTime + 0.18);
      }

      // Arpeggio / Lead
      const note = currentChord[beat % currentChord.length] * 2;
      const arpOsc = offlineCtx.createOscillator();
      const arpGain = offlineCtx.createGain();
      arpOsc.type = 'square';
      arpOsc.frequency.setValueAtTime(note, beatTime);
      arpGain.gain.setValueAtTime(0.08, beatTime);
      arpGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 0.7);

      const arpFilter = offlineCtx.createBiquadFilter();
      arpFilter.type = 'lowpass';
      arpFilter.frequency.setValueAtTime(1600, beatTime);

      arpOsc.connect(arpFilter);
      arpFilter.connect(arpGain);
      arpGain.connect(offlineCtx.destination);
      arpOsc.start(beatTime);
      arpOsc.stop(beatTime + beatSec * 0.8);
    }
  } else if (trackId === 'lofi-market-flow') {
    // Warm Lo-Fi electric piano chords & smooth sub bass
    const bpm = 85;
    const beatSec = 60 / bpm;
    const totalBeats = Math.floor(durationSeconds / beatSec);

    const jazzyChords = [
      [146.83, 220, 261.63, 329.63], // Dm7
      [196, 246.94, 293.66, 349.23], // G7
      [130.81, 196, 246.94, 329.63], // Cmaj7
      [220, 261.63, 329.63, 392],    // Am7
    ];

    for (let beat = 0; beat < totalBeats; beat += 2) {
      const beatTime = beat * beatSec;
      const chordIndex = Math.floor(beat / 4) % jazzyChords.length;
      const chord = jazzyChords[chordIndex];

      chord.forEach((freq) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, beatTime);

        gain.gain.setValueAtTime(0.12, beatTime);
        gain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 1.8);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(beatTime);
        osc.stop(beatTime + beatSec * 1.9);
      });

      // Lo-fi Kick
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(110, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(45, beatTime + 0.2);
      kickGain.gain.setValueAtTime(0.28, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.25);
      kickOsc.connect(kickGain);
      kickGain.connect(offlineCtx.destination);
      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.25);
    }
  } else if (trackId === 'bull-run-energy') {
    // Energetic EDM Pulse: 128 BPM driving saw waves & uplifting chords
    const bpm = 128;
    const beatSec = 60 / bpm;
    const totalBeats = Math.floor(durationSeconds / beatSec);

    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat * beatSec;
      const scale = [261.63, 293.66, 329.63, 392, 440, 523.25];
      const freq = scale[(beat * 3) % scale.length];

      // Saw synth pulse
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, beatTime);
      gain.gain.setValueAtTime(0.12, beatTime);
      gain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatSec * 0.6);

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, beatTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(beatTime);
      osc.stop(beatTime + beatSec * 0.65);

      // Punchy kick on every beat
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(160, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(48, beatTime + 0.1);
      kickGain.gain.setValueAtTime(0.35, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.12);
      kickOsc.connect(kickGain);
      kickGain.connect(offlineCtx.destination);
      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.12);
    }
  } else {
    // Deep Zen Ambient: 60 BPM meditative crystal pads
    const padFrequencies = [130.81, 196, 261.63, 329.63, 392, 523.25];
    for (let i = 0; i < durationSeconds; i += 4) {
      padFrequencies.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (1 + (idx % 2) * 0.5), i);

        gain.gain.setValueAtTime(0.01, i);
        gain.gain.linearRampToValueAtTime(0.08, i + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.001, i + 3.9);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(i);
        osc.stop(i + 4.0);
      });
    }
  }

  return await offlineCtx.startRendering();
}

/**
 * Decodes user uploaded audio file (MP3, WAV, AAC, OGG) into an AudioTrack
 */
export async function decodeUploadedAudioFile(file: File): Promise<AudioTrack> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const duration = audioBuffer.duration;
  const initialTrimEnd = Math.min(duration, 10.0); // Default 10s slice

  return {
    id: `custom-audio-${Date.now()}`,
    name: file.name.replace(/\.[^/.]+$/, ''),
    artist: 'Custom Upload',
    sourceType: 'custom',
    audioBuffer,
    duration,
    trimStart: 0,
    trimEnd: initialTrimEnd,
    volume: 0.8,
    isMuted: false,
  };
}

/**
 * Extracts a normalized waveform peak array (e.g. 80 points) from an AudioBuffer for visual drawing.
 */
export function extractWaveformPeaks(buffer: AudioBuffer, numPoints = 80): number[] {
  const rawData = buffer.getChannelData(0); // Left channel
  const totalSamples = rawData.length;
  const blockSize = Math.floor(totalSamples / numPoints);
  const peaks: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j] || 0);
    }
    const avg = sum / blockSize;
    peaks.push(Math.min(1.0, avg * 3.5)); // Normalized with slight boost
  }

  return peaks;
}

// ----------------------------------------------------
// Synchronized Audio Player Controller
// Handles previewing and live canvas playback
// ----------------------------------------------------

export class SynchronizedAudioPlayer {
  private activeSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isCurrentlyPlaying = false;
  private lastStartedTrackId: string | null = null;
  private lastStartTime = 0;

  public syncPlayback(
    track: AudioTrack | null | undefined,
    isPlaying: boolean,
    currentTime: number,
    videoDuration: number
  ) {
    if (!track || !track.audioBuffer || track.isMuted || !isPlaying) {
      this.stop();
      return;
    }

    const ctx = getAudioContext();

    // Calculate position in the audio buffer
    const trimStart = track.trimStart || 0;
    const trimEnd = track.trimEnd || track.duration;
    const sliceDuration = Math.max(0.1, trimEnd - trimStart);

    // Map 0..videoDuration into trimStart..trimEnd
    const progress = videoDuration > 0 ? (currentTime % videoDuration) / videoDuration : 0;
    const offsetWithinBuffer = trimStart + progress * sliceDuration;

    if (offsetWithinBuffer >= track.duration) {
      this.stop();
      return;
    }

    // If already playing smoothly and synced within 0.15s, just update volume
    if (this.isCurrentlyPlaying && this.gainNode) {
      this.gainNode.gain.setValueAtTime(track.volume ?? 0.8, ctx.currentTime);
      return;
    }

    // Otherwise, start playing from current offset
    this.playFromOffset(track, offsetWithinBuffer, (trimEnd - offsetWithinBuffer));
  }

  public playPreview(track: AudioTrack, onEnded?: () => void) {
    if (!track.audioBuffer) return;
    this.stop();

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = track.audioBuffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(track.volume ?? 0.8, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    const start = Math.max(0, track.trimStart || 0);
    const duration = Math.max(0.1, (track.trimEnd || track.duration) - start);

    source.start(ctx.currentTime, start, duration);
    this.activeSource = source;
    this.gainNode = gain;
    this.isCurrentlyPlaying = true;

    source.onended = () => {
      this.isCurrentlyPlaying = false;
      if (onEnded) onEnded();
    };
  }

  private playFromOffset(track: AudioTrack, offset: number, duration: number) {
    if (!track.audioBuffer) return;
    this.stop();

    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = track.audioBuffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(track.volume ?? 0.8, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start(ctx.currentTime, Math.max(0, offset), Math.max(0.1, duration));
    this.activeSource = source;
    this.gainNode = gain;
    this.isCurrentlyPlaying = true;
    this.lastStartedTrackId = track.id;
    this.lastStartTime = offset;

    source.onended = () => {
      this.isCurrentlyPlaying = false;
    };
  }

  public stop() {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.activeSource = null;
    }
    this.isCurrentlyPlaying = false;
  }
}

export const synchronizedAudioPlayer = new SynchronizedAudioPlayer();
