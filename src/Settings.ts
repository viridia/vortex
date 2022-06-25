import { SettingsManager } from 'tauri-settings';
import { appWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';

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
