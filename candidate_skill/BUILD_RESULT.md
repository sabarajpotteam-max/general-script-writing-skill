# Build Result — Universal Professional Scriptwriting Skill (Candidate)

**Built:** 2026-10-27
**Branch:** `claude/gracious-fermat-qjg748`
**Status:** RESEARCH_ONLY candidate. Not production-cleared.

## Test Results

### Prototype Engine Tests (Phase 1)
- **37/37 PASS** — All QA cases including baseline
- Receipt: `prototype/offline_synthetic_v01/TEST_EXECUTION_RECEIPT.json`

### Skill Integration Tests (Phase 2 + 2.1 + 2.2)
- **65/65 PASS** — Original 45 + 8 Phase 2.1 regression (INT-046–INT-053) + 1 updated (INT-044) + 12 Phase 2.2 regression (INT-054–INT-065)
- Receipt: `candidate_skill/tests/INTEGRATION_TEST_RECEIPT.json`

### Combined: **102/102 PASS**

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
- `test_skill_integration.mjs` — 65 integration tests (45 original + 8 Phase 2.1 + 12 Phase 2.2)
- `INTEGRATION_TEST_RECEIPT.json` — Execution receipt (generated by tests)

### candidate_skill/examples/
- `demo_input.json` — Fictional topic with 7 evidence items (N05 niche)
- `demo_script.md` — Complete 2,500-word documentary script with embedded QA report
- `demo_qa_report.json` — Machine-readable QA analysis output
- `trial_input.json` — Fictional N03 topic with 5 evidence items (live skill trial)
- `trial_script.md` — Complete 2,720-word N03 documentary script (live skill trial)
- `trial_qa_report.json` — Machine-readable QA for trial script

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
node candidate_skill/tests/test_skill_integration.mjs    # 65 integration tests
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
