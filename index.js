import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';
import path from 'node:path';
import fs, { createReadStream, createWriteStream } from 'node:fs';
import { OPERATION_FAILED, INVALID_INPUT } from './src/constants.js';
import { sayGoodBay } from './src/helpers/commons.js';
import { handleOSCommands } from './src/helpers/os/main.js';
import { getCurrentDir } from './src/helpers/os/getCurrentDir.js';
import { calculateHash } from './src/helpers/hash/hashHelper.js';
import { compressFile, decompressFile } from './src/helpers/zlib/zlibHelper.js';

import {
  access,
  constants,
  readdir,
  writeFile,
  rename,
  unlink,
} from 'node:fs/promises';

const username = process.argv
  .find((arg) => arg.startsWith('--username='))
  .split('=')[1];

/** Current directory */
let current_dir = getCurrentDir();

console.log(`Welcome to the File Manager, ${username}!`);
console.log(`You are currently in ${current_dir}`);

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
      await calculateHash(args, current_dir);
      break;
    case 'compress':
      await compressFile(args, current_dir);

      break;
    case 'decompress':
      await decompressFile(args, current_dir);
      break;
    default:
      console.log(INVALID_INPUT);
      break;
  }
});

process.on('exit', () => {
  console.log(sayGoodBay(username));
  rl.close();
});

function goUp() {
  const parentDir = path.dirname(current_dir);

  if (parentDir !== current_dir || parentDir === '/') {
    current_dir = parentDir;
    console.log(`You are currently in ${current_dir}`);
  } else {
    console.log(`User can't go upper than root directory`);
  }
}

async function changeDirectory(args) {
  if (args.length < 2) {
    console.log(INVALID_INPUT);

    return;
  }

  let path_to_directory;

  if (args[1].startsWith('/')) {
    // absolute path
    path_to_directory = args[1];
  } else {
    path_to_directory = path.resolve(current_dir, args[1]);
  }

  try {
    await access(path_to_directory, constants.R_OK | constants.W_OK);
    current_dir = path_to_directory;
    console.log(`You are currently in ${current_dir}`);
  } catch {
    console.log(OPERATION_FAILED);
  }
}

async function listFiles() {
  try {
    const files = await readdir(current_dir);

    const sortedFiles = files
      .map((file) => ({
        Name: file,
        Type: fs.lstatSync(path.join(current_dir, file)).isDirectory()
          ? 'directory'
          : 'file',
      }))
      .sort((a, b) =>
        a.Type === b.Type
          ? a.Name.localeCompare(b.Name)
          : a.Type === 'directory'
          ? -1
          : 1
      );

    console.table(sortedFiles);
  } catch {
    console.log(OPERATION_FAILED);
  }
}

async function readFile(args) {
  if (args.length < 2) {
    console.log(INVALID_INPUT);
    return;
  }

  const filePath = path.resolve(current_dir, args[1]);

  try {
    await access(filePath, constants.R_OK | constants.W_OK);

    if (fs.lstatSync(filePath).isFile()) {
      const readStream = createReadStream(filePath);
      readStream.pipe(process.stdout);
      readStream.on('error', () => console.log(OPERATION_FAILED));
    } else {
      console.log(OPERATION_FAILED);
    }
  } catch {
    console.log(OPERATION_FAILED);
  }
}

async function createFile(args) {
  if (args.length < 2) {
    console.log(INVALID_INPUT);
    return;
  }

  const filePath = path.resolve(current_dir, args[1]);

  try {
    await writeFile(filePath, '');
  } catch {
    console.log(OPERATION_FAILED);
  }
}

async function renameFile(args) {
  if (args.length < 3) {
    console.log(INVALID_INPUT);
    return;
  }

  const oldPath = path.resolve(current_dir, args[1]);
  const newPath = path.resolve(current_dir, args[2]);

  try {
    await rename(oldPath, newPath);
  } catch {
    console.log(INVALID_INPUT);
  }
}

async function copyFile(args, is_move = false) {
  if (args.length < 3) {
    console.log(INVALID_INPUT);
    return;
  }

  const srcPath = path.resolve(current_dir, args[1]);
  const destPath = path.resolve(current_dir, args[2]);

  try {
    await access(srcPath, constants.R_OK | constants.W_OK);

    const readStream = createReadStream(srcPath);
    const writeStream = createWriteStream(destPath);

    readStream.pipe(writeStream);
    readStream.on('error', () => console.log(OPERATION_FAILED));
    writeStream.on('finish', () => {
      if (is_move) {
        console.log('File moved');
      } else {
        console.log('File copied');
      }
    });
  } catch {
    console.log(INVALID_INPUT);
  }
}

async function moveFile(args) {
  try {
    await copyFile(args, true);

    const srcPath = path.resolve(current_dir, args[1]);

    await access(srcPath, constants.R_OK | constants.W_OK);

    if (args[1] !== args[2]) {
      unlink(srcPath);
    }
  } catch (error) {
    console.log(OPERATION_FAILED);
  }
}

async function deleteFile(args) {
  if (args.length < 2) {
    console.log(INVALID_INPUT);
    return;
  }

  const filePath = path.resolve(current_dir, args[1]);

  try {
    await access(filePath, constants.R_OK | constants.W_OK);

    unlink(filePath);
    console.log(`File ${args[1]} deleted`);
  } catch {
    console.log(OPERATION_FAILED);
  }
}
