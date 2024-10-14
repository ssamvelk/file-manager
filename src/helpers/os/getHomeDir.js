import os from 'node:os';

export function getHomeDir() {
  return os.homedir();
}
