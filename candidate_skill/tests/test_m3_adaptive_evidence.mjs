/**
 * M3 Adaptive Evidence Modes and Controlled Research Integration — Tests
 *
 * 14 test categories:
 *   1. Factual legacy compatibility
 *   2. Creative script without evidence
 *   3. Hybrid factual-claim boundaries
 *   4. Instructional accuracy controls
 *   5. Automatic research mode inference
 *   6. Client-provided evidence precedence
 *   7. Unavailable research tools
 *   8. Missing or fake source detection
 *   9. Unsupported factual claims triggering HOLD
 *  10. Rights and high-risk safeguards
 *  11. Research provider failure
 *  12. Candidate/native synchronization
 *  13. M2 section-budget reconciliation
 *  14. Malformed custom format budget rejection
 *
 * Plus 4 synthetic demo scenarios.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  CONTENT_TYPES,
  CONTENT_TYPE_SET,
  RESEARCH_MODES,
  RESEARCH_MODE_SET,
  EVIDENCE_STATUS,
  EVIDENCE_POLICIES,
  SOURCE_TYPES,
  inferContentType,
  getEvidencePolicy,
  inferResearchMode,
  createEvidenceRecord,
  validateEvidenceRecord,
  ResearchProvider,
  createOfflineFixtureProvider,
  resolveM3,
} from "../scripts/content_type_engine.mjs";

import {
  validateInput,
  analyzeScript,
  CONTENT_TYPES as RE_CONTENT_TYPES,
  RESEARCH_MODES as RE_RESEARCH_MODES,
  inferContentType as reInferContentType,
  inferResearchMode as reInferResearchMode,
  getEvidencePolicy as reGetEvidencePolicy,
  resolveM3 as reResolveM3,
} from "../scripts/validate.mjs";

import { loadStructure } from "../scripts/structure_loader.mjs";
import { resolveFormat, DOCUMENTARY_FORMAT, EXPLAINER_FORMAT, SHORT_FORM_FORMAT } from "../scripts/format_registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.error(`  FAIL: ${label}`);
  }
}

function baseBrief(overrides = {}) {
  return {
    title: "Test Title",
    niche: "N05",
    subject: "test subject",
    object: "test object",
    mechanism: "test mechanism",
    uncertainty: "qualified",
    target_words: 3000,
    evidence: [
      { id: "E-001", source: "Test Source A", epistemic_status: "qualified", can_use_for_synthetic: true },
      { id: "E-002", source: "Test Source B", epistemic_status: "qualified", can_use_for_synthetic: true },
    ],
    ...overrides,
  };
}

console.log("═══════════════════════════════════════════════════════════════");
console.log("  M3 ADAPTIVE EVIDENCE MODES — Test Suite");
console.log("═══════════════════════════════════════════════════════════════\n");

// ========================================================================
// CATEGORY 1: Factual legacy compatibility
// ========================================================================
console.log("--- Category 1: Factual legacy compatibility ---");

{
  const brief = baseBrief();
  const result = validateInput(brief);
  assert(result.status === "PASS", "M3-001: Legacy documentary brief with evidence passes validation");
  assert(result.m3_resolution !== undefined, "M3-002: M3 resolution present in validation result");
  assert(result.m3_resolution.content_type === "factual", "M3-003: Legacy brief infers factual content type");
  assert(result.m3_resolution.research_mode === "client_provided", "M3-004: Legacy brief with evidence infers client_provided");
}

{
  const brief = baseBrief({ evidence: [] });
  const result = validateInput(brief);
  const hasEvidenceHold = result.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" || h.type === "HOLD_NO_EVIDENCE");
  assert(hasEvidenceHold, "M3-005: Legacy brief without evidence produces evidence HOLD");
  assert(result.m3_resolution.research_mode === "client_provided", "M3-006: Legacy brief without evidence stays client_provided (not system_assisted)");
}

{
  const brief = baseBrief({ format: "explainer" });
  const result = validateInput(brief);
  assert(result.m3_resolution.content_type === "factual", "M3-007: Explainer format defaults to factual content type");
}

// ========================================================================
// CATEGORY 2: Creative script without evidence
// ========================================================================
console.log("--- Category 2: Creative script without evidence ---");

{
  const brief = baseBrief({
    content_type: "creative",
    format: "short_form",
    evidence: [],
  });
  const result = validateInput(brief);
  assert(result.status === "PASS", "M3-008: Creative short-form with no evidence passes validation");
  assert(result.m3_resolution.content_type === "creative", "M3-009: Explicit creative content type preserved");
  assert(result.m3_resolution.research_mode === "minimal", "M3-010: Creative content defaults to minimal research mode");
}

{
  const policy = getEvidencePolicy("creative");
  assert(policy.evidence_required === false, "M3-011: Creative evidence policy does not require evidence");
  assert(policy.fabricated_facts_blocked === true, "M3-012: Creative policy still blocks fabricated real-world facts");
}

{
  const brief = baseBrief({
    content_type: "creative",
    format: "short_form",
    evidence: [],
  });
  const m3 = resolveM3(brief, SHORT_FORM_FORMAT);
  assert(m3.holds.length === 0, "M3-013: Creative resolveM3 produces no holds without evidence");
  assert(m3.generation_permitted === true, "M3-014: Creative content generation permitted without evidence");
}

// ========================================================================
// CATEGORY 3: Hybrid factual-claim boundaries
// ========================================================================
console.log("--- Category 3: Hybrid factual-claim boundaries ---");

{
  const brief = baseBrief({ content_type: "hybrid" });
  const result = validateInput(brief);
  assert(result.m3_resolution.content_type === "hybrid", "M3-015: Explicit hybrid content type preserved");
  const hybridPolicy = getEvidencePolicy("hybrid");
  assert(hybridPolicy.evidence_required === true, "M3-016: Hybrid requires evidence for factual claims");
}

{
  const policy = getEvidencePolicy("hybrid");
  assert(policy.fabricated_facts_blocked === true, "M3-017: Hybrid blocks fabricated facts");
  assert(policy.fictional_evidence_blocked === true, "M3-018: Hybrid blocks fictional evidence");
}

{
  // Hybrid with explicit content_type, no evidence, no legacy fields → system_assisted (no HOLD)
  const brief = baseBrief({
    content_type: "hybrid",
    format: "short_form",
    objectives: "sell",
    evidence: [],
    subject: undefined,
    object: undefined,
    mechanism: undefined,
    topic: "marketing",
  });
  const m3 = resolveM3(brief, SHORT_FORM_FORMAT, { providerAvailable: true });
  assert(m3.research_mode === "system_assisted", "M3-019a: Hybrid new-style without evidence → system_assisted");
  assert(m3.holds.every(h => h.type !== "HOLD_NO_EVIDENCE"), "M3-019b: system_assisted hybrid with provider does not get HOLD_NO_EVIDENCE");
  assert(m3.warnings.length > 0, "M3-019c: system_assisted hybrid warns about needing research");
}

{
  // Hybrid legacy brief (has subject/object/mechanism, no content_type) without evidence → client_provided → HOLD
  const legacyHybridBrief = {
    title: "Test", niche: "N05", subject: "x", object: "y", mechanism: "z",
    uncertainty: "qualified", target_words: 200,
    format: "short_form", evidence: [],
  };
  const m3 = resolveM3(legacyHybridBrief, SHORT_FORM_FORMAT);
  // Legacy brief defaults to client_provided → evidence required → HOLD
  if (m3.evidence_policy.evidence_required && m3.research_mode === "client_provided") {
    const hasHold = m3.holds.some(h => h.type === "HOLD_NO_EVIDENCE");
    assert(hasHold, "M3-019d: Legacy brief in client_provided mode with no evidence triggers HOLD_NO_EVIDENCE");
  }
}

// ========================================================================
// CATEGORY 4: Instructional accuracy controls
// ========================================================================
console.log("--- Category 4: Instructional accuracy controls ---");

{
  const policy = getEvidencePolicy("instructional");
  assert(policy.evidence_required === true, "M3-020: Instructional requires evidence (accuracy verification)");
  assert(policy.fabricated_facts_blocked === true, "M3-021: Instructional blocks fabricated facts");
  assert(policy.description.includes("Accuracy verification"), "M3-022: Instructional policy describes accuracy verification");
}

{
  const brief = baseBrief({ content_type: "instructional" });
  const result = validateInput(brief);
  assert(result.m3_resolution.content_type === "instructional", "M3-023: Explicit instructional content type preserved");
}

// ========================================================================
// CATEGORY 5: Automatic research mode inference
// ========================================================================
console.log("--- Category 5: Automatic research mode inference ---");

{
  const r1 = inferResearchMode({ evidence: [{ id: "E-001" }] }, "factual");
  assert(r1.research_mode === "client_provided", "M3-024: Evidence present → client_provided");
  assert(r1.source === "evidence_present", "M3-025: Source is evidence_present");
}

{
  const r2 = inferResearchMode({}, "creative");
  assert(r2.research_mode === "minimal", "M3-026: Creative without evidence → minimal");
  assert(r2.source === "creative_default", "M3-027: Source is creative_default");
}

{
  const r3 = inferResearchMode({ topic: "climate change", content_type: "factual" }, "factual");
  assert(r3.research_mode === "system_assisted", "M3-028: New-style factual without evidence → system_assisted");
  assert(r3.source === "factual_no_evidence", "M3-029: Source is factual_no_evidence");
}

{
  const r4 = inferResearchMode({ subject: "X", object: "Y", mechanism: "Z" }, "factual");
  assert(r4.research_mode === "client_provided", "M3-030: Legacy brief (subject/object/mechanism, no topic) → client_provided");
  assert(r4.source === "legacy_factual_default", "M3-031: Source is legacy_factual_default");
}

{
  const r5 = inferResearchMode({ research_mode: "minimal" }, "factual");
  assert(r5.research_mode === "minimal", "M3-032: Explicit research_mode overrides inference");
  assert(r5.source === "explicit", "M3-033: Source is explicit");
}

{
  const r6 = inferResearchMode({ research_mode: "invalid_mode" }, "factual");
  assert(r6.research_mode === null, "M3-034: Invalid research_mode returns null");
  assert(r6.error !== undefined, "M3-035: Invalid research_mode returns error message");
}

// ========================================================================
// CATEGORY 6: Client-provided evidence precedence
// ========================================================================
console.log("--- Category 6: Client-provided evidence precedence ---");

{
  const brief = baseBrief({
    content_type: "factual",
    research_mode: "client_provided",
  });
  const result = validateInput(brief);
  assert(result.m3_resolution.research_mode === "client_provided", "M3-036: Explicit client_provided respected");
  assert(result.status === "PASS", "M3-037: Client-provided with evidence passes");
}

{
  const brief = baseBrief({
    content_type: "creative",
    evidence: [{ id: "E-001", source: "Test", epistemic_status: "confirmed", can_use_for_synthetic: true }],
  });
  const r = inferResearchMode(brief, "creative");
  assert(r.research_mode === "client_provided", "M3-038: Creative with evidence still gets client_provided");
}

// ========================================================================
// CATEGORY 7: Unavailable research tools
// ========================================================================
console.log("--- Category 7: Unavailable research tools ---");

{
  const provider = new ResearchProvider({ available: false });
  assert(provider.isAvailable() === false, "M3-039: Offline provider reports unavailable");
}

{
  const provider = new ResearchProvider({ available: false });
  const result = await provider.retrieveEvidence({ topic: "test" });
  assert(result.success === false, "M3-040: Unavailable provider returns success=false");
  assert(result.status === "unresourced", "M3-041: Unavailable provider returns unresourced status");
  assert(result.records.length === 0, "M3-042: Unavailable provider returns empty records");
}

{
  const brief = baseBrief({
    content_type: "factual",
    topic: "climate change",
    evidence: [],
    subject: undefined,
    object: undefined,
    mechanism: undefined,
  });
  const m3 = resolveM3(brief, DOCUMENTARY_FORMAT, { providerAvailable: true });
  assert(m3.research_mode === "system_assisted", "M3-043: Factual without evidence in system_assisted mode");
  assert(m3.warnings.length > 0, "M3-044: system_assisted mode produces warning about needing research");
  assert(m3.holds.every(h => h.type !== "HOLD_NO_EVIDENCE"), "M3-045: system_assisted with provider does not produce HOLD_NO_EVIDENCE");
}

// ========================================================================
// CATEGORY 8: Missing or fake source detection
// ========================================================================
console.log("--- Category 8: Missing or fake source detection ---");

{
  const record = createEvidenceRecord({ claim_id: null, claim_text: "" });
  const v = validateEvidenceRecord(record);
  assert(v.valid === false, "M3-046: Record with no claim_id and empty claim_text is invalid");
  assert(v.issues.some(i => i.includes("claim_id")), "M3-047: Missing claim_id reported");
  assert(v.issues.some(i => i.includes("claim_text")), "M3-048: Empty claim_text reported");
}

{
  const record = createEvidenceRecord({
    claim_id: "C-001",
    claim_text: "Test claim",
    source_url: "not-a-url",
  });
  const v = validateEvidenceRecord(record);
  assert(v.valid === false, "M3-049: Invalid URL detected");
  assert(v.issues.some(i => i.includes("URL")), "M3-050: URL issue reported");
}

{
  const record = createEvidenceRecord({
    claim_id: "C-002",
    claim_text: "Test claim",
    verification_status: EVIDENCE_STATUS.FABRICATION_SUSPECTED,
  });
  const v = validateEvidenceRecord(record);
  assert(v.valid === false, "M3-051: Fabrication suspected record is invalid");
  assert(v.issues.some(i => i.includes("FABRICATION_SUSPECTED")), "M3-052: Fabrication flag reported");
}

{
  const record = createEvidenceRecord({
    claim_id: "C-003",
    claim_text: "Valid claim",
    source_url: "https://example.com/study",
    verification_status: EVIDENCE_STATUS.VERIFIED,
  });
  const v = validateEvidenceRecord(record);
  assert(v.valid === true, "M3-053: Valid record passes validation");
}

// ========================================================================
// CATEGORY 9: Unsupported factual claims triggering HOLD
// ========================================================================
console.log("--- Category 9: Unsupported factual claims triggering HOLD ---");

{
  const brief = baseBrief({ evidence: [] });
  const result = validateInput(brief);
  const hasHold = result.holds.some(h =>
    h.type === "HOLD_UNVERIFIED_FACT" || h.type === "HOLD_NO_EVIDENCE"
  );
  assert(hasHold, "M3-054: Factual documentary with no evidence triggers HOLD");
}

{
  const brief = baseBrief({
    content_type: "factual",
    format: "documentary",
    topic: "test topic",
    evidence: [],
    subject: undefined,
    object: undefined,
    mechanism: undefined,
  });
  const result = validateInput(brief);
  const hasHoldNoEvidence = result.holds.some(h => h.type === "HOLD_NO_EVIDENCE");
  assert(hasHoldNoEvidence, "M3-055: New-style factual brief without evidence and no provider GETS HOLD_NO_EVIDENCE (M3.1 safety gate)");
  assert(result.m3_resolution.research_mode === "system_assisted", "M3-056: Correctly inferred system_assisted for new-style factual");
}

// ========================================================================
// CATEGORY 10: Rights and high-risk safeguards
// ========================================================================
console.log("--- Category 10: Rights and high-risk safeguards ---");

{
  const policy = getEvidencePolicy("factual");
  assert(policy.fabricated_facts_blocked === true, "M3-057: Factual blocks fabricated facts");
  assert(policy.fictional_evidence_blocked === true, "M3-058: Factual blocks fictional evidence");
}

{
  assert(Object.isFrozen(EVIDENCE_POLICIES), "M3-059: EVIDENCE_POLICIES object is frozen");
  assert(Object.isFrozen(EVIDENCE_POLICIES.factual), "M3-060: Factual policy is frozen");
  assert(Object.isFrozen(EVIDENCE_POLICIES.creative), "M3-061: Creative policy is frozen");
  assert(Object.isFrozen(EVIDENCE_POLICIES.hybrid), "M3-062: Hybrid policy is frozen");
  assert(Object.isFrozen(EVIDENCE_POLICIES.instructional), "M3-063: Instructional policy is frozen");
}

{
  assert(Object.isFrozen(CONTENT_TYPES), "M3-064: CONTENT_TYPES frozen");
  assert(Object.isFrozen(RESEARCH_MODES), "M3-065: RESEARCH_MODES frozen");
  assert(Object.isFrozen(EVIDENCE_STATUS), "M3-066: EVIDENCE_STATUS frozen");
  assert(Object.isFrozen(SOURCE_TYPES), "M3-067: SOURCE_TYPES frozen");
}

// ========================================================================
// CATEGORY 11: Research provider failure
// ========================================================================
console.log("--- Category 11: Research provider failure ---");

{
  const provider = new ResearchProvider({ available: true, provider_name: "test_provider" });
  const result = await provider.retrieveEvidence({ topic: "anything" });
  assert(result.success === false, "M3-068: Base provider with available=true still returns failure (must be implemented)");
  assert(result.status === "unresourced", "M3-069: Base provider returns unresourced");
}

{
  const fixtures = [
    { topic: "climate", claim_id: "F-001", claim_text: "Global temps rising", source_type: "academic" },
  ];
  const provider = createOfflineFixtureProvider(fixtures);
  assert(provider.isAvailable() === true, "M3-070: Offline fixture provider is available");

  const result = await provider.retrieveEvidence({ topic: "climate" });
  assert(result.success === true, "M3-071: Fixture provider finds matching topic");
  assert(result.records.length === 1, "M3-072: Fixture provider returns 1 record");
  assert(result.records[0].claim_id === "F-001", "M3-073: Fixture record has correct claim_id");
  assert(Object.isFrozen(result.records[0]), "M3-074: Fixture records are frozen");
}

{
  const provider = createOfflineFixtureProvider([]);
  const result = await provider.retrieveEvidence({ topic: "nonexistent" });
  assert(result.success === false, "M3-075: Fixture provider with no match returns failure");
  assert(result.records.length === 0, "M3-076: No records for non-matching topic");
}

// ========================================================================
// CATEGORY 12: Candidate/native synchronization
// ========================================================================
console.log("--- Category 12: Candidate/native synchronization ---");

{
  const candidatePath = join(__dirname, "..", "SKILL.md");
  const nativePath = join(__dirname, "..", "..", ".claude", "skills", "universal-scriptwriting", "SKILL.md");

  let candidateContent, nativeContent;
  try {
    candidateContent = readFileSync(candidatePath, "utf-8");
    nativeContent = readFileSync(nativePath, "utf-8");
  } catch (e) {
    candidateContent = null;
    nativeContent = null;
  }

  assert(candidateContent !== null, "M3-077: Candidate SKILL.md exists");
  assert(nativeContent !== null, "M3-078: Native SKILL.md exists");
  if (candidateContent && nativeContent) {
    assert(candidateContent === nativeContent, "M3-079: Candidate and native SKILL.md are identical");
  }
}

{
  const candidatePath = join(__dirname, "..", "SKILL.md");
  try {
    const content = readFileSync(candidatePath, "utf-8");
    assert(content.includes("content_type"), "M3-080: SKILL.md mentions content_type");
    assert(content.includes("research_mode"), "M3-081: SKILL.md mentions research_mode");
    assert(content.includes("HOLD_NO_EVIDENCE"), "M3-082: SKILL.md mentions HOLD_NO_EVIDENCE");
    assert(content.includes("system_assisted"), "M3-083: SKILL.md mentions system_assisted");
    assert(content.includes("creative"), "M3-084: SKILL.md mentions creative content type");
  } catch (e) {
    assert(false, "M3-080: Could not read SKILL.md for M3 content checks");
  }
}

// ========================================================================
// CATEGORY 13: M2 section-budget reconciliation
// ========================================================================
console.log("--- Category 13: M2 section-budget reconciliation ---");

{
  const brief = baseBrief({ format: "documentary", target_words: 5000 });
  const struct = loadStructure(brief);
  assert(struct.success === true, "M3-085: Documentary structure loads successfully");

  const totalTarget = struct.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
  const tolerance = 0.05;
  const diff = Math.abs(totalTarget - 5000) / 5000;
  assert(diff <= tolerance, `M3-086: Section targets sum to within ±5% of 5000 (actual: ${totalTarget})`);
}

{
  const brief = baseBrief({ format: "explainer", target_words: 2000 });
  const struct = loadStructure(brief);
  assert(struct.success === true, "M3-087: Explainer structure loads successfully");

  for (const sec of struct.structure.sections) {
    assert(sec.target_words >= sec.min_words, `M3-088: ${sec.label} target (${sec.target_words}) >= min (${sec.min_words})`);
    assert(sec.target_words <= sec.max_words, `M3-089: ${sec.label} target (${sec.target_words}) <= max (${sec.max_words})`);
  }
}

{
  const brief = baseBrief({ format: "short_form", target_words: 200 });
  const struct = loadStructure(brief);
  assert(struct.success === true, "M3-090: Short-form structure loads successfully");
  assert(struct.structure.sections.length === 3, "M3-091: Short-form has 3 sections");
}

// ========================================================================
// CATEGORY 14: Malformed custom format budget rejection
// ========================================================================
console.log("--- Category 14: Malformed custom format budget rejection ---");

{
  const brief = baseBrief({
    format: "custom",
    custom_format_spec: {
      name: "Impossible Budget",
      sections: [
        { name: "Part A", budget_percent: "60-70%" },
        { name: "Part B", budget_percent: "60-70%" },
      ],
    },
  });
  const struct = loadStructure(brief);
  assert(struct.success === false, "M3-092: Infeasible budget (mins > 100%) rejects");
  assert(struct.hold !== null, "M3-093: Infeasible budget produces HOLD");
}

{
  const brief = baseBrief({
    format: "custom",
    custom_format_spec: {
      name: "Undersized Budget",
      sections: [
        { name: "Part A", budget_percent: "5-10%" },
        { name: "Part B", budget_percent: "5-10%" },
      ],
    },
  });
  const struct = loadStructure(brief);
  assert(struct.success === false, "M3-094: Infeasible budget (maxes < 100%) rejects");
}

{
  const brief = baseBrief({
    format: "custom",
    custom_format_spec: {
      name: "Missing Budget",
      sections: [
        { name: "Part A" },
      ],
    },
  });
  const result = resolveFormat(brief);
  assert(result.hold !== null, "M3-095: Custom format with missing budget_percent produces HOLD");
}

{
  const brief = baseBrief({
    format: "custom",
    custom_format_spec: {
      name: "Valid Custom",
      sections: [
        { name: "Intro", budget_percent: "20-30%" },
        { name: "Body", budget_percent: "40-60%" },
        { name: "Close", budget_percent: "15-25%" },
      ],
    },
  });
  const m3 = resolveM3(brief, { id: "custom" });
  assert(m3.qa_limitations.length > 0, "M3-096: Custom format produces QA limitations");
  assert(m3.qa_limitations[0].includes("Custom format"), "M3-097: QA limitation mentions custom format");
}

// ========================================================================
// CATEGORY 15: Content type inference edge cases
// ========================================================================
console.log("--- Category 15: Content type inference edge cases ---");

{
  const ct1 = inferContentType({ content_type: "invalid_type" }, DOCUMENTARY_FORMAT);
  assert(ct1.content_type === null, "M3-098: Invalid content_type returns null");
  assert(ct1.error !== undefined, "M3-099: Invalid content_type returns error");
}

{
  const ct2 = inferContentType({}, DOCUMENTARY_FORMAT);
  assert(ct2.content_type === "factual", "M3-100: Documentary without explicit content_type defaults to factual");
  assert(ct2.source === "format_default", "M3-101: Source is format_default");
}

{
  const ct3 = inferContentType({ objectives: "entertain" }, SHORT_FORM_FORMAT);
  assert(ct3.content_type === "creative", "M3-102: Short-form with entertain objective → creative");
  assert(ct3.source === "objectives_inference", "M3-103: Source is objectives_inference");
}

{
  const ct4 = inferContentType({ objectives: "sell" }, SHORT_FORM_FORMAT);
  assert(ct4.content_type === "hybrid", "M3-104: Short-form with sell objective → hybrid");
}

{
  const ct5 = inferContentType({}, { id: "custom" });
  assert(ct5.content_type === null, "M3-105: Custom format without explicit content_type is unresolvable");
  assert(ct5.source === "unresolvable", "M3-106: Source is unresolvable");
}

// ========================================================================
// CATEGORY 16: Re-exports from validate.mjs
// ========================================================================
console.log("--- Category 16: Re-exports from validate.mjs ---");

{
  assert(RE_CONTENT_TYPES === CONTENT_TYPES, "M3-107: validate.mjs re-exports same CONTENT_TYPES object");
  assert(RE_RESEARCH_MODES === RESEARCH_MODES, "M3-108: validate.mjs re-exports same RESEARCH_MODES object");
  assert(reInferContentType === inferContentType, "M3-109: validate.mjs re-exports same inferContentType function");
  assert(reInferResearchMode === inferResearchMode, "M3-110: validate.mjs re-exports same inferResearchMode function");
  assert(reGetEvidencePolicy === getEvidencePolicy, "M3-111: validate.mjs re-exports same getEvidencePolicy function");
  assert(reResolveM3 === resolveM3, "M3-112: validate.mjs re-exports same resolveM3 function");
}

// ========================================================================
// SYNTHETIC SCENARIO A: Factual Explainer
// ========================================================================
console.log("\n--- Synthetic Scenario A: Factual Explainer ---");

{
  const brief = baseBrief({
    title: "How Coral Reefs Build Themselves",
    niche: "domain:science",
    format: "explainer",
    subject: "coral polyps",
    object: "calcium carbonate structures",
    mechanism: "biological calcification",
    uncertainty: "qualified",
    target_words: 2000,
    evidence: [
      { id: "E-001", source: "Marine Biology Journal", epistemic_status: "replicated", can_use_for_synthetic: true },
      { id: "E-002", source: "NOAA Report", epistemic_status: "qualified", can_use_for_synthetic: true },
    ],
  });
  const result = validateInput(brief);
  assert(result.status === "PASS", "SYN-A1: Factual explainer passes validation");
  assert(result.m3_resolution.content_type === "factual", "SYN-A2: Content type is factual");
  assert(result.m3_resolution.research_mode === "client_provided", "SYN-A3: Research mode is client_provided (evidence present)");

  const struct = loadStructure(brief);
  assert(struct.success === true, "SYN-A4: Explainer structure loads");
  assert(struct.structure.sections.length === 7, "SYN-A5: Explainer has 7 sections");
}

// ========================================================================
// SYNTHETIC SCENARIO B: Creative Short-Form
// ========================================================================
console.log("--- Synthetic Scenario B: Creative Short-Form ---");

{
  const brief = {
    title: "The Last Lighthouse Keeper",
    niche: "domain:history",
    format: "short_form",
    content_type: "creative",
    subject: "lighthouse keeper",
    object: "automated lighthouse",
    mechanism: "technological replacement",
    uncertainty: "qualified",
    target_words: 300,
    objectives: "entertain",
    evidence: [],
  };
  const result = validateInput(brief);
  assert(result.status === "PASS", "SYN-B1: Creative short-form with no evidence passes");
  assert(result.m3_resolution.content_type === "creative", "SYN-B2: Content type is creative");
  assert(result.m3_resolution.research_mode === "minimal", "SYN-B3: Research mode is minimal");
  const creativePolicy = getEvidencePolicy("creative");
  assert(creativePolicy.evidence_required === false, "SYN-B4: No evidence required for creative");
}

// ========================================================================
// SYNTHETIC SCENARIO C: Hybrid Branded
// ========================================================================
console.log("--- Synthetic Scenario C: Hybrid Branded ---");

{
  const brief = baseBrief({
    title: "The Science Behind SuperGlue",
    niche: "domain:science",
    format: "short_form",
    content_type: "hybrid",
    objectives: "sell",
    uncertainty: "qualified",
    target_words: 400,
  });
  const result = validateInput(brief);
  assert(result.status === "PASS", "SYN-C1: Hybrid branded with evidence passes");
  assert(result.m3_resolution.content_type === "hybrid", "SYN-C2: Content type is hybrid");
  assert(result.m3_resolution.research_mode === "client_provided", "SYN-C3: Research mode is client_provided (evidence present)");
}

// ========================================================================
// SYNTHETIC SCENARIO D: Factual Documentary with Unavailable Research
// ========================================================================
console.log("--- Synthetic Scenario D: Factual Documentary with Unavailable Research ---");

{
  const brief = {
    title: "The Hidden Cost of Fast Fashion",
    niche: "domain:technology",
    format: "documentary",
    content_type: "factual",
    topic: "fast fashion environmental impact",
    target_words: 4000,
    evidence: [],
  };
  const result = validateInput(brief);
  assert(result.m3_resolution.content_type === "factual", "SYN-D1: Content type is factual");
  assert(result.m3_resolution.research_mode === "system_assisted", "SYN-D2: Research mode is system_assisted (new-style brief, no evidence)");

  const hasWarning = result.warnings.some(w =>
    typeof w === "string" && w.includes("system_assisted")
  );
  assert(hasWarning, "SYN-D3: Warning about needing system_assisted research present");

  const provider = new ResearchProvider({ available: false });
  const research = await provider.retrieveEvidence({ topic: "fast fashion" });
  assert(research.success === false, "SYN-D4: Unavailable research tool returns failure");
  assert(research.message.includes("No authorized research tools"), "SYN-D5: Message explains no authorized tools");
}

// ========================================================================
// Summary
// ========================================================================

console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`  M3 Adaptive Evidence Modes — Test Results`);
console.log(`  Total: ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`  Failures:`);
  for (const f of failures) {
    console.log(`    - ${f}`);
  }
}
console.log("═══════════════════════════════════════════════════════════════");

import { writeFileSync } from "node:fs";
writeFileSync(
  join(__dirname, "M3_ADAPTIVE_EVIDENCE_RECEIPT.json"),
  JSON.stringify({ total: passed + failed, passed, failed, failures, timestamp: new Date().toISOString() }, null, 2)
);
console.log(`\nReceipt written to tests/M3_ADAPTIVE_EVIDENCE_RECEIPT.json`);

if (failed > 0) process.exit(1);
