---
description: Evidence-aware documentary scriptwriting with niche adaptation and editorial QA. Candidate — not production.
---

# Universal Professional Scriptwriting Skill (Candidate)

> **Status:** RESEARCH_ONLY candidate. Not production-cleared. Not rights-released.
> All technique proposals remain RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION.
> This is a non-production candidate built from three audited research streams.

## Purpose

When invoked, this skill produces a structured, evidence-aware long-form
documentary script from a user-supplied topic, evidence set, and niche
selection. It enforces epistemic integrity, niche-specific safety rules,
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
Title:    <documentary title>
Niche:    <N01|N02|N03|N04|N05>
Subject:  <primary subject — person, institution, phenomenon>
Object:   <what the subject acts on or relates to>
Mechanism: <how subject and object connect>
Uncertainty: <may|likely|is believed to|confirmed — epistemic qualifier>
Target words: <2500–8000, default 3000>
Evidence: <list of evidence items, each with id, description, source type, and epistemic status>
```

### Niche Codes

| Code | Domain | Key Concern |
|------|--------|-------------|
| N01 | USA Weather / Forecasting | Forecast staleness, official warning attribution |
| N02 | Military / Aviation | Operational status claims, technology stage |
| N03 | German WW1/WW2 Human Stories | Quote authenticity, translation qualifiers, archival integrity |
| N04 | Disaster News | Casualty figure provisionality, synthetic media disclosure |
| N05 | Psychology / Explainers (General) | Study citations, effect size qualifiers, replication status |

## Workflow Stages

Follow these eight stages in order. Do not skip stages. Record the status
of each stage (PASS, HOLD, or SKIP) in the final QA report.

---

### Stage 1: Topic Intake and Subject/Object Preservation

**Purpose:** Lock the terminology and epistemic frame before writing begins.

1. Parse the user's input into: title, niche, subject, object, mechanism, uncertainty, target word count, and evidence list.
2. If any required field is missing, report which fields are missing and stop.
3. Validate the niche code (must be N01–N05). If invalid, stop with error.
4. Record the **canonical terms**: the exact spellings of subject, object, and mechanism. These terms must appear consistently throughout the script. Do not introduce synonyms that could create ambiguity.
5. Record the **epistemic qualifier** (e.g., "may," "is believed to"). The script must not upgrade this qualifier without new evidence.
6. Assign a run ID: `run-<niche>-<YYYYMMDD>-<seq>`.

**HOLD conditions:**
- Missing required field → HOLD_MISSING_IDENTITY
- Invalid niche → HOLD_MISSING_IDENTITY

---

### Stage 2: Evidence and Claim Research Validation

**Purpose:** Verify every evidence item is usable and properly qualified.

For each evidence item in the input:

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

---

### Stage 3: Narrative Blueprint and Section-Level Word Budgets

**Purpose:** Plan the script structure before writing a single line.

1. Create sections based on the standard documentary arc:

| Section | Purpose | Budget % |
|---------|---------|----------|
| Hook | Draw the viewer in with a vivid scene or question | 8–12% |
| The Problem | Establish why this topic matters | 12–15% |
| The Discovery | Present the core finding or narrative turn | 16–20% |
| The Mechanism | Explain how/why it works | 12–15% |
| The Challenge | Present skepticism, counter-evidence, or complications | 12–15% |
| The Resolution | Show how the tension resolves (or doesn't) | 14–18% |
| Implications | What this means going forward | 8–12% |
| Outro | Return to the opening, close the loop | 5–8% |

2. Calculate word budgets from the target word count. Example for 3000 words:
   - Hook: 240–360, Problem: 360–450, Discovery: 480–600, Mechanism: 360–450, Challenge: 360–450, Resolution: 420–540, Implications: 240–360, Outro: 150–240.

3. **Map evidence to sections.** Each section must list which evidence items [E-XXX] it will reference. Every evidence item must appear in at least one section. An unused evidence item triggers a review note (not a HOLD).

4. **Identify open loops.** Plan at least one open loop: a question, mystery, or tension raised early that pays off in a later section. Record the setup section and payoff section.

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

5. **Include evidence references** inline as [E-XXX] after each factual claim.
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

The final output consists of three parts:

### Part 1: The Script
A complete documentary script in Markdown with:
- Title and metadata header
- Scene directions in brackets
- Narrator voiceover text
- Interview segments (if applicable)
- Inline evidence references [E-XXX]
- Section headers matching the blueprint

### Part 2: The Evidence Register
A table mapping every [E-XXX] reference to its source, status, and caveats.

### Part 3: The QA Report
The Stage 8 report as specified above.

---

## Restrictions

- This skill is a RESEARCH_ONLY candidate. It has not been approved for production use.
- All K001–K048 technique proposals are RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION.
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
