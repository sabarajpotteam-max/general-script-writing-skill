// structure_loader.mjs — M2 Format Router: modular structure/arc loader
// Status: RESEARCH_ONLY — not approved for production

import { getArcTemplate, getFormatDefinition, resolveFormat } from "./format_registry.mjs";
import { resolveTargetWords, estimateRuntime } from "./duration_engine.mjs";
import { resolveVoiceMode } from "./voice_engine.mjs";

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

  // M4: Unified duration/word-count resolution
  const wordResolution = resolveTargetWords(brief, format);
  if (wordResolution.error) {
    return {
      success: false,
      hold: {
        type: 'HOLD_FORMAT_MISMATCH',
        severity: 'BLOCKING',
        message: wordResolution.error,
      },
      structure: null,
    };
  }
  const targetWords = wordResolution.target_words;

  const budgetResult = normalizeSectionBudgets(arc.sections, targetWords);
  if (budgetResult.error) {
    return {
      success: false,
      hold: {
        type: 'HOLD_FORMAT_MISMATCH',
        severity: 'BLOCKING',
        message: budgetResult.error,
      },
      structure: null,
    };
  }
  const sections = budgetResult.sections;

  // M4: Runtime estimate from spoken word target
  const runtimeEstimate = estimateRuntime(targetWords, wordResolution.speaking_rate);

  // M5: Voice mode resolution
  const voiceResolution = resolveVoiceMode(brief, format);

  return {
    success: true,
    warning: formatResult.warning || null,
    word_resolution: wordResolution,
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
      speaking_rate: wordResolution.speaking_rate,
      runtime_estimate: runtimeEstimate,
      voice: voiceResolution.error ? null : voiceResolution,
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

function normalizeSectionBudgets(arcSections, targetWords) {
  const totalMinPct = arcSections.reduce((s, sec) => s + sec.min_pct, 0);
  const totalMaxPct = arcSections.reduce((s, sec) => s + sec.max_pct, 0);

  if (totalMinPct > 100) {
    return { error: `Section minimum budgets sum to ${totalMinPct}% (> 100%) — infeasible budget` };
  }
  if (totalMaxPct < 100) {
    return { error: `Section maximum budgets sum to ${totalMaxPct}% (< 100%) — infeasible budget` };
  }

  // Compute exact min/max word counts (floor for min, ceil for max to be safe)
  const entries = arcSections.map(s => {
    const minWords = Math.floor(targetWords * s.min_pct / 100);
    const maxWords = Math.ceil(targetWords * s.max_pct / 100);
    const midPct = (s.min_pct + s.max_pct) / 2;
    const idealTarget = targetWords * midPct / 100;
    return { ...s, minWords, maxWords, idealTarget };
  });

  // Largest-remainder method for exact allocation:
  // 1. Floor each ideal target
  // 2. Clamp to [minWords, maxWords]
  // 3. Distribute remaining words by largest fractional remainder
  let floored = entries.map(e => {
    const base = Math.floor(e.idealTarget);
    const clamped = Math.max(e.minWords, Math.min(e.maxWords, base));
    return { ...e, allocated: clamped, remainder: e.idealTarget - clamped };
  });

  let totalAllocated = floored.reduce((s, e) => s + e.allocated, 0);
  let deficit = targetWords - totalAllocated;

  if (deficit > 0) {
    const sortable = floored.map((e, i) => ({ i, remainder: e.remainder }));
    sortable.sort((a, b) => b.remainder - a.remainder);
    while (deficit > 0) {
      let progress = false;
      for (const item of sortable) {
        if (deficit <= 0) break;
        if (floored[item.i].allocated < floored[item.i].maxWords) {
          floored[item.i].allocated += 1;
          deficit -= 1;
          progress = true;
        }
      }
      if (!progress) break;
    }
  } else if (deficit < 0) {
    const sortable = floored.map((e, i) => ({ i, remainder: e.remainder }));
    sortable.sort((a, b) => a.remainder - b.remainder);
    while (deficit < 0) {
      let progress = false;
      for (const item of sortable) {
        if (deficit >= 0) break;
        if (floored[item.i].allocated > floored[item.i].minWords) {
          floored[item.i].allocated -= 1;
          deficit += 1;
          progress = true;
        }
      }
      if (!progress) break;
    }
  }

  // Verify exact sum
  totalAllocated = floored.reduce((s, e) => s + e.allocated, 0);
  if (totalAllocated !== targetWords) {
    return { error: `Budget normalization failed: allocated ${totalAllocated} words but target is ${targetWords} — mathematically infeasible within constraints` };
  }

  const sections = floored.map(e => ({
    id: e.id,
    label: e.label,
    min_pct: e.min_pct,
    max_pct: e.max_pct,
    min_words: e.minWords,
    max_words: e.maxWords,
    target_words: e.allocated,
  }));

  return { sections };
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
  lines.push(`Speaking rate: ${structure.speaking_rate ? structure.speaking_rate.label : 'Standard Narration'} (${structure.speaking_rate ? structure.speaking_rate.wpm : 150} WPM)`);
  if (structure.voice) {
    lines.push(`Voice mode: ${structure.voice.mode}`);
    if (structure.voice.labels.length > 0) {
      lines.push(`Speaker labels: ${structure.voice.labels.join(', ')}`);
    }
    if (structure.voice.tone) {
      lines.push(`Tone: ${structure.voice.tone}`);
    }
    if (structure.voice.brand_voice) {
      lines.push(`Brand voice: ${structure.voice.brand_voice.guidelines}`);
    }
  }
  lines.push(`Target: ~${structure.target_words} words (±${Math.round(structure.spoken_word_budget_tolerance * 100)}% tolerance)`);
  if (structure.runtime_estimate) {
    lines.push(`Estimated runtime: ${structure.runtime_estimate.display}`);
  }
  lines.push('');
  lines.push('Sections:');
  for (const s of structure.sections) {
    lines.push(`  ${s.label}: ${s.min_words}-${s.max_words} words (${s.min_pct}-${s.max_pct}%)`);
  }
  return lines.join('\n');
}

export { loadStructure, getWritingPlan, estimateWordsFromDuration, formatDefaultWords, normalizeSectionBudgets };
