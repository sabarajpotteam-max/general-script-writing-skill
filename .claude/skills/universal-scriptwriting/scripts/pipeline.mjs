// pipeline.mjs — M8 End-to-End Integration Pipeline
// Status: RESEARCH_ONLY — not approved for production
// Connects M1-M7 modules into one authoritative workflow:
// Brief → Niche → Format → Voice/Duration → Research → Safety Gate → Blueprint → QA → Editorial → Report

import { normalizeBrief, assessBriefReadiness } from './brief_engine.mjs';
import { resolveNiche } from './niche_resolver.mjs';
import { resolveFormat, getFormatDefinition } from './format_registry.mjs';
import { loadStructure, getWritingPlan } from './structure_loader.mjs';
import { resolveTargetWords, estimateRuntime, SPEAKING_RATES } from './duration_engine.mjs';
import { resolveVoiceMode } from './voice_engine.mjs';
import { inferContentType, resolveM3, CONTENT_TYPES, RESEARCH_STATES, assessGenerationReadiness, deriveResearchState, getEvidencePolicy } from './content_type_engine.mjs';
import { runQA, countCanonicalSpokenWords, parseScriptSections } from './qa_engine.mjs';

const PIPELINE_VERSION = '2.0.0';

const PIPELINE_STAGES = Object.freeze([
  'BRIEF_NORMALIZATION',
  'NICHE_RESOLUTION',
  'FORMAT_RESOLUTION',
  'VOICE_DURATION_RESOLUTION',
  'RESEARCH_GATE',
  'SAFETY_GATE',
  'BLUEPRINT',
  'QA',
  'EDITORIAL',
  'REPORT',
]);

const PIPELINE_STATUS = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
});

// ═══════════════════════════════════════════════════════════════
// COMPATIBILITY ADAPTER: M7 normalized objects → M1-M6 flat scalars
// ═══════════════════════════════════════════════════════════════

function normalizedToFlat(normalized) {
  if (!normalized || !normalized.success) return null;
  return {
    topic: normalized.topic?.value || null,
    title: normalized.title?.value || null,
    format: normalized.format?.value || 'documentary',
    audience: normalized.audience?.description || (typeof normalized.audience?.value === 'string' ? normalized.audience.value : 'general_adult'),
    language: normalized.language?.code || 'en',
    platform: normalized.platform?.value || 'generic',
    niche: normalized._raw?.niche || null,
    content_type: normalized.content_type?.value || 'factual',
    research_mode: normalized.research_mode?.value || 'minimal',
    voice: {
      mode: normalized.voice?.mode || 'single_narrator',
      tone: normalized.voice?.tone || 'conversational',
      formality: normalized.voice?.formality || null,
      humor_level: normalized.voice?.humor_level || 0,
    },
    target_words: normalized.word_resolution?.target_words || 3000,
    target_duration: normalized._raw?.target_duration || null,
    speaking_rate: normalized._raw?.speaking_rate || null,
    evidence: normalized._raw?.evidence || [],
    characters: normalized._raw?.characters || [],
    brand_voice: normalized._raw?.brand_voice || null,
    objectives: normalized.objectives?.value || ['inform'],
    subject: normalized.subject_object_mechanism?.subject?.value || null,
    object: normalized.subject_object_mechanism?.object?.value || null,
    mechanism: normalized.subject_object_mechanism?.mechanism?.value || null,
    uncertainty: normalized.subject_object_mechanism?.uncertainty?.value || 'qualified',
  };
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE RUNNER
// ═══════════════════════════════════════════════════════════════

function runPipeline(rawBrief, options = {}) {
  const startTime = Date.now();
  const stages = {};
  const blockers = [];
  const warnings = [];
  let currentStage = 'BRIEF_NORMALIZATION';

  try {
    // ─── STAGE 1: BRIEF NORMALIZATION (M7) ───
    currentStage = 'BRIEF_NORMALIZATION';
    const normalized = normalizeBrief(rawBrief);
    stages.brief = {
      status: normalized.success ? PIPELINE_STATUS.COMPLETED : PIPELINE_STATUS.FAILED,
      result: normalized,
      timestamp: new Date().toISOString(),
    };

    if (!normalized.success) {
      return buildPipelineResult(stages, blockers, warnings, 'BRIEF_NORMALIZATION', startTime, {
        terminal_status: 'BLOCKED',
        terminal_reason: 'Brief normalization failed',
        error: normalized.error,
      });
    }

    const blockingHolds = (normalized.holds || []).filter(h => h.severity === 'BLOCKING');
    if (blockingHolds.length > 0) {
      for (const h of blockingHolds) {
        blockers.push({ stage: 'BRIEF_NORMALIZATION', hold: h });
      }
    }

    for (const w of normalized.warnings || []) {
      warnings.push({ stage: 'BRIEF_NORMALIZATION', message: w });
    }

    const flat = normalizedToFlat(normalized);

    // ─── STAGE 2: NICHE RESOLUTION (M1) ───
    currentStage = 'NICHE_RESOLUTION';
    let nicheResult = null;
    if (flat.niche) {
      nicheResult = resolveNiche(flat.niche);
    }
    stages.niche = {
      status: PIPELINE_STATUS.COMPLETED,
      result: nicheResult,
      tier: nicheResult?.tier || 0,
      timestamp: new Date().toISOString(),
    };

    if (nicheResult && !nicheResult.validation.valid) {
      blockers.push({
        stage: 'NICHE_RESOLUTION',
        hold: { type: 'NICHE_INVALID', detail: nicheResult.validation.error },
      });
    }

    // ─── STAGE 3: FORMAT RESOLUTION (M2) ───
    currentStage = 'FORMAT_RESOLUTION';
    const formatResult = resolveFormat(flat);
    stages.format = {
      status: formatResult.hold ? PIPELINE_STATUS.BLOCKED : PIPELINE_STATUS.COMPLETED,
      result: formatResult,
      format_id: formatResult.resolved?.id || null,
      format_status: formatResult.resolved?.status || null,
      timestamp: new Date().toISOString(),
    };

    if (formatResult.hold) {
      blockers.push({ stage: 'FORMAT_RESOLUTION', hold: formatResult.hold });
    }
    if (formatResult.warning) {
      warnings.push({ stage: 'FORMAT_RESOLUTION', message: formatResult.warning.message });
    }

    const resolvedFormat = formatResult.resolved;

    // ─── STAGE 4: VOICE & DURATION RESOLUTION (M4 + M5) ───
    currentStage = 'VOICE_DURATION_RESOLUTION';
    const voiceResolution = resolveVoiceMode(flat, resolvedFormat);
    const wordResolution = resolvedFormat ? resolveTargetWords(flat, resolvedFormat) : { target_words: flat.target_words || 3000, source: 'fallback', warnings: [] };
    const targetWords = wordResolution.target_words || 3000;
    const runtimeEstimate = estimateRuntime(targetWords, wordResolution.speaking_rate);

    stages.voice_duration = {
      status: voiceResolution.error ? PIPELINE_STATUS.BLOCKED : PIPELINE_STATUS.COMPLETED,
      voice: voiceResolution,
      word_resolution: wordResolution,
      runtime_estimate: runtimeEstimate,
      timestamp: new Date().toISOString(),
    };

    if (voiceResolution.error) {
      blockers.push({ stage: 'VOICE_DURATION_RESOLUTION', hold: { type: 'VOICE_ERROR', detail: voiceResolution.error } });
    }
    for (const w of wordResolution.warnings || []) {
      warnings.push({ stage: 'VOICE_DURATION_RESOLUTION', message: w });
    }

    // ─── STAGE 5: RESEARCH GATE (M3) ───
    currentStage = 'RESEARCH_GATE';
    const providerAvailable = options.providerAvailable || false;
    const m3Result = resolveM3(flat, resolvedFormat, { providerAvailable });

    stages.research = {
      status: PIPELINE_STATUS.COMPLETED,
      content_type: m3Result.content_type,
      research_mode: m3Result.research_mode,
      research_state: m3Result.research_state,
      evidence_policy: m3Result.evidence_policy,
      generation_readiness: m3Result.generation_readiness,
      generation_permitted: m3Result.generation_permitted,
      timestamp: new Date().toISOString(),
    };

    if (m3Result.holds.length > 0) {
      for (const h of m3Result.holds) {
        blockers.push({ stage: 'RESEARCH_GATE', hold: h });
      }
    }
    for (const w of m3Result.warnings) {
      warnings.push({ stage: 'RESEARCH_GATE', message: w });
    }

    // ─── STAGE 6: SAFETY GATE ───
    currentStage = 'SAFETY_GATE';
    const readiness = normalized.readiness || assessBriefReadiness(normalized);
    const safetyGate = {
      brief_accepted: readiness.blocking_holds.length === 0,
      research_ready: m3Result.generation_readiness.research_ready,
      generation_authorized: m3Result.generation_permitted && readiness.blocking_holds.length === 0,
      production_release_permitted: false,
    };

    const researchPending = (readiness.research_requirements || []).filter(r => r.status === 'PENDING');
    if (researchPending.length > 0) {
      safetyGate.generation_authorized = false;
    }

    stages.safety = {
      status: PIPELINE_STATUS.COMPLETED,
      gates: safetyGate,
      research_requirements: readiness.research_requirements,
      timestamp: new Date().toISOString(),
    };

    if (!safetyGate.brief_accepted) {
      blockers.push({ stage: 'SAFETY_GATE', hold: { type: 'BRIEF_NOT_ACCEPTED', detail: `${readiness.blocking_holds.length} blocking hold(s)` } });
    }
    if (!safetyGate.generation_authorized) {
      warnings.push({ stage: 'SAFETY_GATE', message: 'Generation not authorized — research requirements pending or evidence not verified' });
    }

    // ─── STAGE 7: BLUEPRINT (M2 + M4) ───
    currentStage = 'BLUEPRINT';
    const blueprint = loadStructure(flat);
    stages.blueprint = {
      status: blueprint.success ? PIPELINE_STATUS.COMPLETED : PIPELINE_STATUS.BLOCKED,
      result: blueprint,
      timestamp: new Date().toISOString(),
    };

    if (!blueprint.success) {
      blockers.push({ stage: 'BLUEPRINT', hold: blueprint.hold });
    }

    // ─── STAGES 8-10: QA, EDITORIAL, REPORT ───
    // These require a script text. If provided, run QA.
    const scriptText = options.scriptText || null;
    if (scriptText) {
      currentStage = 'QA';
      const inputHolds = collectInputHolds(blockers, warnings);
      const qaResult = runQA(scriptText, flat, { inputHolds, compact: options.compact || false });

      stages.qa = {
        status: PIPELINE_STATUS.COMPLETED,
        result: qaResult,
        verdict: qaResult.report.verdict,
        timestamp: new Date().toISOString(),
      };

      currentStage = 'EDITORIAL';
      stages.editorial = {
        status: PIPELINE_STATUS.COMPLETED,
        revision_suggestions: qaResult.stages.G?.revision_suggestions || [],
        pass_count: qaResult.stages.G?.pass_count || 0,
        timestamp: new Date().toISOString(),
      };

      currentStage = 'REPORT';
      stages.report = {
        status: PIPELINE_STATUS.COMPLETED,
        qa_report: qaResult.report,
        canonical_word_count: qaResult.canonical_word_count,
        timestamp: new Date().toISOString(),
      };
    } else {
      stages.qa = { status: PIPELINE_STATUS.NOT_STARTED, reason: 'No script text provided' };
      stages.editorial = { status: PIPELINE_STATUS.NOT_STARTED, reason: 'Awaiting QA' };
      stages.report = { status: PIPELINE_STATUS.NOT_STARTED, reason: 'Awaiting QA' };
    }

    return buildPipelineResult(stages, blockers, warnings, currentStage, startTime, {
      terminal_status: 'RESEARCH_ONLY_TERMINAL',
      terminal_reason: 'Pipeline completed — RESEARCH_ONLY: not approved for production release',
      normalized_brief: normalized,
      flat_brief: flat,
      safety_gates: safetyGate,
    });

  } catch (error) {
    return buildPipelineResult(stages, blockers, warnings, currentStage, startTime, {
      terminal_status: 'FAILED',
      terminal_reason: `Pipeline error at stage ${currentStage}: ${error.message}`,
      error: error.message,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// COLLECT INPUT HOLDS FOR QA STAGE F
// ═══════════════════════════════════════════════════════════════

function collectInputHolds(blockers, warnings) {
  const holds = [];
  for (const b of blockers) {
    holds.push({
      type: b.hold?.type || 'PIPELINE_BLOCKER',
      severity: 'BLOCKING',
      detail: b.hold?.detail || b.hold?.message || 'Unknown blocker',
      source_stage: b.stage,
    });
  }
  return holds;
}

// ═══════════════════════════════════════════════════════════════
// BUILD PIPELINE RESULT
// ═══════════════════════════════════════════════════════════════

function buildPipelineResult(stages, blockers, warnings, lastStage, startTime, extra = {}) {
  const elapsed = Date.now() - startTime;
  const hasBlockers = blockers.length > 0;
  const qaVerdict = stages.qa?.result?.report?.verdict || null;

  let overallVerdict;
  if (extra.terminal_status === 'FAILED') {
    overallVerdict = 'FAILED';
  } else if (extra.terminal_status === 'BLOCKED') {
    overallVerdict = 'BLOCKED';
  } else if (hasBlockers) {
    overallVerdict = 'HOLD';
  } else if (qaVerdict === 'HOLD') {
    overallVerdict = 'HOLD';
  } else if (qaVerdict === 'PASS_WITH_WARNINGS') {
    overallVerdict = 'RESEARCH_ONLY_TERMINAL';
  } else {
    overallVerdict = 'RESEARCH_ONLY_TERMINAL';
  }

  return {
    pipeline_version: PIPELINE_VERSION,
    run_id: `PIPE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    elapsed_ms: elapsed,
    verdict: overallVerdict,
    terminal_status: extra.terminal_status || overallVerdict,
    terminal_reason: extra.terminal_reason || 'RESEARCH_ONLY — not approved for production',
    last_stage: lastStage,
    stages,
    blockers,
    warnings,
    normalized_brief: extra.normalized_brief || null,
    flat_brief: extra.flat_brief || null,
    safety_gates: extra.safety_gates || null,
    qa_verdict: qaVerdict,
    error: extra.error || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// QUALITY GATES (7 separate verdicts)
// ═══════════════════════════════════════════════════════════════

function evaluateQualityGates(pipelineResult) {
  const gates = {
    structural_complete: false,
    tests_pass: false,
    workflow_demonstrated: false,
    editorial_reviewed: false,
    research_verified: false,
    rights_cleared: false,
    production_approved: false,
  };

  const reasons = {};

  // Gate 1: Structural completeness
  if (pipelineResult.stages.blueprint?.status === PIPELINE_STATUS.COMPLETED) {
    gates.structural_complete = true;
  } else {
    reasons.structural_complete = 'Blueprint stage not completed';
  }

  // Gate 2: Tests pass (set by external test runner)
  gates.tests_pass = false;
  reasons.tests_pass = 'Must be verified by external test suite';

  // Gate 3: Workflow demonstrated
  if (pipelineResult.stages.qa?.status === PIPELINE_STATUS.COMPLETED) {
    gates.workflow_demonstrated = true;
  } else {
    reasons.workflow_demonstrated = 'QA stage not completed — no script text evaluated';
  }

  // Gate 4: Editorial reviewed
  if (pipelineResult.stages.editorial?.status === PIPELINE_STATUS.COMPLETED) {
    const suggestions = pipelineResult.stages.editorial.revision_suggestions || [];
    gates.editorial_reviewed = suggestions.length === 0 ||
      suggestions.every(s => s.priority > 3);
    if (!gates.editorial_reviewed) {
      reasons.editorial_reviewed = `${suggestions.filter(s => s.priority <= 3).length} high-priority editorial suggestions unresolved`;
    }
  } else {
    reasons.editorial_reviewed = 'Editorial stage not completed';
  }

  // Gate 5: Research verified
  const researchState = pipelineResult.stages.research?.research_state;
  const contentType = pipelineResult.stages.research?.content_type;
  if (contentType === 'creative') {
    gates.research_verified = true;
  } else if (researchState === 'verified') {
    gates.research_verified = true;
  } else {
    gates.research_verified = false;
    reasons.research_verified = `Research state is "${researchState}" — verified evidence required for ${contentType} content`;
  }

  // Gate 6: Rights cleared (always false in RESEARCH_ONLY)
  gates.rights_cleared = false;
  reasons.rights_cleared = 'RESEARCH_ONLY — rights clearance requires production review';

  // Gate 7: Production approved (always false in RESEARCH_ONLY)
  gates.production_approved = false;
  reasons.production_approved = 'RESEARCH_ONLY — not approved for production release';

  const passCount = Object.values(gates).filter(Boolean).length;
  const totalGates = Object.keys(gates).length;

  return {
    gates,
    reasons,
    pass_count: passCount,
    total_gates: totalGates,
    overall: passCount === totalGates ? 'ALL_PASS' : `${passCount}/${totalGates}_PASS`,
    recommendation: passCount >= 5 ? 'CONDITIONAL' : passCount >= 3 ? 'CONDITIONAL' : 'REWORK',
  };
}

// ═══════════════════════════════════════════════════════════════
// PILOT SCORECARD
// ═══════════════════════════════════════════════════════════════

function buildPilotScorecard(pilotResults) {
  const scorecard = {
    total_pilots: pilotResults.length,
    passed: 0,
    held: 0,
    blocked: 0,
    failed: 0,
    formats_tested: new Set(),
    niches_tested: new Set(),
    languages_tested: new Set(),
    content_types_tested: new Set(),
    voice_modes_tested: new Set(),
    details: [],
  };

  for (const pilot of pilotResults) {
    const verdict = pilot.verdict || 'FAILED';
    if (verdict === 'RESEARCH_ONLY_TERMINAL' || verdict === 'PASS' || verdict === 'PASS_WITH_WARNINGS') {
      scorecard.passed++;
    } else if (verdict === 'HOLD') {
      scorecard.held++;
    } else if (verdict === 'BLOCKED') {
      scorecard.blocked++;
    } else {
      scorecard.failed++;
    }

    const fmt = pilot.flat_brief?.format || pilot.stages?.format?.format_id;
    if (fmt) scorecard.formats_tested.add(fmt);

    const niche = pilot.flat_brief?.niche;
    if (niche) scorecard.niches_tested.add(niche);

    const lang = pilot.flat_brief?.language || 'en';
    scorecard.languages_tested.add(lang);

    const ct = pilot.stages?.research?.content_type;
    if (ct) scorecard.content_types_tested.add(ct);

    const vm = pilot.stages?.voice_duration?.voice?.mode;
    if (vm) scorecard.voice_modes_tested.add(vm);

    scorecard.details.push({
      name: pilot.pilot_name || `Pilot ${scorecard.details.length + 1}`,
      format: fmt,
      verdict,
      blocker_count: (pilot.blockers || []).length,
      warning_count: (pilot.warnings || []).length,
      qa_verdict: pilot.qa_verdict || null,
    });
  }

  scorecard.formats_tested = [...scorecard.formats_tested];
  scorecard.niches_tested = [...scorecard.niches_tested];
  scorecard.languages_tested = [...scorecard.languages_tested];
  scorecard.content_types_tested = [...scorecard.content_types_tested];
  scorecard.voice_modes_tested = [...scorecard.voice_modes_tested];

  return scorecard;
}

export {
  PIPELINE_VERSION,
  PIPELINE_STAGES,
  PIPELINE_STATUS,
  normalizedToFlat,
  runPipeline,
  collectInputHolds,
  buildPipelineResult,
  evaluateQualityGates,
  buildPilotScorecard,
};
