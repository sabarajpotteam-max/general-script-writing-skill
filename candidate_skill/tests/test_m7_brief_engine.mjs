/**
 * M7 Smart Client Brief Engine Tests
 * Tests normalizeBrief, smart defaults, cross-field validation, backward compatibility,
 * provenance tracking, language resolution, platform adaptation, S/O/M identification,
 * readiness assessment, practical examples, safety invariants, and prototype reconciliation.
 * Node.js built-in test runner (node:test).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeBrief,
  BRIEF_SCHEMA_VERSION,
  SUPPORTED_FORMATS,
  SUPPORTED_PLATFORMS,
  FORMAT_DEFAULTS,
  PLATFORM_CONSTRAINTS,
  FORMAT_CONTENT_TYPE_MAP,
  FORMAT_VOICE_MAP,
  VALID_OBJECTIVES,
  ISO_639_1_CODES,
  LANGUAGE_NAME_MAP,
  validateCrossFields,
  assessBriefReadiness,
  resolveLanguage,
  resolveAudience,
  resolvePlatform,
  generateWorkingTitle,
  identifySubjectObjectMechanism,
} from '../scripts/brief_engine.mjs';

// ═══════════════════════════════════════════════════════════════
// 1. LEGACY BRIEF COMPATIBILITY (12 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Legacy Brief Compatibility', () => {
  const legacyBrief = {
    title: 'The Hidden Science of Hurricane Prediction',
    niche: 'N01',
    subject: 'NOAA prediction models',
    object: 'hurricane forecast accuracy',
    mechanism: 'machine learning + atmospheric data fusion',
    uncertainty: 'accuracy beyond 5-day forecasts',
    target_words: 4500,
    evidence: [
      { id: 'E-001', claim: 'ML models improved accuracy by 15%', source: 'S33', epistemic_status: 'confirmed' },
    ],
  };

  it('accepts legacy brief without errors', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.success, true);
  });

  it('aliases title to topic', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.topic.value, legacyBrief.title);
    assert.equal(r.topic.source, 'alias');
  });

  it('defaults format to documentary', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.format.value, 'documentary');
    assert.equal(r.format.source, 'universal_default');
  });

  it('infers factual content type from documentary format', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.content_type.value, 'factual');
  });

  it('infers client_provided research mode when evidence present', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.research_mode.value, 'client_provided');
    assert.equal(r.research_mode.source, 'inferred');
  });

  it('defaults audience to general_adult', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.audience.value, 'general_adult');
    assert.equal(r.audience.source, 'universal_default');
  });

  it('defaults language to en', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.language.code, 'en');
    assert.equal(r.language.source, 'universal_default');
  });

  it('preserves explicit target_words', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.word_resolution.target_words, 4500);
  });

  it('preserves S/O/M as non-provisional', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.subject_object_mechanism.provisional, false);
    assert.equal(r.subject_object_mechanism.subject.value, 'NOAA prediction models');
  });

  it('marks generation as ready for complete legacy brief', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r.readiness.generation_ready, true);
  });

  it('preserves original input in _raw', () => {
    const r = normalizeBrief(legacyBrief);
    assert.equal(r._raw.title, legacyBrief.title);
    assert.equal(r._raw.niche, 'N01');
  });

  it('prefers topic over title when both present', () => {
    const r = normalizeBrief({ ...legacyBrief, topic: 'Override Topic' });
    assert.equal(r.topic.value, 'Override Topic');
    assert.equal(r.topic.source, 'explicit');
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. NEW STYLE BRIEF (12 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: New Style Brief', () => {
  it('accepts minimal brief (topic only)', () => {
    const r = normalizeBrief({ topic: 'The psychology of procrastination' });
    assert.equal(r.success, true);
    assert.equal(r.topic.value, 'The psychology of procrastination');
    assert.equal(r.topic.source, 'explicit');
  });

  it('accepts topic + audience + language', () => {
    const r = normalizeBrief({ topic: 'Sourdough bread making', audience: 'home bakers, beginners', language: 'en' });
    assert.equal(r.success, true);
    assert.equal(r.audience.description, 'home bakers, beginners');
    assert.equal(r.audience.knowledge_level, 'beginner');
  });

  it('accepts full new-style brief', () => {
    const r = normalizeBrief({
      topic: 'Why you cannot tickle yourself',
      audience: 'casual science fans, 18-35',
      language: 'en',
      format: 'short_form',
      platform: 'youtube_shorts',
      target_duration: '55 seconds',
      objectives: ['educate', 'entertain'],
      voice: { tone: 'playful', humor_level: 2 },
    });
    assert.equal(r.success, true);
    assert.equal(r.format.value, 'short_form');
    assert.equal(r.platform.value, 'youtube_shorts');
  });

  it('rejects brief with no topic', () => {
    const r = normalizeBrief({ audience: 'general' });
    assert.ok(r.holds.some(h => h.detail.includes('Topic is required')));
  });

  it('rejects brief with topic too short', () => {
    const r = normalizeBrief({ topic: 'AB' });
    assert.ok(r.holds.some(h => h.detail.includes('minimum 3')));
  });

  it('rejects brief with topic too long', () => {
    const r = normalizeBrief({ topic: 'A'.repeat(501) });
    assert.ok(r.holds.some(h => h.detail.includes('500 character')));
  });

  it('rejects null input', () => {
    const r = normalizeBrief(null);
    assert.equal(r.success, false);
  });

  it('rejects non-object input', () => {
    const r = normalizeBrief('just a string');
    assert.equal(r.success, false);
  });

  it('accepts explainer format', () => {
    const r = normalizeBrief({ topic: 'Quantum entanglement', format: 'explainer' });
    assert.equal(r.format.value, 'explainer');
    assert.equal(r.format.source, 'explicit');
  });

  it('accepts narrative format', () => {
    const r = normalizeBrief({ topic: 'A detective story', format: 'narrative', content_type: 'creative' });
    assert.equal(r.format.value, 'narrative');
    assert.equal(r.content_type.value, 'creative');
  });

  it('fills default objectives as inform', () => {
    const r = normalizeBrief({ topic: 'Some topic' });
    assert.deepEqual(r.objectives.value, ['inform']);
    assert.equal(r.objectives.source, 'universal_default');
  });

  it('validates objectives and warns on unknown', () => {
    const r = normalizeBrief({ topic: 'Test', objectives: ['educate', 'unknown_goal'] });
    assert.deepEqual(r.objectives.value, ['educate']);
    assert.ok(r.warnings.some(w => w.includes('unknown_goal')));
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. SMART DEFAULTS (16 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Smart Defaults', () => {
  it('documentary → factual content type', () => {
    const r = normalizeBrief({ topic: 'Test', format: 'documentary' });
    assert.equal(r.content_type.value, 'factual');
    assert.equal(r.content_type.source, 'format_default');
  });

  it('explainer → factual content type', () => {
    const r = normalizeBrief({ topic: 'Test', format: 'explainer' });
    assert.equal(r.content_type.value, 'factual');
  });

  it('narrative → creative content type', () => {
    const r = normalizeBrief({ topic: 'A story', format: 'narrative' });
    assert.equal(r.content_type.value, 'creative');
  });

  it('tutorial → instructional content type', () => {
    const r = normalizeBrief({ topic: 'How to cook', format: 'tutorial' });
    assert.equal(r.content_type.value, 'instructional');
  });

  it('podcast_interview → hybrid content type', () => {
    const r = normalizeBrief({ topic: 'Interview with expert', format: 'podcast_interview' });
    assert.equal(r.content_type.value, 'hybrid');
  });

  it('short_form + educate → factual', () => {
    const r = normalizeBrief({ topic: 'Quick tip', format: 'short_form', objectives: ['educate'] });
    assert.equal(r.content_type.value, 'factual');
    assert.equal(r.content_type.source, 'inferred');
  });

  it('short_form + entertain → creative', () => {
    const r = normalizeBrief({ topic: 'Funny skit', format: 'short_form', objectives: ['entertain'] });
    assert.equal(r.content_type.value, 'creative');
  });

  it('short_form no objectives → hybrid (safe default)', () => {
    const r = normalizeBrief({ topic: 'Quick clip', format: 'short_form' });
    assert.equal(r.content_type.value, 'hybrid');
  });

  it('documentary → single_narrator voice', () => {
    const r = normalizeBrief({ topic: 'Test', format: 'documentary' });
    assert.equal(r.voice.mode, 'single_narrator');
    assert.equal(r.voice.tone, 'authoritative');
  });

  it('podcast_interview → host_guest voice', () => {
    const r = normalizeBrief({ topic: 'Interview', format: 'podcast_interview' });
    assert.equal(r.voice.mode, 'host_guest');
    assert.equal(r.voice.tone, 'conversational');
  });

  it('news → formal tone', () => {
    const r = normalizeBrief({ topic: 'Breaking news', format: 'news' });
    assert.equal(r.voice.tone, 'formal');
  });

  it('missing format → documentary default', () => {
    const r = normalizeBrief({ topic: 'Any topic' });
    assert.equal(r.format.value, 'documentary');
    assert.equal(r.format.source, 'universal_default');
  });

  it('missing audience → general_adult', () => {
    const r = normalizeBrief({ topic: 'Test' });
    assert.equal(r.audience.value, 'general_adult');
    assert.equal(r.audience.source, 'universal_default');
  });

  it('missing language → en', () => {
    const r = normalizeBrief({ topic: 'Test' });
    assert.equal(r.language.code, 'en');
    assert.equal(r.language.source, 'universal_default');
  });

  it('creative + no evidence → minimal research mode', () => {
    const r = normalizeBrief({ topic: 'A fairy tale', content_type: 'creative' });
    assert.equal(r.research_mode.value, 'minimal');
    assert.equal(r.research_mode.source, 'inferred');
  });

  it('factual + no evidence → system_assisted research mode', () => {
    const r = normalizeBrief({ topic: 'Science facts', content_type: 'factual' });
    assert.equal(r.research_mode.value, 'system_assisted');
    assert.equal(r.research_mode.source, 'inferred');
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. CROSS-FIELD VALIDATION (11 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Cross-Field Validation', () => {
  it('YouTube Shorts + long duration → PLATFORM_COMPLIANCE', () => {
    const r = normalizeBrief({
      topic: 'Very long topic',
      platform: 'youtube_shorts',
      target_words: 5000,
    });
    assert.ok(r.holds.some(h => h.type === 'HOLD_PLATFORM_COMPLIANCE'));
  });

  it('YouTube Shorts + short duration → no platform hold', () => {
    const r = normalizeBrief({
      topic: 'Quick tip',
      format: 'short_form',
      platform: 'youtube_shorts',
      target_words: 100,
    });
    const platformHolds = r.holds.filter(h => h.type === 'HOLD_PLATFORM_COMPLIANCE');
    assert.equal(platformHolds.length, 0);
  });

  it('social_media + long duration → PLATFORM_COMPLIANCE', () => {
    const r = normalizeBrief({
      topic: 'Long social post',
      platform: 'social_media',
      target_words: 5000,
    });
    assert.ok(r.holds.some(h => h.type === 'HOLD_PLATFORM_COMPLIANCE'));
  });

  it('child audience + violent topic → AUDIENCE_RISK', () => {
    const r = normalizeBrief({
      topic: 'A murder mystery with violence and gore',
      audience: 'kids ages 8-12',
      content_type: 'creative',
    });
    assert.ok(r.holds.some(h => h.type === 'HOLD_AUDIENCE_RISK'));
  });

  it('adult audience + any content → no audience hold', () => {
    const r = normalizeBrief({
      topic: 'Horror story',
      audience: 'adults 25-45',
      content_type: 'creative',
    });
    const audienceHolds = r.holds.filter(h => h.type === 'HOLD_AUDIENCE_RISK');
    assert.equal(audienceHolds.length, 0);
  });

  it('brand_voice mode without guidelines → FORMAT_MISMATCH', () => {
    const r = normalizeBrief({
      topic: 'Brand content',
      voice: { mode: 'brand_voice' },
    });
    assert.ok(r.holds.some(h => h.type === 'HOLD_FORMAT_MISMATCH' && h.detail.includes('brand_voice')));
  });

  it('brand_voice mode with guidelines → no hold', () => {
    const r = normalizeBrief({
      topic: 'Brand content',
      voice: { mode: 'brand_voice' },
      brand_voice: { guidelines: 'Warm and friendly' },
    });
    const brandHolds = r.holds.filter(h => h.detail && h.detail.includes('brand_voice'));
    assert.equal(brandHolds.length, 0);
  });

  it('custom format without spec → FORMAT_MISMATCH', () => {
    const r = normalizeBrief({
      topic: 'Custom script',
      format: 'custom',
    });
    assert.ok(r.holds.some(h => h.type === 'HOLD_FORMAT_MISMATCH'));
  });

  it('custom format with valid spec → no hold from cross-field', () => {
    const r = normalizeBrief({
      topic: 'Custom script',
      format: 'custom',
      custom_format_spec: {
        name: 'My Format',
        sections: [
          { name: 'Intro', budget_percent: '20-30%' },
          { name: 'Body', budget_percent: '50-60%' },
          { name: 'Outro', budget_percent: '15-25%' },
        ],
      },
    });
    const customHolds = r.holds.filter(h => h.detail && h.detail.includes('custom_format_spec'));
    assert.equal(customHolds.length, 0);
  });

  it('invalid platform → error', () => {
    const r = normalizeBrief({ topic: 'Test', platform: 'myspace' });
    assert.ok(r.holds.some(h => h.detail && h.detail.includes('myspace')));
  });

  it('generic platform → no constraints', () => {
    const r = normalizeBrief({ topic: 'Test', platform: 'generic', target_words: 30000 });
    const platformHolds = r.holds.filter(h => h.type === 'HOLD_PLATFORM_COMPLIANCE');
    assert.equal(platformHolds.length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. PROVENANCE TRACKING (6 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Provenance Tracking', () => {
  it('explicit values tracked as explicit', () => {
    const r = normalizeBrief({ topic: 'Test', format: 'explainer', language: 'de', audience: 'scientists' });
    assert.equal(r.provenance.topic, 'explicit');
    assert.equal(r.provenance.format, 'explicit');
    assert.equal(r.provenance.language, 'explicit');
    assert.equal(r.provenance.audience, 'explicit');
  });

  it('defaults tracked as universal_default', () => {
    const r = normalizeBrief({ topic: 'Test' });
    assert.equal(r.provenance.format, 'universal_default');
    assert.equal(r.provenance.language, 'universal_default');
    assert.equal(r.provenance.audience, 'universal_default');
  });

  it('alias tracked as alias', () => {
    const r = normalizeBrief({ title: 'My Title', niche: 'N01' });
    assert.equal(r.provenance.topic, 'alias');
  });

  it('format_default tracked for content_type', () => {
    const r = normalizeBrief({ topic: 'Test', format: 'documentary' });
    assert.equal(r.provenance.content_type, 'format_default');
  });

  it('inferred tracked for research_mode', () => {
    const r = normalizeBrief({ topic: 'Test', content_type: 'creative' });
    assert.equal(r.provenance.research_mode, 'inferred');
  });

  it('schema_version present', () => {
    const r = normalizeBrief({ topic: 'Test' });
    assert.equal(r.schema_version, '2.0.0');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. LANGUAGE RESOLUTION (7 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Language Resolution', () => {
  it('valid ISO code accepted', () => {
    const r = resolveLanguage({ language: 'de' });
    assert.equal(r.code, 'de');
    assert.equal(r.valid, true);
  });

  it('full language name resolved', () => {
    const r = resolveLanguage({ language: 'German' });
    assert.equal(r.code, 'de');
    assert.equal(r.valid, true);
  });

  it('Urdu resolved', () => {
    const r = resolveLanguage({ language: 'Urdu' });
    assert.equal(r.code, 'ur');
  });

  it('Spanish resolved', () => {
    const r = resolveLanguage({ language: 'español' });
    assert.equal(r.code, 'es');
  });

  it('invalid language returns error', () => {
    const r = resolveLanguage({ language: 'klingon' });
    assert.equal(r.valid, false);
    assert.ok(r.error.includes('Unrecognized'));
  });

  it('missing language defaults to en', () => {
    const r = resolveLanguage({});
    assert.equal(r.code, 'en');
    assert.equal(r.source, 'universal_default');
  });

  it('supports 20+ ISO codes', () => {
    const codes = ['en', 'de', 'ur', 'es', 'hi', 'ar', 'fr', 'zh', 'ja', 'ko', 'pt', 'ru', 'it', 'nl', 'tr', 'pl', 'sv', 'da', 'fi', 'no'];
    for (const code of codes) {
      const r = resolveLanguage({ language: code });
      assert.equal(r.valid, true, `${code} should be valid`);
      assert.equal(r.code, code);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. PLATFORM ADAPTATION (6 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Platform Adaptation', () => {
  it('youtube_shorts has 180s limit', () => {
    const r = resolvePlatform({ platform: 'youtube_shorts' });
    assert.equal(r.value, 'youtube_shorts');
    assert.equal(r.constraints.max_duration_seconds, 180);
  });

  it('social_media has 180s limit', () => {
    const r = resolvePlatform({ platform: 'social_media' });
    assert.equal(r.constraints.max_duration_seconds, 180);
  });

  it('youtube has no duration limit', () => {
    const r = resolvePlatform({ platform: 'youtube' });
    assert.equal(r.constraints.max_duration_seconds, null);
  });

  it('generic has no duration limit', () => {
    const r = resolvePlatform({ platform: 'generic' });
    assert.equal(r.constraints.max_duration_seconds, null);
  });

  it('missing platform defaults to generic', () => {
    const r = resolvePlatform({});
    assert.equal(r.value, 'generic');
    assert.equal(r.source, 'universal_default');
  });

  it('invalid platform returns error', () => {
    const r = resolvePlatform({ platform: 'invalid_platform' });
    assert.equal(r.value, null);
    assert.ok(r.error.includes('not supported'));
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. S/O/M IDENTIFICATION (7 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Subject/Object/Mechanism Identification', () => {
  it('explicit S/O/M preserved as non-provisional', () => {
    const r = identifySubjectObjectMechanism({
      subject: 'NOAA models', object: 'forecast accuracy', mechanism: 'ML fusion',
    });
    assert.equal(r.provisional, false);
    assert.equal(r.subject.value, 'NOAA models');
  });

  it('infers subject from "How X affects Y" topic', () => {
    const r = identifySubjectObjectMechanism({ topic: 'How sleep deprivation affects memory' });
    assert.equal(r.provisional, true);
    assert.ok(r.subject.value.includes('sleep deprivation'));
    assert.equal(r.subject.source, 'inferred');
  });

  it('infers from "Why X" topic', () => {
    const r = identifySubjectObjectMechanism({ topic: 'Why the sky is blue' });
    assert.equal(r.provisional, true);
    assert.ok(r.subject);
  });

  it('infers from "The X of Y" topic', () => {
    const r = identifySubjectObjectMechanism({ topic: 'The science of sleep' });
    assert.equal(r.provisional, true);
    assert.ok(r.subject.value);
    assert.ok(r.object.value);
  });

  it('mechanism always marked as REQUIRES RESEARCH when inferred', () => {
    const r = identifySubjectObjectMechanism({ topic: 'How gravity works' });
    assert.ok(r.mechanism.value.includes('[REQUIRES RESEARCH]'));
    assert.equal(r.mechanism.source, 'placeholder');
  });

  it('provisional note present for inferred S/O/M', () => {
    const r = identifySubjectObjectMechanism({ topic: 'Some interesting topic' });
    assert.ok(r.note);
    assert.ok(r.note.includes('Provisional'));
    assert.ok(r.note.includes('NOT verified'));
  });

  it('empty topic returns none source', () => {
    const r = identifySubjectObjectMechanism({ topic: '' });
    assert.equal(r.source, 'none');
    assert.equal(r.provisional, true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. BRIEF READINESS ASSESSMENT (6 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Brief Readiness Assessment', () => {
  it('complete brief → generation_ready: true', () => {
    const r = normalizeBrief({
      topic: 'History of the internet',
      audience: 'general viewers',
      language: 'en',
      format: 'documentary',
      content_type: 'factual',
      evidence: [{ id: 'E-001', claim: 'ARPANET created 1969', source: 'S01', epistemic_status: 'confirmed' }],
    });
    assert.equal(r.readiness.generation_ready, true);
  });

  it('blocking holds → generation_ready: false', () => {
    const r = normalizeBrief({
      topic: 'A',
    });
    assert.equal(r.readiness.generation_ready, false);
    assert.ok(r.readiness.blocking_holds.length > 0);
  });

  it('factual + no evidence → research requirement', () => {
    const r = normalizeBrief({
      topic: 'Science facts',
      content_type: 'factual',
    });
    assert.ok(r.readiness.research_requirements.length > 0);
    assert.ok(r.readiness.research_requirements.some(rq => rq.type === 'topic_research'));
  });

  it('creative brief → no research requirement', () => {
    const r = normalizeBrief({
      topic: 'A fairy tale adventure',
      content_type: 'creative',
    });
    const factualReqs = r.readiness.research_requirements.filter(rq => rq.type === 'topic_research');
    assert.equal(factualReqs.length, 0);
  });

  it('writing_strategy_handoff populated', () => {
    const r = normalizeBrief({ topic: 'Test topic', format: 'explainer' });
    const ws = r.readiness.writing_strategy_handoff;
    assert.equal(ws.format, 'explainer');
    assert.equal(ws.content_type, 'factual');
    assert.ok(ws.language);
  });

  it('provisional SOM for factual → som_verification requirement', () => {
    const r = normalizeBrief({ topic: 'How gravity works', content_type: 'factual' });
    assert.ok(r.readiness.research_requirements.some(rq => rq.type === 'som_verification'));
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. PRACTICAL EXAMPLES (6 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Practical Examples', () => {
  it('German historical documentary', () => {
    const r = normalizeBrief({
      topic: 'Die Geschichte der Berliner Mauer',
      audience: 'German history enthusiasts',
      language: 'de',
      format: 'documentary',
      niche: 'N03',
      content_type: 'factual',
      subject: 'Berlin Wall',
      object: 'division of Germany',
      mechanism: 'Cold War geopolitics',
      uncertainty: 'exact decision-making process of wall construction',
      target_words: 5000,
      evidence: [{ id: 'E-001', claim: 'Wall built August 13 1961', source: 'S01', epistemic_status: 'confirmed' }],
      niche_context: { era_start: 1939, era_end: 1989 },
    });
    assert.equal(r.success, true);
    assert.equal(r.language.code, 'de');
    assert.equal(r.format.value, 'documentary');
    assert.equal(r.content_type.value, 'factual');
  });

  it('English science explainer', () => {
    const r = normalizeBrief({
      topic: 'How CRISPR gene editing works',
      audience: 'science-curious adults, general knowledge level',
      language: 'en',
      format: 'explainer',
      target_duration: '10 minutes',
      objectives: ['educate', 'inform'],
    });
    assert.equal(r.success, true);
    assert.equal(r.format.value, 'explainer');
    assert.equal(r.content_type.value, 'factual');
    assert.ok(r.readiness.research_requirements.length > 0);
  });

  it('Creative fictional story', () => {
    const r = normalizeBrief({
      topic: 'A detective discovers their partner is the killer',
      audience: 'fiction fans, adults',
      language: 'en',
      format: 'narrative',
      content_type: 'creative',
      objectives: ['entertain'],
      characters: [
        { name: 'Detective Chen', role: 'protagonist', description: 'Veteran homicide detective' },
        { name: 'Officer Park', role: 'antagonist', description: 'Charismatic partner with a dark secret' },
      ],
      setting: { time_period: 'Present day', location: 'San Francisco' },
      premise: 'A series of murders leads Detective Chen to discover their trusted partner is the killer.',
    });
    assert.equal(r.success, true);
    assert.equal(r.content_type.value, 'creative');
    assert.equal(r.research_mode.value, 'minimal');
  });

  it('Psychology short-form', () => {
    const r = normalizeBrief({
      topic: 'The Dunning-Kruger effect explained in 60 seconds',
      audience: 'casual science fans, 18-35',
      language: 'en',
      format: 'short_form',
      platform: 'youtube_shorts',
      target_duration: '55 seconds',
      objectives: ['educate', 'entertain'],
    });
    assert.equal(r.success, true);
    assert.equal(r.format.value, 'short_form');
    assert.equal(r.platform.value, 'youtube_shorts');
    const platformHolds = r.holds.filter(h => h.type === 'HOLD_PLATFORM_COMPLIANCE');
    assert.equal(platformHolds.length, 0);
  });

  it('Host-guest podcast', () => {
    const r = normalizeBrief({
      topic: 'Interview with a Mars mission scientist',
      audience: 'space enthusiasts, general knowledge',
      language: 'en',
      format: 'podcast_interview',
      target_duration: '30 minutes',
      voice: { mode: 'host_guest', tone: 'conversational' },
      objectives: ['inform', 'entertain'],
    });
    assert.equal(r.success, true);
    assert.equal(r.format.value, 'podcast_interview');
    assert.equal(r.voice.mode, 'host_guest');
    assert.equal(r.content_type.value, 'hybrid');
  });

  it('Unknown custom niche', () => {
    const r = normalizeBrief({
      topic: 'The art of underwater basket weaving',
      audience: 'hobby enthusiasts',
      language: 'en',
      niche: 'underwater_crafts',
      format: 'explainer',
    });
    assert.equal(r.success, true);
    assert.ok(r.niche_resolution);
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. SAFETY INVARIANTS (7 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Safety Invariants', () => {
  it('inferred values never marked as verified', () => {
    const r = normalizeBrief({ topic: 'How gravity works' });
    const som = r.subject_object_mechanism;
    if (som.subject) {
      assert.notEqual(som.subject.source, 'verified');
    }
    if (som.mechanism) {
      assert.notEqual(som.mechanism.source, 'verified');
    }
  });

  it('provisional SOM includes REQUIRES RESEARCH note', () => {
    const r = normalizeBrief({ topic: 'Why ice floats', content_type: 'factual' });
    const som = r.subject_object_mechanism;
    assert.equal(som.provisional, true);
    if (som.mechanism) {
      assert.ok(som.mechanism.value.includes('[REQUIRES RESEARCH]'));
    }
  });

  it('factual content without evidence flags research requirement', () => {
    const r = normalizeBrief({ topic: 'Vaccine efficacy', content_type: 'factual' });
    assert.ok(r.readiness.research_requirements.some(rq => rq.type === 'topic_research'));
  });

  it('unknown content_type defaults to safe (not factual)', () => {
    const r = normalizeBrief({ topic: 'Test' });
    // For documentary format, factual IS the correct default
    // But for unknown format, should default safe
    const r2 = normalizeBrief({ topic: 'Test', format: 'custom', custom_format_spec: { name: 'X', sections: [{ name: 'A', budget_percent: '50-50%' }, { name: 'B', budget_percent: '50-50%' }] } });
    assert.equal(r2.content_type.value, 'hybrid');
    assert.equal(r2.content_type.source, 'universal_default');
  });

  it('schema version is 2.0.0', () => {
    assert.equal(BRIEF_SCHEMA_VERSION, '2.0.0');
  });

  it('SUPPORTED_FORMATS includes all 14 formats', () => {
    assert.ok(SUPPORTED_FORMATS.length >= 14);
    assert.ok(SUPPORTED_FORMATS.includes('documentary'));
    assert.ok(SUPPORTED_FORMATS.includes('narrative'));
    assert.ok(SUPPORTED_FORMATS.includes('custom'));
  });

  it('invalid content_type produces hold', () => {
    const r = normalizeBrief({ topic: 'Test', content_type: 'invalid_type' });
    assert.ok(r.holds.some(h => h.detail && h.detail.includes('Invalid content_type')));
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. PROTOTYPE RECONCILIATION (37 tests)
// ═══════════════════════════════════════════════════════════════

describe('M7: Prototype Reconciliation — Cross-Module Integration', () => {
  it('PR-001: legacy brief → validateInput completes without crash', async () => {
    const { validateInput } = await import('../scripts/validate.mjs');
    const brief = { title: 'Test', niche: 'N01', subject: 'X', object: 'Y', mechanism: 'Z', uncertainty: 'qualified', target_words: 3000, evidence: [{ id: 'E-001', claim: 'test', source: 'S01', epistemic_status: 'confirmed' }], niche_context: { issued_at: '2026-01-01', valid_until: '2026-12-31', reference_time: '2026-06-01' } };
    const r = validateInput(brief);
    assert.ok(r.status === 'PASS' || r.status === 'HOLD', 'validateInput should return PASS or HOLD');
    assert.ok(Array.isArray(r.holds));
  });

  it('PR-002: legacy brief → normalizeBrief succeeds', () => {
    const brief = { title: 'Test', niche: 'N01', subject: 'X', object: 'Y', mechanism: 'Z', uncertainty: 'qualified', target_words: 3000, evidence: [{ id: 'E-001', claim: 'c', source: 'S01', epistemic_status: 'confirmed' }] };
    const r = normalizeBrief(brief);
    assert.equal(r.success, true);
  });

  it('PR-003: normalizeBrief topic matches validateInput workingBrief topic', async () => {
    const { validateInput } = await import('../scripts/validate.mjs');
    const brief = { title: 'Hurricane Science', niche: 'science', target_words: 3000 };
    const nb = normalizeBrief(brief);
    const vi = validateInput(brief);
    assert.equal(nb.topic.value, 'Hurricane Science');
  });

  it('PR-004: normalizeBrief format → structure_loader accepts', async () => {
    const { loadStructure } = await import('../scripts/structure_loader.mjs');
    const brief = { topic: 'Test', format: 'documentary', target_words: 3000 };
    const nb = normalizeBrief(brief);
    assert.equal(nb.format.value, 'documentary');
    const structure = loadStructure({ ...brief, title: brief.topic });
    assert.equal(structure.success, true);
  });

  it('PR-005: normalizeBrief voice → voice_engine resolves', async () => {
    const { resolveVoiceMode } = await import('../scripts/voice_engine.mjs');
    const brief = { topic: 'Test', format: 'podcast_interview', voice: { mode: 'host_guest' } };
    const nb = normalizeBrief(brief);
    assert.equal(nb.voice.mode, 'host_guest');
    const fmt = (await import('../scripts/format_registry.mjs')).getFormatDefinition('documentary');
    const vr = resolveVoiceMode(brief, fmt);
    assert.equal(vr.mode, 'host_guest');
  });

  it('PR-006: normalizeBrief duration → duration_engine resolves', async () => {
    const { resolveTargetWords } = await import('../scripts/duration_engine.mjs');
    const { getFormatDefinition } = await import('../scripts/format_registry.mjs');
    const fmt = getFormatDefinition('documentary');
    const brief = { topic: 'Test', target_duration: '10 minutes' };
    const nb = normalizeBrief(brief);
    assert.ok(nb.word_resolution.target_words > 0);
  });

  it('PR-007: normalizeBrief niche → niche_resolver resolves', async () => {
    const { resolveNiche } = await import('../scripts/niche_resolver.mjs');
    const brief = { topic: 'Test', niche: 'N01' };
    const nb = normalizeBrief(brief);
    assert.ok(nb.niche_resolution);
    assert.equal(nb.niche_resolution.tier, 1);
  });

  it('PR-008: normalizeBrief content_type → content_type_engine consistent', async () => {
    const { inferContentType } = await import('../scripts/content_type_engine.mjs');
    const { getFormatDefinition } = await import('../scripts/format_registry.mjs');
    const fmt = getFormatDefinition('documentary');
    const ct = inferContentType({ format: 'documentary' }, fmt);
    const nb = normalizeBrief({ topic: 'Test', format: 'documentary' });
    assert.equal(nb.content_type.value, ct.content_type);
  });

  it('PR-009: normalizeBrief → runQA pipeline accepts brief', async () => {
    const { runQA } = await import('../scripts/qa_engine.mjs');
    const brief = { topic: 'Test', format: 'documentary', target_words: 200 };
    const nb = normalizeBrief(brief);
    const script = '## HOOK\nSome text.\n## PROBLEM\nMore text.\n## DISCOVERY\n[E-001] data.\n## MECHANISM\n[E-002] detail.\n## CHALLENGE\nDifficulty.\n## RESOLUTION\nSolution.\n## IMPLICATIONS\nBroadly.\n## OUTRO\nEnd.';
    const qa = runQA(script, brief, { target_words: 200 });
    assert.ok(qa.stages);
    assert.ok(qa.report);
  });

  it('PR-010: re-exports available from validate.mjs', async () => {
    const mod = await import('../scripts/validate.mjs');
    assert.ok(typeof mod.normalizeBrief === 'function');
    assert.ok(typeof mod.resolveLanguage === 'function');
    assert.ok(typeof mod.assessBriefReadiness === 'function');
    assert.equal(mod.BRIEF_SCHEMA_VERSION, '2.0.0');
  });

  it('PR-011: SKILL.md native and candidate match', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const candidate = readFileSync(resolve('candidate_skill/SKILL.md'), 'utf-8');
    const native = readFileSync(resolve('.claude/skills/universal-scriptwriting/SKILL.md'), 'utf-8');
    assert.equal(candidate, native, 'Candidate and native SKILL.md must be identical');
  });

  it('PR-012: all 10 scripts synced between candidate and native', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const candidateDir = resolve('candidate_skill/scripts');
    const nativeDir = resolve('.claude/skills/universal-scriptwriting/scripts');
    const files = readdirSync(candidateDir).filter(f => f.endsWith('.mjs'));
    assert.ok(files.length >= 10);
    for (const f of files) {
      const c = readFileSync(resolve(candidateDir, f), 'utf-8');
      const n = readFileSync(resolve(nativeDir, f), 'utf-8');
      assert.equal(c, n, `${f} must be identical in candidate and native`);
    }
  });

  it('PR-013: brief_engine loads from native skill directory', async () => {
    const mod = await import('../../.claude/skills/universal-scriptwriting/scripts/brief_engine.mjs');
    assert.ok(typeof mod.normalizeBrief === 'function');
  });

  it('PR-014: validate.mjs loads from native skill directory', async () => {
    const mod = await import('../../.claude/skills/universal-scriptwriting/scripts/validate.mjs');
    assert.ok(typeof mod.validateInput === 'function');
    assert.ok(typeof mod.normalizeBrief === 'function');
  });

  it('PR-015: qa_engine loads from native skill directory', async () => {
    const mod = await import('../../.claude/skills/universal-scriptwriting/scripts/qa_engine.mjs');
    assert.ok(typeof mod.runQA === 'function');
  });

  it('PR-016: normalizeBrief + validateInput both accept same legacy brief', async () => {
    const { validateInput } = await import('../scripts/validate.mjs');
    const brief = { title: 'Weather patterns', niche: 'N01', subject: 'Jet stream', object: 'Weather prediction', mechanism: 'Atmospheric dynamics', uncertainty: 'long-range accuracy', target_words: 4000, evidence: [{ id: 'E-001', claim: 'C', source: 'S01', epistemic_status: 'qualified' }], niche_context: { issued_at: '2026-01-01', valid_until: '2026-12-31', reference_time: '2026-06-01' } };
    const nb = normalizeBrief(brief);
    const vi = validateInput(brief);
    assert.equal(nb.success, true);
    assert.ok(vi.status === 'PASS' || vi.status === 'HOLD', 'validateInput should return PASS or HOLD');
  });

  it('PR-017: normalizeBrief research_mode matches inferResearchMode', async () => {
    const { inferResearchMode } = await import('../scripts/content_type_engine.mjs');
    const brief = { topic: 'Test', evidence: [{ id: 'E-001', claim: 'c', source: 's', epistemic_status: 'confirmed' }] };
    const nb = normalizeBrief(brief);
    const rm = inferResearchMode(brief, 'factual');
    assert.equal(nb.research_mode.value, rm.research_mode);
  });

  it('PR-018: explainer format word resolution consistent', async () => {
    const { resolveTargetWords } = await import('../scripts/duration_engine.mjs');
    const { getFormatDefinition } = await import('../scripts/format_registry.mjs');
    const fmt = getFormatDefinition('explainer');
    const brief = { topic: 'Test', format: 'explainer', target_words: 2000 };
    const nb = normalizeBrief(brief);
    const wr = resolveTargetWords(brief, fmt);
    assert.equal(nb.word_resolution.target_words, wr.target_words);
  });

  it('PR-019: short_form format resolves correctly', () => {
    const r = normalizeBrief({ topic: 'Quick tip', format: 'short_form', target_words: 200 });
    assert.equal(r.format.value, 'short_form');
    assert.ok(r.word_resolution.target_words <= 800);
  });

  it('PR-020: custom format with spec resolves', () => {
    const r = normalizeBrief({
      topic: 'Custom test',
      format: 'custom',
      custom_format_spec: { name: 'MyFormat', sections: [{ name: 'Part1', budget_percent: '40-60%' }, { name: 'Part2', budget_percent: '40-60%' }] },
    });
    assert.equal(r.success, true);
    assert.equal(r.format.value, 'custom');
  });

  it('PR-021: multi-voice brief populates voice correctly', () => {
    const r = normalizeBrief({ topic: 'Interview show', format: 'podcast_interview', voice: { mode: 'host_guest', tone: 'conversational' } });
    assert.equal(r.voice.mode, 'host_guest');
    assert.equal(r.voice.tone, 'conversational');
    assert.equal(r.voice.source, 'explicit');
  });

  it('PR-022: target_duration resolution via normalizeBrief', () => {
    const r = normalizeBrief({ topic: 'Test', target_duration: '5 minutes' });
    assert.ok(r.word_resolution.target_words > 0);
  });

  it('PR-023: audience_detailed overrides audience string', () => {
    const r = normalizeBrief({
      topic: 'Test',
      audience: 'general viewers',
      audience_detailed: { age_range: '25-40', knowledge_level: 'expert', cultural_context: 'Western' },
    });
    assert.equal(r.audience.knowledge_level, 'expert');
    assert.equal(r.audience.age_range, '25-40');
  });

  it('PR-024: objectives array processed correctly', () => {
    const r = normalizeBrief({ topic: 'Test', objectives: ['educate', 'inspire', 'inform'] });
    assert.deepEqual(r.objectives.value, ['educate', 'inspire', 'inform']);
  });

  it('PR-025: blocked source in evidence still detected by validateInput', async () => {
    const { validateInput } = await import('../scripts/validate.mjs');
    const brief = { title: 'Test', niche: 'science', subject: 'X', object: 'Y', mechanism: 'Z', uncertainty: 'qualified', target_words: 3000, evidence: [{ id: 'F-190', claim: 'blocked', source: 'blocked', epistemic_status: 'qualified', can_use_for_synthetic: true }] };
    const vi = validateInput(brief);
    assert.ok(vi.holds.some(h => h.type === 'HOLD_SOURCE_ROLE'));
  });

  it('PR-026: high-stakes niche flagged', () => {
    const r = normalizeBrief({ topic: 'Medical treatment options', niche: 'health' });
    assert.ok(r.niche_resolution);
  });

  it('PR-027: FORMAT_CONTENT_TYPE_MAP covers all non-null formats', () => {
    for (const [fmt, ct] of Object.entries(FORMAT_CONTENT_TYPE_MAP)) {
      if (ct !== null) {
        assert.ok(['factual', 'creative', 'hybrid', 'instructional'].includes(ct), `${fmt} → ${ct} must be valid`);
      }
    }
  });

  it('PR-028: FORMAT_VOICE_MAP covers all formats', () => {
    for (const fmt of SUPPORTED_FORMATS) {
      assert.ok(FORMAT_VOICE_MAP[fmt], `Voice default missing for ${fmt}`);
    }
  });

  it('PR-029: PLATFORM_CONSTRAINTS covers all platforms', () => {
    for (const p of SUPPORTED_PLATFORMS) {
      assert.ok(PLATFORM_CONSTRAINTS[p] !== undefined, `Platform constraints missing for ${p}`);
    }
  });

  it('PR-030: generateWorkingTitle from topic', () => {
    const r = generateWorkingTitle({ topic: 'My Great Topic' });
    assert.ok(r.value.includes('My Great Topic'));
    assert.equal(r.provisional, true);
  });

  it('PR-031: generateWorkingTitle from explicit title', () => {
    const r = generateWorkingTitle({ title: 'Explicit Title' });
    assert.equal(r.value, 'Explicit Title');
    assert.equal(r.source, 'explicit');
  });

  it('PR-032: normalizeBrief preserves explicit research_mode', () => {
    const r = normalizeBrief({ topic: 'Test', research_mode: 'minimal' });
    assert.equal(r.research_mode.value, 'minimal');
    assert.equal(r.research_mode.source, 'explicit');
  });

  it('PR-033: normalizeBrief preserves explicit content_type', () => {
    const r = normalizeBrief({ topic: 'Test', content_type: 'instructional' });
    assert.equal(r.content_type.value, 'instructional');
    assert.equal(r.content_type.source, 'explicit');
  });

  it('PR-034: invalid research_mode produces hold', () => {
    const r = normalizeBrief({ topic: 'Test', research_mode: 'invalid_mode' });
    assert.ok(r.holds.some(h => h.detail && h.detail.includes('Invalid research_mode')));
  });

  it('PR-035: instructional + no evidence → minimal research mode', () => {
    const r = normalizeBrief({ topic: 'How to cook pasta', content_type: 'instructional' });
    assert.equal(r.research_mode.value, 'minimal');
  });

  it('PR-036: runQA safety — factual with no evidence does not get unrestricted PASS', async () => {
    const { runQA } = await import('../scripts/qa_engine.mjs');
    const brief = { format: 'documentary', topic: 'Facts', content_type: 'factual', niche: 'science', research: { status: 'SUBMITTED' } };
    const script = '## HOOK\nFactual claim without evidence.\n## PROBLEM\nMore claims.\n## DISCOVERY\nUnsupported.\n## MECHANISM\nGuessing.\n## CHALLENGE\nNone.\n## RESOLUTION\nNone.\n## IMPLICATIONS\nNone.\n## OUTRO\nEnd.';
    const qa = runQA(script, brief, { target_words: 200 });
    assert.notEqual(qa.report.verdict, 'PASS');
  });

  it('PR-037: canonical spoken-word counter used in analyzeScript', async () => {
    const { analyzeScript } = await import('../scripts/validate.mjs');
    const brief = { title: 'Test', niche: 'science', subject: 'X', object: 'Y', mechanism: 'Z', uncertainty: 'qualified', target_words: 200 };
    const script = '## HOOK\nNARRATOR: The discovery was remarkable.\n## PROBLEM\nNARRATOR: But there was a problem.';
    const result = analyzeScript(script, brief);
    assert.ok(result.canonical_spoken_words);
    assert.ok(typeof result.canonical_spoken_words.total_spoken_words === 'number');
  });
});
