import { documentDir } from '@tauri-apps/api/path';

let defaultDir = await documentDir();

export function getDefaultDir(): string {
  return defaultDir;
}

export function setDefaultDir(dirName: string) {
  defaultDir = dirName;
}
