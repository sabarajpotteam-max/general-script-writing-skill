/**
 * Input Validator and QA Report Generator
 * Validates topic JSON against SKILL.md requirements.
 * Node.js ESM, no dependencies.
 *
 * Usage:
 *   node validate.mjs <input.json>          — validate input
 *   node validate.mjs --qa <script.md> <input.json>  — generate QA report
 */

import { readFileSync } from "node:fs";

const VALID_NICHES = new Set(["N01", "N02", "N03", "N04", "N05"]);
const BLOCKED_SOURCES = new Set(["F-190", "R052"]);
const QUARANTINED = new Set(["K029", "K030", "K031"]);
const CAVEATED_SOURCES = new Set(["B70", "B71", "B72"]);
const VALID_EPISTEMIC = new Set([
  "confirmed", "replicated", "preliminary", "disputed", "qualified", "hypothetical"
]);

const HOLD_TYPES = {
  MISSING_IDENTITY: "HOLD_MISSING_IDENTITY",
  RIGHTS: "HOLD_RIGHTS",
  DISPUTED_PROVENANCE: "HOLD_DISPUTED_PROVENANCE",
  ORIGINAL_MISSING: "HOLD_ORIGINAL_MISSING",
  SOURCE_ROLE: "HOLD_SOURCE_ROLE",
  UNVERIFIED_FACT: "HOLD_UNVERIFIED_FACT",
  STALE_FORECAST: "HOLD_STALE_FORECAST",
  TITLE_PREMISE: "HOLD_TITLE_PREMISE",
  HARM: "HOLD_HARM",
  REVIEW: "HOLD_REVIEW",
  NOT_APPROVED: "HOLD_NOT_APPROVED",
  NEEDS_RECHECK: "HOLD_NEEDS_RECHECK"
};

export function validateInput(input) {
  const holds = [];
  const warnings = [];
  const evidence_register = [];

  // Stage 1: Topic Intake
  const required = ["title", "niche", "subject", "object", "mechanism", "uncertainty"];
  const missing = required.filter(f => !input[f]);
  if (missing.length > 0) {
    holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: `Missing fields: ${missing.join(", ")}` });
  }

  if (input.niche && !VALID_NICHES.has(input.niche.toUpperCase())) {
    holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: `Invalid niche: ${input.niche}` });
  }

  const target = input.target_words || 3000;
  if (target < 2500 || target > 8000) {
    warnings.push(`Target word count ${target} outside recommended range 2500-8000`);
  }

  // Stage 2: Evidence Validation
  const evidence = input.evidence || [];
  if (evidence.length === 0) {
    holds.push({ type: HOLD_TYPES.UNVERIFIED_FACT, detail: "No evidence items provided — factual documentary requires at least one evidence source" });
  }

  for (const item of evidence) {
    const entry = {
      id: item.id,
      source: item.source || "(none)",
      epistemic_status: item.epistemic_status || "qualified",
      caveats: []
    };

    if (!item.id) {
      holds.push({ type: HOLD_TYPES.DISPUTED_PROVENANCE, detail: "Evidence item has no ID" });
    }

    if (BLOCKED_SOURCES.has(item.id)) {
      holds.push({ type: HOLD_TYPES.SOURCE_ROLE, detail: `Blocked source: ${item.id}` });
    }

    if (item.id && QUARANTINED.has(item.id)) {
      holds.push({ type: HOLD_TYPES.SOURCE_ROLE, detail: `Quarantined technique: ${item.id}` });
    }

    if (item.id && CAVEATED_SOURCES.has(item.id)) {
      entry.caveats.push("Original source has access restrictions");
    }

    if (!item.source) {
      holds.push({ type: HOLD_TYPES.DISPUTED_PROVENANCE, detail: `Evidence ${item.id} has no stated source` });
    }

    if (item.epistemic_status && !VALID_EPISTEMIC.has(item.epistemic_status)) {
      holds.push({ type: HOLD_TYPES.UNVERIFIED_FACT, detail: `Evidence ${item.id} has unknown epistemic status "${item.epistemic_status}" — must be one of: ${[...VALID_EPISTEMIC].join(", ")}` });
      entry.epistemic_status = "qualified";
      entry.caveats.push("Epistemic status invalid — HOLD raised, defaulted to 'qualified' in register");
    }

    if (item.epistemic_status === "confirmed" && evidence.filter(e => e.id === item.id).length < 2) {
      const itemClaim = (item.claim || item.source || "").toLowerCase();
      const corroborating = evidence.filter(e => {
        if (e.id === item.id) return false;
        if (e.epistemic_status !== "replicated") return false;
        if (item.source_family && e.source_family && e.source_family === item.source_family) return false;
        const eClaim = (e.claim || e.source || "").toLowerCase();
        if (item.claim && e.claim) return eClaim === itemClaim;
        return eClaim === itemClaim;
      });
      if (corroborating.length === 0) {
        holds.push({
          type: HOLD_TYPES.UNVERIFIED_FACT,
          detail: `Evidence ${item.id} claims 'confirmed' but no corroborating replicated source from an independent source family`
        });
      }
    }

    if (item.can_use_for_synthetic === false) {
      holds.push({ type: HOLD_TYPES.RIGHTS, detail: `Evidence ${item.id} explicitly denied for synthetic use (can_use_for_synthetic: false)` });
    } else if (item.can_use_for_synthetic === undefined && !item.fictional) {
      holds.push({ type: HOLD_TYPES.RIGHTS, detail: `Evidence ${item.id} missing rights/license information (can_use_for_synthetic not declared)` });
    }

    evidence_register.push(entry);
  }

  // Niche-specific validation
  const niche = (input.niche || "").toUpperCase();
  const ctx = input.niche_context || {};

  if (niche === "N01") {
    if (!ctx.issued_at || !ctx.valid_until) {
      holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "N01 forecast niche requires issued_at and valid_until timestamps" });
    } else {
      const issuedMs = Date.parse(ctx.issued_at);
      const validMs = Date.parse(ctx.valid_until);
      const refMs = ctx.reference_time ? Date.parse(ctx.reference_time) : null;
      if (Number.isNaN(issuedMs) || Number.isNaN(validMs) || (ctx.reference_time && Number.isNaN(refMs))) {
        holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "N01 forecast timestamps are malformed (unparseable date)" });
      } else {
        const window = validMs - issuedMs;
        if (window <= 3600000 && !ctx.historical_context) {
          holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "Forecast validity window <= 1 hour without historical context" });
        }
        const now = refMs !== null ? refMs : Date.now();
        if (validMs < now && !ctx.historical_context) {
          holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "Forecast has expired (valid_until is in the past)" });
        }
      }
    }
  }

  if (niche === "N02") {
    if (ctx.technology_stage === "prototype" && ctx.claimed_operational) {
      holds.push({ type: HOLD_TYPES.HARM, detail: "Military technology marked operational while still a prototype" });
    }
    if (ctx.classification_level && ctx.classification_level !== "unclassified" && !ctx.declassification_confirmed) {
      holds.push({ type: HOLD_TYPES.REVIEW, detail: `Military content classification level "${ctx.classification_level}" requires declassification confirmation` });
    }
  }

  if (niche === "N03") {
    if (ctx.invented_quote_as_historical) {
      holds.push({ type: HOLD_TYPES.HARM, detail: "Invented quote presented as historical" });
    }
  }

  if (niche === "N04") {
    if (ctx.synthetic_video_claimed_authentic) {
      holds.push({ type: HOLD_TYPES.HARM, detail: "Synthetic video claimed as authentic" });
    }
    if (ctx.provisional_casualties_called_final) {
      holds.push({ type: HOLD_TYPES.HARM, detail: "Provisional disaster casualty figures presented as final" });
    }
  }

  // Title premise check
  if (input.title && input.uncertainty && input.uncertainty !== "confirmed") {
    const overconfident = ["confirmed", "proven", "destroyed", "guaranteed", "verified"];
    const titleLower = input.title.toLowerCase();
    for (const word of overconfident) {
      if (titleLower.includes(word)) {
        holds.push({ type: HOLD_TYPES.TITLE_PREMISE, detail: `Title contains "${word}" but uncertainty is "${input.uncertainty}"` });
        break;
      }
    }
  }

  if (input.request_release) {
    holds.push({ type: HOLD_TYPES.NOT_APPROVED, detail: "request_release is set — candidate output is non-production and cannot be released" });
  }
  if (input.request_claude_transfer) {
    holds.push({ type: HOLD_TYPES.NOT_APPROVED, detail: "request_claude_transfer is set — transfer of candidate material is restricted" });
  }

  const status = holds.length === 0 ? "PASS" : "HOLD";
  return {
    status,
    holds,
    warnings,
    evidence_register,
    stages: {
      topic_intake: missing.length === 0 ? "PASS" : "HOLD",
      evidence_validation: holds.filter(h => [HOLD_TYPES.SOURCE_ROLE, HOLD_TYPES.DISPUTED_PROVENANCE, HOLD_TYPES.UNVERIFIED_FACT, HOLD_TYPES.RIGHTS].includes(h.type)).length === 0 ? "PASS" : "HOLD",
      niche_check: holds.filter(h => [HOLD_TYPES.STALE_FORECAST, HOLD_TYPES.HARM, HOLD_TYPES.REVIEW].includes(h.type)).length === 0 ? "PASS" : "HOLD",
      title_check: holds.filter(h => h.type === HOLD_TYPES.TITLE_PREMISE).length === 0 ? "PASS" : "HOLD",
      production_gate: holds.filter(h => h.type === HOLD_TYPES.NOT_APPROVED).length === 0 ? "PASS" : "HOLD"
    }
  };
}

export function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

export function analyzeScript(scriptText, input) {
  const lines = scriptText.split("\n");
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(?:HOOK|SECTION\s+\d+|OUTRO|Evidence Register|QA Report)[\s:]*(.*)$/i);
    if (sectionMatch) {
      if (currentSection) {
        sections.push({ name: currentSection, content: currentContent.join("\n") });
      }
      currentSection = line.replace(/^##\s+/, "").trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({ name: currentSection, content: currentContent.join("\n") });
  }

  // Filter to script sections only (not evidence register or QA report)
  const scriptSections = sections.filter(s =>
    !s.name.toLowerCase().includes("evidence register") &&
    !s.name.toLowerCase().includes("qa report")
  );

  const wordCounts = scriptSections.map(s => ({
    section: s.name,
    words: countWords(s.content)
  }));

  const totalWords = wordCounts.reduce((sum, s) => sum + s.words, 0);

  // Evidence reference check
  const evidenceIds = (input.evidence || []).map(e => e.id);
  const scriptBody = scriptSections.map(s => s.content).join("\n");
  const referencedIds = [];
  const unreferencedIds = [];

  for (const id of evidenceIds) {
    const pattern = new RegExp(`\\[${id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\]`);
    if (pattern.test(scriptBody)) {
      referencedIds.push(id);
    } else {
      unreferencedIds.push(id);
    }
  }

  // Consistency check — canonical terms (check key words, not rigid substrings)
  const subject = input.subject || "";
  const object = input.object || "";
  const extractKeyWords = (text) => text.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
  const bodyLower = scriptBody.toLowerCase();
  const subjectWords = extractKeyWords(subject);
  const objectWords = extractKeyWords(object);
  const subjectHits = subjectWords.filter(w => bodyLower.includes(w)).length;
  const objectHits = objectWords.filter(w => bodyLower.includes(w)).length;
  const subjectPresent = subjectWords.length === 0 || subjectHits >= Math.min(2, subjectWords.length);
  const objectPresent = objectWords.length === 0 || objectHits >= Math.min(2, objectWords.length);

  // Epistemic qualifier check
  const uncertainty = input.uncertainty || "";
  const upgrades = [];
  if (uncertainty !== "confirmed" && uncertainty !== "certain") {
    const strongClaims = ["proves that", "confirms that", "has been proven", "it is certain"];
    for (const phrase of strongClaims) {
      if (scriptBody.toLowerCase().includes(phrase)) {
        upgrades.push(phrase);
      }
    }
  }

  return {
    sections: wordCounts,
    total_words: totalWords,
    target_words: input.target_words || 3000,
    word_budget_status: totalWords >= 2500 && totalWords <= (input.target_words || 3000) * 1.1 ? "PASS" : "REVIEW",
    evidence_referenced: referencedIds,
    evidence_unreferenced: unreferencedIds,
    evidence_traceability: unreferencedIds.length === 0 ? "PASS" : "REVIEW",
    subject_consistency: subjectPresent ? "PASS" : "REVIEW",
    object_consistency: objectPresent ? "PASS" : "REVIEW",
    epistemic_upgrades: upgrades,
    epistemic_integrity: upgrades.length === 0 ? "PASS" : "HOLD_NEEDS_RECHECK"
  };
}

// CLI mode
if (process.argv[1] && process.argv[1].endsWith("validate.mjs")) {
  const mode = process.argv[2];

  if (mode === "--qa") {
    const scriptPath = process.argv[3];
    const inputPath = process.argv[4];
    if (!scriptPath || !inputPath) {
      console.error("Usage: node validate.mjs --qa <script.md> <input.json>");
      process.exit(3);
    }
    const scriptText = readFileSync(scriptPath, "utf-8");
    const input = JSON.parse(readFileSync(inputPath, "utf-8"));
    const validation = validateInput(input);
    const result = analyzeScript(scriptText, input);
    result.input_validation = validation.status;
    result.input_holds = validation.holds;
    console.log(JSON.stringify(result, null, 2));
    const allPass = result.epistemic_integrity === "PASS" &&
      result.word_budget_status === "PASS" &&
      result.evidence_traceability === "PASS" &&
      result.subject_consistency === "PASS" &&
      result.object_consistency === "PASS" &&
      validation.status === "PASS";
    process.exit(allPass ? 0 : 2);
  } else {
    const inputPath = mode || process.argv[2];
    if (!inputPath) {
      console.error("Usage: node validate.mjs <input.json>");
      console.error("       node validate.mjs --qa <script.md> <input.json>");
      process.exit(3);
    }
    const input = JSON.parse(readFileSync(inputPath, "utf-8"));
    const result = validateInput(input);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === "PASS" ? 0 : 2);
  }
}
