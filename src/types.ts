export interface Point {
  x: number; // Normalized 0.0 to 1.0
  y: number; // Normalized 0.0 to 1.0
}

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  xNormalized: number;
  yNormalized: number;
  openNormY: number;   // Normalized Y (0..1) for Open
  closeNormY: number;  // Normalized Y (0..1) for Close
  highNormY: number;   // Normalized Y (0..1) for High (highest price = lowest Y)
  lowNormY: number;    // Normalized Y (0..1) for Low (lowest price = highest Y)
  isBullish: boolean;
  timeIndex: number;
  wicksVisible?: boolean;
}

export interface CandleSizing {
  widthScale: number;  // 0.2 to 3.0 (default 0.65 for matching screenshot sizes)
  heightScale: number; // 0.2 to 3.0 (default 0.85)
  candleCount: number; // Base candle count along the trajectory
  spacingScale: number; // 0.3 to 2.5 (default 1.0) - controls closeness / gap between candles
}

export type DrawingToolType = 
  | 'path'  // Straight-line multi-point path: tap to place point, double tap to finish
  | 'pen'   // Freehand drawing
  | 'text'; // Text annotation tool

export interface UserText {
  id: string;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  text: string;
  fontSize: number; // e.g. 12 to 72
  fontFamily: string; // 'Plus Jakarta Sans' | 'Montserrat' | 'JetBrains Mono' | 'Orbitron' | 'Playfair Display' | 'Caveat' | 'Impact'
  color: string; // text hex color
  fontWeight?: 'normal' | 'bold' | '900';
  backgroundColor?: string;
  borderColor?: string;
  hasBorder?: boolean;
  hasShadow?: boolean;
}

export interface UserDrawing {
  id: string;
  type: 'pen' | 'line' | 'arrow' | 'box';
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  artist?: string;
  sourceType: 'preset' | 'custom';
  audioBuffer: AudioBuffer | null;
  audioUrl?: string;
  duration: number; // Total audio file duration in seconds
  trimStart: number; // Trim start offset in seconds
  trimEnd: number; // Trim end offset in seconds
  volume: number; // 0.0 to 1.0 (default 0.75)
  isMuted: boolean;
}

export type AspectRatioType = 'original' | '9:16' | '16:9' | '1:1';

export type WatermarkPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface ExportSettings {
  aspectRatio: AspectRatioType;
  durationSeconds: number; // 3 to 120 seconds
  fps: number;
  authorHandle?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkPosition?: WatermarkPosition;
  audioTrack?: AudioTrack | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number; // 0 to durationSeconds
  duration: number; // 3 to 120 seconds (default 10s)
  playbackRate: number; // 0.5, 1, 2
  isLooping: boolean;
  soundEnabled: boolean;
  audioTrack?: AudioTrack | null;
}
