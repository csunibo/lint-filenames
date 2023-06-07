import * as core from '@actions/core';
import * as github from '@actions/github';

import { validateFilenames } from './validate-filenames';
import { regexURL } from './regex101';

const commentBody = async (
  regex: string,
  failedFiles: string[]
): Promise<string> =>
  `Some files changed in this PR didn't match the required filename format:
\`${regex}\`
Here is a list of non-comforming files:
${failedFiles.map(file => ` - ${file}\n`)}
You can test the regex and the file interactively [here](${await regexURL(
    regex,
    failedFiles
  )}).
Then please correct the naming to move the PR forward.
`;

async function run(): Promise<void> {
  try {
    const path = core.getInput('path', { required: true });
    const rawPattern = core.getInput('pattern', { required: true });
    const pattern = new RegExp(rawPattern);
    const recursive = core.getInput('recursive') === 'true';

    const output = await core.group(
      'Validating filenames',
      async () => await validateFilenames(path, pattern, recursive)
    );

    if (output.failedFiles.length !== 0) {
      // When checks fail print an helpful message pointing to any broken
      // filenames on regex101

      if (github.context.eventName === 'pull-request') {
        core.debug('PR event detected, commenting on PR');

        const octokit = github.getOctokit(core.getInput('token'));
        const body = await commentBody(rawPattern, output.failedFiles);

        core.debug(`PR message body:\n"""${body}"""`);
        await octokit.rest.issues.createComment({
          issue_number: github.context.issue.number,
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          body,
        });
      }

      for (const failedFile of output.failedFiles) {
        core.error(`${failedFile} doesn't match the given pattern`, {
          file: failedFile,
        });
      }

      core.setFailed(
        `${output.failedFiles.length} files didn't match the given pattern`
      );
      return;
    }

    core.info('✅ Success: All files match the given pattern!');
    core.setOutput('total-files-analyzed', output.totalFilesAnalyzed);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    core.debug(`The event payload: ${payload}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error');
    }
  }
}

run();
