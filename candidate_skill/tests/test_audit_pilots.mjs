// test_audit_pilots.mjs — Run all 5 audit pilots through the pipeline
// RESEARCH_ONLY — synthetic fiction only

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
  return countSpokenWordsMultiVoice(script, voice);
}

describe('AUDIT: Full-Length Pilot Pipeline Exercise', () => {

  describe('Pilot A: Documentary (~2600 words)', () => {
    it('PA-001: normalizeBrief accepts pilot A brief', () => {
      const normalized = normalizeBrief(PILOT_A_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'documentary');
    });

    it('PA-002: duration engine resolves target words for pilot A', () => {
      const resolution = resolveTargetWords(PILOT_A_BRIEF);
      assert.ok(resolution.target_words >= 50 && resolution.target_words <= 50000);
      assert.strictEqual(resolution.target_words, 2600);
    });

    it('PA-003: voice engine resolves single_narrator for documentary', () => {
      const normalized = normalizeBrief(PILOT_A_BRIEF);
      const voice = resolveVoiceMode(normalized);
      assert.ok(voice);
      assert.strictEqual(voice.mode, 'single_narrator');
    });

    it('PA-004: spoken word count for pilot A script is substantial', () => {
      const count = getSpokenWords(PILOT_A_SCRIPT, PILOT_A_BRIEF);
      assert.ok(count.total_spoken_words >= 1800, `Expected >=1800 spoken words, got ${count.total_spoken_words}`);
    });

    it('PA-005: runtime estimate for pilot A is reasonable', () => {
      const count = getSpokenWords(PILOT_A_SCRIPT, PILOT_A_BRIEF);
      const rate = getSpeakingRate('standard_narration');
      const runtime = estimateRuntime(count.total_spoken_words, rate);
      assert.ok(runtime.estimated_seconds > 600, `Expected >10min runtime for documentary, got ${runtime.estimated_seconds}s`);
    });

    it('PA-006: QA engine processes pilot A script with inputHolds', () => {
      const result = runQA(PILOT_A_SCRIPT, {
        format: 'documentary',
        content_type: 'factual',
        inputHolds: [],
      });
      assert.ok(result.report);
      assert.ok(['PASS', 'HOLD', 'FAIL'].includes(result.report.verdict));
    });

    it('PA-007: pipeline processes pilot A end-to-end', () => {
      const result = runPipeline(PILOT_A_BRIEF, PILOT_A_SCRIPT);
      assert.ok(result);
      assert.ok(result.stages);
      assert.ok(result.terminal_status);
    });
  });

  describe('Pilot B: Explainer (~1600 words)', () => {
    it('PB-001: normalizeBrief accepts pilot B brief', () => {
      const normalized = normalizeBrief(PILOT_B_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'explainer');
    });

    it('PB-002: target words resolved for explainer', () => {
      const resolution = resolveTargetWords(PILOT_B_BRIEF);
      assert.ok(resolution.target_words >= 50 && resolution.target_words <= 50000);
      assert.strictEqual(resolution.target_words, 1600);
    });

    it('PB-003: spoken word count for pilot B is substantial', () => {
      const count = getSpokenWords(PILOT_B_SCRIPT, PILOT_B_BRIEF);
      assert.ok(count.total_spoken_words >= 1200, `Expected >=1200 spoken words, got ${count.total_spoken_words}`);
    });

    it('PB-004: QA engine processes pilot B with inputHolds', () => {
      const result = runQA(PILOT_B_SCRIPT, {
        format: 'explainer',
        content_type: 'factual',
        inputHolds: [],
      });
      assert.ok(result.report);
      assert.ok(['PASS', 'HOLD', 'FAIL'].includes(result.report.verdict));
    });

    it('PB-005: pipeline processes pilot B end-to-end', () => {
      const result = runPipeline(PILOT_B_BRIEF, PILOT_B_SCRIPT);
      assert.ok(result);
      assert.ok(result.terminal_status);
    });
  });

  describe('Pilot C: Multi-Voice Podcast (~2100 words)', () => {
    it('PC-001: normalizeBrief accepts pilot C brief', () => {
      const normalized = normalizeBrief(PILOT_C_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'podcast_interview');
    });

    it('PC-002: voice engine resolves host_guest for podcast', () => {
      const normalized = normalizeBrief(PILOT_C_BRIEF);
      const voice = resolveVoiceMode(normalized);
      assert.ok(voice);
      assert.strictEqual(voice.mode, 'host_guest');
    });

    it('PC-003: multi-voice word count detects HOST and GUEST speakers', () => {
      const count = getSpokenWords(PILOT_C_SCRIPT, PILOT_C_BRIEF);
      assert.ok(count.total_spoken_words >= 1300, `Expected >=1300 spoken words, got ${count.total_spoken_words}`);
      assert.ok(count.speaker_words);
      const speakerNames = Object.keys(count.speaker_words);
      assert.ok(speakerNames.includes('HOST'), 'Must detect HOST speaker');
      assert.ok(speakerNames.includes('GUEST'), 'Must detect GUEST speaker');
    });

    it('PC-004: QA engine processes pilot C with inputHolds', () => {
      const result = runQA(PILOT_C_SCRIPT, {
        format: 'podcast_interview',
        content_type: 'hybrid',
        inputHolds: [],
      });
      assert.ok(result.report);
    });

    it('PC-005: pipeline processes pilot C end-to-end', () => {
      const result = runPipeline(PILOT_C_BRIEF, PILOT_C_SCRIPT);
      assert.ok(result);
      assert.ok(result.terminal_status);
    });
  });

  describe('Pilot D: Short-Form (~180 words)', () => {
    it('PD-001: normalizeBrief accepts pilot D brief', () => {
      const normalized = normalizeBrief(PILOT_D_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'short_form');
    });

    it('PD-002: spoken word count for short-form is compact', () => {
      const count = getSpokenWords(PILOT_D_SCRIPT, PILOT_D_BRIEF);
      assert.ok(count.total_spoken_words >= 80 && count.total_spoken_words <= 500, `Expected 80-500 words, got ${count.total_spoken_words}`);
    });

    it('PD-003: runtime estimate under 120 seconds for energetic rate', () => {
      const count = getSpokenWords(PILOT_D_SCRIPT, PILOT_D_BRIEF);
      const rate = getSpeakingRate('energetic');
      const runtime = estimateRuntime(count.total_spoken_words, rate);
      assert.ok(runtime.estimated_seconds <= 120, `Short-form runtime ${runtime.estimated_seconds}s exceeds 120s`);
    });

    it('PD-004: pipeline processes pilot D end-to-end', () => {
      const result = runPipeline(PILOT_D_BRIEF, PILOT_D_SCRIPT);
      assert.ok(result);
      assert.ok(result.terminal_status);
    });
  });

  describe('Pilot E: German Documentary (~500 words)', () => {
    it('PE-001: normalizeBrief accepts German pilot E brief', () => {
      const normalized = normalizeBrief(PILOT_E_BRIEF);
      assert.ok(normalized);
      const fmt = normalized.format?.value ?? normalized.format;
      assert.strictEqual(fmt, 'documentary');
      const lang = normalized.language?.value ?? normalized.language;
      assert.strictEqual(lang, 'de');
    });

    it('PE-002: spoken word count for German script', () => {
      const count = getSpokenWords(PILOT_E_SCRIPT, PILOT_E_BRIEF);
      assert.ok(count.total_spoken_words >= 200, `Expected >=200 spoken words, got ${count.total_spoken_words}`);
    });

    it('PE-003: pipeline processes German pilot end-to-end', () => {
      const result = runPipeline(PILOT_E_BRIEF, PILOT_E_SCRIPT);
      assert.ok(result);
      assert.ok(result.terminal_status);
    });
  });

  describe('Cross-Pilot Validation', () => {
    it('XV-001: all 5 pilots produce pipeline results with terminal_status', () => {
      const pilots = [
        { name: 'A-documentary', brief: PILOT_A_BRIEF, script: PILOT_A_SCRIPT },
        { name: 'B-explainer', brief: PILOT_B_BRIEF, script: PILOT_B_SCRIPT },
        { name: 'C-podcast', brief: PILOT_C_BRIEF, script: PILOT_C_SCRIPT },
        { name: 'D-short_form', brief: PILOT_D_BRIEF, script: PILOT_D_SCRIPT },
        { name: 'E-german', brief: PILOT_E_BRIEF, script: PILOT_E_SCRIPT },
      ];
      for (const p of pilots) {
        const result = runPipeline(p.brief, p.script);
        assert.ok(result, `Pipeline failed for ${p.name}`);
        assert.ok(result.terminal_status, `No terminal_status for ${p.name}`);
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
        const result = runPipeline(p.brief, p.script);
        assert.strictEqual(
          result.safety_gates.generation_authorized,
          false,
          'generation_authorized must be false in RESEARCH_ONLY mode'
        );
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
        const result = runPipeline(p.brief, p.script);
        assert.strictEqual(
          result.safety_gates.production_release_permitted,
          false,
          'production_release_permitted must be false'
        );
      }
    });
  });
});
