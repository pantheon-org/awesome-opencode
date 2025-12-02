#!/usr/bin/env bun
/* eslint-disable max-lines */
/**
 * Security Dashboard Generator
 *
 * Creates an HTML dashboard with charts and metrics for security monitoring
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  collectSecurityMetrics,
  collectLogStatistics,
  getTopUsersByAttempts,
} from '../../monitoring/metrics';
import type { SecurityMetrics } from '../../monitoring/metrics';
import type { InjectionPattern } from '../../security/types';

/**
 * Parse command line arguments
 */
const parseArgs = (): { days: number; output: string } => {
  const args = process.argv.slice(2);
  let days = 30;
  let output = 'docs/security-dashboard.md';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  return { days, output };
};

/**
 * Format number as percentage
 */
const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

/**
 * Generate ASCII bar chart for time series data
 */
const generateTimeSeriesChart = (data: Array<{ date: string; attempts: number }>): string => {
  if (data.length === 0) {
    return '*No data available*';
  }

  // Get last 7 days
  const last7Days = data.slice(-7);
  const maxAttempts = Math.max(...last7Days.map((d) => d.attempts), 1);

  let chart = '```\n';
  for (const day of last7Days) {
    const date = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const barLength = Math.round((day.attempts / maxAttempts) * 40);
    const bar = '█'.repeat(barLength);
    chart += `${date.padEnd(8)} ${bar} ${day.attempts}\n`;
  }
  chart += '```';

  return chart;
};

/**
 * Generate mermaid pie chart for pattern breakdown
 */
const generatePatternPieChart = (patterns: Record<InjectionPattern, number>): string => {
  const entries = Object.entries(patterns).filter(([_, count]) => count > 0);

  if (entries.length === 0) {
    return '*No patterns detected*';
  }

  let chart = '```mermaid\npie title Injection Patterns\n';
  for (const [pattern, count] of entries) {
    chart += `  "${pattern}" : ${count}\n`;
  }
  chart += '```';

  return chart;
};

/**
 * Generate status badge and summary
 */
const generateStatusSummary = (metrics: SecurityMetrics): { badge: string; message: string } => {
  const avgDaily = metrics.avgAttemptsPerDay;

  if (avgDaily === 0) {
    return {
      badge: '🟢',
      message: '**Excellent** - No injection attempts detected',
    };
  } else if (avgDaily < 1) {
    return {
      badge: '🟢',
      message: '**Normal** - Low activity, no immediate concerns',
    };
  } else if (avgDaily < 5) {
    return {
      badge: '🟡',
      message: '**Moderate** - Increased activity, monitor trends',
    };
  } else if (avgDaily < 10) {
    return {
      badge: '🟠',
      message: '**Elevated** - High activity detected, review patterns',
    };
  } else {
    return {
      badge: '🔴',
      message: '**Critical** - Very high activity, immediate review required',
    };
  }
};

/**
 * Generate key observations text
 */
const generateKeyObservations = (metrics: SecurityMetrics): string => {
  const activityLevel =
    metrics.avgAttemptsPerDay < 1
      ? 'Low activity level maintained'
      : metrics.avgAttemptsPerDay < 5
        ? 'Moderate activity detected'
        : 'High activity requires attention';

  const blockStatus =
    metrics.blockedAttempts === metrics.totalAttempts
      ? 'All attempts successfully blocked'
      : `${metrics.totalAttempts - metrics.blockedAttempts} attempt(s) were not blocked`;

  const userStatus =
    metrics.blockedUsers > 0
      ? `${metrics.blockedUsers} user(s) currently blocked by rate limiting`
      : 'No users currently blocked';

  return `
**Key Observations:**
- ${activityLevel}
- ${blockStatus}
- ${userStatus}
`;
};

/**
 * Generate pattern breakdown table
 */
const generatePatternTable = (
  patternBreakdown: Record<InjectionPattern, number>,
  totalAttempts: number,
): string => {
  return Object.entries(patternBreakdown)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([pattern, count]) => `| ${pattern} | ${count} | ${formatPercentage(count, totalAttempts)} |`,
    )
    .join('\n');
};

/**
 * Generate workflow breakdown table
 */
const generateWorkflowTable = (
  workflowBreakdown: Record<string, number>,
  totalAttempts: number,
): string => {
  return Object.entries(workflowBreakdown)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([workflow, count]) =>
        `| ${workflow} | ${count} | ${formatPercentage(count, totalAttempts)} |`,
    )
    .join('\n');
};

/**
 * Generate top users table
 */
const generateTopUsersTable = (topUsers: Array<{ user: string; attempts: number }>): string => {
  return topUsers
    .map(({ user, attempts }) => {
      const isBlocked = attempts >= 5;
      const status = isBlocked ? '🔴 Blocked' : attempts >= 3 ? '🟡 Warned' : '🟢 Active';
      return `| ${user} | ${attempts} | ${status} |`;
    })
    .join('\n');
};

/**
 * Generate log category table
 */
const generateLogCategoryTable = (categoryBreakdown: Record<string, number>): string => {
  return Object.entries(categoryBreakdown)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n');
};

/**
 * Generate recommendations section
 */
const generateRecommendations = (metrics: SecurityMetrics): string => {
  const recommendations: string[] = [];

  if (metrics.totalAttempts === 0) {
    recommendations.push('✅ **No action required** - Continue monitoring');
  } else if (metrics.avgAttemptsPerDay < 1) {
    recommendations.push('✅ **Maintain current posture** - Activity is within normal range');
  }

  if (metrics.blockedUsers > 0) {
    recommendations.push(
      `⚠️ **Review blocked users** - ${metrics.blockedUsers} user(s) currently blocked. Verify if blocks are legitimate or false positives.`,
    );
  }

  if (metrics.avgAttemptsPerDay >= 5) {
    recommendations.push(
      `🔴 **Immediate review required** - High injection attempt rate (${metrics.avgAttemptsPerDay.toFixed(1)}/day). Investigate patterns and sources.`,
    );
  }

  if (metrics.mostCommonPattern) {
    recommendations.push(
      `📊 **Pattern analysis** - "${metrics.mostCommonPattern}" is the most common pattern. Review detection rules for accuracy.`,
    );
  }

  return recommendations.join('\n\n');
};

/**
 * Generate dashboard markdown content
 */
export const generateSecurityDashboard = (metrics: SecurityMetrics, days: number): string => {
  const status = generateStatusSummary(metrics);
  const logStats = collectLogStatistics(days);
  const topUsers = getTopUsersByAttempts(5, days);

  const dashboard = `# Security Monitoring Dashboard

**Last Updated:** ${new Date().toISOString()}  
**Reporting Period:** Last ${days} days

---

## ${status.badge} Status

${status.message}

---

## Overview

| Metric | Value |
|--------|-------|
| **Total Injection Attempts** | ${metrics.totalAttempts} |
| **Blocked Attempts** | ${metrics.blockedAttempts} (${formatPercentage(metrics.blockedAttempts, metrics.totalAttempts)}) |
| **Unique Users** | ${metrics.uniqueUsers} |
| **Blocked Users** | ${metrics.blockedUsers} |
| **Average per Day** | ${metrics.avgAttemptsPerDay.toFixed(1)} |
| **Most Common Pattern** | ${metrics.mostCommonPattern || 'N/A'} |
| **Most Targeted Workflow** | ${metrics.mostTargetedWorkflow || 'N/A'} |

---

## Trend Analysis (Last 7 Days)

${generateTimeSeriesChart(metrics.timeSeriesData)}

${metrics.totalAttempts > 0 ? generateKeyObservations(metrics) : '*No attempts detected during this period*'}

---

## Pattern Breakdown

${metrics.totalAttempts > 0 ? generatePatternPieChart(metrics.patternBreakdown) : '*No patterns to display*'}

${
  metrics.totalAttempts > 0
    ? `
| Pattern | Count | Percentage |
|---------|-------|------------|
${generatePatternTable(metrics.patternBreakdown, metrics.totalAttempts)}
`
    : ''
}

---

## Workflow Analysis

${
  metrics.totalAttempts > 0
    ? `
| Workflow | Attempts | Percentage |
|----------|----------|------------|
${generateWorkflowTable(metrics.workflowBreakdown, metrics.totalAttempts)}
`
    : '*No workflow data available*'
}

---

## Top Users by Attempts

${
  topUsers.length > 0
    ? `
| User | Attempts | Status |
|------|----------|--------|
${generateTopUsersTable(topUsers)}
`
    : '*No users with injection attempts during this period*'
}

---

## Log Statistics

| Metric | Value |
|--------|-------|
| **Total Log Entries** | ${logStats.totalEntries} |
| **Critical Events** | ${logStats.criticalEvents} |
| **Errors** | ${logStats.errors} |
| **Warnings** | ${logStats.warnings} |

### Log Breakdown by Category

| Category | Count |
|----------|-------|
${generateLogCategoryTable(logStats.categoryBreakdown)}

---

## Recommendations

${generateRecommendations(metrics)}

---

## Actions

- 📋 [View Detailed Logs](../data/security-logs/)
- 🔍 [Run Security Analysis](../../scripts/analyze-security-history.ts)
- 📊 [Generate Report](../../scripts/generate-security-report.ts)
- 📖 [Review Security Policy](../SECURITY.md)

---

*This dashboard is auto-generated daily. Last generated: ${new Date().toLocaleString()}*
`;

  return dashboard;
};

/**
 * Main execution
 */
const main = async () => {
  const { days, output } = parseArgs();

  console.log(`Generating security dashboard for last ${days} days...`);

  // Collect metrics
  const metrics = collectSecurityMetrics(days);

  // Generate dashboard content
  const dashboard = generateSecurityDashboard(metrics, days);

  // Ensure output directory exists
  const outputDir = dirname(output);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write dashboard file
  writeFileSync(output, dashboard, 'utf-8');

  console.log(`✅ Security dashboard generated: ${output}`);
  console.log(`\nSummary:`);
  console.log(`  - Total Attempts: ${metrics.totalAttempts}`);
  console.log(`  - Blocked: ${metrics.blockedAttempts}`);
  console.log(`  - Unique Users: ${metrics.uniqueUsers}`);
  console.log(`  - Avg per Day: ${metrics.avgAttemptsPerDay.toFixed(1)}`);
};

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error generating dashboard:', error);
    process.exit(1);
  });
}
