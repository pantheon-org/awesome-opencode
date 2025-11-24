# Setup Guide

This guide explains how to set up the Awesome OpenCode repository with automated workflows.

## Prerequisites

- GitHub repository with Actions enabled
- Anthropic API key (for Claude)
- OpenCode GitHub App installed

## Configuration

### 1. Install OpenCode GitHub App

1. Visit [github.com/apps/opencode-agent](https://github.com/apps/opencode-agent)
2. Click **Install**
3. Select the repository you want to enable
4. Grant the required permissions

Alternatively, run this command in your repository:

```bash
opencode github install
```

### 2. Set up Anthropic API Key

1. Get an API key from [console.anthropic.com](https://console.anthropic.com/)
2. Go to your repository **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your Anthropic API key
6. Click **Add secret**

### 3. Enable GitHub Actions

Ensure GitHub Actions is enabled for your repository:

1. Go to repository **Settings** → **Actions** → **General**
2. Under **Actions permissions**, select **Allow all actions and reusable workflows**
3. Under **Workflow permissions**, select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 4. Configure Branch Protection (Optional but Recommended)

For the `main` branch:

1. Go to **Settings** → **Branches**
2. Add a branch protection rule for `main`
3. Configure as needed (e.g., require reviews, status checks)

## Workflow Overview

### Main OpenCode Workflow

**File:** `.github/workflows/opencode.yml`

**Trigger:** When a comment contains `/opencode` or `/oc`

**Purpose:** Runs OpenCode agent to handle tasks via comments in issues and PRs

### Workflow 1: Triage Tool Submission

**File:** `.github/workflows/triage-submission.yml`

**Trigger:** When an issue is opened with the `submission` label

**Process:**

1. Extracts the GitHub repository URL from the issue
2. Posts a `/opencode` comment with instructions to:
   - Analyze if the tool is relevant
   - Add appropriate labels (`in-review` or `rejected`)
   - Close the issue if rejected
   - Post a summary comment

### Workflow 2: Categorize and Document Tool

**File:** `.github/workflows/categorize-tool.yml`

**Trigger:** When an issue is labeled with `in-review`

**Process:**

1. Posts a `/opencode` comment with instructions to:
   - Categorize the tool
   - Create comprehensive documentation
   - Create a new branch and file in `docs/<category>/`
   - Open a PR with the documentation
   - Update labels and post confirmation

### Workflow 3: Validate and Merge PR

**File:** `.github/workflows/validate-and-merge.yml`

**Trigger:** When a PR is opened with the `automated` label

**Process:**

1. Posts a `/opencode` comment with instructions to:
   - Validate markdown documentation
   - Update README.md with the new tool entry
   - Merge the PR if valid
   - Close the related issue
   - Post success comment

## Usage

### Submitting a Tool

1. Go to **Issues** → **New issue**
2. Select **Submit a Tool**
3. Fill in the GitHub repository URL
4. Add any additional context
5. Submit the issue

The automation will:

- Triage the submission (within minutes)
- If approved, categorize and document it (within minutes)
- Create a PR with the documentation
- Validate and merge the PR automatically
- Close the issue

### Manual Review

If you need to manually review:

1. Remove the `automated` label from the PR
2. Review the changes
3. Merge manually when ready

## Troubleshooting

### Issue: Workflow not triggering

**Solution:** Check that:

- GitHub Actions is enabled
- Workflow files are in the `main` branch
- Issue has the correct labels

### Issue: OpenCode not responding

**Solution:** Verify:

- OpenCode GitHub App is installed on the repository
- `ANTHROPIC_API_KEY` secret is set correctly
- API key is valid and has sufficient quota
- Check workflow logs in Actions tab for specific error messages
- Ensure the comment includes `/opencode` or `/oc`

### Issue: PR auto-merge fails

**Solution:**

- Check that branch protection rules allow auto-merge
- Ensure workflow has write permissions
- Review validation errors in workflow logs

## Customization

### Adding New Categories

1. Edit `README.md` to add the new category section
2. Update `.github/workflows/categorize-tool.yml` to include the new category in the prompt
3. Create the category directory: `mkdir -p docs/new-category`

### Modifying Triage Criteria

Edit the `/opencode` comment in `.github/workflows/triage-submission.yml` to adjust what tools are considered relevant.

### Customizing Documentation Format

Modify the `/opencode` comment template in `.github/workflows/categorize-tool.yml` to change the documentation structure.

### Changing the AI Model

Edit `.github/workflows/opencode.yml` to change the model:

```yaml
with:
  model: anthropic/claude-sonnet-4-20250514 # Change this line
```

Available models: See [OpenCode Providers documentation](https://opencode.ai/docs/providers/)

## Maintenance

### Regular Tasks

- Monitor rejected submissions for false negatives
- Review and improve OpenCode prompts based on results
- Update categories as the ecosystem evolves
- Check API usage and quotas

### Monitoring

Check the **Actions** tab regularly to:

- Review workflow runs
- Identify any failures
- Monitor processing times
- Adjust quotas if needed

## Support

For issues with:

- **GitHub Actions**: Check [GitHub Actions documentation](https://docs.github.com/actions)
- **OpenCode**: Visit [OpenCode documentation](https://opencode.ai/docs)
- **This repository**: Open an issue with the `question` label
