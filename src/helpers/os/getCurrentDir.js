import { cwd } from 'node:process';

export function getCurrentDir() {
  return cwd();
}
