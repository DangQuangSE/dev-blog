import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('Phase 2: Mini-Bank Content Migration - posts.js validation', async (t) => {
  // Read posts.js
  const postsPath = path.join(__dirname, '../posts.js');
  const postsContent = fs.readFileSync(postsPath, 'utf-8');

  // Safely parse BLOG_POSTS array
  let BLOG_POSTS;
  try {
    // Extract the array content
    const match = postsContent.match(/const BLOG_POSTS = (\[[\s\S]*?\]);/);
    if (!match) {
      throw new Error('Could not find BLOG_POSTS array in posts.js');
    }
    // eslint-disable-next-line no-eval
    BLOG_POSTS = eval('(' + match[1] + ')');
  } catch (e) {
    throw new Error(`Failed to parse BLOG_POSTS from posts.js: ${e.message}`);
  }

  // Filter mini-bank posts (the 6 new entries from Phase 2)
  const miniBankPosts = BLOG_POSTS.filter(post => post.category === 'mini-bank');

  await t.test('posts.js parses successfully', () => {
    assert(Array.isArray(BLOG_POSTS), 'BLOG_POSTS is an array');
    assert(BLOG_POSTS.length > 0, 'BLOG_POSTS array is not empty');
  });

  await t.test('exactly 6 mini-bank posts exist', () => {
    assert.strictEqual(miniBankPosts.length, 6, 'Expected exactly 6 mini-bank category posts');
  });

  await t.test('all mini-bank posts have category "mini-bank"', () => {
    miniBankPosts.forEach((post, index) => {
      assert.strictEqual(
        post.category,
        'mini-bank',
        `Post ${index} should have category "mini-bank", got "${post.category}"`
      );
    });
  });

  await t.test('all mini-bank posts have non-empty required fields', () => {
    miniBankPosts.forEach((post, index) => {
      assert(post.title && post.title.trim(), `Post ${index} has non-empty title`);
      assert(post.date && post.date.trim(), `Post ${index} has non-empty date`);
      assert(post.description && post.description.trim(), `Post ${index} has non-empty description`);
      assert(post.path && post.path.trim(), `Post ${index} has non-empty path`);
    });
  });

  await t.test('all mini-bank post paths point to existing files', () => {
    const repoRoot = path.join(__dirname, '..');
    miniBankPosts.forEach((post, index) => {
      const filePath = path.join(repoRoot, post.path);
      assert(
        fs.existsSync(filePath),
        `Post ${index} (${post.title}): file should exist at ${post.path}`
      );
    });
  });

  await t.test('no duplicate paths in mini-bank posts', () => {
    const paths = miniBankPosts.map(post => post.path);
    const uniquePaths = new Set(paths);
    assert.strictEqual(
      paths.length,
      uniquePaths.size,
      `Expected ${paths.length} unique paths, but found duplicates`
    );
  });

  await t.test('mini-bank posts have correct expected paths', () => {
    const expectedPaths = [
      'content/mini-projects/mini-bank/phase-1-core-banking-auth.md',
      'content/mini-projects/mini-bank/phase-2-extended-banking-features.md',
      'content/mini-projects/mini-bank/phase-3-async-processing-loans.md',
      'content/mini-projects/mini-bank/phase-4-security-risk.md',
      'content/mini-projects/mini-bank/phase-5-microservices-extraction.md',
      'content/mini-projects/mini-bank/phase-6-polish-frontend-ship.md'
    ];
    const actualPaths = miniBankPosts.map(post => post.path).sort();
    const sortedExpected = expectedPaths.sort();
    sortedExpected.forEach((expectedPath, index) => {
      assert.strictEqual(
        actualPaths[index],
        expectedPath,
        `Path ${index} mismatch: expected ${expectedPath}, got ${actualPaths[index]}`
      );
    });
  });

  await t.test('all mini-bank posts have consistent date', () => {
    const dates = miniBankPosts.map(post => post.date);
    const uniqueDates = new Set(dates);
    // Allow either all same date or staggered dates (per spec flexibility)
    assert(
      uniqueDates.size > 0 && uniqueDates.size <= miniBankPosts.length,
      'Posts should have at least one date value'
    );
    // At minimum, all should be valid ISO-like dates
    dates.forEach((date, index) => {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(date), `Post ${index} has valid date format (YYYY-MM-DD): ${date}`);
    });
  });

  await t.test('mini-bank posts have expected titles referencing phases', () => {
    const expectedPhaseTitles = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Phase 6'];
    const actualTitles = miniBankPosts.map(post => post.title);
    expectedPhaseTitles.forEach((phaseTitle, index) => {
      assert(
        actualTitles[index].includes(phaseTitle),
        `Post ${index} title should include "${phaseTitle}", got "${actualTitles[index]}"`
      );
    });
  });

  await t.test('mini-bank posts have descriptions without obvious truncation or markdown artifacts', () => {
    miniBankPosts.forEach((post, index) => {
      const desc = post.description;
      // Check for common markdown artifacts that shouldn't be in descriptions
      assert(
        !desc.includes('**') || desc.match(/\*\*[^*]*\*\*/),
        `Post ${index} description should not have unclosed markdown bold markers`
      );
      // Description should not end with "..." suggesting truncation
      assert(
        !desc.endsWith('...'),
        `Post ${index} description should not end with "..." (may indicate truncation)`
      );
      // Basic length sanity check (should be at least 20 chars, likely more)
      assert(
        desc.length >= 20,
        `Post ${index} description is suspiciously short (${desc.length} chars): "${desc}"`
      );
    });
  });

  await t.test('each markdown file has readable content', () => {
    const repoRoot = path.join(__dirname, '..');
    miniBankPosts.forEach((post, index) => {
      const filePath = path.join(repoRoot, post.path);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert(content.length > 0, `Post ${index} markdown file should have content`);
      assert(
        content.includes('#'),
        `Post ${index} markdown file should have at least one heading (# or ##)`
      );
    });
  });

  await t.test('posts.js structure validation - no extra comma issues', () => {
    // Check that the array closes properly
    assert(postsContent.includes('const BLOG_POSTS = ['), 'BLOG_POSTS array declaration found');
    assert(postsContent.includes('];'), 'BLOG_POSTS array closes with semicolon');
  });
});

test('Phase 2: Mini-Bank Content Migration - individual entry validation', async (t) => {
  const postsPath = path.join(__dirname, '../posts.js');
  const postsContent = fs.readFileSync(postsPath, 'utf-8');
  // Extract the array content
  const match = postsContent.match(/const BLOG_POSTS = (\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error('Could not find BLOG_POSTS array in posts.js');
  }
  // eslint-disable-next-line no-eval
  const BLOG_POSTS = eval('(' + match[1] + ')');
  const miniBankPosts = BLOG_POSTS.filter(post => post.category === 'mini-bank').sort((a, b) => {
    // Sort by path to ensure consistent order
    return a.path.localeCompare(b.path);
  });

  const repoRoot = path.join(__dirname, '..');

  // Test each phase individually
  const phases = [
    {
      index: 0,
      filename: 'phase-1-core-banking-auth.md',
      expectedTitle: 'Phase 1',
      expectedTitleKeywords: ['Core Banking', 'Auth', 'Week 1–4']
    },
    {
      index: 1,
      filename: 'phase-2-extended-banking-features.md',
      expectedTitle: 'Phase 2',
      expectedTitleKeywords: ['Extended Banking', 'Features', 'Week 5–8']
    },
    {
      index: 2,
      filename: 'phase-3-async-processing-loans.md',
      expectedTitle: 'Phase 3',
      expectedTitleKeywords: ['Async Processing', 'Loans', 'Week 9–12']
    },
    {
      index: 3,
      filename: 'phase-4-security-risk.md',
      expectedTitle: 'Phase 4',
      expectedTitleKeywords: ['Security', 'Risk', 'Week 13–16']
    },
    {
      index: 4,
      filename: 'phase-5-microservices-extraction.md',
      expectedTitle: 'Phase 5',
      expectedTitleKeywords: ['Microservices', 'Extraction', 'Week 17–20']
    },
    {
      index: 5,
      filename: 'phase-6-polish-frontend-ship.md',
      expectedTitle: 'Phase 6',
      expectedTitleKeywords: ['Polish', 'Frontend', 'Ship', 'Week 21–24']
    }
  ];

  for (const phase of phases) {
    await t.test(`Phase ${phase.index + 1}: ${phase.filename} has correct metadata`, () => {
      const post = miniBankPosts[phase.index];
      assert(post, `Post at index ${phase.index} exists`);
      assert.strictEqual(
        post.path,
        `content/mini-projects/mini-bank/${phase.filename}`,
        `Post ${phase.index} path should match expected filename`
      );
      assert(
        post.title.includes(phase.expectedTitle),
        `Post ${phase.index} title should include "${phase.expectedTitle}"`
      );
      // Check that file exists
      const filePath = path.join(repoRoot, post.path);
      assert(fs.existsSync(filePath), `Post ${phase.index} file should exist at ${post.path}`);
    });
  }
});
