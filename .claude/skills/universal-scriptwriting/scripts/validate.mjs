/**
 * Input Validator and QA Report Generator
 * Validates topic JSON against SKILL.md requirements.
 * Status: RESEARCH_ONLY — not approved for production
 * Node.js ESM, no dependencies.
 *
 * Usage:
 *   node validate.mjs <input.json>          — validate input
 *   node validate.mjs --qa <script.md> <input.json>  — generate QA report
 */

import { readFileSync } from "node:fs";
import { resolveNiche, isRegisteredNiche, registerNiche, isBuiltinNiche } from "./niche_resolver.mjs";
import { resolveFormat, getFormatDefinition, isRegisteredFormat, FORMAT_STATUS } from "./format_registry.mjs";
import { resolveM3, CONTENT_TYPES, RESEARCH_MODES, RESEARCH_STATES, inferContentType, inferResearchMode, getEvidencePolicy, assessGenerationReadiness, deriveResearchState } from "./content_type_engine.mjs";

const REGISTERED_NICHES = new Set(["N01", "N02", "N03", "N04", "N05"]);
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

export { resolveNiche, isRegisteredNiche, registerNiche, isBuiltinNiche } from "./niche_resolver.mjs";
export { resolveFormat, getFormatDefinition, isRegisteredFormat, FORMAT_STATUS } from "./format_registry.mjs";
export { CONTENT_TYPES, RESEARCH_MODES, RESEARCH_STATES, inferContentType, inferResearchMode, getEvidencePolicy, resolveM3, assessGenerationReadiness, deriveResearchState } from "./content_type_engine.mjs";

export function validateInput(input) {
  const holds = [];
  const warnings = [];
  const evidence_register = [];

  // Stage 1: Topic Intake
  // FIX 3: Support new-style briefs (topic + niche + audience + language + format + duration)
  // Legacy briefs require subject/object/mechanism/uncertainty.
  // New-style briefs require topic + niche; subject/object/mechanism/uncertainty are derived or optional.
  const isNewStyleBrief = !!input.topic && !input.subject && !input.object && !input.mechanism;
  let missing;
  if (isNewStyleBrief) {
    const newRequired = ["title", "niche", "topic"];
    missing = newRequired.filter(f => !input[f]);
    if (missing.length > 0) {
      holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: `Missing fields: ${missing.join(", ")}` });
    }
    if (!input.uncertainty) {
      input.uncertainty = input.uncertainty || "qualified";
    }
  } else {
    const legacyRequired = ["title", "niche", "subject", "object", "mechanism", "uncertainty"];
    missing = legacyRequired.filter(f => !input[f]);
    if (missing.length > 0) {
      holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: `Missing fields: ${missing.join(", ")}` });
    }
  }

  // Dynamic niche resolution (M1: replaces hardcoded 5-niche restriction)
  let nicheResolution = null;
  if (input.niche) {
    nicheResolution = resolveNiche(input.niche);
    if (!nicheResolution.validation.valid) {
      holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: `Invalid niche: ${input.niche} — ${nicheResolution.validation.error}` });
    }
    if (nicheResolution.high_stakes) {
      holds.push({ type: HOLD_TYPES.REVIEW, detail: `High-stakes niche "${input.niche}" flagged for review — domain involves elevated risk` });
    }
    if (nicheResolution.requires_review && !nicheResolution.high_stakes) {
      holds.push({ type: HOLD_TYPES.REVIEW, detail: `Custom niche "${input.niche}" requires review — custom adapters must be verified before production use` });
    }
  }

  // M2: Format resolution — legacy briefs default to documentary
  const formatResult = resolveFormat(input);
  if (formatResult.hold) {
    holds.push({ type: formatResult.hold.type, detail: formatResult.hold.message });
  }
  if (formatResult.warning) {
    warnings.push(formatResult.warning.message);
  }
  const resolvedFormat = formatResult.resolved;

  // Correction 6: Validate target_words when present
  if (input.target_words !== undefined && input.target_words !== null) {
    const tw = input.target_words;
    if (typeof tw !== 'number' || !Number.isFinite(tw) || tw !== Math.floor(tw) || tw <= 0) {
      holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: `target_words must be a positive integer, got: ${JSON.stringify(tw)}` });
    }
  }

  // Word target: use format-specific range when available
  const target = (typeof input.target_words === 'number' && Number.isFinite(input.target_words) && input.target_words > 0)
    ? input.target_words : 3000;
  const fmtRange = resolvedFormat ? resolvedFormat.word_range : null;
  if (fmtRange && (target < fmtRange.min || target > fmtRange.max)) {
    warnings.push(`Target word count ${target} outside ${resolvedFormat.id} range ${fmtRange.min}-${fmtRange.max}`);
  } else if (!fmtRange && (target < 2500 || target > 8000)) {
    warnings.push(`Target word count ${target} outside recommended range 2500-8000`);
  }

  // M3: Content type and research mode resolution
  const m3Result = resolveM3(input, resolvedFormat);
  for (const h of m3Result.holds) holds.push(h);
  for (const w of m3Result.warnings) warnings.push(w);
  const contentType = m3Result.content_type;
  const researchMode = m3Result.research_mode;
  const evidencePolicy = m3Result.evidence_policy;

  // Stage 2: Evidence Validation (conditional on content type)
  const evidence = input.evidence || [];
  if (evidence.length === 0 && evidencePolicy.evidence_required && researchMode !== 'system_assisted') {
    holds.push({ type: HOLD_TYPES.UNVERIFIED_FACT, detail: `No evidence items provided — ${contentType} content requires at least one evidence source` });
  } else if (evidence.length === 0 && evidencePolicy.evidence_required && researchMode === 'system_assisted') {
    warnings.push(`No evidence provided — system_assisted research needed before ${contentType} factual claims`);
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
        if (!item.source_family || !e.source_family) return false;
        if (e.source_family === item.source_family) return false;
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
    if (!ctx.issued_at || !ctx.valid_until || !ctx.reference_time) {
      holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "N01 forecast niche requires issued_at, valid_until and reference_time timestamps" });
    } else {
      const issuedMs = Date.parse(ctx.issued_at);
      const validMs = Date.parse(ctx.valid_until);
      const refMs = Date.parse(ctx.reference_time);
      if (Number.isNaN(issuedMs) || Number.isNaN(validMs) || Number.isNaN(refMs)) {
        holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "N01 forecast timestamps are malformed (unparseable date)" });
      } else {
        const window = validMs - issuedMs;
        if (window <= 3600000 && !ctx.historical_context) {
          holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "Forecast validity window <= 1 hour without historical context" });
        }
        if (validMs < refMs && !ctx.historical_context) {
          holds.push({ type: HOLD_TYPES.STALE_FORECAST, detail: "Forecast has expired (valid_until is before reference_time)" });
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
    if (ctx.era_start != null && ctx.era_end != null) {
      const start = Number(ctx.era_start);
      const end = Number(ctx.era_end);
      const overlapsWW1 = start <= 1918 && end >= 1914;
      const overlapsWW2 = start <= 1945 && end >= 1939;
      if (!overlapsWW1 && !overlapsWW2) {
        holds.push({ type: HOLD_TYPES.HARM, detail: `N03 niche requires WW1 (1914-1918) or WW2 (1939-1945) era — story period ${start}-${end} falls outside scope` });
      }
    } else {
      holds.push({ type: HOLD_TYPES.MISSING_IDENTITY, detail: "N03 niche requires era_start and era_end years in niche_context to verify WW1/WW2 scope" });
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

  // Tier 2/3 niche validation (M1)
  if (nicheResolution && nicheResolution.tier >= 2) {
    if (nicheResolution.tier === 2 && ctx.unverified_domain_expertise_claim) {
      holds.push({ type: HOLD_TYPES.UNVERIFIED_FACT, detail: "Recognized domain: unverified expertise claim — do not claim verified domain expertise without supporting evidence" });
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
    niche_resolution: nicheResolution || null,
    format_resolution: resolvedFormat ? {
      id: resolvedFormat.id,
      name: resolvedFormat.name,
      status: resolvedFormat.status,
      arc_id: resolvedFormat.arc.id,
      section_count: resolvedFormat.arc.sections.length,
      evidence_requirement: resolvedFormat.evidence_requirement,
      spoken_word_budget_tolerance: resolvedFormat.spoken_word_budget_tolerance,
    } : null,
    m3_resolution: {
      content_type: contentType,
      content_type_source: m3Result.content_type_source,
      research_mode: researchMode,
      research_mode_source: m3Result.research_mode_source,
      evidence_policy: evidencePolicy.description,
      research_state: m3Result.research_state,
      generation_readiness: m3Result.generation_readiness,
      qa_limitations: m3Result.qa_limitations,
      generation_permitted: m3Result.generation_permitted && holds.length === 0,
    },
    stages: {
      topic_intake: missing.length === 0 ? "PASS" : "HOLD",
      format_resolution: holds.filter(h => h.type === "HOLD_FORMAT_MISMATCH").length === 0 ? "PASS" : "HOLD",
      content_type_resolution: m3Result.holds.length === 0 ? "PASS" : "HOLD",
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

export function analyzeScript(scriptText, input, options = {}) {
  const lines = scriptText.split("\n");
  const sections = [];
  let currentSection = null;
  let currentContent = [];

  // Section heading patterns: ## or ### level
  // Documentary (EN): HOOK, PROBLEM, DISCOVERY, MECHANISM, CHALLENGE, RESOLUTION, IMPLICATIONS, OUTRO
  // Documentary (DE): DAS PROBLEM, DIE ENTDECKUNG, DER MECHANISMUS, DIE HERAUSFORDERUNG, DIE AUFLÖSUNG, IMPLIKATIONEN, FOLGERUNGEN
  // Explainer: HOOK, FOUNDATION, BUILD, EXAMPLE, NUANCE, SYNTHESIS, NEXT STEPS
  // Short-form: HOOK, BODY, CTA
  // Meta: Evidence Register, QA Report, PART N, SECTION N
  const scriptHeadingRe = /^#{2,3}\s+(?:HOOK|PROBLEM|DISCOVERY|MECHANISM|CHALLENGE|RESOLUTION|IMPLICATIONS|OUTRO|DAS PROBLEM|DIE ENTDECKUNG|DER MECHANISMUS|DIE HERAUSFORDERUNG|DIE AUFL[OÖ]SUNG|IMPLIKATIONEN|FOLGERUNGEN|FOUNDATION|BUILD|EXAMPLE|NUANCE|SYNTHESIS|NEXT\s+STEPS|BODY|CTA|SECTION\s+\d+|Evidence Register|Evidenz\s*register|QA[- ]?Report|QA[- ]?Bericht|PART\s+\d+)[\s:]*(.*)$/i;
  // Non-narration section patterns (evidence tables, QA tables, part dividers)
  const nonNarrationRe = /evidence\s*register|evidenz\s*register|qa[\s-]?report|qa[\s-]?bericht|part\s+\d+.*(?:evidenz|qa|bericht)/i;

  for (const line of lines) {
    const sectionMatch = line.match(scriptHeadingRe);
    if (sectionMatch) {
      if (currentSection) {
        sections.push({ name: currentSection, content: currentContent.join("\n") });
      }
      currentSection = line.replace(/^#{2,3}\s+/, "").trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections.push({ name: currentSection, content: currentContent.join("\n") });
  }

  // Filter to script sections only (not evidence register, QA report, or PART dividers)
  const scriptSections = sections.filter(s =>
    !nonNarrationRe.test(s.name) &&
    !/^PART\s+\d+/i.test(s.name)
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

  // Spoken narration word count — exclude scene directions, headings,
  // interview metadata, and evidence/QA tables
  const narrationLines = [];
  for (const sec of scriptSections) {
    for (const line of sec.content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\[.*\]$/.test(trimmed)) continue;
      if (/^\[SZENE:/i.test(trimmed) || /^\[SCENE:/i.test(trimmed)) continue;
      if (/^\[INTERVIEW:/i.test(trimmed)) continue;
      if (/^\[ABBLENDE\]$/i.test(trimmed) || /^\[FADE/i.test(trimmed)) continue;
      if (/^#+\s/.test(trimmed)) continue;
      if (/^>/.test(trimmed)) continue;
      if (/^\|/.test(trimmed)) continue;
      if (/^---+$/.test(trimmed)) continue;
      if (/^\*\*[A-Z_]+\*\*/.test(trimmed)) continue;
      narrationLines.push(trimmed);
    }
  }
  const spokenNarrationWords = countWords(narrationLines.join(" "));

  // Epistemic qualifier check — multilingual
  const uncertainty = input.uncertainty || "";
  const upgrades = [];
  if (uncertainty !== "confirmed" && uncertainty !== "certain") {
    const strongClaimsEN = [
      "proves that", "confirms that", "has been proven", "it is certain",
      "undeniably", "without doubt", "definitively proven"
    ];
    const strongClaimsDE = [
      "beweist eindeutig", "beweist zweifelsfrei", "beweist definitiv",
      "bestätigt endgültig", "steht zweifelsfrei fest", "ist eindeutig bewiesen",
      "ist definitiv bewiesen", "wurde endgültig bewiesen", "wurde eindeutig bewiesen",
      "ist zweifellos", "steht endgültig fest", "wurde definitiv bestätigt",
      "immer funktioniert", "garantiert dass", "hat bewiesen dass",
      "dass die methode immer", "ist unbestreitbar"
    ];
    const allStrong = [...strongClaimsEN, ...strongClaimsDE];
    const bodyLowerForEpistemic = scriptBody.toLowerCase();
    for (const phrase of allStrong) {
      if (bodyLowerForEpistemic.includes(phrase)) {
        upgrades.push(phrase);
      }
    }
  }

  return {
    sections: wordCounts,
    total_words: totalWords,
    spoken_narration_words: spokenNarrationWords,
    target_words: input.target_words || 3000,
    word_budget_status: (() => {
      const tgt = input.target_words || 3000;
      const fmt = options.format || getFormatDefinition(input.format || 'documentary');
      const tolerance = fmt ? fmt.spoken_word_budget_tolerance : 0.05;
      return spokenNarrationWords >= Math.floor(tgt * (1 - tolerance)) && spokenNarrationWords <= Math.ceil(tgt * (1 + tolerance)) ? "PASS" : "REVIEW";
    })(),
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
