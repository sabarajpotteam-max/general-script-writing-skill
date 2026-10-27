# Build Result — Universal Professional Scriptwriting Skill (Candidate)

**Built:** 2026-10-27
**Branch:** `claude/gracious-fermat-qjg748`
**Status:** RESEARCH_ONLY candidate. Not production-cleared.

## Test Results

### Prototype Engine Tests (Phase 1)
- **37/37 PASS** — All QA cases including baseline
- Receipt: `prototype/offline_synthetic_v01/TEST_EXECUTION_RECEIPT.json`

### Skill Integration Tests (Phase 2 + 2.1 + 2.2)
- **71/71 PASS** — Original 45 + 8 Phase 2.1 (INT-046–INT-053) + 12 Phase 2.2 (INT-054–INT-065) + 6 Final Acceptance (INT-066–INT-071) + updates (INT-016, INT-038, INT-044, INT-048, INT-059)
- Receipt: `candidate_skill/tests/INTEGRATION_TEST_RECEIPT.json`

### Skill Invocation Mechanism Tests (Final Acceptance)
- **12/12 PASS** — Skill discovery, pipeline execution, stage validation, production gate, blocked sources
- Run from isolated non-production workspace with SKILL.md at `.claude/skills/universal-scriptwriting/SKILL.md`

### Combined: **120/120 PASS** (37 prototype + 71 integration + 12 invocation)

## Phase 2.1 — Independent QA Defect Fixes

Six defects identified by independent ChatGPT inspection, all fixed:

1. **Defect 1 (FIXED):** Empty evidence now produces HOLD_UNVERIFIED_FACT (was: warning only)
2. **Defect 2 (FIXED):** Expired forecast (past valid_until) now triggers HOLD_STALE_FORECAST regardless of window length
3. **Defect 3 (FIXED):** Corroboration now linked to actual claim — unrelated replicated evidence cannot corroborate a different confirmed claim
4. **Defect 4 (FIXED):** N02 military checks added — prototype technology claimed operational triggers HOLD_HARM
5. **Defect 5 (FIXED):** N04 provisional casualties check added — provisional figures presented as final triggers HOLD_HARM
6. **Defect 6 (FIXED):** Non-fictional evidence missing `can_use_for_synthetic` now triggers HOLD_RIGHTS

**Additional fixes:**
- QA exit codes now check ALL dimensions (word budget, evidence traceability, consistency, epistemic integrity, input validation) — not just epistemic_integrity
- Word count utility now separates narration body from QA tables and evidence registers
- QA report now includes input_validation status and input_holds

## Phase 2.2 — Adversarial Hardening and Live Skill Trial

Four adversarial defect categories fixed in `validate.mjs`, plus one bonus fix:

1. **Defect 1 (FIXED):** `can_use_for_synthetic: false` now ALWAYS triggers HOLD_RIGHTS — explicit rights denial overrides `fictional: true`
2. **Defect 2 (FIXED):** Same `source_family` replicated evidence no longer counts as independent corroboration of a confirmed claim
3. **Defect 3 (FIXED):** Missing or malformed N01 forecast timestamps (`issued_at`, `valid_until`, `reference_time`) fail closed with HOLD_STALE_FORECAST
4. **Defect 4 (FIXED):** `request_release: true` and `request_claude_transfer: true` trigger HOLD_NOT_APPROVED — new `production_gate` stage added
5. **Bonus (FIXED):** Unknown epistemic statuses now fail closed with HOLD_UNVERIFIED_FACT instead of silently converting to "qualified"

**Regression tests added:** INT-054 through INT-065 (12 tests)
**Updated test:** INT-044 (now checks HOLD instead of warning for unknown epistemic status)

### Live Skill Trial

- **Title:** "The Clockmaker's Broadcast: How One Pirate Radio Operator Defied Censorship in Occupied France"
- **Niche:** N03 (German WW1/WW2 Human Stories)
- **Word count:** 2,720 narration words (target: 2,800)
- **Evidence items:** 5 (all fictional, all properly referenced)
- **Evidence traceability:** 5/5 referenced — PASS
- **Epistemic integrity:** No upgrades detected — PASS
- **Subject/object consistency:** PASS
- **Word budget:** PASS
- **Input validation:** PASS (0 HOLDs)
- **Open loops:** 4 raised, all closed
- **QA exit code:** 0 (all dimensions PASS)
- **Files:** `trial_input.json`, `trial_script.md`, `trial_qa_report.json`

## Final Candidate Acceptance

### Validator Hardening

1. **Source-family independence (FIXED):** Unknown source independence no longer silently passes — both the confirmed item and corroborating item must have explicit, distinct `source_family` values. Missing `source_family` on either side blocks corroboration.
2. **Deterministic N01 timestamps (FIXED):** `reference_time` is now required for N01 forecast validation. `Date.now()` fallback removed entirely. All expiry checks use the explicit `reference_time`, making tests fully reproducible.

**Regression tests added:** INT-066 through INT-071 (6 tests)
**Updated tests:** INT-016, INT-038 (add `reference_time`), INT-048 (add `source_family`), INT-059 (add `reference_time`)

### Skill Invocation Mechanism

- SKILL.md deployed to `.claude/skills/universal-scriptwriting/SKILL.md` in isolated workspace
- 12 invocation mechanism tests verify: skill discovery, frontmatter parsing, workflow stage declaration, niche adapter presence, reference file existence, pipeline validation, stage results, evidence register, corroboration, production gate, blocked sources
- All 12 PASS

### German-Language N03 Demonstration

- **Title:** "Der Funker von Stalingrad: Wie ein Soldat mit einem Feldradio die Wahrheit übermittelte"
- **Niche:** N03 (Deutsche WW1/WW2 Menschliche Geschichten)
- **Language:** German throughout (narration, interviews, scene directions, QA report)
- **Word count:** 2,524 narration words (target: 2,800)
- **Evidence items:** 5 (all fictional, all properly referenced)
- **Evidence traceability:** 5/5 referenced — PASS
- **Epistemic integrity:** No upgrades — PASS
- **Subject/object consistency:** PASS
- **Word budget:** PASS
- **Language consistency:** German maintained throughout; technical terms (Torn.Fu.d2, Kessel, Peilstationen) consistent; uncertainty marker "wird angenommen" used correctly
- **QA exit code:** 0 (all dimensions PASS)
- **Files:** `german_trial_input.json`, `german_trial_script.md`, `german_trial_qa_report.json`

### Failed Acceptance Criteria

None. All 6 requirements pass.

## Demo Script

- **Title:** "The Memory Thief: How Sleep Architecture Shapes What We Remember"
- **Niche:** N05 (Psychology / Explainers)
- **Word count:** 2,500 words (script body, excluding evidence register and QA tables)
- **Evidence items:** 7 (all fictional, all properly referenced in script)
- **Evidence traceability:** 7/7 referenced — PASS
- **Epistemic integrity:** No upgrades detected — PASS
- **Subject/object consistency:** PASS
- **Open loops:** 4 raised, all closed
- **HOLD conditions:** 0 triggered

## Files Created

### candidate_skill/SKILL.md
The skill itself. Contains:
- Claude Skill frontmatter with description
- Input schema (title, niche, subject, object, mechanism, uncertainty, evidence)
- 8 workflow stages with HOLD conditions
- 5 niche adapter rules (N01–N05)
- 24 UNIVERSAL writing standards with crosswalk provenance
- 13 CONDITIONAL standards with activation conditions
- 8 EXPERIMENTAL techniques (labelled, not presented as validated)
- Blocked/quarantined item enforcement
- Output format specification

### candidate_skill/references/
- `evidence_standards.md` — Epistemic status levels, source type weights, blocked items
- `niche_adapters.md` — N01–N05 adapter rules with HOLD triggers
- `writing_rules.md` — All 24 UNIVERSAL, 13 CONDITIONAL, 8 EXPERIMENTAL rules with crosswalk IDs

### candidate_skill/scripts/
- `validate.mjs` — Input validation + script QA analysis (CLI and importable module)
- `word_count.mjs` — Section-level word counting utility

### candidate_skill/tests/
- `test_skill_integration.mjs` — 71 integration tests (45 original + 8 Phase 2.1 + 12 Phase 2.2 + 6 Final Acceptance)
- `INTEGRATION_TEST_RECEIPT.json` — Execution receipt (generated by tests)

### candidate_skill/examples/
- `demo_input.json` — Fictional topic with 7 evidence items (N05 niche)
- `demo_script.md` — Complete 2,500-word documentary script with embedded QA report
- `demo_qa_report.json` — Machine-readable QA analysis output
- `trial_input.json` — Fictional N03 topic with 5 evidence items (live skill trial)
- `trial_script.md` — Complete 2,720-word N03 documentary script (live skill trial)
- `trial_qa_report.json` — Machine-readable QA for trial script
- `german_trial_input.json` — Fictional German N03 topic with 5 evidence items (Final Acceptance)
- `german_trial_script.md` — Complete 2,524-word German N03 documentary script (Final Acceptance)
- `german_trial_qa_report.json` — Machine-readable QA for German trial script

## How to Invoke

### Validate an input
```bash
node candidate_skill/scripts/validate.mjs <input.json>
```

### Analyse a completed script
```bash
node candidate_skill/scripts/validate.mjs --qa <script.md> <input.json>
```

### Count words per section
```bash
node candidate_skill/scripts/word_count.mjs <script.md>
```

### Run tests
```bash
node prototype/offline_synthetic_v01/test_engine.mjs    # 37 prototype tests
node candidate_skill/tests/test_skill_integration.mjs    # 71 integration tests
```

### Use the skill with Claude Code
To invoke the candidate skill through Claude Code:

1. Copy `candidate_skill/SKILL.md` to `.claude/skills/universal-scriptwriting/SKILL.md`
2. Invoke with: provide title, niche (N01–N05), subject, object, mechanism, uncertainty, target word count, and evidence list
3. Claude follows the 8-stage workflow and produces: script + evidence register + QA report

**Note:** This is a candidate skill. Do not install or publish without explicit authorization.

## Research Provenance

| Stream | Items | Status |
|--------|-------|--------|
| Claude/GitHub (S01–S63) | 75 findings, F-001 to F-221 | COMPLETE |
| ChatGPT Real-World (R-sources) | K001–K048 technique proposals | COMPLETE, all RESEARCH_ONLY |
| YouTube DNA (V01–V12) | 12 caption-pattern observations | COMPLETE |
| Crosswalk | 99 items classified | 24 UNIVERSAL, 26 CONDITIONAL, 44 EXPERIMENTAL, 5 REJECTED |

## Restrictions Preserved

- All K001–K048 remain RESEARCH_ONLY_NOT_APPROVED_FOR_PRODUCTION
- F-190, R052: BLOCKED
- K029, K030, K031: QUARANTINED
- B70–B72: CAVEATED (access restrictions)
- No SKILL.md production installation
- No rights release
- AP-02 transfer manifest: empty
- B1/B2 candidates: RESEARCH_ONLY with unresolved rights
