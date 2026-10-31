// qa_engine.mjs — M6 QA Generalization: Modular 8-Stage Pipeline
// Status: RESEARCH_ONLY — not approved for production

import { resolveTargetWords, estimateRuntime, getSpeakingRate } from './duration_engine.mjs';
import { resolveVoiceMode, validateSpeakerLabels, checkBrandVoiceCompliance } from './voice_engine.mjs';
import { resolveFormat, getFormatDefinition } from './format_registry.mjs';
import { resolveNiche } from './niche_resolver.mjs';
import { inferContentType, getEvidencePolicy, tagClaim, CONTENT_TYPES, RESEARCH_MODES } from './content_type_engine.mjs';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const QA_HOLD_TYPES = Object.freeze({
  MISSING_IDENTITY: 'HOLD_MISSING_IDENTITY',
  RIGHTS: 'HOLD_RIGHTS',
  DISPUTED_PROVENANCE: 'HOLD_DISPUTED_PROVENANCE',
  ORIGINAL_MISSING: 'HOLD_ORIGINAL_MISSING',
  SOURCE_ROLE: 'HOLD_SOURCE_ROLE',
  UNVERIFIED_FACT: 'HOLD_UNVERIFIED_FACT',
  STALE_FORECAST: 'HOLD_STALE_FORECAST',
  TITLE_PREMISE: 'HOLD_TITLE_PREMISE',
  HARM: 'HOLD_HARM',
  REVIEW: 'HOLD_REVIEW',
  NOT_APPROVED: 'HOLD_NOT_APPROVED',
  NEEDS_RECHECK: 'HOLD_NEEDS_RECHECK',
  FORMAT_MISMATCH: 'HOLD_FORMAT_MISMATCH',
  AUDIENCE_RISK: 'HOLD_AUDIENCE_RISK',
  PLATFORM_COMPLIANCE: 'HOLD_PLATFORM_COMPLIANCE',
  DOMAIN_UNKNOWN: 'HOLD_DOMAIN_UNKNOWN',
  CULTURAL_SENSITIVITY: 'HOLD_CULTURAL_SENSITIVITY',
  LEGAL_CLAIM: 'HOLD_LEGAL_CLAIM',
  MEDICAL_CLAIM: 'HOLD_MEDICAL_CLAIM',
  FINANCIAL_CLAIM: 'HOLD_FINANCIAL_CLAIM',
});

const HOLD_SEVERITY = Object.freeze({
  [QA_HOLD_TYPES.MISSING_IDENTITY]: 'BLOCKING',
  [QA_HOLD_TYPES.RIGHTS]: 'BLOCKING',
  [QA_HOLD_TYPES.DISPUTED_PROVENANCE]: 'BLOCKING',
  [QA_HOLD_TYPES.ORIGINAL_MISSING]: 'BLOCKING',
  [QA_HOLD_TYPES.SOURCE_ROLE]: 'BLOCKING',
  [QA_HOLD_TYPES.UNVERIFIED_FACT]: 'BLOCKING',
  [QA_HOLD_TYPES.STALE_FORECAST]: 'BLOCKING',
  [QA_HOLD_TYPES.TITLE_PREMISE]: 'BLOCKING',
  [QA_HOLD_TYPES.HARM]: 'BLOCKING',
  [QA_HOLD_TYPES.REVIEW]: 'BLOCKING',
  [QA_HOLD_TYPES.NOT_APPROVED]: 'BLOCKING',
  [QA_HOLD_TYPES.NEEDS_RECHECK]: 'BLOCKING',
  [QA_HOLD_TYPES.FORMAT_MISMATCH]: 'ADVISORY',
  [QA_HOLD_TYPES.AUDIENCE_RISK]: 'BLOCKING',
  [QA_HOLD_TYPES.PLATFORM_COMPLIANCE]: 'ADVISORY',
  [QA_HOLD_TYPES.DOMAIN_UNKNOWN]: 'BLOCKING',
  [QA_HOLD_TYPES.CULTURAL_SENSITIVITY]: 'BLOCKING',
  [QA_HOLD_TYPES.LEGAL_CLAIM]: 'BLOCKING',
  [QA_HOLD_TYPES.MEDICAL_CLAIM]: 'BLOCKING',
  [QA_HOLD_TYPES.FINANCIAL_CLAIM]: 'BLOCKING',
});

const QA_RESULT = Object.freeze({
  PASS: 'PASS',
  REVIEW: 'REVIEW',
  HOLD: 'HOLD',
  NOT_EVALUATED: 'NOT_EVALUATED',
});

// ═══════════════════════════════════════════════════════════════
// CANONICAL SPOKEN-WORD COUNTER
// ═══════════════════════════════════════════════════════════════

const LABEL_PATTERN = /^([A-Z][A-Z0-9_]*)\s*:\s*(.*)$/;
const EXCLUDE_PATTERNS = [
  /^\[.*\]$/,
  /^\[SZENE:/i,
  /^\[SCENE:/i,
  /^\[INTERVIEW:/i,
  /^\[ABBLENDE\]$/i,
  /^\[FADE/i,
  /^#{1,6}\s/,
  /^>/,
  /^\|/,
  /^---+$/,
  /^\*\*[A-Z_]+\*\*/,
];

function shouldExcludeLine(trimmed) {
  for (const pat of EXCLUDE_PATTERNS) {
    if (pat.test(trimmed)) return true;
  }
  return false;
}

function wordCount(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countCanonicalSpokenWords(text, voiceResolution) {
  if (!text || !voiceResolution) {
    return { total_spoken_words: 0, speaker_words: {}, speaker_distribution: {} };
  }

  const lines = text.split('\n');
  const labels = voiceResolution.labels || [];
  const speakerWords = {};
  for (const label of labels) {
    speakerWords[label] = 0;
  }
  let totalSpoken = 0;
  const isSingleSpeaker = voiceResolution.mode === 'single_narrator' || voiceResolution.mode === 'brand_voice';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (shouldExcludeLine(trimmed)) continue;

    const match = trimmed.match(LABEL_PATTERN);
    if (match) {
      const label = match[1];
      const spoken = match[2].trim();
      const wc = wordCount(spoken);
      if (speakerWords[label] !== undefined) {
        speakerWords[label] += wc;
      }
      totalSpoken += wc;
    } else if (isSingleSpeaker) {
      const wc = wordCount(trimmed);
      const primaryLabel = labels[0] || 'NARRATOR';
      if (speakerWords[primaryLabel] !== undefined) {
        speakerWords[primaryLabel] += wc;
      }
      totalSpoken += wc;
    }
    // Multi-voice: unlabeled lines are metadata/directions, not counted
  }

  const distribution = {};
  for (const [k, v] of Object.entries(speakerWords)) {
    distribution[k] = totalSpoken > 0 ? Math.round(v / totalSpoken * 100) : 0;
  }

  return { total_spoken_words: totalSpoken, speaker_words: speakerWords, speaker_distribution: distribution };
}

// ═══════════════════════════════════════════════════════════════
// SECTION PARSER
// ═══════════════════════════════════════════════════════════════

const SCRIPT_HEADING_RE = /^#{2,3}\s+(?:HOOK|PROBLEM|DISCOVERY|MECHANISM|CHALLENGE|RESOLUTION|IMPLICATIONS|OUTRO|DAS PROBLEM|DIE ENTDECKUNG|DER MECHANISMUS|DIE HERAUSFORDERUNG|DIE AUFL[OÖ]SUNG|IMPLIKATIONEN|FOLGERUNGEN|FOUNDATION|BUILD|EXAMPLE|NUANCE|SYNTHESIS|NEXT\s+STEPS|BODY|CTA|SECTION\s+\d+|Evidence Register|Evidenz\s*register|QA[- ]?Report|QA[- ]?Bericht|PART\s+\d+)[\s:]*(.*)$/i;
const NON_NARRATION_RE = /evidence\s*register|evidenz\s*register|qa[\s-]?report|qa[\s-]?bericht|part\s+\d+.*(?:evidenz|qa|bericht)/i;

function parseScriptSections(scriptText) {
  if (!scriptText) return { allSections: [], scriptSections: [] };

  const lines = scriptText.split('\n');
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const sectionMatch = line.match(SCRIPT_HEADING_RE);
    if (sectionMatch) {
      if (currentSection) {
        sections.push({ name: currentSection, content: currentContent.join('\n') });
      }
      currentSection = line.replace(/^#{2,3}\s+/, '').trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({ name: currentSection, content: currentContent.join('\n') });
  }

  const scriptSections = sections.filter(s =>
    !NON_NARRATION_RE.test(s.name) &&
    !/^PART\s+\d+/i.test(s.name)
  );

  return { allSections: sections, scriptSections };
}

// ═══════════════════════════════════════════════════════════════
// STAGE A: STRUCTURAL QA
// ═══════════════════════════════════════════════════════════════

function normalizeLabel(label) {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stageA_structural(scriptSections, resolvedFormat, targetWords, spokenWordResult) {
  const findings = [];
  const checks = [];

  if (!resolvedFormat) {
    return { status: QA_RESULT.NOT_EVALUATED, findings, checks: [{ check: 'format_available', result: false }] };
  }

  const arcSections = resolvedFormat.arc ? resolvedFormat.arc.sections : [];
  const expectedCount = arcSections.length;
  const actualCount = scriptSections.length;

  checks.push({ check: 'section_count', expected: expectedCount, actual: actualCount, result: actualCount === expectedCount });
  if (actualCount !== expectedCount) {
    findings.push({ type: 'structural', severity: 'REVIEW', detail: `Expected ${expectedCount} sections, found ${actualCount}` });
  }

  // Section order check (fuzzy)
  if (actualCount > 0 && expectedCount > 0) {
    const expectedLabels = arcSections.map(s => normalizeLabel(s.label || s.id));
    const actualLabels = scriptSections.map(s => normalizeLabel(s.name));
    let orderCorrect = true;
    const minLen = Math.min(expectedLabels.length, actualLabels.length);
    for (let i = 0; i < minLen; i++) {
      if (!actualLabels[i].includes(expectedLabels[i]) && !expectedLabels[i].includes(actualLabels[i])) {
        orderCorrect = false;
        findings.push({ type: 'structural', severity: 'REVIEW', detail: `Section ${i + 1}: expected "${arcSections[i].label}", found "${scriptSections[i].name}"` });
      }
    }
    checks.push({ check: 'section_order', result: orderCorrect });
  }

  // Word budget tolerance check
  const tolerance = resolvedFormat.spoken_word_budget_tolerance || 0.05;
  const spokenWords = spokenWordResult ? spokenWordResult.total_spoken_words : 0;
  const minBudget = Math.floor(targetWords * (1 - tolerance));
  const maxBudget = Math.ceil(targetWords * (1 + tolerance));
  const withinBudget = spokenWords >= minBudget && spokenWords <= maxBudget;

  checks.push({ check: 'word_budget', target: targetWords, actual: spokenWords, tolerance, min: minBudget, max: maxBudget, result: withinBudget });
  if (!withinBudget) {
    findings.push({ type: 'structural', severity: 'REVIEW', detail: `Spoken words ${spokenWords} outside budget ${minBudget}-${maxBudget} (target ${targetWords} ±${Math.round(tolerance * 100)}%)` });
  }

  // Per-section word count checks
  if (arcSections.length === scriptSections.length) {
    for (let i = 0; i < arcSections.length; i++) {
      const arc = arcSections[i];
      const sec = scriptSections[i];
      const secWords = wordCount(sec.content);
      const secMin = Math.floor(targetWords * arc.min_pct / 100);
      const secMax = Math.ceil(targetWords * arc.max_pct / 100);
      const ok = secWords >= secMin && secWords <= secMax;
      checks.push({ check: 'section_budget', section: arc.label || arc.id, words: secWords, min: secMin, max: secMax, result: ok });
      if (!ok) {
        findings.push({ type: 'structural', severity: 'REVIEW', detail: `Section "${sec.name}": ${secWords} words outside ${secMin}-${secMax} range` });
      }
    }
  }

  const hasHold = findings.some(f => f.severity === 'HOLD');
  const hasReview = findings.some(f => f.severity === 'REVIEW');
  const status = hasHold ? QA_RESULT.HOLD : hasReview ? QA_RESULT.REVIEW : QA_RESULT.PASS;

  return { status, findings, checks };
}

// ═══════════════════════════════════════════════════════════════
// STAGE B: CONTENT QA
// ═══════════════════════════════════════════════════════════════

const AI_PATTERNS = [
  "it's important to note",
  "it's worth mentioning",
  "delve into",
  "tapestry",
  "in the realm of",
  "nuanced",
  "pivotal",
  "it is important to note",
  "it is worth mentioning",
  "furthermore, it should be noted",
  "a testament to",
  "multifaceted",
];

function extractKeyWords(text) {
  return text.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
}

function stageB_content(scriptText, scriptSections, brief, voiceResolution) {
  const findings = [];
  const checks = [];
  const bodyText = scriptSections.map(s => s.content).join('\n');
  const bodyLower = bodyText.toLowerCase();

  // Canonical term consistency
  const subject = brief.subject || '';
  const object = brief.object || '';
  const subjectWords = extractKeyWords(subject);
  const objectWords = extractKeyWords(object);
  const subjectHits = subjectWords.filter(w => bodyLower.includes(w)).length;
  const objectHits = objectWords.filter(w => bodyLower.includes(w)).length;
  const subjectOk = subjectWords.length === 0 || subjectHits >= Math.min(2, subjectWords.length);
  const objectOk = objectWords.length === 0 || objectHits >= Math.min(2, objectWords.length);

  checks.push({ check: 'subject_consistency', result: subjectOk });
  checks.push({ check: 'object_consistency', result: objectOk });
  if (!subjectOk) {
    findings.push({ type: 'content', severity: 'REVIEW', detail: `Subject keywords not found in script body` });
  }
  if (!objectOk) {
    findings.push({ type: 'content', severity: 'REVIEW', detail: `Object keywords not found in script body` });
  }

  // Voice consistency
  if (voiceResolution && !voiceResolution.error) {
    const speakerResult = validateSpeakerLabels(bodyText, voiceResolution);
    const unrecognized = speakerResult.findings.filter(f => f.type === 'unrecognized_speaker');
    const missing = speakerResult.findings.filter(f => f.type === 'missing_speaker');
    checks.push({ check: 'voice_consistency', all_valid: speakerResult.all_labels_valid, all_present: speakerResult.all_required_present, result: speakerResult.all_labels_valid && speakerResult.all_required_present });
    if (unrecognized.length > 0) {
      findings.push({ type: 'content', severity: 'REVIEW', detail: `Unrecognized speakers: ${unrecognized.map(f => f.label).join(', ')}` });
    }
    if (missing.length > 0) {
      findings.push({ type: 'content', severity: 'REVIEW', detail: `Missing required speakers: ${missing.map(f => f.label).join(', ')}` });
    }
  }

  // Speakability: sentences > 35 words
  const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const longSentences = sentences.filter(s => wordCount(s.trim()) > 35);
  checks.push({ check: 'speakability', long_sentences: longSentences.length, result: longSentences.length === 0 });
  if (longSentences.length > 0) {
    findings.push({ type: 'content', severity: 'REVIEW', detail: `${longSentences.length} sentence(s) exceed 35 words — may be hard to speak` });
  }

  // Anti-AI pattern detection
  let aiCount = 0;
  const detectedPatterns = [];
  for (const pattern of AI_PATTERNS) {
    const re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = bodyLower.match(re);
    if (matches) {
      aiCount += matches.length;
      detectedPatterns.push(pattern);
    }
  }
  checks.push({ check: 'anti_ai_patterns', count: aiCount, result: aiCount <= 3 });
  if (aiCount > 3) {
    findings.push({ type: 'content', severity: 'REVIEW', detail: `${aiCount} AI-pattern occurrences detected: ${detectedPatterns.join(', ')}` });
  }

  const hasHold = findings.some(f => f.severity === 'HOLD');
  const hasReview = findings.some(f => f.severity === 'REVIEW');
  const status = hasHold ? QA_RESULT.HOLD : hasReview ? QA_RESULT.REVIEW : QA_RESULT.PASS;

  return { status, findings, checks };
}

// ═══════════════════════════════════════════════════════════════
// STAGE C: EVIDENCE QA
// ═══════════════════════════════════════════════════════════════

const BLOCKED_SOURCES = new Set(['F-190', 'R052']);
const QUARANTINED = new Set(['K029', 'K030', 'K031']);

const STRONG_CLAIMS_EN = [
  'proves that', 'confirms that', 'has been proven', 'it is certain',
  'undeniably', 'without doubt', 'definitively proven',
];
const STRONG_CLAIMS_DE = [
  'beweist eindeutig', 'beweist zweifelsfrei', 'beweist definitiv',
  'bestätigt endgültig', 'steht zweifelsfrei fest', 'ist eindeutig bewiesen',
  'ist definitiv bewiesen', 'wurde endgültig bewiesen', 'wurde eindeutig bewiesen',
  'ist zweifellos', 'steht endgültig fest', 'wurde definitiv bestätigt',
  'immer funktioniert', 'garantiert dass', 'hat bewiesen dass',
];

function stageC_evidence(scriptText, brief, contentType, evidencePolicy) {
  const findings = [];
  const checks = [];

  if (!evidencePolicy.evidence_required && contentType === CONTENT_TYPES.CREATIVE) {
    return { status: QA_RESULT.NOT_EVALUATED, findings, checks: [{ check: 'evidence_skipped', reason: 'creative content', result: true }] };
  }

  const evidence = brief.evidence || [];

  // Evidence traceability
  if (evidence.length > 0) {
    const referencedIds = [];
    const unreferencedIds = [];
    for (const item of evidence) {
      if (!item.id) continue;
      const escaped = item.id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const pattern = new RegExp(`\\[${escaped}\\]`);
      if (pattern.test(scriptText)) {
        referencedIds.push(item.id);
      } else {
        unreferencedIds.push(item.id);
      }
    }
    const traceOk = unreferencedIds.length === 0;
    checks.push({ check: 'evidence_traceability', referenced: referencedIds.length, unreferenced: unreferencedIds.length, result: traceOk });
    if (!traceOk) {
      findings.push({ type: 'evidence', severity: 'REVIEW', detail: `Unreferenced evidence items: ${unreferencedIds.join(', ')}` });
    }
  } else {
    checks.push({ check: 'evidence_traceability', skipped: true, reason: 'no evidence items', result: true });
  }

  // Epistemic compliance
  const uncertainty = brief.uncertainty || '';
  const upgrades = [];
  if (uncertainty !== 'confirmed' && uncertainty !== 'certain') {
    const bodyLower = scriptText.toLowerCase();
    const allStrong = [...STRONG_CLAIMS_EN, ...STRONG_CLAIMS_DE];
    for (const phrase of allStrong) {
      if (bodyLower.includes(phrase)) {
        upgrades.push(phrase);
      }
    }
  }
  checks.push({ check: 'epistemic_integrity', upgrades: upgrades.length, result: upgrades.length === 0 });
  if (upgrades.length > 0) {
    findings.push({ type: 'evidence', severity: 'HOLD', detail: `Epistemic upgrades detected: ${upgrades.join(', ')}`, hold_type: QA_HOLD_TYPES.NEEDS_RECHECK });
  }

  // Source rights
  for (const item of evidence) {
    if (BLOCKED_SOURCES.has(item.id)) {
      findings.push({ type: 'evidence', severity: 'HOLD', detail: `Blocked source: ${item.id}`, hold_type: QA_HOLD_TYPES.SOURCE_ROLE });
    }
    if (QUARANTINED.has(item.id)) {
      findings.push({ type: 'evidence', severity: 'HOLD', detail: `Quarantined technique: ${item.id}`, hold_type: QA_HOLD_TYPES.SOURCE_ROLE });
    }
  }

  // Fiction frame check for hybrid content
  if (contentType === CONTENT_TYPES.HYBRID || contentType === CONTENT_TYPES.CREATIVE) {
    const bodyText = scriptText;
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const factualInCreative = [];
    for (const sentence of sentences.slice(0, 50)) {
      const tag = tagClaim(sentence.trim());
      if (tag.type === 'factual_claim' && tag.requires_evidence) {
        factualInCreative.push(sentence.trim().substring(0, 80));
      }
    }
    if (factualInCreative.length > 0 && contentType === CONTENT_TYPES.CREATIVE) {
      checks.push({ check: 'fiction_frame', factual_claims_in_creative: factualInCreative.length, result: false });
      findings.push({ type: 'evidence', severity: 'REVIEW', detail: `${factualInCreative.length} factual-sounding claim(s) in creative content without fiction frame` });
    } else {
      checks.push({ check: 'fiction_frame', result: true });
    }
  }

  const hasHold = findings.some(f => f.severity === 'HOLD');
  const hasReview = findings.some(f => f.severity === 'REVIEW');
  const status = hasHold ? QA_RESULT.HOLD : hasReview ? QA_RESULT.REVIEW : QA_RESULT.PASS;

  return { status, findings, checks };
}

// ═══════════════════════════════════════════════════════════════
// STAGE D: FORMAT-SPECIFIC QA
// ═══════════════════════════════════════════════════════════════

function stageD_formatSpecific(scriptText, scriptSections, resolvedFormat, spokenWordResult) {
  const findings = [];
  const checks = [];

  if (!resolvedFormat) {
    return { status: QA_RESULT.NOT_EVALUATED, findings, checks: [{ check: 'format_available', result: false }] };
  }

  const formatId = resolvedFormat.id;

  if (formatId === 'documentary') {
    // Check evidence citations in discovery + mechanism sections
    const discoverySection = scriptSections.find(s => normalizeLabel(s.name).includes('discovery'));
    const mechanismSection = scriptSections.find(s => normalizeLabel(s.name).includes('mechanism'));
    const evidencePattern = /\[E-\w+\]/;

    if (discoverySection) {
      const hasEvidence = evidencePattern.test(discoverySection.content);
      checks.push({ check: 'documentary_discovery_evidence', result: hasEvidence });
      if (!hasEvidence) {
        findings.push({ type: 'format', severity: 'REVIEW', detail: 'Documentary: discovery section missing evidence citations [E-XXX]' });
      }
    }
    if (mechanismSection) {
      const hasEvidence = evidencePattern.test(mechanismSection.content);
      checks.push({ check: 'documentary_mechanism_evidence', result: hasEvidence });
      if (!hasEvidence) {
        findings.push({ type: 'format', severity: 'REVIEW', detail: 'Documentary: mechanism section missing evidence citations [E-XXX]' });
      }
    }

    // Check NARRATOR labels
    const narratorPattern = /NARRATOR\s*:/;
    const hasNarrator = narratorPattern.test(scriptText);
    checks.push({ check: 'documentary_narrator_labels', result: hasNarrator });
  }

  if (formatId === 'explainer') {
    const foundationSection = scriptSections.find(s => normalizeLabel(s.name).includes('foundation'));
    const buildSection = scriptSections.find(s => normalizeLabel(s.name).includes('build'));
    const evidencePattern = /\[E-\w+\]/;

    if (foundationSection) {
      const hasEvidence = evidencePattern.test(foundationSection.content);
      checks.push({ check: 'explainer_foundation_evidence', result: hasEvidence });
      if (!hasEvidence) {
        findings.push({ type: 'format', severity: 'REVIEW', detail: 'Explainer: foundation section should include evidence citations' });
      }
    }
    if (buildSection) {
      const hasEvidence = evidencePattern.test(buildSection.content);
      checks.push({ check: 'explainer_build_evidence', result: hasEvidence });
      if (!hasEvidence) {
        findings.push({ type: 'format', severity: 'REVIEW', detail: 'Explainer: build section should include evidence citations' });
      }
    }
  }

  if (formatId === 'short_form') {
    // Hook timing: first section's first 15 words
    if (scriptSections.length > 0) {
      const firstContent = scriptSections[0].content.trim();
      const firstWords = firstContent.split(/\s+/).slice(0, 15);
      const hookPresent = firstWords.length > 0;
      checks.push({ check: 'short_form_hook_timing', first_words: firstWords.length, result: hookPresent });
    }

    // CTA present in last section
    if (scriptSections.length > 0) {
      const lastSection = scriptSections[scriptSections.length - 1];
      const lastLower = lastSection.name.toLowerCase();
      const hasCta = lastLower.includes('cta') || lastSection.content.toLowerCase().includes('subscribe') ||
        lastSection.content.toLowerCase().includes('follow') || lastSection.content.toLowerCase().includes('click') ||
        lastSection.content.toLowerCase().includes('link') || lastSection.content.toLowerCase().includes('comment');
      checks.push({ check: 'short_form_cta', result: hasCta });
      if (!hasCta) {
        findings.push({ type: 'format', severity: 'REVIEW', detail: 'Short-form: no clear CTA detected in final section' });
      }
    }

    // Platform duration for short_form
    if (spokenWordResult) {
      const estimatedSeconds = Math.round((spokenWordResult.total_spoken_words / 150) * 60);
      if (estimatedSeconds > 180) {
        findings.push({ type: 'format', severity: 'HOLD', detail: `Short-form: estimated ${estimatedSeconds}s exceeds 180s platform limit`, hold_type: QA_HOLD_TYPES.PLATFORM_COMPLIANCE });
      }
      checks.push({ check: 'short_form_duration', seconds: estimatedSeconds, limit: 180, result: estimatedSeconds <= 180 });
    }
  }

  if (formatId === 'custom') {
    checks.push({ check: 'custom_format', result: true, note: 'Custom format: limited structural QA' });
  }

  const hasHold = findings.some(f => f.severity === 'HOLD');
  const hasReview = findings.some(f => f.severity === 'REVIEW');
  const status = hasHold ? QA_RESULT.HOLD : hasReview ? QA_RESULT.REVIEW : QA_RESULT.PASS;

  return { status, findings, checks };
}

// ═══════════════════════════════════════════════════════════════
// STAGE E: NICHE-SPECIFIC QA
// ═══════════════════════════════════════════════════════════════

function stageE_nicheSpecific(scriptText, brief, nicheResolution) {
  const findings = [];
  const checks = [];

  if (!nicheResolution || !nicheResolution.validation || !nicheResolution.validation.valid) {
    return { status: QA_RESULT.NOT_EVALUATED, findings, checks: [{ check: 'niche_available', result: false }] };
  }

  const bodyLower = scriptText.toLowerCase();

  if (nicheResolution.tier === 1) {
    const code = (nicheResolution.nicheCode || '').toUpperCase();

    if (code === 'N01') {
      // Forecast language check
      const hasAgencyAttribution = /national weather service|nws|noaa|weather service/i.test(scriptText);
      checks.push({ check: 'n01_agency_attribution', result: hasAgencyAttribution });
      if (!hasAgencyAttribution) {
        findings.push({ type: 'niche', severity: 'REVIEW', detail: 'N01: No weather agency attribution found in script' });
      }
      const hasForecastLanguage = /forecast|prediction|outlook|advisory|warning/i.test(scriptText);
      checks.push({ check: 'n01_forecast_language', result: hasForecastLanguage });
    }

    if (code === 'N05') {
      // Study citation pattern
      const studyPattern = /\b(?:study|research|findings?|published|journal|sample|participants?|found that)\b/i;
      const hasStudyCitation = studyPattern.test(scriptText);
      checks.push({ check: 'n05_study_citations', result: hasStudyCitation });
      if (!hasStudyCitation) {
        findings.push({ type: 'niche', severity: 'REVIEW', detail: 'N05: No study citation language found in psychology content' });
      }
    }

    // Generic policy compliance for all Tier 1
    checks.push({ check: 'tier1_policies', niche: code, policy_count: nicheResolution.policies.length, result: true });
  }

  if (nicheResolution.tier === 2) {
    checks.push({ check: 'tier2_domain', domain: nicheResolution.domain, policy_count: nicheResolution.policies.length, result: true });
  }

  if (nicheResolution.tier === 3) {
    checks.push({ check: 'tier3_universal', result: true });
    if (nicheResolution.high_stakes) {
      findings.push({ type: 'niche', severity: 'HOLD', detail: `Tier 3 high-stakes niche: "${brief.niche}" — requires review`, hold_type: QA_HOLD_TYPES.DOMAIN_UNKNOWN });
    }
  }

  const hasHold = findings.some(f => f.severity === 'HOLD');
  const hasReview = findings.some(f => f.severity === 'REVIEW');
  const status = hasHold ? QA_RESULT.HOLD : hasReview ? QA_RESULT.REVIEW : QA_RESULT.PASS;

  return { status, findings, checks };
}

// ═══════════════════════════════════════════════════════════════
// STAGE F: HOLD EVALUATION
// ═══════════════════════════════════════════════════════════════

const MEDICAL_PATTERNS = /\b(?:diagnos(?:e|is|tic)|treatment|therapy|medication|prescription|symptom|clinical|patient|dosage|surgery|medical advice)\b/i;
const LEGAL_PATTERNS = /\b(?:legal advice|attorney|lawsuit|litigation|liable|liability|court order|statute|jurisdiction|legal counsel)\b/i;
const FINANCIAL_PATTERNS = /\b(?:investment advice|guaranteed returns|financial advice|securities|portfolio|stock tip|invest now|risk-free|compound interest guarantee)\b/i;

function stageF_holdEvaluation(allFindings, inputHolds, scriptText, contentType) {
  const holds = [];

  // Collect holds from input validation
  if (Array.isArray(inputHolds)) {
    for (const h of inputHolds) {
      const holdType = h.type || 'HOLD_REVIEW';
      holds.push({
        type: holdType,
        severity: HOLD_SEVERITY[holdType] || 'BLOCKING',
        detail: h.detail || h.message || 'Input validation hold',
        source_stage: 'input',
      });
    }
  }

  // Collect hold-level findings from stages A-E
  for (const finding of allFindings) {
    if (finding.severity === 'HOLD' && finding.hold_type) {
      holds.push({
        type: finding.hold_type,
        severity: HOLD_SEVERITY[finding.hold_type] || 'BLOCKING',
        detail: finding.detail,
        source_stage: finding.type || 'unknown',
      });
    }
  }

  // High-stakes domain claim detection
  if (scriptText && (contentType === CONTENT_TYPES.FACTUAL || contentType === CONTENT_TYPES.HYBRID)) {
    if (MEDICAL_PATTERNS.test(scriptText)) {
      holds.push({
        type: QA_HOLD_TYPES.MEDICAL_CLAIM,
        severity: 'BLOCKING',
        detail: 'Medical language detected in factual/hybrid content — requires verification',
        source_stage: 'F',
      });
    }
    if (LEGAL_PATTERNS.test(scriptText)) {
      holds.push({
        type: QA_HOLD_TYPES.LEGAL_CLAIM,
        severity: 'BLOCKING',
        detail: 'Legal language detected in factual/hybrid content — requires verification',
        source_stage: 'F',
      });
    }
    if (FINANCIAL_PATTERNS.test(scriptText)) {
      holds.push({
        type: QA_HOLD_TYPES.FINANCIAL_CLAIM,
        severity: 'BLOCKING',
        detail: 'Financial advice language detected in factual/hybrid content — requires verification',
        source_stage: 'F',
      });
    }
  }

  const blockingCount = holds.filter(h => h.severity === 'BLOCKING').length;
  const advisoryCount = holds.filter(h => h.severity === 'ADVISORY').length;

  const status = blockingCount > 0 ? QA_RESULT.HOLD :
    advisoryCount > 0 ? QA_RESULT.REVIEW : QA_RESULT.PASS;

  return { status, holds, blocking_count: blockingCount, advisory_count: advisoryCount };
}

// ═══════════════════════════════════════════════════════════════
// STAGE G: EDITORIAL REVISION
// ═══════════════════════════════════════════════════════════════

const PRIORITY_MAP = {
  'HOLD': 1,
  'evidence': 2,
  'structural': 3,
  'content': 4,
  'format': 5,
  'niche': 6,
};

function stageG_editorialRevision(stageResults) {
  const suggestions = [];

  const stageOrder = ['A', 'B', 'C', 'D', 'E'];
  for (const stageKey of stageOrder) {
    const result = stageResults[stageKey];
    if (!result || !result.findings) continue;
    for (const finding of result.findings) {
      const priority = finding.severity === 'HOLD' ? 1 : (PRIORITY_MAP[finding.type] || 6);
      suggestions.push({
        priority,
        category: finding.type,
        suggestion: finding.detail,
        source_stage: stageKey,
      });
    }
  }

  suggestions.sort((a, b) => a.priority - b.priority);

  // Max 2 revision passes (limit suggestions)
  const MAX_SUGGESTIONS_PER_PASS = 10;
  const passCount = Math.min(2, Math.ceil(suggestions.length / MAX_SUGGESTIONS_PER_PASS));
  const limited = suggestions.slice(0, MAX_SUGGESTIONS_PER_PASS * 2);

  const status = limited.length === 0 ? QA_RESULT.PASS : QA_RESULT.REVIEW;

  return { status, revision_suggestions: limited, pass_count: passCount };
}

// ═══════════════════════════════════════════════════════════════
// STAGE H: QA REPORT
// ═══════════════════════════════════════════════════════════════

function stageH_qaReport(allStageResults, brief, options = {}) {
  const compact = options.compact || false;

  const stageStatuses = {};
  for (const [key, result] of Object.entries(allStageResults)) {
    if (key === 'F' || key === 'G' || key === 'H') continue;
    stageStatuses[key] = result ? result.status : QA_RESULT.NOT_EVALUATED;
  }
  if (allStageResults.F) stageStatuses.F = allStageResults.F.status;
  if (allStageResults.G) stageStatuses.G = allStageResults.G.status;

  const holdResult = allStageResults.F || { holds: [], blocking_count: 0, advisory_count: 0 };
  const blockingHolds = holdResult.holds.filter(h => h.severity === 'BLOCKING');
  const advisoryHolds = holdResult.holds.filter(h => h.severity === 'ADVISORY');

  let verdict;
  if (holdResult.blocking_count > 0) {
    verdict = 'HOLD';
  } else if (holdResult.advisory_count > 0) {
    verdict = 'PASS_WITH_WARNINGS';
  } else {
    const anyReview = Object.values(stageStatuses).some(s => s === QA_RESULT.REVIEW);
    const anyNotEval = Object.values(stageStatuses).every(s => s === QA_RESULT.NOT_EVALUATED);
    if (anyNotEval) {
      verdict = 'NOT_EVALUATED';
    } else if (anyReview) {
      verdict = 'PASS_WITH_WARNINGS';
    } else {
      verdict = 'PASS';
    }
  }

  const runId = `QA-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  if (compact) {
    return {
      run_id: runId,
      timestamp: new Date().toISOString(),
      verdict,
      blocking_holds: blockingHolds,
      critical_findings: collectCriticalFindings(allStageResults),
      stage_statuses: stageStatuses,
    };
  }

  return {
    run_id: runId,
    timestamp: new Date().toISOString(),
    brief_summary: {
      topic: brief.topic || brief.title || '(untitled)',
      format: brief.format || 'documentary',
      niche: brief.niche || '(none)',
      content_type: brief.content_type || 'factual',
    },
    verdict,
    stage_statuses: stageStatuses,
    all_findings: collectAllFindings(allStageResults),
    hold_register: holdResult.holds,
    blocking_holds: blockingHolds,
    advisory_holds: advisoryHolds,
    revision_suggestions: allStageResults.G ? allStageResults.G.revision_suggestions : [],
  };
}

function collectCriticalFindings(stageResults) {
  const critical = [];
  for (const [key, result] of Object.entries(stageResults)) {
    if (!result || !result.findings) continue;
    for (const f of result.findings) {
      if (f.severity === 'HOLD') {
        critical.push({ stage: key, ...f });
      }
    }
  }
  return critical;
}

function collectAllFindings(stageResults) {
  const all = [];
  for (const [key, result] of Object.entries(stageResults)) {
    if (!result || !result.findings) continue;
    for (const f of result.findings) {
      all.push({ stage: key, ...f });
    }
  }
  return all;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════

function runQA(scriptText, brief, options = {}) {
  // Resolve format
  const formatResult = resolveFormat(brief);
  const resolvedFormat = formatResult.resolved;

  // Resolve voice
  const voiceResolution = resolveVoiceMode(brief, resolvedFormat);

  // Resolve word target
  const wordResolution = resolveTargetWords(brief, resolvedFormat);
  const targetWords = wordResolution.target_words || 3000;

  // Resolve niche
  const nicheResolution = brief.niche ? resolveNiche(brief.niche) : null;

  // Infer content type
  const ctResult = inferContentType(brief, resolvedFormat);
  const contentType = ctResult.content_type || CONTENT_TYPES.FACTUAL;
  const evidencePolicy = getEvidencePolicy(contentType);

  // Parse sections
  const { scriptSections } = parseScriptSections(scriptText);

  // Canonical spoken word count
  const effectiveVoice = voiceResolution.error
    ? { mode: 'single_narrator', labels: ['NARRATOR'] }
    : voiceResolution;
  const spokenWordResult = countCanonicalSpokenWords(
    scriptSections.map(s => s.content).join('\n'),
    effectiveVoice,
  );

  // Run stages
  const A = stageA_structural(scriptSections, resolvedFormat, targetWords, spokenWordResult);
  const B = stageB_content(scriptText, scriptSections, brief, voiceResolution);
  const C = stageC_evidence(scriptText, brief, contentType, evidencePolicy);
  const D = stageD_formatSpecific(scriptText, scriptSections, resolvedFormat, spokenWordResult);
  const E = stageE_nicheSpecific(scriptText, brief, nicheResolution);

  // Collect all findings for stages F/G
  const allFindings = [
    ...(A.findings || []),
    ...(B.findings || []),
    ...(C.findings || []),
    ...(D.findings || []),
    ...(E.findings || []),
  ];

  const inputHolds = options.inputHolds || [];
  const F = stageF_holdEvaluation(allFindings, inputHolds, scriptText, contentType);

  const stageResults = { A, B, C, D, E };
  const G = stageG_editorialRevision(stageResults);

  const allStageResults = { A, B, C, D, E, F, G };
  const compact = options.compact || (resolvedFormat && resolvedFormat.id === 'short_form');
  const H = stageH_qaReport(allStageResults, brief, { compact });

  return {
    stages: { A, B, C, D, E, F, G },
    report: H,
    canonical_word_count: spokenWordResult,
  };
}

export {
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
};
