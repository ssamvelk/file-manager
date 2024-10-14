import os from 'node:os';

export function getCPUS() {
  return os.cpus();
}
