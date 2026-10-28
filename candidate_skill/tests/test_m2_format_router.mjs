/**
 * M2 Format Router Tests
 * Tests format_registry.mjs, format resolution in validate.mjs, and structure_loader.mjs
 * Node.js ESM, no dependencies.
 */

import { writeFileSync } from "node:fs";
import {
  FORMAT_STATUS,
  EVIDENCE_REQUIREMENT,
  DOCUMENTARY_FORMAT,
  EXPLAINER_FORMAT,
  SHORT_FORM_FORMAT,
  resolveFormat,
  getArcTemplate,
  getSectionIds,
  getFormatIds,
  getValidatedFormats,
  getDesignTargetFormats,
  isRegisteredFormat,
  getFormatDefinition,
} from "../scripts/format_registry.mjs";

import {
  loadStructure,
  getWritingPlan,
  estimateWordsFromDuration,
  formatDefaultWords,
} from "../scripts/structure_loader.mjs";

import { validateInput } from "../scripts/validate.mjs";

let passed = 0;
let failed = 0;
const results = [];

function assert(id, condition, msg) {
  if (condition) {
    passed++;
    results.push({ id, status: "PASS" });
  } else {
    failed++;
    results.push({ id, status: "FAIL", message: msg });
    console.error(`FAIL ${id}: ${msg}`);
  }
}

// ─── FORMAT REGISTRY TESTS ───

assert("M2-001", FORMAT_STATUS.VALIDATED === "VALIDATED", "FORMAT_STATUS.VALIDATED");
assert("M2-002", FORMAT_STATUS.DESIGN_TARGET === "DESIGN_TARGET", "FORMAT_STATUS.DESIGN_TARGET");
assert("M2-003", Object.isFrozen(FORMAT_STATUS), "FORMAT_STATUS is frozen");

assert("M2-004", EVIDENCE_REQUIREMENT.MANDATORY === "mandatory", "EVIDENCE_REQUIREMENT.MANDATORY");
assert("M2-005", EVIDENCE_REQUIREMENT.PREFERRED === "preferred", "EVIDENCE_REQUIREMENT.PREFERRED");
assert("M2-006", EVIDENCE_REQUIREMENT.CONTEXTUAL === "contextual", "EVIDENCE_REQUIREMENT.CONTEXTUAL");
assert("M2-007", EVIDENCE_REQUIREMENT.OPTIONAL === "optional", "EVIDENCE_REQUIREMENT.OPTIONAL");

// Documentary format definition
assert("M2-008", DOCUMENTARY_FORMAT.id === "documentary", "Documentary id");
assert("M2-009", DOCUMENTARY_FORMAT.status === FORMAT_STATUS.VALIDATED, "Documentary is VALIDATED");
assert("M2-010", DOCUMENTARY_FORMAT.evidence_requirement === "mandatory", "Documentary evidence mandatory");
assert("M2-011", DOCUMENTARY_FORMAT.arc.sections.length === 8, "Documentary has 8 sections");
assert("M2-012", DOCUMENTARY_FORMAT.arc.id === "investigation_arc", "Documentary arc is investigation_arc");
assert("M2-013", DOCUMENTARY_FORMAT.spoken_word_budget_tolerance === 0.05, "Documentary ±5% tolerance");
assert("M2-014", DOCUMENTARY_FORMAT.voice_default === "single_narrator", "Documentary voice default");
assert("M2-015", DOCUMENTARY_FORMAT.content_type_default === "factual", "Documentary content type default");

// Verify section order
const docSections = DOCUMENTARY_FORMAT.arc.sections.map(s => s.id);
assert("M2-016", docSections[0] === "hook", "Documentary section 1: hook");
assert("M2-017", docSections[1] === "problem", "Documentary section 2: problem");
assert("M2-018", docSections[2] === "discovery", "Documentary section 3: discovery");
assert("M2-019", docSections[3] === "mechanism", "Documentary section 4: mechanism");
assert("M2-020", docSections[4] === "challenge", "Documentary section 5: challenge");
assert("M2-021", docSections[5] === "resolution", "Documentary section 6: resolution");
assert("M2-022", docSections[6] === "implications", "Documentary section 7: implications");
assert("M2-023", docSections[7] === "outro", "Documentary section 8: outro");

// Section percentages sum to valid range
const docMinPct = DOCUMENTARY_FORMAT.arc.sections.reduce((s, x) => s + x.min_pct, 0);
const docMaxPct = DOCUMENTARY_FORMAT.arc.sections.reduce((s, x) => s + x.max_pct, 0);
assert("M2-024", docMinPct >= 85 && docMinPct <= 100, `Documentary min_pct sum ${docMinPct} in valid range`);
assert("M2-025", docMaxPct >= 100 && docMaxPct <= 125, `Documentary max_pct sum ${docMaxPct} in valid range`);

// Explainer format definition
assert("M2-026", EXPLAINER_FORMAT.id === "explainer", "Explainer id");
assert("M2-027", EXPLAINER_FORMAT.status === FORMAT_STATUS.DESIGN_TARGET, "Explainer is DESIGN_TARGET");
assert("M2-028", EXPLAINER_FORMAT.evidence_requirement === "preferred", "Explainer evidence preferred");
assert("M2-029", EXPLAINER_FORMAT.arc.sections.length === 7, "Explainer has 7 sections");
assert("M2-030", EXPLAINER_FORMAT.arc.id === "concept_progression_arc", "Explainer arc is concept_progression_arc");
assert("M2-031", EXPLAINER_FORMAT.spoken_word_budget_tolerance === 0.10, "Explainer ±10% tolerance");
assert("M2-032", EXPLAINER_FORMAT.voice_default === "conversational", "Explainer voice conversational");

const explSections = EXPLAINER_FORMAT.arc.sections.map(s => s.id);
assert("M2-033", explSections[0] === "hook", "Explainer section 1: hook");
assert("M2-034", explSections[1] === "foundation", "Explainer section 2: foundation");
assert("M2-035", explSections[2] === "build", "Explainer section 3: build");
assert("M2-036", explSections[3] === "example", "Explainer section 4: example");
assert("M2-037", explSections[4] === "nuance", "Explainer section 5: nuance");
assert("M2-038", explSections[5] === "synthesis", "Explainer section 6: synthesis");
assert("M2-039", explSections[6] === "next_steps", "Explainer section 7: next_steps");

// Short-form format definition
assert("M2-040", SHORT_FORM_FORMAT.id === "short_form", "Short form id");
assert("M2-041", SHORT_FORM_FORMAT.status === FORMAT_STATUS.DESIGN_TARGET, "Short form is DESIGN_TARGET");
assert("M2-042", SHORT_FORM_FORMAT.evidence_requirement === "contextual", "Short form evidence contextual");
assert("M2-043", SHORT_FORM_FORMAT.arc.sections.length === 3, "Short form has 3 sections");
assert("M2-044", SHORT_FORM_FORMAT.arc.id === "hook_body_cta", "Short form arc is hook_body_cta");
assert("M2-045", SHORT_FORM_FORMAT.word_range.min === 50, "Short form min 50 words");
assert("M2-046", SHORT_FORM_FORMAT.word_range.max === 800, "Short form max 800 words");

const sfSections = SHORT_FORM_FORMAT.arc.sections.map(s => s.id);
assert("M2-047", sfSections[0] === "hook", "Short form section 1: hook");
assert("M2-048", sfSections[1] === "body", "Short form section 2: body");
assert("M2-049", sfSections[2] === "cta", "Short form section 3: cta");

// Immutability
assert("M2-050", Object.isFrozen(DOCUMENTARY_FORMAT), "DOCUMENTARY_FORMAT frozen");
assert("M2-051", Object.isFrozen(EXPLAINER_FORMAT), "EXPLAINER_FORMAT frozen");
assert("M2-052", Object.isFrozen(SHORT_FORM_FORMAT), "SHORT_FORM_FORMAT frozen");
assert("M2-053", Object.isFrozen(DOCUMENTARY_FORMAT.arc), "Documentary arc frozen");
assert("M2-054", Object.isFrozen(DOCUMENTARY_FORMAT.arc.sections), "Documentary sections array frozen");

// ─── REGISTRY QUERY FUNCTIONS ───

assert("M2-055", isRegisteredFormat("documentary"), "documentary is registered");
assert("M2-056", isRegisteredFormat("explainer"), "explainer is registered");
assert("M2-057", isRegisteredFormat("short_form"), "short_form is registered");
assert("M2-058", !isRegisteredFormat("podcast_solo"), "podcast_solo is NOT registered");
assert("M2-059", !isRegisteredFormat("screenplay"), "screenplay is NOT registered");
assert("M2-060", !isRegisteredFormat(""), "empty string is NOT registered");

const allIds = getFormatIds();
assert("M2-061", allIds.length === 3, "3 formats registered");
assert("M2-062", allIds.includes("documentary"), "documentary in format list");
assert("M2-063", allIds.includes("explainer"), "explainer in format list");
assert("M2-064", allIds.includes("short_form"), "short_form in format list");

const validated = getValidatedFormats();
assert("M2-065", validated.length === 1, "1 validated format");
assert("M2-066", validated[0] === "documentary", "Only documentary is validated");

const designTargets = getDesignTargetFormats();
assert("M2-067", designTargets.length === 2, "2 design target formats");
assert("M2-068", designTargets.includes("explainer"), "explainer is design target");
assert("M2-069", designTargets.includes("short_form"), "short_form is design target");

assert("M2-070", getFormatDefinition("documentary") === DOCUMENTARY_FORMAT, "getFormatDefinition returns documentary");
assert("M2-071", getFormatDefinition("unknown") === null, "getFormatDefinition returns null for unknown");

const docArc = getArcTemplate("documentary");
assert("M2-072", docArc !== null, "getArcTemplate for documentary is not null");
assert("M2-073", docArc.id === "investigation_arc", "getArcTemplate returns investigation arc");
assert("M2-074", getArcTemplate("unknown") === null, "getArcTemplate returns null for unknown");

const docSectionIds = getSectionIds("documentary");
assert("M2-075", docSectionIds.length === 8, "getSectionIds returns 8 for documentary");
assert("M2-076", getSectionIds("unknown").length === 0, "getSectionIds returns empty for unknown");

// ─── FORMAT RESOLUTION TESTS ───

// Legacy brief (no format) defaults to documentary
const legacyResult = resolveFormat({ topic: "test" });
assert("M2-077", legacyResult.resolved !== null, "Legacy brief resolves");
assert("M2-078", legacyResult.resolved.id === "documentary", "Legacy brief defaults to documentary");
assert("M2-079", !legacyResult.hold, "Legacy brief has no hold");
assert("M2-080", !legacyResult.warning, "Legacy brief has no warning (documentary is VALIDATED)");

// Explicit documentary
const docResult = resolveFormat({ format: "documentary" });
assert("M2-081", docResult.resolved.id === "documentary", "Explicit documentary resolves");
assert("M2-082", !docResult.warning, "Documentary has no warning");

// Explainer — DESIGN TARGET warning
const explResult = resolveFormat({ format: "explainer" });
assert("M2-083", explResult.resolved.id === "explainer", "Explainer resolves");
assert("M2-084", explResult.warning !== undefined, "Explainer has DESIGN_TARGET warning");
assert("M2-085", explResult.warning.type === "DESIGN_TARGET_FORMAT", "Warning type is DESIGN_TARGET_FORMAT");

// Short form — DESIGN TARGET warning
const sfResult = resolveFormat({ format: "short_form" });
assert("M2-086", sfResult.resolved.id === "short_form", "Short form resolves");
assert("M2-087", sfResult.warning !== undefined, "Short form has DESIGN_TARGET warning");

// Unsupported format — HOLD
const unsupported = resolveFormat({ format: "podcast_solo" });
assert("M2-088", unsupported.resolved === null, "Unsupported format does not resolve");
assert("M2-089", unsupported.hold !== undefined, "Unsupported format triggers hold");
assert("M2-090", unsupported.hold.type === "HOLD_FORMAT_MISMATCH", "Hold type is HOLD_FORMAT_MISMATCH");
assert("M2-091", unsupported.hold.severity === "BLOCKING", "Hold severity is BLOCKING");

// Case insensitive
const caseResult = resolveFormat({ format: "DOCUMENTARY" });
assert("M2-092", caseResult.resolved.id === "documentary", "Case-insensitive resolution");

const caseResult2 = resolveFormat({ format: "  Explainer  " });
assert("M2-093", caseResult2.resolved.id === "explainer", "Whitespace-trimmed resolution");

// ─── VALIDATE.MJS INTEGRATION ───

// Legacy brief — format_resolution stage should PASS
const legacyValidation = validateInput({
  title: "Test", niche: "N01", subject: "s", object: "o", mechanism: "m", uncertainty: "preliminary",
  niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
  evidence: [{ id: "E-001", source: "test", epistemic_status: "preliminary", can_use_for_synthetic: true }]
});
assert("M2-094", legacyValidation.format_resolution !== null, "Legacy validation includes format_resolution");
assert("M2-095", legacyValidation.format_resolution.id === "documentary", "Legacy validation resolves to documentary");
assert("M2-096", legacyValidation.stages.format_resolution === "PASS", "Legacy format_resolution stage PASS");

// Explicit explainer
const explValidation = validateInput({
  title: "Test", niche: "N01", subject: "s", object: "o", mechanism: "m", uncertainty: "preliminary",
  format: "explainer",
  niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
  evidence: [{ id: "E-001", source: "test", epistemic_status: "preliminary", can_use_for_synthetic: true }]
});
assert("M2-097", explValidation.format_resolution.id === "explainer", "Explainer format resolved in validation");
assert("M2-098", explValidation.format_resolution.status === "DESIGN_TARGET", "Explainer status is DESIGN_TARGET");
assert("M2-099", explValidation.format_resolution.arc_id === "concept_progression_arc", "Explainer arc_id correct");
assert("M2-100", explValidation.format_resolution.section_count === 7, "Explainer section count 7");
assert("M2-101", explValidation.warnings.some(w => w.includes("DESIGN TARGET")), "DESIGN_TARGET warning in warnings");

// Unsupported format triggers HOLD in validation
const badFmtValidation = validateInput({
  title: "Test", niche: "N01", subject: "s", object: "o", mechanism: "m", uncertainty: "preliminary",
  format: "podcast_solo",
  niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
  evidence: [{ id: "E-001", source: "test", epistemic_status: "preliminary", can_use_for_synthetic: true }]
});
assert("M2-102", badFmtValidation.status === "HOLD", "Unsupported format triggers HOLD status");
assert("M2-103", badFmtValidation.holds.some(h => h.type === "HOLD_FORMAT_MISMATCH"), "HOLD_FORMAT_MISMATCH in holds");
assert("M2-104", badFmtValidation.stages.format_resolution === "HOLD", "format_resolution stage is HOLD");
assert("M2-105", badFmtValidation.format_resolution === null, "format_resolution is null for unsupported");

// Word range warning for short_form
const sfValidation = validateInput({
  title: "Test", niche: "N01", subject: "s", object: "o", mechanism: "m", uncertainty: "preliminary",
  format: "short_form",
  target_words: 5000,
  niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
  evidence: [{ id: "E-001", source: "test", epistemic_status: "preliminary", can_use_for_synthetic: true }]
});
assert("M2-106", sfValidation.warnings.some(w => w.includes("short_form range")), "Word count outside short_form range triggers warning");

// ─── STRUCTURE LOADER TESTS ───

// Documentary structure
const docStructure = loadStructure({ format: "documentary", target_words: 3000 });
assert("M2-107", docStructure.success, "Documentary structure loads successfully");
assert("M2-108", docStructure.structure.format_id === "documentary", "Structure format_id is documentary");
assert("M2-109", docStructure.structure.arc_id === "investigation_arc", "Structure arc_id is investigation_arc");
assert("M2-110", docStructure.structure.sections.length === 8, "Structure has 8 sections");
assert("M2-111", docStructure.structure.target_words === 3000, "Structure target_words preserved");
assert("M2-112", docStructure.structure.evidence_requirement === "mandatory", "Structure evidence_requirement mandatory");
assert("M2-113", docStructure.structure.spoken_word_budget_tolerance === 0.05, "Structure tolerance ±5%");

// Verify section word budgets computed correctly
const hookSection = docStructure.structure.sections[0];
assert("M2-114", hookSection.id === "hook", "First section is hook");
assert("M2-115", hookSection.min_words === Math.round(3000 * 8 / 100), `Hook min_words = ${hookSection.min_words}`);
assert("M2-116", hookSection.max_words === Math.round(3000 * 12 / 100), `Hook max_words = ${hookSection.max_words}`);

// Explainer structure — DESIGN TARGET warning
const explStructure = loadStructure({ format: "explainer", target_words: 2000 });
assert("M2-117", explStructure.success, "Explainer structure loads");
assert("M2-118", explStructure.warning !== null, "Explainer has DESIGN_TARGET warning");
assert("M2-119", explStructure.structure.sections.length === 7, "Explainer structure has 7 sections");
assert("M2-120", explStructure.structure.format_status === "DESIGN_TARGET", "Explainer format_status DESIGN_TARGET");

// Short form structure
const sfStructure = loadStructure({ format: "short_form", target_words: 200 });
assert("M2-121", sfStructure.success, "Short form structure loads");
assert("M2-122", sfStructure.structure.sections.length === 3, "Short form structure has 3 sections");
assert("M2-123", sfStructure.structure.arc_name === "Hook-Body-CTA", "Short form arc name");

// Unsupported format structure — hold
const badStructure = loadStructure({ format: "screenplay" });
assert("M2-124", !badStructure.success, "Unsupported format fails to load");
assert("M2-125", badStructure.hold.type === "HOLD_FORMAT_MISMATCH", "Structure loader returns HOLD_FORMAT_MISMATCH");
assert("M2-126", badStructure.structure === null, "No structure for unsupported format");

// Default (no format) → documentary
const defaultStructure = loadStructure({ topic: "test", target_words: 3000 });
assert("M2-127", defaultStructure.success, "Default format resolves");
assert("M2-128", defaultStructure.structure.format_id === "documentary", "Default format is documentary");

// Duration estimation
assert("M2-129", estimateWordsFromDuration("10 minutes", DOCUMENTARY_FORMAT) === 1500, "10 min → 1500 words");
assert("M2-130", estimateWordsFromDuration("30 seconds", DOCUMENTARY_FORMAT) === 75, "30 sec → 75 words");
assert("M2-131", estimateWordsFromDuration("500 words", DOCUMENTARY_FORMAT) === 500, "500 words → 500 words");
assert("M2-132", typeof formatDefaultWords(DOCUMENTARY_FORMAT) === "number", "formatDefaultWords returns number");
assert("M2-133", formatDefaultWords(null) === 3000, "formatDefaultWords null → 3000");

// getWritingPlan
const plan = getWritingPlan({ format: "documentary", target_words: 3000 });
assert("M2-134", plan.success, "getWritingPlan succeeds for documentary");
assert("M2-135", plan.plan.writing_instructions.includes("Investigation Arc"), "Writing instructions contain arc name");
assert("M2-136", plan.plan.writing_instructions.includes("mandatory"), "Writing instructions contain evidence req");

const badPlan = getWritingPlan({ format: "audio_drama" });
assert("M2-137", !badPlan.success, "getWritingPlan fails for unsupported format");

// ─── BACKWARD COMPATIBILITY: M1 BEHAVIOR PRESERVED ───

// Existing tests still cover niche resolution — spot-check that validateInput
// still produces all the same fields as before M2
const fullInput = {
  title: "Storm Prediction", niche: "N01", subject: "NOAA models", object: "hurricane accuracy",
  mechanism: "ML fusion", uncertainty: "preliminary",
  niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
  evidence: [{ id: "E-001", source: "NOAA", epistemic_status: "preliminary", can_use_for_synthetic: true }]
};
const fullResult = validateInput(fullInput);
assert("M2-138", fullResult.niche_resolution !== null, "niche_resolution still present");
assert("M2-139", fullResult.evidence_register.length > 0, "evidence_register still present");
assert("M2-140", "topic_intake" in fullResult.stages, "topic_intake stage still present");
assert("M2-141", "evidence_validation" in fullResult.stages, "evidence_validation stage still present");
assert("M2-142", "niche_check" in fullResult.stages, "niche_check stage still present");
assert("M2-143", "title_check" in fullResult.stages, "title_check stage still present");
assert("M2-144", "production_gate" in fullResult.stages, "production_gate stage still present");
assert("M2-145", "format_resolution" in fullResult.stages, "format_resolution stage added");

// ─── SAFETY: NEVER WEAKEN EXISTING HOLDS ───

// Unsupported format does NOT bypass other holds
const dangerInput = {
  title: "Confirmed Result", niche: "N01", subject: "s", object: "o", mechanism: "m",
  uncertainty: "preliminary",
  format: "podcast_solo",
  request_release: true,
  niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
  evidence: []
};
const dangerResult = validateInput(dangerInput);
assert("M2-146", dangerResult.holds.some(h => h.type === "HOLD_FORMAT_MISMATCH"), "Format hold present alongside other holds");
assert("M2-147", dangerResult.holds.some(h => h.type === "HOLD_NOT_APPROVED"), "Production gate hold NOT weakened by format hold");
assert("M2-148", dangerResult.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT"), "Evidence hold NOT weakened by format hold");
assert("M2-149", dangerResult.holds.some(h => h.type === "HOLD_TITLE_PREMISE"), "Title premise hold NOT weakened");
assert("M2-150", dangerResult.status === "HOLD", "Overall status stays HOLD");

// ─── REPORT ───

console.log(`\nM2 Format Router Tests`);
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

const receipt = {
  test_suite: "M2_FORMAT_ROUTER",
  timestamp: new Date().toISOString(),
  total: passed + failed,
  passed,
  failed,
  results
};

const receiptDir = new URL(".", import.meta.url).pathname;
writeFileSync(receiptDir + "M2_TEST_RECEIPT.json", JSON.stringify(receipt, null, 2));
console.log("\nReceipt written to tests/M2_TEST_RECEIPT.json");

if (failed > 0) process.exit(1);
