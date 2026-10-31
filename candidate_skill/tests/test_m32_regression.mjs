// test_m32_regression.mjs — M3.2 Final Safety & Consistency Gate regression tests
// Status: RESEARCH_ONLY — not approved for production
// 12 specified test cases covering all 4 fixes

import { strict as assert } from 'node:assert';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  CONTENT_TYPES,
  RESEARCH_MODES,
  RESEARCH_STATES,
  CLAIM_TYPES,
  inferContentType,
  inferResearchMode,
  getEvidencePolicy,
  resolveM3,
  assessGenerationReadiness,
  deriveResearchState,
  tagClaim,
  tagClaimsInSection,
} from '../scripts/content_type_engine.mjs';

import { validateInput } from '../scripts/validate.mjs';

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
// TEST 1: Evidence present but unverified (FIX 1)
// Client-provided evidence gets SUBMITTED, not VERIFIED
// ========================================================================
console.log('\n=== TEST 1: Evidence present but unverified ===');

test('M32-001', 'client_provided + evidence → SUBMITTED not VERIFIED', () => {
  const brief = { evidence: [{ id: 'E-1', text: 'Some claim' }] };
  const state = deriveResearchState(brief, RESEARCH_MODES.CLIENT_PROVIDED, false);
  assert.equal(state, RESEARCH_STATES.SUBMITTED,
    `Expected SUBMITTED, got ${state}`);
  assert.notEqual(state, RESEARCH_STATES.VERIFIED,
    'Must NOT be VERIFIED — evidence is submitted, not independently verified');
});

test('M32-002', 'SUBMITTED state exists in RESEARCH_STATES enum', () => {
  assert.ok(RESEARCH_STATES.SUBMITTED, 'SUBMITTED must be defined');
  assert.equal(RESEARCH_STATES.SUBMITTED, 'submitted');
});

test('M32-003', 'validateInput with client evidence → research_state is submitted', () => {
  const brief = {
    title: 'Test Documentary',
    niche: 'science',
    subject: 'Gravity',
    object: 'Earth',
    mechanism: 'mass attraction',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1', claim: 'Gravity exists', source_url: 'https://example.com' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED,
    `Expected SUBMITTED, got ${result.m3_resolution.research_state}`);
});

test('M32-004', 'Evidence separation: submitted ≠ schema_valid ≠ verified', () => {
  const brief = { evidence: [{ id: 'E-1' }] };
  const state = deriveResearchState(brief, RESEARCH_MODES.CLIENT_PROVIDED, false);
  assert.equal(state, RESEARCH_STATES.SUBMITTED);
  assert.notEqual(state, RESEARCH_STATES.VERIFIED);
  assert.notEqual(state, RESEARCH_STATES.PARTIALLY_VERIFIED);
});

// ========================================================================
// TEST 2: Verified vs pending distinction (FIX 1 + FIX 2)
// ========================================================================
console.log('\n=== TEST 2: Verified vs pending distinction ===');

test('M32-005', 'VERIFIED state only from explicit verified path (not client_provided)', () => {
  const states = [
    { mode: RESEARCH_MODES.CLIENT_PROVIDED, ev: true, prov: false },
    { mode: RESEARCH_MODES.CLIENT_PROVIDED, ev: true, prov: true },
    { mode: RESEARCH_MODES.CLIENT_PROVIDED, ev: false, prov: false },
  ];
  for (const s of states) {
    const brief = s.ev ? { evidence: [{ id: 'E-1' }] } : { evidence: [] };
    const state = deriveResearchState(brief, s.mode, s.prov);
    assert.notEqual(state, RESEARCH_STATES.VERIFIED,
      `client_provided must never produce VERIFIED (ev=${s.ev}, prov=${s.prov})`);
  }
});

test('M32-006', 'RESEARCH_PENDING only when system_assisted + no evidence + provider available', () => {
  const brief = { evidence: [] };
  const state = deriveResearchState(brief, RESEARCH_MODES.SYSTEM_ASSISTED, true);
  assert.equal(state, RESEARCH_STATES.RESEARCH_PENDING);
});

test('M32-007', 'PARTIALLY_VERIFIED when system_assisted + evidence present', () => {
  const brief = { evidence: [{ id: 'E-1' }] };
  const state = deriveResearchState(brief, RESEARCH_MODES.SYSTEM_ASSISTED, false);
  assert.equal(state, RESEARCH_STATES.PARTIALLY_VERIFIED);
});

// ========================================================================
// TEST 3: Research pending with provider (FIX 2)
// ========================================================================
console.log('\n=== TEST 3: Research pending with provider ===');

test('M32-008', 'system_assisted + provider available + no evidence → RESEARCH_PENDING, generation blocked', () => {
  const brief = { evidence: [] };
  const state = deriveResearchState(brief, RESEARCH_MODES.SYSTEM_ASSISTED, true);
  assert.equal(state, RESEARCH_STATES.RESEARCH_PENDING);

  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, state, true);
  assert.equal(readiness.factual_generation_permitted, false,
    'RESEARCH_PENDING must NOT permit factual generation — provider available ≠ research complete');
  assert.ok(readiness.blockers.length > 0, 'Must have blockers explaining pending state');
});

// ========================================================================
// TEST 4: No provider available (FIX 2)
// ========================================================================
console.log('\n=== TEST 4: No provider available ===');

test('M32-009', 'system_assisted + no provider + no evidence → UNRESOURCED, generation blocked', () => {
  const brief = { evidence: [] };
  const state = deriveResearchState(brief, RESEARCH_MODES.SYSTEM_ASSISTED, false);
  assert.equal(state, RESEARCH_STATES.UNRESOURCED);

  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, state, false);
  assert.equal(readiness.factual_generation_permitted, false,
    'UNRESOURCED must block factual generation');
  assert.ok(readiness.blockers.some(b => b.includes('provider')),
    'Blockers must mention provider unavailability');
});

// ========================================================================
// TEST 5: Offline fixture evidence (FIX 1 + FIX 2)
// ========================================================================
console.log('\n=== TEST 5: Offline fixture evidence ===');

test('M32-010', 'Offline fixture evidence treated as submitted, not verified', () => {
  const brief = {
    title: 'Test Fixture Doc',
    niche: 'science',
    subject: 'Physics',
    object: 'Waves',
    mechanism: 'propagation',
    uncertainty: 'qualified',
    evidence: [{ id: 'FIXTURE-001', source_url: 'fixture://offline', provenance: 'offline_fixture' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED,
    'Fixture evidence must be SUBMITTED, not VERIFIED');
  assert.equal(result.m3_resolution.research_mode, RESEARCH_MODES.CLIENT_PROVIDED,
    'Brief with evidence → client_provided');
});

// ========================================================================
// TEST 6: Contradictory generation-permission prevention (FIX 2)
// ========================================================================
console.log('\n=== TEST 6: Contradictory generation-permission prevention ===');

test('M32-011', 'generation_permitted and generation_readiness.factual_generation_permitted must agree', () => {
  const brief = {
    title: 'Factual Doc',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(
    result.m3_resolution.generation_permitted,
    result.m3_resolution.generation_readiness.factual_generation_permitted,
    'Top-level generation_permitted must derive from generation_readiness.factual_generation_permitted'
  );
});

test('M32-012', 'All blocking holds prevent generation even when research is ready', () => {
  const brief = {
    title: 'Quarantined Source Doc',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    evidence: [{ id: 'K029', claim: 'quarantined claim' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.ok(result.holds.length > 0, 'Quarantined source must produce holds');
  assert.equal(result.m3_resolution.generation_permitted, false,
    'Holds must block generation even when evidence is present');
  assert.equal(result.m3_resolution.generation_readiness.factual_generation_permitted, false,
    'Readiness gate must also block');
});

test('M32-013', 'FAILED research state blocks generation', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.FAILED, false);
  assert.equal(readiness.factual_generation_permitted, false,
    'FAILED state must block factual generation');
});

test('M32-014', 'PARTIALLY_VERIFIED blocks generation', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.PARTIALLY_VERIFIED, true);
  assert.equal(readiness.factual_generation_permitted, false,
    'PARTIALLY_VERIFIED must block — some claims still lack evidence');
});

test('M32-015', 'NOT_STARTED blocks generation for factual content', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.NOT_STARTED, false);
  assert.equal(readiness.factual_generation_permitted, false,
    'NOT_STARTED with evidence_required must block generation');
});

// ========================================================================
// TEST 7: New brief without title (FIX 3)
// ========================================================================
console.log('\n=== TEST 7: New brief without title ===');

test('M32-016', 'New-style brief without title passes with provisional title', () => {
  const brief = {
    niche: 'science',
    topic: 'Quantum Entanglement',
    audience: 'general',
    language: 'en',
    format: 'documentary',
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.ok(result.provisional_title, 'Must produce a provisional title');
  assert.ok(result.provisional_title.includes('Quantum Entanglement'),
    'Provisional title must derive from topic');
  assert.ok(result.provisional_title.startsWith('[Provisional]'),
    'Provisional title must be clearly marked');
  const titleHold = result.holds.find(h =>
    h.type === 'HOLD_MISSING_IDENTITY' && h.detail.includes('title')
  );
  assert.ok(!titleHold, 'Must NOT hold for missing title on new-style brief');
});

test('M32-017', 'New-style brief with title does not generate provisional', () => {
  const brief = {
    niche: 'science',
    topic: 'Quantum Entanglement',
    title: 'The Spooky Action',
    audience: 'general',
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.provisional_title, undefined,
    'Must NOT produce provisional_title when title is provided');
});

test('M32-018', 'New-style brief needs niche and topic', () => {
  const brief = {
    topic: 'Quantum Entanglement',
    audience: 'general',
  };
  const result = validateInput(brief);
  const missingHold = result.holds.find(h =>
    h.type === 'HOLD_MISSING_IDENTITY' && h.detail.includes('niche')
  );
  assert.ok(missingHold, 'Missing niche must produce a hold');
});

// ========================================================================
// TEST 8: Original input immutability (FIX 3)
// ========================================================================
console.log('\n=== TEST 8: Original input immutability ===');

test('M32-019', 'validateInput does not mutate the original input object', () => {
  const brief = {
    niche: 'science',
    topic: 'Dark Matter',
    audience: 'general',
    target_words: 3000,
  };
  const originalKeys = Object.keys(brief).sort();
  const originalTitle = brief.title;
  const originalUncertainty = brief.uncertainty;

  validateInput(brief);

  assert.deepEqual(Object.keys(brief).sort(), originalKeys,
    'Input object keys must not change');
  assert.equal(brief.title, originalTitle,
    'Input title must not be mutated');
  assert.equal(brief.uncertainty, originalUncertainty,
    'Input uncertainty must not be mutated');
});

test('M32-020', 'Provisional title added to workingBrief but not to original', () => {
  const brief = {
    niche: 'science',
    topic: 'Neutrinos',
    audience: 'general',
    target_words: 3000,
  };
  assert.equal(brief.title, undefined, 'Pre-condition: no title');
  const result = validateInput(brief);
  assert.equal(brief.title, undefined, 'Original must still have no title');
  assert.ok(result.provisional_title, 'Result must have provisional_title');
});

// ========================================================================
// TEST 9: Ambiguous factual in creative section (FIX 4)
// ========================================================================
console.log('\n=== TEST 9: Ambiguous factual in creative section ===');

test('M32-021', 'Ambiguous claim in creative section → AMBIGUOUS with requires_review, NOT auto-fictional', () => {
  const claims = [
    { text: 'The sunset was beautiful over the ancient city' },
  ];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.CREATIVE);
  const tag = tagged[0].tag;
  assert.equal(tag.type, CLAIM_TYPES.AMBIGUOUS,
    `Expected AMBIGUOUS, got ${tag.type} — must NOT auto-classify as fictional`);
  assert.equal(tag.requires_review, true,
    'Ambiguous claims in creative sections must require review');
});

test('M32-022', 'Factual claim in creative section still requires evidence', () => {
  const claims = [
    { text: 'According to a 2023 study, the population increased by 15%' },
  ];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.CREATIVE);
  assert.equal(tagged[0].tag.type, CLAIM_TYPES.FACTUAL,
    'Factual indicators in creative section must still be tagged factual');
  assert.equal(tagged[0].tag.requires_evidence, true);
});

test('M32-023', 'Creative claim in creative section → creative element', () => {
  const claims = [
    { text: 'Imagine a world where gravity works in reverse' },
  ];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.CREATIVE);
  assert.equal(tagged[0].tag.type, CLAIM_TYPES.CREATIVE);
});

test('M32-024', 'tagClaim standalone ambiguous → requires_review: true', () => {
  const tag = tagClaim('The old building stood at the corner of the street');
  assert.equal(tag.type, CLAIM_TYPES.AMBIGUOUS);
  assert.equal(tag.requires_review, true,
    'Standalone ambiguous claim must have requires_review');
});

test('M32-025', 'High-risk domain in creative section → factual override', () => {
  const claims = [
    { text: 'This supplement cures all diseases' },
  ];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.CREATIVE, { health: true });
  assert.equal(tagged[0].tag.type, CLAIM_TYPES.FACTUAL,
    'High-risk domain must override creative section default');
  assert.equal(tagged[0].tag.requires_evidence, true);
});

// ========================================================================
// TEST 10: Legacy documentary compatibility (FIX 3)
// ========================================================================
console.log('\n=== TEST 10: Legacy documentary compatibility ===');

test('M32-026', 'Legacy brief (subject/object/mechanism) still requires title', () => {
  const brief = {
    niche: 'science',
    subject: 'Gravity',
    object: 'Earth',
    mechanism: 'mass attraction',
    uncertainty: 'qualified',
    target_words: 3000,
  };
  const result = validateInput(brief);
  const titleHold = result.holds.find(h =>
    h.type === 'HOLD_MISSING_IDENTITY' && h.detail.includes('title')
  );
  assert.ok(titleHold, 'Legacy brief MUST require title');
});

test('M32-027', 'Legacy brief with all fields passes topic intake', () => {
  const brief = {
    title: 'Gravity Explained',
    niche: 'science',
    subject: 'Gravity',
    object: 'Earth',
    mechanism: 'mass attraction',
    uncertainty: 'qualified',
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.stages.topic_intake, 'PASS');
  assert.equal(result.provisional_title, undefined,
    'Legacy brief must not get provisional_title');
});

test('M32-028', 'Legacy brief with evidence → SUBMITTED (consistent with FIX 1)', () => {
  const brief = {
    title: 'Gravity Explained',
    niche: 'science',
    subject: 'Gravity',
    object: 'Earth',
    mechanism: 'mass attraction',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED,
    'Legacy brief with evidence must also get SUBMITTED, not VERIFIED');
});

// ========================================================================
// TEST 11: Native/candidate sync verification
// ========================================================================
console.log('\n=== TEST 11: Native/candidate sync ===');

test('M32-029', 'RESEARCH_STATES.SUBMITTED is exported and accessible', () => {
  assert.ok(RESEARCH_STATES.SUBMITTED !== undefined, 'SUBMITTED must be exported');
  assert.ok(Object.isFrozen(RESEARCH_STATES), 'RESEARCH_STATES must be frozen');
});

test('M32-030', 'assessGenerationReadiness is exported and callable', () => {
  assert.equal(typeof assessGenerationReadiness, 'function');
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.CREATIVE) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.NOT_STARTED, false);
  assert.ok(readiness.factual_generation_permitted !== undefined);
});

test('M32-031', 'tagClaimsInSection handles AMBIGUOUS branch explicitly', () => {
  const claims = [{ text: 'An ordinary sentence about nothing special' }];
  const creative = tagClaimsInSection(claims, CONTENT_TYPES.CREATIVE);
  const hybrid = tagClaimsInSection(claims, CONTENT_TYPES.HYBRID);
  if (creative[0].tag.type === CLAIM_TYPES.AMBIGUOUS) {
    assert.equal(creative[0].tag.requires_review, true,
      'Creative section AMBIGUOUS must have requires_review');
    assert.ok(creative[0].tag.reason.includes('review'),
      'Reason must mention review');
  }
  if (hybrid[0].tag.type === CLAIM_TYPES.AMBIGUOUS) {
    assert.equal(hybrid[0].tag.requires_review, true,
      'Hybrid section AMBIGUOUS from tagClaim must also have requires_review');
  }
});

// ========================================================================
// TEST 12: No production/rights regression
// ========================================================================
console.log('\n=== TEST 12: No production/rights regression ===');

test('M32-032', 'production_release_permitted always false (RESEARCH_ONLY)', () => {
  const states = [
    RESEARCH_STATES.VERIFIED,
    RESEARCH_STATES.SUBMITTED,
    RESEARCH_STATES.NOT_STARTED,
    RESEARCH_STATES.RESEARCH_PENDING,
    RESEARCH_STATES.FAILED,
  ];
  for (const s of states) {
    const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
    const readiness = assessGenerationReadiness(m3Res, s, true);
    assert.equal(readiness.production_release_permitted, false,
      `production_release_permitted must be false for state ${s}`);
  }
});

test('M32-033', 'request_release still triggers HOLD_NOT_APPROVED', () => {
  const brief = {
    title: 'Test Doc',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    request_release: true,
    target_words: 3000,
  };
  const result = validateInput(brief);
  const releaseHold = result.holds.find(h =>
    h.type === 'HOLD_NOT_APPROVED' && h.detail.includes('request_release')
  );
  assert.ok(releaseHold, 'request_release must still produce NOT_APPROVED hold');
});

test('M32-034', 'request_claude_transfer still triggers HOLD_NOT_APPROVED', () => {
  const brief = {
    title: 'Test Doc',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    request_claude_transfer: true,
    target_words: 3000,
  };
  const result = validateInput(brief);
  const transferHold = result.holds.find(h =>
    h.type === 'HOLD_NOT_APPROVED' && h.detail.includes('request_claude_transfer')
  );
  assert.ok(transferHold, 'request_claude_transfer must still produce NOT_APPROVED hold');
});

test('M32-035', 'Creative content without evidence → generation permitted (no evidence required)', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.CREATIVE) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.NOT_STARTED, false);
  assert.equal(readiness.factual_generation_permitted, true,
    'Creative content needs no evidence — generation allowed');
  assert.equal(readiness.production_release_permitted, false,
    'But production release still blocked');
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
  suite: 'M3.2 Final Safety & Consistency Gate',
  timestamp: new Date().toISOString(),
  total: passed + failed,
  passed,
  failed,
  failures,
  covers: [
    'FIX 1: Evidence SUBMITTED not VERIFIED',
    'FIX 2: Single authoritative generation gate',
    'FIX 3: Simple client brief compatibility + input immutability',
    'FIX 4: Hybrid claim safety — AMBIGUOUS with requires_review',
  ],
};
const receiptPath = join(__dirname, 'M32_REGRESSION_RECEIPT.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
console.log(`\nReceipt: ${receiptPath}`);

process.exit(failed > 0 ? 1 : 0);
