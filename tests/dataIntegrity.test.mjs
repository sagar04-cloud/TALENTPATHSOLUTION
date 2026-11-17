import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PROGRAMS, INITIAL_NEWS, INITIAL_ENQUIRIES } from '../src/data/initialData.ts';
import { sortPrograms, getProgramRank } from '../src/services/programService.ts';

test('Data Integrity - INITIAL_PROGRAMS has valid structure', () => {
  assert.ok(INITIAL_PROGRAMS.length >= 8, 'At least 8 foundational programs exist');

  const ids = new Set();
  const slugs = new Set();

  for (const prog of INITIAL_PROGRAMS) {
    assert.ok(prog.id, 'Program must have ID');
    assert.ok(!ids.has(prog.id), `Program ID ${prog.id} must be unique`);
    ids.add(prog.id);

    assert.ok(prog.slug, 'Program must have slug');
    assert.ok(!slugs.has(prog.slug), `Program slug ${prog.slug} must be unique`);
    slugs.add(prog.slug);

    assert.ok(prog.title.length > 3, 'Program title must be descriptive');
    assert.ok(['sslc_puc', 'undergraduate', 'postgraduate'].includes(prog.category), 'Valid category');
    assert.ok(prog.duration.length > 0, 'Program must have duration');
  }
});

test('Data Integrity - sortPrograms respects hierarchy order', () => {
  const sorted = sortPrograms(INITIAL_PROGRAMS);
  const ranks = sorted.map(getProgramRank);

  for (let i = 0; i < ranks.length - 1; i++) {
    assert.ok(ranks[i] <= ranks[i + 1], `Rank at index ${i} (${ranks[i]}) should be <= next rank (${ranks[i + 1]})`);
  }

  assert.equal(sorted[0].id, 'prog-sslc', 'SSLC is ranked first');
  assert.equal(sorted[1].id, 'prog-puc', 'PUC is ranked second');
});

test('Data Integrity - INITIAL_NEWS has valid article entries', () => {
  assert.ok(INITIAL_NEWS.length >= 3, 'At least 3 news articles exist');
  for (const article of INITIAL_NEWS) {
    assert.ok(article.id, 'Article must have ID');
    assert.ok(article.slug, 'Article must have slug');
    assert.ok(article.title.length > 5, 'Article must have title');
    assert.ok(article.excerpt.length > 10, 'Article must have excerpt');
    assert.ok(article.body.length > 50, 'Article must have body content');
    assert.ok(article.is_published, 'Default articles should be published');
  }
});

test('Data Integrity - INITIAL_ENQUIRIES has valid schema samples', () => {
  assert.ok(INITIAL_ENQUIRIES.length >= 3, 'Default enquiry samples exist');
  for (const enq of INITIAL_ENQUIRIES) {
    assert.ok(enq.id, 'Enquiry must have ID');
    assert.ok(enq.full_name, 'Enquiry must have name');
    assert.ok(enq.email.includes('@'), 'Enquiry must have email');
    assert.ok(enq.service_type, 'Enquiry must have service type');
  }
});
