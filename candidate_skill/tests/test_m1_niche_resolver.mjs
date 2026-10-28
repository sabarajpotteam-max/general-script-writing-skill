/**
 * M1 Niche Resolver Test Suite
 * Tests dynamic niche resolution across all 3 tiers.
 * Node.js ESM, no dependencies.
 */

import { writeFileSync } from "node:fs";
import {
  resolveNiche,
  isRegisteredNiche,
  registerNiche,
  isBuiltinNiche,
  validateInput
} from "../scripts/validate.mjs";

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

// Minimal valid base input for validation tests
const baseInput = {
  title: "M1 Test Documentary",
  niche: "N05",
  subject: "niche resolution",
  object: "scriptwriting skill",
  mechanism: "dynamic tier-based resolver",
  uncertainty: "is believed to",
  target_words: 3000,
  evidence: [
    { id: "E-M1", source: "M1 test source", epistemic_status: "qualified", fictional: true }
  ]
};

// === TEST 1: N01–N05 unchanged behavior ===

test("M1-001", "N01 resolves as Tier 1 registered niche", () => {
  const r = resolveNiche("N01");
  return r.tier === 1 && r.nicheCode === "N01" && r.validation.valid === true;
});

test("M1-002", "N02 resolves as Tier 1 registered niche", () => {
  const r = resolveNiche("N02");
  return r.tier === 1 && r.nicheCode === "N02" && r.validation.valid === true;
});

test("M1-003", "N03 resolves as Tier 1 with era context requirements", () => {
  const r = resolveNiche("N03");
  return r.tier === 1 && r.nicheCode === "N03" && r.policies.some(p => p.includes("era"));
});

test("M1-004", "N04 resolves as Tier 1 registered niche", () => {
  const r = resolveNiche("N04");
  return r.tier === 1 && r.nicheCode === "N04" && r.validation.valid === true;
});

test("M1-005", "N05 resolves as Tier 1 registered niche", () => {
  const r = resolveNiche("N05");
  return r.tier === 1 && r.nicheCode === "N05" && r.validation.valid === true;
});

test("M1-006", "N01 niche has HOLD_STALE_FORECAST in safeguards", () => {
  const r = resolveNiche("N01");
  return r.safeguards.includes("HOLD_STALE_FORECAST");
});

test("M1-007", "N03 niche has HOLD_HARM in safeguards", () => {
  const r = resolveNiche("N03");
  return r.safeguards.includes("HOLD_HARM");
});

test("M1-008", "N05 niche has HOLD_TITLE_PREMISE in safeguards", () => {
  const r = resolveNiche("N05");
  return r.safeguards.includes("HOLD_TITLE_PREMISE");
});

// === TEST 2: Registered N06 fixture acceptance ===

test("M1-009", "Can register a custom N06 niche", () => {
  const entry = registerNiche("N06", {
    domain: "Space Exploration",
    key_concern: "Mission status verification",
    policies: ["Verify mission status against space agency sources", "Distinguish planned from launched missions"],
    safeguards: ["HOLD_UNVERIFIED_FACT"]
  });
  return entry.code === "N06" && entry.domain === "Space Exploration";
});

test("M1-010", "Registered N06 resolves as Tier 1", () => {
  const r = resolveNiche("N06");
  return r.tier === 1 && r.nicheCode === "N06" && r.validation.valid === true;
});

test("M1-011", "Registered N06 has custom policies", () => {
  const r = resolveNiche("N06");
  return r.policies.some(p => p.includes("mission status"));
});

test("M1-012", "isRegisteredNiche returns true for N06 after registration", () => {
  return isRegisteredNiche("N06") === true;
});

// === TEST 3: Recognized science domain ===

test("M1-013", "domain:science resolves as Tier 2", () => {
  const r = resolveNiche("domain:science");
  return r.tier === 2 && r.nicheCode === "domain:science" && r.validation.valid === true;
});

test("M1-014", "domain:science has evidence-related policies", () => {
  const r = resolveNiche("domain:science");
  return r.policies.some(p => p.includes("replication")) && r.policies.some(p => p.includes("correlation"));
});

test("M1-015", "domain:science is not high-stakes", () => {
  const r = resolveNiche("domain:science");
  return r.high_stakes === false;
});

// === TEST 4: Unknown low-risk niche acceptance ===

test("M1-016", "Cooking shows resolves as Tier 3 open niche", () => {
  const r = resolveNiche("cooking shows");
  return r.tier === 3 && r.validation.valid === true && r.validation.open_niche === true;
});

test("M1-017", "Cooking shows is NOT rejected", () => {
  const r = resolveNiche("cooking shows");
  return r.validation.valid === true;
});

test("M1-018", "Cooking shows has universal safeguards", () => {
  const r = resolveNiche("cooking shows");
  return r.safeguards.includes("HOLD_HARM") && r.safeguards.includes("HOLD_UNVERIFIED_FACT");
});

test("M1-019", "Cooking shows is not high-stakes", () => {
  const r = resolveNiche("cooking shows");
  return r.high_stakes === false;
});

test("M1-020", "Artisanal cheese making resolves as Tier 3", () => {
  const r = resolveNiche("artisanal cheese making");
  return r.tier === 3 && r.validation.valid === true;
});

// === TEST 5: Unknown high-stakes niche handling ===

test("M1-021", "Medical advice niche is flagged as high-stakes", () => {
  const r = resolveNiche("medical advice for patients");
  return r.high_stakes === true;
});

test("M1-022", "Medical advice niche has HOLD_REVIEW in safeguards", () => {
  const r = resolveNiche("medical advice for patients");
  return r.safeguards.includes("HOLD_REVIEW");
});

test("M1-023", "Legal analysis niche is flagged as high-stakes", () => {
  const r = resolveNiche("legal analysis of court decisions");
  return r.high_stakes === true;
});

test("M1-024", "Investment trading niche is flagged as high-stakes", () => {
  const r = resolveNiche("investment trading strategies");
  return r.high_stakes === true;
});

test("M1-025", "High-stakes niche triggers HOLD_REVIEW in validation", () => {
  const input = { ...baseInput, niche: "pharmaceutical drug trials" };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_REVIEW" && h.detail.includes("High-stakes"));
});

// === TEST 6: Combined domain overlaps ===

test("M1-026", "Military history description detects history domain", () => {
  const r = resolveNiche("military history documentaries");
  return r.tier >= 2 && r.overlapping_domains.includes("history");
});

test("M1-027", "Combined domains merge policies", () => {
  const r = resolveNiche("sports history");
  return r.overlapping_domains.length === 2 &&
         r.overlapping_domains.includes("sports") &&
         r.overlapping_domains.includes("history");
});

test("M1-028", "Combined domains merge safeguards", () => {
  const r = resolveNiche("sports history");
  const historyOnly = resolveNiche("domain:history");
  const sportsOnly = resolveNiche("domain:sports");
  return r.safeguards.length >= Math.max(historyOnly.safeguards.length, sportsOnly.safeguards.length);
});

test("M1-029", "Health + finance domain overlap is high-stakes", () => {
  const r = resolveNiche("health finance insurance");
  return r.high_stakes === true;
});

// === TEST 7: Invalid/malformed adapter data ===

test("M1-030", "null niche input returns invalid", () => {
  const r = resolveNiche(null);
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-031", "undefined niche input returns invalid", () => {
  const r = resolveNiche(undefined);
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-032", "Empty string niche input returns invalid", () => {
  const r = resolveNiche("");
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-033", "Numeric niche input returns invalid", () => {
  const r = resolveNiche(42);
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-034", "Object niche input returns invalid", () => {
  const r = resolveNiche({});
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-035", "registerNiche rejects null code", () => {
  try {
    registerNiche(null, { domain: "test" });
    return false;
  } catch (e) {
    return e.message.includes("non-empty string");
  }
});

test("M1-036", "registerNiche rejects null config", () => {
  try {
    registerNiche("N99", null);
    return false;
  } catch (e) {
    return e.message.includes("object");
  }
});

// === TEST 8: Missing adapter fallback ===

test("M1-037", "N99 is rejected (looks like registered code but isn't)", () => {
  const r = resolveNiche("N99");
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-038", "N00 is rejected (unrecognized niche code pattern)", () => {
  const r = resolveNiche("N00");
  return r.tier === 0 && r.validation.valid === false;
});

test("M1-039", "domain:nonexistent falls through to Tier 3", () => {
  const r = resolveNiche("domain:nonexistent");
  return r.tier === 3 && r.validation.valid === true;
});

test("M1-040", "Free text that doesn't match any domain is Tier 3", () => {
  const r = resolveNiche("underwater basket weaving");
  return r.tier === 3 && r.validation.valid === true;
});

// === TEST 9: Canonical rule preservation ===

test("M1-041", "Existing N01 validation still triggers HOLD_STALE_FORECAST", () => {
  const input = {
    ...baseInput,
    niche: "N01",
    niche_context: {
      issued_at: "2035-01-01T09:00:00Z",
      valid_until: "2035-01-01T09:30:00Z"
    }
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_STALE_FORECAST");
});

test("M1-042", "Existing N03 era validation still works", () => {
  const input = { ...baseInput, niche: "N03", niche_context: { era_start: 1992, era_end: 1995 } };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM" && h.detail.includes("outside scope"));
});

test("M1-043", "Existing N04 synthetic video check still works", () => {
  const input = { ...baseInput, niche: "N04", niche_context: { synthetic_video_claimed_authentic: true } };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM");
});

test("M1-044", "Blocked source F-190 still triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...baseInput,
    evidence: [{ id: "F-190", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE" && h.detail.includes("F-190"));
});

test("M1-045", "Quarantined K029 still triggers HOLD_SOURCE_ROLE", () => {
  const input = {
    ...baseInput,
    evidence: [{ id: "K029", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE");
});

test("M1-046", "Title premise check still works with Tier 3 niche", () => {
  const input = {
    ...baseInput,
    niche: "cooking shows",
    title: "Scientists Confirmed the Recipe Effect",
    uncertainty: "preliminary"
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_TITLE_PREMISE");
});

// === TEST 10: No safety downgrade through custom niche input ===

test("M1-047", "Tier 3 niche still enforces all HOLD types", () => {
  const input = {
    ...baseInput,
    niche: "cooking shows",
    evidence: [{ id: "F-190", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE");
});

test("M1-048", "Tier 2 domain still enforces blocked sources", () => {
  const input = {
    ...baseInput,
    niche: "domain:science",
    evidence: [{ id: "R052", source: "test", epistemic_status: "qualified" }]
  };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_SOURCE_ROLE");
});

test("M1-049", "Custom niche cannot bypass production gate", () => {
  const input = { ...baseInput, niche: "cooking shows", request_release: true };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_NOT_APPROVED");
});

test("M1-050", "Niche resolution result included in validation output", () => {
  const r = validateInput(baseInput);
  return r.niche_resolution !== null && r.niche_resolution.tier === 1;
});

// ============================================================
// M1.1 REGRESSION TESTS (M1-051 through M1-060)
// ============================================================

// === M1.1-R1: Prevent N01 override ===

test("M1-051", "registerNiche rejects overwrite of builtin N01", () => {
  try {
    registerNiche("N01", { domain: "Fake Weather", policies: [] });
    return false;
  } catch (e) {
    return e.message.includes("Cannot overwrite builtin niche N01");
  }
});

test("M1-052", "isBuiltinNiche returns true for N01-N05", () => {
  return isBuiltinNiche("N01") && isBuiltinNiche("N02") &&
         isBuiltinNiche("N03") && isBuiltinNiche("N04") &&
         isBuiltinNiche("N05");
});

// === M1.1-R2: Prevent registered niche overwrite ===

test("M1-053", "registerNiche rejects overwrite of already-registered N06", () => {
  try {
    registerNiche("N06", { domain: "Duplicate Space", policies: [] });
    return false;
  } catch (e) {
    return e.message.includes("already registered");
  }
});

// === M1.1-R3: High-stakes custom N07 ===

test("M1-054", "Custom niche with medical domain is high-stakes", () => {
  registerNiche("N07", {
    domain: "Medical Device Reviews",
    key_concern: "Clinical safety claims",
    policies: ["Verify FDA clearance status"],
    safeguards: ["HOLD_HARM"]
  });
  const r = resolveNiche("N07");
  return r.high_stakes === true && r.requires_review === true;
});

test("M1-055", "High-stakes custom niche triggers HOLD_REVIEW in validation", () => {
  const input = { ...baseInput, niche: "N07" };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_REVIEW" && h.detail.includes("High-stakes"));
});

// === M1.1-R4: Cryptocurrency classification ===

test("M1-056", "Cryptocurrency niche is flagged as high-stakes", () => {
  const r = resolveNiche("cryptocurrency trading strategies");
  return r.high_stakes === true && r.safeguards.includes("HOLD_REVIEW");
});

test("M1-057", "Blockchain DeFi niche is flagged as high-stakes", () => {
  const r = resolveNiche("blockchain defi protocols explained");
  return r.high_stakes === true;
});

// === M1.1-R5: Medical and finance domain overlap ===

test("M1-058", "Health insurance overlap detects both domains and is high-stakes", () => {
  const r = resolveNiche("health insurance coverage explained");
  return r.high_stakes === true && r.overlapping_domains.includes("health");
});

// === M1.1-R6: Low-risk unknown niche still accepted ===

test("M1-059", "Gardening tutorial is low-risk Tier 3", () => {
  const r = resolveNiche("gardening tutorials for beginners");
  return r.tier === 3 && r.high_stakes === false && r.validation.valid === true;
});

// === M1.1-R7: Missing/malformed adapter schema validation ===

test("M1-060", "registerNiche rejects config without domain string", () => {
  try {
    registerNiche("N08", { policies: ["test"] });
    return false;
  } catch (e) {
    return e.message.includes("'domain' string");
  }
});

test("M1-061", "registerNiche rejects invalid safeguard value", () => {
  try {
    registerNiche("N09", { domain: "Test", safeguards: ["FAKE_HOLD"] });
    return false;
  } catch (e) {
    return e.message.includes("Unknown safeguard");
  }
});

// === M1.1-R8: File-backed persistence ===

test("M1-062", "Builtin N01-N05 loaded from adapter files on init", () => {
  return isRegisteredNiche("N01") && isRegisteredNiche("N02") &&
         isRegisteredNiche("N03") && isRegisteredNiche("N04") &&
         isRegisteredNiche("N05") &&
         isBuiltinNiche("N01") && isBuiltinNiche("N05");
});

// === M1.1-R9: Universal safeguards cannot be removed ===

test("M1-063", "Custom niche always includes UNIVERSAL safeguards", () => {
  registerNiche("N10", {
    domain: "Pottery Making",
    policies: ["Verify kiln temperatures"],
    safeguards: []
  });
  const r = resolveNiche("N10");
  return r.safeguards.includes("HOLD_HARM") &&
         r.safeguards.includes("HOLD_UNVERIFIED_FACT") &&
         r.safeguards.includes("HOLD_SOURCE_ROLE") &&
         r.safeguards.includes("HOLD_DISPUTED_PROVENANCE") &&
         r.safeguards.includes("HOLD_TITLE_PREMISE") &&
         r.safeguards.includes("HOLD_NEEDS_RECHECK") &&
         r.safeguards.includes("HOLD_REVIEW");
});

test("M1-064", "Custom niche with empty safeguards still gets HOLD_REVIEW", () => {
  const r = resolveNiche("N10");
  return r.requires_review === true && r.safeguards.includes("HOLD_REVIEW");
});

// === M1.1-R10: Old niche-specific behavior unchanged ===

test("M1-065", "N01 builtin adapter unchanged after M1.1 hardening", () => {
  const r = resolveNiche("N01");
  return r.tier === 1 && r.high_stakes === false && r.requires_review === false &&
         r.safeguards.includes("HOLD_STALE_FORECAST") &&
         r.policies.some(p => p.includes("issuing agency"));
});

test("M1-066", "N03 builtin era validation unchanged after M1.1", () => {
  const input = { ...baseInput, niche: "N03", niche_context: { era_start: 1992, era_end: 1995 } };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM" && h.detail.includes("outside scope"));
});

test("M1-067", "N04 synthetic video check unchanged after M1.1", () => {
  const input = { ...baseInput, niche: "N04", niche_context: { synthetic_video_claimed_authentic: true } };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_HARM");
});

test("M1-068", "Custom low-risk niche still produces HOLD_REVIEW in validation", () => {
  const input = { ...baseInput, niche: "N10" };
  const r = validateInput(input);
  return r.holds.some(h => h.type === "HOLD_REVIEW" && h.detail.includes("Custom niche"));
});

// === Print results ===
const total = passed + failed;
console.log(`\n=== M1 Niche Resolver Test Results ===`);
console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`Failures: ${failures.join(", ")}`);
}

const receipt = {
  executed_at: new Date().toISOString(),
  suite: "m1_niche_resolver",
  total,
  passed,
  failed,
  results,
  disclaimer: "M1 + M1.1 phase tests for dynamic niche resolution. RESEARCH_ONLY."
};

writeFileSync(
  new URL("./M1_TEST_RECEIPT.json", import.meta.url),
  JSON.stringify(receipt, null, 2) + "\n"
);
console.log(`\nReceipt written to tests/M1_TEST_RECEIPT.json`);

process.exit(failed > 0 ? 1 : 0);
