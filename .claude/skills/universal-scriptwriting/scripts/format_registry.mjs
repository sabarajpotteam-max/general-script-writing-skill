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
  word_range: { min: 1000, max: 15000 },
  duration_range: { min_minutes: 5, max_minutes: 45 },
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
  word_range: { min: 500, max: 10000 },
  duration_range: { min_minutes: 2, max_minutes: 30 },
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
  word_range: { min: 50, max: 800 },
  duration_range: { min_minutes: 0.5, max_minutes: 3 },
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

const FORMAT_REGISTRY = new Map([
  ['documentary', DOCUMENTARY_FORMAT],
  ['explainer',   EXPLAINER_FORMAT],
  ['short_form',  SHORT_FORM_FORMAT],
]);

function resolveFormat(brief) {
  const requested = (brief.format || 'documentary').toLowerCase().trim();

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
  resolveFormat,
  getArcTemplate,
  getSectionIds,
  getFormatIds,
  getValidatedFormats,
  getDesignTargetFormats,
  isRegisteredFormat,
  getFormatDefinition,
};
