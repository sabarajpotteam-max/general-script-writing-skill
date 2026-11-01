// test_audit_pilots.mjs — Release-Readiness Audit: Full-Length Pilot Pipeline Exercise
// RESEARCH_ONLY — synthetic fiction only
// Corrected: runPipeline(brief, { scriptText }) and runQA(scriptText, brief, { inputHolds })

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runQA } from '../scripts/qa_engine.mjs';
import { normalizeBrief } from '../scripts/brief_engine.mjs';
import { resolveTargetWords, estimateRuntime, getSpeakingRate } from '../scripts/duration_engine.mjs';
import { resolveVoiceMode, countSpokenWordsMultiVoice } from '../scripts/voice_engine.mjs';
import { runPipeline } from '../scripts/pipeline.mjs';
import {
  PILOT_A_BRIEF, PILOT_A_SCRIPT,
  PILOT_B_BRIEF, PILOT_B_SCRIPT,
  PILOT_C_BRIEF, PILOT_C_SCRIPT,
  PILOT_D_BRIEF, PILOT_D_SCRIPT,
  PILOT_E_BRIEF, PILOT_E_SCRIPT,
} from './audit_pilot_scripts.mjs';

function getSpokenWords(script, brief) {
  const nb = normalizeBrief(brief);
  const voice = resolveVoiceMode(nb);
  const effective = voice.error ? { mode: 'single_narrator', labels: ['NARRATOR'] } : voice;
  return countSpokenWordsMultiVoice(script, effective);
}

describe('AUDIT: Full-Length Pilot Pipeline Exercise', () => {

  // ═══════════════════════════════════════════════════
  // PILOT A: Documentary (en) — 2,500+ spoken words
  // ═══════════════════════════════════════════════════
  describe('Pilot A: Documentary (~2800w target, >=2500 spoken)', () => {
    it('PA-001: normalizeBrief accepts pilot A brief', () => {
      const normalized = normalizeBrief(PILOT_A_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'documentary');
    });

    it('PA-002: duration engine resolves explicit target_words', () => {
      const resolution = resolveTargetWords(PILOT_A_BRIEF);
      assert.strictEqual(resolution.target_words, 2800);
      assert.strictEqual(resolution.source, 'explicit_target_words');
    });

    it('PA-003: voice engine resolves single_narrator', () => {
      const normalized = normalizeBrief(PILOT_A_BRIEF);
      const voice = resolveVoiceMode(normalized);
      assert.ok(voice);
      assert.strictEqual(voice.mode, 'single_narrator');
    });

    it('PA-004: spoken word count >= 2500', () => {
      const count = getSpokenWords(PILOT_A_SCRIPT, PILOT_A_BRIEF);
      assert.ok(count.total_spoken_words >= 2500,
        `Documentary must have >=2500 spoken words, got ${count.total_spoken_words}`);
    });

    it('PA-005: runtime estimate > 15 minutes at standard_narration', () => {
      const count = getSpokenWords(PILOT_A_SCRIPT, PILOT_A_BRIEF);
      const rate = getSpeakingRate('standard_narration');
      const runtime = estimateRuntime(count.total_spoken_words, rate);
      assert.ok(runtime.estimated_seconds > 900,
        `Expected >15min, got ${runtime.estimated_seconds}s`);
    });

    it('PA-006: runQA with proper inputHolds in options arg', () => {
      const result = runQA(PILOT_A_SCRIPT, PILOT_A_BRIEF, { inputHolds: [] });
      assert.ok(result.report, 'QA must produce a report');
      assert.ok(result.report.verdict, 'QA must produce a verdict');
      assert.ok(result.stages, 'QA must produce stage results');
      assert.ok(result.stages.A, 'Stage A (structural) must execute');
      assert.ok(result.stages.F, 'Stage F (hold evaluation) must execute');
      assert.ok(result.stages.G, 'Stage G (editorial revision) must execute');
      assert.ok(result.canonical_word_count, 'QA must report canonical word count');
    });

    it('PA-007: pipeline with { scriptText } executes QA/editorial/report stages', () => {
      const result = runPipeline(PILOT_A_BRIEF, { scriptText: PILOT_A_SCRIPT });
      assert.ok(result);
      assert.ok(result.stages);
      assert.ok(result.terminal_status);
      // Verify QA stage actually executed (not NOT_STARTED)
      assert.notStrictEqual(result.stages.qa?.status, 'NOT_STARTED',
        'QA stage must execute when scriptText is provided');
      assert.ok(result.stages.qa?.verdict,
        'QA stage must produce a verdict');
      // Verify editorial stage executed
      assert.notStrictEqual(result.stages.editorial?.status, 'NOT_STARTED',
        'Editorial stage must execute when scriptText is provided');
      // Verify report stage executed
      assert.notStrictEqual(result.stages.report?.status, 'NOT_STARTED',
        'Report stage must execute when scriptText is provided');
      assert.ok(result.stages.report?.qa_report,
        'Report stage must contain qa_report');
    });
  });

  // ═══════════════════════════════════════════════════
  // PILOT B: Explainer (en) — 1,500+ spoken words
  // ═══════════════════════════════════════════════════
  describe('Pilot B: Explainer (~1700w target, >=1500 spoken)', () => {
    it('PB-001: normalizeBrief accepts pilot B brief', () => {
      const normalized = normalizeBrief(PILOT_B_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'explainer');
    });

    it('PB-002: spoken word count >= 1500', () => {
      const count = getSpokenWords(PILOT_B_SCRIPT, PILOT_B_BRIEF);
      assert.ok(count.total_spoken_words >= 1500,
        `Explainer must have >=1500 spoken words, got ${count.total_spoken_words}`);
    });

    it('PB-003: runQA with proper inputHolds in options arg', () => {
      const result = runQA(PILOT_B_SCRIPT, PILOT_B_BRIEF, { inputHolds: [] });
      assert.ok(result.report);
      assert.ok(result.report.verdict);
      assert.ok(result.stages.F, 'Stage F must execute');
      // With inputHolds:[] explicitly provided, SAFETY_AUDIT_MISSING should NOT be present
      const safetyMissing = (result.stages.F.holds || []).find(
        h => h.type === 'HOLD_SAFETY_AUDIT_MISSING'
      );
      assert.strictEqual(safetyMissing, undefined,
        'Explicit inputHolds:[] must not trigger SAFETY_AUDIT_MISSING');
    });

    it('PB-004: pipeline with { scriptText } produces QA verdict', () => {
      const result = runPipeline(PILOT_B_BRIEF, { scriptText: PILOT_B_SCRIPT });
      assert.ok(result);
      assert.ok(result.qa_verdict !== undefined,
        'Pipeline must produce qa_verdict when scriptText given');
      assert.notStrictEqual(result.stages.qa?.status, 'NOT_STARTED');
    });
  });

  // ═══════════════════════════════════════════════════
  // PILOT C: Multi-Voice Podcast (en) — 2,000+ spoken words
  // ═══════════════════════════════════════════════════
  describe('Pilot C: Multi-Voice Podcast (~2300w target, >=2000 spoken)', () => {
    it('PC-001: normalizeBrief accepts podcast_interview brief', () => {
      const normalized = normalizeBrief(PILOT_C_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'podcast_interview');
    });

    it('PC-002: voice engine resolves host_guest mode', () => {
      const normalized = normalizeBrief(PILOT_C_BRIEF);
      const voice = resolveVoiceMode(normalized);
      assert.ok(voice);
      assert.strictEqual(voice.mode, 'host_guest');
    });

    it('PC-003: spoken word count >= 2000 with HOST and GUEST speakers', () => {
      const count = getSpokenWords(PILOT_C_SCRIPT, PILOT_C_BRIEF);
      assert.ok(count.total_spoken_words >= 2000,
        `Podcast must have >=2000 spoken words, got ${count.total_spoken_words}`);
      const speakers = Object.keys(count.speaker_words || {});
      assert.ok(speakers.includes('HOST'), 'Must detect HOST speaker');
      assert.ok(speakers.includes('GUEST'), 'Must detect GUEST speaker');
      assert.ok(count.speaker_words.HOST >= 200,
        'HOST must have substantial dialogue');
      assert.ok(count.speaker_words.GUEST >= 800,
        'GUEST must have substantial dialogue');
    });

    it('PC-004: runQA detects multi-voice structure', () => {
      const result = runQA(PILOT_C_SCRIPT, PILOT_C_BRIEF, { inputHolds: [] });
      assert.ok(result.report);
      assert.ok(result.canonical_word_count);
    });

    it('PC-005: pipeline with { scriptText } runs full QA', () => {
      const result = runPipeline(PILOT_C_BRIEF, { scriptText: PILOT_C_SCRIPT });
      assert.ok(result);
      assert.notStrictEqual(result.stages.qa?.status, 'NOT_STARTED');
      assert.notStrictEqual(result.stages.report?.status, 'NOT_STARTED');
    });
  });

  // ═══════════════════════════════════════════════════
  // PILOT D: Short-Form (en) — ~180w target
  // ═══════════════════════════════════════════════════
  describe('Pilot D: Short-Form (~180w target)', () => {
    it('PD-001: normalizeBrief accepts short_form brief', () => {
      const normalized = normalizeBrief(PILOT_D_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'short_form');
    });

    it('PD-002: spoken word count within reasonable range of 180w target', () => {
      const count = getSpokenWords(PILOT_D_SCRIPT, PILOT_D_BRIEF);
      assert.ok(count.total_spoken_words >= 150,
        `Short-form too short: ${count.total_spoken_words} words`);
      assert.ok(count.total_spoken_words <= 400,
        `Short-form too long: ${count.total_spoken_words} words`);
    });

    it('PD-003: runtime under 2 minutes at energetic rate', () => {
      const count = getSpokenWords(PILOT_D_SCRIPT, PILOT_D_BRIEF);
      const rate = getSpeakingRate('energetic');
      const runtime = estimateRuntime(count.total_spoken_words, rate);
      assert.ok(runtime.estimated_seconds <= 120,
        `Short-form runtime ${runtime.estimated_seconds}s exceeds 2min`);
    });

    it('PD-004: pipeline with { scriptText } executes QA', () => {
      const result = runPipeline(PILOT_D_BRIEF, { scriptText: PILOT_D_SCRIPT });
      assert.ok(result);
      assert.notStrictEqual(result.stages.qa?.status, 'NOT_STARTED');
    });
  });

  // ═══════════════════════════════════════════════════
  // PILOT E: German Documentary — ~500w target
  // ═══════════════════════════════════════════════════
  describe('Pilot E: German Documentary (~600w target, >=450 spoken)', () => {
    it('PE-001: normalizeBrief accepts German documentary brief', () => {
      const normalized = normalizeBrief(PILOT_E_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'documentary');
      const lang = normalized.language?.value ?? normalized.language;
      assert.strictEqual(lang, 'de');
    });

    it('PE-002: spoken word count >= 450', () => {
      const count = getSpokenWords(PILOT_E_SCRIPT, PILOT_E_BRIEF);
      assert.ok(count.total_spoken_words >= 450,
        `German documentary must have >=450 spoken words, got ${count.total_spoken_words}`);
    });

    it('PE-003: pipeline with { scriptText } runs full QA including German text', () => {
      const result = runPipeline(PILOT_E_BRIEF, { scriptText: PILOT_E_SCRIPT });
      assert.ok(result);
      assert.notStrictEqual(result.stages.qa?.status, 'NOT_STARTED');
      assert.notStrictEqual(result.stages.report?.status, 'NOT_STARTED');
      assert.ok(result.stages.report?.canonical_word_count,
        'Report must include canonical word count');
    });
  });

  // ═══════════════════════════════════════════════════
  // CROSS-PILOT VALIDATION
  // ═══════════════════════════════════════════════════
  describe('Cross-Pilot Validation', () => {
    it('XV-001: all 5 pilots run through pipeline with scriptText and produce QA verdicts', () => {
      const pilots = [
        { name: 'A-documentary', brief: PILOT_A_BRIEF, script: PILOT_A_SCRIPT },
        { name: 'B-explainer', brief: PILOT_B_BRIEF, script: PILOT_B_SCRIPT },
        { name: 'C-podcast', brief: PILOT_C_BRIEF, script: PILOT_C_SCRIPT },
        { name: 'D-short_form', brief: PILOT_D_BRIEF, script: PILOT_D_SCRIPT },
        { name: 'E-german', brief: PILOT_E_BRIEF, script: PILOT_E_SCRIPT },
      ];
      for (const p of pilots) {
        const result = runPipeline(p.brief, { scriptText: p.script });
        assert.ok(result, `Pipeline failed for ${p.name}`);
        assert.ok(result.terminal_status, `No terminal_status for ${p.name}`);
        assert.notStrictEqual(result.stages.qa?.status, 'NOT_STARTED',
          `QA must execute for ${p.name}`);
        assert.ok(result.stages.report?.qa_report,
          `Report must contain qa_report for ${p.name}`);
      }
    });

    it('XV-002: generation_authorized is false for all pilots', () => {
      const pilots = [
        { brief: PILOT_A_BRIEF, script: PILOT_A_SCRIPT },
        { brief: PILOT_B_BRIEF, script: PILOT_B_SCRIPT },
        { brief: PILOT_C_BRIEF, script: PILOT_C_SCRIPT },
        { brief: PILOT_D_BRIEF, script: PILOT_D_SCRIPT },
        { brief: PILOT_E_BRIEF, script: PILOT_E_SCRIPT },
      ];
      for (const p of pilots) {
        const result = runPipeline(p.brief, { scriptText: p.script });
        assert.strictEqual(result.safety_gates.generation_authorized, false,
          'generation_authorized must be false in RESEARCH_ONLY');
      }
    });

    it('XV-003: production_release_permitted is false for all pilots', () => {
      const pilots = [
        { brief: PILOT_A_BRIEF, script: PILOT_A_SCRIPT },
        { brief: PILOT_B_BRIEF, script: PILOT_B_SCRIPT },
        { brief: PILOT_C_BRIEF, script: PILOT_C_SCRIPT },
        { brief: PILOT_D_BRIEF, script: PILOT_D_SCRIPT },
        { brief: PILOT_E_BRIEF, script: PILOT_E_SCRIPT },
      ];
      for (const p of pilots) {
        const result = runPipeline(p.brief, { scriptText: p.script });
        assert.strictEqual(result.safety_gates.production_release_permitted, false,
          'production_release_permitted must be false');
      }
    });

    it('XV-004: runQA without inputHolds triggers BLOCKING safety audit hold', () => {
      const result = runQA(PILOT_A_SCRIPT, PILOT_A_BRIEF);
      assert.ok(result.report);
      assert.strictEqual(result.report.verdict, 'HOLD',
        'Missing inputHolds must produce HOLD verdict');
      const safetyHold = (result.stages.F.holds || []).find(
        h => h.type === 'HOLD_SAFETY_AUDIT_MISSING'
      );
      assert.ok(safetyHold, 'Must have HOLD_SAFETY_AUDIT_MISSING');
      assert.strictEqual(safetyHold.severity, 'BLOCKING');
    });

    it('XV-005: runQA with explicit empty inputHolds does NOT trigger safety audit hold', () => {
      const result = runQA(PILOT_A_SCRIPT, PILOT_A_BRIEF, { inputHolds: [] });
      const safetyHold = (result.stages.F.holds || []).find(
        h => h.type === 'HOLD_SAFETY_AUDIT_MISSING'
      );
      assert.strictEqual(safetyHold, undefined,
        'Explicit inputHolds:[] must not trigger SAFETY_AUDIT_MISSING');
    });

    it('XV-006: pipeline collectInputHolds provides real holds to QA stage F', () => {
      const result = runPipeline(PILOT_A_BRIEF, { scriptText: PILOT_A_SCRIPT });
      assert.ok(result.stages.qa?.result?.stages?.F,
        'Pipeline QA must include stage F results');
      const stageF = result.stages.qa.result.stages.F;
      // Pipeline collects inputHolds from upstream blockers, so SAFETY_AUDIT_MISSING
      // should NOT be present (pipeline explicitly passes holds via collectInputHolds)
      const safetyMissing = (stageF.holds || []).find(
        h => h.type === 'HOLD_SAFETY_AUDIT_MISSING'
      );
      assert.strictEqual(safetyMissing, undefined,
        'Pipeline must pass collected inputHolds to QA, preventing SAFETY_AUDIT_MISSING');
    });
  });
});
