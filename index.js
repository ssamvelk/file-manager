import os from 'node:os';
import { stdin as input, stdout as output, cwd } from 'node:process';
import readline from 'node:readline/promises';
import path from 'node:path';
import fs, { createReadStream, createWriteStream } from 'node:fs';
import crypto from 'crypto';
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib';

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

const GOODBAY_TEXT = `\nThank you for using File Manager, ${username}, goodbye!`;

/** Home directory */
const home_dir = os.homedir();
/** Current directory */
let current_dir = cwd();

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
      await calculateHash(args);
      break;
    case 'compress':
      await compressFile(args);
      break;
    case 'decompress':
      await decompressFile(args);
      break;
    default:
      console.log('Invalid input');
      break;
  }
});

process.on('exit', () => {
  console.log(GOODBAY_TEXT);
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
    console.log('Invalid input');

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
    console.log('Operation failed');
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
    console.log('Operation failed');
  }
}

async function readFile(args) {
  if (args.length < 2) {
    console.log('Invalid input');
    return;
  }

  const filePath = path.resolve(current_dir, args[1]);

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

  const filePath = path.resolve(current_dir, args[1]);

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

  const oldPath = path.resolve(current_dir, args[1]);
  const newPath = path.resolve(current_dir, args[2]);

  try {
    await rename(oldPath, newPath);
  } catch {
    console.log('Invalid input');
  }
}

async function copyFile(args, is_move = false) {
  if (args.length < 3) {
    console.log('Invalid input');
    return;
  }

  const srcPath = path.resolve(current_dir, args[1]);
  const destPath = path.resolve(current_dir, args[2]);

  try {
    await access(srcPath, constants.R_OK | constants.W_OK);

    const readStream = createReadStream(srcPath);
    const writeStream = createWriteStream(destPath);

    readStream.pipe(writeStream);
    readStream.on('error', () => console.log('Operation failed'));
    writeStream.on('finish', () => {
      if (is_move) {
        console.log('File moved');
      } else {
        console.log('File copied');
      }
    });
  } catch {
    console.log('Invalid input');
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
    console.log('Operation failed');
  }
}

async function deleteFile(args) {
  if (args.length < 2) {
    console.log('Invalid input');
    return;
  }

  const filePath = path.resolve(current_dir, args[1]);

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
      const cpus_info = os.cpus();
      console.log(`Overall amount of CPUS is ${cpus_info.length}`);
      console.log(cpus_info);
      break;
    case '--homedir':
      console.log(home_dir);
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
    const filePath = path.resolve(current_dir, args[1]);

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

async function compressFile(args) {
  if (args.length < 3) {
    console.log('Invalid input');
    return;
  }

  try {
    const filePath = path.resolve(current_dir, args[1]);
    await access(filePath, constants.R_OK | constants.W_OK);

    const destPath = path.resolve(current_dir, args[2]);

    const compressStream = createBrotliCompress();

    const input = createReadStream(filePath);
    const output = createWriteStream(destPath);

    input.pipe(compressStream).pipe(output);
    output.on('finish', () => console.log('File compressed'));
  } catch {
    console.log('Operation failed');
  }
}

async function decompressFile(args) {
  if (args.length < 3) {
    console.log('Invalid input');
    return;
  }

  try {
    const filePath = path.resolve(current_dir, args[1]);
    await access(filePath, constants.R_OK | constants.W_OK);

    const destPath = path.resolve(current_dir, args[2]);
    const decompressStream = createBrotliDecompress();

    const input = createReadStream(filePath);
    const output = createWriteStream(destPath);

    input.pipe(decompressStream).pipe(output);
    output.on('finish', () => console.log('File decompressed'));
  } catch {
    console.log('Operation failed');
  }
}
