/**
 * Posts a validation comment on a GitHub pull request with prompt injection protection
 *
 * Imports security functions from the shared security module to validate
 * user input and prevent prompt injection attacks.
 *
 * @param github - GitHub API client
 * @param context - GitHub Actions context
 */

import { extractIssueNumber, sanitizeFilePath, detectInjectionAttempt } from '../../src/security';

interface PostValidationCommentParams {
  github: any;
  context: any;
}

export async function postValidationComment({
  github,
  context,
}: PostValidationCommentParams): Promise<void> {
  const prBody = context.payload.pull_request.body;

  // Detect injection attempts in PR body
  if (detectInjectionAttempt(prBody)) {
    console.log('[Security] Potential prompt injection attempt detected in PR body');
  }

  const issueNumber = extractIssueNumber(prBody);

  if (!issueNumber) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `❌ **Error**: Could not find valid related issue in PR description (expected "Closes #123" format).`,
    });
    return;
  }

  // Get the files changed in this PR
  const files = await github.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: context.payload.pull_request.number,
  });

  const toolFiles = files.data.filter(
    (f: any) => f.filename.endsWith('.md') && f.filename.startsWith('docs/tools/'),
  );

  if (toolFiles.length === 0) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `❌ **Error**: No tool documentation files found in docs/tools/ directory. Please add a Markdown file for your tool.`,
    });
    return;
  }

  // Validate file paths
  const invalidFiles: string[] = [];
  for (const file of toolFiles) {
    const sanitized = sanitizeFilePath(file.filename, 'docs/tools/');
    if (!sanitized) {
      invalidFiles.push(file.filename);
    }
  }

  if (invalidFiles.length > 0) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `❌ **Error**: Invalid file paths detected: ${invalidFiles.join(', ')}. Please ensure files are in the correct location.`,
    });
    return;
  }

  const filesAdded = toolFiles.map((f: any) => f.filename).join('\n- ');

  // Post success comment
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: `✅ **Validation Passed**: 
- Related issue: #${issueNumber}
- Tool files added: 
  - ${filesAdded}
  
Your contribution looks good! A maintainer will review it soon.`,
  });
}

// Export default for direct module execution
export default postValidationComment;
