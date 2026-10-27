# Native Discovery Report — universal-scriptwriting Skill

**Date:** 2026-10-27
**Run-ID:** run-N03-20261027-001
**Session:** Pilot isolation test

---

## Discovery Status: VERIFIED

---

## Step 1: File Deployment

All files confirmed present under `.claude/skills/universal-scriptwriting/`:

```
.claude/skills/universal-scriptwriting/SKILL.md
.claude/skills/universal-scriptwriting/references/evidence_standards.md
.claude/skills/universal-scriptwriting/references/writing_rules.md
.claude/skills/universal-scriptwriting/references/niche_adapters.md
.claude/skills/universal-scriptwriting/scripts/validate.mjs
.claude/skills/universal-scriptwriting/scripts/word_count.mjs
```

**Result:** 6 files, all present.

---

## Step 2: Skill Listing

The skill `universal-scriptwriting` IS listed in the system-reminder available skills section. Exact text:

```
- universal-scriptwriting: Evidence-aware documentary scriptwriting with niche adaptation and editorial QA. Candidate — not production.
```

**Result:** Natively discoverable. Listed among available skills with correct description.

---

## Step 3: Invocation Result

Invocation via `Skill(skill="universal-scriptwriting", args="...")` was **successful**.

- The Skill tool returned the full contents of SKILL.md as the skill instructions.
- The ARGUMENTS section correctly received and echoed all structured input (title, niche, evidence set, etc.).
- The skill instructions were loaded into the conversation context, enabling the 8-stage workflow execution.

### Workflow Execution Summary

All 8 stages of the skill were executed:

| Stage | Name | Status |
|-------|------|--------|
| 1 | Topic Intake and Subject/Object Preservation | PASS |
| 2 | Evidence and Claim Research Validation | PASS |
| 3 | Narrative Blueprint and Section-Level Word Budgets | PASS |
| 4 | Hook Selection Grounded in Format and Subject | PASS |
| 5 | Full Section-by-Section Documentary Scriptwriting | PASS |
| 6 | Open-Loop Setup and Factual Payoff Checks | PASS |
| 7 | Editorial Revision and Natural Voiceover Polishing | PASS |
| 8 | Final Word Counts, Evidence Traceability, and QA/HOLD Report | COMPLETE |

### Output Produced

A complete 3-part output was generated and written to:
`pilot_results/script_output_run-N03-20261027-001.md`

Parts:
1. **Full documentary script** (~3020 words) in German, with inline evidence references [E-301] through [E-305], scene directions, narrator voiceover text, and N03 niche adapter compliance notes.
2. **Evidence register** — all 5 evidence items mapped with source, type, epistemic status, and caveats.
3. **QA report** — word counts, evidence traceability matrix, open-loop register, HOLD register (empty), N03 adapter protocol, universal rule checks, and stage status summary.

### Final Verdict from Skill Workflow

**RESEARCH_ONLY_TERMINAL** — All 8 stages passed. No HOLDs triggered.

---

## Step 4: N/A

Skill was listed and invocation succeeded. NOT_VERIFIED condition not reached.

---

## Summary

| Criterion | Result |
|-----------|--------|
| Files deployed | YES — 6 files |
| Skill listed in available skills | YES — exact match |
| Skill invocable via Skill tool | YES — full SKILL.md loaded |
| Arguments passed correctly | YES — all structured input echoed |
| 8-stage workflow executable | YES — all stages PASS |
| N03 niche adapter applied | YES — all 6 rules checked and passed |
| Evidence validation functional | YES — blocked/quarantined checks ran clean |
| Output produced | YES — complete 3-part script + QA report |
| Error messages | NONE |

**Overall: VERIFIED — The `universal-scriptwriting` skill is natively discoverable and fully invocable.**
