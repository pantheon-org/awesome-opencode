/**
 * Posts a categorization comment on a GitHub issue
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - GitHub Actions context
 * @param {string} params.categoriesPrompt - Formatted categories string
 * @param {string} params.themesPrompt - Formatted themes string
 * @param {string} params.promptTemplate - The prompt template to use
 */
module.exports = async ({ github, context, categoriesPrompt, themesPrompt, promptTemplate }) => {
  const body = context.payload.issue.body;
  const urlMatch = body.match(/https:\/\/github\.com\/[^\s\)]+/);

  if (!urlMatch) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: No GitHub repository URL found. Cannot proceed with categorization.`,
    });
    return;
  }

  const repoUrl = urlMatch[0];
  const repoPath = repoUrl.replace('https://github.com/', '');
  const repoName = repoPath.split('/').pop();
  const currentDate = new Date().toISOString().split('T')[0];

  // Load and populate the prompt template
  const commentBody = promptTemplate
    .replace(/\{\{REPO_URL\}\}/g, repoUrl)
    .replace(/\{\{CATEGORIES_PROMPT\}\}/g, categoriesPrompt)
    .replace(/\{\{THEMES_PROMPT\}\}/g, themesPrompt)
    .replace(/\{\{ISSUE_NUMBER\}\}/g, context.issue.number)
    .replace(/\{\{REPO_NAME\}\}/g, repoName)
    .replace(/\{\{CURRENT_DATE\}\}/g, currentDate);

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentBody,
  });
};
