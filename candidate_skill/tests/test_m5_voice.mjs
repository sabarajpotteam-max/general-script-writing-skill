// test_m5_voice.mjs — M5 Multi-Voice Output Engine regression tests
// Status: RESEARCH_ONLY — not approved for production

import { strict as assert } from 'node:assert';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  VOICE_MODES,
  VOICE_MODE_SET,
  resolveVoiceMode,
  validateSpeakerLabels,
  checkBrandVoiceCompliance,
  countSpokenWordsMultiVoice,
} from '../scripts/voice_engine.mjs';

import {
  validateInput,
  analyzeScript,
  RESEARCH_STATES,
  CONTENT_TYPES,
  resolveTargetWords,
} from '../scripts/validate.mjs';

import {
  loadStructure,
  getWritingPlan,
} from '../scripts/structure_loader.mjs';

import { getFormatDefinition } from '../scripts/format_registry.mjs';

let passed = 0;
let failed = 0;
const failures = [];

function test(id, description, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS ${id}: ${description}`);
  } catch (e) {
    failed++;
    failures.push({ id, description, error: e.message });
    console.log(`  FAIL ${id}: ${description}`);
    console.log(`        ${e.message}`);
  }
}

// ========================================================================
// TEST 1: Legacy NARRATOR compatibility
// ========================================================================
console.log('\n=== TEST 1: Legacy NARRATOR compatibility ===');

test('M5-001', 'Documentary defaults to single_narrator', () => {
  const brief = {
    title: 'Legacy Test', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified', target_words: 3000,
  };
  const r = validateInput(brief);
  assert.ok(r.voice_resolution, 'voice_resolution must be present');
  assert.equal(r.voice_resolution.mode, 'single_narrator');
  assert.deepEqual(r.voice_resolution.labels, ['NARRATOR']);
  assert.equal(r.voice_resolution.source, 'format_default');
});

test('M5-002', 'loadStructure includes voice in output', () => {
  const r = loadStructure({ format: 'documentary', target_words: 3000 });
  assert.equal(r.success, true);
  assert.ok(r.structure.voice, 'voice must be in structure');
  assert.equal(r.structure.voice.mode, 'single_narrator');
  assert.deepEqual(r.structure.voice.labels, ['NARRATOR']);
});

test('M5-003', 'NARRATOR label validated in script QA', () => {
  const script = `## HOOK\nNARRATOR: This is the hook section of the documentary.\n## PROBLEM\nNARRATOR: Here is the problem we explore.`;
  const input = { target_words: 100 };
  const r = analyzeScript(script, input);
  assert.ok(r.voice_qa, 'voice_qa must be present');
  assert.equal(r.voice_qa.voice_mode, 'single_narrator');
  assert.ok(r.voice_qa.speaker_validation);
  assert.equal(r.voice_qa.speaker_validation.all_labels_valid, true);
});

// ========================================================================
// TEST 2: Host-guest script
// ========================================================================
console.log('\n=== TEST 2: Host-guest script ===');

test('M5-004', 'host_guest resolves HOST and GUEST labels', () => {
  const brief = { voice: { mode: 'host_guest' } };
  const r = resolveVoiceMode(brief, null);
  assert.equal(r.mode, 'host_guest');
  assert.deepEqual(r.labels, ['HOST', 'GUEST']);
  assert.equal(r.speaker_roster.length, 2);
  assert.equal(r.source, 'explicit');
});

test('M5-005', 'host_guest with GUEST_2', () => {
  const brief = { voice: { mode: 'host_guest', guest_2: true } };
  const r = resolveVoiceMode(brief, null);
  assert.deepEqual(r.labels, ['HOST', 'GUEST', 'GUEST_2']);
  assert.equal(r.speaker_roster.length, 3);
});

test('M5-006', 'host_guest transitions computed', () => {
  const brief = { voice: { mode: 'host_guest' } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.transitions.length > 0);
  assert.ok(r.transitions.includes('HOST → GUEST'));
  assert.ok(r.transitions.includes('GUEST → HOST'));
});

// ========================================================================
// TEST 3: Multi-character dialogue
// ========================================================================
console.log('\n=== TEST 3: Multi-character dialogue ===');

test('M5-007', 'multi_character builds labels from characters', () => {
  const brief = {
    voice: { mode: 'multi_character' },
    characters: [
      { name: 'Alice', role: 'protagonist' },
      { name: 'Bob', role: 'antagonist' },
      { name: 'Dr Smith', role: 'supporting' },
    ],
  };
  const r = resolveVoiceMode(brief, null);
  assert.equal(r.mode, 'multi_character');
  assert.deepEqual(r.labels, ['ALICE', 'BOB', 'DR_SMITH']);
  assert.equal(r.speaker_roster.length, 3);
  assert.equal(r.speaker_roster[2].label, 'DR_SMITH');
  assert.equal(r.speaker_roster[2].name, 'Dr Smith');
});

test('M5-008', 'multi_character fails with < 2 characters', () => {
  const brief = {
    voice: { mode: 'multi_character' },
    characters: [{ name: 'Solo' }],
  };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.error);
  assert.ok(r.error.includes('at least 2 characters'));
});

// ========================================================================
// TEST 4: Interview labels
// ========================================================================
console.log('\n=== TEST 4: Interview labels ===');

test('M5-009', 'interview mode resolves INTERVIEWER and INTERVIEWEE', () => {
  const brief = { voice: { mode: 'interview' } };
  const r = resolveVoiceMode(brief, null);
  assert.equal(r.mode, 'interview');
  assert.deepEqual(r.labels, ['INTERVIEWER', 'INTERVIEWEE']);
  assert.equal(r.speaker_roster.length, 2);
});

test('M5-010', 'interview script validation detects labels', () => {
  const script = `INTERVIEWER: What happened next?\nINTERVIEWEE: We discovered the root cause.`;
  const voiceRes = resolveVoiceMode({ voice: { mode: 'interview' } }, null);
  const v = validateSpeakerLabels(script, voiceRes);
  assert.equal(v.all_labels_valid, true);
  assert.equal(v.all_required_present, true);
  assert.ok(v.label_counts['INTERVIEWER'] > 0);
  assert.ok(v.label_counts['INTERVIEWEE'] > 0);
});

// ========================================================================
// TEST 5: Brand voice restrictions
// ========================================================================
console.log('\n=== TEST 5: Brand voice restrictions ===');

test('M5-011', 'brand_voice requires guidelines', () => {
  const brief = { voice: { mode: 'brand_voice' } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.error);
  assert.ok(r.error.includes('brand_voice.guidelines'));
});

test('M5-012', 'brand_voice resolves with guidelines', () => {
  const brief = {
    voice: { mode: 'brand_voice' },
    brand_voice: {
      guidelines: 'Warm and professional',
      keywords_include: ['innovation', 'teamwork'],
      keywords_exclude: ['cheap', 'discount'],
    },
  };
  const r = resolveVoiceMode(brief, null);
  assert.ok(!r.error);
  assert.equal(r.mode, 'brand_voice');
  assert.ok(r.brand_voice);
  assert.equal(r.brand_voice.guidelines, 'Warm and professional');
  assert.deepEqual(r.brand_voice.keywords_include, ['innovation', 'teamwork']);
  assert.deepEqual(r.brand_voice.keywords_exclude, ['cheap', 'discount']);
  assert.ok(r.constraints.length > 0);
});

test('M5-013', 'brand compliance detects excluded keyword', () => {
  const bv = { guidelines: 'Test', keywords_include: [], keywords_exclude: ['cheap'] };
  const result = checkBrandVoiceCompliance('This is a cheap product', bv);
  assert.equal(result.compliant, false);
  assert.equal(result.violations.length, 1);
  assert.equal(result.violations[0].type, 'excluded_keyword');
});

test('M5-014', 'brand compliance detects missing required keyword', () => {
  const bv = { guidelines: 'Test', keywords_include: ['innovation'], keywords_exclude: [] };
  const result = checkBrandVoiceCompliance('This is a great product', bv);
  assert.equal(result.compliant, false);
  assert.ok(result.violations.some(v => v.type === 'missing_required_keywords'));
});

test('M5-015', 'brand compliance passes when all criteria met', () => {
  const bv = { guidelines: 'Test', keywords_include: ['innovation'], keywords_exclude: ['cheap'] };
  const result = checkBrandVoiceCompliance('Our innovation drives growth', bv);
  assert.equal(result.compliant, true);
  assert.equal(result.violations.length, 0);
});

// ========================================================================
// TEST 6: Unknown voice mode
// ========================================================================
console.log('\n=== TEST 6: Unknown voice mode ===');

test('M5-016', 'Unknown voice mode produces error', () => {
  const brief = { voice: { mode: 'telepathy' } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.error);
  assert.ok(r.error.includes('telepathy'));
  assert.ok(r.error.includes('must be one of'));
});

test('M5-017', 'Unknown voice mode produces HOLD in validateInput', () => {
  const brief = {
    title: 'Unknown Voice', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified', target_words: 3000,
    voice: { mode: 'telepathy' },
  };
  const r = validateInput(brief);
  assert.ok(r.holds.some(h => h.detail.includes('telepathy')));
  assert.equal(r.voice_resolution, null);
});

// ========================================================================
// TEST 7: Invalid speaker roster
// ========================================================================
console.log('\n=== TEST 7: Invalid speaker roster ===');

test('M5-018', 'multi_character with no characters array', () => {
  const brief = { voice: { mode: 'multi_character' } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.error);
  assert.ok(r.error.includes('at least 2'));
});

test('M5-019', 'multi_character with empty characters', () => {
  const brief = { voice: { mode: 'multi_character' }, characters: [] };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.error);
});

// ========================================================================
// TEST 8: Missing speaker label
// ========================================================================
console.log('\n=== TEST 8: Missing speaker label ===');

test('M5-020', 'Missing GUEST in host_guest script detected', () => {
  const script = `HOST: Welcome to the show.\nHOST: Let me tell you about today.`;
  const voiceRes = resolveVoiceMode({ voice: { mode: 'host_guest' } }, null);
  const v = validateSpeakerLabels(script, voiceRes);
  assert.equal(v.all_required_present, false);
  assert.ok(v.findings.some(f => f.type === 'missing_speaker' && f.label === 'GUEST'));
});

// ========================================================================
// TEST 9: Unrecognized speaker label
// ========================================================================
console.log('\n=== TEST 9: Unrecognized speaker label ===');

test('M5-021', 'Unrecognized speaker in script flagged', () => {
  const script = `HOST: Welcome.\nGUEST: Thanks.\nRANDOM_PERSON: Who am I?`;
  const voiceRes = resolveVoiceMode({ voice: { mode: 'host_guest' } }, null);
  const v = validateSpeakerLabels(script, voiceRes);
  assert.equal(v.all_labels_valid, false);
  assert.ok(v.findings.some(f => f.type === 'unrecognized_speaker' && f.label === 'RANDOM_PERSON'));
});

// ========================================================================
// TEST 10: Voice consistency checks
// ========================================================================
console.log('\n=== TEST 10: Voice consistency checks ===');

test('M5-022', 'Unlabeled dialogue in multi-voice detected', () => {
  const script = `HOST: Welcome to the show.\nThis line has no speaker label and is long enough to detect.\nGUEST: Thanks for having me.`;
  const voiceRes = resolveVoiceMode({ voice: { mode: 'host_guest' } }, null);
  const v = validateSpeakerLabels(script, voiceRes);
  assert.ok(v.findings.some(f => f.type === 'unlabeled_dialogue'));
});

test('M5-023', 'Single narrator allows unlabeled lines', () => {
  const script = `NARRATOR: Welcome.\nThis is just narration without a label.`;
  const voiceRes = resolveVoiceMode({}, null);
  const v = validateSpeakerLabels(script, voiceRes);
  assert.ok(!v.findings.some(f => f.type === 'unlabeled_dialogue'),
    'single_narrator should not flag unlabeled lines');
});

test('M5-024', 'Tone validation warns on unknown tone', () => {
  const brief = { voice: { tone: 'mystical' } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.warnings.some(w => w.includes('mystical')));
  assert.equal(r.tone, null);
});

test('M5-025', 'Formality validation warns on out of range', () => {
  const brief = { voice: { formality: 7 } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.warnings.some(w => w.includes('Formality')));
  assert.equal(r.formality, null);
});

test('M5-026', 'humor_level validation warns on out of range', () => {
  const brief = { voice: { humor_level: 5 } };
  const r = resolveVoiceMode(brief, null);
  assert.ok(r.warnings.some(w => w.includes('humor_level')));
  assert.equal(r.humor_level, 0);
});

// ========================================================================
// TEST 11: Multi-voice spoken-word counts
// ========================================================================
console.log('\n=== TEST 11: Multi-voice word counts ===');

test('M5-027', 'countSpokenWordsMultiVoice counts per speaker', () => {
  const script = `HOST: Hello and welcome to the show today.\nGUEST: Thank you for having me here.\n[SCENE: Studio lights dim]`;
  const voiceRes = resolveVoiceMode({ voice: { mode: 'host_guest' } }, null);
  const wc = countSpokenWordsMultiVoice(script, voiceRes);
  assert.equal(wc.speaker_words['HOST'], 7);
  assert.equal(wc.speaker_words['GUEST'], 6);
  assert.equal(wc.total_spoken_words, 13);
});

test('M5-028', 'Scene directions excluded from word count', () => {
  const script = `[SCENE: Wide shot of city]\nNARRATOR: The city never sleeps.\n[B-ROLL: Traffic timelapse]`;
  const voiceRes = resolveVoiceMode({}, null);
  const wc = countSpokenWordsMultiVoice(script, voiceRes);
  assert.equal(wc.speaker_words['NARRATOR'], 4);
});

test('M5-029', 'analyzeScript includes voice_qa with distribution', () => {
  const script = `## HOOK\nNARRATOR: This is a hook for testing purposes.\n## PROBLEM\nNARRATOR: This is the problem section of the documentary.`;
  const input = { target_words: 100 };
  const r = analyzeScript(script, input);
  assert.ok(r.voice_qa.spoken_word_distribution);
  assert.ok(r.voice_qa.spoken_word_distribution.total_spoken_words > 0);
});

// ========================================================================
// TEST 12: Duration-aware QA (M4 Correction A)
// ========================================================================
console.log('\n=== TEST 12: Duration-aware QA ===');

test('M5-030', 'analyzeScript uses resolved target from duration', () => {
  const script = `## HOOK\nNARRATOR: ${Array(75).fill('word').join(' ')}\n## BODY\nNARRATOR: ${Array(75).fill('word').join(' ')}`;
  const input = { target_duration: '1 minutes', format: 'short_form' };
  const r = analyzeScript(script, input);
  assert.equal(r.target_words, 150, 'Should use duration-resolved target (1 min × 150 WPM = 150)');
});

test('M5-031', 'analyzeScript with target_duration only does not fall back to 3000', () => {
  const script = `## HOOK\nNARRATOR: A few test words here.`;
  const input = { target_duration: '30 seconds' };
  const r = analyzeScript(script, input);
  assert.equal(r.target_words, 75, 'Should resolve 30 sec at 150 WPM = 75, not fall back to 3000');
});

// ========================================================================
// TEST 13: Platform hard-limit checks
// ========================================================================
console.log('\n=== TEST 13: Platform hard-limit checks ===');

test('M5-032', 'youtube_shorts with > 3 min produces HOLD', () => {
  const brief = {
    title: 'Too Long Short', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified',
    platform: 'youtube_shorts', target_words: 1000,
  };
  const r = validateInput(brief);
  assert.ok(r.holds.some(h => h.detail.includes('YouTube Shorts') && h.detail.includes('180 seconds')),
    'Must produce HOLD for youtube_shorts exceeding 3 min');
});

test('M5-033', 'youtube_shorts with <= 3 min no HOLD', () => {
  const brief = {
    title: 'OK Short', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified',
    platform: 'youtube_shorts', target_words: 100,
  };
  const r = validateInput(brief);
  assert.ok(!r.holds.some(h => h.detail.includes('YouTube Shorts')),
    'Should not HOLD for youtube_shorts within 3 min');
});

test('M5-034', 'youtube_shorts with target_duration > 180s produces HOLD', () => {
  const brief = {
    title: 'Duration Short', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified',
    platform: 'youtube_shorts', target_duration: '5 minutes',
  };
  const r = validateInput(brief);
  assert.ok(r.holds.some(h => h.detail.includes('YouTube Shorts')));
});

// ========================================================================
// TEST 14: Format/voice compatibility
// ========================================================================
console.log('\n=== TEST 14: Format/voice compatibility ===');

test('M5-035', 'Explainer defaults to single_narrator (from voice_default)', () => {
  const r = resolveVoiceMode({}, getFormatDefinition('explainer'));
  assert.equal(r.mode, 'single_narrator');
});

test('M5-036', 'Writing plan includes voice instructions', () => {
  const r = getWritingPlan({ format: 'documentary', target_words: 3000 });
  assert.equal(r.success, true);
  assert.ok(r.plan.writing_instructions.includes('Voice mode: single_narrator'));
  assert.ok(r.plan.writing_instructions.includes('Speaker labels: NARRATOR'));
});

test('M5-037', 'Host-guest voice in writing plan', () => {
  const r = getWritingPlan({ format: 'explainer', target_words: 1500, voice: { mode: 'host_guest', tone: 'conversational' } });
  assert.equal(r.success, true);
  assert.ok(r.plan.writing_instructions.includes('Voice mode: host_guest'));
  assert.ok(r.plan.writing_instructions.includes('HOST'));
  assert.ok(r.plan.writing_instructions.includes('GUEST'));
  assert.ok(r.plan.writing_instructions.includes('Tone: conversational'));
});

// ========================================================================
// TEST 15: Original input immutability
// ========================================================================
console.log('\n=== TEST 15: Input immutability ===');

test('M5-038', 'validateInput does not mutate original brief (voice fields)', () => {
  const brief = {
    niche: 'science', topic: 'Voice Test',
    voice: { mode: 'host_guest', tone: 'conversational' },
  };
  const orig = JSON.parse(JSON.stringify(brief));
  validateInput(brief);
  assert.deepEqual(brief, orig, 'Original must not be mutated');
});

// ========================================================================
// TEST 16: M3 factual trust gate preservation
// ========================================================================
console.log('\n=== TEST 16: M3 safety gate intact ===');

test('M5-039', 'SUBMITTED still blocks factual generation after M5', () => {
  const brief = {
    title: 'M3 Safety', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified',
    evidence: [{ id: 'E-1', author: 'Dr. Test', publisher: 'Journal', can_use_for_synthetic: true }],
    target_words: 3000,
    voice: { mode: 'host_guest' },
  };
  const r = validateInput(brief);
  assert.equal(r.m3_resolution.research_state, RESEARCH_STATES.SUBMITTED);
  assert.equal(r.m3_resolution.generation_permitted, false,
    'SUBMITTED must still block factual generation after M5');
});

test('M5-040', 'Creative content with voice still works', () => {
  const brief = {
    title: 'Creative Voice', niche: 'domain:entertainment',
    subject: 'wizard', object: 'dragon', mechanism: 'magic',
    uncertainty: 'qualified', content_type: 'creative', target_words: 500,
    voice: { mode: 'multi_character' },
    characters: [
      { name: 'Wizard', role: 'protagonist' },
      { name: 'Dragon', role: 'antagonist' },
    ],
  };
  const r = validateInput(brief);
  assert.equal(r.m3_resolution.generation_permitted, true);
  assert.ok(r.voice_resolution);
  assert.equal(r.voice_resolution.mode, 'multi_character');
});

test('M5-041', 'production_release_permitted still false', () => {
  const brief = {
    title: 'Prod Gate', niche: 'science', subject: 'X', object: 'Y',
    mechanism: 'Z', uncertainty: 'qualified', target_words: 3000,
  };
  const r = validateInput(brief);
  assert.equal(r.m3_resolution.generation_readiness.production_release_permitted, false);
});

// ========================================================================
// TEST 17: Native/candidate synchronization
// ========================================================================
console.log('\n=== TEST 17: Sync verification ===');

test('M5-042', 'Voice engine exports are complete', () => {
  assert.ok(VOICE_MODES);
  assert.ok(VOICE_MODE_SET);
  assert.equal(typeof resolveVoiceMode, 'function');
  assert.equal(typeof validateSpeakerLabels, 'function');
  assert.equal(typeof checkBrandVoiceCompliance, 'function');
  assert.equal(typeof countSpokenWordsMultiVoice, 'function');
});

test('M5-043', 'All five voice modes are frozen', () => {
  assert.ok(Object.isFrozen(VOICE_MODES));
  assert.ok(Object.isFrozen(VOICE_MODES.single_narrator));
  assert.ok(Object.isFrozen(VOICE_MODES.host_guest));
  assert.ok(Object.isFrozen(VOICE_MODES.multi_character));
  assert.ok(Object.isFrozen(VOICE_MODES.interview));
  assert.ok(Object.isFrozen(VOICE_MODES.brand_voice));
});

test('M5-044', 'Voice re-exported through validate.mjs', async () => {
  const v = await import('../scripts/validate.mjs');
  assert.ok(v.VOICE_MODES);
  assert.ok(v.resolveVoiceMode);
  assert.ok(v.validateSpeakerLabels);
  assert.ok(v.checkBrandVoiceCompliance);
  assert.ok(v.countSpokenWordsMultiVoice);
});

// ========================================================================
// 5 SYNTHETIC DEMONSTRATIONS
// ========================================================================
console.log('\n=== Synthetic Demonstrations ===');

const demos = [];

// Demo 1: Documentary single_narrator
test('M5-DEMO-1', 'Demo: Documentary single_narrator', () => {
  const brief = { format: 'documentary', target_words: 3000 };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  assert.ok(r.structure.voice);
  const demo = {
    description: 'Documentary single narrator',
    format: r.structure.format_name,
    voice_mode: r.structure.voice.mode,
    labels: r.structure.voice.labels,
    target_words: r.structure.target_words,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
    writing_instructions_includes_voice: getWritingPlan(brief).plan.writing_instructions.includes('Voice mode'),
  };
  assert.equal(demo.voice_mode, 'single_narrator');
  assert.deepEqual(demo.labels, ['NARRATOR']);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 2: Podcast host_guest
test('M5-DEMO-2', 'Demo: Podcast host_guest', () => {
  const brief = {
    format: 'explainer', target_words: 1700,
    voice: { mode: 'host_guest', tone: 'conversational' },
  };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: 'Podcast-style host and guest explainer',
    format: r.structure.format_name,
    voice_mode: r.structure.voice.mode,
    labels: r.structure.voice.labels,
    tone: r.structure.voice.tone,
    transitions: r.structure.voice.transitions,
    target_words: r.structure.target_words,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
  };
  assert.equal(demo.voice_mode, 'host_guest');
  assert.deepEqual(demo.labels, ['HOST', 'GUEST']);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 3: Multi-character fiction
test('M5-DEMO-3', 'Demo: Multi-character fiction', () => {
  const brief = {
    format: 'custom', target_words: 2000,
    voice: { mode: 'multi_character', tone: 'dramatic' },
    characters: [
      { name: 'Detective Chen', role: 'protagonist', voice_characteristics: 'sharp, analytical' },
      { name: 'Mayor Williams', role: 'antagonist', voice_characteristics: 'smooth, political' },
      { name: 'Officer Park', role: 'supporting', voice_characteristics: 'nervous, eager' },
    ],
    custom_format_spec: {
      name: 'Crime Drama',
      sections: [
        { name: 'Opening', budget_percent: '15-20%' },
        { name: 'Investigation', budget_percent: '30-40%' },
        { name: 'Confrontation', budget_percent: '25-35%' },
        { name: 'Resolution', budget_percent: '15-20%' },
      ],
    },
    content_type: 'creative',
  };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: 'Multi-character crime drama',
    format: r.structure.format_name,
    voice_mode: r.structure.voice.mode,
    labels: r.structure.voice.labels,
    tone: r.structure.voice.tone,
    roster: r.structure.voice.speaker_roster.map(s => `${s.label} (${s.name}, ${s.role})`),
    transitions_count: r.structure.voice.transitions.length,
    target_words: r.structure.target_words,
    sections: r.structure.sections.map(s => `${s.label}: ${s.target_words} words`),
  };
  assert.equal(demo.voice_mode, 'multi_character');
  assert.equal(demo.labels.length, 3);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 4: Interview format
test('M5-DEMO-4', 'Demo: Interview format', () => {
  const brief = {
    format: 'explainer', target_words: 1500,
    voice: { mode: 'interview', tone: 'formal', formality: 4 },
  };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: 'Formal interview',
    format: r.structure.format_name,
    voice_mode: r.structure.voice.mode,
    labels: r.structure.voice.labels,
    tone: r.structure.voice.tone,
    formality: r.structure.voice.formality,
    target_words: r.structure.target_words,
  };
  assert.equal(demo.voice_mode, 'interview');
  assert.deepEqual(demo.labels, ['INTERVIEWER', 'INTERVIEWEE']);
  assert.equal(demo.formality, 4);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// Demo 5: Brand voice corporate
test('M5-DEMO-5', 'Demo: Brand voice corporate', () => {
  const brief = {
    format: 'short_form', target_words: 200,
    voice: { mode: 'brand_voice', tone: 'conversational', formality: 3 },
    brand_voice: {
      guidelines: 'Warm, knowledgeable, slightly irreverent. Like a smart friend.',
      keywords_include: ['innovation', 'sustainability'],
      keywords_exclude: ['cheap', 'discount', 'buy now'],
    },
  };
  const r = loadStructure(brief);
  assert.equal(r.success, true);
  const demo = {
    description: 'Brand voice corporate short-form',
    format: r.structure.format_name,
    voice_mode: r.structure.voice.mode,
    labels: r.structure.voice.labels,
    brand_guidelines: r.structure.voice.brand_voice.guidelines,
    keywords_include: r.structure.voice.brand_voice.keywords_include,
    keywords_exclude: r.structure.voice.brand_voice.keywords_exclude,
    constraints: r.structure.voice.constraints,
    target_words: r.structure.target_words,
  };
  assert.equal(demo.voice_mode, 'brand_voice');
  assert.ok(demo.constraints.length >= 3);
  demos.push(demo);
  console.log(`        ${JSON.stringify(demo, null, 2)}`);
});

// ========================================================================
// SUMMARY
// ========================================================================
console.log('\n' + '='.repeat(60));
console.log(`  Total: ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\n  Failures:');
  for (const f of failures) {
    console.log(`    ${f.id}: ${f.description}`);
    console.log(`      ${f.error}`);
  }
}
console.log('='.repeat(60));

const __dirname = dirname(fileURLToPath(import.meta.url));
const receipt = {
  suite: 'M5 Multi-Voice Output Engine',
  timestamp: new Date().toISOString(),
  total: passed + failed,
  passed,
  failed,
  failures,
  demonstrations: demos,
};
const receiptPath = join(__dirname, 'M5_VOICE_RECEIPT.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
console.log(`\nReceipt: ${receiptPath}`);

process.exit(failed > 0 ? 1 : 0);
