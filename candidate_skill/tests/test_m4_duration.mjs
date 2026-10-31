// test_m4_duration.mjs — M4 Flexible Duration & Runtime Intelligence regression tests
// Status: RESEARCH_ONLY — not approved for production

import { strict as assert } from 'node:assert';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  SPEAKING_RATES,
  SPEAKING_RATE_SET,
  getSpeakingRate,
  parseDuration,
  computeWordCount,
  resolveTargetWords,
  estimateRuntime,
  formatDurationDisplay,
  UNIVERSAL_WORD_RANGE,
  DEFAULT_RATE,
} from '../scripts/duration_engine.mjs';

import {
  validateInput,
  RESEARCH_STATES,
  CONTENT_TYPES,
} from '../scripts/validate.mjs';

import {
  loadStructure,
  getWritingPlan,
  normalizeSectionBudgets,
} from '../scripts/structure_loader.mjs';

import { getFormatDefinition } from '../scripts/format_registry.mjs';

let passed = 0;
let failed = 0;
const failures = [];

function test(id, description, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS ${id}: ${description}`);
  } catch (e) {
    failed++;
    failures.push({ id, description, error: e.message });
    console.log(`  FAIL ${id}: ${description}`);
    console.log(`        ${e.message}`);
  }
}

// ========================================================================
// TEST 1: 30 seconds at 150 WPM
// ========================================================================
console.log('\n=== TEST 1: 30 seconds at 150 WPM ===');

test('M4-001', '"30 seconds" parses correctly', () => {
  const d = parseDuration('30 seconds');
  assert.equal(d.valid, true);
  assert.equal(d.seconds, 30);
  assert.equal(d.unit, 'seconds');
  assert.ok(Math.abs(d.minutes - 0.5) < 0.001);
});

test('M4-002', '30 seconds at 150 WPM = 75 words', () => {
  const words = computeWordCount(0.5, SPEAKING_RATES.standard_narration);
  assert.equal(words, 75);
});

test('M4-003', 'resolveTargetWords with "30 seconds" duration', () => {
  const r = resolveTargetWords({ target_duration: '30 seconds' }, null);
  assert.equal(r.target_words, 75);
  assert.equal(r.source, 'computed_from_duration');
});

// ========================================================================
// TEST 2: 2 minutes at 150 WPM
// ========================================================================
console.log('\n=== TEST 2: 2 minutes at 150 WPM ===');

test('M4-004', '"2 minutes" parses correctly', () => {
  const d = parseDuration('2 minutes');
  assert.equal(d.valid, true);
  assert.equal(d.minutes, 2);
  assert.equal(d.seconds, 120);
});

test('M4-005', '2 minutes at 150 WPM = 300 words', () => {
  const r = resolveTargetWords({ target_duration: '2 minutes' }, null);
  assert.equal(r.target_words, 300);
});

// ========================================================================
// TEST 3: 45 minutes at 150 WPM
// ========================================================================
console.log('\n=== TEST 3: 45 minutes at 150 WPM ===');

test('M4-006', '"45 minutes" = 6750 words', () => {
  const r = resolveTargetWords({ target_duration: '45 minutes' }, null);
  assert.equal(r.target_words, 6750);
  assert.equal(r.source, 'computed_from_duration');
});

// ========================================================================
// TEST 4: 2 hours
// ========================================================================
console.log('\n=== TEST 4: 2 hours ===');

test('M4-007', '"2 hours" parses to 120 minutes', () => {
  const d = parseDuration('2 hours');
  assert.equal(d.valid, true);
  assert.equal(d.minutes, 120);
});

test('M4-008', '"2 hours" at 150 WPM = 18000 words', () => {
  const r = resolveTargetWords({ target_duration: '2 hours' }, null);
  assert.equal(r.target_words, 18000);
});

// ========================================================================
// TEST 5: Conversational, energetic and deliberate rates
// ========================================================================
console.log('\n=== TEST 5: Speaking rate profiles ===');

test('M4-009', 'Conversational rate = 170 WPM', () => {
  assert.equal(SPEAKING_RATES.conversational.wpm, 170);
});

test('M4-010', 'Energetic rate = 190 WPM', () => {
  assert.equal(SPEAKING_RATES.energetic.wpm, 190);
});

test('M4-011', 'Deliberate rate = 120 WPM', () => {
  assert.equal(SPEAKING_RATES.deliberate.wpm, 120);
});

test('M4-012', '10 minutes conversational = 1700 words', () => {
  const r = resolveTargetWords({ target_duration: '10 minutes', speaking_rate: 'conversational' }, null);
  assert.equal(r.target_words, 1700);
  assert.equal(r.speaking_rate.id, 'conversational');
});

test('M4-013', '10 minutes energetic = 1900 words', () => {
  const r = resolveTargetWords({ target_duration: '10 minutes', speaking_rate: 'energetic' }, null);
  assert.equal(r.target_words, 1900);
});

test('M4-014', '10 minutes deliberate = 1200 words', () => {
  const r = resolveTargetWords({ target_duration: '10 minutes', speaking_rate: 'deliberate' }, null);
  assert.equal(r.target_words, 1200);
});

// ========================================================================
// TEST 6: Explicit target_words precedence
// ========================================================================
console.log('\n=== TEST 6: target_words precedence ===');

test('M4-015', 'target_words takes precedence over target_duration', () => {
  const r = resolveTargetWords({ target_words: 5000, target_duration: '10 minutes' }, null);
  assert.equal(r.target_words, 5000);
  assert.equal(r.source, 'explicit_target_words');
});

test('M4-016', 'target_words takes precedence in validateInput', () => {
  const brief = {
    title: 'Precedence Test',
    niche: 'science',
    subject: 'Test',
    object: 'Test',
    mechanism: 'test',
    uncertainty: 'qualified',
    target_words: 4000,
    target_duration: '10 minutes',
  };
  const r = validateInput(brief);
  assert.equal(r.word_resolution.target_words, 4000);
  assert.equal(r.word_resolution.source, 'explicit_target_words');
});

// ========================================================================
// TEST 7: Malformed duration rejection
// ========================================================================
console.log('\n=== TEST 7: Malformed duration rejection ===');

test('M4-017', 'Negative duration rejected', () => {
  const d = parseDuration('-5 minutes');
  assert.equal(d.valid, false);
});

test('M4-018', 'Zero duration rejected', () => {
  const d = parseDuration('0 seconds');
  assert.equal(d.valid, false);
});

test('M4-019', 'NaN duration rejected', () => {
  const d = parseDuration('abc minutes');
  assert.equal(d.valid, false);
});

test('M4-020', 'Empty string rejected', () => {
  const d = parseDuration('');
  assert.equal(d.valid, false);
});

test('M4-021', 'Infinite duration rejected', () => {
  const d = parseDuration('Infinity hours');
  assert.equal(d.valid, false);
});

test('M4-022', 'Ambiguous format rejected', () => {
  const d = parseDuration('about ten');
  assert.equal(d.valid, false);
});

test('M4-023', 'Malformed duration produces HOLD in validateInput', () => {
  const brief = {
    title: 'Bad Duration',
    niche: 'science',
    subject: 'Test',
    object: 'Test',
    mechanism: 'test',
    uncertainty: 'qualified',
    target_duration: 'garbage',
  };
  const r = validateInput(brief);
  assert.ok(r.holds.some(h => h.detail.includes('Malformed duration')),
    'Malformed duration must produce a HOLD');
});

// ========================================================================
// TEST 8: Short-form 100-word brief
// ========================================================================
console.log('\n=== TEST 8: Short-form 100-word brief ===');

test('M4-024', 'Short-form with 100 words', () => {
  const brief = { format: 'short_form', target_words: 100 };
  const r = loadStructure(brief);
  assert.equal(r.success, true, 'Must succeed');
  assert.equal(r.structure.target_words, 100);
  assert.equal(r.structure.format_id, 'short_form');
  const sum = r.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
  assert.equal(sum, 100, `Section budgets must sum to 100, got ${sum}`);
});

// ========================================================================
// TEST 9: Long-form 15000-word custom format
// ========================================================================
console.log('\n=== TEST 9: Long-form 15000-word custom format ===');

test('M4-025', 'Custom format at 15000 words', () => {
  const brief = {
    format: 'custom',
    target_words: 15000,
    custom_format_spec: {
      name: 'Long Documentary',
      sections: [
        { name: 'Introduction', budget_percent: '8-12%' },
        { name: 'Act 1', budget_percent: '20-25%' },
        { name: 'Act 2', budget_percent: '25-30%' },
        { name: 'Act 3', budget_percent: '20-25%' },
        { name: 'Conclusion', budget_percent: '10-15%' },
      ],
    },
  };
  const r = loadStructure(brief);
  assert.equal(r.success, true, `Custom 15000 must succeed: ${r.hold ? r.hold.message : ''}`);
  assert.equal(r.structure.target_words, 15000);
  const sum = r.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
  assert.equal(sum, 15000, `Section budgets must sum to 15000, got ${sum}`);
});

// ========================================================================
// TEST 10: Legacy documentary compatibility
// ========================================================================
console.log('\n=== TEST 10: Legacy documentary compatibility ===');

test('M4-026', 'Documentary defaults to ~5250 words (format midpoint)', () => {
  const r = resolveTargetWords({}, { id: 'documentary', word_range: { min: 2500, max: 8000 } });
  assert.equal(r.target_words, 5250);
  assert.equal(r.source, 'format_default');
});

test('M4-027', 'Legacy brief with target_words=3000 preserves exactly', () => {
  const brief = {
    title: 'Legacy Doc',
    niche: 'N01',
    subject: 'Weather',
    object: 'Coast',
    mechanism: 'storms',
    uncertainty: 'qualified',
    target_words: 3000,
    niche_context: { issued_at: '2026-01-01', valid_until: '2026-12-31', reference_time: '2026-06-01' },
  };
  const r = validateInput(brief);
  assert.equal(r.word_resolution.target_words, 3000);
  assert.equal(r.word_resolution.source, 'explicit_target_words');
});

test('M4-028', 'Documentary ±5% tolerance preserved', () => {
  const brief = { format: 'documentary', target_words: 3000 };
  const r = loadStructure(brief);
  assert.equal(r.structure.spoken_word_budget_tolerance, 0.05);
});

// ========================================================================
// TEST 11: Format duration/word limits
// ========================================================================
console.log('\n=== TEST 11: Format constraints ===');

test('M4-029', 'Short-form 5000 words triggers warning', () => {
  const r = resolveTargetWords({ target_words: 5000 }, { id: 'short_form', word_range: { min: 50, max: 800 } });
  assert.ok(r.warnings.some(w => w.includes('short_form')));
});

test('M4-030', 'Universal range 50-50000 words', () => {
  assert.equal(UNIVERSAL_WORD_RANGE.min, 50);
  assert.equal(UNIVERSAL_WORD_RANGE.max, 50000);
});

test('M4-031', 'target_words below 50 rejected', () => {
  const r = resolveTargetWords({ target_words: 10 }, null);
  assert.ok(r.error, 'Must produce error for target_words below universal minimum');
});

test('M4-032', 'target_words above 50000 rejected', () => {
  const r = resolveTargetWords({ target_words: 60000 }, null);
  assert.ok(r.error);
});

// ========================================================================
// TEST 12: Platform duration restrictions
// ========================================================================
console.log('\n=== TEST 12: Platform duration ===');

test('M4-033', 'Format duration ranges available', () => {
  const doc = getFormatDefinition('documentary');
  assert.ok(doc.duration_range);
  assert.equal(doc.duration_range.min_minutes, 5);
  assert.equal(doc.duration_range.max_minutes, 45);
  const sf = getFormatDefinition('short_form');
  assert.ok(sf.duration_range);
  assert.equal(sf.duration_range.max_minutes, 3);
});

// ========================================================================
// TEST 13: Exact section-budget reconciliation
// ========================================================================
console.log('\n=== TEST 13: Exact section budgets ===');

test('M4-034', 'Section budgets sum exactly to target for 75 words (short_form)', () => {
  const brief = { format: 'short_form', target_words: 75 };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const sum = r.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
  assert.equal(sum, 75, `Must sum exactly, got ${sum}`);
});

test('M4-035', 'Section budgets sum exactly to target for 18000 words (documentary)', () => {
  const brief = { format: 'documentary', target_words: 18000 };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const sum = r.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
  assert.equal(sum, 18000, `Must sum exactly, got ${sum}`);
});

test('M4-036', 'Section budgets sum exactly for duration-computed target', () => {
  const brief = { format: 'explainer', target_duration: '7 minutes' };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const sum = r.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
  assert.equal(sum, r.structure.target_words, `Must sum exactly to ${r.structure.target_words}, got ${sum}`);
});

// ========================================================================
// TEST 14: Spoken narration runtime QA
// ========================================================================
console.log('\n=== TEST 14: Spoken narration runtime ===');

test('M4-037', 'estimateRuntime produces correct estimate', () => {
  const r = estimateRuntime(3000, SPEAKING_RATES.standard_narration);
  assert.equal(r.spoken_words, 3000);
  assert.equal(r.wpm, 150);
  assert.equal(r.estimated_minutes, 20);
  assert.ok(r.display.includes('20m'));
  assert.ok(r.note.toLowerCase().includes('estimate'));
});

test('M4-038', 'estimateRuntime with deliberate rate', () => {
  const r = estimateRuntime(1200, SPEAKING_RATES.deliberate);
  assert.equal(r.estimated_minutes, 10);
  assert.equal(r.wpm, 120);
});

test('M4-039', 'validateInput includes runtime_estimate in word_resolution', () => {
  const brief = {
    title: 'Runtime Test',
    niche: 'science',
    subject: 'Test',
    object: 'Test',
    mechanism: 'test',
    uncertainty: 'qualified',
    target_words: 3000,
  };
  const r = validateInput(brief);
  assert.ok(r.word_resolution.runtime_estimate);
  assert.equal(r.word_resolution.runtime_estimate.spoken_words, 3000);
  assert.equal(r.word_resolution.runtime_estimate.wpm, 150);
});

test('M4-040', 'loadStructure includes runtime_estimate', () => {
  const r = loadStructure({ format: 'documentary', target_words: 3000 });
  assert.ok(r.structure.runtime_estimate);
  assert.ok(r.structure.runtime_estimate.display);
});

// ========================================================================
// TEST 15: No user-input mutation
// ========================================================================
console.log('\n=== TEST 15: Input immutability ===');

test('M4-041', 'validateInput does not mutate original brief (duration fields)', () => {
  const brief = {
    niche: 'science',
    topic: 'Duration Test',
    target_duration: '10 minutes',
    speaking_rate: 'conversational',
  };
  const orig = { ...brief };
  validateInput(brief);
  assert.deepEqual(brief, orig, 'Original must not be mutated');
});

// ========================================================================
// TEST 16: No factual-generation gate regression
// ========================================================================
console.log('\n=== TEST 16: M3 safety gate intact ===');

test('M4-042', 'SUBMITTED still blocks factual generation', () => {
  const brief = {
    title: 'M3 Safety Check',
    niche: 'science',
    subject: 'Test',
    object: 'Test',
    mechanism: 'test',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1', author: 'Dr. Test', publisher: 'Journal', can_use_for_synthetic: true }],
    target_words: 3000,
  };
  const r = validateInput(brief);
  assert.equal(r.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED);
  assert.equal(r.m3_resolution.generation_permitted, false,
    'SUBMITTED must still block factual generation after M4');
});

test('M4-043', 'Creative content still works after M4', () => {
  const brief = {
    title: 'Creative Test',
    niche: 'domain:entertainment',
    subject: 'wizard',
    object: 'dragon',
    mechanism: 'magic',
    uncertainty: 'qualified',
    content_type: 'creative',
    target_words: 500,
  };
  const r = validateInput(brief);
  assert.equal(r.m3_resolution.generation_permitted, true);
});

test('M4-044', 'production_release_permitted still false', () => {
  const brief = {
    title: 'Prod Check',
    niche: 'science',
    subject: 'Test',
    object: 'Test',
    mechanism: 'test',
    uncertainty: 'qualified',
    target_words: 3000,
  };
  const r = validateInput(brief);
  assert.equal(r.m3_resolution.generation_readiness.production_release_permitted, false);
});

// ========================================================================
// TEST 17: Native/candidate synchronization
// ========================================================================
console.log('\n=== TEST 17: Sync verification ===');

test('M4-045', 'Duration engine exports are complete', () => {
  assert.ok(SPEAKING_RATES);
  assert.ok(SPEAKING_RATE_SET);
  assert.equal(typeof getSpeakingRate, 'function');
  assert.equal(typeof parseDuration, 'function');
  assert.equal(typeof computeWordCount, 'function');
  assert.equal(typeof resolveTargetWords, 'function');
  assert.equal(typeof estimateRuntime, 'function');
  assert.equal(typeof formatDurationDisplay, 'function');
});

test('M4-046', 'All four speaking rates are frozen', () => {
  assert.ok(Object.isFrozen(SPEAKING_RATES));
  assert.ok(Object.isFrozen(SPEAKING_RATES.standard_narration));
  assert.ok(Object.isFrozen(SPEAKING_RATES.conversational));
  assert.ok(Object.isFrozen(SPEAKING_RATES.energetic));
  assert.ok(Object.isFrozen(SPEAKING_RATES.deliberate));
});

test('M4-047', 'Duration re-exported through validate.mjs', async () => {
  const v = await import('../scripts/validate.mjs');
  assert.ok(v.SPEAKING_RATES);
  assert.ok(v.parseDuration);
  assert.ok(v.resolveTargetWords);
  assert.ok(v.estimateRuntime);
});

// ========================================================================
// PARSE COVERAGE: Additional duration formats
// ========================================================================
console.log('\n=== BONUS: Parse coverage ===');

test('M4-048', '"30 sec" parses', () => {
  const d = parseDuration('30 sec');
  assert.equal(d.valid, true);
  assert.equal(d.seconds, 30);
});

test('M4-049', '"1.5 hours" = 90 minutes', () => {
  const d = parseDuration('1.5 hours');
  assert.equal(d.valid, true);
  assert.equal(d.minutes, 90);
});

test('M4-050', '"0.5 min" = 30 seconds', () => {
  const d = parseDuration('0.5 min');
  assert.equal(d.valid, true);
  assert.equal(d.seconds, 30);
});

test('M4-051', 'formatDurationDisplay formats correctly', () => {
  assert.ok(formatDurationDisplay(0.5).includes('30'));
  assert.ok(formatDurationDisplay(10).includes('10'));
  assert.ok(formatDurationDisplay(90).includes('1h'));
});

test('M4-052', 'Unknown speaking_rate falls back with warning', () => {
  const r = resolveTargetWords({ target_duration: '10 minutes', speaking_rate: 'unknown_rate' }, null);
  assert.equal(r.target_words, 1500);
  assert.ok(r.warnings.some(w => w.includes('unknown_rate')));
});

// ========================================================================
// 5 SYNTHETIC DEMONSTRATIONS
// ========================================================================
console.log('\n=== Synthetic Demonstrations ===');

const demos = [];

// Demo 1: 30-second social media reel
test('M4-DEMO-1', 'Demo: 30-second social reel at standard rate', () => {
  const brief = { format: 'short_form', target_duration: '30 seconds' };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: '30-second social media reel',
    target_duration: '30 seconds',
    speaking_rate: r.structure.speaking_rate.label,
    wpm: r.structure.speaking_rate.wpm,
    target_words: r.structure.target_words,
    runtime_estimate: r.structure.runtime_estimate.display,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
    budget_sum: r.structure.sections.reduce((s, sec) => s + sec.target_words, 0),
  };
  assert.equal(demo.budget_sum, demo.target_words);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 2: 10-minute explainer at conversational rate
test('M4-DEMO-2', 'Demo: 10-minute explainer conversational', () => {
  const brief = { format: 'explainer', target_duration: '10 minutes', speaking_rate: 'conversational' };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: '10-minute explainer at conversational pace',
    target_duration: '10 minutes',
    speaking_rate: r.structure.speaking_rate.label,
    wpm: r.structure.speaking_rate.wpm,
    target_words: r.structure.target_words,
    runtime_estimate: r.structure.runtime_estimate.display,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
    budget_sum: r.structure.sections.reduce((s, sec) => s + sec.target_words, 0),
  };
  assert.equal(demo.budget_sum, demo.target_words);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 3: 45-minute documentary at deliberate pace
test('M4-DEMO-3', 'Demo: 45-minute documentary deliberate', () => {
  const brief = { format: 'documentary', target_duration: '45 minutes', speaking_rate: 'deliberate' };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: '45-minute documentary at deliberate pace',
    target_duration: '45 minutes',
    speaking_rate: r.structure.speaking_rate.label,
    wpm: r.structure.speaking_rate.wpm,
    target_words: r.structure.target_words,
    runtime_estimate: r.structure.runtime_estimate.display,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
    budget_sum: r.structure.sections.reduce((s, sec) => s + sec.target_words, 0),
  };
  assert.equal(demo.budget_sum, demo.target_words);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 4: 2-hour custom long-form at energetic rate
test('M4-DEMO-4', 'Demo: 2-hour custom long-form energetic', () => {
  const brief = {
    format: 'custom',
    target_duration: '2 hours',
    speaking_rate: 'energetic',
    custom_format_spec: {
      name: 'Feature Documentary',
      sections: [
        { name: 'Prologue', budget_percent: '5-8%' },
        { name: 'Act One', budget_percent: '20-25%' },
        { name: 'Act Two A', budget_percent: '20-25%' },
        { name: 'Midpoint', budget_percent: '8-12%' },
        { name: 'Act Two B', budget_percent: '15-20%' },
        { name: 'Act Three', budget_percent: '12-18%' },
        { name: 'Epilogue', budget_percent: '5-8%' },
      ],
    },
  };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: '2-hour feature documentary at energetic pace',
    target_duration: '2 hours',
    speaking_rate: r.structure.speaking_rate.label,
    wpm: r.structure.speaking_rate.wpm,
    target_words: r.structure.target_words,
    runtime_estimate: r.structure.runtime_estimate.display,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
    budget_sum: r.structure.sections.reduce((s, sec) => s + sec.target_words, 0),
  };
  assert.equal(demo.budget_sum, demo.target_words);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 5: Explicit 3000 words legacy documentary
test('M4-DEMO-5', 'Demo: Legacy 3000-word documentary', () => {
  const brief = { format: 'documentary', target_words: 3000 };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: 'Legacy 3000-word documentary (explicit target_words)',
    target_words: r.structure.target_words,
    speaking_rate: r.structure.speaking_rate.label,
    wpm: r.structure.speaking_rate.wpm,
    runtime_estimate: r.structure.runtime_estimate.display,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
    budget_sum: r.structure.sections.reduce((s, sec) => s + sec.target_words, 0),
  };
  assert.equal(demo.budget_sum, 3000);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// ========================================================================
// SUMMARY
// ========================================================================
console.log('\n' + '='.repeat(60));
console.log(`  Total: ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\n  Failures:');
  for (const f of failures) {
    console.log(`    ${f.id}: ${f.description}`);
    console.log(`      ${f.error}`);
  }
}
console.log('='.repeat(60));

// Write receipt
const __dirname = dirname(fileURLToPath(import.meta.url));
const receipt = {
  suite: 'M4 Flexible Duration & Runtime Intelligence',
  timestamp: new Date().toISOString(),
  total: passed + failed,
  passed,
  failed,
  failures,
  demonstrations: demos,
};
const receiptPath = join(__dirname, 'M4_DURATION_RECEIPT.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
console.log(`\nReceipt: ${receiptPath}`);

process.exit(failed > 0 ? 1 : 0);
