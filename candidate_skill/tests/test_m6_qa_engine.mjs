/**
 * M6 QA Engine Tests
 * Tests the modular 8-stage QA pipeline (A-H), canonical word counter,
 * section parser, 20 HOLD types, and 5 synthetic defect scripts.
 * Status: RESEARCH_ONLY
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  QA_HOLD_TYPES,
  HOLD_SEVERITY,
  QA_RESULT,
  countCanonicalSpokenWords,
  parseScriptSections,
  stageA_structural,
  stageB_content,
  stageC_evidence,
  stageD_formatSpecific,
  stageE_nicheSpecific,
  stageF_holdEvaluation,
  stageG_editorialRevision,
  stageH_qaReport,
  runQA,
} from '../scripts/qa_engine.mjs';

import { resolveFormat, getFormatDefinition } from '../scripts/format_registry.mjs';
import { resolveVoiceMode } from '../scripts/voice_engine.mjs';
import { resolveNiche } from '../scripts/niche_resolver.mjs';
import { inferContentType, getEvidencePolicy, CONTENT_TYPES } from '../scripts/content_type_engine.mjs';
import { resolveTargetWords } from '../scripts/duration_engine.mjs';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function makeDocumentaryScript(words = 500) {
  const perSection = Math.ceil(words / 8);
  const w = 'word '.repeat(perSection).trim();
  return [
    '## HOOK', w,
    '## PROBLEM', w,
    '## DISCOVERY', `[E-001] ${w}`,
    '## MECHANISM', `[E-002] ${w}`,
    '## CHALLENGE', w,
    '## RESOLUTION', w,
    '## IMPLICATIONS', w,
    '## OUTRO', w,
  ].join('\n');
}

function makeExplainerScript(words = 500) {
  const perSection = Math.ceil(words / 7);
  const w = 'word '.repeat(perSection).trim();
  return [
    '## HOOK', w,
    '## FOUNDATION', `[E-001] ${w}`,
    '## BUILD', `[E-002] ${w}`,
    '## EXAMPLE', w,
    '## NUANCE', w,
    '## SYNTHESIS', w,
    '## NEXT STEPS', w,
  ].join('\n');
}

function makeShortFormScript(words = 100) {
  const w = 'word '.repeat(Math.ceil(words / 3)).trim();
  return [
    '## HOOK', w,
    '## BODY', w,
    '## CTA', `${w} subscribe now`,
  ].join('\n');
}

function makeBasicBrief(overrides = {}) {
  return {
    title: 'Test Script Title',
    niche: 'technology',
    subject: 'Test Subject Matter',
    object: 'Test Object Analysis',
    mechanism: 'Test Mechanism',
    uncertainty: 'qualified',
    format: 'documentary',
    evidence: [
      { id: 'E-001', source: 'Test Source 1', epistemic_status: 'replicated', can_use_for_synthetic: true },
      { id: 'E-002', source: 'Test Source 2', epistemic_status: 'replicated', can_use_for_synthetic: true },
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

describe('M6: QA_HOLD_TYPES constants', () => {
  it('has exactly 20 hold types', () => {
    assert.equal(Object.keys(QA_HOLD_TYPES).length, 20);
  });

  it('includes 12 original hold types', () => {
    const originals = [
      'MISSING_IDENTITY', 'RIGHTS', 'DISPUTED_PROVENANCE', 'ORIGINAL_MISSING',
      'SOURCE_ROLE', 'UNVERIFIED_FACT', 'STALE_FORECAST', 'TITLE_PREMISE',
      'HARM', 'REVIEW', 'NOT_APPROVED', 'NEEDS_RECHECK',
    ];
    for (const k of originals) {
      assert.ok(QA_HOLD_TYPES[k], `Missing original: ${k}`);
    }
  });

  it('includes 8 new hold types', () => {
    const newTypes = [
      'FORMAT_MISMATCH', 'AUDIENCE_RISK', 'PLATFORM_COMPLIANCE',
      'DOMAIN_UNKNOWN', 'CULTURAL_SENSITIVITY', 'LEGAL_CLAIM',
      'MEDICAL_CLAIM', 'FINANCIAL_CLAIM',
    ];
    for (const k of newTypes) {
      assert.ok(QA_HOLD_TYPES[k], `Missing new: ${k}`);
    }
  });

  it('all hold types have severity in HOLD_SEVERITY', () => {
    for (const val of Object.values(QA_HOLD_TYPES)) {
      assert.ok(HOLD_SEVERITY[val], `No severity for: ${val}`);
      assert.ok(['BLOCKING', 'ADVISORY'].includes(HOLD_SEVERITY[val]));
    }
  });

  it('FORMAT_MISMATCH and PLATFORM_COMPLIANCE are ADVISORY', () => {
    assert.equal(HOLD_SEVERITY[QA_HOLD_TYPES.FORMAT_MISMATCH], 'ADVISORY');
    assert.equal(HOLD_SEVERITY[QA_HOLD_TYPES.PLATFORM_COMPLIANCE], 'ADVISORY');
  });

  it('QA_RESULT has four states', () => {
    assert.deepEqual(Object.keys(QA_RESULT).sort(), ['HOLD', 'NOT_EVALUATED', 'PASS', 'REVIEW']);
  });
});

// ═══════════════════════════════════════════════════════════════
// CANONICAL SPOKEN WORD COUNTER
// ═══════════════════════════════════════════════════════════════

describe('M6: countCanonicalSpokenWords', () => {
  it('counts words in single-narrator mode', () => {
    const text = 'Hello world this is a test sentence.';
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.total_spoken_words, 7);
    assert.equal(result.speaker_words.NARRATOR, 7);
  });

  it('counts labeled speaker lines in multi-voice', () => {
    const text = 'HOST: Welcome to the show today.\nGUEST: Thanks for having me here.';
    const voice = { mode: 'host_guest', labels: ['HOST', 'GUEST'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.speaker_words.HOST, 5);
    assert.equal(result.speaker_words.GUEST, 5);
    assert.equal(result.total_spoken_words, 10);
  });

  it('excludes scene directions', () => {
    const text = '[SCENE: Interior office]\nNARRATOR: Hello world.';
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.total_spoken_words, 2);
  });

  it('excludes markdown headings', () => {
    const text = '## HOOK\nThe real content here.';
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.total_spoken_words, 4);
  });

  it('excludes table rows', () => {
    const text = '| Col1 | Col2 |\nActual spoken words here.';
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.total_spoken_words, 4);
  });

  it('excludes bold labels', () => {
    const text = '**NARRATOR**\nSpoken text here.';
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.total_spoken_words, 3);
  });

  it('returns zero for empty text', () => {
    const result = countCanonicalSpokenWords('', { mode: 'single_narrator', labels: ['NARRATOR'] });
    assert.equal(result.total_spoken_words, 0);
  });

  it('returns zero for null inputs', () => {
    const result = countCanonicalSpokenWords(null, null);
    assert.equal(result.total_spoken_words, 0);
  });

  it('computes speaker distribution percentages', () => {
    const text = 'HOST: One two three four five.\nGUEST: Six seven eight nine ten.';
    const voice = { mode: 'host_guest', labels: ['HOST', 'GUEST'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.speaker_distribution.HOST, 50);
    assert.equal(result.speaker_distribution.GUEST, 50);
  });

  it('skips unlabeled lines in multi-voice mode', () => {
    const text = 'HOST: Hello there.\nSome unlabeled direction.\nGUEST: Hi back.';
    const voice = { mode: 'host_guest', labels: ['HOST', 'GUEST'] };
    const result = countCanonicalSpokenWords(text, voice);
    assert.equal(result.total_spoken_words, 4);
  });
});

// ═══════════════════════════════════════════════════════════════
// SECTION PARSER
// ═══════════════════════════════════════════════════════════════

describe('M6: parseScriptSections', () => {
  it('parses documentary sections', () => {
    const script = makeDocumentaryScript(200);
    const { scriptSections } = parseScriptSections(script);
    assert.equal(scriptSections.length, 8);
  });

  it('parses explainer sections', () => {
    const script = makeExplainerScript(200);
    const { scriptSections } = parseScriptSections(script);
    assert.equal(scriptSections.length, 7);
  });

  it('parses short-form sections', () => {
    const script = makeShortFormScript(60);
    const { scriptSections } = parseScriptSections(script);
    assert.equal(scriptSections.length, 3);
  });

  it('excludes Evidence Register from script sections', () => {
    const script = '## HOOK\nHello\n## Evidence Register\n| ID | Source |';
    const { scriptSections, allSections } = parseScriptSections(script);
    assert.equal(allSections.length, 2);
    assert.equal(scriptSections.length, 1);
  });

  it('returns empty for empty text', () => {
    const { scriptSections } = parseScriptSections('');
    assert.equal(scriptSections.length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE A: STRUCTURAL
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage A — Structural QA', () => {
  it('returns structured result for documentary', () => {
    const brief = makeBasicBrief({ target_words: 200 });
    const format = resolveFormat(brief).resolved;
    const script = makeDocumentaryScript(200);
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const spokenWords = countCanonicalSpokenWords(scriptSections.map(s => s.content).join('\n'), voice);
    const result = stageA_structural(scriptSections, format, spokenWords.total_spoken_words, spokenWords);
    assert.ok([QA_RESULT.PASS, QA_RESULT.REVIEW].includes(result.status));
    assert.ok(result.checks.length > 0);
    assert.ok(result.checks.some(c => c.check === 'section_count'));
    assert.ok(result.checks.some(c => c.check === 'word_budget'));
  });

  it('REVIEW for wrong section count', () => {
    const brief = makeBasicBrief();
    const format = resolveFormat(brief).resolved;
    const script = '## HOOK\nSome words\n## PROBLEM\nMore words';
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const spokenWords = countCanonicalSpokenWords(scriptSections.map(s => s.content).join('\n'), voice);
    const result = stageA_structural(scriptSections, format, 200, spokenWords);
    assert.equal(result.status, QA_RESULT.REVIEW);
    assert.ok(result.findings.some(f => f.detail.includes('Expected')));
  });

  it('NOT_EVALUATED when no format', () => {
    const result = stageA_structural([], null, 200, null);
    assert.equal(result.status, QA_RESULT.NOT_EVALUATED);
  });

  it('checks word budget tolerance', () => {
    const brief = makeBasicBrief({ target_words: 1000 });
    const format = resolveFormat(brief).resolved;
    const script = makeDocumentaryScript(1000);
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const spoken = countCanonicalSpokenWords(scriptSections.map(s => s.content).join('\n'), voice);
    const result = stageA_structural(scriptSections, format, 1000, spoken);
    assert.ok(result.checks.some(c => c.check === 'word_budget'));
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE B: CONTENT
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage B — Content QA', () => {
  it('PASS for clean content', () => {
    const script = makeDocumentaryScript(200);
    const brief = makeBasicBrief();
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = stageB_content(script, scriptSections, brief, voice);
    assert.ok([QA_RESULT.PASS, QA_RESULT.REVIEW].includes(result.status));
  });

  it('detects AI patterns', () => {
    const aiText = "It's important to note that we must delve into this tapestry. In the realm of science, it's worth mentioning that this is pivotal and nuanced.";
    const script = `## HOOK\n${aiText}\n## PROBLEM\n${aiText}`;
    const brief = makeBasicBrief();
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = stageB_content(script, scriptSections, brief, voice);
    assert.ok(result.checks.some(c => c.check === 'anti_ai_patterns' && c.count > 3));
  });

  it('detects long sentences', () => {
    const longSentence = 'word '.repeat(40) + 'end.';
    const script = `## HOOK\n${longSentence}`;
    const brief = makeBasicBrief();
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const result = stageB_content(script, scriptSections, brief, voice);
    assert.ok(result.checks.some(c => c.check === 'speakability' && c.long_sentences > 0));
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE C: EVIDENCE
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage C — Evidence QA', () => {
  it('PASS for properly referenced evidence', () => {
    const brief = makeBasicBrief();
    const script = 'According to [E-001] and also [E-002] this is true.';
    const ct = CONTENT_TYPES.FACTUAL;
    const ep = getEvidencePolicy(ct);
    const result = stageC_evidence(script, brief, ct, ep);
    assert.equal(result.status, QA_RESULT.PASS);
  });

  it('REVIEW for unreferenced evidence', () => {
    const brief = makeBasicBrief();
    const script = 'No references at all in this text.';
    const ct = CONTENT_TYPES.FACTUAL;
    const ep = getEvidencePolicy(ct);
    const result = stageC_evidence(script, brief, ct, ep);
    assert.ok(result.findings.some(f => f.detail.includes('Unreferenced')));
  });

  it('NOT_EVALUATED for creative content', () => {
    const brief = makeBasicBrief();
    const script = 'Some creative writing.';
    const ct = CONTENT_TYPES.CREATIVE;
    const ep = getEvidencePolicy(ct);
    const result = stageC_evidence(script, brief, ct, ep);
    assert.equal(result.status, QA_RESULT.NOT_EVALUATED);
  });

  it('HOLD for epistemic upgrades', () => {
    const brief = makeBasicBrief({ uncertainty: 'qualified' });
    const script = 'This proves that the method works. It has been proven definitively.';
    const ct = CONTENT_TYPES.FACTUAL;
    const ep = getEvidencePolicy(ct);
    const result = stageC_evidence(script, brief, ct, ep);
    assert.equal(result.status, QA_RESULT.HOLD);
    assert.ok(result.findings.some(f => f.hold_type === QA_HOLD_TYPES.NEEDS_RECHECK));
  });

  it('HOLD for blocked sources', () => {
    const brief = makeBasicBrief({
      evidence: [
        { id: 'F-190', source: 'Blocked', epistemic_status: 'qualified', can_use_for_synthetic: true },
      ],
    });
    const script = 'Some text [F-190].';
    const ct = CONTENT_TYPES.FACTUAL;
    const ep = getEvidencePolicy(ct);
    const result = stageC_evidence(script, brief, ct, ep);
    assert.ok(result.findings.some(f => f.hold_type === QA_HOLD_TYPES.SOURCE_ROLE));
  });

  it('HOLD for quarantined techniques', () => {
    const brief = makeBasicBrief({
      evidence: [
        { id: 'K029', source: 'Quarantined', epistemic_status: 'qualified', can_use_for_synthetic: true },
      ],
    });
    const script = 'Some text.';
    const ct = CONTENT_TYPES.FACTUAL;
    const ep = getEvidencePolicy(ct);
    const result = stageC_evidence(script, brief, ct, ep);
    assert.ok(result.findings.some(f => f.hold_type === QA_HOLD_TYPES.SOURCE_ROLE));
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE D: FORMAT-SPECIFIC
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage D — Format-Specific QA', () => {
  it('checks documentary evidence in discovery section', () => {
    const brief = makeBasicBrief();
    const format = resolveFormat(brief).resolved;
    const script = makeDocumentaryScript(200);
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const spoken = countCanonicalSpokenWords(scriptSections.map(s => s.content).join('\n'), voice);
    const result = stageD_formatSpecific(script, scriptSections, format, spoken);
    assert.ok(result.checks.length > 0);
  });

  it('checks short-form CTA', () => {
    const brief = makeBasicBrief({ format: 'short_form' });
    const format = resolveFormat(brief).resolved;
    const script = makeShortFormScript(60);
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const spoken = countCanonicalSpokenWords(scriptSections.map(s => s.content).join('\n'), voice);
    const result = stageD_formatSpecific(script, scriptSections, format, spoken);
    assert.ok(result.checks.some(c => c.check === 'short_form_cta'));
  });

  it('NOT_EVALUATED when no format', () => {
    const result = stageD_formatSpecific('text', [], null, null);
    assert.equal(result.status, QA_RESULT.NOT_EVALUATED);
  });

  it('HOLD for short_form exceeding 180s', () => {
    const brief = makeBasicBrief({ format: 'short_form' });
    const format = resolveFormat(brief).resolved;
    const script = makeShortFormScript(600);
    const { scriptSections } = parseScriptSections(script);
    const voice = { mode: 'single_narrator', labels: ['NARRATOR'] };
    const spoken = countCanonicalSpokenWords(scriptSections.map(s => s.content).join('\n'), voice);
    const result = stageD_formatSpecific(script, scriptSections, format, spoken);
    assert.ok(result.findings.some(f => f.hold_type === QA_HOLD_TYPES.PLATFORM_COMPLIANCE));
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE E: NICHE-SPECIFIC
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage E — Niche-Specific QA', () => {
  it('checks Tier 1 niche N01', () => {
    const brief = makeBasicBrief({ niche: 'N01' });
    const niche = resolveNiche('N01');
    const script = 'National Weather Service issued advisory and forecast warning for the region.';
    const result = stageE_nicheSpecific(script, brief, niche);
    assert.ok(result.checks.some(c => c.check === 'n01_agency_attribution'));
  });

  it('REVIEW for N01 without agency attribution', () => {
    const brief = makeBasicBrief({ niche: 'N01' });
    const niche = resolveNiche('N01');
    const script = 'The weather will be sunny tomorrow and pleasant for everyone.';
    const result = stageE_nicheSpecific(script, brief, niche);
    assert.ok(result.findings.some(f => f.detail.includes('N01')));
  });

  it('universal safeguards for Tier 3', () => {
    const brief = makeBasicBrief({ niche: 'exotic_pet_care' });
    const niche = resolveNiche('exotic_pet_care');
    const script = 'Some niche content about exotic pets.';
    const result = stageE_nicheSpecific(script, brief, niche);
    assert.ok(result.checks.some(c => c.check === 'tier3_universal'));
  });

  it('NOT_EVALUATED for invalid niche', () => {
    const result = stageE_nicheSpecific('text', {}, null);
    assert.equal(result.status, QA_RESULT.NOT_EVALUATED);
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE F: HOLD EVALUATION
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage F — Hold Evaluation', () => {
  it('collects holds from input validation', () => {
    const inputHolds = [{ type: QA_HOLD_TYPES.MISSING_IDENTITY, detail: 'Missing title' }];
    const result = stageF_holdEvaluation([], inputHolds, '', CONTENT_TYPES.FACTUAL);
    assert.equal(result.blocking_count, 1);
    assert.equal(result.status, QA_RESULT.HOLD);
  });

  it('collects holds from stage findings', () => {
    const findings = [{ severity: 'HOLD', hold_type: QA_HOLD_TYPES.NEEDS_RECHECK, detail: 'Test', type: 'evidence' }];
    const result = stageF_holdEvaluation(findings, [], '', CONTENT_TYPES.FACTUAL);
    assert.equal(result.blocking_count, 1);
  });

  it('detects medical claims in factual content', () => {
    const script = 'The diagnosis showed that treatment with this medication was successful.';
    const result = stageF_holdEvaluation([], [], script, CONTENT_TYPES.FACTUAL);
    assert.ok(result.holds.some(h => h.type === QA_HOLD_TYPES.MEDICAL_CLAIM));
  });

  it('detects legal claims in factual content', () => {
    const script = 'The legal advice from the attorney indicated potential liability.';
    const result = stageF_holdEvaluation([], [], script, CONTENT_TYPES.FACTUAL);
    assert.ok(result.holds.some(h => h.type === QA_HOLD_TYPES.LEGAL_CLAIM));
  });

  it('detects financial advice in factual content', () => {
    const script = 'This investment advice guarantees returns on your portfolio.';
    const result = stageF_holdEvaluation([], [], script, CONTENT_TYPES.FACTUAL);
    assert.ok(result.holds.some(h => h.type === QA_HOLD_TYPES.FINANCIAL_CLAIM));
  });

  it('PASS when no holds', () => {
    const result = stageF_holdEvaluation([], [], 'Clean text here.', CONTENT_TYPES.CREATIVE);
    assert.equal(result.status, QA_RESULT.PASS);
  });

  it('ADVISORY holds produce REVIEW not HOLD', () => {
    const findings = [{ severity: 'HOLD', hold_type: QA_HOLD_TYPES.FORMAT_MISMATCH, detail: 'Test', type: 'format' }];
    const result = stageF_holdEvaluation(findings, [], '', CONTENT_TYPES.FACTUAL);
    assert.equal(result.status, QA_RESULT.REVIEW);
    assert.equal(result.advisory_count, 1);
    assert.equal(result.blocking_count, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE G: EDITORIAL REVISION
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage G — Editorial Revision', () => {
  it('produces no suggestions for clean results', () => {
    const stageResults = {
      A: { status: QA_RESULT.PASS, findings: [] },
      B: { status: QA_RESULT.PASS, findings: [] },
      C: { status: QA_RESULT.PASS, findings: [] },
      D: { status: QA_RESULT.PASS, findings: [] },
      E: { status: QA_RESULT.PASS, findings: [] },
    };
    const result = stageG_editorialRevision(stageResults);
    assert.equal(result.status, QA_RESULT.PASS);
    assert.equal(result.revision_suggestions.length, 0);
  });

  it('orders suggestions by priority', () => {
    const stageResults = {
      A: { status: QA_RESULT.REVIEW, findings: [{ type: 'structural', severity: 'REVIEW', detail: 'A' }] },
      B: { status: QA_RESULT.REVIEW, findings: [{ type: 'content', severity: 'REVIEW', detail: 'B' }] },
      C: { status: QA_RESULT.HOLD, findings: [{ type: 'evidence', severity: 'HOLD', detail: 'C', hold_type: QA_HOLD_TYPES.NEEDS_RECHECK }] },
    };
    const result = stageG_editorialRevision(stageResults);
    assert.equal(result.revision_suggestions[0].suggestion, 'C');
  });

  it('limits suggestions', () => {
    const findings = Array.from({ length: 30 }, (_, i) => ({
      type: 'structural', severity: 'REVIEW', detail: `Issue ${i}`,
    }));
    const stageResults = { A: { status: QA_RESULT.REVIEW, findings } };
    const result = stageG_editorialRevision(stageResults);
    assert.ok(result.revision_suggestions.length <= 20);
  });
});

// ═══════════════════════════════════════════════════════════════
// STAGE H: QA REPORT
// ═══════════════════════════════════════════════════════════════

describe('M6: Stage H — QA Report', () => {
  it('produces compact report', () => {
    const stages = {
      A: { status: QA_RESULT.PASS, findings: [] },
      B: { status: QA_RESULT.PASS, findings: [] },
      C: { status: QA_RESULT.PASS, findings: [] },
      D: { status: QA_RESULT.PASS, findings: [] },
      E: { status: QA_RESULT.PASS, findings: [] },
      F: { status: QA_RESULT.PASS, holds: [], blocking_count: 0, advisory_count: 0 },
      G: { status: QA_RESULT.PASS, revision_suggestions: [] },
    };
    const brief = makeBasicBrief();
    const report = stageH_qaReport(stages, brief, { compact: true });
    assert.equal(report.verdict, 'PASS');
    assert.ok(report.run_id);
    assert.ok(report.timestamp);
    assert.ok(!report.all_findings);
  });

  it('produces detailed report', () => {
    const stages = {
      A: { status: QA_RESULT.PASS, findings: [] },
      B: { status: QA_RESULT.PASS, findings: [] },
      C: { status: QA_RESULT.PASS, findings: [] },
      D: { status: QA_RESULT.PASS, findings: [] },
      E: { status: QA_RESULT.PASS, findings: [] },
      F: { status: QA_RESULT.PASS, holds: [], blocking_count: 0, advisory_count: 0 },
      G: { status: QA_RESULT.PASS, revision_suggestions: [] },
    };
    const brief = makeBasicBrief();
    const report = stageH_qaReport(stages, brief, { compact: false });
    assert.equal(report.verdict, 'PASS');
    assert.ok(report.all_findings);
    assert.ok(report.brief_summary);
  });

  it('HOLD verdict for blocking holds', () => {
    const stages = {
      A: { status: QA_RESULT.PASS, findings: [] },
      F: { status: QA_RESULT.HOLD, holds: [{ type: QA_HOLD_TYPES.HARM, severity: 'BLOCKING' }], blocking_count: 1, advisory_count: 0 },
      G: { status: QA_RESULT.PASS, revision_suggestions: [] },
    };
    const report = stageH_qaReport(stages, makeBasicBrief());
    assert.equal(report.verdict, 'HOLD');
  });

  it('PASS_WITH_WARNINGS for advisory holds', () => {
    const stages = {
      A: { status: QA_RESULT.PASS, findings: [] },
      F: { status: QA_RESULT.REVIEW, holds: [{ type: QA_HOLD_TYPES.FORMAT_MISMATCH, severity: 'ADVISORY' }], blocking_count: 0, advisory_count: 1 },
      G: { status: QA_RESULT.PASS, revision_suggestions: [] },
    };
    const report = stageH_qaReport(stages, makeBasicBrief());
    assert.equal(report.verdict, 'PASS_WITH_WARNINGS');
  });
});

// ═══════════════════════════════════════════════════════════════
// runQA — INTEGRATION
// ═══════════════════════════════════════════════════════════════

describe('M6: runQA integration', () => {
  it('runs full pipeline for documentary', () => {
    const brief = makeBasicBrief({ target_words: 200 });
    const script = makeDocumentaryScript(200);
    const result = runQA(script, brief);
    assert.ok(result.report);
    assert.ok(result.stages);
    assert.ok(result.canonical_word_count);
    assert.ok(result.report.verdict);
    assert.ok(result.report.run_id);
  });

  it('runs full pipeline for explainer', () => {
    const brief = makeBasicBrief({ format: 'explainer', target_words: 200 });
    const script = makeExplainerScript(200);
    const result = runQA(script, brief);
    assert.ok(result.report.verdict);
  });

  it('runs full pipeline for short_form (compact report)', () => {
    const brief = makeBasicBrief({ format: 'short_form', target_words: 100 });
    const script = makeShortFormScript(100);
    const result = runQA(script, brief);
    assert.ok(result.report.verdict);
    assert.ok(!result.report.all_findings);
  });

  it('respects inputHolds option', () => {
    const brief = makeBasicBrief({ target_words: 200 });
    const script = makeDocumentaryScript(200);
    const result = runQA(script, brief, {
      inputHolds: [{ type: QA_HOLD_TYPES.NOT_APPROVED, detail: 'Manual hold' }],
    });
    assert.equal(result.report.verdict, 'HOLD');
  });
});

// ═══════════════════════════════════════════════════════════════
// SYNTHETIC DEFECT SCRIPTS
// ═══════════════════════════════════════════════════════════════

describe('M6: Synthetic Defect Script 1 — Missing Sections', () => {
  it('detects missing sections in documentary', () => {
    const brief = makeBasicBrief({ target_words: 200 });
    const script = '## HOOK\nSome hook text here.\n## PROBLEM\nSome problem text here.';
    const result = runQA(script, brief);
    assert.ok(result.stages.A.findings.some(f => f.detail.includes('Expected')));
    assert.notEqual(result.stages.A.status, QA_RESULT.PASS);
  });
});

describe('M6: Synthetic Defect Script 2 — Epistemic Upgrades', () => {
  it('detects unqualified certainty claims', () => {
    const brief = makeBasicBrief({ uncertainty: 'preliminary', target_words: 200 });
    const script = [
      '## HOOK', 'This proves that the method works.',
      '## PROBLEM', 'It has been proven without doubt.',
      '## DISCOVERY', '[E-001] This is undeniably true.',
      '## MECHANISM', '[E-002] Confirmed and definitively proven.',
      '## CHALLENGE', 'Normal text here.',
      '## RESOLUTION', 'Normal resolution text.',
      '## IMPLICATIONS', 'Normal implications.',
      '## OUTRO', 'Normal outro.',
    ].join('\n');
    const result = runQA(script, brief);
    assert.ok(result.stages.C.findings.some(f => f.hold_type === QA_HOLD_TYPES.NEEDS_RECHECK));
    assert.equal(result.stages.C.status, QA_RESULT.HOLD);
  });
});

describe('M6: Synthetic Defect Script 3 — Blocked Sources', () => {
  it('detects blocked and quarantined sources', () => {
    const brief = makeBasicBrief({
      target_words: 200,
      evidence: [
        { id: 'F-190', source: 'Blocked Source', epistemic_status: 'qualified', can_use_for_synthetic: true },
        { id: 'K029', source: 'Quarantined', epistemic_status: 'qualified', can_use_for_synthetic: true },
        { id: 'E-001', source: 'Clean', epistemic_status: 'qualified', can_use_for_synthetic: true },
      ],
    });
    const script = makeDocumentaryScript(200);
    const result = runQA(script, brief);
    const sourceHolds = result.stages.C.findings.filter(f => f.hold_type === QA_HOLD_TYPES.SOURCE_ROLE);
    assert.ok(sourceHolds.length >= 2);
  });
});

describe('M6: Synthetic Defect Script 4 — Medical Claims', () => {
  it('detects medical language in factual content', () => {
    const brief = makeBasicBrief({ target_words: 200 });
    const script = [
      '## HOOK', 'A medical breakthrough has arrived.',
      '## PROBLEM', 'The diagnosis was clear, treatment was needed.',
      '## DISCOVERY', '[E-001] Clinical patient data showed medication dosage effects.',
      '## MECHANISM', '[E-002] The surgery process works.',
      '## CHALLENGE', 'Prescription rates are rising.',
      '## RESOLUTION', 'Medical advice suggests therapy.',
      '## IMPLICATIONS', 'The symptom patterns are concerning.',
      '## OUTRO', 'Stay safe.',
    ].join('\n');
    const result = runQA(script, brief);
    assert.ok(result.stages.F.holds.some(h => h.type === QA_HOLD_TYPES.MEDICAL_CLAIM));
    assert.equal(result.report.verdict, 'HOLD');
  });
});

describe('M6: Synthetic Defect Script 5 — Short-Form Over Duration', () => {
  it('detects short-form exceeding platform duration limit', () => {
    const brief = makeBasicBrief({ format: 'short_form', target_words: 600 });
    const longScript = [
      '## HOOK',
      'word '.repeat(200),
      '## BODY',
      'word '.repeat(200),
      '## CTA',
      'word '.repeat(200) + 'subscribe now',
    ].join('\n');
    const result = runQA(longScript, brief);
    assert.ok(result.stages.D.findings.some(f => f.hold_type === QA_HOLD_TYPES.PLATFORM_COMPLIANCE));
  });
});

// ═══════════════════════════════════════════════════════════════
// STRUCTURE_LOADER M6 FIX: VOICE CONFIG BLOCKING
// ═══════════════════════════════════════════════════════════════

describe('M6: structure_loader voice config blocking', () => {
  it('blocks on invalid voice mode', async () => {
    const { loadStructure } = await import('../scripts/structure_loader.mjs');
    const brief = {
      title: 'Test',
      niche: 'technology',
      format: 'documentary',
      voice: { mode: 'invalid_mode_xyz' },
    };
    const result = loadStructure(brief);
    assert.equal(result.success, false);
    assert.ok(result.hold);
    assert.equal(result.hold.type, 'HOLD_FORMAT_MISMATCH');
  });
});

// ═══════════════════════════════════════════════════════════════
// VALIDATE.MJS M6 FIX: CANONICAL COUNTER INTEGRATION
// ═══════════════════════════════════════════════════════════════

describe('M6: validate.mjs canonical counter integration', () => {
  it('analyzeScript includes canonical_spoken_words', async () => {
    const { analyzeScript } = await import('../scripts/validate.mjs');
    const brief = makeBasicBrief({ target_words: 200 });
    const script = makeDocumentaryScript(200);
    const result = analyzeScript(script, brief);
    assert.ok(result.canonical_spoken_words);
    assert.ok(typeof result.canonical_spoken_words.total_spoken_words === 'number');
  });

  it('re-exports QA engine symbols', async () => {
    const mod = await import('../scripts/validate.mjs');
    assert.ok(mod.QA_HOLD_TYPES);
    assert.ok(mod.HOLD_SEVERITY);
    assert.ok(mod.QA_RESULT);
    assert.ok(mod.countCanonicalSpokenWords);
    assert.ok(mod.runQA);
  });
});
