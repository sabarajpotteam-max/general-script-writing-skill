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

let total = 0;
console.log("Section Word Counts:");
console.log("─".repeat(60));
for (const s of sections) {
  console.log(`  ${s.name.padEnd(45)} ${String(s.words).padStart(6)}`);
  total += s.words;
}
console.log("─".repeat(60));
console.log(`  ${"TOTAL".padEnd(45)} ${String(total).padStart(6)}`);
