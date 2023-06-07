import * as core from '@actions/core';
import * as github from '@actions/github';

import { validateFilenames } from './validate-filenames';
import { regexURL } from './regex101';

const DEFAULT_PATTERN = '^.+\\..+$';
const DEFAULT_PATH = '.';

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
  let output;
  try {
    console.log('====================');
    console.log('|  Lint Filenames  |');
    console.log('====================');

    const path = core.getInput('path', { required: true }) || DEFAULT_PATH;
    const rawPattern =
      core.getInput('pattern', { required: true }) || DEFAULT_PATTERN;
    const pattern = new RegExp(rawPattern);
    const recursive = core.getInput('recursive');

    output = await validateFilenames(path, pattern, recursive === 'true');
    if (output.failedFiles.length !== 0) {
      // When checks fail print an helpful message pointing to any broken
      // filenames on regex101
      console.log(`The event name is: ${github.context.eventName}`);

      if (github.context.eventName === 'pull-request') {
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

      core.setFailed(
        `${output.failedFiles.length} files not matching the pattern were found, see log above. ❌`
      );
      return;
    }

    console.log('✅\tSuccessSuccess: All files match the given pattern!');
    core.setOutput('total-files-analyzed', output.totalFilesAnalyzed);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    core.debug(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed('An unknown error occurred. Check the logs for details');
  }
}

run();
