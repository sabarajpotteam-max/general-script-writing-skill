---
description: Evidence-aware multi-format scriptwriting with adaptive content types, controlled research integration, niche adaptation, and editorial QA. Candidate — not production.
---

# Universal Professional Scriptwriting Skill (Candidate)

> **Status:** RESEARCH_ONLY candidate. Not production-cleared. Not rights-released.
> All technique proposals remain RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION.
> This is a non-production candidate built from three audited research streams.

## Purpose

When invoked, this skill produces a structured, evidence-aware script
from a user-supplied brief (topic, format, content type, evidence set,
and niche selection). It supports factual, creative, hybrid, and
instructional content types with adaptive evidence requirements.
It enforces epistemic integrity, niche-specific safety rules,
and editorial quality standards derived from a three-stream research base.

## Research Provenance

Three research streams inform this skill:

| Stream | Scope | Items |
|--------|-------|-------|
| Claude/GitHub | S01–S63 agent skill repositories, F-001 to F-221 findings | 75 validated findings |
| ChatGPT Real-World | R-sources, K001–K048 technique proposals | 48 proposals (all RESEARCH_ONLY) |
| YouTube DNA | V01–V12 caption-pattern pilot | 12 descriptive observations |

Crosswalk classification: 24 UNIVERSAL, 26 CONDITIONAL, 44 EXPERIMENTAL, 5 REJECTED.

## How to Invoke

Provide these inputs as structured text or JSON:

```
Title:    <script title>
Niche:    <N01|N02|N03|N04|N05|domain:<name>|"free text description">
Subject:  <primary subject — person, institution, phenomenon>
Object:   <what the subject acts on or relates to>
Mechanism: <how subject and object connect>
Uncertainty: <may|likely|is believed to|confirmed — epistemic qualifier>
Target words: <2500–8000, default 3000>
Evidence: <list of evidence items, each with id, description, source type, and epistemic status>
```

**Optional M3 fields** (omit to use automatic inference):

```
Format:        <documentary|explainer|short_form|custom> (default: documentary)
Content type:  <factual|creative|hybrid|instructional> (inferred from format + objectives if omitted)
Research mode: <client_provided|system_assisted|minimal> (inferred from content type + evidence if omitted)
Topic:         <topic string for research queries — new-style briefs>
Audience:      <target audience description>
Language:      <output language — default: English>
Objectives:    <inform|educate|entertain|sell|persuade — used for content type inference>
```

**Content type inference rules** (when `content_type` is not explicit):
- Documentary / Explainer formats → factual
- Short-form with objectives "inform"/"educate" → factual
- Short-form with objectives "entertain" → creative
- Short-form with objectives "sell"/"persuade" → hybrid
- Custom format without explicit content_type → HOLD (must be specified)

**Research mode inference rules** (when `research_mode` is not explicit):
- Evidence provided in brief → client_provided
- Creative content type → minimal
- Legacy briefs (subject/object/mechanism, no topic field) without evidence → client_provided (backward compatible)
- New-style factual/hybrid/instructional briefs without evidence → system_assisted

### Niche Codes

| Code | Domain | Key Concern |
|------|--------|-------------|
| N01 | USA Weather / Forecasting | Forecast staleness, official warning attribution |
| N02 | Military / Aviation | Operational status claims, technology stage |
| N03 | German WW1/WW2 Human Stories | Quote authenticity, translation qualifiers, archival integrity |
| N04 | Disaster News | Casualty figure provisionality, synthetic media disclosure |
| N05 | Psychology / Explainers (General) | Study citations, effect size qualifiers, replication status |

### Dynamic Niche Resolution (M1)

The skill supports three tiers of niche resolution:

| Tier | Input Format | Behavior |
|------|-------------|----------|
| **Tier 1: Registered** | `N01`–`N05` (or custom registered) | Full adapter with specific HOLD rules and context requirements |
| **Tier 2: Recognized Domain** | `domain:<name>` (e.g., `domain:science`, `domain:engineering`) | Domain-specific policies and safeguards from configurable registry |
| **Tier 3: Open Niche** | Any free text (e.g., `"artisanal cheese making"`) | Universal writing rules + cross-cutting safety safeguards |

Available Tier 2 domains: `science`, `history`, `technology`, `health`, `finance`, `education`, `sports`, `real_estate`, `engineering`.

High-stakes domains (health, finance, legal, military) are automatically flagged for HOLD_REVIEW.
Unknown niches are NOT rejected — they receive universal safeguards and are accepted for processing.
Niche codes matching the pattern N+digits that are not registered (e.g., `N99`) ARE rejected to prevent ambiguity.

## Workflow Stages

Follow these eight stages in order. Do not skip stages. Record the status
of each stage (PASS, HOLD, or SKIP) in the final QA report.

---

### Stage 1: Topic Intake and Subject/Object Preservation

**Purpose:** Lock the terminology and epistemic frame before writing begins.

1. Parse the user's input into: title, niche, subject, object, mechanism, uncertainty, target word count, evidence list, and optional M3 fields (format, content_type, research_mode, topic, audience, language, objectives).
2. If any required field is missing, report which fields are missing and stop.
3. Resolve the format (default: documentary) and niche via the dynamic niche resolver. Tier 1 registered niches (N01–N05+) get full adapters; Tier 2 recognized domains get domain-specific policies; Tier 3 open niches get universal safeguards. Invalid niche codes (e.g., N99) stop with error.
4. **Resolve M3 content type and research mode.** Infer content_type from explicit field, format default, or objectives. Infer research_mode from explicit field, evidence presence, content type, or legacy brief detection. Record both with their inference source.
5. Record the **canonical terms**: the exact spellings of subject, object, and mechanism. These terms must appear consistently throughout the script. Do not introduce synonyms that could create ambiguity.
6. Record the **epistemic qualifier** (e.g., "may," "is believed to"). The script must not upgrade this qualifier without new evidence.
7. Assign a run ID: `run-<niche>-<YYYYMMDD>-<seq>`.

**HOLD conditions:**
- Missing required field → HOLD_MISSING_IDENTITY
- Invalid niche → HOLD_MISSING_IDENTITY

---

### Stage 2: Evidence and Claim Research Validation

**Purpose:** Verify every evidence item is usable and properly qualified.
Evidence requirements adapt to content type and research mode (resolved in Stage 1).

**Conditional evidence handling by content type:**

| Content Type | Evidence Register Required | Fabricated Facts Blocked | Notes |
|---|---|---|---|
| **factual** | Yes — all substantive claims need evidence | Yes | Full evidence validation applies |
| **creative** | No — no evidence register required | Yes — fabricated real-world facts still blocked | Creative fiction is allowed; claiming real events/people did things they didn't is not |
| **hybrid** | Yes — for factual claims only | Yes | Creative elements tracked separately from factual claims |
| **instructional** | Yes — accuracy verification required | Yes | Formal citations optional for low-risk common procedures |

**Conditional evidence handling by research mode:**

| Research Mode | Behavior |
|---|---|
| **client_provided** | Evidence must be in the brief. Empty evidence → HOLD_UNVERIFIED_FACT (legacy behavior) |
| **system_assisted** | No evidence in brief is a warning, not a HOLD. System-assisted research needed before factual claims |
| **minimal** | No evidence register required (creative content) |

For each evidence item in the input (skip if content type is `creative` with no evidence provided):

1. **Check blocked sources.** If the evidence ID matches F-190, R052, or any item in the blocked list, reject it with HOLD_SOURCE_ROLE. F-190 is a negative finding (readability formulas are NOT validated for listening) and cannot be used as positive evidence. R052 has a non-support relation.
2. **Check quarantined techniques.** If the evidence references K029, K030, or K031, reject it with HOLD_SOURCE_ROLE. These are quarantined for lacking YouTube script-effect transfer evidence.
3. **Check source availability.** If the evidence references B70, B71, or B72, flag with a caveat: original source has access restrictions.
4. **Verify epistemic status.** Each evidence item should declare one of: `confirmed`, `replicated`, `preliminary`, `disputed`, `qualified`, `hypothetical`. If missing, assign `qualified` by default and note the assignment.
5. **Check provenance.** If the evidence has no stated origin (no author, no institution, no publication), flag with HOLD_DISPUTED_PROVENANCE.
6. **Build the evidence register.** Create a numbered list [E-001] through [E-NNN] mapping each evidence item to its ID, source, epistemic status, and any caveats.

**HOLD conditions:**
- Blocked source used → HOLD_SOURCE_ROLE
- Quarantined technique referenced → HOLD_SOURCE_ROLE
- No provenance → HOLD_DISPUTED_PROVENANCE
- Evidence claims "confirmed" but only one source → HOLD_UNVERIFIED_FACT
- Factual/hybrid/instructional content with no evidence AND research_mode is client_provided → HOLD_NO_EVIDENCE

---

### Stage 3: Narrative Blueprint and Section-Level Word Budgets

**Purpose:** Plan the script structure before writing a single line, using the format selected in Stage 1.

1. **Resolve the format arc.** Use the format resolved during input validation (default: documentary). The format registry provides the arc template with section names and budget percentages. Apply the resolved arc — do not hardcode a single format's sections.

   **Documentary** (Investigation Arc — 8 sections):

   | Section | Purpose | Budget % |
   |---------|---------|----------|
   | Hook | Draw the viewer in with a vivid scene or question | 8–12% |
   | Problem | Establish why this topic matters | 12–15% |
   | Discovery | Present the core finding or narrative turn | 16–20% |
   | Mechanism | Explain how/why it works | 12–15% |
   | Challenge | Present skepticism, counter-evidence, or complications | 12–15% |
   | Resolution | Show how the tension resolves (or doesn't) | 14–18% |
   | Implications | What this means going forward | 8–12% |
   | Outro | Return to the opening, close the loop | 5–8% |

   **Explainer** (Concept Progression Arc — 7 sections):

   | Section | Purpose | Budget % |
   |---------|---------|----------|
   | Hook | Open with a relatable question or surprising fact | 10–15% |
   | Foundation | Establish the base concept the audience needs | 15–20% |
   | Build | Layer complexity onto the foundation | 20–25% |
   | Example | Concrete illustration of the concept | 15–20% |
   | Nuance | Address edge cases, caveats, or counter-intuitive aspects | 10–15% |
   | Synthesis | Tie everything together into a coherent understanding | 10–15% |
   | Next Steps | What the audience can do with this knowledge | 5–10% |

   **Short-form** (Hook-Body-CTA Arc — 3 sections):

   | Section | Purpose | Budget % |
   |---------|---------|----------|
   | Hook | Capture attention within first 15 words | 15–25% |
   | Body | Deliver the core message | 50–65% |
   | CTA | Call to action or closing thought | 15–25% |

2. Calculate word budgets from the target word count using the resolved arc's percentages. Example for documentary at 3000 words:
   - Hook: 240–360, Problem: 360–450, Discovery: 480–600, Mechanism: 360–450, Challenge: 360–450, Resolution: 420–540, Implications: 240–360, Outro: 150–240.

3. **Map evidence to sections.** Each section must list which evidence items [E-XXX] it will reference. Every evidence item must appear in at least one section. An unused evidence item triggers a review note (not a HOLD). For formats with `evidence_requirement: optional` or `contextual`, evidence mapping is recommended but not mandatory.

4. **Identify open loops.** Plan at least one open loop: a question, mystery, or tension raised early that pays off in a later section. Record the setup section and payoff section. For short-form scripts, a single hook-payoff pair is sufficient.

**HOLD conditions:** None at this stage (blueprint is advisory).

---

### Stage 4: Hook Selection Grounded in Format and Subject

**Purpose:** Choose the opening approach based on what the subject warrants.

Select ONE hook type from the following, based on the niche and evidence:

| Hook Type | When to Use | Crosswalk Source |
|-----------|-------------|------------------|
| **Scene** | You have a vivid, verifiable moment to open with | F-180, K008 |
| **Question** | The topic has a clear central mystery | K009, K012 |
| **Statistic** | A striking, well-sourced number leads naturally into the story | K010 |
| **Contrast** | The discovery overturns a common assumption | K009 |
| **Character** | A specific person drives the narrative | K011, K008 |

Rules:
- The hook must be factually supportable by at least one evidence item.
- Do not use a retention-time claim (e.g., "you must hook within 60 seconds"). F-181 is REJECTED — there is no validated universal timing rule.
- Do not use a mooc-engagement or TTS-speech-rate claim as a universal law (K029–K031 are quarantined).
- If no hook type fits, use a simple declarative opening and note the choice.

**HOLD conditions:**
- Hook makes a factual claim not in the evidence register → HOLD_UNVERIFIED_FACT

---

### Stage 5: Full Section-by-Section Documentary Scriptwriting

**Purpose:** Write the actual script, section by section.

For each section in the blueprint:

1. **Write within the word budget.** Aim for the middle of the range. Track running word count.
2. **Apply UNIVERSAL writing standards** (all 24 items are requirements):
   - One idea per sentence. [F-100, K019]
   - Short, familiar words over long, technical ones. [F-101, K019, K021]
   - Active voice by default; passive only when the actor is unknown or irrelevant. [F-102, K006, K025]
   - Avoid jargon; if a technical term is necessary, define it on first use. [F-105, K021]
   - Use consistent terminology for the canonical subject, object, and mechanism. Do not introduce synonyms. [F-106, K023, K047]
   - Write for read-aloud delivery: sentences should sound natural when spoken. [F-107, K045]
   - Avoid nominalizations (use "decide" not "make a decision"). [F-108, K019]
   - Every factual claim must be traceable to an evidence item [E-XXX]. [F-120, K003, K042, K043]
   - Decompose compound claims into separate, verifiable statements. [F-121, K003, K028, K047]
   - Never fabricate quotes, characters, dialogue, or evidence. [F-205, K025]
   - Maintain continuity across sections. [F-206, K047]
   - Do not present AI-generated content as human-authored. [F-140]
   - Preserve the epistemic qualifier — do not upgrade "may" to "does" without new evidence. [K002]
   - Separate retention analytics from view counts in any data discussion. [K005]
   - Obtain or note subject consent where applicable. [K006]
   - Date all forecasts and flag uncertainty. [K026]
   - Avoid universal timing quotas (no "the first 60 seconds" rules). [K040]
   - Do not infer performance from caption patterns alone. [K041]
   - Script quality does not equal viewer effectiveness — do not claim otherwise. [K042]
   - Compress for truth preservation, not dramatic effect. [K034]
   - Core message discipline: every section must serve the central thesis. [F-203, K048]

3. **Apply CONDITIONAL standards** when their conditions are met:
   - Direct "you" address: use in instructional/explainer formats, not fiction narration. [F-103]
   - Present tense: use for instructional content only. [F-104]
   - Contractions: use for spoken delivery, avoid in formal written contexts. [F-111]
   - Front-load the main point: use in informational sections, not suspense-building ones. [F-112]
   - Hook/context/body/climax/CTA structure: use for video formats with retention goals. [F-180, K038, K039]
   - Modality effect: when describing visuals, narrate rather than display text. [F-170, K004, K022]
   - Expertise reversal: adjust complexity to audience knowledge level. [F-173, K021, K044]

4. **Label EXPERIMENTAL techniques** when used. Do not present them as validated rules:
   - Structure frameworks (three-act, Save the Cat, Hero's Journey) are optional organizational tools, not requirements. [F-020, F-021, K014]
   - Scene-sequel cycles are a narrative option for fiction-adjacent formats. [F-012, K015]
   - Tension/recovery alternation is an untested hypothesis about pacing. [K017]

5. **Include evidence references** inline as [E-XXX] after each factual claim (required for factual/hybrid/instructional content types; not required for creative, but fabricated real-world facts are still blocked regardless of content type).
6. **Write scene directions** in brackets: `[SCENE: description]`, `[B-ROLL: description]`.
7. **Write narration** as `NARRATOR: text`.
8. **Write interviews** as `[INTERVIEW: Name, Title]` followed by `NAME: quote`.

---

### Stage 6: Open-Loop Setup and Factual Payoff Checks

**Purpose:** Verify narrative integrity.

After writing all sections:

1. **Check open loops.** For each question, mystery, or tension raised in the script, verify it has a payoff in a later section. An unanswered open loop is a structural defect.
2. **Check factual payoffs.** For each evidence item referenced early with a qualifier ("preliminary," "disputed"), verify the script either resolves the qualification later or explicitly states it remains unresolved.
3. **Check title premise.** If the title implies certainty (contains "confirmed," "proven," "destroyed," "guaranteed"), but the evidence qualifier is not "confirmed," flag with HOLD_TITLE_PREMISE.

**HOLD conditions:**
- Title implies certainty, evidence does not support it → HOLD_TITLE_PREMISE
- Open loop with no payoff and no acknowledgment → flag in QA (not a HOLD)

---

### Stage 7: Editorial Revision and Natural Voiceover Polishing

**Purpose:** Polish the script for spoken delivery.

1. **Read-aloud pass.** Review every sentence as if reading it aloud. Replace any sentence that sounds unnatural, too long, or tongue-twisting. [F-107, K045]
2. **Active voice audit.** Flag and rewrite any passive-voice sentence that could be active without losing meaning. [F-102]
3. **Jargon audit.** Verify every technical term is defined on first use. [F-105, K021]
4. **Nominalization audit.** Replace nominalizations with their verb forms. [F-108]
5. **Consistency audit.** Verify canonical terms (subject, object, mechanism) have not drifted into synonyms. [F-106, K023]
6. **Qualifier audit.** Verify the epistemic qualifier has not been upgraded. [K002]
7. **Transition check.** Verify each section connects naturally to the next. [K019]
8. **Remove filler.** Cut empty phrases ("it is important to note that," "as a matter of fact"). No sentence should exist only to fill space.

**HOLD conditions:**
- Revision changes a factual claim → HOLD_NEEDS_RECHECK
- Revision removes an evidence reference → flag in QA

---

### Stage 8: Final Word Counts, Evidence Traceability, and QA/HOLD Report

**Purpose:** Produce the editorial quality report.

Generate a report with:

1. **Word counts:**
   | Section | Budget | Actual | Status |
   |---------|--------|--------|--------|
   (one row per section)
   | **Total** | target | actual | PASS/OVER/UNDER |

2. **Evidence traceability matrix:**
   | Evidence ID | Description | Referenced in sections | Epistemic status | Caveats |
   (one row per evidence item)

3. **Open-loop register:**
   | Setup (section) | Payoff (section) | Status |
   (CLOSED or OPEN)

4. **HOLD register:**
   | HOLD type | Triggered by | Section | Resolution |
   (empty if no HOLDs)

5. **Stage status summary:**
   | Stage | Status |
   |-------|--------|
   | 1. Topic Intake | PASS/HOLD |
   | 2. Evidence Validation | PASS/HOLD |
   | 3. Blueprint | PASS |
   | 4. Hook Selection | PASS/HOLD |
   | 5. Section Writing | PASS/HOLD |
   | 6. Payoff Checks | PASS/HOLD |
   | 7. Editorial Revision | PASS/HOLD |
   | 8. QA Report | COMPLETE |

6. **Final verdict:** RESEARCH_ONLY_TERMINAL (all stages pass) or HOLD (list reasons).

---

## Niche Adapter Rules

Apply these rules IN ADDITION TO the universal standards when the
selected niche matches.

### N01: USA Weather / Forecasting

- Every forecast datum must name the issuing agency and issue time. [K026]
- A forecast with a validity window under 1 hour that is not marked as historical context triggers HOLD_STALE_FORECAST.
- Projections labelled as official warnings must be verified against the issuing agency. If unverifiable, trigger HOLD_UNVERIFIED_FACT.
- Historical weather events may use expired forecasts IF clearly marked as historical. [K028]
- Do not present model outputs as confirmed weather events.

### N02: Military / Aviation

- Technology described as "operational" must have a verified deployment stage. A system in "contracted" or "development" stage described as operational triggers HOLD_UNVERIFIED_FACT.
- Single-party claims (manufacturer claims, press releases) presented as established fact trigger HOLD_UNVERIFIED_FACT. Attribute them: "According to [source]..."
- Classified or restricted information must not be presented as public knowledge.
- Performance specifications must include the source and any conditions or caveats.

### N03: German WW1/WW2 Human Stories

- Every historical quote must be traceable to a documented source. An invented quote presented as historical triggers HOLD_HARM. [K025]
- Translations must preserve qualifiers. If a translation lost a qualifier (e.g., "allegedly" dropped), trigger HOLD_REVIEW. [K023]
- Reenacted footage must never be presented as archival. Reenacted survivor testimony presented as archival triggers HOLD_HARM.
- Survivor accounts deserve dignity protocols: no dramatization that distorts the testimony.

### N04: Disaster News

- Synthetic or AI-generated video claimed as authentic footage triggers HOLD_HARM.
- Provisional casualty figures must be explicitly labelled as provisional. Presenting them as final triggers HOLD_UNVERIFIED_FACT.
- Attributing a disaster to a single cause without citing a study triggers HOLD_UNVERIFIED_FACT. Use "contributing factor" language.
- Ongoing situations require "as of [date/time]" qualifiers.

### N05: Psychology / Explainers (General)

- Study citations must include: author(s), year, institution, sample size, and key finding.
- Effect sizes must be qualified ("small," "moderate," "large") when known. Do not present a small effect as transformative.
- Replication status must be stated: replicated, partially replicated, not yet replicated, or failed replication.
- Population generalizability: note if a study used only WEIRD (Western, Educated, Industrialized, Rich, Democratic) samples and the script claims apply broadly.
- Correlation ≠ causation: explicitly state whether evidence is correlational or causal.

---

## Blocked and Quarantined Items

These items MUST NOT appear as positive evidence or validated rules in any script:

| Item | Status | Reason |
|------|--------|--------|
| F-190 | BLOCKED | Negative finding: readability formulas NOT validated for listening |
| R052 | BLOCKED | Non-support relation |
| K029 | QUARANTINED | Mechanism-level psychology: no YouTube script-effect transfer |
| K030 | QUARANTINED | MOOC engagement: bounded empirical, no script transfer |
| K031 | QUARANTINED | Listening modality: bounded empirical, F-190 non-support |
| B70–B72 | CAVEATED | Original source availability has access restrictions |

---

## Output Format

The final output consists of four parts:

### Part 1: The Script
A complete script in Markdown with:
- Title and metadata header (including content type and research mode)
- Scene directions in brackets
- Narrator voiceover text
- Interview segments (if applicable)
- Inline evidence references [E-XXX] (when content type requires evidence)
- Section headers matching the blueprint

### Part 2: The Evidence Register
A table mapping every [E-XXX] reference to its source, status, and caveats.
For creative content with no evidence register, this part states: "Evidence register not required for creative content type."

### Part 3: The M3 Resolution Summary
Content type, research mode, evidence policy, and any QA limitations:
- Content type (and inference source: explicit, format_default, objectives_inference, safe_fallback)
- Research mode (and inference source: explicit, evidence_present, creative_default, legacy_factual_default, factual_no_evidence)
- Evidence policy description
- QA limitations (e.g., custom format structural QA limitations)

### Part 4: The QA Report
The Stage 8 report as specified above.

---

## HOLD Severity

- **HOLD_HARM** and **HOLD_SOURCE_ROLE** are ALWAYS BLOCKING. They cannot be bypassed, downgraded, or overridden by advisory labels. Unresolved factual-integrity and safety issues must block release.
- **HOLD_NO_EVIDENCE** blocks when content type requires evidence and either (a) research_mode is not system_assisted, or (b) research_mode is system_assisted but no research provider is available (UNRESOURCED state — M3.1 safety gate). Warnings alone never authorize unsupported factual claims.
- All other HOLD types also block the final verdict unless explicitly resolved.

## M3.1 Additions — Safety Patch

### Simple Client Briefs (FIX 3, updated M3.2)

New-style briefs require only `niche` and `topic` (plus optional `title`, `audience`, `language`, `format`, `duration`, `objectives`). Title is no longer required — if omitted, a provisional title `[Provisional] <topic>` is derived internally. The legacy fields `subject`, `object`, `mechanism` are not required when `topic` is present. If `uncertainty` is omitted, it defaults to `"qualified"`. The original input object is never mutated — all defaults are applied to an internal working copy.

### Research States (FIX 2, updated M3.2)

Each brief is assigned a research state reflecting evidence readiness:

| State | Meaning |
|-------|---------|
| `not_started` | No research initiated (minimal mode, or client_provided with no evidence) |
| `submitted` | Client-provided evidence present but not independently verified (M3.2) |
| `research_pending` | System-assisted research needed, provider available |
| `verified` | Evidence independently verified (NOT from client_provided alone) |
| `partially_verified` | System-assisted mode with some evidence present |
| `unresourced` | System-assisted research needed but no provider available |
| `failed` | Research attempted but failed |

**M3.2 correction:** Client-provided evidence is assigned `submitted`, not `verified`. Evidence present ≠ evidence verified. The verification pipeline is: submitted → schema validated → provenance assessed → independently verified → rights cleared. Each step is separate.

### Generation Readiness Gates (FIX 2)

Four gates control progression from brief acceptance to output:

| Gate | Meaning |
|------|---------|
| `brief_accepted` | No blocking HOLDs in brief validation |
| `research_ready` | Evidence verified, partially verified, or not required |
| `factual_generation_permitted` | Brief accepted AND evidence sufficient for factual claims |
| `production_release_permitted` | Always `false` — RESEARCH_ONLY status enforced |

If factual research is required but no authorized provider or verified evidence is available, `factual_generation_permitted` is `false`. Offline fixture providers are explicitly NOT live research and NOT verified evidence.

### Exact Section Budgets (FIX 4)

Section word budgets are computed using the largest-remainder method to guarantee the sum equals `target_words` exactly, while respecting each section's min/max percentage constraints. No rounding drift.

### Hybrid Claim Boundaries (FIX 5)

Individual claims within hybrid content are tagged as `factual_claim`, `creative_element`, or `ambiguous` using indicator-based detection. High-risk domains (health, finance, legal, safety) force all claims to `factual_claim` regardless of indicators. Mixed indicators resolve to `factual_claim` (safety-first).

## M3.2 Additions — Final Safety & Consistency Gate

### FIX 1: Evidence Submission vs Verification (SUBMITTED state)

Client-provided evidence is assigned state `submitted`, not `verified`. The evidence verification pipeline has five distinct stages — submitted, schema validated, provenance assessed, independently verified, rights cleared — and each must be assessed separately. Offline fixture evidence is also `submitted`, never `verified`.

### FIX 2: Single Authoritative Generation Gate

`generation_permitted` and `generation_readiness.factual_generation_permitted` always agree — both derive from one `assessGenerationReadiness` call that incorporates ALL blocking HOLDs. Research states `submitted`, `research_pending`, `unresourced`, `partially_verified`, and `failed` all block factual generation. Provider available ≠ research complete. (M3.3 corrected: `submitted` added to blocked states.)

### FIX 3: Simple Client Brief Compatibility

New-style briefs (topic/niche/audience/language/format/duration) no longer require `title`. A provisional title is derived internally from the topic. The original input object is never mutated — a shallow copy (`workingBrief`) receives all defaults. Legacy briefs (subject/object/mechanism) preserve existing title-required behavior.

### FIX 4: Hybrid Claim Safety

Ambiguous statements in creative sections are NOT auto-classified as fictional. They receive type `ambiguous` with `requires_review: true`. Factual claims in creative sections still require evidence. High-risk domain safeguards are preserved. The regex classifier provides indicator-based detection, not semantic fact-checking.

## M3.3 Additions — Final Evidence Trust Gate

### FIX 1: Correct Research Readiness

SUBMITTED evidence is no longer treated as research-ready or sufficient for factual generation. Only VERIFIED evidence (from a trusted verification mechanism) can satisfy the research-ready gate for evidence-required content. The complete state matrix for evidence-required (factual/hybrid/instructional) content:

| State | research_ready | factual_generation_permitted |
|-------|---------------|------------------------------|
| `not_started` | false | false |
| `submitted` | false | false |
| `research_pending` | false | false |
| `partially_verified` | false | false |
| `unresourced` | false | false |
| `failed` | false | false |
| `verified` | true | true (if brief_accepted) |

Creative content (evidence not required) bypasses this gate entirely.

### FIX 2: Trustworthy Verification Transition

**Trusted verification mechanism: NOT YET IMPLEMENTED.** No code path in `deriveResearchState` currently returns VERIFIED. Client-provided fields (`verification_status`, `verified`, `is_verified`), the `providerAvailable` flag, and offline fixtures cannot self-certify evidence as verified. A future trusted verifier must provide: claim-level source assessment, provenance verification, and independent corroboration traceable to assessed sources. Until implemented, all evidence-required factual generation remains blocked.

### FIX 3: Separate Workflow Permissions

Four distinct workflow outcomes are maintained:
- **A. Brief accepted for planning:** `brief_accepted` — no blocking HOLDs
- **B. Research/evidence preparation allowed:** Briefs pass topic intake for planning regardless of evidence state
- **C. Verified factual generation permitted:** `factual_generation_permitted` — requires VERIFIED state AND brief_accepted
- **D. Production release permitted:** `production_release_permitted` — always FALSE (RESEARCH_ONLY)

SUBMITTED evidence supports review and preparation but cannot authorize factual assertions.

### FIX 4: Single Authoritative Gate (strengthened)

All gate outputs derive from one `assessGenerationReadiness` call after ALL holds are collected. The blocker list explicitly explains every blocked state. Gates never contradict: if not `research_ready`, then `factual_generation_permitted` is false; if not `brief_accepted`, then `factual_generation_permitted` is false; `production_release_permitted` is always false.

---

## M4: Flexible Duration & Runtime Intelligence

**Baseline:** b119480 (M3.3 Evidence Trust Gate)
**Module:** `scripts/duration_engine.mjs` (independent, zero dependencies)

### Speaking Rates

| Rate ID | WPM | Use Case |
|---------|-----|----------|
| `standard_narration` | 150 | Documentary, explainer (default) |
| `conversational` | 170 | Casual explainer, podcast-style |
| `energetic` | 190 | Fast-paced, high-energy |
| `deliberate` | 120 | Formal, educational, measured |

All rate objects are `Object.freeze()`-immutable.

### Duration Parsing

`parseDuration(input)` accepts: `"30 seconds"`, `"10 minutes"`, `"2 hours"`, `"1.5 hours"`, `"0.5 min"`, `"30 sec"`. Rejects: negative, zero, NaN, Infinity, malformed, >10 hours.

### Word Count Resolution Priority

`resolveTargetWords(brief, resolvedFormat)` follows this strict priority:

1. **Explicit `target_words`** — used as-is if within universal range (50–50,000)
2. **Computed from `target_duration` + `speaking_rate`** — parsed duration × WPM
3. **Format default** — midpoint of format's `word_range`
4. **Universal fallback** — 3,000 words

Out-of-range warnings are added when target exceeds format-specific word range.

### Runtime Estimation

`estimateRuntime(spokenWords, speakingRate)` returns frozen object with: `spoken_words`, `wpm`, `estimated_minutes`, `estimated_seconds`, `display` (e.g. "~20m 0s"), and a note that this is an estimate only.

### Section Budget Reconciliation

The largest-remainder method ensures section word budgets sum **exactly** to the target word count — no rounding drift. Each section is clamped within its arc-defined min/max percentage range.

### Integration Points

- **validate.mjs:** `word_resolution` block in output includes target_words, source, speaking_rate, duration, format_range, and runtime_estimate. Duration engine functions re-exported.
- **structure_loader.mjs:** Uses `resolveTargetWords` for unified word-count resolution. Includes `speaking_rate` and `runtime_estimate` in structure output.
- **analyzeScript():** Includes `narration_runtime` computed from spoken narration words excluding metadata.

### Safety Invariants Preserved

- M3.3 evidence trust gate intact: SUBMITTED still blocks factual generation
- `production_release_permitted` remains always FALSE
- Input immutability maintained (shallow copy of brief)
- Single authoritative generation gate unchanged
- Duration calculations do not validate script quality

## M5: Multi-Voice Output Engine

**Baseline:** 02cb84f (M4 Duration & Runtime Intelligence)
**Module:** `scripts/voice_engine.mjs` (independent, zero dependencies beyond format_registry)

### Voice Modes

| Mode | Labels | Speakers | Description |
|------|--------|----------|-------------|
| `single_narrator` | NARRATOR | 1 | Single speaker narration (default) |
| `host_guest` | HOST, GUEST [, GUEST_2] | 2–3 | Host with one or more guests |
| `multi_character` | From `characters[]` | 2–20 | Named character dialogue |
| `interview` | INTERVIEWER, INTERVIEWEE | 2 | Interviewer and interviewee format |
| `brand_voice` | NARRATOR | 1 | Brand-aware single-speaker narration |

All mode definition objects are `Object.freeze()`-immutable.

### Voice Input Schema

```
voice: {
  mode:        <single_narrator|host_guest|multi_character|interview|brand_voice>
  tone:        <authoritative|conversational|intimate|dramatic|playful|comedic|formal|casual>
  formality:   <1-5 integer>
  humor_level: <0-3 integer>
}
brand_voice: {
  guidelines:       <string — required for brand_voice mode>
  keywords_include:  [<strings>]
  keywords_exclude:  [<strings>]
  reference_url:     <string — optional>
}
characters: [           (required for multi_character mode, min 2)
  { name, role, voice_characteristics }
]
```

### Voice Resolution Priority

`resolveVoiceMode(brief, resolvedFormat)` follows this priority:

1. **Explicit `voice.mode`** — validated against VOICE_MODE_SET
2. **Format default** — from `FORMAT_VOICE_DEFAULTS` or format's `voice_default`
3. **Universal fallback** — `single_narrator`

Unknown tones, out-of-range formality (not 1–5), and out-of-range humor_level (not 0–3) produce warnings and are ignored (not HOLDs).

### Speaker Roster and Labels

- `single_narrator` / `brand_voice`: Fixed labels from mode definition
- `host_guest`: HOST + GUEST, optionally GUEST_2 when `voice.guest_2` is set or >2 characters
- `multi_character`: Labels derived from `brief.characters[].name` (uppercased, spaces→underscores)
- `interview`: Fixed INTERVIEWER + INTERVIEWEE
- Transitions computed for all multi-speaker modes (A→B, B→A, etc.)

### Brand Voice Compliance

`checkBrandVoiceCompliance(scriptText, brandVoice)` checks:
- Excluded keywords present in script text → violation
- Required keywords missing from script text → violation
- Returns `{ compliant: boolean, violations: [] }`

### Multi-Voice Script QA

`validateSpeakerLabels(scriptText, voiceResolution)` detects:
- Unrecognized speakers (not in approved roster)
- Missing required speakers (in roster but not in script)
- Unlabeled dialogue in multi-voice modes (lines >10 chars without a speaker label)
- Single-narrator and brand-voice modes allow unlabeled lines

`countSpokenWordsMultiVoice(scriptText, voiceResolution)` provides:
- Per-speaker word counts
- Total spoken words (excluding scene directions, headings, table rows)
- Speaker distribution percentages

### Integration Points

- **validate.mjs:** `voice_resolution` block in validateInput output. Voice QA (`voice_qa`) in analyzeScript output including speaker_validation, brand_compliance, spoken_word_distribution.
- **structure_loader.mjs:** Voice resolution in loadStructure output. Voice mode, labels, tone, and brand voice in writing instructions.
- **analyzeScript():** Uses `resolveTargetWords()` for duration-aware word targets (M4 Correction A). Voice QA integrated alongside word budget analysis.

### M4 Corrections Applied

- **Correction A:** `analyzeScript()` now uses `resolveTargetWords()` instead of falling back to `input.target_words || 3000`. Properly handles target_duration-only briefs.
- **Correction B:** YouTube Shorts platform enforcement: estimated duration >180 seconds produces a HOLD (not just a warning).

### Safety Invariants Preserved

- M3.3 evidence trust gate intact: SUBMITTED still blocks factual generation
- `production_release_permitted` remains always FALSE
- Input immutability maintained (shallow copy of brief)
- Single authoritative generation gate unchanged
- Duration calculations do not validate script quality
- Voice mode does not affect research or evidence requirements

---

## Restrictions

- This skill is a RESEARCH_ONLY candidate. It has not been approved for production use.
- All K001–K048 technique proposals are RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION.
- **Research integration:** system_assisted research mode indicates that research tools are needed but does NOT automatically execute research. No K-series research proposal may be auto-approved. Live web research must never be simulated — never invent URLs, research results, quotations, or citations.
- EXPERIMENTAL techniques (X01–X08) are optional organizational aids. They must NOT be silently activated for production output. Any use of an experimental technique must be explicitly labelled as experimental in the script and QA report. Proposed and unapproved techniques must not be enabled without explicit authorization.
- No wholesale copying of third-party skills, transcripts, or source materials.
- No SKILL.md installation or publication without explicit authorization.
- B1/B2 candidate drafts remain RESEARCH_ONLY with unresolved rights and semantic-evaluation conditions.
- S01–S63 means 63 recorded entries, not 63 validated or licensed methods.
- AP-02 transfer manifest is unset (empty).

## References

- `research/00_archive_audit.md` — Source catalogue (63 entries)
- `research/01_deep_source_inspection_register.md` — 42 deep-inspected sources
- `research/02_scriptwriting_knowledge_extraction_ledger.md` — 75 findings
- `research/03_independent_evidence_matrix.md` — Corroboration and conflicts
- `research/04_universal_conditional_framework_map.md` — U/FS/CS/NS/CD/F classification
- `research/05_research_gaps.md` — Gaps and unresolved claims
- `research/06_continuation_checkpoint.md` — Handoff brief
- `prototype/offline_synthetic_v01/CROSSWALK.md` — 99-item three-stream crosswalk
