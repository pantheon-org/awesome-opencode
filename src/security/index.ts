/**
 * Security module exports for prompt injection prevention
 */

// Input sanitization exports
export {
  sanitizeGitHubUrl,
  sanitizeRepoName,
  sanitizeFilePath,
  sanitizeTextContent,
  sanitizeJsonData,
  extractIssueNumber,
  detectInjectionAttempt,
} from './sanitize-ai-input';

// Prompt builder exports
export {
  SafePromptBuilder,
  buildSafeReplacements,
  safeTemplateReplace,
  createSafePrompt,
} from './safe-prompt-builder';
