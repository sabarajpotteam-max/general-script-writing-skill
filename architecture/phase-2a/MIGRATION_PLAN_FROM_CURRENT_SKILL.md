# MIGRATION PLAN FROM CURRENT SKILL
**Phase 2A: Architecture Design** | **Tarikh:** 2026-10-28 | **Status:** DESIGN ONLY

---

## 1. PURPOSE

Yeh document describe karta hai ke current SKILL.md (documentary-only, 5 hardcoded niches, evidence-mandatory) se LOOM architecture (universal, dynamic niche, multi-format) tak kaise migrate karna hai — BINA existing functionality todey.

**Migration principle:** Har qadam ke baad existing documentary workflow UNCHANGED kaam karna chahiye. Regression = migration failure.

---

## 2. CURRENT STATE (Baseline)

### 2.1 What Exists Today

```
FILES:
  .claude/skills/universal-scriptwriting/
  ├── SKILL.md                     (378 lines — main skill, documentary-only)
  ├── references/
  │   ├── writing_rules.md         (U01-U24, C01-C13, X01-X08)
  │   ├── niche_adapters.md        (N01-N05 hardcoded)
  │   └── evidence_standards.md    (6 epistemic levels, blocked/quarantined)
  
  candidate_skill/
  ├── scripts/
  │   ├── validate.mjs             (393 lines — hardcoded VALID_NICHES, word range)
  │   └── word_count.mjs           (word counter)
  ├── tests/                       (85 integration + 37 prototype = 122 core tests,
  │                                 plus 12 invocation-pipeline checks separately categorized)
  └── BUILD_RESULT.md              (RESEARCH_ONLY status)

HARDCODED CONSTRAINTS:
  1. VALID_NICHES = ["N01","N02","N03","N04","N05"]
  2. MIN_WORDS = 2500, MAX_WORDS = 8000
  3. Documentary arc: Hook→Problem→Discovery→Mechanism→Challenge→Resolution→Implications→Outro
  4. Evidence list: REQUIRED (all briefs)
  5. Voice: NARRATOR only
  6. Format: documentary only (no selection mechanism)
```

### 2.2 What Works Well (PRESERVE)

| Component | Quality | Migration Strategy |
|---|---|---|
| 24 UNIVERSAL rules (U01-U24) | Excellent | RETAIN as-is, add format-conditional modifications |
| 13 CONDITIONAL rules (C01-C13) | Good | RETAIN as-is; new rules use separate CN-series namespace (CN01-CN07) |
| 8 EXPERIMENTAL techniques (X01-X08) | Documented | RETAIN with labelling requirement |
| Epistemic status system (6 levels) | World-class | RETAIN as-is |
| Blocked/quarantined enforcement | Rigorous | RETAIN as-is |
| Source type weight hierarchy | Professional | RETAIN as-is |
| HOLD condition system (12 types) | Strong | RETAIN all 12 existing (including HOLD_ORIGINAL_MISSING + HOLD_SOURCE_ROLE) + extend with 8 new = 20 total |
| QA report structure | Comprehensive | RETAIN + generalize |
| Test infrastructure (122 core + 12 invocation-pipeline) | Solid | RETAIN + extend |
| Niche adapter CONCEPT | Proven | RETAIN concept, change implementation (dynamic loading) |

---

## 3. MIGRATION STRATEGY: INCREMENTAL GENERALIZATION

### 3.1 Approach

```
STRATEGY: "Widen the funnel" — ek qadam mein ek constraint hataao

Phase 1 → Niche lock hataao (N01-N05 → dynamic)
Phase 2 → Format lock hataao (documentary → multi-format)
Phase 3 → Evidence lock hataao (mandatory → content-type dependent)
Phase 4 → Duration lock hataao (2500-8000 → flexible)
Phase 5 → Voice lock hataao (single narrator → multi-voice)
Phase 6 → QA generalize karo
Phase 7 → Client brief generalize karo
Phase 8 → Integration + validation
```

### 3.2 Why This Order?

| Order | Lock | Reason |
|---|---|---|
| 1 | Niche | Lowest risk — existing niches untouched, new ones added |
| 2 | Format | Medium risk — new arc templates, existing documentary preserved |
| 3 | Evidence | Medium risk — creative mode needs careful fiction frame design |
| 4 | Duration | Low risk — mostly validation change |
| 5 | Voice | Medium risk — new output formatting |
| 6 | QA | Dependent on 1-5 — can only generalize after above changes |
| 7 | Brief | Dependent on all — schema reflects all capabilities |
| 8 | Integration | Final — everything working together |

---

## 4. MIGRATION PHASES (DETAIL)

### PHASE M1: Dynamic Niche Loading
**Risk: LOW | Duration estimate: 1-2 weeks**

**Current state:** `validate.mjs` line: `const VALID_NICHES = new Set(["N01","N02","N03","N04","N05"])`

**Target state:** Niche definitions as external files, validator loads dynamically, Tier 2/3 support.

**Steps:**
```
M1.1  Create directory: adapters/registered/
M1.2  Extract N01-N05 from niche_adapters.md into individual files:
        adapters/registered/N01_weather.md
        adapters/registered/N02_military.md
        adapters/registered/N03_german_ww.md
        adapters/registered/N04_disaster.md
        adapters/registered/N05_psychology.md
M1.3  Create adapters/domains/ directory with recognized domain overlays
M1.4  Create adapters/overlays/ directory with cross-cutting overlays
M1.5  Modify validate.mjs:
        - Remove hardcoded VALID_NICHES
        - Add dynamic niche resolution function:
          a) Check registered/ directory for exact match
          b) Check domains/ for recognized domain match
          c) Allow Tier 3 open niche with UNIVERSAL rules
        - Add HOLD_DOMAIN_UNKNOWN for high-sensitivity Tier 3 niches
M1.6  Update SKILL.md to reference adapter system instead of inline niche rules
M1.7  Add tests for:
        - N01-N05 still work (regression)
        - New registered niche N06 accepted
        - Recognized domain "science" accepted
        - Unknown niche "underwater basket weaving" accepted (Tier 3)
        - High-sensitivity open niche triggers HOLD_DOMAIN_UNKNOWN
```

**Backward compatibility guarantee:**
- N01-N05 briefs → UNCHANGED behavior
- validate.mjs still rejects BLOCKED_SOURCES, QUARANTINED
- All 122 core tests + 12 invocation-pipeline checks MUST pass

**Rollback:** Revert adapters/ directory creation + validate.mjs changes. Zero data loss.

---

### PHASE M2: Format Router
**Risk: MEDIUM | Duration estimate: 2-3 weeks**

**Current state:** No format selection — documentary arc hardcoded in SKILL.md Stage 3.

**Target state:** Format registry + arc templates, format resolved from brief or defaulted.

**Steps:**
```
M2.1  Create formats/ directory
M2.2  Extract current documentary arc into formats/documentary.md
M2.3  Create additional format templates:
        formats/explainer.md      (Concept Progression Arc)
        formats/short_form.md     (Hook-Body-CTA)
        formats/podcast_solo.md   (Segment Arc)
        ... (others as designed in DYNAMIC_WRITING_STRATEGY_ENGINE.md)
M2.4  Add format field to input schema (default: "documentary")
M2.5  Add Stage 0 to SKILL.md: FORMAT RESOLUTION
        - Parse brief.format
        - Load arc template from formats/
        - Set section structure, word budgets
        - Pass to Stage 3 (which becomes generic "Structure Assembly")
M2.6  Modify Stage 3 to use loaded arc template instead of hardcoded sections
M2.7  Add format validation to validate.mjs:
        - Known format strings accepted
        - "custom" requires custom_format_spec
        - Unknown format string → helpful error message
M2.8  Add tests for:
        - Documentary format still works (regression)
        - Explainer format produces correct sections
        - Short-form format enforces duration limit
        - Custom format spec accepted
        - Missing format defaults to "documentary"
```

**Backward compatibility guarantee:**
- Brief without `format` field → defaults to "documentary" → UNCHANGED
- All existing documentary tests pass
- New formats are ADDITIVE — they don't modify documentary path

**Rollback:** Remove formats/ directory, revert SKILL.md Stage 0 + Stage 3 changes.

---

### PHASE M3: Evidence-Optional Mode
**Risk: MEDIUM | Duration estimate: 1-2 weeks**

**Current state:** Evidence list required in every brief. No fiction/creative support. No system-assisted research.

**Target state:** Content type classification (factual/creative/hybrid/instructional), evidence conditional. Brief-to-Research-to-Script workflow for system-assisted evidence gathering.

**Steps:**
```
M3.1  Add content_type field to input schema
        - Values: factual | creative | hybrid | instructional
        - Default: inferred from format (documentary → factual, narrative → creative)
M3.2  Modify validate.mjs evidence validation:
        - content_type = factual → evidence REQUIRED (current behavior)
        - content_type = instructional → evidence PREFERRED (warning if absent)
        - content_type = hybrid → evidence required for factual-tagged claims
        - content_type = creative → evidence NOT required
M3.3  Modify SKILL.md Stage 2 (Evidence Validation):
        - Add conditional: "IF content_type = creative: skip evidence validation, 
          activate fiction frame check"
        - Fiction frame check: no real claims presented as fact,
          real persons clearly fictionalized, "based on" disclaimer
M3.4  Modify SKILL.md evidence citation requirement:
        - [E-XXX] mandatory for factual claims in factual/hybrid mode
        - Optional for instructional mode
        - Not applicable for creative mode
M3.5  Add research_mode field to schema:
        - Values: client_provided | system_assisted | minimal
        - Default: INFERRED — client_provided if evidence register present
          (backward compat), system_assisted if evidence register absent
          (default for new briefs). Explicit value always overrides.
        - system_assisted: system researches topic-specific facts using
          available authorized research tools (web search, databases, APIs).
          Builds evidence register with source provenance, timestamp checks
          and factual verification. Client reviews before generation.
          NOTE: S/F/R/K/V craft library informs HOW to write (rules,
          techniques, formats) — NOT used for topic-specific fact research.
        - Validation: system_assisted NEVER fabricates citations,
          NEVER presents missing evidence as verified, flags gaps as [UNRESOURCED],
          reports limitation when reliable evidence is unavailable,
          triggers HOLD for unsupported claims
        - Normal client needs only topic + niche + audience + format + duration
        - See UNIVERSAL_ARCHITECTURE_BLUEPRINT §3.4 for full workflow design
M3.6  Add creative content fields to schema:
        - characters (optional, for creative/hybrid)
        - setting (optional, for creative/hybrid)
        - premise (optional, for creative)
M3.7  Modify writing rules activation:
        - U08 (traceability) → conditional on content_type
        - U10 (no fabrication) → "no fabrication of evidence" for factual;
          "no presenting fiction as fact" for creative
        - U22 (no fabricated dialogue) → factual only
M3.8  Add tests for:
        - Factual mode unchanged (regression)
        - Creative brief without evidence accepted
        - Hybrid brief validates factual claims only
        - Fiction frame check catches real claims as fact
        - U08/U10/U22 conditional activation
        - research_mode=client_provided preserves current behavior (regression)
        - research_mode=system_assisted researches topic-specific facts via authorized tools
        - system_assisted mode never fabricates citations
        - system_assisted reports limitation when evidence unavailable
        - research_mode inference: evidence present → client_provided, absent → system_assisted
        - Missing evidence flagged as [UNRESOURCED]
        - Documentary ±5% spoken narration word-budget tolerance regression test
```

**Backward compatibility guarantee:**
- Brief without `content_type` + with evidence list → inferred as "factual" → UNCHANGED
- Brief without `research_mode` + with evidence list → inferred as "client_provided" → UNCHANGED (current behavior)
- Brief without `research_mode` + without evidence list → inferred as "system_assisted" → new default for new briefs
- Documentary format always infers "factual"
- Evidence validation severity unchanged for factual mode with client_provided research_mode
- Documentary ±5% spoken narration word-budget tolerance PRESERVED in QA regression tests

**Rollback:** Revert schema + validate.mjs + SKILL.md evidence changes.

---

### PHASE M4: Flexible Duration
**Risk: LOW | Duration estimate: 0.5-1 week**

**Current state:** `MIN_WORDS = 2500; MAX_WORDS = 8000`

**Target state:** Duration/word count per format, 50 to 50000 words.

**Steps:**
```
M4.1  Modify validate.mjs:
        - Remove global MIN_WORDS/MAX_WORDS
        - Add per-format word ranges (from format template files)
        - Add duration → word count conversion with speaking rates
        - Accept target_duration as alternative to target_words
M4.2  Add duration estimation to QA report
M4.3  Add speaking rate constants:
        standard_narration: 150 wpm
        conversational: 170 wpm
        energetic: 190 wpm
        deliberate: 120 wpm
M4.4  Add tests for:
        - 2500-8000 word briefs still work (regression)
        - Short-form 100-word brief accepted
        - Long-form 15000-word brief accepted
        - Duration "2 minutes" → ~300 words calculated
        - Duration "45 minutes" → ~6750 words calculated
```

**Backward compatibility:** Fully backward compatible — existing `target_words` values fall within format ranges.

---

### PHASE M5: Multi-Voice Output
**Risk: MEDIUM | Duration estimate: 1-2 weeks**

**Current state:** `NARRATOR:` only. Single voice.

**Target state:** Multiple voice modes (host/guest, multi-character, etc.)

**Steps:**
```
M5.1  Add voice field to input schema
M5.2  Define output formatting per voice mode:
        single_narrator → NARRATOR: (current, unchanged)
        host_guest → HOST: / GUEST: / GUEST_2:
        multi_character → CHARACTER_NAME: per line
        interview → INTERVIEWER: / INTERVIEWEE:
        brand_voice → [BRAND]: (single narrator, brand parameters)
M5.3  Modify SKILL.md Stage 5 (Section-by-Section Writing):
        - Read voice_mode from strategy
        - Apply appropriate speaker label format
        - Multi-voice: ensure character differentiation
M5.4  Add voice consistency QA check
M5.5  Add tests for:
        - NARRATOR: format still works (regression)
        - HOST:/GUEST: format for podcast
        - Character names for multi-character
        - Voice consistency check catches unlabelled lines
```

**Backward compatibility:** Documentary defaults to `single_narrator` → `NARRATOR:` → UNCHANGED.

---

### PHASE M6: QA Generalization
**Risk: LOW | Duration estimate: 1-2 weeks | Depends on: M1-M5**

**Steps:**
```
M6.1  Refactor Stage 7 (Editorial Revision) into modular QA stages (A-G)
M6.2  Refactor Stage 8 (QA Report) into Stage H with conditional sections
M6.3  Add format-specific QA modules (per format)
M6.4  Add content-type conditional activation for evidence QA
M6.5  Add new HOLD types (HOLD_FORMAT_MISMATCH, etc.)
M6.6  Add compact QA report variant for short-form
M6.7  Add tests for:
        - Documentary QA unchanged (regression)
        - Explainer QA runs format-specific checks
        - Creative QA skips evidence checks
        - Compact QA report for short-form
        - New HOLD types trigger correctly
```

---

### PHASE M7: Client Brief Generalization
**Risk: LOW | Duration estimate: 1 week | Depends on: M1-M6**

**Steps:**
```
M7.1  Update input schema to full CLIENT_BRIEF_INPUT_SCHEMA.md specification
M7.2  Add smart defaults system
M7.3  Add backward compatibility aliases (title → topic)
M7.4  Add cross-field validation
M7.5  Add tests for:
        - Current documentary briefs still work (regression)
        - New brief formats accepted
        - Smart defaults fill missing fields correctly
        - Cross-field validation catches incompatible combinations
```

---

### PHASE M8: Integration & Validation
**Risk: LOW | Duration estimate: 2-3 weeks | Depends on: M1-M7**

**Steps:**
```
M8.1  End-to-end testing: 1 brief per format through full pipeline
M8.2  Regression suite: all 122 core + 12 invocation-pipeline tests pass
M8.3  New format validation: at least 1 pilot script per new format (all non-documentary formats remain DESIGN TARGETS until validated)
M8.4  Niche scaling test: 1 Tier 1, 1 Tier 2, 1 Tier 3 niche through pipeline
M8.5  Multi-language test: 1 non-English script through pipeline
M8.6  Performance check: pipeline completes within reasonable time
M8.7  Documentation update: SKILL.md reflects new capabilities
M8.8  Version bump: 2.0.0
```

---

## 5. MIGRATION TIMELINE

```
WEEK  1-2:  PHASE M1 — Dynamic Niche Loading
WEEK  2-4:  PHASE M2 — Format Router
WEEK  4-5:  PHASE M3 — Evidence-Optional Mode
WEEK    5:  PHASE M4 — Flexible Duration
WEEK  5-6:  PHASE M5 — Multi-Voice Output
WEEK  6-7:  PHASE M6 — QA Generalization
WEEK    7:  PHASE M7 — Client Brief Generalization
WEEK  7-9:  PHASE M8 — Integration & Validation

TOTAL: ~9 weeks for structural migration

PARALLEL TRACK (can start from Week 1):
  - Source license audit (T4.1)
  - K-series triage (T4.3)
  - R-source assessment (T4.6)
  - Format research (screenwriting, podcast, etc.)
```

### 5.1 Timeline Visualization

```
WEEK:  1    2    3    4    5    6    7    8    9
       ├────┤
       M1: Niche Loading
            ├─────────┤
            M2: Format Router
                       ├────┤
                       M3: Evidence-Optional
                            ├┤
                            M4: Duration
                            ├────┤
                            M5: Multi-Voice
                                 ├────┤
                                 M6: QA
                                      ├┤
                                      M7: Brief
                                      ├─────────┤
                                      M8: Integration

       ├─────────────────────────────────────────┤
       PARALLEL: License audit, K-series, Research
```

---

## 6. RISK REGISTER

| Risk | Phase | Probability | Impact | Mitigation |
|---|---|---|---|---|
| **R1:** Niche dynamic loading breaks N01-N05 | M1 | LOW | HIGH | Exhaustive regression tests for all 5 niches |
| **R2:** Format router introduces documentary regression | M2 | MEDIUM | HIGH | Documentary path remains DEFAULT — new formats additive |
| **R3:** Evidence-optional mode allows false claims in factual | M3 | LOW | CRITICAL | Content type inference rules strict — documentary always factual |
| **R4:** Multi-voice output formatting inconsistent | M5 | MEDIUM | MEDIUM | Define clear formatting rules per voice mode |
| **R5:** QA generalization weakens existing checks | M6 | LOW | HIGH | Universal QA is SUPERSET — no checks removed |
| **R6:** Migration scope creep | All | HIGH | MEDIUM | Strict phase boundaries — no features beyond scope |
| **R7:** Test suite insufficient for new capabilities | M8 | MEDIUM | MEDIUM | Minimum 1 end-to-end test per format |

### 6.1 Rollback Strategy

**Har phase independently rollback ho sakti hai:**
- Git revert to pre-phase commit
- No data migrations (all changes are code/config)
- No external dependencies introduced
- Each phase's tests are independent

---

## 7. FILE CHANGE REGISTER

### 7.1 Files Modified

| File | Phases | Change Type |
|---|---|---|
| `SKILL.md` | M2, M3, M5, M7 | Major restructure (add Stage 0, modify Stage 2/3/5, generalize schema) |
| `validate.mjs` | M1, M3, M4, M7 | Remove hardcoded constraints, add dynamic validation |
| `references/writing_rules.md` | M3 | Add conditional activation notes for U08/U10/U22 |
| `references/niche_adapters.md` | M1 | Replace with pointer to adapters/ directory |
| `references/evidence_standards.md` | M3 | Add content_type activation logic |

### 7.2 Files Created

| File | Phase | Purpose |
|---|---|---|
| `adapters/registered/N01-N05.md` | M1 | Individual niche adapter files |
| `adapters/domains/*.md` | M1 | Recognized domain overlays |
| `adapters/overlays/*.md` | M1 | Cross-cutting safety overlays |
| `formats/documentary.md` | M2 | Documentary arc template (extracted from SKILL.md) |
| `formats/explainer.md` | M2 | Explainer arc template |
| `formats/short_form.md` | M2 | Short-form arc template |
| `formats/podcast_solo.md` | M2 | Podcast arc template |
| `formats/podcast_interview.md` | M2 | Interview arc template |
| `formats/news.md` | M2 | News arc template |
| `formats/commercial.md` | M2 | Commercial arc template |
| `formats/tutorial.md` | M2 | Tutorial arc template |
| `formats/narrative.md` | M2 | Narrative arc template |
| `formats/screenplay.md` | M2 | Screenplay arc template |
| `formats/custom_template.md` | M2 | Custom format template |
| `references/format_registry.md` | M2 | Format registry documentation |
| `references/voice_tone_guide.md` | M5 | Voice model documentation |

### 7.3 Files Deleted

| File | Phase | Reason |
|---|---|---|
| None | — | No files deleted — all existing files preserved or refactored |

---

## 8. TESTING STRATEGY

### 8.1 Regression Test Matrix

| Phase | Regression Tests Required | Focus |
|---|---|---|
| M1 | All 122 core + 12 invocation-pipeline tests MUST pass | N01-N05 validation unchanged |
| M2 | All 122+12 + documentary-specific tests | Documentary arc output unchanged |
| M3 | All 122+12 + factual mode tests | Evidence handling unchanged for factual |
| M4 | Word count tests | 2500-8000 range still valid for documentary |
| M5 | Output format tests | NARRATOR: format for documentary unchanged |
| M6 | QA report tests | Documentary QA report format unchanged |
| M7 | Schema validation tests | Current briefs still accepted |
| M8 | FULL regression + new capability tests | Everything |

### 8.2 New Capability Tests Per Phase

| Phase | New Tests | Minimum Count |
|---|---|---|
| M1 | Tier 1/2/3 niche resolution, HOLD_DOMAIN_UNKNOWN | 15 |
| M2 | Format resolution, arc template loading, 1 test per format | 20 |
| M3 | Content type inference, fiction frame, conditional evidence | 15 |
| M4 | Duration conversion, flexible word ranges | 10 |
| M5 | Voice mode formatting, character labels | 10 |
| M6 | Format-specific QA, new HOLDs, compact report | 15 |
| M7 | Smart defaults, cross-field validation, aliases | 10 |
| M8 | End-to-end per format (minimum 8 formats) | 8 |
| **TOTAL** | | **~103 new tests** |
| **Grand total** | 122 core + 12 invocation-pipeline + ~103 new | **~237 tests** |

**Validation Type Distinction:**
- All tests above are **technical prototype validation** (automated) — they verify code correctness, schema compliance, rule activation, pipeline integrity and regression safety.
- **Professional writing quality validation** (human expert assessment) is a separate requirement: evaluating that actual script output meets professional scriptwriting standards (narrative coherence, voice consistency, audience engagement, craft quality). Required before any production release claim but not part of the automated test count.
- Non-documentary formats and multilingual capabilities remain **DESIGN TARGETS** until per-format pilot scripts AND expert writing quality review validate them.

### 8.3 End-to-End Pilot Scripts

| Format | Content Type | Niche Tier | Language | Phase |
|---|---|---|---|---|
| Documentary | Factual | Tier 1 (N01) | English | M8 (regression) |
| Explainer | Factual | Tier 2 (science) | English | M8 |
| Short-form | Hybrid | Tier 3 (open) | English | M8 |
| Podcast solo | Hybrid | Tier 2 (true crime) | English | M8 |
| Narrative | Creative | Tier 3 (open) | English | M8 |
| Tutorial | Instructional | Tier 2 (technology) | English | M8 |
| News | Factual | Tier 1 (N04) | English | M8 |
| Commercial | Hybrid | Tier 3 (open) | English | M8 |
| Explainer | Factual | Tier 2 (space) | Hindi | M8 |
| Documentary | Factual | Tier 1 (N03) | German | M8 (regression) |

---

## 9. DEPENDENCIES AND BLOCKERS

### 9.1 Technical Dependencies

| Phase | Depends On | Nature |
|---|---|---|
| M2 | M1 (partial) | Format router benefits from dynamic loading, but can proceed independently |
| M3 | M2 | Evidence mode depends on format classification |
| M4 | M2 | Duration ranges are per-format |
| M5 | M2 | Voice modes are per-format |
| M6 | M1-M5 | QA needs all changes to exist before generalizing |
| M7 | M1-M6 | Brief schema reflects all capabilities |
| M8 | M1-M7 | Integration requires all phases complete |

### 9.2 Non-Technical Blockers

| Blocker | Impact | Resolution Path | Owner |
|---|---|---|---|
| **K-series triage not complete** | Cannot use K001-K048 techniques | Triage process (T4.3 from Phase 1 roadmap) | Owner decision |
| **Source license audit incomplete** | Commercial risk for any deployment | Complete audit (T4.1) | Legal/owner |
| **No practitioner review** | Quality unvalidated for new formats | Recruit expert reviewer | Owner |
| **Transfer gate HOLD** | Cannot deploy to production | Complete 7-step checklist | Owner |
| **Research gaps for new formats** | Some formats lack research basis | Research sprints per format | Research team |

### 9.3 What Can Proceed WITHOUT Blocking

```
CAN PROCEED NOW (no blockers):
  ✓ M1: Dynamic niche loading — code change only
  ✓ M2: Format router — code change only
  ✓ M3: Evidence-optional mode — code change only
  ✓ M4: Flexible duration — code change only
  ✓ M5: Multi-voice output — code change only
  ✓ M6: QA generalization — code change only
  ✓ M7: Brief generalization — code change only
  ✓ M8: Integration testing — internal testing

BLOCKED UNTIL RESOLVED:
  ✗ Production deployment — Transfer gate HOLD
  ✗ K-series techniques in formats — K001-K048 NOT_APPROVED
  ✗ Commercial use — Source licenses unclear
  ✗ Practitioner validation — No expert review
```

**KEY INSIGHT:** Structural migration (M1-M8) can proceed COMPLETELY independently of rights clearance and production gates. Architecture generalization is a CODE change. Commercial readiness is a RIGHTS and PROCESS change. They run in parallel.

---

## 10. POST-MIGRATION PRIORITIES

### 10.1 Immediate After M8

```
1. Format template expansion:
   - Screenplay format (CRITICAL gap)
   - Audio drama format
   - Stage play format

2. Niche pack development:
   - N06-N10: Science & Technology pack
   - N11-N15: Entertainment pack
   - N16-N20: Business pack

3. Custom niche template system:
   - User-defined niche adapter creation
   - Minimum safety rule enforcement
   - Template validation

4. Multilingual expansion:
   - Hindi/Urdu pilot
   - Spanish pilot
   - Arabic pilot
```

### 10.2 Parallel Rights Track

```
ONGOING (parallel with M1-M8):
  - Source license audit completion
  - K-series batch triage
  - R-source assessment (remaining 151)
  - Non-commercial source replacement (S08, S26)
  - GPL risk resolution
  - Transfer gate checklist progress
```

---

## 11. UNRESOLVED MIGRATION DECISIONS

| Decision | Impact | Options | Recommendation | Owner Input Needed? |
|---|---|---|---|---|
| **MD1:** Migrate SKILL.md in-place or create SKILL_v2.md? | File management | In-place (less disruption) vs new file (clean start) | **In-place** — version control handles history | No |
| **MD2:** Keep candidate_skill/ separate or merge into .claude/? | Repo structure | Keep separate (testing boundary) vs merge (simplicity) | **Keep separate** — testing isolation valuable | No |
| **MD3:** When to bump version to 2.0.0? | Signaling | After each phase / after M8 / after production gate | **After M8** — architectural migration complete | No |
| **MD4:** How to handle in-flight briefs during migration? | Compatibility | Old schema always works / migration window / feature flag | **Old schema always works** — backward compatibility guaranteed | No |
| **MD5:** Who approves new format templates? | Governance | Owner only / any contributor / automated | **Owner approves** — quality gate | **YES** |
| **MD6:** Who can create custom niche adapters? | Access control | Anyone / owner-approved / template-validated | **Template-validated + owner review for high-sensitivity** | **YES** |
| **MD7:** Priority order for new formats after M8? | Roadmap | Screenplay first / Podcast first / Short-form first | **Screenplay** (CRITICAL gap per research) | **YES** |
| **MD8:** Should migration phases be separate PRs or one? | Code review | One PR per phase (safer) / grouped (faster) | **One PR per phase** — easier review + rollback | No |

---

## 12. CONCLUSION (Roman Urdu)

**Migration Plan ka SUMMARY:**

### 12.1 Kya Badlega
1. Niche codes hardcoded se dynamic loading par jaayenge
2. Documentary-only se 10+ format support aayega
3. Evidence-mandatory se content-type dependent banega
4. Fixed word range se flexible duration support aayega
5. Single narrator se multi-voice output support aayega
6. QA system modular aur format-aware banega
7. Client brief simple 3-field requirement se lekar full creative brief tak support karega

### 12.2 Kya NAHI Badlega
1. Existing 24 UNIVERSAL rules (U01-U24)
2. Existing 13 CONDITIONAL rules (C01-C13) — IDs, definitions, provenance and approval states PRESERVED. New rules use CN-series namespace (CN01-CN07).
3. Existing 8 EXPERIMENTAL techniques (X01-X08) — preserved as-is
4. 6-level epistemic status system
5. Blocked/quarantined enforcement
6. Source type weight hierarchy
7. All 12 existing HOLD types (including HOLD_ORIGINAL_MISSING and HOLD_SOURCE_ROLE) — extended with 8 new, not replaced. Total: 20.
8. Current 5 niche adapters (N01-N05) — refactored to files, not removed
9. 122 core tests + 12 invocation-pipeline checks (separately categorized)
10. Documentary workflow for existing briefs
11. **Documentary ±5% spoken narration word-budget tolerance** — existing regression requirement PRESERVED
12. Existing forecast validation (N01) and historical scope checks (N03)

### 12.3 Timeline
- **Structural migration (M1-M8): ~9 weeks**
- **Parallel rights clearance: 3-6 months**
- **Format expansion (post-migration): ongoing**
- **Commercial readiness: dependent on rights clearance + practitioner review**

### 12.4 Sabse Important Baat
**Migration INCREMENTAL hai — har phase ke baad existing functionality KAAM KARTI HAI. Agar kisi phase mein problem aaye, us phase ko independently rollback kiya ja sakta hai bina baaki kisi cheez ko todey.**

Yeh ARCHITECTURE change hai, CODE REWRITE nahi. Current skill ki soul (evidence integrity, QA rigor, safety-first approach) PRESERVE hoti hai — sirf scope WIDEN hota hai.

**DESIGN TARGET Declarations:**
- Backward compatibility (current documentary workflow unchanged per phase) → **DESIGN TARGET** until executed regression tests establish it
- Format coverage (10+ formats via format router) → **DESIGN TARGET** until end-to-end pilot scripts per format validate it
- Language coverage (multi-language pilot scripts) → **DESIGN TARGET** until Hindi/German/other pilots validate it

**Phase 2A DESIGN ONLY — koi code implement nahi kiya gaya.**
