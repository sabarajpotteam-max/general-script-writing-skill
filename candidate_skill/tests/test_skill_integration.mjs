/**
 * Integration Test Suite — Universal Professional Scriptwriting Skill
 * Tests: input validation, evidence tracing, section budgets,
 * word counting, niche selection, HOLD conditions, script QA.
 * Node.js ESM, no dependencies.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { validateInput, countWords, analyzeScript } from "../scripts/validate.mjs";

let passed = 0;
let failed = 0;
const failures = [];
const results = [];

function test(id, description, fn) {
  try {
    const ok = fn();
    if (ok) {
      passed++;
      results.push({ id, description, result: "PASS" });
    } else {
      failed++;
      failures.push(id);
      results.push({ id, description, result: "FAIL", reason: "Assertion returned false" });
      console.error(`FAIL ${id}: ${description}`);
    }
  } catch (e) {
    failed++;
    failures.push(id);
    results.push({ id, description, result: "FAIL", reason: e.message });
    console.error(`FAIL ${id}: ${description} — ${e.message}`);
  }
}

// Load demo fixtures
const demoInput = JSON.parse(readFileSync(new URL("../examples/demo_input.json", import.meta.url), "utf-8"));
const demoScript = readFileSync(new URL("../examples/demo_script.md", import.meta.url), "utf-8");

// === INPUT VALIDATION TESTS ===

test("INT-001", "Valid demo input passes validation", () => {
  const r = validateInput(demoInput);
  return r.status === "PASS" && r.holds.length === 0;
});

test("INT-002", "Missing title triggers HOLD_MISSING_IDENTITY", () => {
  const input = { ...demoInput, title: "" };
  const r = validateInput(input);
  return r.status === "HOLD" && r.holds.some(h => h.type === "HOLD_MISSING_IDENTITY");
});

test("INT-003", "Missing niche triggers HOLD_MISSING_IDENTITY", () => {
  const input = { ...demoInput, niche: "" };
  const r = validateInput(input);
  return r.status === "HOLD" && r.holds.some(h => h.type === "HOLD_MISSING_IDENTITY");
});

test("INT-004", "Invalid niche triggers HOLD_MISSING_IDENTITY", () => {
  const input = { ...demoInput, niche: "N99" };
  const r = validateInput(input);
  return r.status === "HOLD" && r.holds.some(h => h.type === "HOLD_MISSING_IDENTITY");
});

test("INT-005", "Missing subject triggers HOLD_MISSING_IDENTITY", () => {
  const input = { ...demoInput, subject: "" };
  const r = validateInput(input);
  return r.status === "HOLD";
});

test("INT-006", "Missing mechanism triggers HOLD_MISSING_IDENTITY", () => {
  const input = { ...demoInput, mechanism: "" };
  const r = validateInput(input);
  return r.status === "HOLD";
});

test("INT-007", "Missing uncertainty triggers HOLD_MISSING_IDENTITY", () => {
  const input = { ...demoInput, uncertainty: "" };
  const r = validateInput(input);
  return r.status === "HOLD";
});

// === BLOCKED/QUARANTINED SOURCE TESTS ===

test("INT-008", "F-190 in evidence triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "F-190", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE" && h.detail.includes("F-190"));
});

test("INT-009", "R052 in evidence triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "R052", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE" && h.detail.includes("R052"));
});

test("INT-010", "K029 in evidence triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "K029", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE" && h.detail.includes("K029"));
});

test("INT-011", "K030 in evidence triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "K030", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE");
});

test("INT-012", "K031 in evidence triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "K031", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE");
});

// === EVIDENCE PROVENANCE TESTS ===

test("INT-013", "Evidence without source triggers HOLD_DISPUTED_PROVENANCE", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-TEST", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_DISPUTED_PROVENANCE");
});

test("INT-014", "Evidence without ID triggers HOLD_DISPUTED_PROVENANCE", () => {
  const input = {
    ...demoInput,
    evidence: [{ source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_DISPUTED_PROVENANCE");
});

// === NICHE ADAPTER TESTS ===

test("INT-015", "N01 stale forecast triggers HOLD_STALE_FORECAST", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-01-01T09:00:00Z",
      valid_until: "2035-01-01T09:30:00Z"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST");
});

test("INT-016", "N01 historical forecast does not trigger HOLD_STALE_FORECAST", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-01-01T09:00:00Z",
      valid_until: "2035-01-01T09:30:00Z",
      reference_time: "2035-01-01T12:00:00Z",
      historical_context: true
    }
  };
  const r = validateInput(input);
  return !r.holds.some(h => h.type === "HOLD_STALE_FORECAST");
});

test("INT-017", "N03 invented quote triggers HOLD_HARM", () => {
  const input = {
    ...demoInput,
    niche: "N03",
    niche_context: { invented_quote_as_historical: true }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM");
});

test("INT-018", "N04 synthetic video triggers HOLD_HARM", () => {
  const input = {
    ...demoInput,
    niche: "N04",
    niche_context: { synthetic_video_claimed_authentic: true }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM");
});

test("INT-019", "N05 valid input with proper evidence passes", () => {
  const r = validateInput(demoInput);
  return r.status === "PASS" && r.stages.niche_check === "PASS";
});

// === TITLE PREMISE TESTS ===

test("INT-020", "Title with 'Confirmed' but uncertainty != confirmed triggers HOLD_TITLE_PREMISE", () => {
  const input = {
    ...demoInput,
    title: "Scientists Confirmed the Sleep Effect",
    uncertainty: "preliminary"
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_TITLE_PREMISE");
});

test("INT-021", "Title with 'Proven' and uncertainty 'may' triggers HOLD_TITLE_PREMISE", () => {
  const input = {
    ...demoInput,
    title: "Proven Link Between Sleep and Memory",
    uncertainty: "may"
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_TITLE_PREMISE");
});

test("INT-022", "Neutral title with uncertainty 'is believed to' passes", () => {
  const r = validateInput(demoInput);
  return !r.holds.some(h => h.type === "HOLD_TITLE_PREMISE");
});

// === WORD COUNTING TESTS ===

test("INT-023", "countWords counts correctly", () => {
  return countWords("one two three four five") === 5;
});

test("INT-024", "countWords handles newlines", () => {
  return countWords("one two\nthree four\nfive") === 5;
});

test("INT-025", "countWords handles empty string", () => {
  return countWords("") === 0;
});

test("INT-026", "countWords handles multiple spaces", () => {
  return countWords("one   two   three") === 3;
});

// === SCRIPT ANALYSIS TESTS ===

test("INT-027", "Demo script has all 7 evidence items referenced", () => {
  const analysis = analyzeScript(demoScript, demoInput);
  return analysis.evidence_referenced.length === 7 && analysis.evidence_unreferenced.length === 0;
});

test("INT-028", "Demo script total words are within target range", () => {
  const analysis = analyzeScript(demoScript, demoInput);
  return analysis.total_words >= 2500 && analysis.total_words <= 3300;
});

test("INT-029", "Demo script has no epistemic upgrades", () => {
  const analysis = analyzeScript(demoScript, demoInput);
  return analysis.epistemic_integrity === "PASS";
});

test("INT-030", "Demo script maintains subject consistency", () => {
  const analysis = analyzeScript(demoScript, demoInput);
  return analysis.subject_consistency === "PASS";
});

test("INT-031", "Demo script maintains object consistency", () => {
  const analysis = analyzeScript(demoScript, demoInput);
  return analysis.object_consistency === "PASS";
});

test("INT-032", "Script analysis detects missing evidence references", () => {
  const fakeInput = {
    ...demoInput,
    evidence: [
      ...demoInput.evidence,
      { id: "E-999", source: "fake", epistemic_status: "hypothetical" }
    ]
  };
  const analysis = analyzeScript(demoScript, fakeInput);
  return analysis.evidence_unreferenced.includes("E-999");
});

test("INT-033", "Script analysis detects epistemic upgrade in text", () => {
  // Insert the epistemic violation before the Evidence Register section
  const marker = "## Evidence Register";
  const idx = demoScript.indexOf(marker);
  const fakeScript = idx > 0
    ? demoScript.slice(0, idx) + "\n## Test Section\n\nThis proves that spindles cause memory enhancement.\n\n" + demoScript.slice(idx)
    : demoScript + "\n## Test Section\n\nThis proves that spindles cause memory enhancement.\n";
  const analysis = analyzeScript(fakeScript, demoInput);
  return analysis.epistemic_upgrades.length > 0;
});

// === EVIDENCE REGISTER TESTS ===

test("INT-034", "Evidence register has correct count", () => {
  const r = validateInput(demoInput);
  return r.evidence_register.length === 7;
});

test("INT-035", "B70 source gets caveat in evidence register", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "B70", source: "test source", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  const entry = r.evidence_register.find(e => e.id === "B70");
  return entry && entry.caveats.length > 0 && entry.caveats[0].includes("access restrictions");
});

// === WORKFLOW STAGE TESTS ===

test("INT-036", "All stages pass for valid demo input", () => {
  const r = validateInput(demoInput);
  return r.stages.topic_intake === "PASS" &&
         r.stages.evidence_validation === "PASS" &&
         r.stages.niche_check === "PASS" &&
         r.stages.title_check === "PASS";
});

test("INT-037", "Stage breakdown isolates HOLD to correct stage", () => {
  const input = { ...demoInput, title: "Confirmed Sleep Memory Effect", uncertainty: "may" };
  const r = validateInput(input);
  return r.stages.topic_intake === "PASS" &&
         r.stages.evidence_validation === "PASS" &&
         r.stages.title_check === "HOLD";
});

// === NICHE ALL-VALID TESTS ===

test("INT-038", "N01 with valid historical context passes", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2020-01-01T09:00:00Z",
      valid_until: "2020-01-01T09:30:00Z",
      reference_time: "2020-01-01T12:00:00Z",
      historical_context: true
    }
  };
  const r = validateInput(input);
  return r.stages.niche_check === "PASS";
});

test("INT-039", "N02 without operational claims passes", () => {
  const input = { ...demoInput, niche: "N02" };
  const r = validateInput(input);
  return r.stages.niche_check === "PASS";
});

test("INT-040", "N03 without invented quotes passes", () => {
  const input = { ...demoInput, niche: "N03" };
  const r = validateInput(input);
  return r.stages.niche_check === "PASS";
});

test("INT-041", "N04 without synthetic video passes", () => {
  const input = { ...demoInput, niche: "N04" };
  const r = validateInput(input);
  return r.stages.niche_check === "PASS";
});

test("INT-042", "Script has multiple sections with word budgets", () => {
  const analysis = analyzeScript(demoScript, demoInput);
  return analysis.sections.length >= 6 && analysis.sections.every(s => s.words > 50);
});

// === COMPREHENSIVE INPUT TESTS ===

test("INT-043", "Empty evidence list produces HOLD_UNVERIFIED_FACT (Defect 1 regression)", () => {
  const input = { ...demoInput, evidence: [] };
  const r = validateInput(input);
  return r.status === "HOLD" && r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("No evidence"));
});

test("INT-044", "Non-standard epistemic status triggers HOLD_UNVERIFIED_FACT (fail-closed)", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-TEST", source: "test", epistemic_status: "maybe", fictional: true }]
  };
  const r = validateInput(input);
  return r.status === "HOLD" && r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("unknown epistemic status"));
});

test("INT-045", "Multiple HOLD types can coexist", () => {
  const input = {
    ...demoInput,
    title: "",
    niche: "N04",
    niche_context: { synthetic_video_claimed_authentic: true },
    evidence: [{ id: "F-190", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  const holdTypes = new Set(r.holds.map(h => h.type));
  return holdTypes.has("HOLD_MISSING_IDENTITY") && holdTypes.has("HOLD_HARM") && holdTypes.has("HOLD_SOURCE_ROLE");
});

// === DEFECT REGRESSION TESTS (Phase 2.1) ===

test("INT-046", "Defect 2: Expired 6-hour forecast triggers HOLD_STALE_FORECAST", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2020-01-01T06:00:00Z",
      valid_until: "2020-01-01T12:00:00Z",
      reference_time: "2020-01-01T18:00:00Z"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST" && h.detail.includes("expired"));
});

test("INT-047", "Defect 3: Unrelated replicated evidence does not corroborate a different confirmed claim", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-A", source: "Study A", claim: "Claim Alpha", epistemic_status: "confirmed", fictional: true },
      { id: "E-B", source: "Study B", claim: "Claim Beta", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-A"));
});

test("INT-048", "Defect 3: Related replicated evidence DOES corroborate a confirmed claim", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-A", source: "Study A", claim: "Spindle density affects memory", source_family: "LabA", epistemic_status: "confirmed", fictional: true },
      { id: "E-B", source: "Study B", claim: "Spindle density affects memory", source_family: "LabB", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return !r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-A"));
});

test("INT-049", "Defect 4: N02 prototype claimed operational triggers HOLD_HARM", () => {
  const input = {
    ...demoInput,
    niche: "N02",
    niche_context: { technology_stage: "prototype", claimed_operational: true }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM" && h.detail.includes("prototype"));
});

test("INT-050", "Defect 5: N04 provisional casualties called final triggers HOLD_HARM", () => {
  const input = {
    ...demoInput,
    niche: "N04",
    niche_context: { provisional_casualties_called_final: true }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM" && h.detail.toLowerCase().includes("provisional") && h.detail.toLowerCase().includes("casualty"));
});

test("INT-051", "Defect 6: Non-fictional evidence missing rights info triggers HOLD_RIGHTS", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-REAL", source: "Real study", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_RIGHTS" && h.detail.includes("rights"));
});

test("INT-052", "Defect 6: Fictional evidence missing rights info does NOT trigger HOLD_RIGHTS", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-FIC", source: "Fictional study", epistemic_status: "qualified", fictional: true }]
  };
  const r = validateInput(input);
  return !r.holds.some(h => h.type === "HOLD_RIGHTS");
});

test("INT-053", "Defect 6: Evidence with can_use_for_synthetic=true does NOT trigger HOLD_RIGHTS", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-OK", source: "Licensed study", epistemic_status: "qualified", can_use_for_synthetic: true }]
  };
  const r = validateInput(input);
  return !r.holds.some(h => h.type === "HOLD_RIGHTS");
});

// === HARDENING REGRESSION TESTS (Phase 2.2) ===

test("INT-054", "Phase 2.2 D1: can_use_for_synthetic=false ALWAYS triggers HOLD_RIGHTS even with fictional=true", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-DENIED", source: "Denied source", epistemic_status: "qualified", fictional: true, can_use_for_synthetic: false }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_RIGHTS" && h.detail.includes("explicitly denied"));
});

test("INT-055", "Phase 2.2 D1: can_use_for_synthetic=false triggers HOLD_RIGHTS even without fictional flag", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-DENIED2", source: "Real denied", epistemic_status: "qualified", can_use_for_synthetic: false }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_RIGHTS" && h.detail.includes("explicitly denied"));
});

test("INT-056", "Phase 2.2 D2: Same source_family replicated evidence does NOT corroborate confirmed claim", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-X", source: "Lab X Report 1", claim: "Drug Z works", source_family: "LabX", epistemic_status: "confirmed", fictional: true },
      { id: "E-Y", source: "Lab X Report 2", claim: "Drug Z works", source_family: "LabX", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-X"));
});

test("INT-057", "Phase 2.2 D2: Different source_family replicated evidence DOES corroborate confirmed claim", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-X", source: "Lab X Report", claim: "Drug Z works", source_family: "LabX", epistemic_status: "confirmed", fictional: true },
      { id: "E-Y", source: "Lab Y Report", claim: "Drug Z works", source_family: "LabY", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return !r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-X"));
});

test("INT-058", "Phase 2.2 D3: Missing N01 timestamps triggers HOLD_STALE_FORECAST (fail-closed)", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {}
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST" && h.detail.includes("requires"));
});

test("INT-059", "Phase 2.2 D3: Malformed N01 timestamps trigger HOLD_STALE_FORECAST", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "not-a-date",
      valid_until: "also-not-a-date",
      reference_time: "still-not-a-date"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST" && h.detail.includes("malformed"));
});

test("INT-060", "Phase 2.2 D3: Malformed reference_time triggers HOLD_STALE_FORECAST", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-01-01T06:00:00Z",
      valid_until: "2035-01-01T12:00:00Z",
      reference_time: "garbage"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST" && h.detail.includes("malformed"));
});

test("INT-061", "Phase 2.2 D4: request_release=true triggers HOLD_NOT_APPROVED", () => {
  const input = { ...demoInput, request_release: true };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_NOT_APPROVED" && h.detail.includes("request_release"));
});

test("INT-062", "Phase 2.2 D4: request_claude_transfer=true triggers HOLD_NOT_APPROVED", () => {
  const input = { ...demoInput, request_claude_transfer: true };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_NOT_APPROVED" && h.detail.includes("request_claude_transfer"));
});

test("INT-063", "Phase 2.2 D4: production_gate stage reports HOLD when transfer requested", () => {
  const input = { ...demoInput, request_release: true };
  const r = validateInput(input);
  return r.stages.production_gate === "HOLD";
});

test("INT-064", "Phase 2.2 D4: production_gate stage PASS when no transfer/release requested", () => {
  const r = validateInput(demoInput);
  return r.stages.production_gate === "PASS";
});

test("INT-065", "Phase 2.2 Bonus: Unknown epistemic status HOLD is distinct from missing rights HOLD", () => {
  const input = {
    ...demoInput,
    evidence: [{ id: "E-UNK", source: "Some study", epistemic_status: "unknown_status", fictional: true }]
  };
  const r = validateInput(input);
  const hasEpistemic = r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("unknown epistemic"));
  const noRights = !r.holds.some(h => h.type === "HOLD_RIGHTS");
  return hasEpistemic && noRights;
});

// === FINAL ACCEPTANCE REGRESSION TESTS ===

test("INT-066", "Confirmed claim with missing source_family on confirmed item triggers HOLD (unknown independence)", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-C1", source: "Study C1", claim: "Effect X exists", epistemic_status: "confirmed", fictional: true },
      { id: "E-C2", source: "Study C2", claim: "Effect X exists", source_family: "LabC2", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-C1"));
});

test("INT-067", "Confirmed claim with missing source_family on replicated item triggers HOLD (unknown independence)", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-D1", source: "Study D1", claim: "Effect Y exists", source_family: "LabD1", epistemic_status: "confirmed", fictional: true },
      { id: "E-D2", source: "Study D2", claim: "Effect Y exists", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-D1"));
});

test("INT-068", "Confirmed claim with both source_families missing triggers HOLD (unknown independence)", () => {
  const input = {
    ...demoInput,
    evidence: [
      { id: "E-F1", source: "Study F1", claim: "Effect Z exists", epistemic_status: "confirmed", fictional: true },
      { id: "E-F2", source: "Study F2", claim: "Effect Z exists", epistemic_status: "replicated", fictional: true }
    ]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_UNVERIFIED_FACT" && h.detail.includes("E-F1"));
});

test("INT-069", "N01 missing reference_time triggers HOLD_STALE_FORECAST (deterministic requirement)", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-06-01T06:00:00Z",
      valid_until: "2035-06-01T18:00:00Z"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST" && h.detail.includes("reference_time"));
});

test("INT-070", "N01 with all three valid timestamps and wide window passes", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-06-01T06:00:00Z",
      valid_until: "2035-06-01T18:00:00Z",
      reference_time: "2035-06-01T10:00:00Z"
    }
  };
  const r = validateInput(input);
  return !r.holds.some(h => h.type === "HOLD_STALE_FORECAST");
});

test("INT-071", "N01 expired forecast detected via reference_time, not system clock", () => {
  const input = {
    ...demoInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-06-01T06:00:00Z",
      valid_until: "2035-06-01T12:00:00Z",
      reference_time: "2035-06-01T18:00:00Z"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST" && h.detail.includes("expired"));
});

// === Print results ===
const total = passed + failed;
console.log(`\n=== Skill Integration Test Results ===`);
console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`Failures: ${failures.join(", ")}`);
}

// Write receipt
const receipt = {
  executed_at: new Date().toISOString(),
  suite: "skill_integration",
  total,
  passed,
  failed,
  results,
  disclaimer: "Integration tests for candidate skill. Not a production validation."
};

writeFileSync(
  new URL("./INTEGRATION_TEST_RECEIPT.json", import.meta.url),
  JSON.stringify(receipt, null, 2) + "\n"
);
console.log(`\nReceipt written to tests/INTEGRATION_TEST_RECEIPT.json`);

process.exit(failed > 0 ? 1 : 0);
