#!/usr/bin/env bun

/**
 * Security Report Generator CLI
 *
 * Generates comprehensive security reports from injection attempt logs.
 * Can be run manually or scheduled via GitHub Actions.
 *
 * Usage:
 *   bun run src/bin/generate-security-report.ts [--days=7] [--output=report.md]
 */

import { readInjectionAttempts, countAttemptsByPattern } from '../security/track-injections';
import { getTrackedEntities, getRateLimitStatus } from '../security/rate-limit';
import type { SecurityReportStats } from '../security/types';

/**
 * Parse command line arguments
 */
function parseArgs(): { days: number; output: string | null } {
  const args = process.argv.slice(2);
  let days = 7; // Default to last 7 days
  let output: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--days=')) {
      days = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--output=')) {
      output = arg.split('=')[1];
    }
  }

  return { days, output };
}

/**
 * Generate security report statistics
 */
function generateReportStats(days: number): SecurityReportStats {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Read all injection attempts in time range
  const attempts = readInjectionAttempts(startDate, endDate);

  // Calculate statistics
  const totalAttempts = attempts.length;
  const uniqueUsers = new Set(attempts.map((a) => a.user));
  const blockedUsers = getTrackedEntities('user').filter((user) => {
    const status = getRateLimitStatus(user, 'user');
    return status && status.attempts >= 5; // Blocked if >= 5 attempts
  });

  // Pattern breakdown
  const patternCounts = countAttemptsByPattern(startDate, endDate);
  const patternBreakdown = Array.from(patternCounts.entries()).map(([pattern, count]) => ({
    pattern,
    count,
    percentage: Math.round((count / totalAttempts) * 100),
  }));

  // Sort by count descending
  patternBreakdown.sort((a, b) => b.count - a.count);

  // User activity
  const userAttempts = new Map<string, number>();
  for (const attempt of attempts) {
    userAttempts.set(attempt.user, (userAttempts.get(attempt.user) ?? 0) + 1);
  }

  const userActivity = Array.from(userAttempts.entries()).map(([user, attemptCount]) => {
    const status = getRateLimitStatus(user, 'user');
    let activityStatus: 'active' | 'warned' | 'blocked' | 'cleared' = 'active';

    if (status) {
      if (status.attempts >= 5) {
        activityStatus = 'blocked';
      } else if (status.attempts >= 3) {
        activityStatus = 'warned';
      }
    }

    return {
      user,
      attempts: attemptCount,
      status: activityStatus,
    };
  });

  // Sort by attempts descending
  userActivity.sort((a, b) => b.attempts - a.attempts);

  return {
    totalAttempts,
    uniqueUsers: uniqueUsers.size,
    blockedUsers: blockedUsers.length,
    falsePositives: 0, // TODO: Track false positives in future
    patternBreakdown,
    userActivity,
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

/**
 * Format report header
 */
const formatHeader = (stats: SecurityReportStats, days: number): string => {
  const date = new Date().toISOString().split('T')[0];
  const startDate = new Date(stats.timeRange.start).toISOString().split('T')[0];
  const endDate = new Date(stats.timeRange.end).toISOString().split('T')[0];

  return `# Security Report - ${date}\n\n**Report Period:** ${startDate} to ${endDate} (${days} days)\n\n---\n\n`;
};

/**
 * Format summary section
 */
const formatSummary = (stats: SecurityReportStats): string => {
  let markdown = `## Summary\n\n`;
  markdown += `- **Total injection attempts:** ${stats.totalAttempts}\n`;
  markdown += `- **Unique users:** ${stats.uniqueUsers}\n`;
  markdown += `- **Users blocked:** ${stats.blockedUsers}\n`;
  markdown += `- **False positives:** ${stats.falsePositives}\n\n`;

  if (stats.totalAttempts === 0) {
    markdown += `✅ **No injection attempts detected in this period.**\n\n`;
  }

  return markdown;
};

/**
 * Format pattern breakdown section
 */
const formatPatternBreakdown = (stats: SecurityReportStats): string => {
  let markdown = `## Pattern Breakdown\n\n`;
  markdown += `| Pattern | Count | % |\n`;
  markdown += `|---------|-------|---|\n`;

  for (const { pattern, count, percentage } of stats.patternBreakdown) {
    markdown += `| ${pattern} | ${count} | ${percentage}% |\n`;
  }
  markdown += `\n`;

  return markdown;
};

/**
 * Format user activity section
 */
const formatUserActivity = (stats: SecurityReportStats): string => {
  let markdown = `## User Activity\n\n`;

  if (stats.userActivity.length === 0) {
    markdown += `_No user activity to report._\n\n`;
    return markdown;
  }

  markdown += `| User | Attempts | Status |\n`;
  markdown += `|------|----------|--------|\n`;

  for (const { user, attempts, status } of stats.userActivity.slice(0, 10)) {
    const statusEmoji = { active: '✅', warned: '⚠️', blocked: '🚫', cleared: '✔️' }[status];
    markdown += `| @${user} | ${attempts} | ${statusEmoji} ${status} |\n`;
  }
  markdown += `\n`;

  if (stats.userActivity.length > 10) {
    markdown += `_Showing top 10 users. Total: ${stats.userActivity.length}_\n\n`;
  }

  return markdown;
};

/**
 * Format actions taken section
 */
const formatActionsTaken = (stats: SecurityReportStats): string => {
  let markdown = `## Actions Taken\n\n`;
  const blocked = stats.userActivity.filter((u) => u.status === 'blocked');
  const warned = stats.userActivity.filter((u) => u.status === 'warned');

  if (blocked.length > 0) {
    markdown += `- **Blocked users (${blocked.length}):** ${blocked.map((u) => `@${u.user}`).join(', ')}\n`;
  }

  if (warned.length > 0) {
    markdown += `- **Warned users (${warned.length}):** ${warned.map((u) => `@${u.user}`).join(', ')}\n`;
  }

  if (blocked.length === 0 && warned.length === 0) {
    markdown += `_No users currently blocked or warned._\n`;
  }

  markdown += `\n`;
  return markdown;
};

/**
 * Format recommendations section
 */
const formatRecommendations = (stats: SecurityReportStats): string => {
  let markdown = `## Recommendations\n\n`;

  if (stats.blockedUsers > 0) {
    markdown += `- Review blocked users to determine if blocks should be lifted\n`;
  }

  if (stats.patternBreakdown.length > 0) {
    const topPattern = stats.patternBreakdown[0];
    if (topPattern.percentage > 50) {
      markdown += `- Pattern "${topPattern.pattern}" represents ${topPattern.percentage}% of attempts - consider reviewing detection rules\n`;
    }
  }

  if (stats.totalAttempts > 50) {
    markdown += `- High volume of injection attempts detected - consider tightening rate limits\n`;
  }

  if (stats.uniqueUsers > 10) {
    markdown += `- Multiple unique users attempting injections - may indicate coordinated activity\n`;
  }

  markdown += `\n---\n\n*This report was generated automatically by the security monitoring system.*\n`;
  return markdown;
};

/**
 * Format report statistics as markdown
 */
const formatReportAsMarkdown = (stats: SecurityReportStats, days: number): string => {
  let markdown = formatHeader(stats, days);
  markdown += formatSummary(stats);

  if (stats.totalAttempts === 0) {
    return markdown;
  }

  markdown += formatPatternBreakdown(stats);
  markdown += formatUserActivity(stats);
  markdown += formatActionsTaken(stats);
  markdown += formatRecommendations(stats);

  return markdown;
};

/**
 * Main execution
 */
async function main() {
  const { days, output } = parseArgs();

  console.log(`Generating security report for the last ${days} days...`);

  const stats = generateReportStats(days);
  const markdown = formatReportAsMarkdown(stats, days);

  if (output) {
    // Write to file
    const fs = await import('node:fs');
    fs.writeFileSync(output, markdown, 'utf-8');
    console.log(`Report written to: ${output}`);
  } else {
    // Print to stdout
    console.log(markdown);
  }

  // Exit with success
  process.exit(0);
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Failed to generate security report:', error);
    process.exit(1);
  });
}
