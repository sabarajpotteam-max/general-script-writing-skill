// structure_loader.mjs — M2 Format Router: modular structure/arc loader
// Status: RESEARCH_ONLY — not approved for production

import { getArcTemplate, getFormatDefinition, resolveFormat } from "./format_registry.mjs";

function loadStructure(brief) {
  const formatResult = resolveFormat(brief);

  if (formatResult.hold) {
    return {
      success: false,
      hold: formatResult.hold,
      structure: null,
    };
  }

  const format = formatResult.resolved;
  const arc = format.arc;

  const targetWords = brief.target_words
    ? brief.target_words
    : brief.target_duration
      ? estimateWordsFromDuration(brief.target_duration, format)
      : formatDefaultWords(format);

  const sections = arc.sections.map(s => {
    const minWords = Math.round(targetWords * s.min_pct / 100);
    const maxWords = Math.round(targetWords * s.max_pct / 100);
    return {
      id: s.id,
      label: s.label,
      min_pct: s.min_pct,
      max_pct: s.max_pct,
      min_words: minWords,
      max_words: maxWords,
      target_words: Math.round((minWords + maxWords) / 2),
    };
  });

  return {
    success: true,
    warning: formatResult.warning || null,
    structure: {
      format_id: format.id,
      format_name: format.name,
      format_status: format.status,
      arc_id: arc.id,
      arc_name: arc.name,
      evidence_requirement: format.evidence_requirement,
      voice_default: format.voice_default,
      spoken_word_budget_tolerance: format.spoken_word_budget_tolerance,
      target_words: targetWords,
      sections,
    },
  };
}

function estimateWordsFromDuration(durationStr, format) {
  if (!durationStr) return formatDefaultWords(format);
  const str = String(durationStr).toLowerCase().trim();
  if (str.length === 0) return formatDefaultWords(format);

  let minutes = 0;
  const minMatch = str.match(/^(\d+(?:\.\d+)?)\s*min/);
  const secMatch = str.match(/^(\d+(?:\.\d+)?)\s*s(?:ec)?/);
  const wordMatch = str.match(/^(\d+)\s*word/);

  if (wordMatch) {
    const w = parseInt(wordMatch[1], 10);
    return w > 0 ? w : formatDefaultWords(format);
  }
  if (minMatch) minutes = parseFloat(minMatch[1]);
  else if (secMatch) minutes = parseFloat(secMatch[1]) / 60;
  else {
    const numOnly = parseFloat(str);
    if (!isNaN(numOnly)) minutes = numOnly;
    else return formatDefaultWords(format);
  }

  if (!Number.isFinite(minutes) || minutes <= 0) return formatDefaultWords(format);

  const wordsPerMinute = 150;
  return Math.round(minutes * wordsPerMinute);
}

function formatDefaultWords(format) {
  if (!format || !format.word_range) return 3000;
  return Math.round((format.word_range.min + format.word_range.max) / 2);
}

function getWritingPlan(brief) {
  const result = loadStructure(brief);
  if (!result.success) return result;

  const plan = {
    ...result.structure,
    writing_instructions: buildInstructions(result.structure),
  };

  return { success: true, warning: result.warning, plan };
}

function buildInstructions(structure) {
  const lines = [];
  lines.push(`Format: ${structure.format_name} (${structure.format_status})`);
  lines.push(`Arc: ${structure.arc_name}`);
  lines.push(`Evidence: ${structure.evidence_requirement}`);
  lines.push(`Voice: ${structure.voice_default}`);
  lines.push(`Target: ~${structure.target_words} words (±${Math.round(structure.spoken_word_budget_tolerance * 100)}% tolerance)`);
  lines.push('');
  lines.push('Sections:');
  for (const s of structure.sections) {
    lines.push(`  ${s.label}: ${s.min_words}-${s.max_words} words (${s.min_pct}-${s.max_pct}%)`);
  }
  return lines.join('\n');
}

export { loadStructure, getWritingPlan, estimateWordsFromDuration, formatDefaultWords };
