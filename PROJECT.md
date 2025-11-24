# Project Overview

## Awesome OpenCode - Automated Curation System

This repository implements a fully automated workflow for curating and maintaining a list of tools related to OpenCode
and similar AI-powered coding assistants.

## Architecture

### Workflow Pipeline

```
Issue Created → Triage → Categorize → Document → Validate → Merge → Close
     ↓            ↓          ↓           ↓          ↓         ↓       ↓
  Template    OpenCode   OpenCode    Create PR   Update   Auto-   Close
  Validation  Analysis   Analysis              README.md  Merge   Issue
```

### Components

#### 1. Issue Template

- **Location:** `.github/ISSUE_TEMPLATE/submit-tool.yml`
- **Purpose:** Standardized form for tool submissions
- **Fields:** Repository URL, additional info, validation checkboxes

#### 2. Workflow 1: Triage (`triage-submission.yml`)

- **Trigger:** Issue opened with `submission` label
- **Process:**
  1. Extract GitHub URL from issue
  2. Use OpenCode to analyze relevance
  3. Label as `in-review` or `rejected`
  4. Post decision comment

#### 3. Workflow 2: Categorization (`categorize-tool.yml`)

- **Trigger:** Issue labeled with `in-review`
- **Process:**
  1. Analyze repository with OpenCode
  2. Determine category and generate documentation
  3. Create markdown file in `docs/<category>/`
  4. Open PR with changes
  5. Label issue as `accepted`

#### 4. Workflow 3: Validation and Merge (`validate-and-merge.yml`)

- **Trigger:** PR opened with `automated` label
- **Process:**
  1. Validate markdown format
  2. Update README.md with new entry
  3. Commit changes
  4. Auto-merge PR
  5. Close related issue

## Directory Structure

```
awesome-opencode/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── submit-tool.yml          # Issue template for submissions
│   └── workflows/
│       ├── triage-submission.yml     # Workflow 1: Triage
│       ├── categorize-tool.yml       # Workflow 2: Categorize
│       └── validate-and-merge.yml    # Workflow 3: Validate & Merge
├── docs/
│   ├── ai-coding-assistants/         # Category: AI assistants
│   ├── code-analysis-quality/        # Category: Code quality tools
│   ├── development-automation/       # Category: Dev automation
│   ├── documentation-tools/          # Category: Documentation
│   ├── testing-tools/                # Category: Testing
│   ├── ide-extensions/               # Category: IDE extensions
│   └── README.md                     # Docs directory info
├── .gitignore                        # Git ignore rules
├── LICENSE                           # CC0 License
├── README.md                         # Main project readme
└── SETUP.md                          # Setup and configuration guide
```

## Categories

1. **AI Coding Assistants** - AI-powered code completion and generation
2. **Code Analysis & Quality** - Code quality and issue detection
3. **Development Automation** - Workflow automation tools
4. **Documentation Tools** - Code documentation generators
5. **Testing Tools** - Automated testing and QA
6. **IDE Extensions** - Editor extensions and plugins

## Key Features

### Automated Triage

- AI-powered relevance detection
- Automatic labeling and routing
- Rejection with explanation

### Smart Categorization

- AI analyzes repository content
- Determines best-fit category
- Generates comprehensive documentation

### Auto-Documentation

- Markdown files in structured format
- Consistent formatting across all tools
- Timestamped entries

### Intelligent README Updates

- AI inserts entries alphabetically
- Maintains consistent formatting
- Automatic category placement

### Full Automation

- No manual intervention needed
- From submission to merge in minutes
- Automatic issue closure

## Requirements

### GitHub Repository Setup

1. GitHub Actions enabled
2. Workflow permissions set to read/write
3. Allow Actions to create PRs

### Secrets Configuration

- `OPENCODE_API_KEY` - Required for AI analysis

### Optional: Branch Protection

- Protect `main` branch
- Require status checks
- Enable auto-merge

## Usage Flow

### For Contributors

1. Click "New Issue"
2. Select "Submit a Tool"
3. Paste GitHub URL
4. Submit

### Automation Handles

1. Validates submission (< 1 min)
2. If approved, categorizes (< 2 min)
3. Creates PR with docs (< 1 min)
4. Validates and merges (< 1 min)
5. Closes issue (immediate)

**Total time:** ~5 minutes from submission to merge

## Monitoring

### Success Metrics

- Submission acceptance rate
- Time from issue to merge
- False positive/negative rate
- Documentation quality

### Health Checks

- Monitor workflow runs in Actions tab
- Review rejected submissions monthly
- Update prompts based on patterns
- Check API quota usage

## Customization Points

### Triage Criteria

Edit prompt in `triage-submission.yml` to adjust relevance criteria

### Categories

1. Add category to README.md
2. Update `categorize-tool.yml` prompt
3. Create directory: `docs/new-category/`

### Documentation Format

Modify template in `categorize-tool.yml` "Create tool documentation" step

### Validation Rules

Adjust checks in `validate-and-merge.yml` "Validate markdown format" step

## Maintenance Tasks

### Weekly

- Review workflow runs for errors
- Check rejected submissions

### Monthly

- Analyze acceptance patterns
- Update triage prompts if needed
- Review API usage

### Quarterly

- Audit documentation quality
- Update categories if needed
- Review and improve workflows

## Troubleshooting

### Common Issues

**Workflow not triggering**

- Check Actions are enabled
- Verify workflow files are in main
- Confirm labels are correct

**API errors**

- Verify OPENCODE_API_KEY is set
- Check API quota
- Review error logs

**Merge failures**

- Check branch protection settings
- Verify workflow permissions
- Review validation logs

## Future Enhancements

### Potential Additions

- Star count tracking
- Last updated monitoring
- Popularity metrics
- Tool comparison features
- Search functionality
- RSS feed for new additions
- Email notifications
- Duplicate detection

### Advanced Features

- Multi-language support
- Tool health checks
- Automated updates on tool changes
- Community voting system
- Featured tools section

## Contributing to Workflows

When modifying workflows:

1. Test in a fork first
2. Use small test cases
3. Monitor API usage
4. Document changes
5. Update SETUP.md if needed

## Links

- [OpenCode Documentation](https://opencode.ai/docs)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## Support

- **Issues:** Use GitHub Issues
- **Questions:** Tag with `question` label
- **Bugs:** Tag with `bug` label
- **Enhancements:** Tag with `enhancement` label
