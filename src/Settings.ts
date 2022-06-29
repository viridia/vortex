import { SettingsManager } from 'tauri-settings';

interface SettingsSchema {
  windowSize: [number, number];
  windowPosition?: [number, number];
  startFullscreen: boolean;
}

export const settingsManager = new SettingsManager<SettingsSchema>(
  {
    windowSize: [800, 600],
    startFullscreen: false,
  },
  {
    fileName: 'vortex-settings',
  }
);
