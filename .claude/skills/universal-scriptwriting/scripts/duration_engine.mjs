// duration_engine.mjs — M4 Flexible Duration & Runtime Intelligence
// Status: RESEARCH_ONLY — not approved for production

const SPEAKING_RATES = Object.freeze({
  standard_narration: Object.freeze({ id: 'standard_narration', wpm: 150, label: 'Standard Narration' }),
  conversational:     Object.freeze({ id: 'conversational',     wpm: 170, label: 'Conversational' }),
  energetic:          Object.freeze({ id: 'energetic',          wpm: 190, label: 'Energetic' }),
  deliberate:         Object.freeze({ id: 'deliberate',         wpm: 120, label: 'Deliberate' }),
});

const SPEAKING_RATE_SET = new Set(Object.keys(SPEAKING_RATES));
const DEFAULT_RATE = SPEAKING_RATES.standard_narration;

const UNIVERSAL_WORD_RANGE = Object.freeze({ min: 50, max: 50000 });

function getSpeakingRate(rateId) {
  if (!rateId) return DEFAULT_RATE;
  const rate = SPEAKING_RATES[rateId];
  if (!rate) return null;
  return rate;
}

function parseDuration(input) {
  if (input === undefined || input === null) {
    return { valid: false, error: 'No duration provided' };
  }

  const str = String(input).toLowerCase().trim();
  if (str.length === 0) {
    return { valid: false, error: 'Empty duration string' };
  }

  let minutes = null;
  let unit = null;

  const hourMatch = str.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  const minMatch = str.match(/^(\d+(?:\.\d+)?)\s*min(?:utes?)?$/);
  const secMatch = str.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?$/);

  if (hourMatch) {
    minutes = parseFloat(hourMatch[1]) * 60;
    unit = 'hours';
  } else if (minMatch) {
    minutes = parseFloat(minMatch[1]);
    unit = 'minutes';
  } else if (secMatch) {
    minutes = parseFloat(secMatch[1]) / 60;
    unit = 'seconds';
  } else {
    return { valid: false, error: `Malformed duration "${input}" — expected format like "30 seconds", "10 minutes", "2 hours"` };
  }

  if (!Number.isFinite(minutes)) {
    return { valid: false, error: `Duration "${input}" produced non-finite value` };
  }
  if (minutes <= 0) {
    return { valid: false, error: `Duration "${input}" must be positive (got ${minutes} minutes)` };
  }
  if (minutes > 600) {
    return { valid: false, error: `Duration "${input}" exceeds maximum 10 hours (${minutes} minutes)` };
  }

  return {
    valid: true,
    minutes,
    seconds: Math.round(minutes * 60),
    unit,
    original: String(input),
  };
}

function computeWordCount(durationMinutes, speakingRate) {
  const rate = speakingRate || DEFAULT_RATE;
  const words = Math.round(durationMinutes * rate.wpm);
  return words;
}

function resolveTargetWords(brief, resolvedFormat) {
  const result = {
    target_words: null,
    source: null,
    speaking_rate: null,
    duration: null,
    format_range: null,
    warnings: [],
  };

  const fmtRange = resolvedFormat ? resolvedFormat.word_range : UNIVERSAL_WORD_RANGE;
  result.format_range = fmtRange;

  const rate = brief.speaking_rate
    ? getSpeakingRate(brief.speaking_rate)
    : DEFAULT_RATE;

  if (brief.speaking_rate && !rate) {
    result.warnings.push(`Unknown speaking_rate "${brief.speaking_rate}" — using standard_narration (150 WPM)`);
  }
  result.speaking_rate = rate || DEFAULT_RATE;

  // Priority 1: Explicit target_words
  if (brief.target_words !== undefined && brief.target_words !== null) {
    const tw = brief.target_words;
    if (typeof tw !== 'number' || !Number.isFinite(tw) || tw !== Math.floor(tw) || tw <= 0) {
      return { ...result, target_words: null, source: 'invalid_target_words',
        error: `target_words must be a positive integer, got: ${JSON.stringify(tw)}` };
    }
    if (tw < UNIVERSAL_WORD_RANGE.min || tw > UNIVERSAL_WORD_RANGE.max) {
      return { ...result, target_words: null, source: 'out_of_range',
        error: `target_words ${tw} outside universal range ${UNIVERSAL_WORD_RANGE.min}-${UNIVERSAL_WORD_RANGE.max}` };
    }
    result.target_words = tw;
    result.source = 'explicit_target_words';
    if (fmtRange && (tw < fmtRange.min || tw > fmtRange.max)) {
      result.warnings.push(`Target word count ${tw} outside ${resolvedFormat.id} range ${fmtRange.min}-${fmtRange.max}`);
    }
    return result;
  }

  // Priority 2: Compute from target_duration + speaking_rate
  if (brief.target_duration !== undefined && brief.target_duration !== null) {
    const parsed = parseDuration(brief.target_duration);
    if (!parsed.valid) {
      return { ...result, target_words: null, source: 'invalid_duration', error: parsed.error };
    }
    result.duration = parsed;
    const words = computeWordCount(parsed.minutes, result.speaking_rate);
    if (words < UNIVERSAL_WORD_RANGE.min) {
      return { ...result, target_words: null, source: 'duration_below_minimum',
        error: `Duration "${brief.target_duration}" at ${result.speaking_rate.wpm} WPM yields ${words} words — below minimum ${UNIVERSAL_WORD_RANGE.min}` };
    }
    if (words > UNIVERSAL_WORD_RANGE.max) {
      return { ...result, target_words: null, source: 'duration_above_maximum',
        error: `Duration "${brief.target_duration}" at ${result.speaking_rate.wpm} WPM yields ${words} words — above maximum ${UNIVERSAL_WORD_RANGE.max}` };
    }
    result.target_words = words;
    result.source = 'computed_from_duration';
    if (fmtRange && (words < fmtRange.min || words > fmtRange.max)) {
      result.warnings.push(`Target word count ${words} outside ${resolvedFormat.id} range ${fmtRange.min}-${fmtRange.max}`);
    }
    return result;
  }

  // Priority 3: Format default
  if (resolvedFormat && resolvedFormat.word_range) {
    const defaultWords = Math.round((resolvedFormat.word_range.min + resolvedFormat.word_range.max) / 2);
    result.target_words = defaultWords;
    result.source = 'format_default';
    return result;
  }

  // Priority 4: Universal fallback
  result.target_words = 3000;
  result.source = 'universal_fallback';
  return result;
}

function estimateRuntime(spokenWords, speakingRate) {
  const rate = speakingRate || DEFAULT_RATE;
  const minutes = spokenWords / rate.wpm;
  const totalSeconds = Math.round(minutes * 60);
  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;

  return Object.freeze({
    spoken_words: spokenWords,
    speaking_rate: rate.id,
    wpm: rate.wpm,
    estimated_minutes: Math.round(minutes * 100) / 100,
    estimated_seconds: totalSeconds,
    display: displayMinutes > 0
      ? `~${displayMinutes}m ${displaySeconds}s`
      : `~${totalSeconds}s`,
    note: 'Estimate based on spoken narration words only — actual runtime may vary with pauses, pacing, and non-spoken material',
  });
}

function formatDurationDisplay(minutes) {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} seconds`;
  }
  if (minutes < 60) {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return s > 0 ? `${m} min ${s} sec` : `${m} minutes`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h} hours`;
}

export {
  SPEAKING_RATES,
  SPEAKING_RATE_SET,
  DEFAULT_RATE,
  UNIVERSAL_WORD_RANGE,
  getSpeakingRate,
  parseDuration,
  computeWordCount,
  resolveTargetWords,
  estimateRuntime,
  formatDurationDisplay,
};
