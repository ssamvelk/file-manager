// const fs = require('fs');
// const os = require('node:os');
import os from 'node:os';
// const { stdin: input, stdout: output, cwd } = require('node:process');
import { stdin as input, stdout as output, cwd } from 'node:process';

// const readline = require('node:readline/promises');
import readline from 'node:readline/promises';
// const path = require('node:path');
import path from 'node:path';
// const fs = require('node:fs/promises');
// import { access, constants } from 'node:fs/promises';
// const { access, readdir, lstat } = require('node:fs/promises');

// import { createReadStream, createWriteStream } from 'fs';
import fs, { createReadStream, createWriteStream } from 'node:fs';
import crypto from 'crypto';

import {
  access,
  constants,
  readdir,
  lstat,
  writeFile,
  rename,
  unlink,
} from 'node:fs/promises';

const username = process.argv
  .find((arg) => arg.startsWith('--username='))
  .split('=')[1];

/** Домашняя папка пользователя */
const homeDir = os.homedir();
/** Текущая директория */
let currentDir = cwd();

console.log(`Welcome to the File Manager, ${username}!`);
console.log(`You are currently in ${currentDir}`);

const rl = readline.createInterface({ input, output });

rl.on('line', async (input) => {
  const args = input.split(' ');
  const command = args[0];

  console.log('>>>>>>>> line args', args);
  console.log('>>>>>>>> line input', input);

  switch (command) {
    case 'exit':
      console.log(`Thank you for using File Manager, ${username}, goodbye!`);
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
      compressFile(args);
      break;
    case 'decompress':
      decompressFile(args);
      break;
    default:
      console.log('Invalid input');
      break;
  }
});

function goUp() {
  const parentDir = path.dirname(currentDir);

  if (parentDir !== currentDir) {
    currentDir = parentDir;
    console.log(`You are currently in ${currentDir}`);
  } else {
    console.log(`User can't go upper than root directory`);
  }
}

async function changeDirectory(args) {
  if (args.length < 2) {
    console.log('Invalid input');

    return;
  }

  let path_to_directory;

  if (args[1].startsWith('/')) {
    // absolute path
    path_to_directory = args[1];
  } else {
    path_to_directory = path.resolve(currentDir, args[1]);
  }

  // console.log('>>>>>>>>> path_to_directory', path_to_directory);

  try {
    await access(path_to_directory, constants.R_OK | constants.W_OK);
    currentDir = path_to_directory;
    console.log(`You are currently in ${currentDir}`);
  } catch {
    console.log('Operation failed');
  }
}

async function listFiles() {
  try {
    const files = await readdir(currentDir);

    const sortedFiles = files
      .map((file) => ({
        Name: file,
        Type: fs.lstatSync(path.join(currentDir, file)).isDirectory()
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
    console.log('Operation failed');
  }
}

async function readFile(args) {
  if (args.length < 2) {
    console.log('Invalid input');
    return;
  }

  const filePath = path.resolve(currentDir, args[1]);

  try {
    await access(filePath, constants.R_OK | constants.W_OK);

    if (fs.lstatSync(filePath).isFile()) {
      const readStream = createReadStream(filePath);
      readStream.pipe(process.stdout);
      readStream.on('error', () => console.log('Operation failed'));
    } else {
      console.log('Operation failed');
    }
  } catch {
    console.log('Operation failed');
  }
}

async function createFile(args) {
  if (args.length < 2) {
    console.log('Invalid input');
    return;
  }

  const filePath = path.resolve(currentDir, args[1]);

  try {
    await writeFile(filePath, '');
  } catch {
    console.log('Operation failed');
  }
}

async function renameFile(args) {
  if (args.length < 3) {
    console.log('Invalid input');
    return;
  }

  const oldPath = path.resolve(currentDir, args[1]);
  const newPath = path.resolve(currentDir, args[2]);

  try {
    await rename(oldPath, newPath);
  } catch {
    console.log('Invalid input');
  }
}

async function copyFile(args) {
  if (args.length < 3) {
    console.log('Invalid input');
    return;
  }

  const srcPath = path.resolve(currentDir, args[1]);
  const destPath = path.resolve(currentDir, args[2]);

  try {
    await access(srcPath, constants.R_OK | constants.W_OK);

    const readStream = createReadStream(srcPath);
    const writeStream = createWriteStream(destPath);

    readStream.pipe(writeStream);
    readStream.on('error', () => console.log('Operation failed'));
    writeStream.on('finish', () => console.log('File copied'));
  } catch {
    console.log('Invalid input');
  }
}

async function moveFile(args) {
  try {
    await copyFile(args);

    const srcPath = path.resolve(currentDir, args[1]);

    await access(srcPath, constants.R_OK | constants.W_OK);

    if (args[1] !== args[2]) {
      unlink(srcPath);
    }
  } catch (error) {
    console.log('Operation failed');
  }
}

async function deleteFile(args) {
  if (args.length < 2) {
    console.log('Invalid input');
    return;
  }

  const filePath = path.resolve(currentDir, args[1]);

  try {
    await access(filePath, constants.R_OK | constants.W_OK);

    unlink(filePath);
    console.log(`File ${args[1]} deleted`);
  } catch {
    console.log('Operation failed');
  }
}

function handleOSCommands(args) {
  if (args.length < 2) {
    console.log('Operation failed');
    return;
  }

  switch (args[1]) {
    case '--EOL':
      console.log(`EOL: ${JSON.stringify(os.EOL)}`);
      break;
    case '--cpus':
      console.log(os.cpus());
      break;
    case '--homedir':
      console.log(os.homedir());
      break;
    case '--username':
      console.log(os.userInfo().username);
      break;
    case '--architecture':
      console.log(process.arch);
      break;

    default:
      console.log('Operation failed');
      break;
  }
}

async function calculateHash(args) {
  if (args.length < 2) {
    console.log('Invalid input');
    return;
  }

  try {
    const filePath = path.resolve(currentDir, args[1]);

    await access(filePath, constants.R_OK | constants.W_OK);

    const hash = crypto.createHash('sha256');
    const readStream = createReadStream(filePath);
    readStream.on('data', (chunk) => hash.update(chunk));
    readStream.on('end', () => console.log(`Hash: ${hash.digest('hex')}`));
    readStream.on('error', () => console.log('Operation failed'));
  } catch {
    console.log('Operation failed');
  }
}
