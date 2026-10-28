# CLIENT BRIEF INPUT SCHEMA
**Phase 2A: Architecture Design** | **Tarikh:** 2026-10-28 | **Status:** DESIGN ONLY

---

## 1. PURPOSE

Yeh document CLIENT BRIEF ka complete schema define karta hai — woh structured input jo har script request ke saath aata hai. Yeh current SKILL.md ke input schema ko GENERALIZE karta hai documentary-only se UNIVERSAL scriptwriting ke liye.

**Design principle:** Required fields minimum rakhein (taake barrier low ho), optional fields maximum (taake power users fine-tune kar sakein), aur smart defaults har jagah (taake missing fields workflow ko block na karein).

---

## 2. CURRENT VS PROPOSED SCHEMA COMPARISON

### 2.1 Current SKILL.md Input Schema

```yaml
# CURRENT — documentary only
title: "required — string"
niche: "required — enum: N01|N02|N03|N04|N05"
subject: "required — string (the entity being examined)"
object: "required — string (the outcome or phenomenon)"
mechanism: "required — string (how subject connects to object)"
uncertainty: "required — string (what remains unknown)"
target_words: "required — integer: 2500-8000"
evidence:
  - id: "E-001"
    claim: "string"
    source: "string"
    epistemic_status: "enum: confirmed|replicated|preliminary|disputed|qualified|hypothetical"
```

**Problems:**
- `niche` hardcoded to 5 values
- `subject/object/mechanism/uncertainty` documentary-specific (creative content ke liye meaningless)
- `evidence` list required (fiction content structurally impossible)
- `target_words` range too narrow (no short-form, no long-form)
- No audience, platform, format, language, voice fields

### 2.2 Proposed Universal Client Brief Schema

```yaml
# PROPOSED — universal
# ═══════════════════════════════════════════
# REQUIRED FIELDS (minimum viable brief)
# ═══════════════════════════════════════════

topic:
  type: string
  required: true
  description: "Script ka central topic ya subject. Free text."
  examples:
    - "The psychology of procrastination"
    - "How to make sourdough bread"
    - "A detective discovers their partner is the killer"
    - "Why the 2008 financial crisis happened"
  validation: "min 3 characters, max 500 characters"

audience:
  type: string
  required: true
  description: "Primary target audience. Free text ya structured."
  examples:
    - "general YouTube viewers"
    - "psychology students (undergraduate)"
    - "kids ages 8-12"
    - "professional investors"
    - "Urdu-speaking tech enthusiasts"
  validation: "min 3 characters"

language:
  type: string
  required: true
  description: "Primary output language. ISO 639-1 code ya language name."
  default: "en"
  examples: ["en", "de", "ur", "es", "hi", "ar", "fr", "zh", "ja", "ko"]
  validation: "valid ISO 639-1 code or recognized language name"

# ═══════════════════════════════════════════
# RECOMMENDED FIELDS (strongly encouraged)
# ═══════════════════════════════════════════

format:
  type: enum
  required: false
  default: "documentary"  # backward compatibility
  values:
    - documentary          # Long-form factual, investigation arc — VALIDATED (pilot scripts)
    - explainer            # Educational, concept progression — DESIGN TARGET
    - narrative            # Fiction/creative nonfiction, act structure — DESIGN TARGET
    - podcast_solo         # Single-host podcast — DESIGN TARGET
    - podcast_interview    # Host + guest(s) podcast — DESIGN TARGET
    - podcast_narrative    # Story-driven podcast — DESIGN TARGET
    - short_form           # YouTube Shorts (≤ 3 min), Reels, TikTok — DESIGN TARGET
    - screenplay           # Film/TV screenplay format — DESIGN TARGET
    - news                 # News bulletin, anchor script — DESIGN TARGET
    - commercial           # Ad, promotional video, brand story — DESIGN TARGET
    - tutorial             # How-to, step-by-step instructional — DESIGN TARGET
    - audio_drama          # Radio play, audio fiction — DESIGN TARGET
    - stage_play           # Theatre script — DESIGN TARGET
    - custom               # User-defined (requires custom_format_spec) — DESIGN TARGET
  description: "Script ka format. Agar missing, system infers from other fields."

niche:
  type: string
  required: false
  default: null  # Tier 3 open niche — system will analyze
  description: >
    Topic ka domain/niche. Free text — system dynamically resolves:
    - Registered codes (N01-N999) exact match → Tier 1
    - Domain names ("weather", "true crime", "cooking") → Tier 2
    - Any other text → Tier 3 (analyzed, not rejected)
  examples:
    - "N01"                    # Registered: USA Weather
    - "true crime"             # Domain: will match entertainment + sensitive_subject
    - "cryptocurrency DeFi"    # Open: will detect financial_claim overlay
    - "underwater basket weaving"  # Open: low sensitivity, will proceed with UNIVERSAL rules

sub_niche:
  type: string
  required: false
  default: null
  description: "Niche ke andar specific sub-category."
  examples:
    - niche: "weather" → sub_niche: "hurricane tracking"
    - niche: "cooking" → sub_niche: "fermentation and preserving"
    - niche: "technology" → sub_niche: "AI safety research"

# ═══════════════════════════════════════════
# OPTIONAL FIELDS (power user controls)
# ═══════════════════════════════════════════

content_type:
  type: enum
  required: false
  default: null  # inferred from format + niche
  values: [factual, creative, hybrid, instructional]
  description: >
    Evidence handling mode:
    - factual: every claim must cite evidence [E-XXX]
    - creative: fiction frame, evidence optional
    - hybrid: factual claims need evidence, creative elements don't
    - instructional: accuracy required, formal citation optional

research_mode:
  type: enum
  required: false
  default: "INFERRED"  # see inference rules below
  values: [client_provided, system_assisted, minimal]
  description: >
    §2.5 Research Integration — how evidence is sourced:
    - client_provided: client supplies evidence register (LEGACY BEHAVIOR, preserved
      for backward compatibility). Required for briefs with existing evidence register.
    - system_assisted: system researches topic-specific facts using available
      authorized research tools (web search, databases, APIs). Builds evidence
      register with source provenance, timestamp checks and factual verification.
      Client reviews register before generation. NEVER invents citations.
      NOTE: The S/F/R/K/V craft research library informs HOW to write (rules,
      techniques, formats) — it is NOT used for topic-specific factual research.
    - minimal: creative/instructional content, no formal evidence register needed
  inference_rules: >
    When research_mode is not explicitly set:
    - Brief includes evidence register (evidence field present + non-empty) → client_provided
    - Brief lacks evidence register → system_assisted (default for new briefs)
    - content_type = creative AND no evidence → minimal
    - Explicit research_mode always overrides inference
  constraints:
    - system_assisted with content_type=factual → system research phase before generation
    - system_assisted NEVER fabricates citations or sources
    - Missing evidence flagged as [UNRESOURCED], not silently omitted
    - When reliable evidence is unavailable → report limitation + HOLD unsupported claims
    - Generated evidence register is reviewable before script generation proceeds
    - Normal client needs only topic + niche + audience + format + duration — no evidence
      register or subject/object/mechanism fields required for system_assisted mode

target_duration:
  type: string
  required: false
  default: null  # format default applies
  description: "Target duration for spoken delivery. System calculates word count."
  examples: ["30 seconds", "2 minutes", "10 minutes", "45 minutes", "2 hours"]
  validation: "parseable duration string"

target_words:
  type: integer
  required: false
  default: null  # calculated from duration, or format default
  description: "Target word count. Overrides target_duration if both specified."
  validation: "min 50, max 50000"
  format_defaults:
    short_form: 200
    commercial: 150
    news: 500
    explainer: 1500
    documentary: 4500
    tutorial: 2000
    podcast_solo: 3000
    podcast_interview: 4000
    narrative: 5000
    screenplay: 10000  # ~100 pages at 1 min/page
    audio_drama: 5000
    stage_play: 8000

platform:
  type: enum
  required: false
  default: "generic"
  values:
    - youtube              # YouTube long-form
    - youtube_shorts       # YouTube Shorts (≤ 3 minutes)
    - podcast_app          # Apple Podcasts, Spotify, etc.
    - broadcast_tv         # Television broadcast
    - broadcast_radio      # Radio broadcast
    - streaming            # Netflix, HBO, etc.
    - social_media         # Instagram, TikTok, X
    - stage                # Live theatre
    - cinema               # Film/cinema
    - corporate            # Internal/corporate distribution
    - web                  # Website/blog embedded video
    - generic              # No platform-specific formatting
  description: "Target distribution platform. Affects formatting + duration rules."

objectives:
  type: array[enum]
  required: false
  default: ["inform"]
  values: [inform, persuade, entertain, educate, sell, inspire, warn, document]
  description: "Script ke primary objectives. Multiple select allowed."

voice:
  type: object
  required: false
  default: null  # format default applies
  properties:
    mode:
      type: enum
      values: [single_narrator, host_guest, multi_character, brand_voice, interview, panel]
      default: "single_narrator"
    tone:
      type: enum
      values: [authoritative, conversational, intimate, dramatic, playful, comedic, formal, casual]
      default: null  # format default
    formality:
      type: integer
      range: 1-5
      default: null  # format default
    humor_level:
      type: integer
      range: 0-3
      default: 0

brand_voice:
  type: object
  required: false
  default: null
  description: "Client ka brand voice definition. Sirf jab voice.mode = brand_voice."
  properties:
    guidelines:
      type: string
      description: "Brand voice description — tone, style, personality"
      example: "Warm, knowledgeable, slightly irreverent. Like a smart friend explaining something over coffee."
    keywords_include:
      type: array[string]
      description: "Brand-specific terms to use"
    keywords_exclude:
      type: array[string]
      description: "Terms to avoid"
    reference_url:
      type: string
      description: "Link to brand voice guide (optional)"

# ═══════════════════════════════════════════
# FACTUAL CONTENT FIELDS
# (active when content_type = factual | hybrid | instructional)
# ═══════════════════════════════════════════

subject:
  type: string
  required: false  # CHANGED from required to optional
  description: "Factual content: the entity being examined. For creative: protagonist."
  condition: "Required when content_type = factual"

object:
  type: string
  required: false
  description: "Factual content: the outcome or phenomenon."
  condition: "Required when content_type = factual"

mechanism:
  type: string
  required: false
  description: "Factual content: how subject connects to object."
  condition: "Required when content_type = factual"

uncertainty:
  type: string
  required: false
  description: "Factual content: what remains unknown or debated."
  condition: "Required when content_type = factual"

evidence:
  type: array[object]
  required: false  # CHANGED from required to content_type-dependent
  description: "Evidence items for factual claims."
  condition: "Required when content_type = factual. Optional for hybrid/instructional. Not applicable for creative."
  items:
    id:
      type: string
      pattern: "E-[0-9]{3}"
      required: true
    claim:
      type: string
      required: true
    source:
      type: string
      required: true
    epistemic_status:
      type: enum
      values: [confirmed, replicated, preliminary, disputed, qualified, hypothetical]
      required: true
    source_type:
      type: enum
      values: [meta_analysis, experimental, replication_study, primary_research,
               observational_longitudinal, critique, pilot_trial, expert_opinion,
               caption_pattern]
      required: false

# ═══════════════════════════════════════════
# CREATIVE CONTENT FIELDS
# (active when content_type = creative | hybrid)
# ═══════════════════════════════════════════

characters:
  type: array[object]
  required: false
  condition: "Applicable when content_type = creative | hybrid"
  items:
    name:
      type: string
    role:
      type: enum
      values: [protagonist, antagonist, supporting, narrator, background]
    description:
      type: string
    voice_characteristics:
      type: string
      description: "Kaise bolta hai — dialect, energy, catchphrases"

setting:
  type: object
  required: false
  condition: "Applicable when content_type = creative | hybrid"
  properties:
    time_period: { type: string, example: "1920s New York" }
    location: { type: string, example: "A small fishing village in Norway" }
    world_rules: { type: string, description: "Special rules of this world (sci-fi, fantasy, etc.)" }

premise:
  type: string
  required: false
  condition: "Applicable when content_type = creative"
  description: "Story premise — the central 'what if' or dramatic situation"
  example: "What if a time traveler accidentally prevents their own parents from meeting?"

preferred_structure:
  type: enum
  required: false
  values: [three_act, heros_journey, save_the_cat, five_act, kishōtenketsu,
           investigation_arc, concept_progression, custom]
  description: "User preference for narrative structure. Overrides format default."

# ═══════════════════════════════════════════
# ADVANCED FIELDS
# ═══════════════════════════════════════════

audience_detailed:
  type: object
  required: false
  description: "Structured audience definition (overrides audience string)."
  properties:
    age_range: { type: string, example: "25-45" }
    knowledge_level:
      type: enum
      values: [beginner, general, intermediate, expert]
      default: "general"
    cultural_context: { type: string, example: "South Asian, urban, English-educated" }
    prior_knowledge: { type: string, description: "What audience already knows" }
    pain_points: { type: string, description: "What problems audience has" }

custom_requirements:
  type: array[string]
  required: false
  description: "Any special requirements not covered by other fields."
  examples:
    - "Include B-roll suggestions for each section"
    - "Maintain a maximum 3rd-grade reading level"
    - "Avoid any reference to competitor brand X"
    - "Must include a 30-second sponsor break at the 5-minute mark"
    - "Use Socratic method throughout"

experimental_techniques:
  type: array[enum]
  required: false
  values: [X01, X02, X03, X04, X05, X06, X07, X08, XN01, XN02, XN03, XN04, XN05, XN06]
  description: "Explicit opt-in for experimental writing techniques. X01-X08 are canonical (from references/writing_rules.md). XN01-XN06 are proposed new techniques (require separate validation). All labelled EXPERIMENTAL in output."

custom_format_spec:
  type: object
  required: false
  condition: "Required when format = custom"
  description: "User-defined format specification."
  properties:
    name: { type: string, description: "Custom format name" }
    sections:
      type: array[object]
      items:
        name: { type: string }
        budget_percent: { type: string, example: "15-20%" }
        purpose: { type: string }
    evidence_requirement:
      type: enum
      values: [mandatory, preferred, contextual, optional]
    voice_model:
      type: string
      description: "Expected voice/speaker arrangement"
```

---

## 3. VALIDATION RULES

### 3.1 Required Field Validation

| Field | Rule | Error if Violated |
|---|---|---|
| `topic` | Non-empty, 3-500 chars | "Topic is required. Please describe what the script is about." |
| `audience` | Non-empty, 3+ chars | "Target audience is required. Who is this script for?" |
| `language` | Valid ISO 639-1 or recognized name | "Unrecognized language. Please use ISO code (e.g., 'en') or full name." |

### 3.2 Conditional Validation

| Condition | Required Fields | Error if Missing |
|---|---|---|
| content_type = factual AND research_mode = client_provided | subject, object, mechanism, uncertainty, evidence (≥ 1 item) | "Factual content with client-provided evidence requires subject, object, mechanism, uncertainty, and at least one evidence item." |
| content_type = factual AND research_mode = system_assisted | topic sufficient (subject/object/mechanism optional — system derives from topic research) | "System-assisted research mode: system researches topic-specific facts using authorized research tools. Client reviews evidence register before generation. See §2.5 Research Integration." |
| content_type = hybrid | evidence for factual claims only | "Hybrid content: evidence required for factual claims. Tag which claims are factual vs creative." |
| format = custom | custom_format_spec | "Custom format requires custom_format_spec with sections defined." |
| voice.mode = brand_voice | brand_voice object | "Brand voice mode requires brand_voice guidelines." |
| platform = youtube_shorts | normalized_estimated_duration ≤ 180s (computed from target_words at speaking_rate if target_duration absent; both must satisfy limit when both present) | "YouTube Shorts maximum 3 minutes (180 seconds)." |

### 3.3 Cross-Field Validation

| Rule | Logic | HOLD Triggered |
|---|---|---|
| Duration vs format | target_duration must fit format range | HOLD_FORMAT_MISMATCH |
| Evidence vs content_type | evidence list must match content_type expectation | Warning (not HOLD) |
| Niche vs sensitivity | High-sensitivity niche without registered adapter | HOLD_DOMAIN_UNKNOWN |
| Audience vs content | Adult content flagged for child audience | HOLD_AUDIENCE_RISK |
| Platform vs duration | Platform limits respected (YouTube Shorts ≤ 3 min, TikTok per current limits, etc.) | HOLD_PLATFORM_COMPLIANCE |

### 3.4 Blocked Content Enforcement

```
# Same as current — RETAIN
BLOCKED_SOURCES = ["F-190", "R052"]
QUARANTINED = ["K029", "K030", "K031"]
CAVEATED_SOURCES = ["B70", "B71", "B72"]

# New: check evidence items against blocked list
FOR each evidence_item in brief.evidence:
    IF evidence_item.source IN BLOCKED_SOURCES → REJECT with reason
    IF evidence_item.source IN QUARANTINED → REJECT with reason
    IF evidence_item.source IN CAVEATED_SOURCES → ADD caveat label
```

---

## 4. SMART DEFAULTS SYSTEM

### 4.1 Default Resolution Order

Jab ek optional field missing hai:

```
1. Client brief explicit value → USE THIS
2. Format-specific default → USE IF #1 missing
3. Content-type default → USE IF #1 and #2 missing
4. Universal default → USE IF all above missing
```

### 4.2 Default Tables

**Format → Content Type Default:**
| Format | → Default Content Type |
|---|---|
| documentary | factual |
| explainer | factual |
| news | factual |
| tutorial | instructional |
| narrative | creative |
| screenplay | creative |
| audio_drama | creative |
| stage_play | creative |
| commercial | hybrid |
| podcast_solo | hybrid |
| podcast_interview | hybrid |
| short_form | (inferred from objectives) |

**Format → Duration Default:**
| Format | → Default Duration |
|---|---|
| documentary | 15 minutes |
| explainer | 8 minutes |
| narrative | 20 minutes |
| podcast_solo | 20 minutes |
| podcast_interview | 30 minutes |
| short_form | 60 seconds (platform-dependent: YouTube Shorts ≤ 3 min) |
| news | 3 minutes |
| commercial | 30 seconds |
| tutorial | 10 minutes |
| screenplay | 90 minutes |
| audio_drama | 30 minutes |
| stage_play | 90 minutes |

**Format → Voice Default:**
| Format | → Default Voice Mode | → Default Tone |
|---|---|---|
| documentary | single_narrator | authoritative |
| explainer | single_narrator | conversational |
| narrative | multi_character | dramatic |
| podcast_solo | single_narrator | conversational |
| podcast_interview | host_guest | conversational |
| short_form | single_narrator | casual |
| news | single_narrator | formal |
| commercial | single_narrator | brand_voice |
| tutorial | single_narrator | conversational |

---

## 5. BACKWARD COMPATIBILITY

### 5.1 Current Schema → New Schema Mapping

Current SKILL.md ka input schema FULLY COMPATIBLE rehna chahiye:

```yaml
# Current input (unchanged, still works):
title: "The Hidden Science of Hurricane Prediction"
niche: "N01"
subject: "NOAA prediction models"
object: "hurricane forecast accuracy"
mechanism: "machine learning + atmospheric data fusion"
uncertainty: "accuracy beyond 5-day forecasts"
target_words: 4500
evidence:
  - id: "E-001"
    claim: "ML models improved 5-day accuracy by 15%"
    source: "S33"
    epistemic_status: "confirmed"

# How the new system reads it:
#   topic = title (aliased)
#   niche = "N01" → Tier 1 registered
#   format = "documentary" (default, backward compat)
#   content_type = "factual" (inferred from format + evidence present)
#   audience = "general_adult" (smart default — required in 2.0 schema
#              but auto-filled for legacy briefs)
#   language = "en" (smart default — required in 2.0 schema
#              but auto-filled for legacy briefs)
#   research_mode = "client_provided" (inferred — evidence register present)
#   target_words = 4500 (direct)
#   subject, object, mechanism, uncertainty = direct (factual mode)
#   evidence = direct (factual mode)
```

**Smart Default Reconciliation (Correction #9):**
The 2.0 schema declares `audience` and `language` as REQUIRED fields, but legacy 1.0 briefs do not include them. Resolution: these fields are "required-with-defaults" — they always have values, but the system auto-fills them when absent:
- Missing `audience` → `"general_adult"` (safe default, matches current implicit behavior)
- Missing `language` → `"en"` (safe default, matches current English-only behavior)
- Missing `research_mode` → INFERRED: `"client_provided"` if evidence register present (preserves legacy behavior), `"system_assisted"` if evidence register absent (default for new briefs)

This ensures zero breaking changes for any valid 1.0 brief while maintaining the field as required for new 2.0 briefs where explicit specification is preferred.

### 5.2 Alias Fields

| Current Field | New Schema Alias | Notes |
|---|---|---|
| `title` | → `topic` | Both accepted, `topic` preferred |
| `target_words` | → `target_words` | Unchanged |
| `niche` (N01-N05) | → `niche` | Accepted as registered code |
| `evidence` | → `evidence` | Unchanged structure |

---

## 6. EXAMPLE BRIEFS

### 6.1 Documentary (Current Style — Backward Compatible)

```yaml
topic: "The Hidden Science of Hurricane Prediction"
niche: "N01"
audience: "general YouTube viewers interested in science"
language: "en"
format: "documentary"
subject: "NOAA prediction models"
object: "hurricane forecast accuracy"
mechanism: "machine learning + atmospheric data fusion"
uncertainty: "accuracy beyond 5-day forecasts"
target_words: 4500
evidence:
  - id: "E-001"
    claim: "ML models improved 5-day accuracy by 15%"
    source: "S33"
    epistemic_status: "confirmed"
  - id: "E-002"
    claim: "Ensemble models outperform single models"
    source: "S34"
    epistemic_status: "replicated"
```

### 6.2 Short-Form Explainer (New)

```yaml
topic: "Why you can't tickle yourself"
audience: "casual science fans, 18-35"
language: "en"
format: "short_form"
platform: "youtube_shorts"
target_duration: "55 seconds"
objectives: [educate, entertain]
voice:
  tone: "playful"
  humor_level: 2
```

### 6.3 True Crime Podcast (New — Tier 3 Open Niche)

```yaml
topic: "The disappearance of the Beaumont children — Australia's most infamous cold case"
niche: "true crime"
audience: "true crime podcast listeners, adults 25-55"
language: "en"
format: "podcast_narrative"
target_duration: "45 minutes"
content_type: "hybrid"
objectives: [entertain, inform, document]
voice:
  mode: "single_narrator"
  tone: "intimate"
  formality: 2
characters:
  - name: "Jane Beaumont"
    role: "subject"
    description: "Eldest of the three missing children, age 9 at disappearance"
setting:
  time_period: "January 1966"
  location: "Glenelg Beach, Adelaide, Australia"
custom_requirements:
  - "Treat victims with dignity — no gratuitous speculation about harm"
  - "Include disclaimer about ongoing investigation"
```

### 6.4 Corporate Training Video (New)

```yaml
topic: "Cybersecurity basics for non-technical employees"
audience: "corporate employees, non-technical, ages 25-60"
language: "en"
format: "tutorial"
platform: "corporate"
target_duration: "12 minutes"
content_type: "instructional"
objectives: [educate]
voice:
  tone: "conversational"
  formality: 3
brand_voice:
  guidelines: "Professional but approachable. Avoid jargon. Use relatable analogies."
  keywords_exclude: ["hacker", "cyber attack", "breach"]
  keywords_include: ["digital safety", "online hygiene", "secure habits"]
```

### 6.5 Hindi Explainer (New — Non-English)

```yaml
topic: "Chandrayaan-3 ki safalta ka raaz"
audience: "Hindi-speaking science enthusiasts, general knowledge level"
language: "hi"
format: "explainer"
platform: "youtube"
target_duration: "10 minutes"
niche: "space technology"
content_type: "factual"
objectives: [educate, inspire]
subject: "ISRO Chandrayaan-3 mission"
object: "successful lunar south pole landing"
mechanism: "autonomous hazard detection + velocity reduction"
uncertainty: "long-term rover survival in lunar night"
```

### 6.6 Custom Format — Interactive Fiction (New)

```yaml
topic: "You are a detective in 1920s Cairo investigating a museum theft"
audience: "interactive fiction fans, adults"
language: "en"
format: "custom"
content_type: "creative"
objectives: [entertain]
custom_format_spec:
  name: "branching_narrative"
  sections:
    - name: "scene"
      budget_percent: "20-30%"
      purpose: "Describe location, atmosphere, clues"
    - name: "choice_point"
      budget_percent: "5-10%"
      purpose: "Present 2-3 options to the reader"
    - name: "consequence"
      budget_percent: "15-20%"
      purpose: "Result of choice, new information revealed"
  evidence_requirement: "optional"
  voice_model: "second_person narrator"
setting:
  time_period: "1923"
  location: "Cairo, Egypt — Egyptian Museum and surrounding streets"
  world_rules: "Historically grounded. No supernatural elements."
characters:
  - name: "Player character"
    role: "protagonist"
    description: "British-Egyptian archaeologist turned private investigator"
  - name: "Dr. Fatima Al-Rashidi"
    role: "supporting"
    description: "Museum curator, ally, keeper of institutional secrets"
premise: "A priceless Tutankhamun artifact vanishes the night before a British exhibition transfer."
```

---

## 7. SCHEMA VERSIONING

```
SCHEMA VERSION: 2.0.0

VERSION HISTORY:
  1.0.0 — Current SKILL.md schema (documentary only)
  2.0.0 — Universal schema (this document)

COMPATIBILITY GUARANTEE:
  - Any valid 1.0.0 brief MUST parse successfully in 2.0.0
  - 1.0.0 briefs receive "documentary" format + "factual" content_type defaults
  - No 1.0.0 field is removed or renamed (title aliased to topic)
```

---

## 8. CONCLUSION (Roman Urdu)

**Client Brief Input Schema LOOM architecture ka "front door" hai — yeh define karta hai ke users kaise apni requirements communicate karte hain.**

**Key design decisions:**
1. **Sirf 3 required fields** (topic, audience, language) — barrier to entry bahut low; legacy briefs get smart defaults for audience ("general_adult") and language ("en")
2. **Smart defaults** — missing fields system infer karta hai, reject nahi karta; required-with-defaults pattern ensures backward compatibility
3. **Backward compatible** — current N01-N05 briefs bina kisi change ke kaam karenge → **DESIGN TARGET** until executed regression tests establish it
4. **Content type system** — factual/creative/hybrid/instructional modes se evidence handling flexible
5. **Research mode** — client_provided (legacy — client supplies evidence register), system_assisted (default for new briefs — system researches topic-specific facts using authorized tools), minimal (creative/instructional). A normal client needs only topic + niche + audience + format + duration — no evidence register or subject/object/mechanism fields required.
6. **Free-text niche** — "true crime" ya "underwater basket weaving" bhi accept hoga
7. **Creative fields** — characters, setting, premise — fiction ke liye
8. **Brand voice** — commercial/corporate content ke liye
9. **Custom format** — user apna format define kar sakta hai
10. **6 example briefs** — backward compatible documentary se lekar Hindi explainer tak

**DESIGN TARGET Declarations:**
- Backward compatibility (current N01-N05 briefs unchanged) → **DESIGN TARGET** until executed regression tests establish it
- Format coverage (all 14 format entries via schema) → **DESIGN TARGET** until end-to-end pilot scripts per format validate it
- Language coverage (multi-language briefs accepted) → **DESIGN TARGET** until non-English pilot scripts validate it

**Phase 2A DESIGN ONLY — koi code implement nahi kiya gaya.**
