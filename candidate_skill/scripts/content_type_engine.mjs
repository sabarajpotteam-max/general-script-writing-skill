// content_type_engine.mjs — M3 Adaptive Evidence Modes and Controlled Research Integration
// Status: RESEARCH_ONLY — not approved for production

import { resolveFormat, EVIDENCE_REQUIREMENT } from './format_registry.mjs';

// ═══════════════════════════════════════════════════════════════
// STEP 1: CONTENT TYPE ENGINE
// ═══════════════════════════════════════════════════════════════

const CONTENT_TYPES = Object.freeze({
  FACTUAL: 'factual',
  CREATIVE: 'creative',
  HYBRID: 'hybrid',
  INSTRUCTIONAL: 'instructional',
});

const CONTENT_TYPE_SET = new Set(Object.values(CONTENT_TYPES));

const FORMAT_CONTENT_TYPE_DEFAULTS = Object.freeze({
  documentary: CONTENT_TYPES.FACTUAL,
  explainer: CONTENT_TYPES.FACTUAL,
  short_form: null,
  custom: null,
});

function inferContentType(brief, resolvedFormat) {
  if (brief.content_type && CONTENT_TYPE_SET.has(brief.content_type)) {
    return { content_type: brief.content_type, source: 'explicit' };
  }

  if (brief.content_type && !CONTENT_TYPE_SET.has(brief.content_type)) {
    return {
      content_type: null,
      source: 'invalid',
      error: `content_type "${brief.content_type}" is not valid — must be one of: ${[...CONTENT_TYPE_SET].join(', ')}`,
    };
  }

  const formatId = resolvedFormat ? resolvedFormat.id : 'documentary';

  if (formatId === 'documentary') return { content_type: CONTENT_TYPES.FACTUAL, source: 'format_default' };
  if (formatId === 'explainer') return { content_type: CONTENT_TYPES.FACTUAL, source: 'format_default' };

  if (formatId === 'short_form') {
    const obj = (brief.objectives || '').toLowerCase();
    if (obj === 'inform' || obj === 'educate') return { content_type: CONTENT_TYPES.FACTUAL, source: 'objectives_inference' };
    if (obj === 'entertain') return { content_type: CONTENT_TYPES.CREATIVE, source: 'objectives_inference' };
    if (obj === 'sell' || obj === 'persuade') return { content_type: CONTENT_TYPES.HYBRID, source: 'objectives_inference' };
    return { content_type: CONTENT_TYPES.FACTUAL, source: 'safe_fallback' };
  }

  if (formatId === 'custom') {
    return {
      content_type: null,
      source: 'unresolvable',
      error: 'Custom format requires explicit content_type in brief',
    };
  }

  if (resolvedFormat && resolvedFormat.content_type_default) {
    return { content_type: resolvedFormat.content_type_default, source: 'format_default' };
  }

  return { content_type: CONTENT_TYPES.FACTUAL, source: 'safe_fallback' };
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: CONDITIONAL EVIDENCE VALIDATION
// ═══════════════════════════════════════════════════════════════

const EVIDENCE_POLICIES = Object.freeze({
  [CONTENT_TYPES.FACTUAL]: Object.freeze({
    evidence_required: true,
    fictional_evidence_blocked: true,
    fabricated_facts_blocked: true,
    description: 'Evidence must support all substantive factual claims',
  }),
  [CONTENT_TYPES.CREATIVE]: Object.freeze({
    evidence_required: false,
    fictional_evidence_blocked: false,
    fabricated_facts_blocked: true,
    description: 'No fictional evidence register required; fabricated real-world facts still blocked',
  }),
  [CONTENT_TYPES.HYBRID]: Object.freeze({
    evidence_required: true,
    fictional_evidence_blocked: true,
    fabricated_facts_blocked: true,
    description: 'Factual claims need evidence; creative elements tracked separately',
  }),
  [CONTENT_TYPES.INSTRUCTIONAL]: Object.freeze({
    evidence_required: true,
    fictional_evidence_blocked: true,
    fabricated_facts_blocked: true,
    description: 'Accuracy verification required; formal citations optional for low-risk common procedures',
  }),
});

function getEvidencePolicy(contentType) {
  return EVIDENCE_POLICIES[contentType] || EVIDENCE_POLICIES[CONTENT_TYPES.FACTUAL];
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: RESEARCH MODE INFERENCE
// ═══════════════════════════════════════════════════════════════

const RESEARCH_MODES = Object.freeze({
  CLIENT_PROVIDED: 'client_provided',
  SYSTEM_ASSISTED: 'system_assisted',
  MINIMAL: 'minimal',
});

const RESEARCH_MODE_SET = new Set(Object.values(RESEARCH_MODES));

function inferResearchMode(brief, contentType) {
  if (brief.research_mode && RESEARCH_MODE_SET.has(brief.research_mode)) {
    return { research_mode: brief.research_mode, source: 'explicit' };
  }

  if (brief.research_mode && !RESEARCH_MODE_SET.has(brief.research_mode)) {
    return {
      research_mode: null,
      source: 'invalid',
      error: `research_mode "${brief.research_mode}" is not valid — must be one of: ${[...RESEARCH_MODE_SET].join(', ')}`,
    };
  }

  const hasEvidence = Array.isArray(brief.evidence) && brief.evidence.length > 0;

  if (hasEvidence) {
    return { research_mode: RESEARCH_MODES.CLIENT_PROVIDED, source: 'evidence_present' };
  }

  if (contentType === CONTENT_TYPES.CREATIVE) {
    return { research_mode: RESEARCH_MODES.MINIMAL, source: 'creative_default' };
  }

  if (contentType === CONTENT_TYPES.FACTUAL || contentType === CONTENT_TYPES.HYBRID || contentType === CONTENT_TYPES.INSTRUCTIONAL) {
    const isLegacyBrief = !brief.content_type && !brief.topic && (brief.subject || brief.object || brief.mechanism);
    if (isLegacyBrief) {
      return { research_mode: RESEARCH_MODES.CLIENT_PROVIDED, source: 'legacy_factual_default' };
    }
    return { research_mode: RESEARCH_MODES.SYSTEM_ASSISTED, source: 'factual_no_evidence' };
  }

  return { research_mode: RESEARCH_MODES.MINIMAL, source: 'safe_fallback' };
}

// ═══════════════════════════════════════════════════════════════
// STEP 4/5: RESEARCH PROVIDER INTERFACE
// ═══════════════════════════════════════════════════════════════

const EVIDENCE_STATUS = Object.freeze({
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  UNRESOURCED: 'unresourced',
  FABRICATION_SUSPECTED: 'fabrication_suspected',
});

const SOURCE_TYPES = Object.freeze({
  ACADEMIC: 'academic',
  GOVERNMENT: 'government',
  NEWS: 'news',
  INDUSTRY: 'industry',
  CRAFT_KNOWLEDGE: 'craft_knowledge',
  USER_PROVIDED: 'user_provided',
  UNKNOWN: 'unknown',
});

function createEvidenceRecord(fields) {
  const record = {
    claim_id: fields.claim_id || null,
    claim_text: fields.claim_text || '',
    source_url: fields.source_url || null,
    publisher: fields.publisher || null,
    author: fields.author || null,
    publication_date: fields.publication_date || null,
    retrieval_date: fields.retrieval_date || null,
    source_type: fields.source_type || SOURCE_TYPES.UNKNOWN,
    provenance: fields.provenance || 'unknown',
    epistemic_status: fields.epistemic_status || 'qualified',
    verification_status: fields.verification_status || EVIDENCE_STATUS.UNVERIFIED,
    caveats: fields.caveats || [],
    rights_assessment: fields.rights_assessment || null,
  };
  return Object.freeze(record);
}

function validateEvidenceRecord(record) {
  const issues = [];
  if (!record.claim_id) issues.push('Missing claim_id');
  if (!record.claim_text || record.claim_text.trim().length === 0) issues.push('Missing or empty claim_text');
  if (record.source_url && !/^https?:\/\//.test(record.source_url)) issues.push('source_url does not look like a valid URL');
  if (record.verification_status === EVIDENCE_STATUS.FABRICATION_SUSPECTED) {
    issues.push('FABRICATION_SUSPECTED — source appears fabricated');
  }
  return { valid: issues.length === 0, issues };
}

class ResearchProvider {
  constructor(options = {}) {
    this.available = options.available || false;
    this.provider_name = options.provider_name || 'offline_fixture';
  }

  isAvailable() { return this.available; }

  async retrieveEvidence(_query) {
    if (!this.available) {
      return {
        success: false,
        status: EVIDENCE_STATUS.UNRESOURCED,
        message: 'No authorized research tools available in current execution environment',
        records: [],
      };
    }
    return {
      success: false,
      status: EVIDENCE_STATUS.UNRESOURCED,
      message: 'Research provider interface: implement with authorized research capability',
      records: [],
    };
  }
}

function createOfflineFixtureProvider(fixtures = []) {
  const provider = new ResearchProvider({ available: true, provider_name: 'offline_fixture' });
  provider.retrieveEvidence = async (query) => {
    const matching = fixtures.filter(f =>
      f.topic && query.topic && f.topic.toLowerCase().includes(query.topic.toLowerCase())
    );
    if (matching.length === 0) {
      return {
        success: false,
        status: EVIDENCE_STATUS.UNRESOURCED,
        message: `No fixture data for topic "${query.topic}"`,
        records: [],
      };
    }
    return {
      success: true,
      status: EVIDENCE_STATUS.VERIFIED,
      message: `${matching.length} fixture record(s) found (offline test data — not live research)`,
      records: matching.map(f => createEvidenceRecord(f)),
    };
  };
  return provider;
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED M3 RESOLUTION
// ═══════════════════════════════════════════════════════════════

function resolveM3(brief, resolvedFormat) {
  const holds = [];
  const warnings = [];

  const ctResult = inferContentType(brief, resolvedFormat);
  if (ctResult.error) {
    holds.push({ type: 'HOLD_FORMAT_MISMATCH', detail: ctResult.error });
  }
  const contentType = ctResult.content_type || CONTENT_TYPES.FACTUAL;

  const rmResult = inferResearchMode(brief, contentType);
  if (rmResult.error) {
    holds.push({ type: 'HOLD_FORMAT_MISMATCH', detail: rmResult.error });
  }
  const researchMode = rmResult.research_mode || RESEARCH_MODES.MINIMAL;

  const evidencePolicy = getEvidencePolicy(contentType);

  const hasEvidence = Array.isArray(brief.evidence) && brief.evidence.length > 0;
  if (evidencePolicy.evidence_required && !hasEvidence && researchMode !== RESEARCH_MODES.SYSTEM_ASSISTED) {
    holds.push({
      type: 'HOLD_NO_EVIDENCE',
      detail: `Content type "${contentType}" requires evidence but none provided and research_mode is not system_assisted`,
    });
  }

  if (researchMode === RESEARCH_MODES.SYSTEM_ASSISTED && !hasEvidence) {
    warnings.push(`No evidence provided for ${contentType} content — system_assisted research will be needed before factual claims can be made`);
  }

  const formatEvReq = resolvedFormat ? resolvedFormat.evidence_requirement : EVIDENCE_REQUIREMENT.MANDATORY;
  const qa_limitations = [];
  if (resolvedFormat && resolvedFormat.id === 'custom') {
    qa_limitations.push('Custom format: section heading and budget checks are NOT validated — structural QA is limited to word count only');
  }

  return {
    content_type: contentType,
    content_type_source: ctResult.source,
    research_mode: researchMode,
    research_mode_source: rmResult.source,
    evidence_policy: evidencePolicy,
    format_evidence_requirement: formatEvReq,
    holds,
    warnings,
    qa_limitations,
    generation_permitted: holds.length === 0,
  };
}

export {
  CONTENT_TYPES,
  CONTENT_TYPE_SET,
  RESEARCH_MODES,
  RESEARCH_MODE_SET,
  EVIDENCE_STATUS,
  EVIDENCE_POLICIES,
  SOURCE_TYPES,
  inferContentType,
  getEvidencePolicy,
  inferResearchMode,
  createEvidenceRecord,
  validateEvidenceRecord,
  ResearchProvider,
  createOfflineFixtureProvider,
  resolveM3,
};
