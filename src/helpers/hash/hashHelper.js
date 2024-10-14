import { OPERATION_FAILED } from '../../constants.js';
import crypto from 'crypto';
import path from 'node:path';
import { access, constants } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

export async function calculateHash(args, current_dir) {
  if (args.length < 2) {
    console.log(INVALID_INPUT);
    return;
  }

  try {
    const filePath = path.resolve(current_dir, args[1]);

    await access(filePath, constants.R_OK | constants.W_OK);

    const hash = crypto.createHash('sha256');
    const readStream = createReadStream(filePath);
    readStream.on('data', (chunk) => hash.update(chunk));
    readStream.on('end', () => console.log(`Hash: ${hash.digest('hex')}`));
    readStream.on('error', () => console.log(OPERATION_FAILED));
  } catch {
    console.log(OPERATION_FAILED);
  }
}
