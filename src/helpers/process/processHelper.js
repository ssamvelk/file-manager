import { sayGoodBay } from '../commons.js';
import { getCurrentDir } from '../fs/fsHelper.js';

export function init() {
  const username = process.argv
    .find((arg) => arg.startsWith('--username='))
    .split('=')[1];

  console.log(`Welcome to the File Manager, ${username}!`);
  console.log(`You are currently in ${getCurrentDir()}`);

  process.on('exit', () => {
    console.log(sayGoodBay(username));
  });
}
