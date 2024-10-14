import { getHomeDir } from './getHomeDir.js';
import { getCPUS } from './getCPUS.js';
import { getEOL } from './getEOL.js';
import { getUserName } from './getUserName.js';
import { getArchitecture } from './getArchitecture.js';
import { OPERATION_FAILED } from '../../constants.js';

export function handleOSCommands(args) {
  if (args.length < 2) {
    console.log(OPERATION_FAILED);
    return;
  }

  switch (args[1]) {
    case '--EOL':
      console.log(getEOL());
      break;
    case '--cpus':
      const cpus_info = getCPUS();
      console.log(`Overall amount of CPUS is ${cpus_info.length}`);
      console.log(cpus_info);
      break;
    case '--homedir':
      console.log(getHomeDir());
      break;
    case '--username':
      console.log(getUserName());
      break;
    case '--architecture':
      console.log(getArchitecture());
      break;

    default:
      console.log(OPERATION_FAILED);
      break;
  }
}
