/**
 * Display tag statistics
 */
export const displayTagStats = (tagStats: Map<string, number>): void => {
  const topTags = Array.from(tagStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n\n🏷️  Top 10 Tags:\n');
  for (const [tag, count] of topTags) {
    console.log(`   - ${tag}: ${count} tools`);
  }
};
