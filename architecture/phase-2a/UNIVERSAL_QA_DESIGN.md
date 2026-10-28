# UNIVERSAL QA DESIGN
**Phase 2A: Architecture Design** | **Tarikh:** 2026-10-28 | **Status:** DESIGN ONLY

---

## 1. PURPOSE

Yeh document LOOM architecture ka Layer 5 (QA & Revision) detail mein describe karta hai. Current SKILL.md ka QA system (Stage 7: Editorial Revision + Stage 8: QA Report) **strong foundation** hai — yeh design us foundation ko GENERALIZE karta hai taake har format, content type, niche aur platform ke liye kaam kare.

**Core principle:** QA MODULAR honi chahiye — universal checks har jagah chalein, format/niche/platform-specific checks sirf jab relevant hain.

---

## 2. QA ARCHITECTURE OVERVIEW

```
GENERATED SCRIPT
      │
      ▼
┌──────────────────────────────┐
│   STAGE A: STRUCTURAL QA     │
│   (Format compliance,         │
│    section completeness,      │
│    word/duration budgets)     │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE B: CONTENT QA        │
│   (Canonical terms, open      │
│    loops, voice consistency,  │
│    read-aloud check)          │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE C: EVIDENCE QA       │
│   (Activated for factual/     │
│    hybrid/instructional only) │
│   (Traceability, epistemic,   │
│    blocked/quarantined,       │
│    source rights)             │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE D: FORMAT-SPECIFIC   │
│   QA (Conditional — per       │
│   format requirements)        │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE E: NICHE-SPECIFIC    │
│   QA (Conditional — per       │
│   niche adapter / overlay)    │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE F: HOLD EVALUATION   │
│   (All triggered HOLDs        │
│    assessed + resolved        │
│    or flagged)                │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE G: EDITORIAL         │
│   REVISION (Fix issues found  │
│   in A-F, re-verify)         │
└─────────────┬────────────────┘
              ▼
┌──────────────────────────────┐
│   STAGE H: QA REPORT         │
│   GENERATION                  │
└──────────────────────────────┘
```

---

## 3. STAGE A: STRUCTURAL QA

### 3.1 Section Completeness Check

```
FOR each section in writing_plan.sections:
    CHECK:
      ☐ Section exists in output
      ☐ Section is non-empty
      ☐ Section word count within budget (min ≤ actual ≤ max)
      ☐ Section position matches template order
      ☐ All required elements present (e.g., hook section MUST have hook element)

    VIOLATIONS:
      MISSING_SECTION     → FAIL (cannot be empty)
      UNDERCOUNT          → WARNING if within 10%, FAIL if > 10% under min
      OVERCOUNT           → WARNING if within 15%, FAIL if > 15% over max
      ORDER_VIOLATION     → FAIL (sections must follow template order)
```

### 3.2 Total Word/Duration Budget

```
CHECK:
  ☐ Total word count within ±10% of target
  ☐ Estimated duration within ±15% of target_duration
  ☐ No single section exceeds 40% of total (unless template permits)
  ☐ Metadata (speaker labels, stage directions, B-roll notes) < 15% of total words

CALCULATIONS:
  total_script_words = sum(section_word_counts) - metadata_words
  estimated_duration = total_script_words / speaking_rate[voice_mode]
  section_ratio = section_words / total_script_words
```

### 3.3 Format Compliance

```
PER FORMAT CHECKS:

DOCUMENTARY:
  ☐ 8 sections present in correct order
  ☐ Evidence citations [E-XXX] present in discovery + mechanism sections
  ☐ NARRATOR: labels used

SCREENPLAY:
  ☐ Sluglines present (INT./EXT.)
  ☐ Action lines in present tense
  ☐ Character names CAPITALIZED on first introduction
  ☐ Dialogue properly formatted
  ☐ No camera directions (industry convention)

PODCAST:
  ☐ Speaker labels present (HOST:, GUEST:, etc.)
  ☐ Intro + outro segments present
  ☐ Time markers present if requested

NEWS:
  ☐ Lead paragraph contains 5 W's
  ☐ Inverted pyramid structure (most important first)
  ☐ Sources attributed

SHORT_FORM:
  ☐ Hook within first 15 words (first 3 seconds)
  ☐ CTA present
  ☐ Total duration ≤ platform limit

COMMERCIAL:
  ☐ Product/service name mentioned
  ☐ CTA present
  ☐ Brand voice consistency (if brand_voice defined)

TUTORIAL:
  ☐ Steps numbered or clearly sequential
  ☐ Prerequisites stated
  ☐ End result demonstrated or described
```

---

## 4. STAGE B: CONTENT QA

### 4.1 Canonical Term Consistency

**Current strength — RETAIN aur EXTEND.**

```
CANONICAL TERMS (from brief + strategy):

Factual mode:
  subject:     "NOAA prediction models"      → har mention consistent
  object:      "hurricane forecast accuracy"  → synonyms NOTED not substituted
  mechanism:   "ML + atmospheric data fusion" → technical terms consistent

Creative mode:
  character_names: consistent spelling, no accidental name changes
  location_names: consistent references
  timeline:       no continuity errors

All modes:
  terminology:  technical terms used consistently throughout
  abbreviations: defined on first use, then consistent
  proper_nouns:  consistent capitalization and spelling

CHECK:
  ☐ Each canonical term used ≥ 2x in script
  ☐ No variant spellings (unless deliberate — dialect in dialogue)
  ☐ Subject/object/mechanism referenced in expected sections
  ☐ Character names consistent (creative mode)
  ☐ No accidental term drift (e.g., "prediction" → "forecasting" without noting both)
```

### 4.2 Open Loop Closure

**Current strength — RETAIN aur EXTEND.**

```
LOOP TYPES:

Factual Loops:
  ☐ Every claim introduced → evidence provided
  ☐ Every question raised → answered (or explicitly noted as open)
  ☐ Every "we'll explore this later" → actually explored later

Narrative Loops:
  ☐ Every character introduced → has resolution (or explicit open ending)
  ☐ Every conflict set up → resolved or deliberately left open
  ☐ Every Chekhov's gun → fires

Structural Loops:
  ☐ Hook promise → delivered in body/resolution
  ☐ Teaser elements → paid off
  ☐ "Coming up" / preview items → all addressed

DETECTION METHOD:
  Track opening phrases: "we'll see...", "later we'll discover...",
    "the question is...", "what happened next would...",
    "as we'll explore...", "but first..."
  Verify each has a corresponding closure
  Flag any unclosed loops → WARNING (author may intend open ending)
```

### 4.3 Voice Consistency Check

```
CHECK:
  ☐ Tone consistent throughout (no sudden formality shifts)
  ☐ POV consistent (no accidental 1st→3rd person shifts)
  ☐ Narrator voice distinct from character voices (if multi-voice)
  ☐ Humor level consistent with voice profile
  ☐ Technical depth consistent with audience level
  ☐ Energy level appropriate for format

MULTI-VOICE SPECIFIC:
  ☐ Each character has distinguishable voice
  ☐ Host vs guest clearly differentiated
  ☐ Speaker labels correct throughout
  ☐ No character speaking out of character
```

### 4.4 Read-Aloud / Speakability Check (U06, U24)

```
CHECK:
  ☐ No sentence > 35 words (spoken delivery limit)
  ☐ No paragraph > 100 words without breath point
  ☐ Tongue-twisters flagged (consecutive similar consonants)
  ☐ Acronym first-use expansions present
  ☐ Numbers formatted for speech ("three million" not "3,000,000")
  ☐ Parenthetical asides minimal (hard to deliver orally)
  ☐ Passive voice < 15% of sentences (U03)
  ☐ Jargon compliant with audience.knowledge_level
  
DURATION-SPECIFIC:
  < 60 seconds:
    ☐ Max sentence length: 20 words
    ☐ Zero parentheticals
    ☐ No complex subordinate clauses
  60s - 5 min:
    ☐ Max sentence length: 25 words
    ☐ Minimal parentheticals
  5+ min:
    ☐ Standard limits apply
```

### 4.5 Anti-AI Pattern Check (U23)

```
CHECK:
  ☐ No "in conclusion" without preceding argument
  ☐ No "it's important to note that" (filler phrase)
  ☐ No "it's worth mentioning" (filler phrase)
  ☐ No "dive deep into" (overused AI pattern)
  ☐ No "at the end of the day" (cliché)
  ☐ No "this is not just about X, it's about Y" (AI pattern)
  ☐ No "In today's world" / "In this day and age" (filler)
  ☐ No consecutive sentences starting with same word > 2x
  ☐ No 3+ paragraphs starting with same transition word
  ☐ Sentence length variance present (not all 15-20 words)
  ☐ Vocabulary specificity (concrete nouns > abstract generalizations)

EXPERIMENTAL (from research):
  ☐ No "perfect" parallel structures in 3+ consecutive sentences (AI pattern)
  ☐ No excessive hedging words ("perhaps", "might", "could" > 5% of sentences)
```

---

## 5. STAGE C: EVIDENCE QA

### 5.1 Activation Logic

```
IF content_type == "factual":
    RUN full evidence QA (all checks)
IF content_type == "instructional":
    RUN accuracy checks (5.2 + 5.3 + 5.6)
    SKIP formal citation requirements (5.4)
IF content_type == "hybrid":
    RUN evidence QA on factual-tagged claims ONLY
    SKIP evidence QA on creative sections
IF content_type == "creative":
    RUN fiction frame check (5.7) ONLY
    SKIP all other evidence checks
```

### 5.2 Evidence Traceability (U08)

```
FOR each factual claim in script:
    CHECK:
      ☐ Claim has [E-XXX] citation
      ☐ E-XXX exists in brief.evidence
      ☐ Claim text consistent with evidence item's claim field
      ☐ No evidence item cited but not present in brief

UNCITED CLAIMS:
  factual mode → FAIL
  instructional → WARNING
  hybrid (factual section) → FAIL
  hybrid (creative section) → OK
```

### 5.3 Epistemic Status Compliance

```
FOR each evidence citation:
    CHECK epistemic_status against script treatment:

    confirmed/replicated:
      ☐ Can state as established fact
      ☐ "Research shows..." OK
      
    preliminary:
      ☐ MUST include qualifier: "preliminary research suggests..."
      ☐ Cannot state as established fact
      
    disputed:
      ☐ MUST present multiple perspectives
      ☐ MUST note dispute: "some researchers argue... while others..."
      
    qualified:
      ☐ MUST include the specific qualification
      ☐ "Under specific conditions, X..."
      
    hypothetical:
      ☐ MUST be clearly framed as hypothesis
      ☐ "One hypothesis proposes..."
      ☐ Cannot be used as supporting evidence for other claims

VIOLATION:
  Treating preliminary/disputed/qualified/hypothetical as "confirmed" → FAIL
```

### 5.4 Source Rights & Blocked Items

```
FOR each evidence citation:
    CHECK source against registers:
      ☐ Source NOT in BLOCKED_SOURCES → OK
      ☐ Source NOT in QUARANTINED → OK
      ☐ Source in CAVEATED_SOURCES → caveat label present?
      ☐ Source license compatible with commercial use?

VIOLATIONS:
  Blocked source cited → FAIL (remove immediately)
  Quarantined source cited → FAIL (cannot use until cleared)
  Caveated source without caveat → WARNING (add caveat label)
  Non-commercial source in commercial context → HOLD_RIGHTS
```

### 5.5 Claim Independence

```
CHECK:
  ☐ No circular evidence (Claim A supports B which supports A)
  ☐ No single-source dependency for critical claims
  ☐ Disputed claims have ≥ 2 independent sources
  ☐ No reliance on retracted/superseded sources
```

### 5.6 Factual Accuracy Patterns

```
AUTOMATED CHECKS:
  ☐ Dates: no future dates presented as past events
  ☐ Numbers: mathematical consistency (percentages add up, etc.)
  ☐ Names: consistent spelling, no conflation of different persons
  ☐ Geography: place names verifiable
  ☐ Quotes: not fabricated (U22 — ABSOLUTE for factual)

FLAGS FOR HUMAN REVIEW:
  ☐ Statistical claims without effect size
  ☐ Causal claims from correlational data
  ☐ Universal claims from limited samples
  ☐ Recency of time-sensitive data
```

### 5.7 Fiction Frame Check (Creative Mode)

```
WHEN content_type == creative:
    CHECK:
      ☐ No real-world factual claims presented as verified
      ☐ Real persons: clearly fictionalized or consent-noted
      ☐ Real events: "based on" / "inspired by" disclaimer if applicable
      ☐ No medical/legal/financial advice framed as factual in fiction
      ☐ Historically-set fiction: major facts accurate, creative license noted

WHEN content_type == hybrid:
    CHECK:
      ☐ Clear boundary between factual and creative sections
      ☐ Factual claims have evidence, creative elements have fiction frame
      ☐ No blurring where viewer can't tell fact from fiction
```

---

## 6. STAGE D: FORMAT-SPECIFIC QA

### 6.1 Format QA Registry

Har format apne specific checks register karta hai:

**DOCUMENTARY QA:**
| Check | Rule | Severity |
|---|---|---|
| Investigation arc completeness | All 8 sections present and ordered | FAIL |
| Evidence density | ≥ 3 evidence citations in discovery section | WARNING |
| B-roll suggestions | Present if platform = youtube/broadcast | WARNING |
| Narrator continuity | Single voice maintained | FAIL |
| Source diversity | ≥ 3 unique sources cited | WARNING |

**PODCAST QA:**
| Check | Rule | Severity |
|---|---|---|
| Speaker labels | Every spoken line has HOST:/GUEST:/etc. | FAIL |
| Intro presence | Episode intro within first 10% | FAIL |
| Ad break markers | Present if requested in brief | WARNING |
| Time estimates | Per-segment duration estimates present | WARNING |
| Outro/CTA | Episode close with next-episode tease | WARNING |

**SCREENPLAY QA:**
| Check | Rule | Severity |
|---|---|---|
| Slugline format | INT./EXT. LOCATION - TIME | FAIL |
| Character intro | CAPS on first appearance | WARNING |
| Action tense | Present tense only | FAIL |
| Dialogue format | Character name centered, dialogue indented | FAIL |
| Page estimate | ~1 page/minute rule checked | WARNING |

**SHORT-FORM QA:**
| Check | Rule | Severity |
|---|---|---|
| Hook timing | Attention grab within first 3 seconds / 15 words | FAIL |
| Total duration | Within platform limit (Shorts ≤ 60s) | FAIL |
| CTA present | Clear call-to-action | WARNING |
| Information density | ≤ 3 key points for < 60s | WARNING |
| Vertical video cues | Visual framing cues for vertical (if applicable) | WARNING |

**NEWS QA:**
| Check | Rule | Severity |
|---|---|---|
| Lead completeness | 5 W's in lead paragraph | FAIL |
| Source attribution | Every claim attributed | FAIL |
| Inverted pyramid | Importance decreases through article | WARNING |
| Editorializing | No opinion in news format (unless analysis) | FAIL |
| Timeliness | Date/time references current | WARNING |

**COMMERCIAL QA:**
| Check | Rule | Severity |
|---|---|---|
| Product mention | Product/service named at least once | FAIL |
| CTA clarity | Single, clear action step | FAIL |
| Brand voice | Consistent with brand_voice guidelines | WARNING |
| Claims | Product claims verifiable | WARNING (HOLD if health/finance) |
| Competitor mentions | No competitor disparagement (unless comparative ad) | WARNING |
| Duration | Within specified length (15/30/60s) | FAIL |

**TUTORIAL QA:**
| Check | Rule | Severity |
|---|---|---|
| Prerequisites | Stated in intro | WARNING |
| Step sequence | Logical order, no skipped steps | FAIL |
| Step clarity | Each step has clear action verb | WARNING |
| Result shown | End result demonstrated | WARNING |
| Troubleshooting | Common mistakes addressed | WARNING |

---

## 7. STAGE E: NICHE-SPECIFIC QA

### 7.1 Registered Niche QA (Tier 1)

**N01 — Weather:**
| Check | Rule | Severity |
|---|---|---|
| Forecast staleness | forecast_issued_at < 6 hours | HOLD_STALE_FORECAST |
| Agency attribution | NWS/NOAA cited for US weather | FAIL |
| Historical marking | Dates clearly marked historical vs current | WARNING |
| Metric consistency | Units consistent (°F/°C, mph/kmh) | WARNING |

**N02 — Military/Aviation:**
| Check | Rule | Severity |
|---|---|---|
| OPSEC check | No classified/sensitive operational details | FAIL |
| Single-party claim | Multi-source for capability claims | HOLD_UNVERIFIED_FACT |
| Capability stage | Stage clearly stated (proposed→fielded) | WARNING |
| Designation accuracy | Military designations verified | FAIL |

**N03 — German WW1/WW2:**
| Check | Rule | Severity |
|---|---|---|
| Era scope | All events within 1914-18 or 1939-45 | HOLD_REVIEW |
| Quote authenticity | All quotes sourced, translations qualified | FAIL |
| Dignity protocol | No gratuitous violence, victim respect | FAIL |
| Translation qualifier | German quotes have translation quality noted | WARNING |

**N04 — Disaster News:**
| Check | Rule | Severity |
|---|---|---|
| Casualty provisonality | Death tolls marked "provisional"/"confirmed" | HOLD_UNVERIFIED_FACT |
| Cause attribution | No premature cause assignment | HOLD_UNVERIFIED_FACT |
| Synthetic media | AI/altered images disclosed | FAIL |
| Living victim privacy | No unnecessary identification | WARNING |

**N05 — Psychology/Explainers:**
| Check | Rule | Severity |
|---|---|---|
| Study citations | Every psychological claim cites study | FAIL |
| Effect sizes | Reported where available | WARNING |
| Replication status | Noted for key findings | WARNING |
| WEIRD caveat | Cultural generalization limits noted | WARNING |
| Correlation vs causation | No causal language for correlational studies | FAIL |

### 7.2 Recognized Domain QA (Tier 2)

Each recognized domain adds checks via its overlay file:

| Domain | Key QA Checks |
|---|---|
| health | Medical claim verification, "consult professional" disclaimer |
| finance | Financial disclaimer, past performance caveat |
| law | Jurisdiction caveat, "not legal advice" |
| politics | Balance check, partisan language detector |
| technology | Technical accuracy, version/date currency |
| science | Citation check, peer review status |
| sports | Statistic accuracy, record verification |
| children | Age-appropriate language, safety compliance |

### 7.3 Open Niche QA (Tier 3)

```
TIER 3 QA = UNIVERSAL QA (Stages A + B)
           + Content Type QA (Stage C if applicable)
           + Cross-Cutting Overlay QA (detected overlays)
           + HOLD_DOMAIN_UNKNOWN (if sensitivity = HIGH)

NOTE: Tier 3 niche ke liye FORMAT-SPECIFIC QA apply hota hai (Stage D),
      lekin NICHE-SPECIFIC QA (Stage E) sirf applicable overlays se aata hai.
      Yeh SAFE hai kyunke UNIVERSAL rules + overlays cover karte hain.
```

---

## 8. STAGE F: HOLD EVALUATION

### 8.1 HOLD Types (Complete Registry)

| HOLD Type | Trigger | Resolution Path | Auto-Resolvable? |
|---|---|---|---|
| HOLD_MISSING_IDENTITY | Required brief field missing | User provides field | No — needs input |
| HOLD_RIGHTS | Source rights issue | Remove source or get license | No — needs decision |
| HOLD_DISPUTED_PROVENANCE | Source provenance unclear | Verify provenance | No — needs research |
| HOLD_UNVERIFIED_FACT | Factual claim unverified | Verify or add epistemic qualifier | Partial — can add qualifier |
| HOLD_STALE_FORECAST | Time-sensitive data stale | Update data | No — needs fresh data |
| HOLD_TITLE_PREMISE | Title overstates evidence | Revise title | Yes — revision pass |
| HOLD_HARM | Content could cause harm | Review and revise | No — needs judgment |
| HOLD_REVIEW | Needs human review | Human reviewer | No — needs human |
| HOLD_NOT_APPROVED | K-series technique not approved | Approval process | No — needs decision |
| HOLD_NEEDS_RECHECK | Epistemic issue detected | Re-verify | Yes — re-run check |
| **HOLD_FORMAT_MISMATCH** | Content doesn't fit format | Revise or change format | Partial |
| **HOLD_AUDIENCE_RISK** | Inappropriate for audience | Revise content | No — needs judgment |
| **HOLD_PLATFORM_COMPLIANCE** | Platform rules violated | Revise for platform | Yes — revision pass |
| **HOLD_DOMAIN_UNKNOWN** | High-stakes open niche | Human review | No — needs human |
| **HOLD_CULTURAL_SENSITIVITY** | Cross-cultural risk | Cultural review | No — needs expert |
| **HOLD_LEGAL_CLAIM** | Legal assertion | Legal verification | No — needs expert |
| **HOLD_MEDICAL_CLAIM** | Medical assertion | Medical verification | No — needs expert |
| **HOLD_FINANCIAL_CLAIM** | Financial assertion | Financial verification | No — needs expert |

### 8.2 HOLD Resolution Flow

```
FOR each triggered HOLD:
    IF auto_resolvable:
        ATTEMPT automatic resolution in STAGE G (revision)
        IF resolved → mark RESOLVED
        IF not resolved → mark PENDING_HUMAN
    ELSE:
        Mark PENDING_HUMAN
        Add to QA report with:
          - HOLD type
          - Specific trigger (what caused it)
          - Location in script (section, line)
          - Recommended resolution
          - Severity (BLOCKING vs ADVISORY)

BLOCKING HOLDs (script cannot be released):
  HOLD_MISSING_IDENTITY, HOLD_RIGHTS, HOLD_HARM, HOLD_MEDICAL_CLAIM,
  HOLD_FINANCIAL_CLAIM, HOLD_LEGAL_CLAIM, HOLD_AUDIENCE_RISK

ADVISORY HOLDs (script can be released with acknowledgment):
  HOLD_DOMAIN_UNKNOWN, HOLD_CULTURAL_SENSITIVITY, HOLD_FORMAT_MISMATCH,
  HOLD_PLATFORM_COMPLIANCE, HOLD_TITLE_PREMISE, HOLD_NEEDS_RECHECK
```

---

## 9. STAGE G: EDITORIAL REVISION

### 9.1 Revision Pass (Generalized from Current Stage 7)

```
REVISION PRIORITIES (highest first):
1. FAIL items from Stages A-F → MUST fix
2. BLOCKING HOLDs → MUST resolve or flag
3. WARNING items → SHOULD fix
4. ADVISORY HOLDs → SHOULD address
5. Style improvements → MAY fix

REVISION ACTIONS:
  ☐ Fix word count violations (trim or expand)
  ☐ Close unclosed open loops
  ☐ Fix canonical term inconsistencies
  ☐ Fix epistemic qualifier violations
  ☐ Fix format compliance issues
  ☐ Fix voice consistency breaks
  ☐ Fix anti-AI patterns
  ☐ Add missing evidence citations (factual mode)
  ☐ Add missing disclaimers (niche/overlay required)
  ☐ Platform formatting adjustments

REVISION LIMITS:
  ☐ Max 2 revision passes (to prevent infinite loops)
  ☐ After 2 passes, remaining issues → QA report as UNRESOLVED
  ☐ No content invention during revision (don't add new claims/scenes)
  ☐ Revision PRESERVES original creative intent
```

---

## 10. STAGE H: QA REPORT

### 10.1 Universal QA Report Structure

```yaml
QA_REPORT:
  metadata:
    report_id: "QA-{timestamp}-{brief_hash}"
    generated_at: "2026-10-28T14:30:00Z"
    skill_version: "2.0.0"
    brief_id: "{brief_hash}"
    format: "documentary"
    content_type: "factual"
    niche_tier: 1
    niche_code: "N01"
    language: "en"
    platform: "youtube"

  summary:
    overall_verdict: "PASS | PASS_WITH_WARNINGS | HOLD | FAIL"
    total_checks_run: 47
    passed: 43
    warnings: 3
    failed: 0
    holds_triggered: 1
    holds_blocking: 0
    holds_advisory: 1
    revision_passes: 1
    
  structural_qa:
    status: "PASS"
    word_count:
      target: 4500
      actual: 4387
      variance: "-2.5%"
      verdict: "PASS"
    duration_estimate:
      target: "30 minutes"
      actual: "29.2 minutes"
      speaking_rate: "150 wpm"
      verdict: "PASS"
    section_compliance:
      - section: "hook"
        budget: {min: 360, target: 450, max: 540}
        actual: 423
        verdict: "PASS"
      # ... per section ...
    format_compliance:
      checks:
        - "8 sections present: PASS"
        - "Evidence citations in discovery: PASS"
        - "NARRATOR labels: PASS"
      verdict: "PASS"

  content_qa:
    canonical_terms:
      subject_mentions: 12
      object_mentions: 8
      mechanism_mentions: 6
      consistency: "PASS — no variant spellings detected"
    open_loops:
      opened: 5
      closed: 5
      unclosed: 0
      verdict: "PASS"
    voice_consistency:
      tone_shifts: 0
      pov_breaks: 0
      verdict: "PASS"
    speakability:
      max_sentence_length: 28
      passive_voice_ratio: "8%"
      acronym_expansions: "all present"
      verdict: "PASS"
    anti_ai:
      patterns_detected: 0
      verdict: "PASS"

  evidence_qa:  # (omitted if content_type = creative)
    active: true
    traceability:
      claims_found: 23
      claims_cited: 23
      uncited_claims: 0
      verdict: "PASS"
    epistemic_compliance:
      confirmed_treated_correctly: 15
      preliminary_with_qualifier: 5
      disputed_multi_perspective: 2
      hypothetical_framed: 1
      violations: 0
      verdict: "PASS"
    source_rights:
      blocked_cited: 0
      quarantined_cited: 0
      caveated_without_label: 0
      verdict: "PASS"
    claim_independence:
      circular_evidence: false
      single_source_critical: 0
      verdict: "PASS"

  format_specific_qa:
    format: "documentary"
    checks:
      - check: "Investigation arc completeness"
        verdict: "PASS"
      - check: "Evidence density in discovery"
        result: "5 citations (min: 3)"
        verdict: "PASS"
      # ... per format check ...

  niche_specific_qa:
    niche: "N01"
    tier: 1
    checks:
      - check: "Forecast staleness"
        result: "forecast_issued_at within 2 hours"
        verdict: "PASS"
      - check: "NWS/NOAA attribution"
        result: "NOAA cited 4 times"
        verdict: "PASS"
      # ... per niche check ...

  holds:
    triggered: 1
    blocking: 0
    advisory: 1
    items:
      - hold_type: "HOLD_DOMAIN_UNKNOWN"
        severity: "ADVISORY"
        trigger: "Sub-topic 'quantum computing in weather prediction' — not covered by N01 adapter"
        location: "Section: mechanism, paragraph 3"
        recommendation: "Human review recommended for quantum computing claims"
        status: "PENDING_HUMAN"

  revision_log:
    passes: 1
    changes:
      - pass: 1
        action: "Trimmed implications section by 45 words (was 5% over budget)"
        result: "Section now within budget"
      - pass: 1
        action: "Added epistemic qualifier to preliminary evidence E-015"
        result: "Compliance restored"

  experimental_techniques_used:
    - technique: "X01 — tension alternation"
      sections_applied: ["discovery", "challenge"]
      label: "EXPERIMENTAL"
      disclaimer: "This technique is based on preliminary research (K017)"
```

### 10.2 Compact QA Report (Short-Form)

Short-form aur commercial scripts ke liye full QA report overkill hai. Compact variant:

```yaml
QA_REPORT_COMPACT:
  verdict: "PASS"
  format: "short_form"
  word_count: "145 / target 150"
  duration: "~58 seconds"
  hook_timing: "PASS — attention grab in first 3 words"
  cta_present: true
  holds: 0
  warnings:
    - "Consider shortening sentence 3 (currently 22 words)"
  notes: "Platform limit: YouTube Shorts ≤ 60s — compliant"
```

---

## 11. CURRENT SKILL QA → UNIVERSAL QA MAPPING

| Current Stage 7 (Editorial Revision) | Universal QA Stage | Status |
|---|---|---|
| Verify canonical terms | Stage B: Canonical Terms | **RETAINED** |
| Verify [E-XXX] tags | Stage C: Evidence Traceability | **RETAINED** (factual mode) |
| Check open-loop payoffs | Stage B: Open Loop Closure | **RETAINED + EXTENDED** |
| Trim/expand word budgets | Stage A: Structural QA | **RETAINED** |
| Verify epistemic qualifiers | Stage C: Epistemic Compliance | **RETAINED** (factual mode) |
| Read-aloud pass | Stage B: Speakability | **RETAINED** |
| Verify connections | Stage B: Open Loop Closure | **RETAINED** |

| Current Stage 8 (QA Report) | Universal QA | Status |
|---|---|---|
| Run metadata | Stage H: metadata | **RETAINED** |
| Word counts | Stage H: structural_qa | **RETAINED** |
| Evidence compliance | Stage H: evidence_qa | **RETAINED** (conditional) |
| HOLD register | Stage H: holds | **RETAINED + EXTENDED** |
| Stage pass/fail | Stage H: summary.overall_verdict | **RETAINED** |

**Conclusion:** Current QA ka 100% universal QA mein mapped hai. Koi bhi existing capability LOST nahi hoti — sirf CONDITIONAL activation aur NEW checks add hote hain.

**NOTE — Test Baseline Reconciliation:**
Current test suite: **85 integration + 37 prototype = 122 core tests**, plus **12 invocation-pipeline checks** (separately categorized). Documents mein pehle "129/129" reference use hua tha — corrected baseline yeh hai.

---

## 12. UNRESOLVED QA DESIGN QUESTIONS

| Question | Impact | Options | Recommendation |
|---|---|---|---|
| **Q1:** QA report always verbose or adaptive? | UX | Always full / compact for short-form / user selects | **Adaptive** — compact for < 5 min, full otherwise |
| **Q2:** Auto-revision limit? | Quality vs speed | 1 pass / 2 passes / unlimited | **2 passes** — diminishing returns after |
| **Q3:** Should QA metrics persist across runs? | Learning | Store metrics / stateless | **Stateless initially** — persistence in future |
| **Q4:** HOLD severity: who decides blocking vs advisory? | Safety | Author / system / hybrid | **System defines defaults, owner overrides** |
| **Q5:** Format QA extensibility — user-defined checks? | Custom formats | Allow custom checks / fixed checks | **Allow via custom_format_spec.qa_checks** |

---

## 13. CONCLUSION (Roman Urdu)

**Universal QA Design current SKILL.md ke QA system ka COMPLETE SUPERSET hai — koi existing check hataya nahi gaya, sirf naye checks add kiye gaye hain aur activation CONDITIONAL banayi gayi hai.**

**Key design decisions:**
1. **8-stage QA pipeline** (A-H) — modular, sequential, extensible
2. **Content-type conditional activation** — evidence QA factual mein full, creative mein fiction frame check
3. **Format-specific QA modules** — har format apne checks register karta hai
4. **Niche-specific QA** — Tier 1 full adapter checks, Tier 2 domain overlays, Tier 3 UNIVERSAL + safety overlays
5. **18 HOLD types** (12 existing + 6 new) — BLOCKING vs ADVISORY distinction
6. **Compact QA variant** — short-form scripts ke liye lightweight report
7. **Revision limits** — max 2 passes to prevent infinite loops
8. **Backward compatibility** — current documentary QA unchanged → **DESIGN TARGET** until executed regression tests establish it

**DESIGN TARGET Declarations:**
- Backward compatibility (100% current QA preserved) → **DESIGN TARGET** until executed regression tests establish it
- Format-specific QA module coverage → **DESIGN TARGET** until per-format pilot scripts validate each module
- Language-specific QA checks → **DESIGN TARGET** until non-English pilot scripts validate multilingual checks

**Phase 2A DESIGN ONLY — koi code implement nahi kiya gaya.**
