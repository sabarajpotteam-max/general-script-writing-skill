/**
 * M3.1 Regression Tests — Final Integration & Safety Patch
 * Covers all 6 fixes: FIX 1 (sync, tested externally), FIX 2 (evidence safety gate),
 * FIX 3 (simple client briefs), FIX 4 (exact section budgets), FIX 5 (hybrid claim boundaries),
 * FIX 6 (test baseline reconciliation — this file itself).
 * Node.js ESM, no dependencies. Status: RESEARCH_ONLY.
 */

import { writeFileSync } from "node:fs";
import {
  CONTENT_TYPES,
  RESEARCH_MODES,
  RESEARCH_STATES,
  CLAIM_TYPES,
  resolveM3,
  inferContentType,
  inferResearchMode,
  getEvidencePolicy,
  assessGenerationReadiness,
  deriveResearchState,
  tagClaim,
  tagClaimsInSection,
} from "../scripts/content_type_engine.mjs";

import {
  loadStructure,
  normalizeSectionBudgets,
} from "../scripts/structure_loader.mjs";

import { validateInput } from "../scripts/validate.mjs";

import {
  DOCUMENTARY_FORMAT,
  SHORT_FORM_FORMAT,
  EXPLAINER_FORMAT,
} from "../scripts/format_registry.mjs";

let total = 0, passed = 0, failed = 0;
const failures = [];

function assert(condition, label) {
  total++;
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.log(`  FAIL ${label}`);
  }
}

// ========================================================================
// FIX 2: Evidence Safety Gate — Research States & Generation Readiness
// ========================================================================
console.log("--- FIX 2: Research States ---");

{
  assert(RESEARCH_STATES.NOT_STARTED === "not_started", "R2-001: NOT_STARTED enum value");
  assert(RESEARCH_STATES.RESEARCH_PENDING === "research_pending", "R2-002: RESEARCH_PENDING enum value");
  assert(RESEARCH_STATES.VERIFIED === "verified", "R2-003: VERIFIED enum value");
  assert(RESEARCH_STATES.PARTIALLY_VERIFIED === "partially_verified", "R2-004: PARTIALLY_VERIFIED enum value");
  assert(RESEARCH_STATES.UNRESOURCED === "unresourced", "R2-005: UNRESOURCED enum value");
  assert(RESEARCH_STATES.FAILED === "failed", "R2-006: FAILED enum value");
  assert(Object.isFrozen(RESEARCH_STATES), "R2-007: RESEARCH_STATES is frozen");
}

console.log("--- FIX 2: deriveResearchState ---");

{
  const brief_no_ev = { evidence: [] };
  const brief_with_ev = { evidence: [{ id: "E-1" }] };

  assert(deriveResearchState(brief_no_ev, RESEARCH_MODES.MINIMAL, false) === RESEARCH_STATES.NOT_STARTED,
    "R2-010: minimal + no evidence → NOT_STARTED");
  assert(deriveResearchState(brief_with_ev, RESEARCH_MODES.CLIENT_PROVIDED, false) === RESEARCH_STATES.SUBMITTED,
    "R2-011: client_provided + evidence → SUBMITTED (M3.2: evidence present but not independently verified)");
  assert(deriveResearchState(brief_no_ev, RESEARCH_MODES.CLIENT_PROVIDED, false) === RESEARCH_STATES.NOT_STARTED,
    "R2-012: client_provided + no evidence → NOT_STARTED");
  assert(deriveResearchState(brief_with_ev, RESEARCH_MODES.SYSTEM_ASSISTED, false) === RESEARCH_STATES.PARTIALLY_VERIFIED,
    "R2-013: system_assisted + evidence → PARTIALLY_VERIFIED");
  assert(deriveResearchState(brief_no_ev, RESEARCH_MODES.SYSTEM_ASSISTED, true) === RESEARCH_STATES.RESEARCH_PENDING,
    "R2-014: system_assisted + no evidence + provider → RESEARCH_PENDING");
  assert(deriveResearchState(brief_no_ev, RESEARCH_MODES.SYSTEM_ASSISTED, false) === RESEARCH_STATES.UNRESOURCED,
    "R2-015: system_assisted + no evidence + no provider → UNRESOURCED");
}

console.log("--- FIX 2: assessGenerationReadiness ---");

{
  const m3Clean = { holds: [], evidence_policy: { evidence_required: false } };
  const readiness1 = assessGenerationReadiness(m3Clean, RESEARCH_STATES.NOT_STARTED, false);
  assert(readiness1.brief_accepted === true, "R2-020: No holds → brief_accepted");
  assert(readiness1.research_ready === true, "R2-021: No evidence required → research_ready");
  assert(readiness1.factual_generation_permitted === true, "R2-022: No evidence required + accepted → factual OK");
  assert(readiness1.production_release_permitted === false, "R2-023: RESEARCH_ONLY → production never permitted");

  const m3Blocked = { holds: [{ type: "HOLD_NO_EVIDENCE" }], evidence_policy: { evidence_required: true } };
  const readiness2 = assessGenerationReadiness(m3Blocked, RESEARCH_STATES.UNRESOURCED, false);
  assert(readiness2.brief_accepted === false, "R2-024: With holds → brief NOT accepted");
  assert(readiness2.factual_generation_permitted === false, "R2-025: Unresourced → factual NOT permitted");
  assert(readiness2.production_release_permitted === false, "R2-026: RESEARCH_ONLY → production never");

  const m3Verified = { holds: [], evidence_policy: { evidence_required: true } };
  const readiness3 = assessGenerationReadiness(m3Verified, RESEARCH_STATES.VERIFIED, true);
  assert(readiness3.brief_accepted === true, "R2-027: No holds → brief_accepted");
  assert(readiness3.research_ready === true, "R2-028: VERIFIED → research_ready");
  assert(readiness3.factual_generation_permitted === true, "R2-029: VERIFIED + accepted → factual permitted");
  assert(readiness3.production_release_permitted === false, "R2-030: RESEARCH_ONLY always");

  assert(Object.isFrozen(readiness1), "R2-031: readiness object is frozen");
}

console.log("--- FIX 2: resolveM3 with provider options ---");

{
  const brief = {
    title: "Test", niche: "N05", topic: "climate", content_type: "factual",
    format: "documentary", evidence: [], target_words: 3000,
    uncertainty: "qualified",
  };
  const m3_no_provider = resolveM3(brief, DOCUMENTARY_FORMAT);
  assert(m3_no_provider.research_state === RESEARCH_STATES.UNRESOURCED,
    "R2-040: factual + no evidence + no provider → UNRESOURCED");
  assert(m3_no_provider.holds.some(h => h.type === "HOLD_NO_EVIDENCE"),
    "R2-041: UNRESOURCED triggers HOLD_NO_EVIDENCE");
  assert(m3_no_provider.generation_readiness.factual_generation_permitted === false,
    "R2-042: UNRESOURCED → factual generation NOT permitted");

  const m3_with_provider = resolveM3(brief, DOCUMENTARY_FORMAT, { providerAvailable: true });
  assert(m3_with_provider.research_state === RESEARCH_STATES.RESEARCH_PENDING,
    "R2-043: factual + no evidence + provider → RESEARCH_PENDING");
  assert(m3_with_provider.holds.every(h => h.type !== "HOLD_NO_EVIDENCE"),
    "R2-044: RESEARCH_PENDING does NOT trigger HOLD_NO_EVIDENCE");
}

// ========================================================================
// FIX 3: Simple Client Briefs
// ========================================================================
console.log("--- FIX 3: Simple Client Briefs ---");

{
  const simpleBrief = {
    title: "10 Tips for Better Sleep",
    niche: "N05",
    topic: "sleep hygiene",
    audience: "general public",
    language: "English",
    format: "explainer",
    target_words: 2000,
    evidence: [{ id: "E-1", source: "test", epistemic_status: "preliminary", can_use_for_synthetic: true }],
  };
  const result = validateInput(simpleBrief);
  assert(result.status !== "FAIL" || result.holds.every(h => !h.type.includes("MISSING_FIELD")),
    "R3-001: Simple brief (topic only) accepted without subject/object/mechanism");
  assert(result.m3_resolution !== null, "R3-002: Simple brief gets M3 resolution");
  assert(result.m3_resolution.research_mode === "client_provided",
    "R3-003: Simple brief with evidence → client_provided");
}

{
  const minimalBrief = {
    title: "Quick Guide",
    niche: "N05",
    topic: "cooking basics",
    target_words: 500,
    format: "short_form",
    evidence: [],
  };
  const result = validateInput(minimalBrief);
  const missingFieldHolds = result.holds.filter(h => h.type === "MISSING_FIELD");
  assert(missingFieldHolds.length === 0, "R3-004: Minimal new-style brief has no MISSING_FIELD holds");
}

{
  const legacyBrief = {
    title: "Storm Prediction", niche: "N05",
    subject: "NOAA models", object: "hurricane accuracy", mechanism: "ML fusion",
    uncertainty: "preliminary", target_words: 3000,
    evidence: [{ id: "E-1", source: "test", epistemic_status: "preliminary", can_use_for_synthetic: true }],
  };
  const result = validateInput(legacyBrief);
  assert(result.m3_resolution !== null, "R3-005: Legacy brief still processes through M3");
  assert(result.m3_resolution.research_mode === "client_provided",
    "R3-006: Legacy brief with evidence → client_provided");
}

{
  const newStyleWithUncertainty = {
    title: "Health Tips", niche: "N05", topic: "vitamins",
    format: "explainer", target_words: 1500,
    evidence: [],
  };
  const result = validateInput(newStyleWithUncertainty);
  assert(!result.holds.some(h => h.type === "MISSING_FIELD" && h.detail && h.detail.includes("uncertainty")),
    "R3-007: New-style brief auto-fills uncertainty — no MISSING_FIELD for it");
}

// ========================================================================
// FIX 4: Exact Section Budgets
// ========================================================================
console.log("--- FIX 4: Exact Section Budgets ---");

{
  const sections = [
    { id: "a", label: "A", min_pct: 70, max_pct: 80 },
    { id: "b", label: "B", min_pct: 0,  max_pct: 10 },
    { id: "c", label: "C", min_pct: 0,  max_pct: 100 },
  ];
  const result = normalizeSectionBudgets(sections, 1000);
  assert(!result.error, "R4-001: 1000-word budget with 70-80/0-10/0-100 is feasible");
  if (!result.error) {
    const totalWords = result.sections.reduce((s, sec) => s + sec.target_words, 0);
    assert(totalWords === 1000, `R4-002: Exact sum = ${totalWords} must equal 1000`);
    assert(result.sections[0].target_words >= 700 && result.sections[0].target_words <= 800,
      "R4-003: Section A within 70-80% range");
    assert(result.sections[1].target_words >= 0 && result.sections[1].target_words <= 100,
      "R4-004: Section B within 0-10% range");
    assert(result.sections[2].target_words >= 0 && result.sections[2].target_words <= 1000,
      "R4-005: Section C within 0-100% range");
  }
}

{
  const docSections = [
    { id: "hook", label: "Hook", min_pct: 8, max_pct: 12 },
    { id: "problem", label: "Problem", min_pct: 12, max_pct: 15 },
    { id: "discovery", label: "Discovery", min_pct: 16, max_pct: 20 },
    { id: "mechanism", label: "Mechanism", min_pct: 12, max_pct: 15 },
    { id: "challenge", label: "Challenge", min_pct: 12, max_pct: 15 },
    { id: "resolution", label: "Resolution", min_pct: 14, max_pct: 18 },
    { id: "implications", label: "Implications", min_pct: 8, max_pct: 12 },
    { id: "outro", label: "Outro", min_pct: 5, max_pct: 8 },
  ];
  for (const target of [1000, 1500, 2000, 3000, 5000, 7500, 10000]) {
    const result = normalizeSectionBudgets(docSections, target);
    assert(!result.error, `R4-010-${target}: Documentary budget feasible at ${target} words`);
    if (!result.error) {
      const totalWords = result.sections.reduce((s, sec) => s + sec.target_words, 0);
      assert(totalWords === target, `R4-011-${target}: Exact sum = ${totalWords} must equal ${target}`);
      for (const sec of result.sections) {
        assert(sec.target_words >= sec.min_words, `R4-012-${target}-${sec.id}: target >= min_words`);
        assert(sec.target_words <= sec.max_words, `R4-013-${target}-${sec.id}: target <= max_words`);
      }
    }
  }
}

{
  const infeasible = [
    { id: "a", label: "A", min_pct: 60, max_pct: 70 },
    { id: "b", label: "B", min_pct: 50, max_pct: 60 },
  ];
  const result = normalizeSectionBudgets(infeasible, 1000);
  assert(!!result.error, "R4-020: Infeasible budget (min sum > 100%) returns error");
}

{
  const lowMax = [
    { id: "a", label: "A", min_pct: 10, max_pct: 20 },
    { id: "b", label: "B", min_pct: 10, max_pct: 30 },
  ];
  const result = normalizeSectionBudgets(lowMax, 1000);
  assert(!!result.error, "R4-021: Infeasible budget (max sum < 100%) returns error");
}

{
  const result = normalizeSectionBudgets(
    [{ id: "single", label: "Single", min_pct: 100, max_pct: 100 }],
    500
  );
  assert(!result.error, "R4-022: Single section at 100% is feasible");
  if (!result.error) {
    assert(result.sections[0].target_words === 500, "R4-023: Single section gets all 500 words");
  }
}

{
  const sfSections = [
    { id: "hook", label: "Hook", min_pct: 15, max_pct: 25 },
    { id: "body", label: "Body", min_pct: 50, max_pct: 65 },
    { id: "cta",  label: "CTA",  min_pct: 15, max_pct: 25 },
  ];
  for (const target of [50, 100, 200, 500, 800]) {
    const result = normalizeSectionBudgets(sfSections, target);
    assert(!result.error, `R4-030-${target}: Short form budget feasible at ${target}`);
    if (!result.error) {
      const sum = result.sections.reduce((s, sec) => s + sec.target_words, 0);
      assert(sum === target, `R4-031-${target}: Exact sum = ${sum} must equal ${target}`);
    }
  }
}

// ========================================================================
// FIX 5: Hybrid Claim Boundaries
// ========================================================================
console.log("--- FIX 5: Hybrid Claim Boundaries ---");

{
  assert(CLAIM_TYPES.FACTUAL === "factual_claim", "R5-001: FACTUAL enum value");
  assert(CLAIM_TYPES.CREATIVE === "creative_element", "R5-002: CREATIVE enum value");
  assert(CLAIM_TYPES.AMBIGUOUS === "ambiguous", "R5-003: AMBIGUOUS enum value");
  assert(Object.isFrozen(CLAIM_TYPES), "R5-004: CLAIM_TYPES is frozen");
}

{
  const factual = tagClaim("A 2023 study found that 67% of participants improved");
  assert(factual.type === CLAIM_TYPES.FACTUAL, "R5-010: Study reference → factual");
  assert(factual.requires_evidence === true, "R5-011: Factual claims require evidence");
}

{
  const creative = tagClaim("Imagine a world where trees could talk");
  assert(creative.type === CLAIM_TYPES.CREATIVE, "R5-012: Imagine → creative");
  assert(creative.requires_evidence === false, "R5-013: Creative does not require evidence");
}

{
  const mixed = tagClaim("Imagine that research found 50% improvement since 2020");
  assert(mixed.type === CLAIM_TYPES.FACTUAL, "R5-014: Mixed indicators → factual takes precedence");
}

{
  const empty = tagClaim("");
  assert(empty.type === CLAIM_TYPES.AMBIGUOUS, "R5-015: Empty claim → ambiguous");
}

{
  const ambig = tagClaim("The sky is blue today");
  assert(ambig.type === CLAIM_TYPES.AMBIGUOUS, "R5-016: No indicators → ambiguous");
}

{
  const health = tagClaim("The sky is blue today", { health: true });
  assert(health.type === CLAIM_TYPES.FACTUAL, "R5-020: Health domain → always factual");
  assert(health.requires_evidence === true, "R5-021: Health domain requires evidence");
}

{
  const finance = tagClaim("Prices fluctuate", { finance: true });
  assert(finance.type === CLAIM_TYPES.FACTUAL, "R5-022: Finance domain → always factual");
}

{
  const legal = tagClaim("This is normal", { legal: true });
  assert(legal.type === CLAIM_TYPES.FACTUAL, "R5-023: Legal domain → always factual");
}

{
  const safety = tagClaim("Everything is fine", { safety: true });
  assert(safety.type === CLAIM_TYPES.FACTUAL, "R5-024: Safety domain → always factual");
}

{
  const claims = [
    { text: "According to research, 80% agree" },
    { text: "Picture this: a sunset over mountains" },
    { text: "Something happened" },
  ];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.HYBRID);
  assert(tagged[0].tag.type === CLAIM_TYPES.FACTUAL, "R5-030: Hybrid section factual claim tagged correctly");
  assert(tagged[1].tag.type === CLAIM_TYPES.CREATIVE, "R5-031: Hybrid section creative claim tagged correctly");
  assert(tagged[2].tag.type === CLAIM_TYPES.AMBIGUOUS, "R5-032: Hybrid section ambiguous claim tagged correctly");
}

{
  const claims = [{ text: "Picture this: magic" }, { text: "A study shows results" }];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.FACTUAL);
  assert(tagged[0].tag.type === CLAIM_TYPES.FACTUAL, "R5-033: Factual section forces all claims to factual");
  assert(tagged[1].tag.type === CLAIM_TYPES.FACTUAL, "R5-034: Factual section — already factual stays factual");
}

{
  const claims = [{ text: "A study shows 50% improvement" }];
  const tagged = tagClaimsInSection(claims, CONTENT_TYPES.CREATIVE);
  assert(tagged[0].tag.type === CLAIM_TYPES.FACTUAL,
    "R5-035: Factual claim in creative section still tagged as factual");
  assert(tagged[0].tag.requires_evidence === true,
    "R5-036: Factual claim in creative section still requires evidence");
}

// ========================================================================
// FIX 2 + FIX 3 COMBINED: Safety gate through validateInput
// ========================================================================
console.log("--- FIX 2+3 Combined: Safety Gate via validateInput ---");

{
  const brief = {
    title: "Health Guide", niche: "N05", topic: "vitamins",
    content_type: "factual", format: "documentary",
    evidence: [], target_words: 3000,
  };
  const result = validateInput(brief);
  assert(result.m3_resolution.research_state !== undefined,
    "R23-001: validateInput output includes research_state");
  assert(result.m3_resolution.generation_readiness !== undefined,
    "R23-002: validateInput output includes generation_readiness");
  assert(result.m3_resolution.generation_readiness.production_release_permitted === false,
    "R23-003: production_release_permitted is ALWAYS false (RESEARCH_ONLY)");
}

{
  const brief = {
    title: "Creative Story", niche: "N05", topic: "fiction",
    content_type: "creative", format: "short_form",
    evidence: [], target_words: 200,
  };
  const result = validateInput(brief);
  const noEvidenceHold = result.holds.some(h => h.type === "HOLD_NO_EVIDENCE");
  assert(!noEvidenceHold, "R23-004: Creative content does NOT get HOLD_NO_EVIDENCE even without evidence");
  assert(result.m3_resolution.generation_readiness.factual_generation_permitted === true,
    "R23-005: Creative content — factual generation is permitted (no evidence required)");
}

{
  const brief = {
    title: "Medical Facts", niche: "N05", topic: "cancer treatment",
    content_type: "factual", format: "documentary",
    evidence: [{ id: "E-1", source: "PubMed", epistemic_status: "preliminary", can_use_for_synthetic: true }],
    target_words: 3000,
  };
  const result = validateInput(brief);
  assert(result.m3_resolution.research_mode === "client_provided",
    "R23-006: Factual with evidence → client_provided");
  assert(result.m3_resolution.research_state === RESEARCH_STATES.SUBMITTED,
    "R23-007: client_provided with evidence → SUBMITTED (M3.2: client evidence is submitted, not verified)");
}

// ========================================================================
// FIX 4 + Structure Loader integration
// ========================================================================
console.log("--- FIX 4: Structure Loader Integration ---");

{
  const docResult = loadStructure({ format: "documentary", target_words: 3000 });
  assert(docResult.success, "R4S-001: Documentary 3000 words loads");
  if (docResult.success) {
    const sum = docResult.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
    assert(sum === 3000, `R4S-002: Documentary sections sum exactly to 3000 (got ${sum})`);
  }
}

{
  const explResult = loadStructure({ format: "explainer", target_words: 2000 });
  assert(explResult.success, "R4S-003: Explainer 2000 words loads");
  if (explResult.success) {
    const sum = explResult.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
    assert(sum === 2000, `R4S-004: Explainer sections sum exactly to 2000 (got ${sum})`);
  }
}

{
  const sfResult = loadStructure({ format: "short_form", target_words: 200 });
  assert(sfResult.success, "R4S-005: Short form 200 words loads");
  if (sfResult.success) {
    const sum = sfResult.structure.sections.reduce((s, sec) => s + sec.target_words, 0);
    assert(sum === 200, `R4S-006: Short form sections sum exactly to 200 (got ${sum})`);
  }
}

// ========================================================================
// Summary
// ========================================================================

console.log("");
console.log("═".repeat(65));
console.log(`  M3.1 Regression Tests`);
console.log(`  Total: ${total}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`  Failures:`);
  for (const f of failures) console.log(`    - ${f}`);
}
console.log("═".repeat(65));

const receipt = {
  suite: "M3.1 Regression Tests",
  status: "RESEARCH_ONLY",
  timestamp: new Date().toISOString(),
  total, passed, failed,
  failures,
  disclaimer: "Research-only test execution. Not production-verified.",
};
const receiptDir = new URL(".", import.meta.url).pathname;
writeFileSync(receiptDir + "M31_REGRESSION_RECEIPT.json", JSON.stringify(receipt, null, 2));
console.log("\nReceipt written to tests/M31_REGRESSION_RECEIPT.json");
