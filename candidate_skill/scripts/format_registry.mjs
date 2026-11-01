// format_registry.mjs — M2 Format Router: modular format definitions
// Status: RESEARCH_ONLY — not approved for production

const FORMAT_STATUS = Object.freeze({
  VALIDATED: 'VALIDATED',
  DESIGN_TARGET: 'DESIGN_TARGET',
});

const EVIDENCE_REQUIREMENT = Object.freeze({
  MANDATORY: 'mandatory',
  PREFERRED: 'preferred',
  CONTEXTUAL: 'contextual',
  OPTIONAL: 'optional',
});

const DOCUMENTARY_FORMAT = Object.freeze({
  id: 'documentary',
  name: 'Documentary',
  status: FORMAT_STATUS.VALIDATED,
  content_type_default: 'factual',
  evidence_requirement: EVIDENCE_REQUIREMENT.MANDATORY,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 2500, max: 8000 }),
  duration_range: Object.freeze({ min_minutes: 5, max_minutes: 45 }),
  spoken_word_budget_tolerance: 0.05,
  arc: Object.freeze({
    id: 'investigation_arc',
    name: 'Investigation Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'hook',         label: 'Hook',              min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'problem',      label: 'Problem',           min_pct: 12, max_pct: 15 }),
      Object.freeze({ id: 'discovery',    label: 'Discovery',         min_pct: 16, max_pct: 20 }),
      Object.freeze({ id: 'mechanism',    label: 'Mechanism',         min_pct: 12, max_pct: 15 }),
      Object.freeze({ id: 'challenge',    label: 'Challenge',         min_pct: 12, max_pct: 15 }),
      Object.freeze({ id: 'resolution',   label: 'Resolution',        min_pct: 14, max_pct: 18 }),
      Object.freeze({ id: 'implications', label: 'Implications',      min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'outro',        label: 'Outro',             min_pct: 5,  max_pct: 8  }),
    ]),
  }),
  qa_checks: Object.freeze([
    '8 sections present in correct order',
    'Evidence citations [E-XXX] present in discovery + mechanism sections',
    'NARRATOR: labels used',
    'Spoken narration word count within ±5% of target',
  ]),
  platforms: Object.freeze(['youtube', 'broadcast_tv', 'streaming', 'generic']),
});

const EXPLAINER_FORMAT = Object.freeze({
  id: 'explainer',
  name: 'Explainer',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'factual',
  evidence_requirement: EVIDENCE_REQUIREMENT.PREFERRED,
  voice_default: 'conversational',
  word_range: Object.freeze({ min: 500, max: 10000 }),
  duration_range: Object.freeze({ min_minutes: 2, max_minutes: 30 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'concept_progression_arc',
    name: 'Concept Progression Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'hook',        label: 'Hook',           min_pct: 10, max_pct: 15 }),
      Object.freeze({ id: 'foundation',  label: 'Foundation',     min_pct: 15, max_pct: 20 }),
      Object.freeze({ id: 'build',       label: 'Build',          min_pct: 20, max_pct: 25 }),
      Object.freeze({ id: 'example',     label: 'Example',        min_pct: 15, max_pct: 20 }),
      Object.freeze({ id: 'nuance',      label: 'Nuance',         min_pct: 10, max_pct: 15 }),
      Object.freeze({ id: 'synthesis',   label: 'Synthesis',      min_pct: 10, max_pct: 15 }),
      Object.freeze({ id: 'next_steps',  label: 'Next Steps',     min_pct: 5,  max_pct: 10 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '7 sections present in correct order',
    'Evidence citations preferred in foundation + build sections',
    'Concept complexity builds progressively (no premature jargon)',
  ]),
  platforms: Object.freeze(['youtube', 'podcast_app', 'streaming', 'generic']),
});

const SHORT_FORM_FORMAT = Object.freeze({
  id: 'short_form',
  name: 'Short Form',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: null,
  evidence_requirement: EVIDENCE_REQUIREMENT.CONTEXTUAL,
  voice_default: 'direct_address',
  word_range: Object.freeze({ min: 50, max: 800 }),
  duration_range: Object.freeze({ min_minutes: 0.5, max_minutes: 3 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'hook_body_cta',
    name: 'Hook-Body-CTA',
    sections: Object.freeze([
      Object.freeze({ id: 'hook', label: 'Hook', min_pct: 15, max_pct: 25 }),
      Object.freeze({ id: 'body', label: 'Body', min_pct: 50, max_pct: 65 }),
      Object.freeze({ id: 'cta',  label: 'CTA',  min_pct: 15, max_pct: 25 }),
    ]),
  }),
  qa_checks: Object.freeze([
    'Hook within first 15 words (first 3 seconds)',
    'CTA present',
    'Total duration ≤ platform limit',
  ]),
  platforms: Object.freeze(['social_media', 'youtube', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: NARRATIVE FORMAT
// ═══════════════════════════════════════════════════════════════

const NARRATIVE_FORMAT = Object.freeze({
  id: 'narrative',
  name: 'Narrative',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'creative',
  evidence_requirement: EVIDENCE_REQUIREMENT.CONTEXTUAL,
  voice_default: 'multi_character',
  word_range: Object.freeze({ min: 1500, max: 4500 }),
  duration_range: Object.freeze({ min_minutes: 10, max_minutes: 30 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'story_arc',
    name: 'Story Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'hook',           label: 'Hook',           min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'setup',          label: 'Setup',          min_pct: 15, max_pct: 20 }),
      Object.freeze({ id: 'rising_action',  label: 'Rising Action',  min_pct: 25, max_pct: 30 }),
      Object.freeze({ id: 'climax',         label: 'Climax',         min_pct: 18, max_pct: 22 }),
      Object.freeze({ id: 'resolution',     label: 'Resolution',     min_pct: 12, max_pct: 18 }),
      Object.freeze({ id: 'denouement',     label: 'Denouement',     min_pct: 5,  max_pct: 10 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '6 sections present in correct order',
    'Character arcs established in setup and resolved',
    'Climax delivers on rising action tension',
    'Spoken word count within ±10% of target',
  ]),
  platforms: Object.freeze(['youtube', 'podcast_app', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: PODCAST SOLO FORMAT
// ═══════════════════════════════════════════════════════════════

const PODCAST_SOLO_FORMAT = Object.freeze({
  id: 'podcast_solo',
  name: 'Podcast (Solo)',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'hybrid',
  evidence_requirement: EVIDENCE_REQUIREMENT.PREFERRED,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 2500, max: 10000 }),
  duration_range: Object.freeze({ min_minutes: 15, max_minutes: 60 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'solo_monologue_arc',
    name: 'Solo Monologue Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'intro',            label: 'Intro',            min_pct: 5,  max_pct: 10 }),
      Object.freeze({ id: 'topic_setup',      label: 'Topic Setup',      min_pct: 10, max_pct: 15 }),
      Object.freeze({ id: 'main_discussion',  label: 'Main Discussion',  min_pct: 25, max_pct: 35 }),
      Object.freeze({ id: 'deep_dive',        label: 'Deep Dive',        min_pct: 20, max_pct: 30 }),
      Object.freeze({ id: 'takeaways',        label: 'Takeaways',        min_pct: 10, max_pct: 15 }),
      Object.freeze({ id: 'outro',            label: 'Outro',            min_pct: 3,  max_pct: 8  }),
    ]),
  }),
  qa_checks: Object.freeze([
    '6 sections present in correct order',
    'NARRATOR: labels used throughout',
    'Conversational tone maintained',
    'Spoken word count within ±10% of target',
  ]),
  platforms: Object.freeze(['podcast_app', 'youtube', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: PODCAST INTERVIEW FORMAT
// ═══════════════════════════════════════════════════════════════

const PODCAST_INTERVIEW_FORMAT = Object.freeze({
  id: 'podcast_interview',
  name: 'Podcast (Interview)',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'hybrid',
  evidence_requirement: EVIDENCE_REQUIREMENT.PREFERRED,
  voice_default: 'host_guest',
  word_range: Object.freeze({ min: 3400, max: 10000 }),
  duration_range: Object.freeze({ min_minutes: 20, max_minutes: 60 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'interview_arc',
    name: 'Interview Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'intro',       label: 'Intro',       min_pct: 5,  max_pct: 10 }),
      Object.freeze({ id: 'guest_intro', label: 'Guest Intro', min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'discussion',  label: 'Discussion',  min_pct: 25, max_pct: 35 }),
      Object.freeze({ id: 'deep_dive',   label: 'Deep Dive',   min_pct: 20, max_pct: 30 }),
      Object.freeze({ id: 'rapid_fire',  label: 'Rapid Fire',  min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'closing',     label: 'Closing',     min_pct: 5,  max_pct: 10 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '6 sections present in correct order',
    'HOST: and GUEST: labels used',
    'Guest expertise established in guest_intro',
    'Spoken word count within ±10% of target',
  ]),
  platforms: Object.freeze(['podcast_app', 'youtube', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: PODCAST NARRATIVE FORMAT
// ═══════════════════════════════════════════════════════════════

const PODCAST_NARRATIVE_FORMAT = Object.freeze({
  id: 'podcast_narrative',
  name: 'Podcast (Narrative)',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'hybrid',
  evidence_requirement: EVIDENCE_REQUIREMENT.PREFERRED,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 3400, max: 7500 }),
  duration_range: Object.freeze({ min_minutes: 20, max_minutes: 45 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'narrative_podcast_arc',
    name: 'Narrative Podcast Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'cold_open',  label: 'Cold Open',  min_pct: 5,  max_pct: 10 }),
      Object.freeze({ id: 'intro',      label: 'Intro',      min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'act_one',    label: 'Act One',    min_pct: 22, max_pct: 28 }),
      Object.freeze({ id: 'act_two',    label: 'Act Two',    min_pct: 22, max_pct: 28 }),
      Object.freeze({ id: 'act_three',  label: 'Act Three',  min_pct: 18, max_pct: 25 }),
      Object.freeze({ id: 'outro',      label: 'Outro',      min_pct: 3,  max_pct: 8  }),
    ]),
  }),
  qa_checks: Object.freeze([
    '6 sections present in correct order',
    'Cold open hooks the listener before intro',
    'Three-act structure with clear narrative progression',
    'Spoken word count within ±10% of target',
  ]),
  platforms: Object.freeze(['podcast_app', 'youtube', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: SCREENPLAY FORMAT
// ═══════════════════════════════════════════════════════════════

const SCREENPLAY_FORMAT = Object.freeze({
  id: 'screenplay',
  name: 'Screenplay',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'creative',
  evidence_requirement: EVIDENCE_REQUIREMENT.CONTEXTUAL,
  voice_default: 'multi_character',
  word_range: Object.freeze({ min: 750, max: 18000 }),
  duration_range: Object.freeze({ min_minutes: 5, max_minutes: 120 }),
  spoken_word_budget_tolerance: 0.15,
  arc: Object.freeze({
    id: 'screenplay_arc',
    name: 'Screenplay Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'slug_line',   label: 'Slug Line',   min_pct: 2,  max_pct: 5  }),
      Object.freeze({ id: 'action',      label: 'Action',      min_pct: 25, max_pct: 35 }),
      Object.freeze({ id: 'dialogue',    label: 'Dialogue',    min_pct: 40, max_pct: 55 }),
      Object.freeze({ id: 'transition',  label: 'Transition',  min_pct: 2,  max_pct: 5  }),
    ]),
  }),
  qa_checks: Object.freeze([
    'Screenplay formatting (slug lines, action blocks, dialogue blocks)',
    'Character names in CAPS on first appearance',
    'Scene transitions present',
    'Spoken word count within ±15% of target',
  ]),
  platforms: Object.freeze(['broadcast_tv', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: NEWS FORMAT
// ═══════════════════════════════════════════════════════════════

const NEWS_FORMAT = Object.freeze({
  id: 'news',
  name: 'News',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'factual',
  evidence_requirement: EVIDENCE_REQUIREMENT.MANDATORY,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 300, max: 1500 }),
  duration_range: Object.freeze({ min_minutes: 2, max_minutes: 10 }),
  spoken_word_budget_tolerance: 0.08,
  arc: Object.freeze({
    id: 'inverted_pyramid_arc',
    name: 'Inverted Pyramid Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'lead',     label: 'Lead',     min_pct: 15, max_pct: 25 }),
      Object.freeze({ id: 'body',     label: 'Body',     min_pct: 30, max_pct: 40 }),
      Object.freeze({ id: 'context',  label: 'Context',  min_pct: 15, max_pct: 20 }),
      Object.freeze({ id: 'quotes',   label: 'Quotes',   min_pct: 10, max_pct: 20 }),
      Object.freeze({ id: 'closing',  label: 'Closing',  min_pct: 5,  max_pct: 10 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '5 sections present in correct order',
    'Lead answers who/what/when/where/why',
    'Evidence citations [E-XXX] present in body + context',
    'Spoken word count within ±8% of target',
  ]),
  platforms: Object.freeze(['broadcast_tv', 'youtube', 'podcast_app', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: COMMERCIAL FORMAT
// ═══════════════════════════════════════════════════════════════

const COMMERCIAL_FORMAT = Object.freeze({
  id: 'commercial',
  name: 'Commercial',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'hybrid',
  evidence_requirement: EVIDENCE_REQUIREMENT.OPTIONAL,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 50, max: 400 }),
  duration_range: Object.freeze({ min_minutes: 0.25, max_minutes: 2 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'persuasion_arc',
    name: 'Persuasion Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'hook',      label: 'Hook',      min_pct: 15, max_pct: 25 }),
      Object.freeze({ id: 'problem',   label: 'Problem',   min_pct: 15, max_pct: 25 }),
      Object.freeze({ id: 'solution',  label: 'Solution',  min_pct: 20, max_pct: 30 }),
      Object.freeze({ id: 'proof',     label: 'Proof',     min_pct: 10, max_pct: 20 }),
      Object.freeze({ id: 'cta',       label: 'CTA',       min_pct: 10, max_pct: 20 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '5 sections present in correct order',
    'Hook within first 5 seconds',
    'CTA is clear and actionable',
    'Spoken word count within ±10% of target',
  ]),
  platforms: Object.freeze(['social_media', 'youtube', 'broadcast_tv', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: TUTORIAL FORMAT
// ═══════════════════════════════════════════════════════════════

const TUTORIAL_FORMAT = Object.freeze({
  id: 'tutorial',
  name: 'Tutorial',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'instructional',
  evidence_requirement: EVIDENCE_REQUIREMENT.MANDATORY,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 750, max: 4500 }),
  duration_range: Object.freeze({ min_minutes: 5, max_minutes: 30 }),
  spoken_word_budget_tolerance: 0.10,
  arc: Object.freeze({
    id: 'instructional_arc',
    name: 'Instructional Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'intro',          label: 'Intro',          min_pct: 8,  max_pct: 12 }),
      Object.freeze({ id: 'prerequisites',  label: 'Prerequisites',  min_pct: 5,  max_pct: 10 }),
      Object.freeze({ id: 'step_by_step',   label: 'Step by Step',   min_pct: 45, max_pct: 60 }),
      Object.freeze({ id: 'practice',       label: 'Practice',       min_pct: 12, max_pct: 20 }),
      Object.freeze({ id: 'summary',        label: 'Summary',        min_pct: 8,  max_pct: 12 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '5 sections present in correct order',
    'Steps are numbered and sequential',
    'Prerequisites clearly stated',
    'Spoken word count within ±10% of target',
  ]),
  platforms: Object.freeze(['youtube', 'podcast_app', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: AUDIO DRAMA FORMAT
// ═══════════════════════════════════════════════════════════════

const AUDIO_DRAMA_FORMAT = Object.freeze({
  id: 'audio_drama',
  name: 'Audio Drama',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'creative',
  evidence_requirement: EVIDENCE_REQUIREMENT.CONTEXTUAL,
  voice_default: 'multi_character',
  word_range: Object.freeze({ min: 2500, max: 10000 }),
  duration_range: Object.freeze({ min_minutes: 15, max_minutes: 60 }),
  spoken_word_budget_tolerance: 0.12,
  arc: Object.freeze({
    id: 'audio_drama_arc',
    name: 'Audio Drama Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'cold_open',    label: 'Cold Open',    min_pct: 5,  max_pct: 10 }),
      Object.freeze({ id: 'scene_one',    label: 'Scene One',    min_pct: 18, max_pct: 25 }),
      Object.freeze({ id: 'scene_two',    label: 'Scene Two',    min_pct: 18, max_pct: 25 }),
      Object.freeze({ id: 'scene_three',  label: 'Scene Three',  min_pct: 15, max_pct: 22 }),
      Object.freeze({ id: 'climax',       label: 'Climax',       min_pct: 15, max_pct: 22 }),
      Object.freeze({ id: 'resolution',   label: 'Resolution',   min_pct: 8,  max_pct: 12 }),
    ]),
  }),
  qa_checks: Object.freeze([
    '6 sections present in correct order',
    'Sound design cues [SFX: ...] present',
    'Character labels in dialogue',
    'Spoken word count within ±12% of target',
  ]),
  platforms: Object.freeze(['podcast_app', 'streaming', 'generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: STAGE PLAY FORMAT
// ═══════════════════════════════════════════════════════════════

const STAGE_PLAY_FORMAT = Object.freeze({
  id: 'stage_play',
  name: 'Stage Play',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: 'creative',
  evidence_requirement: EVIDENCE_REQUIREMENT.CONTEXTUAL,
  voice_default: 'multi_character',
  word_range: Object.freeze({ min: 4500, max: 18000 }),
  duration_range: Object.freeze({ min_minutes: 30, max_minutes: 120 }),
  spoken_word_budget_tolerance: 0.15,
  arc: Object.freeze({
    id: 'stage_play_arc',
    name: 'Stage Play Arc',
    sections: Object.freeze([
      Object.freeze({ id: 'act_one_scene_one',  label: 'Act I Scene 1',  min_pct: 15, max_pct: 22 }),
      Object.freeze({ id: 'act_one_scene_two',  label: 'Act I Scene 2',  min_pct: 15, max_pct: 22 }),
      Object.freeze({ id: 'act_two_scene_one',  label: 'Act II Scene 1', min_pct: 18, max_pct: 25 }),
      Object.freeze({ id: 'act_two_scene_two',  label: 'Act II Scene 2', min_pct: 18, max_pct: 25 }),
      Object.freeze({ id: 'curtain_call',       label: 'Curtain Call',   min_pct: 3,  max_pct: 8  }),
    ]),
  }),
  qa_checks: Object.freeze([
    '5 sections present (2 acts with 2 scenes each + curtain call)',
    'Stage directions in brackets',
    'Character labels in dialogue',
    'Spoken word count within ±15% of target',
  ]),
  platforms: Object.freeze(['generic']),
});

// ═══════════════════════════════════════════════════════════════
// M8: CUSTOM FORMAT (registry entry — runtime via buildCustomFormat)
// ═══════════════════════════════════════════════════════════════

const CUSTOM_FORMAT_ENTRY = Object.freeze({
  id: 'custom',
  name: 'Custom',
  status: FORMAT_STATUS.DESIGN_TARGET,
  content_type_default: null,
  evidence_requirement: EVIDENCE_REQUIREMENT.OPTIONAL,
  voice_default: 'single_narrator',
  word_range: Object.freeze({ min: 50, max: 50000 }),
  duration_range: Object.freeze({ min_minutes: 0.5, max_minutes: 180 }),
  spoken_word_budget_tolerance: 0.10,
  arc: null,
  qa_checks: Object.freeze([
    'Custom format — section checks depend on custom_format_spec',
  ]),
  platforms: Object.freeze(['generic']),
});

const FORMAT_REGISTRY = new Map([
  ['documentary',       DOCUMENTARY_FORMAT],
  ['explainer',         EXPLAINER_FORMAT],
  ['short_form',        SHORT_FORM_FORMAT],
  ['narrative',         NARRATIVE_FORMAT],
  ['podcast_solo',      PODCAST_SOLO_FORMAT],
  ['podcast_interview', PODCAST_INTERVIEW_FORMAT],
  ['podcast_narrative', PODCAST_NARRATIVE_FORMAT],
  ['screenplay',        SCREENPLAY_FORMAT],
  ['news',              NEWS_FORMAT],
  ['commercial',        COMMERCIAL_FORMAT],
  ['tutorial',          TUTORIAL_FORMAT],
  ['audio_drama',       AUDIO_DRAMA_FORMAT],
  ['stage_play',        STAGE_PLAY_FORMAT],
  ['custom',            CUSTOM_FORMAT_ENTRY],
]);

function validateCustomFormatSpec(spec) {
  if (!spec || typeof spec !== 'object') {
    return 'custom_format_spec must be a non-null object';
  }
  if (!spec.name || typeof spec.name !== 'string' || spec.name.trim().length === 0) {
    return 'custom_format_spec.name must be a non-empty string';
  }
  if (!Array.isArray(spec.sections) || spec.sections.length === 0) {
    return 'custom_format_spec.sections must be a non-empty array';
  }
  for (let i = 0; i < spec.sections.length; i++) {
    const s = spec.sections[i];
    if (!s || typeof s !== 'object') {
      return `custom_format_spec.sections[${i}] must be an object`;
    }
    if (!s.name || typeof s.name !== 'string' || s.name.trim().length === 0) {
      return `custom_format_spec.sections[${i}].name must be a non-empty string`;
    }
    if (!s.budget_percent || typeof s.budget_percent !== 'string') {
      return `custom_format_spec.sections[${i}].budget_percent must be a string (e.g. "15-20%")`;
    }
    const budgetMatch = s.budget_percent.match(/^(\d+)\s*-\s*(\d+)\s*%?$/);
    if (!budgetMatch) {
      return `custom_format_spec.sections[${i}].budget_percent "${s.budget_percent}" is malformed — expected "min-max%" (e.g. "15-20%")`;
    }
    const bMin = parseInt(budgetMatch[1], 10);
    const bMax = parseInt(budgetMatch[2], 10);
    if (bMin < 0 || bMax > 100 || bMin > bMax) {
      return `custom_format_spec.sections[${i}].budget_percent "${s.budget_percent}" has invalid range`;
    }
  }
  if (spec.evidence_requirement !== undefined) {
    const validReqs = new Set(Object.values(EVIDENCE_REQUIREMENT));
    if (!validReqs.has(spec.evidence_requirement)) {
      return `custom_format_spec.evidence_requirement "${spec.evidence_requirement}" is invalid — must be one of: ${[...validReqs].join(', ')}`;
    }
  }
  return null;
}

function buildCustomFormat(spec) {
  const sections = spec.sections.map(s => {
    const m = s.budget_percent.match(/^(\d+)\s*-\s*(\d+)\s*%?$/);
    return Object.freeze({
      id: s.name.toLowerCase().replace(/\s+/g, '_'),
      label: s.name,
      min_pct: parseInt(m[1], 10),
      max_pct: parseInt(m[2], 10),
    });
  });

  return Object.freeze({
    id: 'custom',
    name: spec.name,
    status: FORMAT_STATUS.DESIGN_TARGET,
    content_type_default: null,
    evidence_requirement: spec.evidence_requirement || EVIDENCE_REQUIREMENT.CONTEXTUAL,
    voice_default: spec.voice_model || 'single_narrator',
    word_range: Object.freeze({ min: 50, max: 50000 }),
    duration_range: Object.freeze({ min_minutes: 0.5, max_minutes: 180 }),
    spoken_word_budget_tolerance: 0.10,
    arc: Object.freeze({
      id: 'custom_arc',
      name: `${spec.name} Arc`,
      sections: Object.freeze(sections),
    }),
    qa_checks: Object.freeze([
      `${sections.length} sections present in correct order`,
    ]),
    platforms: Object.freeze(['generic']),
  });
}

function resolveFormat(brief) {
  if (brief.format !== undefined && brief.format !== null && typeof brief.format !== 'string') {
    return {
      resolved: null,
      hold: {
        type: 'HOLD_FORMAT_MISMATCH',
        severity: 'BLOCKING',
        message: `Format must be a string, got ${typeof brief.format}`,
      },
    };
  }

  const requested = (brief.format || 'documentary').toLowerCase().trim();

  if (requested === 'custom') {
    const specError = validateCustomFormatSpec(brief.custom_format_spec);
    if (specError) {
      return {
        resolved: null,
        hold: {
          type: 'HOLD_FORMAT_MISMATCH',
          severity: 'BLOCKING',
          message: `Custom format invalid: ${specError}`,
        },
      };
    }
    const customFormat = buildCustomFormat(brief.custom_format_spec);
    return {
      resolved: customFormat,
      warning: {
        type: 'DESIGN_TARGET_FORMAT',
        message: `Custom format "${brief.custom_format_spec.name}" is a DESIGN TARGET — user-defined formats require validation through pilot scripts.`,
      },
    };
  }

  const format = FORMAT_REGISTRY.get(requested);
  if (!format) {
    return {
      resolved: null,
      hold: {
        type: 'HOLD_FORMAT_MISMATCH',
        severity: 'BLOCKING',
        message: `Format "${requested}" is not registered. Available formats: ${[...FORMAT_REGISTRY.keys()].join(', ')}`,
      },
    };
  }

  if (format.status === FORMAT_STATUS.DESIGN_TARGET) {
    return {
      resolved: format,
      warning: {
        type: 'DESIGN_TARGET_FORMAT',
        message: `Format "${format.name}" is a DESIGN TARGET — not yet validated through pilot scripts. Arc template and QA checks are provisional.`,
      },
    };
  }

  return { resolved: format };
}

function getArcTemplate(formatId) {
  const format = FORMAT_REGISTRY.get(formatId);
  if (!format) return null;
  return format.arc;
}

function getSectionIds(formatId) {
  const arc = getArcTemplate(formatId);
  if (!arc) return [];
  return arc.sections.map(s => s.id);
}

function getFormatIds() {
  return [...FORMAT_REGISTRY.keys()];
}

function getValidatedFormats() {
  return [...FORMAT_REGISTRY.values()]
    .filter(f => f.status === FORMAT_STATUS.VALIDATED)
    .map(f => f.id);
}

function getDesignTargetFormats() {
  return [...FORMAT_REGISTRY.values()]
    .filter(f => f.status === FORMAT_STATUS.DESIGN_TARGET)
    .map(f => f.id);
}

function isRegisteredFormat(formatId) {
  return FORMAT_REGISTRY.has(formatId);
}

function getFormatDefinition(formatId) {
  return FORMAT_REGISTRY.get(formatId) || null;
}

export {
  FORMAT_STATUS,
  EVIDENCE_REQUIREMENT,
  DOCUMENTARY_FORMAT,
  EXPLAINER_FORMAT,
  SHORT_FORM_FORMAT,
  NARRATIVE_FORMAT,
  PODCAST_SOLO_FORMAT,
  PODCAST_INTERVIEW_FORMAT,
  PODCAST_NARRATIVE_FORMAT,
  SCREENPLAY_FORMAT,
  NEWS_FORMAT,
  COMMERCIAL_FORMAT,
  TUTORIAL_FORMAT,
  AUDIO_DRAMA_FORMAT,
  STAGE_PLAY_FORMAT,
  CUSTOM_FORMAT_ENTRY,
  resolveFormat,
  getArcTemplate,
  getSectionIds,
  getFormatIds,
  getValidatedFormats,
  getDesignTargetFormats,
  isRegisteredFormat,
  getFormatDefinition,
};
