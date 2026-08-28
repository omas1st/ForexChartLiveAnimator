import { ExportSettings, AspectRatioType } from '../types';
import { getAudioContext } from './audio';

export interface RecordCanvasOptions {
  durationSeconds: number;
  fps?: number;
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

export function getResolutionForAspectRatio(
  aspectRatio: AspectRatioType,
  backgroundImage?: HTMLImageElement | null
): { width: number; height: number } {
  if (aspectRatio === 'original' && backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    const nw = backgroundImage.naturalWidth;
    const nh = backgroundImage.naturalHeight;
    const maxDim = 1920;
    const scale = Math.min(maxDim / nw, maxDim / nh, 2.0);
    const w = Math.round((nw * scale) / 2) * 2;
    const h = Math.round((nh * scale) / 2) * 2;
    return { width: Math.max(640, w), height: Math.max(360, h) };
  }

  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 }; // Vertical for TikTok, Reels, Shorts
    case '1:1':
      return { width: 1080, height: 1080 }; // Square for Feed
    case '16:9':
    default:
      return { width: 1920, height: 1080 }; // Landscape for YouTube / Desktop
  }
}

/**
 * High quality frame-by-frame canvas video recorder with audio track mixing for smooth export
 */
export async function recordAnimationToVideo(options: RecordCanvasOptions): Promise<RecordingResult> {
  const {
    durationSeconds = 10,
    fps = 60,
    settings,
    backgroundImage,
    onProgress,
    renderFrame,
  } = options;

  const { width, height } = getResolutionForAspectRatio(settings.aspectRatio, backgroundImage);

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for recording');
  }

  // Detect supported mime types for universal compatibility
  const mimeTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=h264',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  let selectedMimeType = '';
  for (const mime of mimeTypes) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      selectedMimeType = mime;
      break;
    }
  }

  if (!selectedMimeType) {
    selectedMimeType = 'video/webm';
  }

  const canvasStream = offscreenCanvas.captureStream(fps);
  let recordingStream: MediaStream = canvasStream;
  let audioSourceNode: AudioBufferSourceNode | null = null;

  // Mix Audio Track if present
  const track = settings.audioTrack;
  if (track && track.audioBuffer && !track.isMuted) {
    try {
      const audioCtx = getAudioContext();
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
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ];
      recordingStream = new MediaStream(combinedTracks);
    } catch (e) {
      console.warn('Could not attach audio stream to recorder:', e);
      recordingStream = canvasStream;
    }
  }

  const mediaRecorder = new MediaRecorder(recordingStream, {
    mimeType: selectedMimeType,
    videoBitsPerSecond: 8_000_000, // 8 Mbps high quality
  });

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

  mediaRecorder.start();

  const totalFrames = Math.floor(durationSeconds * fps);
  const frameIntervalMs = 1000 / fps;

  // Render each frame sequentially with deterministic timeRatio
  for (let frame = 0; frame <= totalFrames; frame++) {
    const timeRatio = frame / totalFrames;
    const progress = (frame / totalFrames) * 100;

    if (onProgress) {
      onProgress(progress, `Rendering frame ${frame}/${totalFrames} (${Math.round(progress)}%)...`);
    }

    // Render the styled frame onto offscreen canvas
    renderFrame(ctx, width, height, timeRatio);

    // Yield control to let captureStream consume the frame
    await new Promise((r) => setTimeout(r, frameIntervalMs * 0.8));
  }

  if (onProgress) {
    onProgress(99, 'Finalizing video compression & audio mix...');
  }

  // Give a small pause before stopping recorder to ensure last frame is captured
  await new Promise((r) => setTimeout(r, 250));
  mediaRecorder.stop();

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
  const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
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
    const file = new File([blob], filename, { type: blob.type });
    await navigator.share({
      title,
      text,
      files: [file],
    });
    return true;
  } else if (navigator.share) {
    await navigator.share({
      title,
      text,
      url: window.location.href,
    });
    return true;
  }
  return false;
}
