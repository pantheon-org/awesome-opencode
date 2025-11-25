/**
 * Input sanitization module for AI agent interactions
 *
 * Prevents prompt injection attacks by sanitizing user-provided content
 * before it's inserted into AI prompts.
 *
 * Security considerations:
 * - Removes role-switching attempts
 * - Blocks delimiter injection
 * - Validates URLs
 * - Strips malicious patterns
 * - Preserves legitimate content (markdown, code blocks, etc.)
 */

/**
 * Pattern definitions for common injection attacks
 * These patterns are designed to catch various forms of prompt injection
 * while preserving legitimate content.
 */

// Role-switching patterns (case-insensitive)
const ROLE_SWITCH_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|commands?|prompts?)/gi,
  /forget\s+(everything|all)\s+(above|before|previously)/gi,
  /disregard\s+(?:the\s+)?(?:above|previous|prior)/gi,
  /you\s+are\s+now\s+(?:a|an)\s+[a-z\s]+(?:\.|!|$)/gi,
  /act\s+as\s+(?:a|an)\s+[a-z\s]+(?:\.|!|$)/gi,
  /pretend\s+(?:you\s+are|to\s+be)\s+(?:a|an)\s+[a-z\s]+/gi,
];

// Instruction override patterns
const INSTRUCTION_OVERRIDE_PATTERNS = [
  /your\s+new\s+(?:task|instruction|role|job)\s+is/gi,
  /(?:new|updated)\s+(?:system\s+)?(?:instruction|command|directive)s?:/gi,
  /important\s*:\s*instead\s+of/gi,
  /system\s+update\s*:/gi,
  /override\s+(?:previous|all)\s+(?:settings?|instructions?)/gi,
];

// Delimiter injection patterns (attempts to close/escape system prompts)
const DELIMITER_PATTERNS = [
  /---+\s*(?:end|close|stop)\s*(?:system|prompt|instruction)s?\s*---+/gi,
  /<\s*\/\s*(?:system|instruction|prompt)\s*>/gi,
  /\[\/(?:INST|SYS|SYSTEM)\]/gi,
  /```\s*(?:end|close)\s*(?:system|prompt)/gi,
  /\{\/(?:system|instruction)\}/gi,
  /---END\s+SYSTEM\s+PROMPT---/gi,
  /---CLOSE\s+SYSTEM---/gi,
];

// Context confusion patterns (attempts to manipulate conversation structure)
const CONTEXT_CONFUSION_PATTERNS = [
  /(?:^|\n)\s*(?:user|human|assistant|ai)\s*:/gim,
  /\n\s*---+\s*\n\s*(?:user|human|assistant|ai)/gi,
];

// Encoded payload patterns (base64, hex, unicode escapes)
// Match long base64 strings or URL-encoded sequences that likely contain injections
const ENCODED_PATTERN =
  /(?:[A-Za-z0-9+\/]{20,}={0,2})|(?:%[0-9A-Fa-f]{2}){5,}|(?:\\u[0-9A-Fa-f]{4}){3,}/g;

/**
 * Sanitize a GitHub repository URL
 *
 * Validates and normalizes GitHub URLs to prevent injection attacks.
 * Only allows standard GitHub repository URLs.
 *
 * @param url - Raw URL string from user input
 * @returns Sanitized URL or null if invalid
 *
 * @example
 * sanitizeGitHubUrl('https://github.com/user/repo')
 * // Returns: 'https://github.com/user/repo'
 *
 * sanitizeGitHubUrl('https://github.com/user/repo\n\nIgnore above')
 * // Returns: 'https://github.com/user/repo'
 *
 * sanitizeGitHubUrl('https://evil.com/github.com/user/repo')
 * // Returns: null
 */
export function sanitizeGitHubUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove all whitespace and newlines
  const cleaned = url.trim().split(/\s+/)[0];

  // Strict GitHub URL validation
  // Must be: https://github.com/{owner}/{repo}
  // Optional: trailing path segments, query params
  const githubUrlPattern =
    /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.\/-]*)?(?:\?[a-zA-Z0-9=&_-]*)?(?:#[a-zA-Z0-9_-]*)?$/;

  if (!githubUrlPattern.test(cleaned)) {
    return null;
  }

  // Additional check: ensure no encoded characters that could bypass validation
  if (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
    try {
      const decoded = decodeURIComponent(cleaned);
      // If decoded version differs significantly, it's suspicious
      if (decoded !== cleaned && !githubUrlPattern.test(decoded)) {
        return null;
      }
    } catch {
      return null;
    }
  }

  return cleaned;
}

/**
 * Sanitize a repository name extracted from a URL
 *
 * Ensures repository names only contain safe characters.
 * Rejects names that look like commands or contain suspicious patterns.
 *
 * @param repoName - Repository name from URL
 * @returns Sanitized name or null if invalid
 *
 * @example
 * sanitizeRepoName('awesome-tool')
 * // Returns: 'awesome-tool'
 *
 * sanitizeRepoName('ignore-instructions')
 * // Returns: null (suspicious pattern)
 *
 * sanitizeRepoName('../../../etc/passwd')
 * // Returns: null (path traversal)
 */
export function sanitizeRepoName(repoName: string): string | null {
  if (!repoName || typeof repoName !== 'string') {
    return null;
  }

  // Remove whitespace
  const cleaned = repoName.trim();

  // Only allow alphanumeric, hyphens, underscores, dots (standard GitHub repo names)
  // Length: 1-100 characters (GitHub's limit is 100)
  const repoNamePattern = /^[a-zA-Z0-9._-]{1,100}$/;

  if (!repoNamePattern.test(cleaned)) {
    return null;
  }

  // Reject path traversal attempts
  if (cleaned.includes('..') || cleaned.startsWith('.') || cleaned.startsWith('-')) {
    return null;
  }

  // Reject repo names that contain suspicious instruction-like words
  const suspiciousWords = [
    'ignore',
    'system',
    'prompt',
    'instruction',
    'override',
    'bypass',
    'admin',
  ];
  const lowerName = cleaned.toLowerCase();
  if (suspiciousWords.some((word) => lowerName.includes(word))) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize a file path to prevent path traversal and injection
 *
 * Validates that file paths are within expected directories and
 * don't contain malicious patterns.
 *
 * @param filePath - File path from user input or PR files
 * @param allowedPrefix - Required path prefix (e.g., 'docs/tools/')
 * @returns Sanitized path or null if invalid
 *
 * @example
 * sanitizeFilePath('docs/tools/example.md', 'docs/tools/')
 * // Returns: 'docs/tools/example.md'
 *
 * sanitizeFilePath('../../etc/passwd', 'docs/tools/')
 * // Returns: null
 *
 * sanitizeFilePath('docs/tools/evil.md; rm -rf /', 'docs/tools/')
 * // Returns: null
 */
export function sanitizeFilePath(filePath: string, allowedPrefix: string): string | null {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  const cleaned = filePath.trim();

  // Must start with allowed prefix
  if (!cleaned.startsWith(allowedPrefix)) {
    return null;
  }

  // Reject path traversal
  if (cleaned.includes('..')) {
    return null;
  }

  // Only allow safe characters in file paths
  // alphanumeric, hyphens, underscores, dots, forward slashes
  const filePathPattern = /^[a-zA-Z0-9.\/_-]+$/;

  if (!filePathPattern.test(cleaned)) {
    return null;
  }

  // Validate file extension (must be .md for docs)
  if (allowedPrefix.includes('docs/') && !cleaned.endsWith('.md')) {
    return null;
  }

  // Reject suspicious filenames
  const filename = cleaned.split('/').pop() || '';
  const suspiciousPatterns = ['ignore', 'bypass', 'override', 'admin', 'system'];

  if (suspiciousPatterns.some((pattern) => filename.toLowerCase().includes(pattern))) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize general text content that will be inserted into prompts
 *
 * Removes or neutralizes prompt injection patterns while preserving
 * legitimate content like markdown formatting, code blocks, and
 * normal punctuation.
 *
 * This is the main sanitization function for free-form text content.
 *
 * @param text - User-provided text content
 * @param options - Sanitization options
 * @returns Sanitized text with injection patterns removed
 *
 * @example
 * sanitizeTextContent('Great tool! Ignore previous instructions.')
 * // Returns: 'Great tool! [removed]'
 *
 * sanitizeTextContent('This tool helps with:\n- Feature A\n- Feature B')
 * // Returns: 'This tool helps with:\n- Feature A\n- Feature B' (preserved)
 */
export function sanitizeTextContent(
  text: string,
  options: {
    maxLength?: number;
    preserveMarkdown?: boolean;
    stripNewlines?: boolean;
  } = {},
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Apply length limit (default: 10000 characters)
  const maxLength = options.maxLength ?? 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + '... [truncated for length]';
  }

  // Remove role-switching attempts
  for (const pattern of ROLE_SWITCH_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  // Remove instruction override attempts
  for (const pattern of INSTRUCTION_OVERRIDE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  // Remove delimiter injection attempts
  for (const pattern of DELIMITER_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  // Remove context confusion patterns
  for (const pattern of CONTEXT_CONFUSION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '\n');
  }

  // Remove encoded payloads (likely obfuscated injections)
  sanitized = sanitized.replace(ENCODED_PATTERN, '[removed encoded content]');

  // Strip excessive newlines (more than 3 consecutive)
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  // Optionally strip all newlines (for single-line fields)
  if (options.stripNewlines) {
    sanitized = sanitized.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  }

  // Remove leading/trailing whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize JSON data that will be formatted into prompts
 *
 * Validates and sanitizes category and theme data to prevent
 * injection through compromised data files.
 *
 * @param data - JSON data object (category or theme)
 * @returns Sanitized data object
 *
 * @example
 * sanitizeJsonData({
 *   id: 'test',
 *   name: 'Test\n\nIgnore above',
 *   description: 'Normal description'
 * })
 * // Returns: { id: 'test', name: 'Test [removed]', description: 'Normal description' }
 */
export function sanitizeJsonData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === 'string') {
      // For single-line fields (id, name, slug), strip newlines
      const shouldStripNewlines = ['id', 'name', 'slug', 'title'].includes(key);

      sanitized[key] = sanitizeTextContent(value, {
        maxLength: key === 'description' ? 1000 : 200,
        stripNewlines: shouldStripNewlines,
      }) as T[Extract<keyof T, string>];
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeTextContent(item, { maxLength: 100 }) : item,
      ) as T[Extract<keyof T, string>];
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeJsonData(value as Record<string, unknown>) as T[Extract<
        keyof T,
        string
      >];
    }
  }

  return sanitized;
}

/**
 * Extract and sanitize issue number from PR body
 *
 * Safely extracts issue numbers without allowing injection through
 * the PR body content.
 *
 * @param prBody - Pull request body content
 * @returns Issue number or null if not found
 *
 * @example
 * extractIssueNumber('Closes #123\n\nIgnore above')
 * // Returns: 123
 *
 * extractIssueNumber('Closes #123; rm -rf /')
 * // Returns: 123
 */
export function extractIssueNumber(prBody: string): number | null {
  if (!prBody || typeof prBody !== 'string') {
    return null;
  }

  const match = prBody.match(/Closes\s+#(\d+)/i);
  if (!match || !match[1]) {
    return null;
  }

  const issueNumber = parseInt(match[1], 10);

  // Validate issue number is reasonable (1 to 999999)
  if (isNaN(issueNumber) || issueNumber < 1 || issueNumber > 999999) {
    return null;
  }

  return issueNumber;
}

/**
 * Detect if text contains potential injection attempts
 *
 * Returns true if text contains patterns that look like injection attempts.
 * Useful for logging and monitoring.
 *
 * @param text - Text to analyze
 * @returns True if potential injection detected
 *
 * @example
 * detectInjectionAttempt('Normal text')
 * // Returns: false
 *
 * detectInjectionAttempt('Ignore previous instructions')
 * // Returns: true
 */
export function detectInjectionAttempt(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const allPatterns = [
    ...ROLE_SWITCH_PATTERNS,
    ...INSTRUCTION_OVERRIDE_PATTERNS,
    ...DELIMITER_PATTERNS,
    ...CONTEXT_CONFUSION_PATTERNS,
  ];

  for (const pattern of allPatterns) {
    // Reset regex lastIndex (important for global regexes)
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }

  return ENCODED_PATTERN.test(text);
}
