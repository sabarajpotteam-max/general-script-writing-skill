/**
 * Universal Scriptwriting Skill — Offline Synthetic Engine v0.1
 *
 * Self-contained, dependency-free Node.js ESM proof of concept.
 * Uses only fictional fixtures. Zero copied research-source files.
 * NOT a production skill. NOT rights-cleared. NOT release-cleared.
 *
 * Integrates findings from three research streams:
 *   Stream 1: Claude/GitHub (S01-S63, F-001 to F-221)
 *   Stream 2: ChatGPT real-world (R-sources, K001-K048 technique proposals)
 *   Stream 3: YouTube transcript DNA (V01-V12 pilot)
 *
 * All K001-K048 are RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION.
 */

const HOLD = new Set();
const stages = {};

function mark(code) { HOLD.add(code); }

function time(x) {
  if (!x || typeof x !== "string") return null;
  const d = Date.parse(x);
  return Number.isFinite(d) ? d : null;
}

function normNiche(x) {
  if (!x || typeof x !== "string") return x;
  return x.replace(/[-_\s]/g, "").toUpperCase();
}

function validNiche(x) {
  const n = normNiche(x);
  return ["N01", "N02", "N03", "N04", "N05"].includes(n);
}

function containsPhrase(text, phrase) {
  if (!text || !phrase) return false;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  return norm(text).includes(norm(phrase));
}

const BLOCKED_SOURCE_ROLES = new Set(["F-190", "R052"]);
const QUARANTINED_TECHNIQUES = new Set(["K029", "K030", "K031"]);
const ORIGINAL_MISSING_SOURCES = new Set(["B70", "B71", "B72"]);

function buildOutput(status, artifact) {
  return {
    status,
    hold_reasons: [...HOLD].sort(),
    stage_status: { ...stages },
    artifact: artifact || null,
    meta: {
      research_only: true,
      production_allowed: false,
      not_publishable: true,
      no_transfer: true,
      engine_version: "0.1.0-synthetic",
      research_streams: [
        "claude-github-s01-s63",
        "chatgpt-real-world-r-sources",
        "youtube-dna-v01-v12"
      ]
    }
  };
}

function checkIdentity(doc) {
  stages.A00 = "checking";
  if (doc.branch_isolation_broken) {
    mark("HOLD_MISSING_IDENTITY");
    stages.A00 = "HOLD";
    return;
  }
  if (!doc.run_id || !doc.synthetic) {
    mark("HOLD_MISSING_IDENTITY");
    stages.A00 = "HOLD";
    return;
  }
  if (doc.historical_id_rekey_attempt) {
    mark("HOLD_MISSING_IDENTITY");
    stages.A00 = "HOLD";
    return;
  }
  stages.A00 = "pass";
}

function checkSources(doc) {
  stages.A01 = "checking";
  if (!doc.sources || !Array.isArray(doc.sources)) {
    stages.A01 = "skip";
    return;
  }
  for (const src of doc.sources) {
    if (src.access_state === null || src.access_state === undefined) {
      mark("HOLD_MISSING_IDENTITY");
    }
    if (src.redistribution_attempted) {
      mark("HOLD_RIGHTS");
    }
    if (src.can_use_for_synthetic === false) {
      mark("HOLD_RIGHTS");
    }
    if (doc.public_transcript_export_attempt) {
      mark("HOLD_RIGHTS");
    }
    if (src.hash_mismatch) {
      mark("HOLD_DISPUTED_PROVENANCE");
    }
    if (BLOCKED_SOURCE_ROLES.has(src.id)) {
      mark("HOLD_SOURCE_ROLE");
    }
    if (ORIGINAL_MISSING_SOURCES.has(src.id)) {
      mark("HOLD_ORIGINAL_MISSING");
    }
  }
  stages.A01 = HOLD.size > 0 ? "HOLD" : "pass";
}

function checkClaims(doc) {
  stages.A02 = "checking";
  if (!doc.claims || !Array.isArray(doc.claims)) {
    stages.A02 = "skip";
    return;
  }
  for (const claim of doc.claims) {
    if (claim.unverified_retention_promise) {
      mark("HOLD_UNVERIFIED_FACT");
    }
    if (claim.severity_three_unsupported) {
      mark("HOLD_UNVERIFIED_FACT");
    }
    if (claim.metric_substitution_as_retention) {
      mark("HOLD_UNVERIFIED_FACT");
    }
  }
  stages.A02 = HOLD.size > 0 ? "HOLD" : "pass";
}

function checkNicheN01(ctx) {
  if (!ctx) return;
  if (ctx.issued_at && ctx.valid_until) {
    const issued = time(ctx.issued_at);
    const expires = time(ctx.valid_until);
    const now = time(ctx.as_of) || Date.now();
    if (issued && expires) {
      const window = expires - issued;
      if (window <= 3600000 && !ctx.historical_context) {
        mark("HOLD_STALE_FORECAST");
        return;
      }
      if (ctx.projection_labelled_official_warning && !ctx.historical_context) {
        mark("HOLD_UNVERIFIED_FACT");
        return;
      }
    }
  }
}

function checkNicheN02(ctx) {
  if (!ctx) return;
  if (ctx.claimed_operational && ctx.technology_stage === "contracted") {
    mark("HOLD_UNVERIFIED_FACT");
  }
  if (ctx.single_party_claim_as_fact) {
    mark("HOLD_UNVERIFIED_FACT");
  }
}

function checkNicheN03(ctx) {
  if (!ctx) return;
  if (ctx.invented_quote_as_historical) {
    mark("HOLD_HARM");
  }
  if (ctx.translation_lost_qualifier) {
    mark("HOLD_REVIEW");
  }
  if (ctx.reenacted_survivor_as_archival) {
    mark("HOLD_HARM");
  }
}

function checkNicheN04(ctx) {
  if (!ctx) return;
  if (ctx.synthetic_video_claimed_authentic) {
    mark("HOLD_HARM");
  }
  if (ctx.provisional_casualties_called_final) {
    mark("HOLD_UNVERIFIED_FACT");
  }
  if (ctx.single_climate_cause_without_study) {
    mark("HOLD_UNVERIFIED_FACT");
  }
}

function checkNicheGeneral(ctx) {
  if (!ctx) return;
  if (ctx.ttspeech_wpm_as_human_law) {
    mark("HOLD_SOURCE_ROLE");
  }
  if (ctx.mooc_hook_as_video_law) {
    mark("HOLD_SOURCE_ROLE");
  }
  if (ctx.false_media_audio_inference) {
    mark("HOLD_REVIEW");
  }
  if (ctx.accessibility_errors) {
    mark("HOLD_REVIEW");
  }
  if (ctx.inaccessible_source_scored_zero) {
    mark("HOLD_REVIEW");
  }
  if (ctx.rct_success_without_study) {
    mark("HOLD_NOT_APPROVED");
  }
}

function checkNiche(doc) {
  stages.A03 = "checking";
  const niche = normNiche(doc.niche);
  const ctx = doc.niche_context;
  if (niche === "N01") checkNicheN01(ctx);
  else if (niche === "N02") checkNicheN02(ctx);
  else if (niche === "N03") checkNicheN03(ctx);
  else if (niche === "N04") checkNicheN04(ctx);
  checkNicheGeneral(ctx);
  stages.A03 = HOLD.size > 0 ? "HOLD" : "pass";
}

function checkTitle(doc) {
  stages.A04 = "checking";
  const title = doc.candidate_title || "";
  const topic = doc.topic || {};
  const uncertainty = (topic.uncertainty || "").toLowerCase();
  if (uncertainty !== "confirmed" && uncertainty !== "certain") {
    const overconfident = [
      "confirmed", "destroyed", "proven", "definitely",
      "guaranteed", "will ", "has been verified"
    ];
    for (const phrase of overconfident) {
      if (containsPhrase(title, phrase)) {
        mark("HOLD_TITLE_PREMISE");
        break;
      }
    }
  }
  stages.A04 = HOLD.size > 0 ? "HOLD" : "pass";
}

function checkReview(doc) {
  stages.A05 = "checking";
  if (doc.reviewer_id && doc.reviewer_id !== "system") {
    const author = doc.authors?.[0] || doc.author_id;
    if (doc.reviewer_id === author) {
      mark("HOLD_REVIEW");
    }
  }
  if (doc.review_overwrote_dissent) {
    mark("HOLD_REVIEW");
  }
  if (doc.revision_changed_after_review) {
    mark("HOLD_NEEDS_RECHECK");
  }
  if (doc.request_release) {
    mark("HOLD_NOT_APPROVED");
  }
  stages.A05 = HOLD.size > 0 ? "HOLD" : "pass";
}

function generateDraft(doc) {
  stages.A10 = "generating";
  const topic = doc.topic || {};
  const subj = topic.subject || "the subject";
  const obj = topic.object || "the object";
  const mech = topic.mechanism || "an unspecified mechanism";
  const unc = topic.uncertainty || "may";

  const draft = [
    `[FICTIONAL ILLUSTRATIVE DRAFT — NOT FOR PRODUCTION]`,
    ``,
    `${subj} ${unc} interact with ${obj} through ${mech}.`,
    `This scenario is entirely fictional and constructed from synthetic inputs.`,
    `No real-world sources, transcripts, or production data were used.`,
    ``,
    `Research integration note: This draft references technique proposals`,
    `from the three-stream research base (GitHub S01-S63 findings,`,
    `ChatGPT real-world R-sources, YouTube DNA V01-V12 pilot).`,
    `All proposals remain RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION.`,
    ``,
    `[END FICTIONAL DRAFT]`
  ].join("\n");

  stages.A10 = "complete";
  return draft;
}

export function evaluate(doc) {
  HOLD.clear();
  for (const k of Object.keys(stages)) delete stages[k];

  if (!doc || typeof doc !== "object") {
    mark("HOLD_MISSING_IDENTITY");
    return buildOutput("HOLD", null);
  }

  checkIdentity(doc);
  checkSources(doc);
  checkClaims(doc);

  if (doc.niche) {
    checkNiche(doc);
  }

  checkTitle(doc);
  checkReview(doc);

  if (HOLD.size > 0) {
    return buildOutput("HOLD", null);
  }

  const draft = generateDraft(doc);
  return buildOutput("RESEARCH_ONLY_TERMINAL", draft);
}
