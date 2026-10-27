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

| Rule | Source | HOLD if violated |
|------|--------|-----------------|
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

## Adapter Selection Logic

```
if niche == "N01": apply N01 rules + UNIVERSAL
if niche == "N02": apply N02 rules + UNIVERSAL
if niche == "N03": apply N03 rules + UNIVERSAL
if niche == "N04": apply N04 rules + UNIVERSAL
if niche == "N05": apply N05 rules + UNIVERSAL
```

All niches share the UNIVERSAL writing standards. The adapter adds
domain-specific HOLD triggers and qualification requirements.
