#!/usr/bin/env bun
/* eslint-disable max-lines */
/**
 * Security History Analyzer
 *
 * Analyzes historical injection attempt data to identify trends,
 * patterns, and potential security risks over time.
 */

import { writeFileSync } from 'node:fs';
import { collectSecurityMetrics, getTopUsersByAttempts } from '../monitoring/metrics';
import type { InjectionPattern } from '../security/types';

/**
 * Analysis configuration
 */
interface AnalysisConfig {
  days: number;
  format: 'json' | 'markdown';
  output?: string;
}

/**
 * Analysis results
 */
interface AnalysisResults {
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalAttempts: number;
    blockedAttempts: number;
    blockRate: number;
    uniqueUsers: number;
    blockedUsers: number;
    avgPerDay: number;
  };
  trends: {
    weeklyAverage: number;
    monthlyAverage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
  patterns: {
    mostCommon: InjectionPattern | null;
    leastCommon: InjectionPattern | null;
    breakdown: Array<{ pattern: InjectionPattern; count: number; percentage: number }>;
  };
  users: {
    topOffenders: Array<{ user: string; attempts: number; status: string }>;
    repeatOffenders: number;
  };
  recommendations: string[];
}

/**
 * Parse command line arguments
 */
const parseArgs = (): AnalysisConfig => {
  const args = process.argv.slice(2);
  let days = 90;
  let format: 'json' | 'markdown' = 'markdown';
  let output: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      format = args[i + 1] as 'json' | 'markdown';
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  return { days, format, output };
};

/**
 * Calculate trends and patterns
 */
const analyzeTrends = (
  days: number,
): {
  trend: 'increasing' | 'decreasing' | 'stable';
  weeklyAverage: number;
  monthlyAverage: number;
  changePercent: number;
} => {
  // Get metrics for different time periods
  const recentMetrics = collectSecurityMetrics(7); // Last week
  const olderMetrics = collectSecurityMetrics(days); // Full period

  const weeklyAverage = recentMetrics.avgAttemptsPerDay;
  const monthlyAverage = olderMetrics.avgAttemptsPerDay;

  // Calculate trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let changePercent = 0;

  if (monthlyAverage > 0) {
    changePercent = ((weeklyAverage - monthlyAverage) / monthlyAverage) * 100;

    if (changePercent > 20) {
      trend = 'increasing';
    } else if (changePercent < -20) {
      trend = 'decreasing';
    }
  } else if (weeklyAverage > 0) {
    trend = 'increasing';
    changePercent = 100;
  }

  return {
    trend,
    weeklyAverage,
    monthlyAverage,
    changePercent,
  };
};

/**
 * Generate recommendations based on analysis
 */
const generateRecommendations = (results: Omit<AnalysisResults, 'recommendations'>): string[] => {
  const recommendations: string[] = [];

  // Check for high activity
  if (results.summary.avgPerDay >= 5) {
    recommendations.push(
      'High injection attempt rate detected. Consider implementing stricter rate limits.',
    );
  }

  // Check for increasing trend
  if (results.trends.trend === 'increasing' && results.trends.changePercent > 50) {
    recommendations.push(
      `Injection attempts are increasing rapidly (+${results.trends.changePercent.toFixed(0)}%). Investigate recent changes and monitor closely.`,
    );
  }

  // Check block rate
  if (results.summary.blockRate < 80) {
    recommendations.push(
      `Block rate is ${results.summary.blockRate.toFixed(0)}%. Review detection rules to improve effectiveness.`,
    );
  }

  // Check for repeat offenders
  if (results.users.repeatOffenders > 0) {
    recommendations.push(
      `${results.users.repeatOffenders} user(s) with 5+ attempts. Consider longer blocking periods for repeat offenders.`,
    );
  }

  // Check for pattern diversity
  if (results.patterns.breakdown.length <= 2) {
    recommendations.push(
      'Limited pattern diversity detected. Ensure detection covers all known injection techniques.',
    );
  }

  // Check for specific patterns
  if (results.patterns.mostCommon === 'role-switching') {
    recommendations.push(
      'Role-switching is the most common pattern. Consider adding more explicit role definitions in prompts.',
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture is healthy. Continue current monitoring practices.');
  }

  return recommendations;
};

/**
 * Perform comprehensive security analysis
 */
const analyzeSecurityHistory = (days: number): AnalysisResults => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Collect metrics
  const metrics = collectSecurityMetrics(days);
  const trends = analyzeTrends(days);
  const topUsers = getTopUsersByAttempts(10, days);

  // Calculate summary statistics
  const blockRate =
    metrics.totalAttempts > 0 ? (metrics.blockedAttempts / metrics.totalAttempts) * 100 : 0;

  // Process pattern breakdown
  const patternBreakdown = Object.entries(metrics.patternBreakdown)
    .filter(([_, count]) => count > 0)
    .map(([pattern, count]) => ({
      pattern: pattern as InjectionPattern,
      count,
      percentage: metrics.totalAttempts > 0 ? (count / metrics.totalAttempts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const mostCommon = patternBreakdown[0]?.pattern || null;
  const leastCommon = patternBreakdown[patternBreakdown.length - 1]?.pattern || null;

  // Count repeat offenders (users with 5+ attempts)
  const repeatOffenders = topUsers.filter((u) => u.attempts >= 5).length;

  // Process user data
  const usersWithStatus = topUsers.map((user) => ({
    ...user,
    status:
      user.attempts >= 10
        ? 'blocked'
        : user.attempts >= 5
          ? 'warned'
          : user.attempts >= 3
            ? 'monitored'
            : 'active',
  }));

  const resultsWithoutRecommendations = {
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days,
    },
    summary: {
      totalAttempts: metrics.totalAttempts,
      blockedAttempts: metrics.blockedAttempts,
      blockRate,
      uniqueUsers: metrics.uniqueUsers,
      blockedUsers: metrics.blockedUsers,
      avgPerDay: metrics.avgAttemptsPerDay,
    },
    trends: {
      weeklyAverage: trends.weeklyAverage,
      monthlyAverage: trends.monthlyAverage,
      trend: trends.trend,
      changePercent: trends.changePercent,
    },
    patterns: {
      mostCommon,
      leastCommon,
      breakdown: patternBreakdown,
    },
    users: {
      topOffenders: usersWithStatus,
      repeatOffenders,
    },
  };

  const recommendations = generateRecommendations(resultsWithoutRecommendations);

  return {
    ...resultsWithoutRecommendations,
    recommendations,
  };
};

/**
 * Format results as markdown
 */
const formatAsMarkdown = (results: AnalysisResults): string => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  return `# Security History Analysis

**Analysis Period:** ${new Date(results.timeRange.start).toLocaleDateString()} - ${new Date(results.timeRange.end).toLocaleDateString()} (${results.timeRange.days} days)  
**Generated:** ${new Date().toLocaleString()}

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Attempts** | ${results.summary.totalAttempts} |
| **Blocked** | ${results.summary.blockedAttempts} (${results.summary.blockRate.toFixed(1)}%) |
| **Unique Users** | ${results.summary.uniqueUsers} |
| **Blocked Users** | ${results.summary.blockedUsers} |
| **Avg per Day** | ${results.summary.avgPerDay.toFixed(1)} |

---

## Trends ${getTrendIcon(results.trends.trend)}

- **Weekly Average:** ${results.trends.weeklyAverage.toFixed(1)} attempts/day
- **Overall Average:** ${results.trends.monthlyAverage.toFixed(1)} attempts/day
- **Trend:** ${results.trends.trend.toUpperCase()} (${results.trends.changePercent > 0 ? '+' : ''}${results.trends.changePercent.toFixed(1)}%)

${
  results.trends.trend === 'increasing'
    ? '⚠️ **Alert:** Injection attempts are increasing. Heightened monitoring recommended.'
    : results.trends.trend === 'decreasing'
      ? '✅ **Good:** Injection attempts are decreasing. Current measures are effective.'
      : 'ℹ️ **Stable:** Activity is stable with no significant changes.'
}

---

## Pattern Analysis

**Most Common:** ${results.patterns.mostCommon || 'N/A'}  
**Least Common:** ${results.patterns.leastCommon || 'N/A'}

| Pattern | Count | Percentage |
|---------|-------|------------|
${results.patterns.breakdown.map((p) => `| ${p.pattern} | ${p.count} | ${p.percentage.toFixed(1)}% |`).join('\n')}

---

## Top Users

| User | Attempts | Status |
|------|----------|--------|
${results.users.topOffenders.map((u) => `| ${u.user} | ${u.attempts} | ${u.status} |`).join('\n')}

**Repeat Offenders:** ${results.users.repeatOffenders} user(s) with 5+ attempts

---

## Recommendations

${results.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

*Generated by Security History Analysis Tool*
`;
};

/**
 * Main execution
 */
const main = async () => {
  const config = parseArgs();

  console.log(`Analyzing security history for last ${config.days} days...`);

  // Perform analysis
  const results = analyzeSecurityHistory(config.days);

  // Format output
  let output: string;
  if (config.format === 'json') {
    output = JSON.stringify(results, null, 2);
  } else {
    output = formatAsMarkdown(results);
  }

  // Write or print output
  if (config.output) {
    writeFileSync(config.output, output, 'utf-8');
    console.log(`\n✅ Analysis saved to: ${config.output}`);
  } else {
    console.log('\n' + output);
  }

  // Print quick summary
  console.log(`\n📊 Quick Summary:`);
  console.log(`  - Total Attempts: ${results.summary.totalAttempts}`);
  console.log(`  - Block Rate: ${results.summary.blockRate.toFixed(1)}%`);
  console.log(
    `  - Trend: ${results.trends.trend} (${results.trends.changePercent > 0 ? '+' : ''}${results.trends.changePercent.toFixed(1)}%)`,
  );
  console.log(`  - Most Common Pattern: ${results.patterns.mostCommon || 'N/A'}`);
};

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Error analyzing security history:', error);
    process.exit(1);
  });
}

export { analyzeSecurityHistory, analyzeTrends, generateRecommendations };
