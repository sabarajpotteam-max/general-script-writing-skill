#!/usr/bin/env node
/**
 * Word Count Utility
 * Counts words per section in a Markdown documentary script.
 * Usage: node word_count.mjs <script.md>
 */

import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node word_count.mjs <script.md>");
  process.exit(3);
}

const text = readFileSync(path, "utf-8");
const lines = text.split("\n");

const sections = [];
let current = null;
let content = [];

for (const line of lines) {
  if (line.match(/^##\s+/)) {
    if (current) {
      sections.push({ name: current, words: countWords(content.join("\n")) });
    }
    current = line.replace(/^##\s+/, "").trim();
    content = [];
  } else if (current) {
    content.push(line);
  }
}
if (current) {
  sections.push({ name: current, words: countWords(content.join("\n")) });
}

function countWords(t) {
  return t.split(/\s+/).filter(w => w.length > 0).length;
}

const isNonNarration = (name) =>
  name.toLowerCase().includes("evidence register") ||
  name.toLowerCase().includes("qa report");

let narrationTotal = 0;
let nonNarrationTotal = 0;

console.log("Narration Word Counts:");
console.log("─".repeat(60));
for (const s of sections.filter(s => !isNonNarration(s.name))) {
  console.log(`  ${s.name.padEnd(45)} ${String(s.words).padStart(6)}`);
  narrationTotal += s.words;
}
console.log("─".repeat(60));
console.log(`  ${"NARRATION TOTAL".padEnd(45)} ${String(narrationTotal).padStart(6)}`);

const nonNarr = sections.filter(s => isNonNarration(s.name));
if (nonNarr.length > 0) {
  console.log(`\nNon-Narration Sections (excluded from word budget):`);
  console.log("─".repeat(60));
  for (const s of nonNarr) {
    console.log(`  ${s.name.padEnd(45)} ${String(s.words).padStart(6)}`);
    nonNarrationTotal += s.words;
  }
  console.log("─".repeat(60));
  console.log(`  ${"NON-NARRATION TOTAL".padEnd(45)} ${String(nonNarrationTotal).padStart(6)}`);
}

console.log(`\n  ${"GRAND TOTAL (all sections)".padEnd(45)} ${String(narrationTotal + nonNarrationTotal).padStart(6)}`);
