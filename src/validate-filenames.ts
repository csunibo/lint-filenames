import fs from 'fs';
import path from 'path';

export async function validateFilenames(
  dirpath: string,
  pattern: RegExp,
  recursive: boolean
): Promise<{
  totalFilesAnalyzed: number;
  failedFiles: string[];
}> {
  console.log(`ℹ️  Path:    \t\t'${dirpath}'`);
  console.log(`ℹ️  Pattern: \t\t${pattern}`);
  console.log(`ℹ️  Recursive: \t\t${recursive}`);
  const failedFiles: string[] = [];
  let totalFilesAnalyzed = 0;

  function check(dirPath: string): void {
    const relativeChilds = fs.readdirSync(dirPath);

    for (const relativeChild of relativeChilds) {
      const absoluteChild = path.join(dirPath, relativeChild);
      if (fs.statSync(absoluteChild).isDirectory()) {
        if (recursive) check(absoluteChild);
      } else {
        ++totalFilesAnalyzed;
        if (pattern.test(relativeChild)) console.log(`\t OK ${absoluteChild}`);
        else {
          console.log(`\t !! ${absoluteChild}`);
          failedFiles.push(absoluteChild);
        }
      }
    }
  }

  try {
    console.log('Verification starting...');
    check(dirpath);
    console.log('Verification finished.');
    console.log(`ℹ️  Files analyzed: \t${totalFilesAnalyzed}`);
  } catch (error) {
    throw new Error('Execution failed, see log above. ❌');
  }

  return {
    totalFilesAnalyzed,
    failedFiles,
  };
}
