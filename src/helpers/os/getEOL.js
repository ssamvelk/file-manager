import os from 'node:os';

export function getEOL() {
  return `EOL: ${JSON.stringify(os.EOL)}`;
}
