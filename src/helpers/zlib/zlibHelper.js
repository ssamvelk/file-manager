import { OPERATION_FAILED, INVALID_INPUT } from '../../constants.js';
import path from 'node:path';
import { createBrotliCompress, createBrotliDecompress } from 'node:zlib';
import { access, constants } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';

export async function compressFile(args, current_dir) {
  if (args.length < 3) {
    console.log(INVALID_INPUT);
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
    console.log(OPERATION_FAILED);
  }
}

export async function decompressFile(args, current_dir) {
  if (args.length < 3) {
    console.log(INVALID_INPUT);
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
    console.log(OPERATION_FAILED);
  }
}
