import { ExportSettings, AspectRatioType } from '../types';
import { getAudioContext } from './audio';

export interface RecordCanvasOptions {
  durationSeconds: number;
  fps?: number;
  qualityPreset?: 'mobile' | 'hd' | 'ultra';
  settings: ExportSettings;
  backgroundImage?: HTMLImageElement | null;
  onProgress?: (progress: number, statusText: string) => void;
  renderFrame: (ctx: CanvasRenderingContext2D, width: number, height: number, timeRatio: number) => void;
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Checks if the current environment is a mobile phone / tablet to apply safe limits
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  const isTouchScreen = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const isNarrowScreen = window.innerWidth <= 768;
  return isMobileUA || (isTouchScreen && isNarrowScreen);
}

export function getResolutionForAspectRatio(
  aspectRatio: AspectRatioType,
  qualityPreset: 'mobile' | 'hd' | 'ultra' = 'hd',
  backgroundImage?: HTMLImageElement | null
): { width: number; height: number } {
  // Mobile / Fast uses 720p to prevent mobile OS memory kills
  // HD uses 1080p
  // Ultra uses 1080p+
  const isLowPower = qualityPreset === 'mobile';

  if (aspectRatio === 'original' && backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    const nw = backgroundImage.naturalWidth;
    const nh = backgroundImage.naturalHeight;
    const maxDim = isLowPower ? 1280 : 1920;
    const scale = Math.min(maxDim / nw, maxDim / nh, 2.0);
    const w = Math.round((nw * scale) / 2) * 2;
    const h = Math.round((nh * scale) / 2) * 2;
    return { width: Math.max(480, w), height: Math.max(360, h) };
  }

  switch (aspectRatio) {
    case '9:16':
      return isLowPower
        ? { width: 720, height: 1280 } // 720p Vertical (Extremely fast, 100% stable on mobile RAM)
        : { width: 1080, height: 1920 }; // 1080p Full HD Vertical
    case '1:1':
      return isLowPower
        ? { width: 720, height: 720 }
        : { width: 1080, height: 1080 };
    case '16:9':
    default:
      return isLowPower
        ? { width: 1280, height: 720 } // 720p Wide
        : { width: 1920, height: 1080 }; // 1080p Wide
  }
}

/**
 * High quality frame-by-frame canvas video recorder with audio track mixing.
 * Specially engineered for mobile stability with memory-safe frame pacing and fallback codecs.
 */
export async function recordAnimationToVideo(options: RecordCanvasOptions): Promise<RecordingResult> {
  const {
    durationSeconds = 10,
    qualityPreset = isMobileDevice() ? 'mobile' : 'hd',
    settings,
    backgroundImage,
    onProgress,
    renderFrame,
  } = options;

  // Adapt FPS to quality & device: 30 FPS on mobile prevents tab kills; 60 FPS on desktop
  const isMobile = isMobileDevice();
  const fps = options.fps || (qualityPreset === 'mobile' || isMobile ? 30 : 60);

  const { width, height } = getResolutionForAspectRatio(settings.aspectRatio, qualityPreset, backgroundImage);

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext('2d', { alpha: false, desynchronized: true });

  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for recording');
  }

  // Detect supported mime types for universal compatibility across iOS Safari & Android Chrome
  const candidateMimeTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=h264',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  let selectedMimeType = '';
  for (const mime of candidateMimeTypes) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mime)) {
      selectedMimeType = mime;
      break;
    }
  }

  if (!selectedMimeType && typeof MediaRecorder !== 'undefined') {
    selectedMimeType = '';
  }

  // Safe captureStream
  let canvasStream: MediaStream;
  if (typeof (offscreenCanvas as any).captureStream === 'function') {
    canvasStream = (offscreenCanvas as any).captureStream(fps);
  } else {
    throw new Error('Media capture stream is not supported in this browser. Please use Chrome, Safari or Edge.');
  }

  let recordingStream: MediaStream = canvasStream;
  let audioSourceNode: AudioBufferSourceNode | null = null;

  // Mix Audio Track safely if present
  const track = settings.audioTrack;
  if (track && track.audioBuffer && !track.isMuted) {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = track.audioBuffer;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(track.volume ?? 0.8, audioCtx.currentTime);

      source.connect(gain);
      gain.connect(dest);

      const trimStart = Math.max(0, track.trimStart || 0);
      source.start(audioCtx.currentTime, trimStart, durationSeconds);
      audioSourceNode = source;

      // Combine video track + audio track into single recording stream
      const videoTracks = canvasStream.getVideoTracks();
      const audioTracks = dest.stream.getAudioTracks();
      if (videoTracks.length > 0 && audioTracks.length > 0) {
        recordingStream = new MediaStream([...videoTracks, ...audioTracks]);
      }
    } catch (e) {
      console.warn('Audio stream mix unavailable on this mobile engine, proceeding with video-only track:', e);
      recordingStream = canvasStream;
    }
  }

  // Mobile-safe bitrates to prevent RAM blowup (3.5 Mbps for 720p, 6 Mbps for 1080p)
  const videoBitsPerSecond = qualityPreset === 'mobile' ? 3_500_000 : 6_000_000;

  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond,
  };
  if (selectedMimeType) {
    recorderOptions.mimeType = selectedMimeType;
  }

  let mediaRecorder: MediaRecorder;
  try {
    mediaRecorder = new MediaRecorder(recordingStream, recorderOptions);
  } catch (err) {
    // Fallback if specific bitrate/mime throws on mobile
    mediaRecorder = new MediaRecorder(recordingStream);
  }

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const outputMime = selectedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
      const finalBlob = new Blob(chunks, { type: outputMime });
      resolve(finalBlob);
    };
    mediaRecorder.onerror = (e) => reject(e);
  });

  // Start recorder in chunks of 1000ms to allow mobile garbage collection
  mediaRecorder.start(1000);

  const totalFrames = Math.floor(durationSeconds * fps);
  const frameDelay = isMobile ? 32 : 16; // Paced frame rendering to prevent tab freezes

  // Render each frame sequentially with deterministic timeRatio
  for (let frame = 0; frame <= totalFrames; frame++) {
    const timeRatio = frame / totalFrames;
    const progress = (frame / totalFrames) * 100;

    if (onProgress && (frame % 5 === 0 || frame === totalFrames)) {
      onProgress(progress, `Rendering frame ${frame}/${totalFrames} (${Math.round(progress)}%)...`);
    }

    // Render the frame onto the canvas
    renderFrame(ctx, width, height, timeRatio);

    // Yield execution to allow mobile browser compositor & encoder to flush memory
    await new Promise((r) => setTimeout(r, frameDelay));
  }

  if (onProgress) {
    onProgress(99, 'Finalizing video compression...');
  }

  // Brief pause before stopping recorder to ensure the last frame is encoded cleanly
  await new Promise((r) => setTimeout(r, 300));
  
  if (mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  if (audioSourceNode) {
    try {
      audioSourceNode.stop();
      audioSourceNode.disconnect();
    } catch {
      // Ignore
    }
  }

  const finalBlob = await recordingPromise;
  const url = URL.createObjectURL(finalBlob);
  const isMp4 = selectedMimeType.includes('mp4') || finalBlob.type.includes('mp4');
  const ext = isMp4 ? 'mp4' : 'webm';
  const cleanTitle = 'Forex_Live_Animation';
  const filename = `${cleanTitle}_${durationSeconds}s_${settings.aspectRatio.replace(':', 'x')}.${ext}`;

  if (onProgress) {
    onProgress(100, 'Video ready!');
  }

  return {
    blob: finalBlob,
    url,
    filename,
    mimeType: finalBlob.type,
    sizeBytes: finalBlob.size,
  };
}

/**
 * Trigger direct file download in browser
 */
export function downloadVideoBlob(blobUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Share video file via Web Share API if supported
 */
export async function shareVideoFile(blob: Blob, filename: string, title: string, text: string) {
  if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })) {
    try {
      const file = new File([blob], filename, { type: blob.type });
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch (e) {
      console.warn('User dismissed or failed share sheet:', e);
      return false;
    }
  } else if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: window.location.href,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

