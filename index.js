import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

import { INVALID_INPUT } from './src/constants.js';
import { handleOSCommands } from './src/helpers/os/main.js';
import { calculateHash } from './src/helpers/hash/hashHelper.js';
import { compressFile, decompressFile } from './src/helpers/zlib/zlibHelper.js';
import {
  goUp,
  changeDirectory,
  listFiles,
  readFile,
  createFile,
  renameFile,
  copyFile,
  moveFile,
  deleteFile,
} from './src/helpers/fs/fsHelper.js';

import { init } from './src/helpers/process/processHelper.js';

init();

const rl = readline.createInterface({ input, output });

rl.on('line', async (input) => {
  const args = input.split(' ');
  const command = args[0];

  switch (command) {
    case 'exit':
      rl.close();
      break;
    case 'up':
      goUp();
      break;
    case 'cd':
      await changeDirectory(args);
      break;
    case 'ls':
      await listFiles();
      break;
    case 'cat':
      await readFile(args);
      break;
    case 'add':
      await createFile(args);
      break;
    case 'rn':
      await renameFile(args);
      break;
    case 'cp':
      await copyFile(args);
      break;
    case 'mv':
      await moveFile(args);
      break;
    case 'rm':
      await deleteFile(args);
      break;
    case 'os':
      handleOSCommands(args);
      break;
    case 'hash':
      await calculateHash(args);
      break;
    case 'compress':
      await compressFile(args);
      break;
    case 'decompress':
      await decompressFile(args);
      break;

    default:
      console.log(INVALID_INPUT);
      break;
  }
});
