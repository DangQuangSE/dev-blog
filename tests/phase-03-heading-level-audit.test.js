import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Recursively find all markdown files in a directory.
 */
function findMarkdownFiles(dir, relativePath = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relPath);
    }
  }

  return files;
}

/**
 * Parse markdown file and return array of headings with their levels.
 * Correctly skips lines inside fenced code blocks (```, ~~~).
 * Returns array of objects: { level (1-6), text, lineNumber, fileName }
 */
function extractHeadings(content, fileName) {
  const lines = content.split('\n');
  const headings = [];
  let inFencedBlock = false;
  let fenceChar = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for fence markers (``` or ~~~)
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const fenceType = trimmed.startsWith('```') ? '`' : '~';

      // If we're already in a fence, check if this ends it
      if (inFencedBlock && fenceChar === fenceType) {
        inFencedBlock = false;
        fenceChar = null;
      } else if (!inFencedBlock) {
        // Start a new fence
        inFencedBlock = true;
        fenceChar = fenceType;
      }
      // If it's a different fence type while in a fence, ignore it
      continue;
    }

    // Skip lines inside fenced blocks
    if (inFencedBlock) {
      continue;
    }

    // Extract headings (only outside fenced blocks)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      headings.push({
        level,
        text,
        lineNumber: i + 1,
        fileName
      });
    }
  }

  return headings;
}

/**
 * Check for heading-level violations in a single file.
 * A violation is when an h3/h4/h5/h6 appears before its parent heading level exists.
 * Returns array of violation objects, or empty if no violations.
 */
function checkHeadingViolations(headings) {
  const violations = [];
  const maxHeadingsSeen = {}; // Track max heading level seen so far

  for (const heading of headings) {
    const level = heading.level;

    // For level > 1, check if parent level exists before this
    if (level > 1) {
      const parentLevel = level - 1;
      if (!maxHeadingsSeen[parentLevel]) {
        violations.push({
          headingLevel: level,
          headingText: heading.text,
          lineNumber: heading.lineNumber,
          fileName: heading.fileName,
          missingParent: parentLevel,
          message: `h${level} "${heading.text}" at line ${heading.lineNumber} appears before any h${parentLevel} in ${heading.fileName}`
        });
      }
    }

    // Update max heading level seen for this level
    if (!maxHeadingsSeen[level] || level < maxHeadingsSeen[level]) {
      maxHeadingsSeen[level] = true;
    }
  }

  return violations;
}

test('Phase 3: Heading-Level Audit Verification', async (t) => {
  const repoRoot = path.join(__dirname, '..');
  const contentDir = path.join(repoRoot, 'content');

  // Find all markdown files
  const mdFiles = findMarkdownFiles(contentDir).sort();

  await t.test('exactly 65 markdown files exist in content/', () => {
    assert.strictEqual(
      mdFiles.length,
      65,
      `Expected 65 markdown files in content/, found ${mdFiles.length}`
    );
  });

  const allViolations = [];
  const filesWithViolations = new Set();

  await t.test('no heading-level violations across all files', async (t) => {
    for (const mdFile of mdFiles) {
      const filePath = path.join(contentDir, mdFile);
      const content = fs.readFileSync(filePath, 'utf-8');

      await t.test(`${mdFile} - no heading-level violations`, () => {
        const headings = extractHeadings(content, mdFile);
        const violations = checkHeadingViolations(headings);

        if (violations.length > 0) {
          filesWithViolations.add(mdFile);
          allViolations.push(...violations);
        }

        assert.strictEqual(
          violations.length,
          0,
          violations.length > 0
            ? `Expected 0 violations in ${mdFile}, found ${violations.length}:\n${violations
                .map(v => `  - ${v.message}`)
                .join('\n')}`
            : ''
        );
      });
    }
  });

  await t.test('comprehensive audit summary', () => {
    assert.strictEqual(
      filesWithViolations.size,
      0,
      `Expected 0 files with violations, found ${filesWithViolations.size}: ${Array.from(
        filesWithViolations
      ).join(', ')}`
    );
    assert.strictEqual(
      allViolations.length,
      0,
      `Expected 0 total violations, found ${allViolations.length}`
    );
  });

  // Spot-check: verify fenced code block skipping works
  await t.test('fenced code blocks are correctly excluded from heading detection', () => {
    // Create a test file content with heading-like lines in fenced blocks
    const testContent = `# H1
## H2

\`\`\`bash
# This should not be counted as h1
echo "hello"
\`\`\`

### H3

~~~python
## This should not be counted as h2
print("hello")
~~~

#### H4
`;

    const headings = extractHeadings(testContent, 'test.md');
    const headingTexts = headings.map(h => ({ level: h.level, text: h.text }));

    // Should only see the actual headings, not the ones in code blocks
    const expected = [
      { level: 1, text: 'H1' },
      { level: 2, text: 'H2' },
      { level: 3, text: 'H3' },
      { level: 4, text: 'H4' }
    ];

    assert.deepStrictEqual(
      headingTexts,
      expected,
      'Fenced code blocks should be excluded from heading extraction'
    );
  });

  // Verify mini-bank phase files specifically (from Phase 2 audit)
  await t.test('mini-bank phase files exist and are included in audit', () => {
    const expectedMiniBankFiles = [
      'phase-1-core-banking-auth.md',
      'phase-2-extended-banking-features.md',
      'phase-3-async-processing-loans.md',
      'phase-4-security-risk.md',
      'phase-5-microservices-extraction.md',
      'phase-6-polish-frontend-ship.md'
    ];

    expectedMiniBankFiles.forEach(expectedFileName => {
      const found = mdFiles.some(f => {
        // Normalize path separators to forward slashes for comparison
        const normalized = f.replace(/\\/g, '/');
        return normalized.includes('mini-projects/mini-bank/') && f.includes(expectedFileName);
      });

      assert(
        found,
        `Expected mini-bank file ${expectedFileName} to be found in audit scope.\nFiles found: ${mdFiles
          .filter(f => f.includes('mini-bank'))
          .join('\n')}`
      );
    });
  });
});
