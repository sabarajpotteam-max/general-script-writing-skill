# UNIVERSAL ARCHITECTURE BLUEPRINT
**Phase 2A: Architecture Design** | **Tarikh:** 2026-10-28 | **Status:** DESIGN ONLY

---

## 1. DESIGN PHILOSOPHY

### 1.1 Core Principle

Skill ko **ek universal writing engine** ke taur par design karna hai jo:
- Kisi bhi niche mein script likh sake (weather se comedy tak)
- Kisi bhi format mein output de (documentary se TikTok script tak)
- Kisi bhi language mein kaam kare
- Kisi bhi audience ke liye adapt ho
- Evidence-based aur creative dono modes support kare

### 1.2 Architecture Ka Naam: "LOOM"

**L**anguage-aware, **O**pen-niche, **O**utput-flexible, **M**ulti-format — yeh naam is baat ko reflect karta hai ke skill writing ke threads ko weave karti hai, na ke ek fixed template fill karti hai.

### 1.3 Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BRIEF                          │
│  (topic, niche, format, audience, language, platform)    │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 1: INTAKE & ROUTING                   │
│  Brief parser → Format resolver → Niche analyzer →       │
│  Policy assembler → Content type classifier              │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│          LAYER 2: KNOWLEDGE & EVIDENCE ENGINE            │
│  Universal writing rules → Evidence validator →           │
│  Epistemic status → Source rights check →                │
│  Claim decomposition (factual mode only)                 │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│         LAYER 3: STRATEGY & STRUCTURE ENGINE             │
│  Narrative structure selector → Hook strategy →           │
│  Pacing model → Emotional arc → Voice/tone adapter →     │
│  Section planner → Word budget calculator                │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│            LAYER 4: GENERATION ENGINE                    │
│  Section-by-section writing → Open-loop tracking →       │
│  Voice consistency → Platform formatting →                │
│  Duration enforcement                                    │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│              LAYER 5: QA & REVISION                      │
│  Editorial revision → Format-specific QA →                │
│  Evidence traceability check → HOLD evaluation →          │
│  QA Report generation                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. LAYER 1: INTAKE & ROUTING

### 2.1 Client Brief Parser

Har request ek **Client Brief** se shuru hoti hai (full schema: CLIENT_BRIEF_INPUT_SCHEMA.md).

Parser ka kaam:
1. Required fields validate karo (topic, target audience, language)
2. Optional fields defaults se fill karo jahan missing hain
3. Content type classify karo: `factual | creative | hybrid | instructional`
4. Format resolve karo: explicit ya inferred from brief
5. Niche analyze karo: known niche match karo YA dynamic analysis karo

### 2.2 Format Resolver

**Current problem:** SKILL.md mein documentary format hardcoded hai.
**Design:** Format ek DIMENSION hai, na ke ek constraint.

```
FORMAT REGISTRY (extensible, not hardcoded):

DOCUMENTARY        → 8-section arc, evidence-mandatory, narrator voice
EXPLAINER          → Hook-Concept-Example-Application-Summary, evidence-preferred
NARRATIVE_FICTION   → Act structure (3-act/Hero's Journey/etc.), evidence-optional
PODCAST_SOLO       → Intro-Segments-Outro, multi-section, evidence-contextual
PODCAST_INTERVIEW  → Intro-Q&A blocks-Outro, dual-voice, evidence-optional
PODCAST_NARRATIVE   → Story-driven podcast, narrator + characters, evidence-contextual
SHORT_FORM         → Hook-Body-CTA (compressed), 30s-5min, evidence-optional
SCREENPLAY         → Slugline/Action/Dialogue format, industry standard
NEWS_BULLETIN      → Lead-Body-Context-Close, evidence-mandatory, AP/Reuters style
COMMERCIAL         → Problem-Solution-CTA, brand voice integration, 15/30/60s
TUTORIAL           → Setup-Steps-Demo-Practice-Summary, evidence-preferred
STAGE_PLAY         → Act/Scene structure, dialogue-driven, stage directions
AUDIO_DRAMA        → Sound design cues, multi-character, immersive audio
CUSTOM             → User-defined structure with minimum requirements
```

Har format define karta hai:
- **Arc template** — sections aur unka order
- **Word/duration range** — min/max per format
- **Voice model** — single narrator, multi-character, host+guest, etc.
- **Evidence requirement** — mandatory, preferred, contextual, optional
- **Output formatting** — markdown, screenplay format, teleprompter, etc.
- **Platform variants** — YouTube, podcast, broadcast, etc.
- **QA requirements** — format-specific checks

### 2.3 Niche Analyzer (Dynamic — NOT hardcoded)

**Current problem:** `VALID_NICHES = new Set(["N01","N02","N03","N04","N05"])` — sirf 5 accept hote hain.

**New design:** Niche analysis 3-tier system:

```
TIER 1: REGISTERED NICHES (currently N01-N05, expandable)
  → Pre-built adapter with specific rules, HOLD triggers, QA checks
  → Highest safety: domain-specific experts have reviewed rules
  → Path: references/adapters/N01.md, N02.md, ... N999.md

TIER 2: RECOGNIZED DOMAINS (auto-classified)
  → System recognizes the domain aur relevant cross-cutting policies apply
  → Example: "cryptocurrency" → finance overlay + technology overlay
  → Medium safety: general domain rules apply, specific HOLDs may trigger
  → Recognized domains: science, technology, health, finance, history,
    entertainment, sports, education, politics, law, culture, nature,
    arts, religion, lifestyle, gaming, food, travel, DIY, personal_development

TIER 3: OPEN NICHE (unknown but not rejected)
  → Brief analyze karke relevant UNIVERSAL rules + closest domain overlays apply
  → Safety: UNIVERSAL rules + content_type-specific rules + conservative HOLDs
  → HOLD_REVIEW triggered for high-stakes topics without registered adapter
  → User explicitly acknowledges: "no domain-specific safety rules available"
```

**CRITICAL DESIGN DECISION:** Tier 3 mein unknown niche REJECT nahi hoti — analyzed hoti hai. System:
1. Topic keywords se closest recognized domain(s) match karta hai
2. Cross-cutting overlays check karta hai (sensitive_subject, medical_claim, legal_claim, financial_claim, active_conflict, child_safety, etc.)
3. UNIVERSAL rules apply karta hai
4. Content type ke basis par evidence requirements set karta hai
5. Agar high-stakes topic hai (health, finance, legal, child safety) toh HOLD_REVIEW trigger hota hai
6. Script generate karta hai with appropriate caveats

### 2.4 Policy Assembler

Research Hub ke Worker E architecture (A03) se inspired. Policies ACCUMULATE by union:

```
FINAL_POLICY = UNIVERSAL_RULES
             + FORMAT_RULES[resolved_format]
             + CONTENT_TYPE_RULES[content_type]
             + NICHE_RULES[registered_niche OR closest_domain]
             + CROSS_CUTTING_OVERLAYS[detected_overlays]
             + LANGUAGE_RULES[target_language]
             + PLATFORM_RULES[target_platform]
             + CLIENT_CUSTOM_RULES[from_brief]
```

**Conflict resolution:** Zyada restrictive rule jeet'ti hai. Safety > Accuracy > Style.

### 2.5 Content Type Classifier

| Content Type | Evidence Requirement | Epistemic Rules | Example |
|---|---|---|---|
| `factual` | MANDATORY — every claim needs [E-XXX] | Full 6-level epistemic system | Documentary, news, explainer |
| `instructional` | PREFERRED — steps should be verified | Accuracy required, epistemics relaxed | Tutorial, how-to, training |
| `creative` | OPTIONAL — can include for world-building | Not applicable (fictional frame) | Fiction, drama, comedy |
| `hybrid` | CONTEXTUAL — factual claims need evidence, creative elements don't | Split tracking: real claims vs fictional elements | Historical fiction, docudrama, based-on-true-events |

---

## 3. LAYER 2: KNOWLEDGE & EVIDENCE ENGINE

### 3.1 Universal Writing Rules (Reuse from Current Skill)

Current 24 UNIVERSAL rules (U01-U24) **retain** — yeh genuinely universal hain:
- Clarity (U01-U07): Plain language, active voice, read-aloud — applies to ALL formats
- Integrity (U08-U13): Evidence tracing, no fabrication — applies to factual content
- Measurement (U14-U19): Analytics honesty — applies to ALL formats
- Composition (U20-U24): Truth-preserving, anti-AI awareness — applies to ALL formats

**Modifications for universal use:**
- U08 (evidence traceability) → CONDITIONAL on content_type == factual | instructional
- U10 (never fabricate evidence) → ALWAYS for factual; for creative: "never present fiction as fact"
- U22 (no fabricated dialogue) → ALWAYS for factual; for creative: clearly fiction-framed

### 3.2 Conditional Rules (Expanded)

Current 13 CONDITIONAL rules (C01-C13) retain with expanded trigger conditions:

**New conditional rules needed:**

| # | Rule | Condition | Basis |
|---|---|---|---|
| C14 | Multi-character voice differentiation | Format requires multiple speakers | Phase 1 Gap: dialogue craft |
| C15 | Platform-specific formatting | Target platform specified | Phase 1 Gap: platform formatting |
| C16 | Duration-specific pacing | Target duration < 5 minutes | Phase 1 Gap: short-form pacing |
| C17 | Brand voice consistency | Client brief includes brand voice | Phase 1 Gap: brand integration |
| C18 | Humor tone calibration | Content includes comedy elements | Phase 1 Gap: humor methodology |
| C19 | Audience knowledge adaptation | Brief specifies audience expertise level | Current C08 expanded |
| C20 | Localization (not just translation) | Target language ≠ source research language | Phase 1 Gap: localization |

### 3.3 Evidence Engine (Generalized from Current)

**Current strength ko retain karna hai — yeh project ki biggest asset hai.**

```
EVIDENCE ENGINE:
├── Source Registry (S/F/R/K/V series + new sources)
├── Epistemic Status Validator (6 levels, unchanged)
├── Blocked/Quarantined Enforcer (F-190, R052, K029-K031, B70-B72)
├── Source Type Weight Hierarchy (meta-analysis → caption_pattern)
├── Claim Decomposition Engine (F-121, K003)
└── Rights/License Checker (per source)
```

**Key change:** Evidence engine ACTIVATES based on content type:
- `factual`: Full evidence pipeline — every claim traced
- `instructional`: Accuracy checks — steps verified, no false claims
- `creative`: Fiction frame check — fictional claims not presented as real
- `hybrid`: Split tracking — real claims get full pipeline, fictional elements get fiction frame

### 3.4 Source Rights Module

**Current gap addressed:** License checking per source.

```
SOURCE_RIGHTS_STATUS:
  PUBLIC_DOMAIN    → Free use (S33, S34)
  PERMISSIVE       → Use with attribution (MIT, Apache, CC BY)
  SHARE_ALIKE      → Use with same license (CC BY-SA)
  NON_COMMERCIAL   → Research only, not for commercial skill (S08, S26)
  BLOCKED          → Cannot use (R052)
  QUARANTINED      → Cannot use until condition met (K029-K031)
  CAVEATED         → Use with explicit caveat (B70-B72)
  UNASSESSED       → Not yet reviewed — HOLD_RIGHTS
  NO_LICENSE       → Treat as all-rights-reserved — principles only
```

---

## 4. LAYER 3: STRATEGY & STRUCTURE ENGINE

### 4.1 Narrative Structure Selector

**Current problem:** Documentary arc hardcoded. 6 frameworks catalogued as EXPERIMENTAL.

**Design:** Structure selection based on FORMAT + CONTENT_TYPE + USER_PREFERENCE:

```
STRUCTURE SELECTION ALGORITHM:

1. Format ke default structure se start karo
   DOCUMENTARY     → Investigation Arc (current 8-section)
   EXPLAINER       → Concept Progression Arc
   NARRATIVE        → Three-Act (default), or user-selected framework
   PODCAST_SOLO     → Segment Arc
   SHORT_FORM       → Hook-Punch-CTA
   SCREENPLAY       → Industry standard act structure
   NEWS             → Inverted Pyramid or Narrative
   COMMERCIAL       → Problem-Solution-CTA
   TUTORIAL         → Progressive Complexity Arc

2. User preference check karo — agar brief mein specific structure request hai, use that

3. Content type adjust karo:
   factual + investigation → Investigation Arc (current documentary)
   factual + explanation  → Concept Progression Arc
   creative + character-driven → Hero's Journey / Save the Cat
   creative + plot-driven → Three-Act / Crucible
   hybrid → Split structure (factual backbone + creative scenes)

4. Duration adjust karo:
   < 60 seconds  → Micro Arc (single beat)
   60s - 5 min   → Compressed Arc (3-4 sections)
   5 - 15 min    → Standard Arc (5-6 sections)
   15 - 45 min   → Full Arc (7-8 sections)
   45+ min        → Extended Arc (10+ sections, with act breaks)
```

### 4.2 Arc Templates (Extensible Registry)

Har arc template define karta hai:
- Section names aur order
- Per-section word budget (percentage)
- Per-section purpose
- Transition requirements between sections
- HOLD conditions specific to this arc

**Example — Investigation Arc (current documentary, generalized):**
```yaml
name: investigation_arc
suitable_for: [documentary, explainer, long_form_factual]
sections:
  - name: hook
    budget: 8-12%
    purpose: "Grab attention with a compelling entry point"
    requires: [hook_strategy_selected]
  - name: problem
    budget: 12-15%
    purpose: "Establish the central question or tension"
    requires: [subject_object_mechanism_defined]
  - name: discovery
    budget: 16-20%
    purpose: "Reveal key evidence and findings"
    requires: [evidence_items_validated]
  - name: mechanism
    budget: 12-15%
    purpose: "Explain how/why — the causal or explanatory core"
  - name: challenge
    budget: 12-15%
    purpose: "Present complications, counter-evidence, nuance"
  - name: resolution
    budget: 14-18%
    purpose: "Synthesize findings, answer the central question"
  - name: implications
    budget: 8-12%
    purpose: "Broader significance, future questions"
  - name: outro
    budget: 5-8%
    purpose: "Close with resonance, CTA if appropriate"
```

**Example — Hook-Punch-CTA (short-form):**
```yaml
name: hook_punch_cta
suitable_for: [short_form, commercial, social_media]
sections:
  - name: hook
    budget: 15-25%
    purpose: "Immediate attention grab — first 3 seconds critical"
  - name: punch
    budget: 50-65%
    purpose: "Core message, key information, main value"
  - name: cta
    budget: 15-25%
    purpose: "Clear next action for viewer"
word_range: [50, 800]
```

### 4.3 Hook Strategy Engine

**Current:** 5 hook types (Scene, Question, Statistic, Contrast, Character).
**Expanded:**

| Hook Type | Best For | Content Type |
|---|---|---|
| Scene | Documentary, narrative, drama | Any |
| Question | Explainer, educational, mystery | Factual, instructional |
| Statistic | Data-driven, science, finance | Factual |
| Contrast | Before/after, transformation | Any |
| Character | Profile, biography, drama | Any |
| **Paradox** | Science, explainer, mystery | Factual (X08 — EXPERIMENTAL) |
| **Cold Open** | Drama, true crime, narrative podcast | Creative, hybrid |
| **Problem Statement** | Tutorial, how-to, commercial | Instructional |
| **Teaser** | Episodic content, series | Any |
| **Direct Address** | Commercial, personal, motivational | Any |

Hook selection: format + content_type + audience_familiarity ke basis par recommend, user override allowed.

### 4.4 Pacing Model

**Current:** Word budget percentages per section.
**Expanded:**

```
PACING DIMENSIONS:
├── Word Budget (per section, percentage-based — KEEP)
├── Duration Mapping (words → estimated minutes at speaking rate)
│   ├── Standard narration: ~150 words/minute
│   ├── Conversational: ~170 words/minute  
│   ├── Energetic/fast: ~190 words/minute
│   ├── Deliberate/dramatic: ~120 words/minute
├── Tension Curve (high/low alternation — K017 EXPERIMENTAL)
├── Information Density (concepts per section — C08 audience adaptation)
└── Breath Points (sentence length calibration — MISSING, needs research)
```

### 4.5 Voice & Tone Adapter

```
VOICE MODEL (from brief):
├── Narrator Mode
│   ├── Single omniscient narrator (documentary default)
│   ├── First-person narrator
│   ├── Conversational host
│   └── Authoritative anchor
├── Multi-Voice Mode
│   ├── Host + Guest(s) (podcast, interview)
│   ├── Multiple characters (drama, audio drama)
│   ├── Narrator + Interview clips (documentary + interviews)
│   └── Dual narrator (co-hosted)
└── Brand Voice Mode
    ├── Client-defined tone parameters
    ├── Formality level (1-5)
    ├── Humor level (0-3)
    └── Technical depth (1-5)

TONE SPECTRUM:
  authoritative ←→ conversational ←→ intimate
  serious ←→ balanced ←→ playful ←→ comedic
  formal ←→ professional ←→ casual ←→ colloquial
  technical ←→ accessible ←→ simplified
```

---

## 5. LAYER 4: GENERATION ENGINE

### 5.1 Section-by-Section Writing

**Current strength retain:** Sequential section generation with:
- Canonical term consistency (subject, object, mechanism)
- Evidence citation inline [E-XXX] (factual mode)
- Epistemic qualifier preservation
- Open-loop tracking (setup → payoff)

**New capabilities:**

| Feature | Applies When |
|---|---|
| Multi-character dialogue formatting | Multi-voice mode active |
| Platform-specific markup | Platform specified in brief |
| Screenplay formatting (sluglines, action, dialogue) | Format = SCREENPLAY |
| Podcast segment markers | Format = PODCAST_* |
| Time code estimation | Duration-targeted output |
| Sound design cues | Format = AUDIO_DRAMA |
| Stage directions | Format = STAGE_PLAY |
| B-roll / visual suggestions | Format = DOCUMENTARY, EXPLAINER |

### 5.2 Open-Loop Tracker (Generalized)

**Current:** Factual setup → factual payoff tracking.
**Extended:**

```
LOOP TYPES:
├── Factual Loop: claim introduced → evidence provided → resolved
├── Narrative Loop: question raised → tension built → answered
├── Character Loop: character introduced → arc developed → resolved
├── Thematic Loop: theme stated → explored → synthesized
├── Structural Loop: promise made (hook) → delivered (resolution)
└── Humor Loop: setup → callback → payoff (EXPERIMENTAL)
```

### 5.3 Platform Formatter

```
OUTPUT FORMATS:
├── markdown (default — current)
├── screenplay (industry .fountain format)
├── teleprompter (large text, timing marks)
├── podcast_script (speaker labels, timing, ad markers)
├── social_media (character limits, hashtag suggestions)
├── news_broadcast (anchor cues, package marks)
├── srt_subtitles (timed subtitle file)
└── raw_text (no formatting)
```

---

## 6. LAYER 5: QA & REVISION

### 6.1 Universal QA (All Formats)

**Current QA strengths ko generalize karna hai.** (Full details: UNIVERSAL_QA_DESIGN.md)

```
UNIVERSAL QA CHECKS (always run):
├── Word/duration budget compliance
├── Canonical term consistency
├── Open loop closure verification
├── Read-aloud / speakability check (U06, U24)
├── Anti-AI pattern check (U23)
├── HOLD condition evaluation
└── Section completeness

FORMAT-SPECIFIC QA (conditional):
├── Evidence traceability (factual, instructional)
├── Epistemic status compliance (factual)
├── Screenplay format compliance (screenplay)
├── Podcast timing/segment check (podcast)
├── Platform character/duration limits (short-form, social)
├── Brand voice consistency (commercial, branded)
└── Accessibility check (all — W3C WAI principles from R149)

NICHE-SPECIFIC QA (from adapter):
├── N01: Forecast staleness, agency attribution
├── N02: Capability stage, single-party claims
├── N03: Quote authenticity, era scope, translation
├── N04: Casualty provisionality, synthetic media
├── N05: Study citations, effect sizes, replication
├── Tier 2 domains: Domain-specific fact patterns
└── Tier 3 open niche: UNIVERSAL + content_type checks
```

### 6.2 HOLD System (Extended)

**Current 12 HOLD types retain. New HOLD types:**

| HOLD Type | Trigger | New? |
|---|---|---|
| HOLD_MISSING_IDENTITY | Missing required fields | Existing |
| HOLD_RIGHTS | Source rights issue | Existing |
| HOLD_DISPUTED_PROVENANCE | Source provenance unclear | Existing |
| HOLD_UNVERIFIED_FACT | Factual claim unverified | Existing |
| HOLD_STALE_FORECAST | Time-sensitive data stale | Existing |
| HOLD_TITLE_PREMISE | Title overstates evidence | Existing |
| HOLD_HARM | Content could cause harm | Existing |
| HOLD_REVIEW | Needs human review | Existing |
| HOLD_NOT_APPROVED | K-series item not approved | Existing |
| HOLD_NEEDS_RECHECK | Epistemic issue detected | Existing |
| **HOLD_FORMAT_MISMATCH** | Content doesn't fit declared format | **NEW** |
| **HOLD_AUDIENCE_RISK** | Content inappropriate for declared audience | **NEW** |
| **HOLD_PLATFORM_COMPLIANCE** | Platform rules may be violated | **NEW** |
| **HOLD_DOMAIN_UNKNOWN** | High-stakes topic without registered adapter | **NEW** |
| **HOLD_CULTURAL_SENSITIVITY** | Cross-cultural content needs review | **NEW** |
| **HOLD_LEGAL_CLAIM** | Legal assertion needs verification | **NEW** |
| **HOLD_MEDICAL_CLAIM** | Medical assertion needs verification | **NEW** |
| **HOLD_FINANCIAL_CLAIM** | Financial assertion needs verification | **NEW** |

### 6.3 QA Report (Generalized)

```
QA REPORT STRUCTURE:
├── Run metadata (ID, timestamp, brief hash, skill version)
├── Brief compliance (all required fields, format, niche, audience)
├── Structure compliance (arc template followed, section budgets met)
├── Content quality
│   ├── Word counts (total, per section, narration vs metadata)
│   ├── Duration estimate
│   ├── Canonical term consistency score
│   ├── Open loop status (all closed?)
│   ├── Voice consistency check
│   └── Read-aloud assessment
├── Evidence compliance (factual/instructional only)
│   ├── Every claim traced to [E-XXX]?
│   ├── Epistemic status compliance
│   ├── Blocked/quarantined items detected?
│   └── Source rights status
├── Format-specific compliance
│   ├── [checks per format]
├── Niche-specific compliance
│   ├── [checks per niche adapter]
├── HOLD register (all triggered HOLDs)
├── Stage status (PASS/HOLD/SKIP per stage)
└── Overall verdict (PASS / PASS_WITH_WARNINGS / HOLD / FAIL)
```

---

## 7. FILE STRUCTURE (Proposed)

```
.claude/skills/universal-scriptwriting/
├── SKILL.md                          # Main skill file (generalized)
├── references/
│   ├── writing_rules.md              # U01-U24 + C01-C20 + X01-X08
│   ├── evidence_standards.md         # Epistemic system (unchanged)
│   ├── format_registry.md            # Format definitions + arc templates
│   └── voice_tone_guide.md           # Voice models + tone spectrum
├── adapters/
│   ├── README.md                     # Adapter system documentation
│   ├── registered/
│   │   ├── N01_weather.md
│   │   ├── N02_military.md
│   │   ├── N03_german_ww.md
│   │   ├── N04_disaster.md
│   │   ├── N05_psychology.md
│   │   └── ... (expandable)
│   ├── domains/
│   │   ├── science.md
│   │   ├── technology.md
│   │   ├── health.md
│   │   ├── finance.md
│   │   ├── history.md
│   │   ├── entertainment.md
│   │   └── ... (recognized domain overlays)
│   └── overlays/
│       ├── sensitive_subject.md
│       ├── medical_claim.md
│       ├── financial_claim.md
│       ├── legal_claim.md
│       ├── child_safety.md
│       ├── active_conflict.md
│       └── synthetic_media.md
├── formats/
│   ├── documentary.md                # Arc template + formatting rules
│   ├── explainer.md
│   ├── narrative.md
│   ├── podcast_solo.md
│   ├── podcast_interview.md
│   ├── short_form.md
│   ├── screenplay.md
│   ├── news.md
│   ├── commercial.md
│   ├── tutorial.md
│   └── custom_template.md            # Template for user-defined formats
└── scripts/
    ├── validate.mjs                  # Generalized validator
    └── word_count.mjs                # Generalized word counter
```

---

## 8. KEY DESIGN DECISIONS (UNRESOLVED — Owner Input Needed)

| Decision | Options | Recommendation | Reason |
|---|---|---|---|
| **D1:** SKILL.md single file vs multi-file? | Single monolith vs modular references | **Multi-file** — current approach but more modules | Scalability — 378 lines already large |
| **D2:** Custom niche adapter by users? | Allow vs restrict | **Allow with safety floor** — UNIVERSAL rules always apply | Enables "thousands of niches" vision |
| **D3:** Fiction mode evidence handling? | Mandatory vs optional | **Content-type dependent** — factual=mandatory, creative=optional | Blocks creative use otherwise |
| **D4:** Screenplay format inclusion? | Yes vs defer | **Yes — Tier 2 priority** | CRITICAL gap per research/05_research_gaps.md |
| **D5:** K-series batch approval? | Approve/reject/modify each | **Triage in groups** — 14 ethical (approve), 14 creative (test), 3 quarantined (hold) | Fastest path to usable technique library |
| **D6:** Short-form support? | Include vs defer | **Include in Tier 2** — highest commercial demand | Market necessity |
| **D7:** Multilingual strategy? | Full localization vs translation guidance | **Translation guidance first, localization later** | research/06_continuation_checkpoint.md: "localization ≠ translation" |
| **D8:** How to handle Tier 3 open niches for high-stakes topics? | Allow with warnings vs HOLD | **HOLD_DOMAIN_UNKNOWN for high-stakes, allow with warnings for low-stakes** | Safety-first but not restrictive |

---

## 9. RESEARCH HUB ARCHITECTURE ALIGNMENT

Worker E proposed A00-A10 architecture. Yeh blueprint us se COMPATIBLE hai:

| Worker E Component | This Blueprint | Alignment |
|---|---|---|
| A00 Intake/scope router | Layer 1: Intake & Routing | **ALIGNED** — extended with format/platform routing |
| A01 Provenance/rights | Layer 2: Source Rights Module | **ALIGNED** — same principle |
| A02 Eligibility/conflict | Layer 2: Evidence Engine | **ALIGNED** — blocked/quarantined system |
| A03 Context/policy resolver | Layer 1: Policy Assembler | **ALIGNED** — same union accumulation principle |
| A04 Claim laboratory | Layer 2: Claim Decomposition | **ALIGNED** — factual mode only |
| A05 Creative option registry | Layer 3: Strategy Engine | **ALIGNED** — expanded scope |
| A06 Topic/title boundary | Layer 1: Brief Parser | **ALIGNED** — canonical terms preserved |
| A07 Draft assembly | Layer 4: Generation Engine | **ALIGNED** — extended formats |
| A08 Editorial/claims review | Layer 5: QA & Revision | **ALIGNED** — generalized |
| A09 Test/analytics registry | Out of scope (future) | **COMPATIBLE** — not blocked |
| A10 Director checkpoint | Out of scope (owner gates) | **COMPATIBLE** — HOLD system covers this |

---

## 10. CONCLUSION (Roman Urdu)

**Yeh architecture LOOM — Language-aware Open-niche Output-flexible Multi-format — current skill ki strengths ko preserve karti hai (evidence engine, QA, HOLD system, writing rules) jabke structural barriers hata deti hai (hardcoded niches, fixed format, evidence-mandatory, fixed word range).**

**Core innovations:**
1. **3-tier niche system** — registered + recognized + open (unknown niche rejected nahi hoti)
2. **Format registry** — documentary ek option hai, na ke only option
3. **Content type classification** — factual/creative/hybrid/instructional se evidence rules adjust hote hain
4. **Policy accumulation** — multiple adapters/overlays union se combine hote hain
5. **Platform-aware output** — YouTube, podcast, broadcast, social ke liye alag formatting

**Existing assets jo as-is reuse hote hain:**
- 24 UNIVERSAL writing rules (U01-U24)
- 6-level epistemic status system
- Blocked/quarantined enforcement
- Source type weight hierarchy
- HOLD condition system (extended)
- QA report structure (generalized)
- 5 registered niche adapters (N01-N05)
- Test infrastructure pattern (85 integration + 37 prototype = 122 core tests, plus 12 invocation-pipeline checks separately categorized)

**DESIGN TARGET Declarations:**
- Backward compatibility (current N01-N05 briefs unchanged) → **DESIGN TARGET** until executed regression tests establish it
- Format coverage (14 format registry entries) → **DESIGN TARGET** until end-to-end pilot scripts per format validate it
- Language coverage (multi-language support) → **DESIGN TARGET** until non-English pilot scripts validate it

**Phase 2A DESIGN ONLY — koi code implement nahi kiya gaya.**
