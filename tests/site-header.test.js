import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('site-header.js - NAV_ITEMS data structure', async (t) => {
  // Read the site-header.js file
  const headerPath = path.join(__dirname, '../assets/site-header.js');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  // Extract NAV_ITEMS from the file using regex
  const navItemsMatch = headerContent.match(/var NAV_ITEMS = \[([\s\S]*?)\];/);
  assert(navItemsMatch, 'NAV_ITEMS array found in site-header.js');

  const navItemsStr = `[${navItemsMatch[1]}]`;

  // Safely parse the NAV_ITEMS array
  // eslint-disable-next-line no-eval
  const NAV_ITEMS = eval(navItemsStr);

  await t.test('NAV_ITEMS has 4 items', () => {
    assert.strictEqual(NAV_ITEMS.length, 4, 'Expected 4 navigation items');
  });

  await t.test('NAV_ITEMS order: home, knowledge, projects, posts', () => {
    assert.strictEqual(NAV_ITEMS[0].key, 'home', 'First item should be home');
    assert.strictEqual(NAV_ITEMS[1].key, 'knowledge', 'Second item should be knowledge');
    assert.strictEqual(NAV_ITEMS[2].key, 'projects', 'Third item should be projects');
    assert.strictEqual(NAV_ITEMS[3].key, 'posts', 'Fourth item should be posts');
  });

  await t.test('projects entry has correct properties', () => {
    const projectsItem = NAV_ITEMS.find(item => item.key === 'projects');
    assert(projectsItem, 'projects entry exists');
    assert.strictEqual(projectsItem.key, 'projects', 'key should be "projects"');
    assert.strictEqual(projectsItem.href, 'projects.html', 'href should be "projects.html"');
    assert.strictEqual(projectsItem.label, 'Dự án', 'label should be "Dự án"');
  });

  await t.test('all NAV_ITEMS have required properties', () => {
    NAV_ITEMS.forEach((item, index) => {
      assert(item.key, `Item ${index} has key property`);
      assert(item.href, `Item ${index} has href property`);
      assert(item.label, `Item ${index} has label property`);
      assert.strictEqual(typeof item.key, 'string', `Item ${index} key is string`);
      assert.strictEqual(typeof item.href, 'string', `Item ${index} href is string`);
      assert.strictEqual(typeof item.label, 'string', `Item ${index} label is string`);
    });
  });
});

test('projects.html - page structure', async (t) => {
  const projectsPath = path.join(__dirname, '../projects.html');
  const projectsContent = fs.readFileSync(projectsPath, 'utf-8');

  await t.test('has correct page title', () => {
    assert(projectsContent.includes('<title>Dự án | CORNDEVs</title>'),
      'projects.html has correct title');
  });

  await t.test('includes required stylesheets and scripts', () => {
    assert(projectsContent.includes('assets/theme.js'), 'theme.js included');
    assert(projectsContent.includes('https://cdn.tailwindcss.com'), 'Tailwind CDN included');
    assert(projectsContent.includes('assets/theme.css'), 'theme.css included');
    assert(projectsContent.includes('assets/ambient-reveal.css'), 'ambient-reveal.css included');
    assert(projectsContent.includes('assets/ambient-reveal.js'), 'ambient-reveal.js included');
    assert(projectsContent.includes('assets/tailwind-config.js'), 'tailwind-config.js included');
    assert(projectsContent.includes('assets/site-header.js'), 'site-header.js included');
  });

  await t.test('initializes SiteHeader with projects as active', () => {
    assert(projectsContent.includes("active: 'projects'"),
      'SiteHeader initialized with active: projects');
  });

  await t.test('has back navigation to homepage', () => {
    assert(projectsContent.includes('index.html'),
      'Has link back to homepage');
    assert(projectsContent.includes('Về trang chủ'),
      'Has Vietnamese "back to home" text');
  });

  await t.test('has mini-bank project tile', () => {
    assert(projectsContent.includes('Mini Bank') || projectsContent.includes('Mini-Bank'),
      'Has Mini Bank title');
    assert(projectsContent.includes('posts.html?category=mini-bank'),
      'Mini-bank tile links to posts with mini-bank category filter');
  });

  await t.test('has reveal animation attributes', () => {
    assert(projectsContent.includes('data-reveal-up'),
      'Has reveal animation attributes for animations');
  });

  await t.test('has ambient background element', () => {
    assert(projectsContent.includes('ambient-bg'),
      'Has ambient-bg element for background animations');
  });

  await t.test('uses consistent styling classes', () => {
    assert(projectsContent.includes('technical-border'),
      'Uses technical-border class');
    assert(projectsContent.includes('technical-border-hover'),
      'Uses technical-border-hover class');
    assert(projectsContent.includes('glass-card'),
      'Uses glass-card class');
  });
});

test('nav structure - positions consistency', async (t) => {
  const headerPath = path.join(__dirname, '../assets/site-header.js');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  // Verify the nav initialization comment mentions the active options
  await t.test('SiteHeader.init handles projects option', () => {
    assert(headerContent.includes("options.active === 'reader'"),
      'SiteHeader init handles different active states');
  });

  await t.test('navLinkHtml function exists', () => {
    assert(headerContent.includes('function navLinkHtml(item, isActive)'),
      'navLinkHtml function is defined');
  });
});
