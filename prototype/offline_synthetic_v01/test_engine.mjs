/**
 * QA Test Runner — 36 deterministic test cases
 * Node.js ESM, no dependencies, no network.
 * Records ACTUAL execution results, not design expectations.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { evaluate } from "./engine.mjs";

const sample = JSON.parse(readFileSync(new URL("./sample.json", import.meta.url), "utf-8"));
const cases = JSON.parse(readFileSync(new URL("./test_cases.json", import.meta.url), "utf-8"));

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyPatches(doc, patches) {
  for (const { path, value } of patches) {
    const parts = path.split(".");
    let target = doc;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = /^\d+$/.test(parts[i]) ? parseInt(parts[i], 10) : parts[i];
      if (target[key] === undefined || target[key] === null) {
        target[key] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      target = target[key];
    }
    const lastKey = /^\d+$/.test(parts[parts.length - 1])
      ? parseInt(parts[parts.length - 1], 10)
      : parts[parts.length - 1];
    target[lastKey] = value;
  }
  return doc;
}

let passed = 0;
let failed = 0;
const failures = [];
const receipt = {
  executed_at: new Date().toISOString(),
  engine_version: "0.1.0-synthetic",
  total_cases: 0,
  passed: 0,
  failed: 0,
  results: [],
  disclaimer: "Actual execution results from fictional fixtures only. No real-source verification, human review, or production transfer was performed."
};

// Positive check: unmodified sample must pass
const baseline = evaluate(deepClone(sample));
if (baseline.status !== "RESEARCH_ONLY_TERMINAL") {
  console.error("FAIL: baseline sample did not produce RESEARCH_ONLY_TERMINAL, got:", baseline.status);
  failures.push("BASELINE");
  failed++;
} else if (baseline.meta.production_allowed !== false) {
  console.error("FAIL: baseline production_allowed is not false");
  failures.push("BASELINE_META");
  failed++;
} else if (!baseline.artifact || !baseline.artifact.includes("FICTIONAL")) {
  console.error("FAIL: baseline artifact must state inputs are fictional");
  failures.push("BASELINE_ARTIFACT");
  failed++;
} else {
  passed++;
}
receipt.results.push({
  id: "BASELINE",
  expected: "RESEARCH_ONLY_TERMINAL",
  actual_status: baseline.status,
  actual_production_allowed: baseline.meta?.production_allowed,
  result: baseline.status === "RESEARCH_ONLY_TERMINAL" ? "PASS" : "FAIL"
});

// Run 36 QA cases
if (cases.length !== 36) {
  console.error(`ERROR: Expected exactly 36 test cases, found ${cases.length}`);
  process.exit(3);
}

for (const tc of cases) {
  const doc = applyPatches(deepClone(sample), tc.patches);
  const result = evaluate(doc);
  let ok = false;

  if (tc.expected === "RESEARCH_ONLY_TERMINAL") {
    ok = result.status === "RESEARCH_ONLY_TERMINAL" && result.meta.production_allowed === false;
  } else {
    ok = result.status === "HOLD" &&
         result.hold_reasons.includes(tc.expected) &&
         result.artifact === null;
  }

  receipt.results.push({
    id: tc.id,
    expected: tc.expected,
    actual_status: result.status,
    actual_hold_reasons: result.hold_reasons,
    actual_has_artifact: result.artifact !== null,
    result: ok ? "PASS" : "FAIL"
  });

  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push(tc.id);
    console.error(`FAIL ${tc.id}: expected ${tc.expected}, got status=${result.status} holds=[${result.hold_reasons}]`);
  }
}

receipt.total_cases = cases.length + 1; // +1 for baseline
receipt.passed = passed;
receipt.failed = failed;

console.log(`\n=== QA Test Results ===`);
console.log(`Total: ${receipt.total_cases} (36 QA cases + 1 baseline)`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failures.length > 0) {
  console.log(`Failures: ${failures.join(", ")}`);
}
console.log(`\nDisclaimer: ${receipt.disclaimer}`);

// Write receipt
writeFileSync(
  new URL("./TEST_EXECUTION_RECEIPT.json", import.meta.url),
  JSON.stringify(receipt, null, 2) + "\n"
);
console.log(`\nReceipt written to TEST_EXECUTION_RECEIPT.json`);

process.exit(failed > 0 ? 1 : 0);
