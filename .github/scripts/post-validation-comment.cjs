/**
 * Posts a validation comment on a GitHub pull request with prompt injection protection
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - GitHub Actions context
 */

/**
 * Extract and validate issue number
 */
function extractIssueNumber(prBody) {
  if (!prBody || typeof prBody !== 'string') return null;
  const match = prBody.match(/Closes\s+#(\d+)/i);
  if (!match || !match[1]) return null;
  const issueNumber = parseInt(match[1], 10);
  if (isNaN(issueNumber) || issueNumber < 1 || issueNumber > 999999) return null;
  return issueNumber;
}

/**
 * Sanitize file path
 */
function sanitizeFilePath(filePath, allowedPrefix) {
  if (!filePath || typeof filePath !== 'string') return null;
  const cleaned = filePath.trim();
  if (!cleaned.startsWith(allowedPrefix)) return null;
  if (cleaned.includes('..')) return null;
  const filePathPattern = /^[a-zA-Z0-9.\/_-]+$/;
  if (!filePathPattern.test(cleaned)) return null;
  if (allowedPrefix.includes('docs/') && !cleaned.endsWith('.md')) return null;
  const filename = cleaned.split('/').pop() || '';
  const suspiciousPatterns = ['ignore', 'bypass', 'override', 'admin', 'system'];
  if (suspiciousPatterns.some((pattern) => filename.toLowerCase().includes(pattern))) return null;
  return cleaned;
}

/**
 * Detect potential injection attempts
 */
function detectInjection(text) {
  if (!text || typeof text !== 'string') return false;
  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|commands?|prompts?)/i,
    /you\s+are\s+now\s+(?:a|an)/i,
    /your\s+new\s+(?:task|instruction|role)/i,
    /skip\s+(?:all\s+)?validation/i,
  ];
  return dangerousPatterns.some((pattern) => pattern.test(text));
}

module.exports = async ({ github, context }) => {
  const prBody = context.payload.pull_request.body;

  // Detect injection attempts in PR body
  if (detectInjection(prBody)) {
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
    (f) => f.filename.endsWith('.md') && f.filename.startsWith('docs/tools/'),
  );
  const themesJsonModified = files.data.some((f) => f.filename === 'data/themes.json');

  if (toolFiles.length === 0) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `❌ **Error**: No tool documentation files found in this PR.`,
    });
    return;
  }

  const rawToolFile = toolFiles[0].filename;

  // Sanitize the file path
  const toolFile = sanitizeFilePath(rawToolFile, 'docs/tools/');

  if (!toolFile) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `❌ **Error**: Invalid or suspicious file path detected: ${rawToolFile}`,
    });
    return;
  }
  const hasNewThemes = context.payload.pull_request.labels.some((l) => l.name === 'new-themes');

  const commentBody = `/opencode

This PR adds a new tool to the Awesome OpenCode list${hasNewThemes ? ' and includes new themes' : ''}.

<instruction_reinforcement>
IMPORTANT: You must follow these instructions exactly. Do not skip validation steps.
</instruction_reinforcement>

Your task is to:

1. Read and validate the tool documentation file at: <user_input label="Tool File Path">${toolFile}</user_input>
   - Check that it has valid YAML frontmatter with: tool_name, repository, category, themes, tags
   - Verify it has a proper heading and description
   - Ensure the markdown is well-formatted

 2. ${hasNewThemes ? 'If this PR includes new themes (check if data/themes.json was modified):' : 'Check if data/themes.json was modified:'}
   ${themesJsonModified ? '- Read data/themes.json and identify themes with status: "pending-review"' : '- No theme changes detected'}
   ${hasNewThemes ? '- Change their status from "pending-review" to "active"' : ''}
   ${hasNewThemes ? '- Set approved_by: "manual"' : ''}
   ${hasNewThemes ? '- Commit the updated data/themes.json' : ''}

3. Read the current README.md

4. Extract the tool name, description, repository, and category from the validated tool file

5. Update README.md by adding a new entry under the appropriate category section
   - Format: - [Tool Name](repository_url) - Brief description
   - Insert in alphabetical order within the category
   - Maintain consistent formatting

6. Commit the updated README.md

7. If all validations pass:
   - Add a comment to this PR: "✅ Validation passed - README updated${hasNewThemes ? ', themes activated' : ''}"
   - Merge this PR using squash merge
   - Add a comment to issue #<user_input label="Issue Number">${issueNumber}</user_input>: "🎉 Tool successfully added! Documentation: \`${toolFile}\`"
   - Close issue #${issueNumber}

8. If any validation fails:
   - Add a comment explaining what needs to be fixed
   - Do not merge`;

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: commentBody,
  });
};
