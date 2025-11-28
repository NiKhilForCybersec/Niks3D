export interface VeoGenerationConfig {
  prompt: string;
  imageBase64: string | null;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export interface GeneratedVideo {
  uri: string;
  expiresAt?: string;
}

export enum AppView {
  VEO_STUDIO = 'VEO_STUDIO',
  AUTH_VISUALIZER = 'AUTH_VISUALIZER'
}

export interface AuthStep {
  id: number;
  title: string;
  description: string;
  source: string;
  target: string;
}

// Window augmentation for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}