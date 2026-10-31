// brief_engine.mjs — M7 Smart Client Brief Engine
// Status: RESEARCH_ONLY — not approved for production
// Implements CLIENT_BRIEF_INPUT_SCHEMA.md v2.0.0

import { resolveFormat, getFormatDefinition, isRegisteredFormat } from './format_registry.mjs';
import { resolveNiche } from './niche_resolver.mjs';
import { inferContentType as m3InferContentType, inferResearchMode as m3InferResearchMode, CONTENT_TYPES, RESEARCH_MODES, assessGenerationReadiness, deriveResearchState, getEvidencePolicy } from './content_type_engine.mjs';
import { resolveTargetWords, parseDuration, SPEAKING_RATES, UNIVERSAL_WORD_RANGE } from './duration_engine.mjs';
import { resolveVoiceMode, VOICE_MODES } from './voice_engine.mjs';
import { QA_HOLD_TYPES, HOLD_SEVERITY } from './qa_engine.mjs';

const BRIEF_SCHEMA_VERSION = '2.0.0';

// ═══════════════════════════════════════════════════════════════
// FORMAT AND PLATFORM DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const SUPPORTED_FORMATS = Object.freeze([
  'documentary', 'explainer', 'narrative', 'podcast_solo',
  'podcast_interview', 'podcast_narrative', 'short_form',
  'screenplay', 'news', 'commercial', 'tutorial',
  'audio_drama', 'stage_play', 'custom',
]);

const SUPPORTED_FORMATS_SET = new Set(SUPPORTED_FORMATS);

const SUPPORTED_PLATFORMS = Object.freeze([
  'youtube', 'youtube_shorts', 'podcast_app', 'broadcast_tv',
  'broadcast_radio', 'streaming', 'social_media', 'stage',
  'cinema', 'corporate', 'web', 'generic',
]);

const SUPPORTED_PLATFORMS_SET = new Set(SUPPORTED_PLATFORMS);

const PLATFORM_CONSTRAINTS = Object.freeze({
  youtube:          Object.freeze({ max_duration_seconds: null }),
  youtube_shorts:   Object.freeze({ max_duration_seconds: 180 }),
  podcast_app:      Object.freeze({ max_duration_seconds: null }),
  broadcast_tv:     Object.freeze({ max_duration_seconds: null }),
  broadcast_radio:  Object.freeze({ max_duration_seconds: null }),
  streaming:        Object.freeze({ max_duration_seconds: null }),
  social_media:     Object.freeze({ max_duration_seconds: 180 }),
  stage:            Object.freeze({ max_duration_seconds: null }),
  cinema:           Object.freeze({ max_duration_seconds: null }),
  corporate:        Object.freeze({ max_duration_seconds: null }),
  web:              Object.freeze({ max_duration_seconds: null }),
  generic:          Object.freeze({ max_duration_seconds: null }),
});

const FORMAT_CONTENT_TYPE_MAP = Object.freeze({
  documentary:       'factual',
  explainer:         'factual',
  news:              'factual',
  tutorial:          'instructional',
  narrative:         'creative',
  screenplay:        'creative',
  audio_drama:       'creative',
  stage_play:        'creative',
  commercial:        'hybrid',
  podcast_solo:      'hybrid',
  podcast_interview: 'hybrid',
  podcast_narrative: 'hybrid',
  short_form:        null,
  custom:            null,
});

const FORMAT_VOICE_MAP = Object.freeze({
  documentary:       Object.freeze({ mode: 'single_narrator', tone: 'authoritative' }),
  explainer:         Object.freeze({ mode: 'single_narrator', tone: 'conversational' }),
  narrative:         Object.freeze({ mode: 'multi_character', tone: 'dramatic' }),
  podcast_solo:      Object.freeze({ mode: 'single_narrator', tone: 'conversational' }),
  podcast_interview: Object.freeze({ mode: 'host_guest', tone: 'conversational' }),
  podcast_narrative: Object.freeze({ mode: 'single_narrator', tone: 'intimate' }),
  short_form:        Object.freeze({ mode: 'single_narrator', tone: 'casual' }),
  screenplay:        Object.freeze({ mode: 'multi_character', tone: 'dramatic' }),
  news:              Object.freeze({ mode: 'single_narrator', tone: 'formal' }),
  commercial:        Object.freeze({ mode: 'single_narrator', tone: 'conversational' }),
  tutorial:          Object.freeze({ mode: 'single_narrator', tone: 'conversational' }),
  audio_drama:       Object.freeze({ mode: 'multi_character', tone: 'dramatic' }),
  stage_play:        Object.freeze({ mode: 'multi_character', tone: 'dramatic' }),
  custom:            Object.freeze({ mode: 'single_narrator', tone: 'conversational' }),
});

const FORMAT_DURATION_MAP = Object.freeze({
  documentary:       Object.freeze({ default_duration: '15 minutes' }),
  explainer:         Object.freeze({ default_duration: '8 minutes' }),
  narrative:         Object.freeze({ default_duration: '20 minutes' }),
  podcast_solo:      Object.freeze({ default_duration: '20 minutes' }),
  podcast_interview: Object.freeze({ default_duration: '30 minutes' }),
  podcast_narrative: Object.freeze({ default_duration: '30 minutes' }),
  short_form:        Object.freeze({ default_duration: '60 seconds' }),
  screenplay:        Object.freeze({ default_duration: '90 minutes' }),
  news:              Object.freeze({ default_duration: '3 minutes' }),
  commercial:        Object.freeze({ default_duration: '30 seconds' }),
  tutorial:          Object.freeze({ default_duration: '10 minutes' }),
  audio_drama:       Object.freeze({ default_duration: '30 minutes' }),
  stage_play:        Object.freeze({ default_duration: '90 minutes' }),
  custom:            Object.freeze({ default_duration: '10 minutes' }),
});

const FORMAT_DEFAULTS = Object.freeze({
  content_type: FORMAT_CONTENT_TYPE_MAP,
  voice: FORMAT_VOICE_MAP,
  duration: FORMAT_DURATION_MAP,
});

const VALID_OBJECTIVES = new Set([
  'inform', 'persuade', 'entertain', 'educate',
  'sell', 'inspire', 'warn', 'document',
]);

// ═══════════════════════════════════════════════════════════════
// LANGUAGE RESOLUTION
// ═══════════════════════════════════════════════════════════════

const ISO_639_1_CODES = new Set([
  'aa','ab','af','ak','am','an','ar','as','av','ay','az',
  'ba','be','bg','bh','bi','bm','bn','bo','br','bs',
  'ca','ce','ch','co','cr','cs','cu','cv','cy',
  'da','de','dv','dz',
  'ee','el','en','eo','es','et','eu',
  'fa','ff','fi','fj','fo','fr','fy',
  'ga','gd','gl','gn','gu','gv',
  'ha','he','hi','ho','hr','ht','hu','hy','hz',
  'ia','id','ie','ig','ii','ik','io','is','it','iu',
  'ja','jv',
  'ka','kg','ki','kj','kk','kl','km','kn','ko','kr','ks','ku','kv','kw','ky',
  'la','lb','lg','li','ln','lo','lt','lu','lv',
  'mg','mh','mi','mk','ml','mn','mr','ms','mt','my',
  'na','nb','nd','ne','ng','nl','nn','no','nr','nv','ny',
  'oc','oj','om','or','os',
  'pa','pi','pl','ps','pt',
  'qu',
  'rm','rn','ro','ru','rw',
  'sa','sc','sd','se','sg','si','sk','sl','sm','sn','so','sq','sr','ss','st','su','sv','sw',
  'ta','te','tg','th','ti','tk','tl','tn','to','tr','ts','tt','tw','ty',
  'ug','uk','ur','uz',
  've','vi','vo',
  'wa','wo',
  'xh',
  'yi','yo',
  'za','zh','zu',
]);

const LANGUAGE_NAME_MAP = Object.freeze({
  english: 'en', german: 'de', deutsch: 'de', urdu: 'ur',
  spanish: 'es', español: 'es', hindi: 'hi',
  arabic: 'ar', french: 'fr', français: 'fr',
  chinese: 'zh', mandarin: 'zh', japanese: 'ja',
  korean: 'ko', portuguese: 'pt', russian: 'ru',
  italian: 'it', dutch: 'nl', turkish: 'tr',
  polish: 'pl', swedish: 'sv', danish: 'da',
  finnish: 'fi', norwegian: 'no',
});

function resolveLanguage(input) {
  const raw = input.language;
  if (!raw) {
    return { value: 'en', source: 'universal_default', code: 'en', valid: true };
  }
  const normalized = String(raw).toLowerCase().trim();
  if (ISO_639_1_CODES.has(normalized)) {
    return { value: normalized, source: 'explicit', code: normalized, valid: true };
  }
  const mapped = LANGUAGE_NAME_MAP[normalized];
  if (mapped) {
    return { value: mapped, source: 'explicit', code: mapped, valid: true, original_name: raw };
  }
  return {
    value: null,
    source: 'invalid',
    code: null,
    valid: false,
    error: `Unrecognized language "${raw}" — use ISO 639-1 code (e.g., "en") or full name (e.g., "English")`,
  };
}

// ═══════════════════════════════════════════════════════════════
// AUDIENCE RESOLUTION
// ═══════════════════════════════════════════════════════════════

function resolveAudience(input) {
  if (input.audience_detailed && typeof input.audience_detailed === 'object') {
    const ad = input.audience_detailed;
    return {
      value: ad,
      source: 'explicit',
      description: input.audience || formatAudienceDescription(ad),
      knowledge_level: ad.knowledge_level || 'general',
      age_range: ad.age_range || null,
      cultural_context: ad.cultural_context || null,
    };
  }
  if (input.audience && typeof input.audience === 'string' && input.audience.trim().length >= 3) {
    return {
      value: input.audience.trim(),
      source: 'explicit',
      description: input.audience.trim(),
      knowledge_level: inferKnowledgeLevel(input.audience),
      age_range: inferAgeRange(input.audience),
      cultural_context: null,
    };
  }
  return {
    value: 'general_adult',
    source: 'universal_default',
    description: 'General adult audience',
    knowledge_level: 'general',
    age_range: null,
    cultural_context: null,
  };
}

function formatAudienceDescription(ad) {
  const parts = [];
  if (ad.age_range) parts.push(`ages ${ad.age_range}`);
  if (ad.knowledge_level) parts.push(`${ad.knowledge_level} level`);
  if (ad.cultural_context) parts.push(ad.cultural_context);
  return parts.length > 0 ? parts.join(', ') : 'General audience';
}

function inferKnowledgeLevel(audienceStr) {
  const lower = audienceStr.toLowerCase();
  if (/expert|professional|specialist|advanced|phd|researcher/i.test(lower)) return 'expert';
  if (/intermediate|student|undergraduate/i.test(lower)) return 'intermediate';
  if (/beginner|intro|kids|children|novice/i.test(lower)) return 'beginner';
  return 'general';
}

function inferAgeRange(audienceStr) {
  const ageMatch = audienceStr.match(/(\d{1,2})\s*[-–to]+\s*(\d{1,3})/);
  if (ageMatch) return `${ageMatch[1]}-${ageMatch[2]}`;
  if (/kids|children/i.test(audienceStr)) return '6-12';
  if (/teens|teenagers|adolescent/i.test(audienceStr)) return '13-17';
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PLATFORM RESOLUTION
// ═══════════════════════════════════════════════════════════════

function resolvePlatform(input) {
  if (!input.platform) {
    return { value: 'generic', source: 'universal_default', constraints: PLATFORM_CONSTRAINTS.generic };
  }
  const normalized = String(input.platform).toLowerCase().trim();
  if (!SUPPORTED_PLATFORMS_SET.has(normalized)) {
    return {
      value: null,
      source: 'invalid',
      constraints: null,
      error: `Platform "${input.platform}" is not supported — available: ${SUPPORTED_PLATFORMS.join(', ')}`,
    };
  }
  return {
    value: normalized,
    source: 'explicit',
    constraints: PLATFORM_CONSTRAINTS[normalized],
  };
}

// ═══════════════════════════════════════════════════════════════
// WORKING TITLE GENERATION
// ═══════════════════════════════════════════════════════════════

function generateWorkingTitle(brief) {
  if (brief.title) {
    return { value: brief.title, source: 'explicit' };
  }
  if (brief.topic) {
    return { value: `[Provisional] ${brief.topic}`, source: 'inferred', provisional: true };
  }
  return { value: '[Untitled Brief]', source: 'universal_default', provisional: true };
}

// ═══════════════════════════════════════════════════════════════
// PROVISIONAL S/O/M IDENTIFICATION
// ═══════════════════════════════════════════════════════════════

function identifySubjectObjectMechanism(brief) {
  const result = {
    subject: null,
    object: null,
    mechanism: null,
    uncertainty: null,
    source: 'none',
    provisional: true,
    note: 'Provisional identification from topic text — NOT verified research. Requires human review or authorized research provider before factual claims.',
  };

  if (brief.subject && brief.object && brief.mechanism) {
    return {
      subject: { value: brief.subject, source: 'explicit' },
      object: { value: brief.object, source: 'explicit' },
      mechanism: { value: brief.mechanism, source: 'explicit' },
      uncertainty: { value: brief.uncertainty || 'qualified', source: brief.uncertainty ? 'explicit' : 'universal_default' },
      source: 'explicit',
      provisional: false,
      note: null,
    };
  }

  const topic = brief.topic || '';
  if (!topic || topic.length < 5) return result;

  result.source = 'inferred_from_topic';

  const howMatch = topic.match(/[Hh]ow\s+(.+?)(?:\s+(?:affects?|impacts?|causes?|leads?\s+to|creates?|produces?)\s+(.+))?$/);
  const whyMatch = topic.match(/[Ww]hy\s+(.+?)(?:\s+(?:is|are|was|were|has|have)\s+(.+))?$/);
  const ofMatch = topic.match(/(?:[Tt]he\s+)?(.+?)\s+(?:of|behind|in)\s+(.+)/);

  if (howMatch) {
    result.subject = { value: howMatch[1].trim(), source: 'inferred', provisional: true };
    if (howMatch[2]) result.object = { value: howMatch[2].trim(), source: 'inferred', provisional: true };
    result.mechanism = { value: `[REQUIRES RESEARCH] Mechanism connecting "${howMatch[1].trim()}" to outcome`, source: 'placeholder', provisional: true };
  } else if (whyMatch) {
    result.subject = { value: whyMatch[1].trim(), source: 'inferred', provisional: true };
    if (whyMatch[2]) result.object = { value: whyMatch[2].trim(), source: 'inferred', provisional: true };
    result.mechanism = { value: `[REQUIRES RESEARCH] Causal explanation for "${whyMatch[1].trim()}"`, source: 'placeholder', provisional: true };
  } else if (ofMatch) {
    result.subject = { value: ofMatch[1].trim(), source: 'inferred', provisional: true };
    result.object = { value: ofMatch[2].trim(), source: 'inferred', provisional: true };
    result.mechanism = { value: `[REQUIRES RESEARCH] Relationship between "${ofMatch[1].trim()}" and "${ofMatch[2].trim()}"`, source: 'placeholder', provisional: true };
  } else {
    result.subject = { value: topic, source: 'inferred', provisional: true };
    result.mechanism = { value: `[REQUIRES RESEARCH] Analysis of "${topic}"`, source: 'placeholder', provisional: true };
  }

  result.uncertainty = {
    value: brief.uncertainty || 'qualified',
    source: brief.uncertainty ? 'explicit' : 'universal_default',
  };

  return result;
}

// ═══════════════════════════════════════════════════════════════
// CROSS-FIELD VALIDATION
// ═══════════════════════════════════════════════════════════════

function validateCrossFields(normalized) {
  const holds = [];
  const warnings = [];

  const format = normalized.format ? normalized.format.value : 'documentary';
  const platform = normalized.platform ? normalized.platform.value : 'generic';
  const contentType = normalized.content_type ? normalized.content_type.value : null;
  const audience = normalized.audience ? normalized.audience.value : 'general_adult';
  const voice = normalized.voice || {};

  // Platform vs duration constraint
  const platformConstraints = PLATFORM_CONSTRAINTS[platform];
  if (platformConstraints && platformConstraints.max_duration_seconds) {
    const maxSec = platformConstraints.max_duration_seconds;
    const wordRes = normalized.word_resolution;
    if (wordRes && wordRes.runtime_estimate) {
      const estSec = wordRes.runtime_estimate.estimated_seconds;
      if (estSec > maxSec) {
        holds.push({
          type: QA_HOLD_TYPES.PLATFORM_COMPLIANCE,
          severity: HOLD_SEVERITY[QA_HOLD_TYPES.PLATFORM_COMPLIANCE] || 'ADVISORY',
          detail: `Platform "${platform}" maximum ${maxSec} seconds — estimated duration is ${estSec} seconds`,
        });
      }
    }
  }

  // Audience vs content safety
  const audienceStr = typeof audience === 'string' ? audience.toLowerCase() : '';
  const isChildAudience = /kids|children|child|minors|under\s*1[0-3]|ages?\s*[4-9]\b|ages?\s*1[0-2]\b/i.test(audienceStr);
  if (isChildAudience) {
    if (contentType === 'creative') {
      const topic = (normalized.topic ? normalized.topic.value : '').toLowerCase();
      const dangerousContent = /violence|murder|kill|death|sexual|drug|horror|gore|weapon|blood/i.test(topic);
      if (dangerousContent) {
        holds.push({
          type: QA_HOLD_TYPES.AUDIENCE_RISK,
          severity: 'BLOCKING',
          detail: 'Content topic contains potentially harmful themes for child audience',
        });
      }
    }
    if (/explicit|adult|nsfw|mature/i.test(audienceStr)) {
      holds.push({
        type: QA_HOLD_TYPES.AUDIENCE_RISK,
        severity: 'BLOCKING',
        detail: 'Audience description mixes child and adult/explicit markers',
      });
    }
  }

  // Custom format without spec
  if (format === 'custom' && !normalized._raw.custom_format_spec) {
    holds.push({
      type: QA_HOLD_TYPES.FORMAT_MISMATCH,
      severity: 'BLOCKING',
      detail: 'Custom format requires custom_format_spec with sections defined',
    });
  }

  // Brand voice mode without guidelines
  if (voice.mode === 'brand_voice' && !normalized._raw.brand_voice) {
    holds.push({
      type: QA_HOLD_TYPES.FORMAT_MISMATCH,
      severity: 'BLOCKING',
      detail: 'Brand voice mode requires brand_voice guidelines object',
    });
  }

  // Niche sensitivity check
  if (normalized.niche_resolution && normalized.niche_resolution.high_stakes) {
    if (!normalized.niche_resolution.adapter) {
      warnings.push(`High-stakes niche "${normalized.niche_resolution.input}" — no registered adapter. Content will use UNIVERSAL rules with elevated caution.`);
    }
  }

  return { holds, warnings };
}

// ═══════════════════════════════════════════════════════════════
// BRIEF READINESS ASSESSMENT
// ═══════════════════════════════════════════════════════════════

function assessBriefReadiness(normalized) {
  const allHolds = [...(normalized.holds || [])];
  const blockingHolds = allHolds.filter(h => h.severity === 'BLOCKING');
  const advisoryHolds = allHolds.filter(h => h.severity === 'ADVISORY');

  const researchRequirements = [];
  const contentType = normalized.content_type ? normalized.content_type.value : null;
  const researchMode = normalized.research_mode ? normalized.research_mode.value : null;
  const evidence = normalized._raw.evidence || [];

  if (contentType === 'factual' && evidence.length === 0) {
    if (researchMode === 'system_assisted') {
      researchRequirements.push({
        type: 'topic_research',
        description: 'System-assisted research required before factual generation — topic-specific facts must be gathered from authorized sources',
        status: 'PENDING',
      });
    } else if (researchMode === 'client_provided') {
      researchRequirements.push({
        type: 'evidence_required',
        description: 'Client-provided evidence mode but no evidence items supplied — evidence register required',
        status: 'BLOCKED',
      });
    }
  }

  if (contentType === 'hybrid' && evidence.length === 0) {
    researchRequirements.push({
      type: 'factual_claims_evidence',
      description: 'Hybrid content — evidence needed for factual claims (creative elements exempt)',
      status: 'PENDING',
    });
  }

  const som = normalized.subject_object_mechanism;
  if (som && som.provisional && contentType === 'factual') {
    researchRequirements.push({
      type: 'som_verification',
      description: 'Subject/Object/Mechanism identification is provisional — requires verification through authorized research before factual claims',
      status: 'PENDING',
    });
  }

  const generationReady = blockingHolds.length === 0 && researchRequirements.filter(r => r.status === 'BLOCKED').length === 0;

  return {
    generation_ready: generationReady,
    blocking_holds: blockingHolds,
    advisory_holds: advisoryHolds,
    research_requirements: researchRequirements,
    writing_strategy_handoff: {
      format: normalized.format ? normalized.format.value : null,
      content_type: contentType,
      research_mode: researchMode,
      target_words: normalized.word_resolution ? normalized.word_resolution.target_words : null,
      voice_mode: normalized.voice ? normalized.voice.mode : null,
      tone: normalized.voice ? normalized.voice.tone : null,
      platform: normalized.platform ? normalized.platform.value : null,
      niche: normalized.niche_resolution ? normalized.niche_resolution.resolved_id : null,
      language: normalized.language ? normalized.language.code : 'en',
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY: normalizeBrief
// ═══════════════════════════════════════════════════════════════

function normalizeBrief(rawInput) {
  if (!rawInput || typeof rawInput !== 'object') {
    return {
      success: false,
      error: 'Brief input must be a non-null object',
      holds: [{ type: QA_HOLD_TYPES.FORMAT_MISMATCH, severity: 'BLOCKING', detail: 'Brief input must be a non-null object' }],
    };
  }

  const holds = [];
  const warnings = [];
  const provenance = {};

  // Preserve original input immutably
  const _raw = { ...rawInput };

  // Alias resolution: title → topic
  let topic;
  if (rawInput.topic) {
    topic = { value: rawInput.topic, source: 'explicit' };
  } else if (rawInput.title) {
    topic = { value: rawInput.title, source: 'alias' };
  } else {
    topic = { value: null, source: 'missing' };
  }
  provenance.topic = topic.source;

  // Topic validation
  if (!topic.value || typeof topic.value !== 'string' || topic.value.trim().length < 3) {
    holds.push({
      type: QA_HOLD_TYPES.FORMAT_MISMATCH,
      severity: 'BLOCKING',
      detail: 'Topic is required — please describe what the script is about (minimum 3 characters)',
    });
  } else if (topic.value.length > 500) {
    holds.push({
      type: QA_HOLD_TYPES.FORMAT_MISMATCH,
      severity: 'BLOCKING',
      detail: `Topic exceeds 500 character limit (${topic.value.length} chars)`,
    });
  }

  // Language resolution
  const language = resolveLanguage(rawInput);
  provenance.language = language.source;
  if (!language.valid) {
    holds.push({ type: QA_HOLD_TYPES.FORMAT_MISMATCH, severity: 'BLOCKING', detail: language.error });
  }

  // Audience resolution
  const audience = resolveAudience(rawInput);
  provenance.audience = audience.source;

  // Format resolution
  let formatValue;
  if (rawInput.format && SUPPORTED_FORMATS_SET.has(rawInput.format.toLowerCase())) {
    formatValue = { value: rawInput.format.toLowerCase(), source: 'explicit' };
  } else if (rawInput.format) {
    formatValue = { value: rawInput.format.toLowerCase(), source: 'explicit' };
  } else {
    formatValue = { value: 'documentary', source: 'universal_default' };
  }
  provenance.format = formatValue.source;

  // Use existing format resolver for structure details
  const formatResolution = resolveFormat({ ...rawInput, format: formatValue.value });
  if (formatResolution.hold) {
    holds.push({
      type: formatResolution.hold.type,
      severity: formatResolution.hold.severity || 'BLOCKING',
      detail: formatResolution.hold.message,
    });
  }
  if (formatResolution.warning) {
    warnings.push(formatResolution.warning.message);
  }
  const resolvedFormat = formatResolution.resolved;

  // Platform resolution
  const platform = resolvePlatform(rawInput);
  provenance.platform = platform.source;
  if (platform.error) {
    holds.push({ type: QA_HOLD_TYPES.PLATFORM_COMPLIANCE, severity: 'ADVISORY', detail: platform.error });
  }

  // Niche resolution
  let nicheResolution = null;
  if (rawInput.niche) {
    nicheResolution = resolveNiche(rawInput.niche);
    if (!nicheResolution.validation.valid) {
      holds.push({ type: QA_HOLD_TYPES.DOMAIN_UNKNOWN, severity: 'BLOCKING', detail: `Invalid niche: ${rawInput.niche} — ${nicheResolution.validation.error}` });
    }
    if (nicheResolution.high_stakes) {
      warnings.push(`High-stakes niche "${rawInput.niche}" — elevated review required`);
    }
    provenance.niche = 'explicit';
  } else {
    provenance.niche = 'none';
  }

  // Content type resolution
  let contentType;
  if (rawInput.content_type && ['factual', 'creative', 'hybrid', 'instructional'].includes(rawInput.content_type)) {
    contentType = { value: rawInput.content_type, source: 'explicit' };
  } else if (rawInput.content_type) {
    contentType = { value: null, source: 'invalid' };
    holds.push({ type: QA_HOLD_TYPES.FORMAT_MISMATCH, severity: 'BLOCKING', detail: `Invalid content_type "${rawInput.content_type}" — must be factual, creative, hybrid, or instructional` });
  } else {
    const fmt = formatValue.value;
    const mapped = FORMAT_CONTENT_TYPE_MAP[fmt];
    if (mapped) {
      contentType = { value: mapped, source: 'format_default' };
    } else if (fmt === 'short_form') {
      const objectives = rawInput.objectives || [];
      const objArr = Array.isArray(objectives) ? objectives : [objectives];
      const objSet = new Set(objArr.map(o => String(o).toLowerCase()));
      if (objSet.has('inform') || objSet.has('educate')) {
        contentType = { value: 'factual', source: 'inferred' };
      } else if (objSet.has('entertain')) {
        contentType = { value: 'creative', source: 'inferred' };
      } else if (objSet.has('sell') || objSet.has('persuade')) {
        contentType = { value: 'hybrid', source: 'inferred' };
      } else {
        contentType = { value: 'hybrid', source: 'universal_default' };
      }
    } else {
      contentType = { value: 'hybrid', source: 'universal_default' };
    }
  }
  provenance.content_type = contentType.source;

  // Research mode resolution
  let researchMode;
  if (rawInput.research_mode && ['client_provided', 'system_assisted', 'minimal'].includes(rawInput.research_mode)) {
    researchMode = { value: rawInput.research_mode, source: 'explicit' };
  } else if (rawInput.research_mode) {
    researchMode = { value: null, source: 'invalid' };
    holds.push({ type: QA_HOLD_TYPES.FORMAT_MISMATCH, severity: 'BLOCKING', detail: `Invalid research_mode "${rawInput.research_mode}"` });
  } else {
    const evidence = rawInput.evidence;
    const hasEvidence = Array.isArray(evidence) && evidence.length > 0;
    if (hasEvidence) {
      researchMode = { value: 'client_provided', source: 'inferred' };
    } else if (contentType.value === 'creative') {
      researchMode = { value: 'minimal', source: 'inferred' };
    } else if (contentType.value === 'instructional' && !hasEvidence) {
      researchMode = { value: 'minimal', source: 'inferred' };
    } else {
      researchMode = { value: 'system_assisted', source: 'inferred' };
    }
  }
  provenance.research_mode = researchMode.source;

  // Voice resolution
  let voiceResult;
  const rawVoice = rawInput.voice || {};
  const fmt = formatValue.value;
  const voiceDefaults = FORMAT_VOICE_MAP[fmt] || FORMAT_VOICE_MAP.custom;
  const voiceMode = rawVoice.mode || voiceDefaults.mode;
  const voiceTone = rawVoice.tone || voiceDefaults.tone;

  voiceResult = {
    mode: voiceMode,
    tone: voiceTone,
    formality: rawVoice.formality || null,
    humor_level: rawVoice.humor_level || 0,
    source: rawVoice.mode ? 'explicit' : 'format_default',
  };
  provenance.voice = voiceResult.source;

  // Duration/word-count resolution
  let wordResolution;
  if (resolvedFormat) {
    const wordRes = resolveTargetWords(rawInput, resolvedFormat);
    if (wordRes.error) {
      holds.push({ type: QA_HOLD_TYPES.FORMAT_MISMATCH, severity: 'BLOCKING', detail: wordRes.error });
    }
    for (const w of wordRes.warnings) warnings.push(w);
    wordResolution = wordRes;
    provenance.target_words = wordRes.source;
  } else {
    wordResolution = { target_words: rawInput.target_words || 3000, source: rawInput.target_words ? 'explicit_target_words' : 'universal_fallback', warnings: [] };
    provenance.target_words = wordResolution.source;
  }

  // Compute runtime estimate for cross-field validation
  if (wordResolution && wordResolution.target_words) {
    const wpm = (wordResolution.speaking_rate && wordResolution.speaking_rate.wpm) || 150;
    const estSeconds = Math.round((wordResolution.target_words / wpm) * 60);
    wordResolution.runtime_estimate = { estimated_seconds: estSeconds, wpm_used: wpm };
  }

  // Objectives
  let objectives;
  if (rawInput.objectives) {
    const objArr = Array.isArray(rawInput.objectives) ? rawInput.objectives : [rawInput.objectives];
    const valid = objArr.filter(o => VALID_OBJECTIVES.has(String(o).toLowerCase()));
    const invalid = objArr.filter(o => !VALID_OBJECTIVES.has(String(o).toLowerCase()));
    if (invalid.length > 0) {
      warnings.push(`Unknown objectives ignored: ${invalid.join(', ')}`);
    }
    objectives = { value: valid.map(o => o.toLowerCase()), source: 'explicit' };
  } else {
    objectives = { value: ['inform'], source: 'universal_default' };
  }
  provenance.objectives = objectives.source;

  // Working title
  const workingTitle = generateWorkingTitle(rawInput);
  provenance.title = workingTitle.source;

  // S/O/M identification
  const som = identifySubjectObjectMechanism(rawInput);

  // Build normalized brief
  const normalized = {
    schema_version: BRIEF_SCHEMA_VERSION,
    topic,
    title: workingTitle,
    audience,
    language,
    format: formatValue,
    format_resolution: resolvedFormat ? {
      id: resolvedFormat.id,
      name: resolvedFormat.name,
      status: resolvedFormat.status,
      evidence_requirement: resolvedFormat.evidence_requirement,
    } : null,
    platform,
    niche_resolution: nicheResolution,
    content_type: contentType,
    research_mode: researchMode,
    voice: voiceResult,
    word_resolution: wordResolution,
    objectives,
    subject_object_mechanism: som,
    holds,
    warnings,
    provenance,
    _raw,
  };

  // Cross-field validation
  const crossFieldResult = validateCrossFields(normalized);
  holds.push(...crossFieldResult.holds);
  warnings.push(...crossFieldResult.warnings);

  // Readiness assessment
  const readiness = assessBriefReadiness(normalized);
  normalized.readiness = readiness;
  normalized.success = true;

  return normalized;
}

export {
  normalizeBrief,
  BRIEF_SCHEMA_VERSION,
  SUPPORTED_FORMATS,
  SUPPORTED_FORMATS_SET,
  SUPPORTED_PLATFORMS,
  SUPPORTED_PLATFORMS_SET,
  FORMAT_DEFAULTS,
  FORMAT_CONTENT_TYPE_MAP,
  FORMAT_VOICE_MAP,
  FORMAT_DURATION_MAP,
  PLATFORM_CONSTRAINTS,
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
};
