import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pure functions extracted from reader.html for testing
// These are copied directly to ensure they match the source exactly
function slugify(text) {
    let s = (text || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    s = s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
    return s;
}

function toRoman(num) {
    const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let result = '';
    for (const [val, sym] of map) { while (num >= val) { result += sym; num -= val; } }
    return result;
}

function toLetter(num) {
    let s = '';
    while (num > 0) {
        const rem = (num - 1) % 26;
        s = String.fromCharCode(97 + rem) + s;
        num = Math.floor((num - 1) / 26);
    }
    return s;
}

test('Phase 4: Reader TOC & Scroll-Spy - Pure Function Tests', async (t) => {
  const readerPath = path.join(__dirname, '../reader.html');
  const readerContent = fs.readFileSync(readerPath, 'utf-8');

  await t.test('Functions exist in reader.html', () => {
    assert(
      readerContent.includes('function slugify(text)'),
      'slugify function should be defined'
    );
    assert(
      readerContent.includes('function toRoman(num)'),
      'toRoman function should be defined'
    );
    assert(
      readerContent.includes('function toLetter(num)'),
      'toLetter function should be defined'
    );
  });

  await t.test('slugify - Vietnamese diacritics handling', () => {
    // Test cases with Vietnamese text and diacritics
    assert.strictEqual(
      slugify('Mục tiêu phase'),
      'muc-tieu-phase',
      'Should correctly slugify "Mục tiêu phase"'
    );

    assert.strictEqual(
      slugify('Đăng ký tài khoản'),
      'dang-ky-tai-khoan',
      'Should correctly slugify "Đăng ký tài khoản" with Đ/đ handling'
    );

    assert.strictEqual(
      slugify('Ngôn ngữ lập trình'),
      'ngon-ngu-lap-trinh',
      'Should correctly slugify text with circumflex accents'
    );

    assert.strictEqual(
      slugify('Kiểm tra môi trường'),
      'kiem-tra-moi-truong',
      'Should correctly slugify text with combining grave/hook marks'
    );

    assert.strictEqual(
      slugify('Cấu hình ứng dụng'),
      'cau-hinh-ung-dung',
      'Should correctly slugify text with circumflex + combining marks'
    );
  });

  await t.test('slugify - English and mixed content', () => {
    assert.strictEqual(
      slugify('Setup & Data Model'),
      'setup-data-model',
      'Should handle English with special chars (&)'
    );

    assert.strictEqual(
      slugify('Core Banking Auth'),
      'core-banking-auth',
      'Should handle basic English text'
    );

    assert.strictEqual(
      slugify('Week 1: Introduction'),
      'week-1-introduction',
      'Should preserve numbers in text'
    );
  });

  await t.test('slugify - empty and whitespace-only input', () => {
    assert.strictEqual(
      slugify(''),
      '',
      'Should return empty string for empty input'
    );

    assert.strictEqual(
      slugify('   '),
      '',
      'Should return empty string for whitespace-only input'
    );

    assert.strictEqual(
      slugify(null),
      '',
      'Should handle null input gracefully'
    );

    assert.strictEqual(
      slugify(undefined),
      '',
      'Should handle undefined input gracefully'
    );
  });

  await t.test('slugify - special characters and punctuation', () => {
    assert.strictEqual(
      slugify('Hello, World!'),
      'hello-world',
      'Should remove comma and exclamation'
    );

    assert.strictEqual(
      slugify('Test... Multiple   Spaces'),
      'test-multiple-spaces',
      'Should collapse multiple spaces into single hyphen'
    );

    assert.strictEqual(
      slugify('Title (with parentheses)'),
      'title-with-parentheses',
      'Should remove parentheses'
    );

    assert.strictEqual(
      slugify('hello--double-dash'),
      'hello-double-dash',
      'Should collapse multiple hyphens into single hyphen'
    );
  });

  await t.test('slugify - symbol-only input returns empty string', () => {
    assert.strictEqual(
      slugify('!!!'),
      '',
      'Symbol-only input should return empty string'
    );

    assert.strictEqual(
      slugify('###'),
      '',
      'Hash-only input should return empty string'
    );

    assert.strictEqual(
      slugify('@#$%'),
      '',
      'Special chars only should return empty string'
    );

    // Note: The caller (buildTableOfContents) handles the empty case
    // by falling back to 'heading-N', not slugify itself
  });

  await t.test('toRoman - basic cases', () => {
    assert.strictEqual(toRoman(1), 'I', 'Should convert 1 to I');
    assert.strictEqual(toRoman(2), 'II', 'Should convert 2 to II');
    assert.strictEqual(toRoman(3), 'III', 'Should convert 3 to III');
    assert.strictEqual(toRoman(4), 'IV', 'Should convert 4 to IV (subtractive)');
    assert.strictEqual(toRoman(5), 'V', 'Should convert 5 to V');
  });

  await t.test('toRoman - intermediate cases', () => {
    assert.strictEqual(toRoman(9), 'IX', 'Should convert 9 to IX (subtractive)');
    assert.strictEqual(toRoman(10), 'X', 'Should convert 10 to X');
    assert.strictEqual(toRoman(14), 'XIV', 'Should convert 14 to XIV');
    assert.strictEqual(toRoman(15), 'XV', 'Should convert 15 to XV');
    assert.strictEqual(toRoman(19), 'XIX', 'Should convert 19 to XIX');
    assert.strictEqual(toRoman(20), 'XX', 'Should convert 20 to XX');
  });

  await t.test('toRoman - larger cases', () => {
    assert.strictEqual(toRoman(40), 'XL', 'Should convert 40 to XL (subtractive)');
    assert.strictEqual(toRoman(50), 'L', 'Should convert 50 to L');
    assert.strictEqual(toRoman(90), 'XC', 'Should convert 90 to XC (subtractive)');
    assert.strictEqual(toRoman(100), 'C', 'Should convert 100 to C');
    assert.strictEqual(toRoman(400), 'CD', 'Should convert 400 to CD (subtractive)');
    assert.strictEqual(toRoman(500), 'D', 'Should convert 500 to D');
    assert.strictEqual(toRoman(900), 'CM', 'Should convert 900 to CM (subtractive)');
    assert.strictEqual(toRoman(1000), 'M', 'Should convert 1000 to M');
  });

  await t.test('toRoman - complex cases', () => {
    assert.strictEqual(toRoman(44), 'XLIV', 'Should convert 44 to XLIV');
    assert.strictEqual(toRoman(99), 'XCIX', 'Should convert 99 to XCIX');
    assert.strictEqual(toRoman(444), 'CDXLIV', 'Should convert 444 to CDXLIV');
    assert.strictEqual(toRoman(1994), 'MCMXCIV', 'Should convert 1994 to MCMXCIV');
    assert.strictEqual(toRoman(2023), 'MMXXIII', 'Should convert 2023 to MMXXIII');
  });

  await t.test('toLetter - basic single letter cases', () => {
    assert.strictEqual(toLetter(1), 'a', 'Should convert 1 to a');
    assert.strictEqual(toLetter(2), 'b', 'Should convert 2 to b');
    assert.strictEqual(toLetter(3), 'c', 'Should convert 3 to c');
    assert.strictEqual(toLetter(8), 'h', 'Should convert 8 to h');
  });

  await t.test('toLetter - boundary cases within single letter', () => {
    assert.strictEqual(toLetter(25), 'y', 'Should convert 25 to y');
    assert.strictEqual(toLetter(26), 'z', 'Should convert 26 to z');
  });

  await t.test('toLetter - double letter cases', () => {
    assert.strictEqual(toLetter(27), 'aa', 'Should convert 27 to aa');
    assert.strictEqual(toLetter(28), 'ab', 'Should convert 28 to ab');
    assert.strictEqual(toLetter(52), 'az', 'Should convert 52 to az');
    assert.strictEqual(toLetter(53), 'ba', 'Should convert 53 to ba');
  });

  await t.test('toLetter - triple letter and beyond', () => {
    assert.strictEqual(toLetter(702), 'zz', 'Should convert 702 to zz');
    assert.strictEqual(toLetter(703), 'aaa', 'Should convert 703 to aaa');
  });

  await t.test('Display text stripper - removes numbered prefixes', () => {
    // The regex is: /^(\d+|[a-zA-Z])[.)]\s+/
    const stripPrefix = (text) => text.replace(/^(\d+|[a-zA-Z])[.)]\s+/, '');

    assert.strictEqual(
      stripPrefix('1. Kiểm tra môi trường'),
      'Kiểm tra môi trường',
      'Should strip "1. " prefix'
    );

    assert.strictEqual(
      stripPrefix('1) Installation Steps'),
      'Installation Steps',
      'Should strip "1) " prefix'
    );

    assert.strictEqual(
      stripPrefix('12. Setup configuration'),
      'Setup configuration',
      'Should strip "12. " prefix'
    );

    assert.strictEqual(
      stripPrefix('99) Long numbered list'),
      'Long numbered list',
      'Should strip "99) " prefix'
    );
  });

  await t.test('Display text stripper - removes letter prefixes', () => {
    const stripPrefix = (text) => text.replace(/^(\d+|[a-zA-Z])[.)]\s+/, '');

    assert.strictEqual(
      stripPrefix('a) Hạn chế phương pháp'),
      'Hạn chế phương pháp',
      'Should strip "a) " prefix'
    );

    assert.strictEqual(
      stripPrefix('B. Backend implementation'),
      'Backend implementation',
      'Should strip "B. " prefix (uppercase)'
    );

    assert.strictEqual(
      stripPrefix('z) Last item in list'),
      'Last item in list',
      'Should strip "z) " prefix'
    );

    assert.strictEqual(
      stripPrefix('A. First item'),
      'First item',
      'Should strip "A. " prefix (uppercase)'
    );
  });

  await t.test('Display text stripper - does NOT strip when pattern is incomplete', () => {
    const stripPrefix = (text) => text.replace(/^(\d+|[a-zA-Z])[.)]\s+/, '');

    assert.strictEqual(
      stripPrefix('2026 roadmap'),
      '2026 roadmap',
      'Should NOT strip "2026 roadmap" (digit not followed by . or ))'
    );

    assert.strictEqual(
      stripPrefix('1heading'),
      '1heading',
      'Should NOT strip when no space after digit/letter'
    );

    assert.strictEqual(
      stripPrefix('a-something'),
      'a-something',
      'Should NOT strip when no . or ) after letter'
    );

    assert.strictEqual(
      stripPrefix('1.'),
      '1.',
      'Should NOT strip when no space after separator'
    );
  });

  await t.test('Display text stripper - edge cases', () => {
    const stripPrefix = (text) => text.replace(/^(\d+|[a-zA-Z])[.)]\s+/, '');

    assert.strictEqual(
      stripPrefix('1. '),
      '',
      'Should strip "1. " even if only whitespace remains'
    );

    assert.strictEqual(
      stripPrefix(''),
      '',
      'Should handle empty string'
    );

    assert.strictEqual(
      stripPrefix('   '),
      '   ',
      'Should not strip pure whitespace'
    );

    assert.strictEqual(
      stripPrefix('1. Item with multiple spaces after'),
      'Item with multiple spaces after',
      'Should strip "1. " with following text'
    );
  });

  await t.test('Verify reader.html contains valid rootMargin value', () => {
    // This is a regression guard for the historical bug where rootMargin used 'vh' units
    // which is invalid for IntersectionObserver spec (only px/% allowed)
    const rootMarginMatch = readerContent.match(/rootMargin:\s*'([^']+)'/);
    assert(rootMarginMatch, 'rootMargin value found in reader.html');

    const rootMarginValue = rootMarginMatch[1];
    assert.strictEqual(
      rootMarginValue,
      '-40% 0px -40% 0px',
      'rootMargin should use % units, not vh (which would crash IntersectionObserver)'
    );

    // Explicitly check that 'vh' is NOT in rootMargin
    assert(
      !rootMarginValue.includes('vh'),
      'rootMargin should NOT contain "vh" units (invalid per IntersectionObserver spec)'
    );
  });

  await t.test('Verify buildTableOfContents and scroll-spy setup exists', () => {
    // Verify the function is present
    assert(
      readerContent.includes('function buildTableOfContents(contentEl, sidebarEl)'),
      'buildTableOfContents function should be defined'
    );

    // Verify scroll-spy setup
    assert(
      readerContent.includes('new IntersectionObserver'),
      'IntersectionObserver initialization should exist'
    );

    // Verify toc-active class is used for highlighting
    assert(
      readerContent.includes("'toc-active'"),
      'toc-active class should be used for active TOC entries'
    );

    // Verify scroll-spy threshold is set correctly (should be 0)
    assert(
      readerContent.includes('threshold: 0'),
      'IntersectionObserver threshold should be 0'
    );
  });

  await t.test('Verify responsive layout classes in HTML', () => {
    // Check that sidebar has correct responsive visibility classes
    assert(
      readerContent.includes('hidden md:block'),
      'TOC sidebar should have "hidden md:block" for responsive visibility'
    );

    // Check that sidebar is sticky
    assert(
      readerContent.includes('md:sticky'),
      'TOC sidebar should be sticky on desktop (md breakpoint)'
    );

    // Check that content has flex layout
    assert(
      readerContent.includes('md:flex'),
      'Post body should use flex layout on desktop'
    );
  });

  await t.test('Verify display text stripping regex is present in buildTableOfContents', () => {
    // Find the buildTableOfContents function and check for the regex pattern
    // The actual regex in the code is: /^(\d+|[a-zA-Z])[.)]\s+/
    assert(
      readerContent.includes("replace(/^(\\d+|[a-zA-Z])[.)]\\s+/"),
      'Display text stripping regex should be present in buildTableOfContents'
    );

    // Verify it's applied to displayText
    assert(
      readerContent.includes('const displayText'),
      'displayText variable should be defined'
    );

    assert(
      readerContent.includes('node.text.replace'),
      'Regex should be applied to node.text'
    );
  });
});

test('Phase 4: Reader TOC & Scroll-Spy - Integration with heading ID assignment', async (t) => {
  const readerPath = path.join(__dirname, '../reader.html');
  const readerContent = fs.readFileSync(readerPath, 'utf-8');

  await t.test('Collision deduplication logic is present', () => {
    // Verify the usedSlugs Set and collision logic
    assert(
      readerContent.includes('usedSlugs'),
      'usedSlugs Set should track generated slugs'
    );

    assert(
      readerContent.includes('while (usedSlugs.has(slug))'),
      'Collision detection loop should exist'
    );

    assert(
      readerContent.includes("slug = base + '-' + suffix"),
      'Suffix should be appended for collisions'
    );
  });

  await t.test('Heading ID fallback exists for empty slugs', () => {
    // Verify heading-N fallback for empty slugs
    assert(
      readerContent.includes("base = 'heading-'"),
      'Empty slug fallback to heading-N should exist'
    );
  });

  await t.test('Numbered hierarchy reset logic is present', () => {
    // Verify counters for roman/arabic/letter numbering
    assert(
      readerContent.includes('let topCount = 0, midCount = 0, leafCount = 0'),
      'Counters for three numbering levels should exist'
    );

    // Verify reset on new top-level heading
    assert(
      readerContent.includes('midCount = 0; leafCount = 0'),
      'Mid and leaf counters should reset when top level changes'
    );

    // Verify reset on new mid-level heading
    assert(
      readerContent.includes('leafCount = 0'),
      'Leaf counter should reset when mid level changes'
    );
  });

  await t.test('Zero-heading case handling', () => {
    // Verify that sidebar is hidden when no headings exist
    assert(
      readerContent.includes('if (headings.length === 0)'),
      'Should check for zero headings'
    );

    assert(
      readerContent.includes("sidebarEl.style.display = 'none'"),
      'Sidebar should be hidden via inline style when no headings'
    );
  });

  await t.test('Top-level promotion for posts without h2', () => {
    // Verify topLevel calculation uses Math.min of present levels
    assert(
      readerContent.includes('const topLevel = Math.min(...levelsPresent)'),
      'Should promote the shallowest heading level to top'
    );

    // Verify depth calculation
    assert(
      readerContent.includes('const depth = level - topLevel'),
      'Depth should be relative to the topmost level found'
    );
  });

  await t.test('Click-to-jump functionality', () => {
    assert(
      readerContent.includes('scrollIntoView'),
      'Should use scrollIntoView for click-to-jump'
    );

    assert(
      readerContent.includes("behavior: 'smooth'"),
      'Scroll should be smooth'
    );

    assert(
      readerContent.includes("block: 'start'"),
      'Heading should scroll to top of viewport'
    );
  });
});
