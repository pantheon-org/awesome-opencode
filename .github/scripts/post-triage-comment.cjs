/**
 * Posts a triage comment on a GitHub issue
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - GitHub Actions context
 * @param {Object} params.core - GitHub Actions core utilities
 * @param {string} params.promptTemplate - The prompt template to use
 */
module.exports = async ({ github, context, core, promptTemplate }) => {
  const body = context.payload.issue.body;
  const urlMatch = body.match(/https:\/\/github\.com\/[^\s\)]+/);

  if (!urlMatch) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: No GitHub repository URL found in the issue body. Please edit the issue and include a valid GitHub URL.`,
    });
    core.setFailed('No GitHub repository URL found in issue body');
    return;
  }

  const repoUrl = urlMatch[0];

  // Load and populate the prompt template
  const commentBody = promptTemplate.replace(/\{\{REPO_URL\}\}/g, repoUrl);

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentBody,
  });
};
