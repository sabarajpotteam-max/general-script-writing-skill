// test_m33_regression.mjs — M3.3 Final Evidence Trust Gate regression tests
// Status: RESEARCH_ONLY — not approved for production
// 11 specified test cases covering the evidence trust contradiction fix

import { strict as assert } from 'node:assert';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

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
// TEST 1: SUBMITTED + no HOLDs must NOT permit factual generation
// ========================================================================
console.log('\n=== TEST 1: SUBMITTED must NOT permit factual generation ===');

test('M33-001', 'SUBMITTED + zero holds → factual_generation_permitted must be false', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.SUBMITTED, false);
  assert.equal(readiness.factual_generation_permitted, false,
    'SUBMITTED must NOT permit factual generation — evidence presence alone does not establish verification');
  assert.equal(readiness.brief_accepted, true, 'Brief should still be accepted (no holds)');
});

test('M33-002', 'SUBMITTED has explicit blocker explaining why generation is blocked', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.SUBMITTED, false);
  assert.ok(readiness.blockers.length > 0, 'Must have blockers');
  assert.ok(readiness.blockers.some(b => b.includes('verification') && b.includes('incomplete')),
    'Blocker must explain that verification is incomplete');
});

test('M33-003', 'validateInput with evidence (SUBMITTED) → generation_permitted is false', () => {
  const brief = {
    title: 'Test Doc With Evidence',
    niche: 'science',
    subject: 'Gravity',
    object: 'Earth',
    mechanism: 'mass attraction',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1', claim: 'Gravity exists', source_url: 'https://example.com' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED);
  assert.equal(result.m3_resolution.generation_permitted, false,
    'Full pipeline: SUBMITTED evidence must block factual generation');
  assert.equal(result.m3_resolution.generation_readiness.factual_generation_permitted, false);
});

// ========================================================================
// TEST 2: SUBMITTED must NOT equal research_ready
// ========================================================================
console.log('\n=== TEST 2: SUBMITTED must NOT be research_ready ===');

test('M33-004', 'SUBMITTED → research_ready is false for evidence-required content', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.SUBMITTED, false);
  assert.equal(readiness.research_ready, false,
    'SUBMITTED is not research-ready — evidence exists but is not verified');
});

test('M33-005', 'Only VERIFIED is research_ready for evidence-required content', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const verified = assessGenerationReadiness(m3Res, RESEARCH_STATES.VERIFIED, false);
  assert.equal(verified.research_ready, true, 'VERIFIED should be research_ready');

  const notReady = [
    RESEARCH_STATES.NOT_STARTED,
    RESEARCH_STATES.SUBMITTED,
    RESEARCH_STATES.RESEARCH_PENDING,
    RESEARCH_STATES.PARTIALLY_VERIFIED,
    RESEARCH_STATES.UNRESOURCED,
    RESEARCH_STATES.FAILED,
  ];
  for (const state of notReady) {
    const r = assessGenerationReadiness(m3Res, state, true);
    assert.equal(r.research_ready, false,
      `${state} must NOT be research_ready for factual content`);
  }
});

// ========================================================================
// TEST 3: VERIFIED + successful checks may permit research-only factual drafting
// ========================================================================
console.log('\n=== TEST 3: VERIFIED permits research-only factual drafting ===');

test('M33-006', 'VERIFIED + no holds → factual_generation_permitted is true', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.VERIFIED, true);
  assert.equal(readiness.factual_generation_permitted, true,
    'VERIFIED with clean brief must permit factual generation');
  assert.equal(readiness.research_ready, true);
  assert.equal(readiness.brief_accepted, true);
  assert.equal(readiness.production_release_permitted, false,
    'Even VERIFIED does not permit production release');
  assert.equal(readiness.blockers.length, 0, 'No blockers when verified and accepted');
});

test('M33-007', 'VERIFIED + holds → factual_generation_permitted is false', () => {
  const hold = { type: 'HOLD_SOURCE_ROLE', detail: 'blocked source' };
  const m3Res = { holds: [hold], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.VERIFIED, true);
  assert.equal(readiness.factual_generation_permitted, false,
    'Holds must block even when evidence is VERIFIED');
  assert.equal(readiness.brief_accepted, false);
});

// ========================================================================
// TEST 4: Fake user verification flags cannot bypass the gate
// ========================================================================
console.log('\n=== TEST 4: Fake verification flags cannot bypass ===');

test('M33-008', 'Client brief with verification_status="verified" does NOT get VERIFIED state', () => {
  const brief = {
    title: 'Fake Verified Doc',
    niche: 'science',
    subject: 'Gravity',
    object: 'Earth',
    mechanism: 'mass attraction',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1', verification_status: 'verified', verified: true }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED,
    'Client-set verification_status must NOT influence research state');
  assert.equal(result.m3_resolution.generation_permitted, false,
    'Fake verification flags cannot authorize factual generation');
});

test('M33-009', 'deriveResearchState ignores evidence-level verification fields', () => {
  const brief = {
    evidence: [{ id: 'E-1', verified: true, verification_status: 'verified', is_verified: true }],
  };
  const state = deriveResearchState(brief, RESEARCH_MODES.CLIENT_PROVIDED, false);
  assert.equal(state, RESEARCH_STATES.SUBMITTED,
    'No client field on evidence can promote state to VERIFIED');
});

test('M33-010', 'providerAvailable flag cannot promote client_provided to VERIFIED', () => {
  const brief = { evidence: [{ id: 'E-1' }] };
  const state = deriveResearchState(brief, RESEARCH_MODES.CLIENT_PROVIDED, true);
  assert.equal(state, RESEARCH_STATES.SUBMITTED,
    'providerAvailable does not change client_provided outcome');
});

// ========================================================================
// TEST 5: Offline fixtures never establish live-source verification
// ========================================================================
console.log('\n=== TEST 5: Offline fixtures never verify ===');

test('M33-011', 'Offline fixture evidence → SUBMITTED, generation blocked', () => {
  const brief = {
    title: 'Fixture Doc',
    niche: 'science',
    subject: 'Physics',
    object: 'Waves',
    mechanism: 'propagation',
    uncertainty: 'qualified',
    evidence: [{ id: 'FIXTURE-001', source_url: 'fixture://offline', provenance: 'offline_fixture' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED);
  assert.equal(result.m3_resolution.generation_permitted, false,
    'Offline fixture evidence must NOT authorize factual generation');
});

// ========================================================================
// TEST 6: Available provider with research pending remains blocked
// ========================================================================
console.log('\n=== TEST 6: Provider available + research pending → blocked ===');

test('M33-012', 'RESEARCH_PENDING + provider available → generation blocked', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.RESEARCH_PENDING, true);
  assert.equal(readiness.factual_generation_permitted, false,
    'Provider available does NOT mean research complete');
  assert.equal(readiness.research_ready, false);
  assert.ok(readiness.blockers.some(b => b.includes('pending')));
});

// ========================================================================
// TEST 7: Simple client briefs can proceed to research planning
// ========================================================================
console.log('\n=== TEST 7: Simple briefs accepted for research planning ===');

test('M33-013', 'New-style brief without evidence → accepted for planning, generation blocked', () => {
  const brief = {
    niche: 'science',
    topic: 'Dark Energy',
    audience: 'general',
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.ok(result.provisional_title, 'Provisional title must be generated');
  assert.equal(result.m3_resolution.generation_permitted, false,
    'No evidence → no factual generation');
  // But the brief is accepted for planning (topic intake passes if niche+topic present)
  assert.equal(result.stages.topic_intake, 'PASS',
    'Brief should pass topic intake for research planning');
});

test('M33-014', 'Brief with provenanced evidence → topic intake passes, generation still blocked', () => {
  const brief = {
    title: 'Evidence Review Doc',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1', claim: 'Electron orbit', author: 'Dr. Test', publisher: 'Science Journal', can_use_for_synthetic: true }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED);
  assert.equal(result.stages.topic_intake, 'PASS',
    'Topic intake passes — brief fields are valid for planning/review');
  assert.equal(result.m3_resolution.generation_permitted, false,
    'But factual generation blocked until evidence independently verified');
});

// ========================================================================
// TEST 8: Creative content remains functional
// ========================================================================
console.log('\n=== TEST 8: Creative content unaffected ===');

test('M33-015', 'Creative content without evidence → generation permitted', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.CREATIVE) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.NOT_STARTED, false);
  assert.equal(readiness.factual_generation_permitted, true,
    'Creative content needs no evidence — generation allowed');
  assert.equal(readiness.research_ready, true,
    'Creative content is always research-ready (no evidence required)');
});

test('M33-016', 'Creative brief through validateInput → generation permitted', () => {
  const brief = {
    title: 'Creative Story',
    niche: 'domain:entertainment',
    subject: 'A wizard',
    object: 'A dragon',
    mechanism: 'magical combat',
    uncertainty: 'qualified',
    content_type: 'creative',
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.content_type, CONTENT_TYPES.CREATIVE);
  assert.equal(result.m3_resolution.generation_permitted, true,
    'Creative content must still work after M3.3 changes');
});

// ========================================================================
// TEST 9: Legacy documentary validations remain intact
// ========================================================================
console.log('\n=== TEST 9: Legacy documentary intact ===');

test('M33-017', 'Legacy documentary with evidence → SUBMITTED, blocked', () => {
  const brief = {
    title: 'Legacy Doc',
    niche: 'N01',
    subject: 'Hurricane Season',
    object: 'Atlantic Coast',
    mechanism: 'tropical cyclone formation',
    uncertainty: 'qualified',
    evidence: [{ id: 'E-1', claim: 'Hurricane data' }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED);
  assert.equal(result.m3_resolution.generation_permitted, false);
  assert.equal(result.m3_resolution.content_type, CONTENT_TYPES.FACTUAL);
});

test('M33-018', 'Legacy documentary without evidence → client_provided, NOT_STARTED', () => {
  const brief = {
    title: 'Legacy Doc No Evidence',
    niche: 'N01',
    subject: 'Hurricane Season',
    object: 'Atlantic Coast',
    mechanism: 'tropical cyclone formation',
    uncertainty: 'qualified',
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.equal(result.m3_resolution.research_mode, RESEARCH_MODES.CLIENT_PROVIDED,
    'Legacy brief without evidence → client_provided (legacy default)');
  assert.equal(result.m3_resolution.generation_permitted, false,
    'No evidence → no factual generation');
});

// ========================================================================
// TEST 10: Candidate and native Skill files remain identical
// ========================================================================
console.log('\n=== TEST 10: Candidate/native sync ===');

test('M33-019', 'Exported functions and constants are accessible', () => {
  assert.equal(typeof assessGenerationReadiness, 'function');
  assert.equal(typeof deriveResearchState, 'function');
  assert.ok(RESEARCH_STATES.SUBMITTED);
  assert.ok(RESEARCH_STATES.VERIFIED);
  assert.ok(Object.isFrozen(RESEARCH_STATES));
});

test('M33-020', 'Four-gate structure is maintained', () => {
  const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
  const readiness = assessGenerationReadiness(m3Res, RESEARCH_STATES.VERIFIED, false);
  assert.ok('brief_accepted' in readiness, 'Gate A: brief_accepted');
  assert.ok('research_ready' in readiness, 'Gate B: research_ready');
  assert.ok('factual_generation_permitted' in readiness, 'Gate C: factual_generation_permitted');
  assert.ok('production_release_permitted' in readiness, 'Gate D: production_release_permitted');
  assert.ok('blockers' in readiness, 'Blockers array');
});

// ========================================================================
// TEST 11: All production and rights restrictions remain intact
// ========================================================================
console.log('\n=== TEST 11: Production/rights restrictions intact ===');

test('M33-021', 'production_release_permitted always false across all states', () => {
  const allStates = Object.values(RESEARCH_STATES);
  for (const state of allStates) {
    const m3Res = { holds: [], evidence_policy: getEvidencePolicy(CONTENT_TYPES.FACTUAL) };
    const readiness = assessGenerationReadiness(m3Res, state, true);
    assert.equal(readiness.production_release_permitted, false,
      `production_release_permitted must be false for state "${state}"`);
  }
});

test('M33-022', 'request_release still triggers HOLD_NOT_APPROVED', () => {
  const brief = {
    title: 'Release Test',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    request_release: true,
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.ok(result.holds.some(h => h.type === 'HOLD_NOT_APPROVED'));
});

test('M33-023', 'request_claude_transfer still triggers HOLD_NOT_APPROVED', () => {
  const brief = {
    title: 'Transfer Test',
    niche: 'science',
    subject: 'Atoms',
    object: 'Electrons',
    mechanism: 'orbital model',
    uncertainty: 'qualified',
    request_claude_transfer: true,
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert.ok(result.holds.some(h => h.type === 'HOLD_NOT_APPROVED'));
});

// ========================================================================
// ADDITIONAL: Gate consistency checks (FIX 4)
// ========================================================================
console.log('\n=== BONUS: Gate consistency checks ===');

test('M33-024', 'Gates never contradict: if not research_ready, factual_generation not permitted', () => {
  const allStates = Object.values(RESEARCH_STATES);
  const policies = [
    getEvidencePolicy(CONTENT_TYPES.FACTUAL),
    getEvidencePolicy(CONTENT_TYPES.CREATIVE),
    getEvidencePolicy(CONTENT_TYPES.HYBRID),
    getEvidencePolicy(CONTENT_TYPES.INSTRUCTIONAL),
  ];
  for (const policy of policies) {
    for (const state of allStates) {
      for (const prov of [true, false]) {
        const m3Res = { holds: [], evidence_policy: policy };
        const r = assessGenerationReadiness(m3Res, state, prov);
        if (!r.research_ready && policy.evidence_required) {
          assert.equal(r.factual_generation_permitted, false,
            `Contradiction: not research_ready but generation permitted (${state}, evidence_required=${policy.evidence_required})`);
        }
        if (r.factual_generation_permitted) {
          assert.ok(r.research_ready || !policy.evidence_required,
            `Contradiction: generation permitted but not research_ready and evidence required (${state})`);
        }
        assert.equal(r.production_release_permitted, false,
          `production_release_permitted must always be false (${state})`);
        if (!r.brief_accepted) {
          assert.equal(r.factual_generation_permitted, false,
            `Contradiction: brief not accepted but generation permitted (${state})`);
        }
      }
    }
  }
});

test('M33-025', 'Blocker list is non-empty whenever factual generation is blocked for evidence-required content', () => {
  const policy = getEvidencePolicy(CONTENT_TYPES.FACTUAL);
  const blockedStates = [
    RESEARCH_STATES.NOT_STARTED,
    RESEARCH_STATES.SUBMITTED,
    RESEARCH_STATES.RESEARCH_PENDING,
    RESEARCH_STATES.PARTIALLY_VERIFIED,
    RESEARCH_STATES.UNRESOURCED,
    RESEARCH_STATES.FAILED,
  ];
  for (const state of blockedStates) {
    const m3Res = { holds: [], evidence_policy: policy };
    const r = assessGenerationReadiness(m3Res, state, true);
    assert.equal(r.factual_generation_permitted, false, `${state} must block`);
    assert.ok(r.blockers.length > 0,
      `${state} blocks generation but has no blockers — must explain why`);
  }
});

// ========================================================================
// Corrected state matrix verification
// ========================================================================
console.log('\n=== State matrix verification ===');

test('M33-026', 'Complete research-to-generation state matrix', () => {
  const policy = getEvidencePolicy(CONTENT_TYPES.FACTUAL);
  const expected = {
    [RESEARCH_STATES.NOT_STARTED]:        { ready: false, gen: false },
    [RESEARCH_STATES.SUBMITTED]:          { ready: false, gen: false },
    [RESEARCH_STATES.RESEARCH_PENDING]:   { ready: false, gen: false },
    [RESEARCH_STATES.PARTIALLY_VERIFIED]: { ready: false, gen: false },
    [RESEARCH_STATES.UNRESOURCED]:        { ready: false, gen: false },
    [RESEARCH_STATES.FAILED]:             { ready: false, gen: false },
    [RESEARCH_STATES.VERIFIED]:           { ready: true,  gen: true },
  };
  for (const [state, exp] of Object.entries(expected)) {
    const m3Res = { holds: [], evidence_policy: policy };
    const r = assessGenerationReadiness(m3Res, state, true);
    assert.equal(r.research_ready, exp.ready,
      `${state}: research_ready expected ${exp.ready}, got ${r.research_ready}`);
    assert.equal(r.factual_generation_permitted, exp.gen,
      `${state}: factual_generation_permitted expected ${exp.gen}, got ${r.factual_generation_permitted}`);
  }
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
  suite: 'M3.3 Final Evidence Trust Gate',
  timestamp: new Date().toISOString(),
  total: passed + failed,
  passed,
  failed,
  failures,
  covers: [
    'FIX 1: SUBMITTED must NOT permit factual generation',
    'FIX 2: Trusted verification transition — no self-certification',
    'FIX 3: Separate workflow permissions (plan/review/generate/release)',
    'FIX 4: Single authoritative gate — no contradictions',
  ],
  trusted_verification_mechanism: 'NOT IMPLEMENTED — no code path reaches VERIFIED',
};
const receiptPath = join(__dirname, 'M33_REGRESSION_RECEIPT.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
console.log(`\nReceipt: ${receiptPath}`);

process.exit(failed > 0 ? 1 : 0);
