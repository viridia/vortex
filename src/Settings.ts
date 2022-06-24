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

settingsManager.initialize().then(() => {
  // any key other than 'theme' and 'startFullscreen' will be invalid.
  // theme key will only accept 'dark' or 'light' as a value due to the generic.
  // settingsManager.setCache('windowPosition');
  const windowSize = settingsManager.getCache('windowSize');
  if (Array.isArray(windowSize)) {
    const [width, height] = windowSize;
    appWindow.setSize(new PhysicalSize(width, height));
  }

  const windowPosition = settingsManager.getCache('windowPosition');
  if (Array.isArray(windowPosition)) {
    const [x, y] = windowPosition;
    appWindow.setPosition(new PhysicalPosition(x, y));
  }
});
