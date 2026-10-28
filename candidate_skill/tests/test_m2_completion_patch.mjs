/**
 * M2 Completion Patch Tests — targeted tests for all 6 corrections
 * Correction 1: SKILL.md uses format-resolved arc (verified by file content check)
 * Correction 2: analyzeScript parses explainer and short-form headings
 * Correction 3: custom_format_spec handling
 * Correction 4: Documentary word_range restored to 2500-8000
 * Correction 5: Nested format definitions cannot be externally mutated
 * Correction 6: Deterministic validation for malformed inputs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  resolveFormat,
  DOCUMENTARY_FORMAT,
  EXPLAINER_FORMAT,
  SHORT_FORM_FORMAT,
  FORMAT_STATUS,
  EVIDENCE_REQUIREMENT,
  getFormatDefinition,
} from "../scripts/format_registry.mjs";
import { loadStructure, estimateWordsFromDuration, formatDefaultWords } from "../scripts/structure_loader.mjs";
import { validateInput, analyzeScript } from "../scripts/validate.mjs";

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
    niche: "N01",
    subject: "test subject",
    object: "test object",
    mechanism: "test mechanism",
    uncertainty: "confirmed",
    target_words: 3000,
    evidence: [{ id: "E-001", source: "Test Source", epistemic_status: "confirmed", can_use_for_synthetic: true }],
    ...overrides,
  };
}

console.log("═══════════════════════════════════════════════════════════════");
console.log("  M2 COMPLETION PATCH — Targeted Correction Tests");
console.log("═══════════════════════════════════════════════════════════════\n");

// ========================================================================
// CORRECTION 1: SKILL.md references format resolution and all three arcs
// ========================================================================
console.log("--- Correction 1: SKILL.md format-aware Stage 3 ---");

const candidateSkillMd = readFileSync(join(__dirname, "..", "SKILL.md"), "utf-8");
const nativeSkillMd = readFileSync(join(__dirname, "..", "..", ".claude", "skills", "universal-scriptwriting", "SKILL.md"), "utf-8");

assert(candidateSkillMd === nativeSkillMd, "CP-001: Candidate and native SKILL.md are identical");
assert(candidateSkillMd.includes("Resolve the format arc"), "CP-002: Stage 3 mentions format arc resolution");
assert(candidateSkillMd.includes("Investigation Arc"), "CP-003: Stage 3 includes Documentary arc");
assert(candidateSkillMd.includes("Concept Progression Arc"), "CP-004: Stage 3 includes Explainer arc");
assert(candidateSkillMd.includes("Hook-Body-CTA Arc"), "CP-005: Stage 3 includes Short-form arc");
assert(candidateSkillMd.includes("Foundation"), "CP-006: Stage 3 lists Explainer sections");
assert(candidateSkillMd.includes("evidence_requirement"), "CP-007: Stage 3 mentions evidence_requirement levels");

// ========================================================================
// CORRECTION 2: analyzeScript parses all format headings
// ========================================================================
console.log("\n--- Correction 2: analyzeScript multi-format heading parsing ---");

const documentaryScript = `## HOOK
NARRATOR: The ocean floor holds secrets we've only begun to understand.

## PROBLEM
NARRATOR: For decades, scientists couldn't explain the deep-sea patterns. [E-001]

## DISCOVERY
NARRATOR: In 2024, a breakthrough changed everything. [E-001]

## MECHANISM
NARRATOR: The process works through thermal vents. [E-001]

## CHALLENGE
NARRATOR: Critics argued the data was incomplete.

## RESOLUTION
NARRATOR: Further studies confirmed the findings. [E-001]

## IMPLICATIONS
NARRATOR: This discovery reshapes our understanding.

## OUTRO
NARRATOR: The ocean still holds its mysteries.
`;

const docResult = analyzeScript(documentaryScript, baseBrief());
assert(docResult.sections.length === 8, "CP-008: Documentary script parsed 8 sections");
assert(docResult.total_words > 0, "CP-009: Documentary word count > 0");

const explainerScript = `## HOOK
Ever wondered why your phone battery dies faster in the cold?

## FOUNDATION
Lithium-ion batteries work through chemical reactions. [E-001]

## BUILD
Temperature affects the speed of ion movement. [E-001]

## EXAMPLE
Think of it like honey — cold honey pours slowly.

## NUANCE
Not all battery chemistries react the same way.

## SYNTHESIS
So cold weather slows the chemistry, reducing capacity temporarily.

## NEXT STEPS
Keep your phone in an inside pocket when it's freezing.
`;

const explResult = analyzeScript(explainerScript, baseBrief({ format: "explainer" }));
assert(explResult.sections.length === 7, "CP-010: Explainer script parsed 7 sections");
assert(explResult.sections.some(s => /FOUNDATION/i.test(s.section)), "CP-011: Foundation section found");
assert(explResult.sections.some(s => /BUILD/i.test(s.section)), "CP-012: Build section found");
assert(explResult.sections.some(s => /EXAMPLE/i.test(s.section)), "CP-013: Example section found");
assert(explResult.sections.some(s => /NUANCE/i.test(s.section)), "CP-014: Nuance section found");
assert(explResult.sections.some(s => /SYNTHESIS/i.test(s.section)), "CP-015: Synthesis section found");
assert(explResult.sections.some(s => /NEXT\s+STEPS/i.test(s.section)), "CP-016: Next Steps section found");

const shortFormScript = `## HOOK
You're wasting money on groceries — here's why.

## BODY
The average family throws away 30% of what they buy. Plan meals, check the fridge before shopping, and use a list. [E-001]

## CTA
Save $200 a month — start meal planning today.
`;

const sfResult = analyzeScript(shortFormScript, baseBrief({ format: "short_form", target_words: 200 }));
assert(sfResult.sections.length === 3, "CP-017: Short-form script parsed 3 sections");
assert(sfResult.sections.some(s => /BODY/i.test(s.section)), "CP-018: Body section found");
assert(sfResult.sections.some(s => /CTA/i.test(s.section)), "CP-019: CTA section found");
assert(sfResult.total_words > 0, "CP-020: Short-form word count > 0");

// Metadata exclusion
const scriptWithMeta = `## HOOK
NARRATOR: Opening line.

## PROBLEM
NARRATOR: The issue. [E-001]

## Evidence Register
| ID | Source | Status |
| E-001 | Test | confirmed |

## QA Report
All checks passed.
`;

const metaResult = analyzeScript(scriptWithMeta, baseBrief());
assert(metaResult.sections.length === 2, "CP-021: Metadata sections (Evidence Register, QA Report) excluded from narration count");

// ========================================================================
// CORRECTION 3: custom_format_spec handling
// ========================================================================
console.log("\n--- Correction 3: custom_format_spec handling ---");

const validCustomBrief = {
  format: "custom",
  custom_format_spec: {
    name: "Tutorial",
    sections: [
      { name: "Intro", budget_percent: "10-15%", purpose: "Set context" },
      { name: "Steps", budget_percent: "60-70%", purpose: "Main content" },
      { name: "Recap", budget_percent: "15-25%", purpose: "Wrap up" },
    ],
    evidence_requirement: "optional",
    voice_model: "conversational",
  },
};

const customRes = resolveFormat(validCustomBrief);
assert(customRes.resolved !== null, "CP-022: Valid custom format resolves");
assert(customRes.resolved.id === "custom", "CP-023: Custom format id is 'custom'");
assert(customRes.resolved.name === "Tutorial", "CP-024: Custom format name matches spec");
assert(customRes.resolved.arc.sections.length === 3, "CP-025: Custom arc has 3 sections");
assert(customRes.resolved.evidence_requirement === "optional", "CP-026: Custom evidence_requirement from spec");
assert(customRes.resolved.voice_default === "conversational", "CP-027: Custom voice_model from spec");
assert(customRes.warning && customRes.warning.type === "DESIGN_TARGET_FORMAT", "CP-028: Custom format gets DESIGN_TARGET warning");

// Missing custom_format_spec when format=custom
const noSpecBrief = { format: "custom" };
const noSpecRes = resolveFormat(noSpecBrief);
assert(noSpecRes.hold !== undefined, "CP-029: Missing custom_format_spec produces HOLD");
assert(noSpecRes.hold.type === "HOLD_FORMAT_MISMATCH", "CP-030: HOLD type is HOLD_FORMAT_MISMATCH");

// Invalid spec: missing name
const noNameRes = resolveFormat({ format: "custom", custom_format_spec: { sections: [{ name: "A", budget_percent: "50-50%", purpose: "x" }] } });
assert(noNameRes.hold !== undefined, "CP-031: Missing spec.name produces HOLD");

// Invalid spec: empty sections
const emptySectRes = resolveFormat({ format: "custom", custom_format_spec: { name: "Test", sections: [] } });
assert(emptySectRes.hold !== undefined, "CP-032: Empty sections array produces HOLD");

// Invalid spec: bad budget_percent format
const badBudgetRes = resolveFormat({
  format: "custom",
  custom_format_spec: { name: "Test", sections: [{ name: "A", budget_percent: "abc", purpose: "x" }] },
});
assert(badBudgetRes.hold !== undefined, "CP-033: Malformed budget_percent produces HOLD");

// Invalid spec: budget range invalid (min > max)
const reversedBudgetRes = resolveFormat({
  format: "custom",
  custom_format_spec: { name: "Test", sections: [{ name: "A", budget_percent: "80-20%", purpose: "x" }] },
});
assert(reversedBudgetRes.hold !== undefined, "CP-034: Reversed budget range produces HOLD");

// Invalid spec: bad evidence_requirement
const badEvidRes = resolveFormat({
  format: "custom",
  custom_format_spec: { name: "Test", sections: [{ name: "A", budget_percent: "50-50%", purpose: "x" }], evidence_requirement: "always" },
});
assert(badEvidRes.hold !== undefined, "CP-035: Invalid evidence_requirement produces HOLD");

// Custom format in loadStructure
const customStructBrief = baseBrief({ format: "custom", target_words: 1000, custom_format_spec: validCustomBrief.custom_format_spec });
const customStruct = loadStructure(customStructBrief);
assert(customStruct.success === true, "CP-036: loadStructure succeeds with valid custom format");
assert(customStruct.structure.sections.length === 3, "CP-037: Custom structure has 3 sections");

// Custom format immutability
assert(Object.isFrozen(customRes.resolved), "CP-038: Custom format object is frozen");
assert(Object.isFrozen(customRes.resolved.arc), "CP-039: Custom format arc is frozen");
assert(Object.isFrozen(customRes.resolved.word_range), "CP-040: Custom format word_range is frozen");

// ========================================================================
// CORRECTION 4: Documentary word_range restored to 2500-8000
// ========================================================================
console.log("\n--- Correction 4: Documentary word_range ---");

assert(DOCUMENTARY_FORMAT.word_range.min === 2500, "CP-041: Documentary word_range.min is 2500");
assert(DOCUMENTARY_FORMAT.word_range.max === 8000, "CP-042: Documentary word_range.max is 8000");

// Validate that word count warnings use the correct range
const lowWordResult = validateInput(baseBrief({ target_words: 1000 }));
assert(lowWordResult.warnings.some(w => /outside.*range/i.test(w)), "CP-043: 1000 words triggers range warning for documentary");

const okWordResult = validateInput(baseBrief({ target_words: 5000 }));
assert(!okWordResult.warnings.some(w => /outside.*range/i.test(w) && /documentary/i.test(w)), "CP-044: 5000 words does not trigger range warning");

// ========================================================================
// CORRECTION 5: Nested format definitions immutability
// ========================================================================
console.log("\n--- Correction 5: Nested object immutability ---");

assert(Object.isFrozen(DOCUMENTARY_FORMAT.word_range), "CP-045: Documentary word_range is frozen");
assert(Object.isFrozen(DOCUMENTARY_FORMAT.duration_range), "CP-046: Documentary duration_range is frozen");
assert(Object.isFrozen(EXPLAINER_FORMAT.word_range), "CP-047: Explainer word_range is frozen");
assert(Object.isFrozen(EXPLAINER_FORMAT.duration_range), "CP-048: Explainer duration_range is frozen");
assert(Object.isFrozen(SHORT_FORM_FORMAT.word_range), "CP-049: Short-form word_range is frozen");
assert(Object.isFrozen(SHORT_FORM_FORMAT.duration_range), "CP-050: Short-form duration_range is frozen");

// Attempt mutation — should silently fail (strict mode would throw)
try {
  DOCUMENTARY_FORMAT.word_range.min = 999;
} catch (e) { /* expected in strict mode */ }
assert(DOCUMENTARY_FORMAT.word_range.min === 2500, "CP-051: Documentary word_range.min survives mutation attempt");

try {
  EXPLAINER_FORMAT.duration_range.max_minutes = 999;
} catch (e) { /* expected */ }
assert(EXPLAINER_FORMAT.duration_range.max_minutes === 30, "CP-052: Explainer duration_range survives mutation attempt");

// ========================================================================
// CORRECTION 6: Deterministic validation for malformed inputs
// ========================================================================
console.log("\n--- Correction 6: Malformed input validation ---");

// Non-string format
const numFmtRes = resolveFormat({ format: 42 });
assert(numFmtRes.hold !== undefined, "CP-053: Numeric format value produces HOLD");
assert(numFmtRes.hold.type === "HOLD_FORMAT_MISMATCH", "CP-054: Numeric format HOLD type correct");

const boolFmtRes = resolveFormat({ format: true });
assert(boolFmtRes.hold !== undefined, "CP-055: Boolean format value produces HOLD");

const arrFmtRes = resolveFormat({ format: ["documentary"] });
assert(arrFmtRes.hold !== undefined, "CP-056: Array format value produces HOLD");

// NaN target_words
const nanResult = validateInput(baseBrief({ target_words: NaN }));
assert(nanResult.holds.some(h => /target_words/i.test(h.detail)), "CP-057: NaN target_words produces HOLD");

// Negative target_words
const negResult = validateInput(baseBrief({ target_words: -500 }));
assert(negResult.holds.some(h => /target_words/i.test(h.detail)), "CP-058: Negative target_words produces HOLD");

// Infinity target_words
const infResult = validateInput(baseBrief({ target_words: Infinity }));
assert(infResult.holds.some(h => /target_words/i.test(h.detail)), "CP-059: Infinity target_words produces HOLD");

// Float target_words
const floatResult = validateInput(baseBrief({ target_words: 3000.5 }));
assert(floatResult.holds.some(h => /target_words/i.test(h.detail)), "CP-060: Float target_words produces HOLD");

// String target_words
const strResult = validateInput(baseBrief({ target_words: "three thousand" }));
assert(strResult.holds.some(h => /target_words/i.test(h.detail)), "CP-061: String target_words produces HOLD");

// Malformed duration strings in estimateWordsFromDuration
const explainerFmt = getFormatDefinition("explainer");
assert(estimateWordsFromDuration("", explainerFmt) === formatDefaultWords(explainerFmt), "CP-062: Empty duration returns format default");
assert(estimateWordsFromDuration(null, explainerFmt) === formatDefaultWords(explainerFmt), "CP-063: Null duration returns format default");
assert(estimateWordsFromDuration("banana", explainerFmt) === formatDefaultWords(explainerFmt), "CP-064: Unparseable duration returns format default");

const negDurResult = estimateWordsFromDuration("-5 min", explainerFmt);
assert(negDurResult === formatDefaultWords(explainerFmt), "CP-065: Negative duration returns format default");

// Valid durations still work
assert(estimateWordsFromDuration("10 min", explainerFmt) === 1500, "CP-066: 10 min → 1500 words");
assert(estimateWordsFromDuration("120 sec", explainerFmt) === 300, "CP-067: 120 sec → 300 words");
assert(estimateWordsFromDuration("500 words", explainerFmt) === 500, "CP-068: 500 words → 500 words");

// ========================================================================
// CORRECTION 7: Preservation — existing evidence checks, HOLDs, RESEARCH_ONLY
// ========================================================================
console.log("\n--- Correction 7: Preservation of existing functionality ---");

// Evidence validation still works
const noEvidBrief = baseBrief({ evidence: [] });
const noEvidResult = validateInput(noEvidBrief);
assert(noEvidResult.holds.some(h => /evidence/i.test(h.detail) || h.type === "HOLD_NO_EVIDENCE"), "CP-069: Missing evidence still triggers HOLD");

// Niche resolution still works — Tier 3 open niche is accepted, builtin N01 works
const openNicheBrief = baseBrief({ niche: "custom_test_niche_xyz" });
const openNicheResult = validateInput(openNicheBrief);
assert(!openNicheResult.holds.some(h => /invalid niche/i.test(h.detail)), "CP-070: Tier 3 open niche resolution still works");

// RESEARCH_ONLY is preserved in file headers
const fmtRegContent = readFileSync(join(__dirname, "..", "scripts", "format_registry.mjs"), "utf-8");
const validateContent = readFileSync(join(__dirname, "..", "scripts", "validate.mjs"), "utf-8");
const structContent = readFileSync(join(__dirname, "..", "scripts", "structure_loader.mjs"), "utf-8");
assert(fmtRegContent.includes("RESEARCH_ONLY"), "CP-071: format_registry.mjs retains RESEARCH_ONLY status");
assert(validateContent.includes("RESEARCH_ONLY"), "CP-072: validate.mjs retains RESEARCH_ONLY status");
assert(structContent.includes("RESEARCH_ONLY"), "CP-073: structure_loader.mjs retains RESEARCH_ONLY status");

// Format resolution defaults to documentary for legacy briefs
const legacyRes = resolveFormat({});
assert(legacyRes.resolved && legacyRes.resolved.id === "documentary", "CP-074: Empty brief defaults to documentary");

// Documentary format is VALIDATED
assert(DOCUMENTARY_FORMAT.status === FORMAT_STATUS.VALIDATED, "CP-075: Documentary status is VALIDATED");

// ========================================================================
// SUMMARY
// ========================================================================
console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`  M2 Completion Patch Tests`);
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
  join(__dirname, "M2_COMPLETION_PATCH_RECEIPT.json"),
  JSON.stringify({ total: passed + failed, passed, failed, failures, timestamp: new Date().toISOString() }, null, 2)
);
console.log(`\nReceipt written to tests/M2_COMPLETION_PATCH_RECEIPT.json`);
