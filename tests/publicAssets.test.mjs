import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve(process.cwd(), 'public');

test('Public Assets - Logo and emblem assets exist and are non-empty', () => {
  const requiredImages = [
    'logo.png',
    'logo-icon.png',
    'favicon.ico',
    'favicon.svg',
    'favicon-32x32.png',
    'favicon-16x16.png',
    'apple-touch-icon.png',
    'og-image.jpg'
  ];

  for (const filename of requiredImages) {
    const filePath = path.join(publicDir, filename);
    assert.ok(fs.existsSync(filePath), `Asset ${filename} must exist on disk`);
    const stats = fs.statSync(filePath);
    assert.ok(stats.size > 0, `Asset ${filename} must not be empty (size: ${stats.size})`);
  }
});

test('Public Assets - Favicon SVG contains no solid white rectangle background', () => {
  const svgPath = path.join(publicDir, 'favicon.svg');
  const content = fs.readFileSync(svgPath, 'utf-8');
  assert.ok(!content.includes('fill="#ffffff"'), 'Favicon SVG must not contain white background rect');
  assert.ok(content.includes('<svg'), 'Favicon SVG must be a valid SVG document');
  assert.ok(content.includes('data:image/png;base64,'), 'Favicon SVG embeds high-res transparent emblem');
});

test('Public Assets - Robots.txt and Sitemap.xml exist', () => {
  const robots = path.join(publicDir, 'robots.txt');
  const sitemap = path.join(publicDir, 'sitemap.xml');

  assert.ok(fs.existsSync(robots), 'robots.txt must exist');
  assert.ok(fs.existsSync(sitemap), 'sitemap.xml must exist');

  const robotsContent = fs.readFileSync(robots, 'utf-8');
  assert.ok(robotsContent.includes('User-agent: *'), 'robots.txt allows indexing');
  assert.ok(robotsContent.includes('Sitemap:'), 'robots.txt points to sitemap');
});

