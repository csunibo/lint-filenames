import fs from 'fs';
import path from 'path';

export async function validateFilenames(
  dirpath: string,
  pattern: RegExp,
  recursive?: boolean
): Promise<{
  totalFilesAnalyzed: number;
  failedFiles: string[];
}> {
  console.log(`ℹ️  Path:    \t\t'${dirpath}'`);
  console.log(`ℹ️  Pattern: \t\t${pattern}`);
  console.log(`ℹ️  Recursive: \t\t${recursive}`);
  const failedFiles: string[] = [];
  let totalFilesAnalyzed = 0;

  function check(dirPath: string, recursive?: boolean) {
    fs.readdirSync(dirPath).forEach(relativeChild => {
      const absoluteChild = path.join(dirPath, relativeChild);
      if (fs.statSync(absoluteChild).isDirectory()) {
        if (recursive) check(absoluteChild, true);
      } else {
        ++totalFilesAnalyzed;
        if (pattern.test(relativeChild)) console.log(`  ✔️  ${absoluteChild}`);
        else {
          console.log(`  ❌  ${absoluteChild}`);
          failedFiles.push(absoluteChild);
        }
      }
    });
  }

  try {
    console.log('Verification starting...');
    check(dirpath, recursive);
    console.log('Verification finished.');
    console.log(`ℹ️  Files analyzed: \t${totalFilesAnalyzed}`);
  } catch (error) {
    throw new Error('Execution failed, see log above. ❌');
  }

  if (failedFiles.length) {
    throw new Error(
      `${failedFiles.length} files not matching the pattern were found, see log above. ❌`
    );
  } else {
    console.log('✅ Success: All files match the given pattern!');
    return {
      totalFilesAnalyzed,
      failedFiles,
    };
  }
}
