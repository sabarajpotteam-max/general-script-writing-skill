#!/usr/bin/env node
/**
 * CLI entry point — Offline Synthetic Engine v0.1
 * Usage: node cli.mjs <input.json> [output.json]
 * No dependencies, no network, no production export.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { evaluate } from "./engine.mjs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node cli.mjs <input.json> [output.json]");
  console.error("  Evaluates a synthetic scriptwriting fixture.");
  console.error("  Exit 0 = RESEARCH_ONLY_TERMINAL, 2 = HOLD, 3 = error.");
  process.exit(3);
}

let doc;
try {
  doc = JSON.parse(readFileSync(input, "utf-8"));
} catch (e) {
  console.error(`Error reading ${input}: ${e.message}`);
  process.exit(3);
}

const result = evaluate(doc);
const json = JSON.stringify(result, null, 2);

const output = process.argv[3];
if (output) {
  try {
    writeFileSync(output, json + "\n");
    console.log(`Result written to ${output} (status: ${result.status})`);
  } catch (e) {
    console.error(`Error writing ${output}: ${e.message}`);
    process.exit(3);
  }
} else {
  console.log(json);
}

process.exit(result.status === "RESEARCH_ONLY_TERMINAL" ? 0 : 2);
