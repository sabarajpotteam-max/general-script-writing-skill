/**
 * M2 Step 6: Demonstrate format selection for 5 synthetic briefs
 * Shows deterministic routing: legacy→documentary, explicit formats, unsupported→HOLD
 */

import { resolveFormat } from "../scripts/format_registry.mjs";
import { loadStructure } from "../scripts/structure_loader.mjs";
import { validateInput } from "../scripts/validate.mjs";

const briefs = [
  {
    label: "Brief 1: Legacy brief (no format field) — expects documentary",
    input: {
      title: "How NOAA Predicts Hurricanes",
      niche: "N01",
      subject: "NOAA prediction models",
      object: "hurricane forecast accuracy",
      mechanism: "ML + atmospheric data fusion",
      uncertainty: "preliminary",
      target_words: 3000,
      niche_context: { issued_at: "2026-01-01", valid_until: "2026-12-31", reference_time: "2026-06-01" },
      evidence: [{ id: "E-001", source: "NOAA Technical Report", epistemic_status: "preliminary", can_use_for_synthetic: true }]
    }
  },
  {
    label: "Brief 2: Explicit documentary format",
    input: {
      title: "The Tank That Changed Warfare",
      niche: "N02",
      subject: "M1 Abrams development",
      object: "modern tank doctrine",
      mechanism: "composite armor + turbine engine",
      uncertainty: "confirmed",
      format: "documentary",
      target_words: 4000,
      niche_context: { technology_stage: "operational", classification_level: "unclassified" },
      evidence: [{ id: "E-002", source: "DoD archives", epistemic_status: "confirmed", can_use_for_synthetic: true }]
    }
  },
  {
    label: "Brief 3: Explainer format (DESIGN TARGET)",
    input: {
      title: "Why Quantum Computers Are Different",
      niche: "technology",
      subject: "quantum computing basics",
      object: "qubit vs classical bit",
      mechanism: "superposition and entanglement",
      uncertainty: "confirmed",
      format: "explainer",
      target_words: 2000,
      evidence: [{ id: "E-003", source: "Nature Physics", epistemic_status: "confirmed", can_use_for_synthetic: true }]
    }
  },
  {
    label: "Brief 4: Short-form format (DESIGN TARGET)",
    input: {
      title: "3 Signs of a Housing Bubble",
      niche: "finance",
      subject: "housing market indicators",
      object: "bubble detection",
      mechanism: "price-to-income ratio analysis",
      uncertainty: "qualified",
      format: "short_form",
      target_words: 300,
      evidence: [{ id: "E-004", source: "Fed Reserve data", epistemic_status: "qualified", can_use_for_synthetic: true }]
    }
  },
  {
    label: "Brief 5: Unsupported format — expects HOLD_FORMAT_MISMATCH",
    input: {
      title: "The Haunted Lighthouse",
      niche: "entertainment",
      subject: "lighthouse mystery",
      object: "paranormal investigation",
      mechanism: "atmospheric phenomena",
      uncertainty: "hypothetical",
      format: "audio_drama",
      target_words: 5000,
      evidence: [{ id: "E-005", source: "local records", epistemic_status: "hypothetical", can_use_for_synthetic: true }]
    }
  }
];

console.log("═══════════════════════════════════════════════════════════════");
console.log("  M2 FORMAT ROUTER DEMONSTRATION — 5 Synthetic Briefs");
console.log("═══════════════════════════════════════════════════════════════\n");

for (const { label, input } of briefs) {
  console.log(`\n─── ${label} ───`);

  const fmtResult = resolveFormat(input);
  const structResult = loadStructure(input);
  const validation = validateInput(input);

  console.log(`  Format requested:  ${input.format || "(none — legacy)"}`);
  console.log(`  Format resolved:   ${fmtResult.resolved ? fmtResult.resolved.id : "NONE"}`);
  console.log(`  Format status:     ${fmtResult.resolved ? fmtResult.resolved.status : "N/A"}`);

  if (fmtResult.hold) {
    console.log(`  HOLD:              ${fmtResult.hold.type} — ${fmtResult.hold.message}`);
  }
  if (fmtResult.warning) {
    console.log(`  WARNING:           ${fmtResult.warning.message}`);
  }

  if (structResult.success) {
    const s = structResult.structure;
    console.log(`  Arc:               ${s.arc_name} (${s.sections.length} sections)`);
    console.log(`  Evidence req:      ${s.evidence_requirement}`);
    console.log(`  Word tolerance:    ±${Math.round(s.spoken_word_budget_tolerance * 100)}%`);
    console.log(`  Target words:      ${s.target_words}`);
    console.log(`  Sections:`);
    for (const sec of s.sections) {
      console.log(`    ${sec.label.padEnd(15)} ${sec.min_words}-${sec.max_words} words (${sec.min_pct}-${sec.max_pct}%)`);
    }
  }

  console.log(`  Validation status: ${validation.status}`);
  console.log(`  Format stage:      ${validation.stages.format_resolution}`);
  if (validation.holds.length > 0) {
    console.log(`  Holds (${validation.holds.length}):`);
    for (const h of validation.holds) {
      console.log(`    - ${h.type}: ${h.detail.substring(0, 80)}`);
    }
  }
}

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  DEMONSTRATION COMPLETE");
console.log("═══════════════════════════════════════════════════════════════");
