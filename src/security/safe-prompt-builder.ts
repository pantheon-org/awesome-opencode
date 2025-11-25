/**
 * Safe prompt builder utility for AI agent interactions
 *
 * Provides structured prompt construction with clear separation
 * between system instructions and user-provided content.
 *
 * Uses XML-style tags for content separation (recommended by Anthropic)
 * and includes anti-injection safeguards.
 */

import {
  sanitizeGitHubUrl,
  sanitizeRepoName,
  sanitizeFilePath,
  sanitizeTextContent,
  sanitizeJsonData,
  detectInjectionAttempt,
} from './sanitize-ai-input';

/**
 * Template replacement options
 */
interface TemplateOptions {
  /** Enforce sanitization even if disabled globally */
  forceSanitize?: boolean;
  /** Log injection attempts */
  logInjections?: boolean;
  /** Maximum content length */
  maxLength?: number;
}

/**
 * User content section with metadata
 */
interface UserContent {
  /** Content label (e.g., "Repository URL", "Issue Body") */
  label: string;
  /** Actual content */
  content: string;
  /** Whether this content is trusted (internal data) */
  trusted?: boolean;
}

/**
 * Safe prompt builder class
 *
 * Constructs prompts with proper security boundaries and sanitization.
 *
 * @example
 * const builder = new SafePromptBuilder();
 * const prompt = builder
 *   .setSystemInstruction('Analyze the repository')
 *   .addUserContent('Repository URL', repoUrl)
 *   .addUserContent('Issue Body', issueBody)
 *   .build();
 */
export class SafePromptBuilder {
  private systemInstructions: string[] = [];
  private userContents: UserContent[] = [];
  private reinforcement: string = '';
  private detectedInjections: string[] = [];

  /**
   * Set the main system instruction
   *
   * @param instruction - System instruction text
   * @returns Builder instance for chaining
   */
  setSystemInstruction(instruction: string): this {
    this.systemInstructions.push(instruction.trim());
    return this;
  }

  /**
   * Add additional system instruction
   *
   * @param instruction - Additional instruction text
   * @returns Builder instance for chaining
   */
  addSystemInstruction(instruction: string): this {
    this.systemInstructions.push(instruction.trim());
    return this;
  }

  /**
   * Add user-provided content with automatic sanitization
   *
   * @param label - Descriptive label for the content
   * @param content - User content to add
   * @param options - Content options
   * @returns Builder instance for chaining
   */
  addUserContent(label: string, content: string, options: { trusted?: boolean } = {}): this {
    // Detect injection attempts for logging
    if (!options.trusted && detectInjectionAttempt(content)) {
      this.detectedInjections.push(`Detected injection attempt in "${label}"`);
    }

    // Sanitize unless explicitly trusted
    const sanitized = options.trusted ? content : sanitizeTextContent(content);

    this.userContents.push({
      label,
      content: sanitized,
      trusted: options.trusted ?? false,
    });

    return this;
  }

  /**
   * Add a GitHub repository URL with validation
   *
   * @param url - GitHub repository URL
   * @returns Builder instance for chaining
   * @throws Error if URL is invalid
   */
  addGitHubUrl(url: string): this {
    const sanitized = sanitizeGitHubUrl(url);

    if (!sanitized) {
      throw new Error(`Invalid GitHub URL: ${url}`);
    }

    this.userContents.push({
      label: 'Repository URL',
      content: sanitized,
      trusted: false, // URLs are never fully trusted
    });

    return this;
  }

  /**
   * Add a repository name with validation
   *
   * @param repoName - Repository name
   * @returns Builder instance for chaining
   * @throws Error if repo name is invalid
   */
  addRepoName(repoName: string): this {
    const sanitized = sanitizeRepoName(repoName);

    if (!sanitized) {
      throw new Error(`Invalid repository name: ${repoName}`);
    }

    this.userContents.push({
      label: 'Repository Name',
      content: sanitized,
      trusted: false,
    });

    return this;
  }

  /**
   * Add a file path with validation
   *
   * @param filePath - File path
   * @param allowedPrefix - Required path prefix
   * @returns Builder instance for chaining
   * @throws Error if path is invalid
   */
  addFilePath(filePath: string, allowedPrefix: string): this {
    const sanitized = sanitizeFilePath(filePath, allowedPrefix);

    if (!sanitized) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    this.userContents.push({
      label: 'File Path',
      content: sanitized,
      trusted: false,
    });

    return this;
  }

  /**
   * Add structured data (categories, themes, etc.)
   *
   * @param label - Data label
   * @param data - JSON data
   * @returns Builder instance for chaining
   */
  addStructuredData<T extends Record<string, unknown>>(label: string, data: T): this {
    const sanitized = sanitizeJsonData(data);

    this.userContents.push({
      label,
      content: JSON.stringify(sanitized, null, 2),
      trusted: false,
    });

    return this;
  }

  /**
   * Set instruction reinforcement (added at end of prompt)
   *
   * Helps prevent injection by restating key instructions after user content.
   *
   * @param reinforcement - Reinforcement text
   * @returns Builder instance for chaining
   */
  setReinforcement(reinforcement: string): this {
    this.reinforcement = reinforcement.trim();
    return this;
  }

  /**
   * Build the final prompt with security boundaries
   *
   * Constructs a prompt with clear XML-style separation between
   * system instructions and user content.
   *
   * @returns Completed prompt string
   */
  build(): string {
    const sections: string[] = [];

    // System instructions section
    if (this.systemInstructions.length > 0) {
      sections.push('<system_instruction>');
      sections.push(this.systemInstructions.join('\n\n'));
      sections.push('</system_instruction>');
      sections.push('');
    }

    // User content sections (each wrapped separately)
    if (this.userContents.length > 0) {
      for (const content of this.userContents) {
        sections.push('<user_input>');
        sections.push(`<label>${content.label}</label>`);
        sections.push(`<content>`);
        sections.push(content.content);
        sections.push('</content>');
        if (!content.trusted) {
          sections.push('<!-- WARNING: Untrusted user input above -->');
        }
        sections.push('</user_input>');
        sections.push('');
      }
    }

    // Reinforcement section (after user content)
    if (this.reinforcement) {
      sections.push('<instruction_reinforcement>');
      sections.push(this.reinforcement);
      sections.push('</instruction_reinforcement>');
    }

    return sections.join('\n');
  }

  /**
   * Get detected injection attempts
   *
   * Returns array of detected injection attempts for logging.
   *
   * @returns Array of detection messages
   */
  getDetectedInjections(): string[] {
    return [...this.detectedInjections];
  }

  /**
   * Check if any injections were detected
   *
   * @returns True if injections detected
   */
  hasDetectedInjections(): boolean {
    return this.detectedInjections.length > 0;
  }

  /**
   * Reset the builder to initial state
   */
  reset(): this {
    this.systemInstructions = [];
    this.userContents = [];
    this.reinforcement = '';
    this.detectedInjections = [];
    return this;
  }
}

/**
 * Helper function: Build a safe template replacement map
 *
 * Creates a sanitized map of template variables for safe string replacement.
 * Use this when working with existing template systems.
 *
 * @param variables - Map of variable names to values
 * @param options - Replacement options
 * @returns Sanitized variable map
 *
 * @example
 * const safeVars = buildSafeReplacements({
 *   REPO_URL: repoUrl,
 *   REPO_NAME: repoName,
 *   ISSUE_NUMBER: String(issueNumber)
 * });
 *
 * let prompt = template;
 * for (const [key, value] of Object.entries(safeVars)) {
 *   prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
 * }
 */
export function buildSafeReplacements(
  variables: Record<string, string>,
  options: TemplateOptions = {},
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    // Detect injections
    if (options.logInjections && detectInjectionAttempt(value)) {
      console.warn(`[Security] Injection attempt detected in variable "${key}"`);
    }

    // Apply appropriate sanitization based on variable type
    if (key.includes('URL') || key.includes('REPO_URL')) {
      const clean = sanitizeGitHubUrl(value);
      sanitized[key] = clean ?? '[invalid URL]';
    } else if (key.includes('REPO_NAME') || key.includes('NAME')) {
      const clean = sanitizeRepoName(value);
      sanitized[key] = clean ?? '[invalid name]';
    } else if (key.includes('FILE') || key.includes('PATH')) {
      // File paths need a prefix, so just do basic sanitization
      sanitized[key] = sanitizeTextContent(value, {
        maxLength: 200,
        stripNewlines: true,
      });
    } else if (key.includes('NUMBER') || key.includes('ISSUE')) {
      // Numbers should be numeric only
      const numOnly = value.replace(/[^0-9]/g, '');
      sanitized[key] = numOnly || '0';
    } else {
      // General text content
      sanitized[key] = sanitizeTextContent(value, {
        maxLength: options.maxLength ?? 10000,
      });
    }
  }

  return sanitized;
}

/**
 * Helper function: Replace template variables safely
 *
 * Performs template variable replacement with automatic sanitization.
 *
 * @param template - Template string with {{VARIABLE}} placeholders
 * @param variables - Variable values
 * @param options - Replacement options
 * @returns Template with sanitized replacements
 *
 * @example
 * const prompt = safeTemplateReplace(
 *   'Analyze {{REPO_URL}} for issue {{ISSUE_NUMBER}}',
 *   { REPO_URL: repoUrl, ISSUE_NUMBER: String(issueNumber) }
 * );
 */
export function safeTemplateReplace(
  template: string,
  variables: Record<string, string>,
  options: TemplateOptions = {},
): string {
  const safeVars = buildSafeReplacements(variables, options);

  let result = template;

  for (const [key, value] of Object.entries(safeVars)) {
    // Use XML-style wrapper for injected content
    const wrappedValue = `<user_input label="${key}">${value}</user_input>`;
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), wrappedValue);
  }

  return result;
}

/**
 * Create a safe prompt from a template file
 *
 * Loads a prompt template and safely injects variables.
 * This is the recommended way to work with prompt templates.
 *
 * @param template - Template content
 * @param variables - Variables to inject
 * @param options - Options
 * @returns Safe prompt with injected variables
 *
 * @example
 * const prompt = createSafePrompt(
 *   promptTemplate,
 *   { REPO_URL: repoUrl, CATEGORIES_PROMPT: categories },
 *   { logInjections: true }
 * );
 */
export function createSafePrompt(
  template: string,
  variables: Record<string, string>,
  options: TemplateOptions = {},
): string {
  return safeTemplateReplace(template, variables, options);
}
