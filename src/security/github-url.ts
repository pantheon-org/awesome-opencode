/**
 * GitHub URL Sanitization & Validation Module
 *
 * Provides comprehensive validation and sanitization of GitHub URLs
 * extracted from user input in workflows.
 *
 * Security considerations:
 * - Validates against strict GitHub URL pattern
 * - Detects and rejects URL encoding bypass attempts
 * - Handles various GitHub URL formats
 * - Prevents path traversal and injection attacks
 */

/**
 * Result of GitHub URL validation
 */
export interface GitHubUrlValidationResult {
  /** Whether the URL is valid */
  isValid: boolean;
  /** The validated/sanitized URL, or null if invalid */
  url: string | null;
  /** Reason for validation failure (if invalid) */
  reason?: string;
}

// Patterns for GitHub URLs - kept for documentation purposes
// Supports: Basic repo URLs, URLs with paths, query params, and fragments

/**
 * Sanitize a GitHub URL to prevent injection attacks
 *
 * Validates and normalizes GitHub URLs extracted from user input.
 * Rejects URLs with:
 * - Encoding bypass attempts
 * - Invalid domains
 * - Malformed repository paths
 * - Suspicious whitespace patterns
 *
 * @param url - Raw URL string from user input
 * @returns Validation result with sanitized URL or error reason
 *
 * @example
 * // Valid URL
 * sanitizeGitHubUrl('https://github.com/user/repo')
 * // { isValid: true, url: 'https://github.com/user/repo' }
 *
 * @example
 * // URL with whitespace (handled)
 * sanitizeGitHubUrl('https://github.com/user/repo\n\nIgnore above')
 * // { isValid: true, url: 'https://github.com/user/repo' }
 *
 * @example
 * // Invalid domain
 * sanitizeGitHubUrl('https://evil.com/github.com/user/repo')
 * // { isValid: false, url: null, reason: 'Invalid GitHub domain' }
 *
 * @example
 * // Encoding attack attempt
 * sanitizeGitHubUrl('https://github.com/user/repo%2F..%2F..%2Fetc%2Fpasswd')
 * // { isValid: false, url: null, reason: 'Suspicious URL encoding detected' }
 */
// eslint-disable-next-line complexity
export const sanitizeGitHubUrl = (url: unknown): GitHubUrlValidationResult => {
  // Type validation
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      url: null,
      reason: 'URL must be a non-empty string',
    };
  }

  // Trim and extract first token (before whitespace/newline)
  // This handles cases where URL is followed by instructions or explanations
  const cleaned = url.trim().split(/[\s\n\r]+/)[0];

  if (!cleaned) {
    return {
      isValid: false,
      url: null,
      reason: 'URL is empty after trimming',
    };
  }

  // Check for protocol first (more specific errors)
  if (!cleaned.startsWith('https://')) {
    return {
      isValid: false,
      url: null,
      reason: 'Only HTTPS GitHub URLs are allowed',
    };
  }

  // Check domain is exactly github.com (not a subdomain or similar domain)
  if (!cleaned.startsWith('https://github.com/')) {
    return {
      isValid: false,
      url: null,
      reason: 'Invalid GitHub domain',
    };
  }

  // Extract the part after domain for path validation
  const pathPart = cleaned.substring('https://github.com/'.length);

  // Basic structure check: must have owner/repo at minimum
  const pathSegments = pathPart.split('/');
  if (pathSegments.length < 2 || !pathSegments[0] || !pathSegments[1]) {
    return {
      isValid: false,
      url: null,
      reason: 'Invalid GitHub URL format - must include owner/repo',
    };
  }

  // Validate owner and repo names (basic alphanumeric, hyphens, underscores, dots)
  const owner = pathSegments[0];
  const repo = pathSegments[1];

  if (!/^[a-zA-Z0-9_-]+$/.test(owner)) {
    return {
      isValid: false,
      url: null,
      reason: 'Invalid GitHub owner name',
    };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(repo.split(/[?#]/)[0])) {
    // Remove query params and fragments before validating repo name
    return {
      isValid: false,
      url: null,
      reason: 'Invalid GitHub repo name',
    };
  }

  // Check for URL encoding attempts (especially path traversal)
  const hasEncoding = /%[0-9A-Fa-f]{2}/.test(cleaned);
  if (hasEncoding) {
    try {
      const decoded = decodeURIComponent(cleaned);
      // If decoding changes the URL, check if it's trying something malicious
      if (decoded !== cleaned) {
        // Look for path traversal patterns in decoded URL
        if (decoded.includes('..') || decoded.includes('//')) {
          return {
            isValid: false,
            url: null,
            reason: 'Suspicious URL encoding detected',
          };
        }
        // Recursively validate the decoded URL
        return sanitizeGitHubUrl(decoded);
      }
    } catch {
      return {
        isValid: false,
        url: null,
        reason: 'Invalid URL encoding detected',
      };
    }
  }

  return {
    isValid: true,
    url: cleaned,
  };
};

/**
 * Quick validation helper for GitHub URLs
 *
 * Simpler version of sanitizeGitHubUrl that just returns a boolean.
 * Use this when you only care if a URL is valid, not the reason why not.
 *
 * @param url - URL string to validate
 * @returns True if URL is valid, false otherwise
 *
 * @example
 * if (isValidGitHubUrl(userUrl)) {
 *   // Process valid URL
 * }
 */
export const isValidGitHubUrl = (url: string): boolean => {
  return sanitizeGitHubUrl(url).isValid;
};

/**
 * Extract repository information from a GitHub URL
 *
 * Returns the owner and repository name from a validated GitHub URL.
 * Does not validate the URL - assumes it's already validated with sanitizeGitHubUrl.
 *
 * @param url - Valid GitHub URL
 * @returns Object with owner and repo, or null if URL format is invalid
 *
 * @example
 * extractRepoInfo('https://github.com/pantheon-org/awesome-opencode')
 * // { owner: 'pantheon-org', repo: 'awesome-opencode' }
 *
 * @example
 * extractRepoInfo('https://github.com/pantheon-org/awesome-opencode/tree/main')
 * // { owner: 'pantheon-org', repo: 'awesome-opencode' }
 */
export const extractRepoInfo = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return null;
    }

    return {
      owner: pathParts[0],
      repo: pathParts[1],
    };
  } catch {
    return null;
  }
};

/**
 * Validate multiple GitHub URLs
 *
 * Validates an array of URLs and returns only the valid ones.
 * Useful for bulk validation scenarios.
 *
 * @param urls - Array of URL strings to validate
 * @returns Array of valid URLs (original strings, not sanitized)
 *
 * @example
 * const validUrls = filterValidGitHubUrls([
 *   'https://github.com/user/repo1',
 *   'invalid-url',
 *   'https://github.com/user/repo2'
 * ])
 * // ['https://github.com/user/repo1', 'https://github.com/user/repo2']
 */
export const filterValidGitHubUrls = (urls: string[]): string[] => {
  return urls.filter(isValidGitHubUrl);
};

/**
 * Extract all GitHub URLs from text
 *
 * Finds all potential GitHub URLs in a text string and validates them.
 * Returns both found URLs and validation results.
 *
 * @param text - Text to search for GitHub URLs
 * @returns Array of found URLs with their validation results
 *
 * @example
 * extractGitHubUrls('Check out https://github.com/user/repo and https://github.com/org/project')
 * // [
 * //   { url: 'https://github.com/user/repo', isValid: true },
 * //   { url: 'https://github.com/org/project', isValid: true }
 * // ]
 */
export const extractGitHubUrls = (
  text: string,
): Array<{ url: string; isValid: boolean; sanitized: string | null }> => {
  // Find all potential GitHub URLs in text
  const urlPattern = /https:\/\/github\.com\/[^\s\)>]+/g;
  const matches = text.match(urlPattern) || [];

  return matches.map((foundUrl) => {
    const result = sanitizeGitHubUrl(foundUrl);
    return {
      url: foundUrl,
      isValid: result.isValid,
      sanitized: result.url,
    };
  });
};
