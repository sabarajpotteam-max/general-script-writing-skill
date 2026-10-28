# DYNAMIC WRITING STRATEGY ENGINE
**Phase 2A: Architecture Design** | **Tarikh:** 2026-10-28 | **Status:** DESIGN ONLY

---

## 1. PURPOSE

Yeh document LOOM architecture ka Layer 3 detail mein describe karta hai — **Strategy & Structure Engine** — jo client brief ke basis par DYNAMICALLY decide karta hai:
- Kaunsa narrative structure use hoga
- Kaunsi hook strategy
- Kaunsa pacing model
- Kaunsa voice/tone profile
- Kaunsi writing techniques (U/C/X rules ka kaunsa subset)
- Kaunse section templates

**Core principle:** Strategy SELECTED hoti hai, HARDCODED nahi. Same engine alag briefs ke liye alag strategies assemble karta hai.

---

## 2. STRATEGY ASSEMBLY PIPELINE

```
CLIENT BRIEF
    │
    ▼
┌─────────────────────────────┐
│  STEP 1: DIMENSION EXTRACT  │
│  Format, Content Type,       │
│  Duration, Audience,         │
│  Platform, Voice, Niche      │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  STEP 2: STRUCTURE SELECT   │
│  Arc template choose karo    │
│  based on format + content   │
│  + duration + user pref      │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  STEP 3: HOOK STRATEGY      │
│  Hook type select karo       │
│  based on format + audience  │
│  + content type              │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  STEP 4: PACING MODEL       │
│  Word budgets calculate karo │
│  Duration mapping, tension   │
│  curve, density calibration  │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  STEP 5: VOICE PROFILE      │
│  Narrator mode, tone,        │
│  formality, technical depth  │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  STEP 6: TECHNIQUE SELECT   │
│  Applicable U/C/X rules      │
│  assemble karo               │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  STEP 7: SECTION PLAN       │
│  Final section-by-section    │
│  writing plan generate karo  │
└─────────────────────────────┘
```

---

## 3. STEP 1: DIMENSION EXTRACTION

Client brief se 10 primary dimensions extract hote hain:

| Dimension | Source in Brief | Default if Missing | Example Values |
|---|---|---|---|
| **format** | `brief.format` | `documentary` (backward compat) | documentary, explainer, podcast_solo, short_form, screenplay, narrative, commercial, tutorial, news, audio_drama, stage_play, custom |
| **content_type** | `brief.content_type` OR inferred | Inferred from format + niche | factual, creative, hybrid, instructional |
| **duration_target** | `brief.target_duration` OR `brief.target_words` | Format default | "5 minutes", "2500 words", "30 seconds" |
| **audience** | `brief.audience` | general_adult | {age_range, knowledge_level, culture, language} |
| **platform** | `brief.platform` | generic | youtube, podcast_app, broadcast_tv, social_media, stage, radio, streaming |
| **voice_mode** | `brief.voice` OR inferred from format | Format default | single_narrator, host_guest, multi_character, brand_voice |
| **tone** | `brief.tone` | Format default | authoritative, conversational, playful, dramatic, intimate, comedic |
| **niche_context** | `brief.niche` + `brief.sub_niche` | open (Tier 3) | weather, military_tech, true_crime, cooking, finance, ... |
| **language** | `brief.language` | en | Any ISO 639-1 code |
| **objectives** | `brief.objectives` | inform | inform, persuade, entertain, educate, sell, inspire |

### 3.1 Content Type Inference Rules

Agar `content_type` explicitly nahi diya gaya:

```
IF format IN [documentary, news, explainer] → factual
IF format IN [narrative, screenplay, audio_drama, stage_play] → creative
IF format IN [tutorial] → instructional
IF format IN [commercial] → hybrid (persuasion + facts)
IF format IN [podcast_solo, podcast_interview] → inferred from niche:
    IF niche has evidence_requirement == mandatory → factual
    IF niche is entertainment/fiction → creative
    ELSE → hybrid
IF format = custom → MUST be explicitly specified in brief
IF format = short_form → inferred from objectives:
    IF objectives = inform/educate → factual
    IF objectives = entertain → creative
    IF objectives = sell/persuade → hybrid
```

---

## 4. STEP 2: NARRATIVE STRUCTURE SELECTION

### 4.1 Structure Selection Matrix

| Format | Content Type | Duration | → Default Structure |
|---|---|---|---|
| documentary | factual | standard (5-45 min) | **Investigation Arc** (current 8-section) |
| documentary | factual | short (< 5 min) | **Compressed Investigation** (5 sections) |
| explainer | factual/instructional | any | **Concept Progression Arc** |
| narrative | creative | standard+ | **Three-Act Structure** |
| narrative | hybrid | any | **Dual-Track Arc** (factual backbone + creative scenes) |
| podcast_solo | any | standard | **Segment Arc** |
| podcast_interview | any | any | **Interview Arc** |
| short_form | any | < 60s | **Micro Hook-Punch** |
| short_form | any | 60s-3 min | **Hook-Body-CTA** (platform-dependent: YouTube Shorts ≤ 3 min) |
| screenplay | creative | any | **Industry Act Structure** |
| news | factual | any | **Inverted Pyramid** |
| commercial | hybrid | 15-60s | **Problem-Solution-CTA** |
| tutorial | instructional | any | **Progressive Steps Arc** |
| audio_drama | creative | any | **Scene-Based Arc** |
| stage_play | creative | any | **Act/Scene Structure** |

### 4.2 User Override

Agar `brief.preferred_structure` specified hai, system:
1. Check karta hai ke structure format ke saath compatible hai
2. Agar compatible → use user's choice
3. Agar incompatible → HOLD_FORMAT_MISMATCH trigger + user ko option deta hai

### 4.3 Arc Template Library

**INVESTIGATION ARC** (current documentary — generalized):
```
sections:
  hook:         8-12%   | Grab attention
  problem:      12-15%  | Central question/tension
  discovery:    16-20%  | Key evidence/findings
  mechanism:    12-15%  | How/why explanation
  challenge:    12-15%  | Complications, counter-evidence
  resolution:   14-18%  | Synthesis, answer
  implications: 8-12%   | Broader significance
  outro:        5-8%    | Close, CTA
evidence: mandatory
voice: single_narrator (default)
```

**CONCEPT PROGRESSION ARC** (explainer) — **DESIGN TARGET:**
```
sections:
  hook:          10-15%  | Why this matters / surprising fact
  foundation:    15-20%  | Base concept, accessible entry
  build:         20-25%  | Layer complexity gradually
  example:       15-20%  | Real-world application / case study
  nuance:        10-15%  | Edge cases, common misconceptions
  synthesis:     10-15%  | Big picture, what to remember
  next_steps:    5-10%   | What to do / learn next
evidence: preferred
voice: conversational (default)
```

**THREE-ACT STRUCTURE** (narrative) — **DESIGN TARGET:**
```
sections:
  act1_setup:     25%   | World, characters, inciting incident
  act1_catalyst:  —     | (included in setup) turning point
  act2_rising:    25%   | Complications escalate
  act2_midpoint:  —     | (included in rising) stakes shift
  act2_crisis:    25%   | Maximum tension, all seems lost
  act3_climax:    15%   | Decisive confrontation/revelation
  act3_resolution: 10%  | New equilibrium, denouement
evidence: optional
voice: per character (default multi)
```

**HOOK-BODY-CTA** (short form) — **DESIGN TARGET:**
```
sections:
  hook:    15-25%  | Immediate attention grab (first 3 seconds)
  body:    50-65%  | Core message, value delivery
  cta:     15-25%  | Clear next action
evidence: content_type dependent
voice: direct_address (default)
word_range: 50-800
```

**SEGMENT ARC** (podcast solo) — **DESIGN TARGET:**
```
sections:
  intro:      8-12%   | Show open, episode topic, preview
  segment_1:  20-30%  | First main topic
  bridge_1:   3-5%    | Transition
  segment_2:  20-30%  | Second main topic
  bridge_2:   3-5%    | Transition
  segment_3:  15-25%  | Third topic / deep dive
  outro:      8-12%   | Recap, CTA, next episode tease
evidence: content_type dependent
voice: conversational_host (default)
```

**INTERVIEW ARC** (podcast interview) — **DESIGN TARGET:**
```
sections:
  intro:          10-15%  | Host introduces guest, topic
  warmup:         10-15%  | Easy opening question
  core_questions:  40-50% | Main interview blocks (3-5 questions)
  deep_dive:      15-20%  | Follow-up on most interesting thread
  rapid_fire:     5-10%   | (optional) Quick fun questions
  outro:          5-10%   | Guest plugs, CTA, sign-off
evidence: contextual (guest claims may need verification)
voice: host_guest
```

**INVERTED PYRAMID** (news) — **DESIGN TARGET:**
```
sections:
  lead:        15-20%  | Who, what, when, where, why (most important)
  key_details: 25-30%  | Essential supporting information
  context:     20-25%  | Background, history, significance
  quotes:      15-20%  | Expert/witness statements
  background:  10-15%  | Additional context (cut from bottom)
evidence: mandatory
voice: anchor (default)
```

**PROBLEM-SOLUTION-CTA** (commercial) — **DESIGN TARGET:**
```
sections:
  problem:    25-35%  | Pain point, viewer identifies
  agitate:    15-20%  | Why existing solutions fail
  solution:   25-35%  | Product/service introduction
  proof:      10-15%  | Social proof, testimonials, data
  cta:        10-15%  | Clear action step
evidence: hybrid (product claims must be verifiable)
voice: brand_voice
word_range: 50-500
```

**PROGRESSIVE STEPS ARC** (tutorial) — **DESIGN TARGET:**
```
sections:
  intro:       10-15%  | What you'll learn, prerequisites
  setup:       10-15%  | Tools, environment, materials needed
  step_1:      15-20%  | First action (simplest)
  step_2:      15-20%  | Build on step 1
  step_3:      15-20%  | Most complex action
  demo:        10-15%  | Show complete result
  troubleshoot: 5-10%  | Common mistakes, fixes
  summary:      5-10%  | Recap, next resources
evidence: preferred (steps should be verified)
voice: instructor (default)
```

---

## 5. STEP 3: HOOK STRATEGY SELECTION

### 5.1 Hook Selection Algorithm

```
INPUT: format, content_type, audience.knowledge_level, niche_context, objectives

SELECTION LOGIC:

1. Format-specific hook restrictions:
   news → MUST use Lead (journalism standard)
   commercial → MUST use Problem Statement or Direct Address
   tutorial → PREFER Problem Statement or Question

2. Content type affinity [UNVALIDATED DEFAULTS — weights are design-time
   heuristics, not empirically validated; subject to calibration via pilot data]:
   factual → Statistic (0.3), Question (0.3), Paradox (0.2), Scene (0.2)
   creative → Scene (0.4), Cold Open (0.3), Character (0.2), Teaser (0.1)
   instructional → Problem Statement (0.4), Question (0.3), Direct Address (0.3)
   hybrid → Scene (0.3), Contrast (0.3), Question (0.2), Statistic (0.2)

3. Audience adjustment:
   knowledge_level = expert → Paradox, Contrast preferred (avoid basics)
   knowledge_level = beginner → Question, Problem Statement preferred (accessible)
   knowledge_level = general → Any applicable

4. Duration adjustment:
   < 60 seconds → Direct Address, Statistic only (fastest hooks)
   60s - 3 min → Any non-extended hook (YouTube Shorts upper limit)
   3 - 5 min → Any non-extended hook
   5+ min → Any hook, including Scene and Cold Open (can afford setup time)

5. User override → always respected if compatible with format
```

### 5.2 Hook Types (Complete Registry)

| Hook Type | Mechanism | Best For | Duration Range | Evidence Need |
|---|---|---|---|---|
| **Scene** | Vivid moment that drops viewer into action | Documentary, narrative, drama | 5+ min | Any |
| **Question** | Provocative question viewer wants answered | Explainer, educational, mystery | Any | Any |
| **Statistic** | Surprising number that reframes topic | Data-driven, science, finance | Any | Factual (cite source) |
| **Contrast** | Before/after, expectation vs reality | Transformation, comparison | Any | Any |
| **Character** | Introduce compelling person/figure | Profile, biography, drama | 5+ min | Any |
| **Paradox** | Contradictory fact that intrigues | Science, explainer, mystery | 3+ min | Factual (X08 — EXPERIMENTAL) |
| **Cold Open** | Drop into scene mid-action, explain later | Drama, true crime, narrative podcast | 5+ min | Any |
| **Problem Statement** | "Have you ever struggled with..." | Tutorial, how-to, commercial | Any | Any |
| **Teaser** | Preview of payoff without spoiling | Episodic content, series | Any | Any |
| **Direct Address** | Speak directly to viewer's situation | Commercial, personal, motivational | Any | Any |
| **Lead** | 5 W's in opening sentence | News, current affairs | Any | Mandatory |

---

## 6. STEP 4: PACING MODEL

### 6.1 Word Budget Calculator

```
INPUT: total_target_words (or target_duration), arc_template

ALGORITHM:
1. Agar duration given → convert to words:
   words = duration_minutes × speaking_rate[voice_mode]

   SPEAKING RATES [UNVALIDATED DEFAULTS — industry-conventional estimates,
   not empirically calibrated for this system; actual rates vary by speaker]:
   standard_narration:     150 words/min
   conversational:         170 words/min
   energetic:              190 words/min
   deliberate_dramatic:    120 words/min
   anchor_news:            165 words/min
   podcast_casual:         175 words/min

2. Arc template se har section ka % lo
3. Per section: section_words = total_words × section_percentage
4. Validate: section_words >= section_minimum (format-dependent)
5. Duration < 60s → sections merge (e.g., hook+body = single section)
```

### 6.2 Tension Curve Model

**Current SKILL.md:** Implicit tension — discovery/mechanism/challenge sections create natural tension.

**Generalized model:**

```
TENSION CURVE TYPES [UNVALIDATED DEFAULTS — mappings are design-time
heuristics, not empirically validated; subject to calibration via pilot data]:

LINEAR_BUILD:
  Low → Medium → High → Peak → Resolution
  Best for: documentary, explainer, tutorial

WAVE:
  Medium → High → Low → Higher → Low → Highest → Resolution
  Best for: narrative, podcast (multiple segments), long-form

IMMEDIATE_HIGH:
  Peak → Sustain → Brief dip → Peak → Resolution
  Best for: news, short-form, commercial

SLOW_BURN:
  Low → Low → Medium → Medium → High → Peak → Resolution
  Best for: mystery, true crime, character study

ROLLER_COASTER:
  High → Low → Higher → Lower → Highest → Resolution
  Best for: comedy, entertainment, variety

DEFAULT MAPPING:
  format=documentary       → LINEAR_BUILD
  format=narrative         → WAVE
  format=news              → IMMEDIATE_HIGH
  format=short_form        → IMMEDIATE_HIGH
  format=podcast_solo      → WAVE
  format=commercial        → IMMEDIATE_HIGH (problem=peak, solution=relief)
  format=tutorial          → LINEAR_BUILD
  format=explainer         → LINEAR_BUILD
```

### 6.3 Information Density Calibration

| Audience Knowledge Level | Concepts per 500 words | Jargon Allowed? | Explanation Depth |
|---|---|---|---|
| expert | 8-12 | Yes, domain terminology expected | Minimal — assume familiarity |
| intermediate | 5-8 | Yes, with first-use definition | Moderate — define once, then use freely |
| general | 3-5 | No — plain language (U01-U07) | Full — explain every concept |
| beginner / children | 1-3 | No | Extended — use analogies, repeat key points |

**[UNVALIDATED DEFAULTS]** — Concept-per-500-word ranges are design-time heuristics derived from educational content guidelines. Not empirically calibrated for this system. Subject to validation via pilot scripts.

---

## 7. STEP 5: VOICE PROFILE ASSEMBLY

### 7.1 Voice Profile Structure

```
VOICE_PROFILE:
  narrator_mode:
    type: single | dual | multi | host_guest
    voices: [
      { id: "narrator", role: "primary narrator", characteristics: {...} }
      { id: "host", role: "interview host", characteristics: {...} }
      { id: "guest_1", role: "guest expert", characteristics: {...} }
    ]
  
  tone_parameters:
    formality: 1-5 (1=very casual, 5=very formal)
    warmth: 1-5 (1=clinical, 5=intimate)
    authority: 1-5 (1=exploratory, 5=definitive)
    humor: 0-3 (0=none, 3=comedy-forward)
    energy: 1-5 (1=calm/meditative, 5=high-energy)
  
  language_rules:
    reading_level: grade_level (C08 activated when specified)
    sentence_length: {avg: X, max: Y}
    paragraph_length: {avg: X, max: Y}
    jargon_policy: allow | define_on_first_use | avoid
    contractions: allow | avoid (formal writing)
  
  brand_voice: (optional, from client brief)
    guidelines: "string — client's brand voice description"
    keywords_to_use: [...]
    keywords_to_avoid: [...]
    reference_samples: [...]
```

### 7.2 Default Voice Profiles by Format

| Format | Narrator Mode | Formality | Warmth | Authority | Humor | Energy |
|---|---|---|---|---|---|---|
| documentary | single | 4 | 3 | 4 | 0 | 3 |
| explainer | single | 2 | 4 | 3 | 1 | 4 |
| narrative | multi | 3 | 3 | 3 | varies | 3 |
| podcast_solo | single | 2 | 4 | 3 | 1 | 3 |
| podcast_interview | host_guest | 2 | 4 | 3 | 1 | 3 |
| short_form | single | 1 | 3 | 3 | 2 | 5 |
| screenplay | multi | 3 | varies | varies | varies | varies |
| news | single | 5 | 2 | 5 | 0 | 3 |
| commercial | single | 2 | 4 | 3 | 1 | 4 |
| tutorial | single | 2 | 4 | 4 | 0 | 3 |

---

## 8. STEP 6: TECHNIQUE SELECTION (Writing Rules Assembly)

### 8.1 Rule Activation Logic

Har writing session ke liye, applicable rules DYNAMICALLY assemble hote hain:

```
ACTIVE_RULES = []

# STEP 1: Always include UNIVERSAL rules
ACTIVE_RULES += U01-U24  # (with modifications per content_type)

# STEP 2: Check CONDITIONAL rules (preserved C01-C13 + new CN01-CN07)
FOR each C_rule in C01-C13:
    IF C_rule.condition evaluates TRUE for this brief:
        ACTIVE_RULES += C_rule
FOR each CN_rule in CN01-CN07:
    IF CN_rule.condition evaluates TRUE for this brief:
        ACTIVE_RULES += CN_rule  # CN-series: DESIGN TARGET, separate namespace

# STEP 3: Check EXPERIMENTAL techniques
FOR each X_rule in X01-X08:
    IF user explicitly requested OR format strongly benefits:
        ACTIVE_RULES += X_rule  # MUST be labelled EXPERIMENTAL in output

# STEP 4: Format-specific rules
ACTIVE_RULES += FORMAT_RULES[resolved_format]

# STEP 5: Niche-specific rules
IF niche_tier == 1 (registered):
    ACTIVE_RULES += NICHE_ADAPTER[niche_code].rules
IF niche_tier == 2 (recognized):
    ACTIVE_RULES += DOMAIN_OVERLAY[recognized_domain].rules
IF niche_tier == 3 (open):
    ACTIVE_RULES += CROSS_CUTTING_OVERLAYS[detected_overlays].rules
    # UNIVERSAL rules already included — this adds safety overlays

# STEP 6: Content type modifications
IF content_type == creative:
    MODIFY U08 → "evidence traceability optional, fiction frame required"
    MODIFY U10 → "no presenting fiction as fact"
    DEACTIVATE U14-U19 (measurement — not applicable to fiction)
IF content_type == instructional:
    MODIFY U08 → "accuracy verification required, formal citation optional"
```

### 8.2 Conditional Rule Trigger Table

| Rule | Condition | When TRUE |
|---|---|---|
| C01 | niche == N01 (weather) | Forecast staleness check active |
| C02 | niche == N02 (military) | OPSEC check active |
| C03 | niche == N03 (WW history) | Era scope + dignity check |
| C04 | niche == N04 (disaster) | Casualty/cause attribution rules |
| C05 | niche == N05 (psychology) | Study citation + replication rules |
| C06 | content includes statistics | Statistical reporting rules |
| C07 | content includes quotes | Quote attribution rules |
| C08 | audience.knowledge_level specified | Reading level adaptation |
| C09 | content references living persons | Privacy/defamation rules |
| C10 | content references minors | Child safety rules |
| C11 | content includes health claims | Medical claim overlay |
| C12 | content includes financial claims | Financial claim overlay |
| C13 | content in non-English language | Translation/localization rules |
| **CN01** | voice_mode == multi_character | Character voice differentiation | **DESIGN TARGET** |
| **CN02** | platform specified | Platform formatting rules | **DESIGN TARGET** |
| **CN03** | duration < 5 minutes | Short-form pacing rules | **DESIGN TARGET** |
| **CN04** | brand_voice defined | Brand consistency rules | **DESIGN TARGET** |
| **CN05** | humor > 0 in voice profile | Humor calibration (EXPERIMENTAL methodology) | **DESIGN TARGET** |
| **CN06** | audience.knowledge_level != general | Audience adaptation rules | **DESIGN TARGET** |
| **CN07** | language != source language | Localization rules | **DESIGN TARGET** |

**Note:** CN-series rules use a separate namespace from existing C01-C13 to preserve existing rule IDs, definitions, provenance and approval states. See `references/writing_rules.md` for canonical C01-C13 definitions.

### 8.3 Experimental Technique Registry

| Technique | Source | Epistemic Status | Activation |
|---|---|---|---|
| X01 | K017 — tension alternation | preliminary | User opt-in or narrative format |
| X02 | K024 — micro-narrative embedding | preliminary | Long-form + engagement objective |
| X03 | K038 — cognitive load sequencing | preliminary | Tutorial/explainer format |
| X04 | K009 — emotional state tracking | preliminary | Narrative/drama format |
| X05 | K042 — pattern interruption | preliminary | Entertainment/comedy format |
| X06 | K015 — suspense micro-dosing | preliminary | Mystery/true crime format |
| X07 | F-023 — gather-point convergence | preliminary | Interactive/branching narrative |
| X08 | Paradox hook | preliminary | Science/explainer with expert audience |

**Har EXPERIMENTAL technique ka output mein label mandatory hai:** `[EXPERIMENTAL: X0N — technique_name]`

---

## 9. STEP 7: SECTION PLAN GENERATION

### 9.1 Final Writing Plan Structure

Strategy assembly ka output ek **Section Plan** hai jo Generation Engine ko diya jata hai:

```yaml
WRITING_PLAN:
  metadata:
    brief_id: "unique hash"
    generated_at: "timestamp"
    skill_version: "X.Y.Z"
  
  strategy_summary:
    format: "documentary"
    content_type: "factual"
    structure: "investigation_arc"
    hook_type: "statistic"
    tension_curve: "linear_build"
    voice_profile: {narrator: single, formality: 4, warmth: 3, authority: 4}
    total_words: 4500
    estimated_duration: "30 minutes at 150 wpm"
    active_rules: [U01-U24, C01, C06, C08]
    experimental_techniques: [X01]
    niche_tier: 1
    niche_adapter: "N01_weather"
    evidence_mode: "mandatory"
    language: "en"
    platform: "youtube"
  
  sections:
    - id: "S01"
      name: "Hook"
      template: "statistic_hook"
      word_budget: {min: 360, target: 450, max: 540}
      purpose: "Open with surprising weather statistic"
      evidence_required: true
      hook_type: "statistic"
      canonical_terms: [subject, mechanism]
      notes: "Must cite source for statistic"
    
    - id: "S02"
      name: "Problem"
      template: "problem_section"
      word_budget: {min: 540, target: 630, max: 675}
      purpose: "Establish the central weather question"
      evidence_required: true
      canonical_terms: [subject, object, mechanism]
      open_loops_to_create: ["central_question"]
    
    # ... remaining sections ...
    
    - id: "S08"
      name: "Outro"
      template: "outro_section"
      word_budget: {min: 225, target: 315, max: 360}
      purpose: "Close with resonance, future outlook"
      evidence_required: false
      open_loops_to_close: ["all_remaining"]
      cta: "subscribe, comment"
  
  qa_requirements:
    universal: [word_count, canonical_consistency, open_loop_closure, read_aloud, anti_ai]
    evidence: [traceability, epistemic_compliance, blocked_check]
    format: [section_budget_compliance, arc_completeness]
    niche: [N01_forecast_staleness, N01_agency_attribution]
    holds: [HOLD_STALE_FORECAST, HOLD_UNVERIFIED_FACT]
```

---

## 10. DYNAMIC NICHE RESOLUTION (DETAIL)

### 10.1 Resolution Algorithm

```
INPUT: brief.niche (string — free text or code)

STEP 1: EXACT MATCH — registered niche check
  IF input matches N01-N999 code → Tier 1 (registered)
  IF input matches registered niche name (e.g., "weather", "military") → Tier 1

STEP 2: DOMAIN MATCH — recognized domain check
  Tokenize input → match against RECOGNIZED_DOMAINS list
  IF confidence > 0.8 → Tier 2 (recognized domain)
  Apply domain overlay + all matching cross-cutting overlays

STEP 3: SEMANTIC ANALYSIS — open niche
  IF no Tier 1 or Tier 2 match:
    a) Extract topic keywords
    b) Classify content sensitivity:
       LOW:  entertainment, lifestyle, DIY, food, travel, personal development
       MEDIUM: technology, business, sports, gaming, culture, arts
       HIGH: health, finance, law, politics, religion, children, conflict
    c) Determine applicable cross-cutting overlays
    d) Assemble policy: UNIVERSAL + content_type rules + detected overlays
    e) IF sensitivity == HIGH:
         Trigger HOLD_DOMAIN_UNKNOWN
         Message: "High-stakes topic without registered adapter.
                   UNIVERSAL safety rules + [detected] overlays applied.
                   Human review recommended before publication."
    f) Proceed with Tier 3 — open niche

STEP 4: OUTPUT niche resolution result
  {
    tier: 1|2|3,
    niche_code: "N01" | null,
    recognized_domain: "health" | null,
    cross_cutting_overlays: ["medical_claim", "sensitive_subject"],
    content_sensitivity: "high",
    applicable_rules: [...],
    holds_triggered: ["HOLD_DOMAIN_UNKNOWN"],
    confidence: 0.0-1.0,
    message: "Tier 3 open niche: 'cryptocurrency trading strategies'.
              Recognized overlays: financial_claim. Sensitivity: HIGH.
              HOLD_DOMAIN_UNKNOWN triggered."
  }
```

### 10.2 Cross-Cutting Overlays (Detail)

| Overlay | Triggered When | Rules Added |
|---|---|---|
| **sensitive_subject** | Topic involves death, violence, trauma, discrimination, mental health | Dignity protocol, trigger warnings, no gratuitous detail |
| **medical_claim** | Any health/medical assertion detected | Must cite peer-reviewed source, epistemic qualifier mandatory, "consult professional" disclaimer |
| **financial_claim** | Any investment/financial assertion detected | "Not financial advice" disclaimer, source required, past performance caveat |
| **legal_claim** | Any legal assertion detected | "Not legal advice" disclaimer, jurisdiction caveat |
| **child_safety** | Content targets or involves minors | Age-appropriate language, no identifying info, COPPA awareness |
| **active_conflict** | Topic involves ongoing military/political conflict | Multi-perspective, no propaganda, casualty figures provisional, source verification |
| **synthetic_media** | AI-generated imagery/video/audio referenced | Disclosure required, no deceptive use |
| **current_event** | Topic is time-sensitive (< 30 days old) | Staleness check, provisional language, update caveat |
| **translated** | Source material in different language than output | Translation qualifier, original language citation |

---

## 11. STRATEGY ENGINE VS CURRENT SKILL COMPARISON

| Aspect | Current SKILL.md | Strategy Engine |
|---|---|---|
| Structure selection | Hardcoded documentary arc | Dynamic from 10+ arc templates |
| Hook selection | 5 types, no selection algorithm | 11 types with algorithmic selection |
| Pacing | Fixed word budget percentages | Adaptive based on duration + audience |
| Voice | Single narrator only | Multi-voice profiles with parameter tuning |
| Rules activation | All rules always apply | Conditional activation based on brief |
| Niche handling | N01-N05 hardcoded | 3-tier dynamic resolution |
| Content type | Factual mandatory | 4 content types with different evidence modes |
| Duration | 2500-8000 words fixed | 50 words to 25000+ words |
| Platform | None | Platform-specific formatting |
| Audience | None | 4-level adaptation |

---

## 12. UNRESOLVED DESIGN QUESTIONS

| Question | Impact | Options | Recommendation |
|---|---|---|---|
| **Q1:** Should strategy be visible to user before writing starts? | Transparency vs speed | Show summary / show full plan / skip | **Show summary** — user can override before generation |
| **Q2:** Should experimental techniques require explicit opt-in? | Safety vs quality | Always ask / format-default / smart-default | **Smart-default** — format defaults with user override |
| **Q3:** How to handle conflicting overlays? | Edge cases | Union (most restrictive) / priority stack / ask user | **Union (most restrictive)** — safety first |
| **Q4:** Should open niches (Tier 3) be saved as new adapters? | Learning | Auto-save / save on request / never | **Save on request** — user curates their adapter library |
| **Q5:** How granular should audience adaptation be? | Complexity vs quality | 4 levels / continuous scale / persona-based | **4 levels** (beginner, general, intermediate, expert) — sufficient for V1 |

---

## 13. CONCLUSION (Roman Urdu)

**Dynamic Writing Strategy Engine current SKILL.md ka sabse bada limitation solve karta hai: hardcoded decisions ko runtime decisions mein convert karta hai.**

Key innovations:
1. **Dimension extraction** — 10 orthogonal dimensions se strategy assemble hoti hai
2. **Structure selection matrix** — format + content_type + duration = appropriate arc
3. **Rule activation logic** — sirf relevant rules activate hoti hain, sab nahi
4. **3-tier niche resolution** — unknown niches analyzed hoti hain, rejected nahi
5. **Cross-cutting overlays** — safety rules topic se detect hote hain, niche code se nahi

**Strategy Engine SKILL.md ka "brain" hai — yeh decide karta hai KYA likhna hai aur KAISE, jabke Generation Engine actually likhta hai.**

**DESIGN TARGET Declarations:**
- Format coverage (all arc templates and hook types) → **DESIGN TARGET** until end-to-end pilot scripts per format validate it
- Language coverage (multi-language strategy assembly) → **DESIGN TARGET** until non-English pilot scripts validate it
- Backward compatibility (current documentary strategy preserved) → **DESIGN TARGET** until executed regression tests establish it

**Phase 2A DESIGN ONLY — koi code implement nahi kiya gaya.**
