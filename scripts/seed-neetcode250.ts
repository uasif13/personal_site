/**
 * Seeds the `problems` table with the NeetCode 250 list.
 *
 * Data source: scripts/data/neetcode250.json, sourced from
 * https://github.com/ascherj/neetcode-250-guide (extracted 2024) — 250 problems
 * with name, difficulty, category, and LeetCode URL. Re-running this script is
 * safe; it skips problems whose URL is already in the table.
 *
 * Usage: npm run db:seed   (requires DATABASE_URL — loaded from .env.local via
 * the --env-file flag on the npm script, since ESM import hoisting means a
 * dotenv call in this file's own body would run too late to affect lib/db's
 * module-level `neon()` call)
 */
import { db } from '../lib/db';
import { problems } from '../lib/db/schema';
import data from './data/neetcode250.json';

function toTopicSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const rows = data.problems.map((p) => ({
    name: p.name,
    url: p.leetcode_url,
    source: 'neetcode250',
    platform: 'leetcode',
    difficulty: p.difficulty,
    topics: [toTopicSlug(p.category)],
    pattern: p.category,
  }));

  const result = await db.insert(problems).values(rows).onConflictDoNothing({
    target: problems.url,
  }).returning({ id: problems.id });

  console.log(`Inserted ${result.length} new problems (of ${rows.length} in the list).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
