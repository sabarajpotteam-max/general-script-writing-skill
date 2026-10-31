// voice_engine.mjs — M5 Multi-Voice Output Engine
// Status: RESEARCH_ONLY — not approved for production

const VOICE_MODES = Object.freeze({
  single_narrator: Object.freeze({
    id: 'single_narrator',
    label: 'Single Narrator',
    labels: Object.freeze(['NARRATOR']),
    min_speakers: 1,
    max_speakers: 1,
    description: 'Single speaker narration',
  }),
  host_guest: Object.freeze({
    id: 'host_guest',
    label: 'Host & Guest',
    labels: Object.freeze(['HOST', 'GUEST']),
    min_speakers: 2,
    max_speakers: 3,
    description: 'Host with one or more guests',
    optional_labels: Object.freeze(['GUEST_2']),
  }),
  multi_character: Object.freeze({
    id: 'multi_character',
    label: 'Multi-Character',
    labels: null,
    min_speakers: 2,
    max_speakers: 20,
    description: 'Named character dialogue',
  }),
  interview: Object.freeze({
    id: 'interview',
    label: 'Interview',
    labels: Object.freeze(['INTERVIEWER', 'INTERVIEWEE']),
    min_speakers: 2,
    max_speakers: 2,
    description: 'Interviewer and interviewee format',
  }),
  brand_voice: Object.freeze({
    id: 'brand_voice',
    label: 'Brand Voice',
    labels: Object.freeze(['NARRATOR']),
    min_speakers: 1,
    max_speakers: 1,
    description: 'Brand-aware single-speaker narration',
  }),
});

const VOICE_MODE_SET = new Set(Object.keys(VOICE_MODES));

const VALID_TONES = Object.freeze([
  'authoritative', 'conversational', 'intimate', 'dramatic',
  'playful', 'comedic', 'formal', 'casual',
]);
const TONE_SET = new Set(VALID_TONES);

const FORMAT_VOICE_DEFAULTS = Object.freeze({
  documentary: 'single_narrator',
  explainer: 'single_narrator',
  short_form: 'single_narrator',
  custom: 'single_narrator',
});

function resolveVoiceMode(brief, resolvedFormat) {
  const result = {
    mode: null,
    tone: null,
    formality: null,
    humor_level: 0,
    speaker_roster: [],
    labels: [],
    transitions: [],
    constraints: [],
    warnings: [],
    brand_voice: null,
    source: null,
  };

  const voice = brief.voice || {};
  const requestedMode = voice.mode || null;

  if (requestedMode) {
    if (!VOICE_MODE_SET.has(requestedMode)) {
      return {
        ...result,
        error: `Unknown voice mode "${requestedMode}" — must be one of: ${[...VOICE_MODE_SET].join(', ')}`,
      };
    }
    result.mode = requestedMode;
    result.source = 'explicit';
  } else {
    const fmtDefault = resolvedFormat
      ? (resolvedFormat.voice_default || FORMAT_VOICE_DEFAULTS[resolvedFormat.id] || 'single_narrator')
      : 'single_narrator';
    if (VOICE_MODE_SET.has(fmtDefault)) {
      result.mode = fmtDefault;
    } else {
      result.mode = 'single_narrator';
    }
    result.source = 'format_default';
  }

  if (voice.tone) {
    if (!TONE_SET.has(voice.tone)) {
      result.warnings.push(`Unknown tone "${voice.tone}" — ignored`);
    } else {
      result.tone = voice.tone;
    }
  }

  if (voice.formality !== undefined && voice.formality !== null) {
    const f = Number(voice.formality);
    if (!Number.isInteger(f) || f < 1 || f > 5) {
      result.warnings.push(`Formality must be integer 1-5, got "${voice.formality}" — ignored`);
    } else {
      result.formality = f;
    }
  }

  if (voice.humor_level !== undefined && voice.humor_level !== null) {
    const h = Number(voice.humor_level);
    if (!Number.isInteger(h) || h < 0 || h > 3) {
      result.warnings.push(`humor_level must be integer 0-3, got "${voice.humor_level}" — ignored`);
    } else {
      result.humor_level = h;
    }
  }

  const modeDef = VOICE_MODES[result.mode];

  if (result.mode === 'multi_character') {
    const characters = brief.characters || [];
    if (characters.length < 2) {
      return {
        ...result,
        error: 'multi_character mode requires at least 2 characters in brief.characters',
      };
    }
    result.labels = characters.map(c => c.name.toUpperCase().replace(/\s+/g, '_'));
    result.speaker_roster = characters.map(c => ({
      label: c.name.toUpperCase().replace(/\s+/g, '_'),
      name: c.name,
      role: c.role || 'supporting',
      voice_characteristics: c.voice_characteristics || null,
    }));
  } else if (result.mode === 'host_guest') {
    result.labels = ['HOST', 'GUEST'];
    result.speaker_roster = [
      { label: 'HOST', name: 'Host', role: 'host' },
      { label: 'GUEST', name: 'Guest', role: 'guest' },
    ];
    if (voice.guest_2 || (brief.characters && brief.characters.length > 2)) {
      result.labels.push('GUEST_2');
      result.speaker_roster.push({ label: 'GUEST_2', name: 'Guest 2', role: 'guest' });
    }
  } else {
    result.labels = [...modeDef.labels];
    result.speaker_roster = modeDef.labels.map(l => ({
      label: l,
      name: l.charAt(0) + l.slice(1).toLowerCase(),
      role: l.toLowerCase(),
    }));
  }

  if (result.mode === 'brand_voice') {
    const bv = brief.brand_voice || {};
    if (!bv.guidelines) {
      return {
        ...result,
        error: 'brand_voice mode requires brand_voice.guidelines in brief',
      };
    }
    result.brand_voice = {
      guidelines: bv.guidelines,
      keywords_include: Array.isArray(bv.keywords_include) ? bv.keywords_include : [],
      keywords_exclude: Array.isArray(bv.keywords_exclude) ? bv.keywords_exclude : [],
      reference_url: bv.reference_url || null,
    };
    result.constraints.push('Follow brand voice guidelines');
    if (result.brand_voice.keywords_exclude.length > 0) {
      result.constraints.push(`Avoid keywords: ${result.brand_voice.keywords_exclude.join(', ')}`);
    }
    if (result.brand_voice.keywords_include.length > 0) {
      result.constraints.push(`Include keywords: ${result.brand_voice.keywords_include.join(', ')}`);
    }
  }

  if (result.speaker_roster.length > 1) {
    result.transitions = result.labels.flatMap((from, i) =>
      result.labels.filter((_, j) => j !== i).map(to => `${from} → ${to}`)
    );
  }

  return result;
}

function validateSpeakerLabels(scriptText, voiceResolution) {
  const findings = [];
  const lines = scriptText.split('\n');
  const approvedLabels = new Set(voiceResolution.labels);
  const labelPattern = /^([A-Z][A-Z0-9_]*)\s*:/;
  const sceneDirectionPattern = /^\[/;
  const headingPattern = /^#{2,3}\s/;
  const foundLabels = new Set();
  const labelCounts = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (sceneDirectionPattern.test(line)) continue;
    if (headingPattern.test(line)) continue;

    const match = line.match(labelPattern);
    if (match) {
      const label = match[1];
      foundLabels.add(label);
      labelCounts[label] = (labelCounts[label] || 0) + 1;

      if (!approvedLabels.has(label)) {
        findings.push({
          type: 'unrecognized_speaker',
          line: i + 1,
          label,
          message: `Unrecognized speaker "${label}" — not in approved roster: ${[...approvedLabels].join(', ')}`,
        });
      }
    }
  }

  for (const required of approvedLabels) {
    if (!foundLabels.has(required)) {
      findings.push({
        type: 'missing_speaker',
        label: required,
        message: `Required speaker "${required}" not found in script`,
      });
    }
  }

  if (voiceResolution.mode !== 'single_narrator' && voiceResolution.mode !== 'brand_voice') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (sceneDirectionPattern.test(line)) continue;
      if (headingPattern.test(line)) continue;
      if (/^\|/.test(line)) continue;
      if (/^---/.test(line)) continue;
      if (/^>/.test(line)) continue;
      if (/^\*\*[A-Z_]+\*\*/.test(line)) continue;

      const hasLabel = labelPattern.test(line);
      if (!hasLabel && line.length > 10) {
        findings.push({
          type: 'unlabeled_dialogue',
          line: i + 1,
          message: `Possible unlabeled dialogue at line ${i + 1} — multi-voice scripts require speaker labels`,
        });
      }
    }
  }

  return {
    findings,
    found_labels: [...foundLabels],
    label_counts: labelCounts,
    all_labels_valid: findings.filter(f => f.type === 'unrecognized_speaker').length === 0,
    all_required_present: findings.filter(f => f.type === 'missing_speaker').length === 0,
  };
}

function checkBrandVoiceCompliance(scriptText, brandVoice) {
  if (!brandVoice) return { compliant: true, violations: [] };

  const violations = [];
  const bodyLower = scriptText.toLowerCase();

  for (const kw of brandVoice.keywords_exclude) {
    if (bodyLower.includes(kw.toLowerCase())) {
      violations.push({
        type: 'excluded_keyword',
        keyword: kw,
        message: `Excluded keyword "${kw}" found in script`,
      });
    }
  }

  const missingRequired = [];
  for (const kw of brandVoice.keywords_include) {
    if (!bodyLower.includes(kw.toLowerCase())) {
      missingRequired.push(kw);
    }
  }
  if (missingRequired.length > 0) {
    violations.push({
      type: 'missing_required_keywords',
      keywords: missingRequired,
      message: `Required brand keywords missing: ${missingRequired.join(', ')}`,
    });
  }

  return {
    compliant: violations.length === 0,
    violations,
  };
}

function countSpokenWordsMultiVoice(scriptText, voiceResolution) {
  const lines = scriptText.split('\n');
  const labelPattern = /^([A-Z][A-Z0-9_]*)\s*:\s*(.*)$/;
  const sceneDirectionPattern = /^\[/;
  const headingPattern = /^#{2,3}\s/;
  const speakerWords = {};
  let totalSpoken = 0;

  for (const label of voiceResolution.labels) {
    speakerWords[label] = 0;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (sceneDirectionPattern.test(trimmed)) continue;
    if (headingPattern.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;
    if (/^---/.test(trimmed)) continue;
    if (/^>/.test(trimmed)) continue;
    if (/^\*\*[A-Z_]+\*\*/.test(trimmed)) continue;

    const match = trimmed.match(labelPattern);
    if (match) {
      const label = match[1];
      const spoken = match[2].trim();
      const words = spoken.split(/\s+/).filter(w => w.length > 0).length;
      if (speakerWords[label] !== undefined) {
        speakerWords[label] += words;
      }
      totalSpoken += words;
    } else if (voiceResolution.mode === 'single_narrator' || voiceResolution.mode === 'brand_voice') {
      const words = trimmed.split(/\s+/).filter(w => w.length > 0).length;
      const primaryLabel = voiceResolution.labels[0];
      if (speakerWords[primaryLabel] !== undefined) {
        speakerWords[primaryLabel] += words;
      }
      totalSpoken += words;
    }
  }

  return {
    total_spoken_words: totalSpoken,
    speaker_words: speakerWords,
    speaker_distribution: Object.fromEntries(
      Object.entries(speakerWords).map(([k, v]) => [k, totalSpoken > 0 ? Math.round(v / totalSpoken * 100) : 0])
    ),
  };
}

export {
  VOICE_MODES,
  VOICE_MODE_SET,
  VALID_TONES,
  TONE_SET,
  FORMAT_VOICE_DEFAULTS,
  resolveVoiceMode,
  validateSpeakerLabels,
  checkBrandVoiceCompliance,
  countSpokenWordsMultiVoice,
};
