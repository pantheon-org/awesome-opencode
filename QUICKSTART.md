# Quick Start Guide

## For Repository Maintainers

### Initial Setup (5-10 minutes)

1. **Configure GitHub Repository**
   ```bash
   # Clone the repository
   git clone https://github.com/pantheon-org/awesome-opencode.git
   cd awesome-opencode
   
   # Push to your GitHub repository
   git remote set-url origin https://github.com/your-username/awesome-opencode.git
   git push -u origin main
   ```

2. **Install OpenCode GitHub App**
   - Visit [github.com/apps/opencode-agent](https://github.com/apps/opencode-agent)
   - Click **Install**
   - Select your repository
   - Grant required permissions
   
   OR use CLI:
   ```bash
   opencode github install
   ```

3. **Get Anthropic API Key**
   - Sign up at [console.anthropic.com](https://console.anthropic.com/)
   - Create an API key

4. **Add Secret**
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
   - Click **Add secret**

5. **Enable Actions Permissions**
   - Go to **Settings** → **Actions** → **General**
   - Select **Read and write permissions**
   - Check **Allow GitHub Actions to create and approve pull requests**
   - Click **Save**

6. **Test the System**
   - Create a test issue using the "Submit a Tool" template
   - Use a known AI coding tool (e.g., `https://github.com/getcursor/cursor`)
   - Watch the automation work!

### Done!

Your automated curation system is now live. Any tool submissions will be automatically triaged, documented, and merged.

---

## For Contributors

### How to Submit a Tool

1. **Go to Issues**
   - Navigate to the repository
   - Click **Issues** tab
   - Click **New issue**

2. **Select Template**
   - Choose **Submit a Tool**

3. **Fill in Details**
   - **GitHub Repository URL**: Paste the full URL (e.g., `https://github.com/username/repo`)
   - **Additional Information**: (Optional) Add context about why this tool is relevant
   - Check all confirmation boxes

4. **Submit**
   - Click **Submit new issue**

5. **Wait for Automation**
   - Within minutes, you'll receive a response
   - If approved, a PR will be created automatically
   - The tool will be added to the list

### What Happens Next?

**If Approved:**
- Issue labeled `in-review`
- Tool gets categorized
- Documentation created
- PR opened
- README updated
- PR merged automatically
- Issue closed with success message

**If Rejected:**
- Issue labeled `rejected`
- Explanation provided
- Issue closed
- You can provide more context if you think it's an error

---

## Monitoring Your Submission

### Check Status

1. **View Your Issue**
   - Look at the labels: `needs-triage`, `in-review`, `accepted`, or `rejected`

2. **Check Comments**
   - Automation posts updates as comments
   - Explanations provided for decisions

3. **Follow the PR**
   - If accepted, a PR link is posted
   - You can watch the PR progress

### Timeline

- **Triage**: < 1 minute
- **Categorization**: < 2 minutes
- **PR Creation**: < 1 minute
- **Validation**: < 1 minute
- **Merge**: Immediate after validation
- **Total**: ~5 minutes

---

## Examples

### Good Submission
```
Repository URL: https://github.com/features/copilot
Additional Info: GitHub's AI pair programmer, directly competitive with OpenCode
```

**Result:** Approved → Categorized as "AI Coding Assistants" → Merged

### Marginal Submission
```
Repository URL: https://github.com/prettier/prettier
Additional Info: Code formatter used by developers
```

**Result:** May be rejected (not AI-powered or directly related)

### Bad Submission
```
Repository URL: https://github.com/user/personal-notes
Additional Info: My notes about coding
```

**Result:** Rejected (not a tool, not relevant)

---

## FAQ

### How do I know if my tool will be accepted?

Tools should be:
- Related to AI-powered coding assistance
- OR overlap significantly with AI coding tools
- OR use AI to enhance developer productivity

### Can I appeal a rejection?

Yes! Add a comment to the closed issue with additional context explaining why the tool is relevant. A maintainer can manually review.

### How long does it take?

The entire process is automated and typically completes within 5 minutes.

### What if there's an error?

Check the Actions tab for workflow logs. If you see an error, open an issue with the `bug` label.

### Can I submit multiple tools?

Yes! Create a separate issue for each tool.

### What if the tool is already listed?

The system will process it, but during PR review, duplicate detection will prevent it from being added twice.

---

## Troubleshooting

### My issue hasn't been triaged

**Wait time:** Usually < 1 minute
**Check:**
- Does the issue have the `submission` label?
- Is GitHub Actions enabled?
- Check the Actions tab for errors

### The PR wasn't created

**Possible reasons:**
- Tool was rejected during triage
- Check issue comments for explanation
- Workflow may have encountered an error (check Actions tab)

### Need Help?

Open an issue with:
- **Label:** `question` or `bug`
- **Title:** Brief description of your problem
- **Body:** 
  - What you were trying to do
  - What happened
  - Any error messages
  - Link to related issue/PR if applicable

---

## Next Steps

### After Setup
1. Test with a known tool
2. Invite contributors
3. Share the repository
4. Monitor submissions

### Growing Your List
1. Share on social media
2. Add to awesome-lists
3. Engage with the community
4. Keep the list updated

### Maintenance
- Check weekly for issues
- Review rejections monthly
- Update categories as needed
- Monitor API usage

---

**Ready to start? Head to the [Issues](../../issues/new/choose) page and submit your first tool!**
