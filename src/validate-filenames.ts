import fs from 'fs';
import path from 'path';

export async function validateFilenames(
  dirPath: string,
  pattern: RegExp,
  recursive: boolean
): Promise<{
  totalFilesAnalyzed: number;
  failedFiles: string[];
}> {
  const failedFiles: string[] = [];
  let totalFilesAnalyzed = 0;

  const relativeChilds = fs.readdirSync(dirPath);

  for (const relativeChild of relativeChilds) {
    const absoluteChild = path.join(dirPath, relativeChild);

    if (!fs.statSync(absoluteChild).isDirectory()) {
      totalFilesAnalyzed++;

      if (pattern.test(relativeChild)) {
        console.log(`OK ${absoluteChild}`);
      } else {
        console.log(`KO ${absoluteChild}`);
        failedFiles.push(absoluteChild);
      }
    } else if (recursive) {
      const recursion = await validateFilenames(
        absoluteChild,
        pattern,
        recursive
      );
      totalFilesAnalyzed += recursion.totalFilesAnalyzed;
      failedFiles.push(...recursion.failedFiles);
    }
  }

  return {
    totalFilesAnalyzed,
    failedFiles,
  };
}
