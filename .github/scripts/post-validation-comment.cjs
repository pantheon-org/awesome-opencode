/**
 * Posts a validation comment on a GitHub pull request
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - GitHub Actions context
 */
module.exports = async ({ github, context }) => {
  const prBody = context.payload.pull_request.body;
  const issueMatch = prBody.match(/Closes #(\d+)/);

  if (!issueMatch) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `❌ **Error**: Could not find related issue in PR description.`,
    });
    return;
  }

  const issueNumber = issueMatch[1];

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

  const toolFile = toolFiles[0].filename;
  const hasNewThemes = context.payload.pull_request.labels.some((l) => l.name === 'new-themes');

  const commentBody = `/opencode

This PR adds a new tool to the Awesome OpenCode list${hasNewThemes ? ' and includes new themes' : ''}.

Your task is to:

1. Read and validate the tool documentation file at: ${toolFile}
   - Check that it has valid YAML frontmatter with: tool_name, repository, category, themes, tags
   - Verify it has a proper heading and description
   - Ensure the markdown is well-formatted

 2. ${hasNewThemes ? 'If this PR includes new themes (check if data/themes.json was modified):' : 'Check if data/themes.json was modified:'}
   ${themesJsonModified ? '- Read data/themes.json and identify themes with status: "pending-review"' : '- No theme changes detected'}
   ${hasNewThemes ? '- Change their status from "pending-review" to "active"' : ''}
   ${hasNewThemes ? '- Set approved_by: "manual"' : ''}
   ${hasNewThemes ? '- Commit the updated data/themes.json' : ''}

3. Read the current README.md

4. Extract the tool name, description, repository, and category from ${toolFile}

5. Update README.md by adding a new entry under the appropriate category section
   - Format: - [Tool Name](repository_url) - Brief description
   - Insert in alphabetical order within the category
   - Maintain consistent formatting

6. Commit the updated README.md

7. If all validations pass:
   - Add a comment to this PR: "✅ Validation passed - README updated${hasNewThemes ? ', themes activated' : ''}"
   - Merge this PR using squash merge
   - Add a comment to issue #${issueNumber}: "🎉 Tool successfully added! Documentation: \`${toolFile}\`"
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
