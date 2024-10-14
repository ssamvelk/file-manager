import path from 'node:path';
import { cwd } from 'node:process';
import {
  access,
  constants,
  readdir,
  writeFile,
  rename,
  unlink,
} from 'node:fs/promises';
import { lstat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';

import { OPERATION_FAILED, INVALID_INPUT } from '../../constants.js';

/** Current directory */
export let current_dir = cwd();

export function getCurrentDir() {
  return current_dir;
}

export function goUp() {
  const parent_dir = path.dirname(current_dir);

  if (parent_dir !== current_dir || parent_dir === '/') {
    current_dir = parent_dir;
    console.log(`You are currently in ${current_dir}`);
  } else {
    console.log(`User can't go upper than root directory`);
  }
}

export async function changeDirectory(args) {
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

    const stats = await lstat(path_to_directory);

    if (!stats.isDirectory()) {
      throw new Error(`${path_to_directory} is not directory!`);
    }

    current_dir = path_to_directory;
    console.log(`You are currently in ${current_dir}`);
  } catch {
    console.log(OPERATION_FAILED);
  }
}

export async function listFiles() {
  try {
    const files = await readdir(current_dir);

    const arr = [];

    for await (const file of files) {
      const stat = await lstat(path.join(current_dir, file));

      arr.push({
        Name: file,
        Type: stat.isDirectory() ? 'directory' : 'file',
      });
    }

    const sorted_files = arr.sort((a, b) =>
      a.Type === b.Type
        ? a.Name.localeCompare(b.Name)
        : a.Type === 'directory'
        ? -1
        : 1
    );

    console.table(sorted_files);
  } catch {
    console.log(OPERATION_FAILED);
  }
}

export async function readFile(args) {
  if (args.length < 2) {
    console.log(INVALID_INPUT);
    return;
  }

  const filePath = path.resolve(current_dir, args[1]);

  try {
    await access(filePath, constants.R_OK | constants.W_OK);

    const stats = await lstat(filePath);

    if (stats.isFile()) {
      const readStream = createReadStream(filePath);
      readStream.pipe(process.stdout);
      readStream.on('error', () => console.log(OPERATION_FAILED));
    } else {
      throw new Error(`${filePath} is not file!`);
    }
  } catch {
    console.log(OPERATION_FAILED);
  }
}

export async function createFile(args) {
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

export async function renameFile(args) {
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

export async function copyFile(args, is_move = false) {
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

export async function moveFile(args) {
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

export async function deleteFile(args) {
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
