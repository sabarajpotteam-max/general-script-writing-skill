# Niche Adapters — Universal Professional Scriptwriting Skill

## Overview

Each niche applies additional rules on top of the UNIVERSAL standards.
The niche adapter activates based on the niche code (N01–N05) in the input.

---

## N01: USA Weather / Forecasting

**Core concern:** Forecast accuracy, timeliness, and attribution.

| Rule | Source | HOLD if violated |
|------|--------|-----------------|
| Name issuing agency and issue time for every forecast | K026 | HOLD_UNVERIFIED_FACT |
| Flag forecasts with validity window ≤ 1 hour as potentially stale | Engine check | HOLD_STALE_FORECAST |
| Label projections as "official warning" only with agency verification | K026 | HOLD_UNVERIFIED_FACT |
| Historical weather events may use expired data IF marked historical | K028 | — |
| Do not present model outputs as confirmed events | K002, K042 | HOLD_UNVERIFIED_FACT |
| Include locality for all geographic forecasts | K028 | — |

---

## N02: Military / Aviation

**Core concern:** Operational claims, technology status, single-source propaganda.

| Rule | Source | HOLD if violated |
|------|--------|-----------------|
| Verify deployment stage for "operational" claims | K002 | HOLD_UNVERIFIED_FACT |
| "Contracted" or "development" ≠ "operational" | Engine check | HOLD_UNVERIFIED_FACT |
| Single-party claims must be attributed, not stated as fact | K002, K043 | HOLD_UNVERIFIED_FACT |
| Performance specifications require source and conditions | K003 | — |
| Do not present classified information as public knowledge | K006 | HOLD_RIGHTS |

---

## N03: German WW1/WW2 Human Stories

**Core concern:** Historical accuracy, quote authenticity, survivor dignity.
**Temporal scope:** Stories must overlap WW1 (1914-1918) or WW2 (1939-1945). Provide `era_start` and `era_end` years in `niche_context`.

| Rule | Source | HOLD if violated |
|------|--------|-----------------|
| Story era must overlap WW1 or WW2 period | Scope check | HOLD_HARM |
| era_start and era_end required in niche_context | Scope check | HOLD_MISSING_IDENTITY |
| Every historical quote must trace to a documented source | K025 | HOLD_HARM |
| Invented quotes as historical → immediate HOLD | K025 | HOLD_HARM |
| Translations must preserve qualifiers ("allegedly," "reportedly") | K023 | HOLD_REVIEW |
| Reenacted footage must never be labelled as archival | K025 | HOLD_HARM |
| Survivor testimony must not be dramatized beyond the record | K006, K025 | HOLD_REVIEW |
| Dates and locations must be verified against multiple sources | K028, K047 | HOLD_UNVERIFIED_FACT |

---

## N04: Disaster News

**Core concern:** Casualty accuracy, media authenticity, cause attribution.

| Rule | Source | HOLD if violated |
|------|--------|-----------------|
| Synthetic/AI video as authentic → immediate HOLD | K025 | HOLD_HARM |
| Provisional casualties must be labelled "provisional" or "estimated" | K002 | HOLD_UNVERIFIED_FACT |
| Single-cause attribution requires study citation | K002, K043 | HOLD_UNVERIFIED_FACT |
| Use "contributing factor" when causation is uncertain | K002 | — |
| Ongoing situations need "as of [date/time]" qualifiers | K026 | — |
| Respect subject privacy and consent in disaster footage | K006 | HOLD_REVIEW |

---

## N05: Psychology / Explainers (General)

**Core concern:** Study integrity, effect qualification, replication honesty.

| Rule | Source | HOLD if violated |
|------|--------|-----------------|
| Study citations: author, year, institution, sample size, finding | K003 | — |
| Qualify effect sizes: small/moderate/large with numbers when available | K002 | — |
| State replication status explicitly | K002, K042 | — |
| Note WEIRD sample limitations if claiming broad applicability | K044 | HOLD_UNVERIFIED_FACT |
| Correlation ≠ causation: state design type (correlational vs experimental) | K002 | HOLD_UNVERIFIED_FACT (if conflated) |
| Meta-analytic heterogeneity must be disclosed (I² value) | K005 | — |
| Do not present a small effect (d < 0.2) as transformative | K002, K042 | HOLD_TITLE_PREMISE |

---

## Adapter Selection Logic (M1: Dynamic Niche Resolution)

```
resolved = resolveNiche(input.niche)

TIER 1 — Registered (N01–N05 + custom):
  Apply registered adapter rules + UNIVERSAL

TIER 2 — Recognized Domain (domain:science, domain:history, etc.):
  Apply domain-specific policies + UNIVERSAL safeguards
  Multiple overlapping domains combine their policies

TIER 3 — Open Niche (free text):
  Apply UNIVERSAL writing rules + cross-cutting safety safeguards
  High-stakes domains flagged for HOLD_REVIEW

Invalid niche codes (N-prefix + digits, not registered): REJECTED
```

### Recognized Domains (Tier 2)

| Domain Key | Policies | High Stakes |
|-----------|----------|-------------|
| `science` | Citation standards, replication, correlation vs causation | No |
| `history` | Source verification, quote tracing, translation qualifiers | No |
| `technology` | Operational vs development status, attribution | No |
| `health` | Clinical evidence, FDA status, effect sizes | **Yes** |
| `finance` | Projection disclaimers, risk disclosure | **Yes** |
| `education` | Pedagogical evidence, audience calibration | No |
| `sports` | Statistics attribution, record verification | No |
| `real_estate` | Market data attribution, projection qualifiers | No |
| `engineering` | Specifications verification, safety disclosures | No |

### Open Niche (Tier 3)

All 24 UNIVERSAL writing standards always apply. Cross-cutting safety
safeguards (HOLD_HARM, HOLD_UNVERIFIED_FACT, HOLD_SOURCE_ROLE,
HOLD_DISPUTED_PROVENANCE, HOLD_TITLE_PREMISE, HOLD_NEEDS_RECHECK)
are enforced. High-stakes topics (medical, legal, financial, military)
are flagged for HOLD_REVIEW.

All niches share the UNIVERSAL writing standards. The adapter adds
domain-specific HOLD triggers and qualification requirements.
