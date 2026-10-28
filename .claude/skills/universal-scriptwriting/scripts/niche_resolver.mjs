/**
 * Dynamic Niche Resolver — M1 Implementation
 * Replaces hardcoded 5-niche restriction with 3-tier resolution.
 * Node.js ESM, no dependencies.
 *
 * Tier 1: Registered niches (N01-N05 + custom registered)
 * Tier 2: Recognized domains (configurable mappings)
 * Tier 3: Open niche (any description, universal safeguards)
 */

const HOLD_TYPES = {
  MISSING_IDENTITY: "HOLD_MISSING_IDENTITY",
  RIGHTS: "HOLD_RIGHTS",
  DISPUTED_PROVENANCE: "HOLD_DISPUTED_PROVENANCE",
  ORIGINAL_MISSING: "HOLD_ORIGINAL_MISSING",
  SOURCE_ROLE: "HOLD_SOURCE_ROLE",
  UNVERIFIED_FACT: "HOLD_UNVERIFIED_FACT",
  STALE_FORECAST: "HOLD_STALE_FORECAST",
  TITLE_PREMISE: "HOLD_TITLE_PREMISE",
  HARM: "HOLD_HARM",
  REVIEW: "HOLD_REVIEW",
  NOT_APPROVED: "HOLD_NOT_APPROVED",
  NEEDS_RECHECK: "HOLD_NEEDS_RECHECK"
};

const UNIVERSAL_SAFEGUARDS = [
  HOLD_TYPES.HARM,
  HOLD_TYPES.UNVERIFIED_FACT,
  HOLD_TYPES.SOURCE_ROLE,
  HOLD_TYPES.DISPUTED_PROVENANCE,
  HOLD_TYPES.TITLE_PREMISE,
  HOLD_TYPES.NEEDS_RECHECK
];

const HIGH_STAKES_KEYWORDS = [
  "medical", "medicine", "clinical", "pharmaceutical", "drug",
  "legal", "law", "litigation", "court",
  "financial", "investment", "trading", "securities",
  "military", "weapons", "defense", "classified",
  "nuclear", "radiation", "hazardous",
  "surgery", "diagnostic", "therapeutic"
];

// --- TIER 1: Registered Niche Registry ---

const NICHE_REGISTRY = new Map();

function registerBuiltinNiches() {
  NICHE_REGISTRY.set("N01", {
    code: "N01",
    domain: "USA Weather / Forecasting",
    key_concern: "Forecast staleness, official warning attribution",
    policies: [
      "Name issuing agency and issue time for every forecast",
      "Flag forecasts with validity window <= 1 hour as potentially stale",
      "Label projections as 'official warning' only with agency verification",
      "Historical weather events may use expired data IF marked historical",
      "Do not present model outputs as confirmed events"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.STALE_FORECAST],
    requires_context: ["issued_at", "valid_until", "reference_time"],
    validator: "N01"
  });

  NICHE_REGISTRY.set("N02", {
    code: "N02",
    domain: "Military / Aviation",
    key_concern: "Operational status claims, technology stage",
    policies: [
      "Verify deployment stage for 'operational' claims",
      "'Contracted' or 'development' != 'operational'",
      "Single-party claims must be attributed, not stated as fact",
      "Performance specifications require source and conditions",
      "Do not present classified information as public knowledge"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.RIGHTS],
    requires_context: [],
    validator: "N02"
  });

  NICHE_REGISTRY.set("N03", {
    code: "N03",
    domain: "German WW1/WW2 Human Stories",
    key_concern: "Quote authenticity, translation qualifiers, archival integrity",
    policies: [
      "Story era must overlap WW1 (1914-1918) or WW2 (1939-1945)",
      "era_start and era_end required in niche_context",
      "Every historical quote must trace to a documented source",
      "Translations must preserve qualifiers",
      "Reenacted footage must never be labelled as archival",
      "Survivor testimony must not be dramatized beyond the record"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.HARM, HOLD_TYPES.REVIEW],
    requires_context: ["era_start", "era_end"],
    validator: "N03"
  });

  NICHE_REGISTRY.set("N04", {
    code: "N04",
    domain: "Disaster News",
    key_concern: "Casualty figure provisionality, synthetic media disclosure",
    policies: [
      "Synthetic/AI video as authentic triggers immediate HOLD",
      "Provisional casualties must be labelled 'provisional' or 'estimated'",
      "Single-cause attribution requires study citation",
      "Use 'contributing factor' when causation is uncertain",
      "Ongoing situations need 'as of [date/time]' qualifiers"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.HARM, HOLD_TYPES.REVIEW],
    requires_context: [],
    validator: "N04"
  });

  NICHE_REGISTRY.set("N05", {
    code: "N05",
    domain: "Psychology / Explainers (General)",
    key_concern: "Study citations, effect size qualifiers, replication status",
    policies: [
      "Study citations: author, year, institution, sample size, finding",
      "Qualify effect sizes: small/moderate/large with numbers when available",
      "State replication status explicitly",
      "Note WEIRD sample limitations if claiming broad applicability",
      "Correlation != causation: state design type",
      "Do not present a small effect (d < 0.2) as transformative"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.TITLE_PREMISE],
    requires_context: [],
    validator: "N05"
  });
}

registerBuiltinNiches();

// --- TIER 2: Recognized Domain Registry ---

const DOMAIN_REGISTRY = new Map();

function registerBuiltinDomains() {
  DOMAIN_REGISTRY.set("science", {
    domain: "Science",
    policies: [
      "Cite primary sources with author, year, journal, sample size",
      "State replication status for key findings",
      "Distinguish correlation from causation",
      "Qualify effect sizes when available",
      "Note sample population limitations"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS],
    high_stakes: false
  });

  DOMAIN_REGISTRY.set("history", {
    domain: "History",
    policies: [
      "Verify dates and locations against multiple sources",
      "Every historical quote must trace to a documented source",
      "Translations must preserve qualifiers",
      "Distinguish primary from secondary sources",
      "Note historiographical debates where relevant"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.HARM],
    high_stakes: false
  });

  DOMAIN_REGISTRY.set("technology", {
    domain: "Technology",
    policies: [
      "Verify operational vs development status for technology claims",
      "Single-party claims must be attributed, not stated as fact",
      "Performance specifications require source and conditions",
      "Distinguish announced from shipping products"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS],
    high_stakes: false
  });

  DOMAIN_REGISTRY.set("health", {
    domain: "Health",
    policies: [
      "Clinical evidence standards required for health claims",
      "Distinguish FDA-approved from experimental treatments",
      "Effect sizes and confidence intervals required for clinical claims",
      "Note population-specific limitations of studies",
      "Do not present preliminary findings as medical advice"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.HARM, HOLD_TYPES.REVIEW],
    high_stakes: true
  });

  DOMAIN_REGISTRY.set("finance", {
    domain: "Finance",
    policies: [
      "All projections must include disclaimers and uncertainty qualifiers",
      "Past performance disclaimers required for investment claims",
      "Distinguish analysis from financial advice",
      "Market data must include source and timestamp",
      "Risk factors must be disclosed alongside opportunity claims"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.REVIEW],
    high_stakes: true
  });

  DOMAIN_REGISTRY.set("education", {
    domain: "Education",
    policies: [
      "Pedagogical claims must cite evidence base",
      "Adjust complexity to stated audience level",
      "Distinguish established findings from emerging research",
      "Note WEIRD sample limitations if claiming broad applicability"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS],
    high_stakes: false
  });

  DOMAIN_REGISTRY.set("sports", {
    domain: "Sports",
    policies: [
      "Statistics must include source and season/date",
      "Performance claims must cite measurable data",
      "Distinguish official records from estimates",
      "Historical claims require documented sources"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS],
    high_stakes: false
  });

  DOMAIN_REGISTRY.set("real_estate", {
    domain: "Real Estate",
    policies: [
      "Market data must include source, geography, and date",
      "Projections must include uncertainty qualifiers",
      "Distinguish listing claims from verified data",
      "Price history requires documented source"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.REVIEW],
    high_stakes: false
  });

  DOMAIN_REGISTRY.set("engineering", {
    domain: "Engineering",
    policies: [
      "Specifications must include source and conditions",
      "Safety-critical claims require multiple independent sources",
      "Distinguish theoretical from tested performance",
      "Material properties must cite standards or test reports",
      "Failure modes must be disclosed for safety-critical systems"
    ],
    safeguards: [...UNIVERSAL_SAFEGUARDS, HOLD_TYPES.HARM],
    high_stakes: false
  });
}

registerBuiltinDomains();

// --- Resolution Logic ---

function normalizeNicheCode(input) {
  if (!input || typeof input !== "string") return null;
  return input.replace(/[-_\s]/g, "").toUpperCase();
}

function parseDomainPrefix(input) {
  if (!input || typeof input !== "string") return null;
  const match = input.match(/^domain:(.+)$/i);
  if (match) return match[1].trim().toLowerCase().replace(/\s+/g, "_");
  return null;
}

function detectHighStakes(description) {
  if (!description || typeof description !== "string") return false;
  const lower = description.toLowerCase();
  return HIGH_STAKES_KEYWORDS.some(kw => lower.includes(kw));
}

function detectDomainOverlaps(description) {
  if (!description || typeof description !== "string") return [];
  const lower = description.toLowerCase();
  const matches = [];
  for (const [key, config] of DOMAIN_REGISTRY) {
    const domainLower = config.domain.toLowerCase();
    if (lower.includes(domainLower) || lower.includes(key)) {
      matches.push(key);
    }
  }
  return matches;
}

export function resolveNiche(nicheInput) {
  if (!nicheInput || (typeof nicheInput !== "string" && typeof nicheInput !== "object")) {
    return {
      tier: 0,
      nicheCode: null,
      domain: null,
      policies: [],
      safeguards: [...UNIVERSAL_SAFEGUARDS],
      validation: { valid: false, error: "Niche input is missing or invalid" },
      high_stakes: false,
      overlapping_domains: []
    };
  }

  const input = typeof nicheInput === "string" ? nicheInput.trim() : nicheInput;

  if (typeof input !== "string") {
    return {
      tier: 0,
      nicheCode: null,
      domain: null,
      policies: [],
      safeguards: [...UNIVERSAL_SAFEGUARDS],
      validation: { valid: false, error: "Niche input must be a string" },
      high_stakes: false,
      overlapping_domains: []
    };
  }

  // TIER 1: Check registered niches
  const normalized = normalizeNicheCode(input);
  if (NICHE_REGISTRY.has(normalized)) {
    const adapter = NICHE_REGISTRY.get(normalized);
    return {
      tier: 1,
      nicheCode: adapter.code,
      domain: adapter.domain,
      policies: [...adapter.policies],
      safeguards: [...new Set(adapter.safeguards)],
      validation: { valid: true, validator: adapter.validator },
      high_stakes: false,
      overlapping_domains: []
    };
  }

  // Reject codes that look like registered niche codes (N + digits) but aren't
  if (/^N\d+$/i.test(normalized)) {
    return {
      tier: 0,
      nicheCode: null,
      domain: null,
      policies: [],
      safeguards: [...UNIVERSAL_SAFEGUARDS],
      validation: { valid: false, error: `Unrecognized registered niche code: ${input}. Valid codes: ${[...NICHE_REGISTRY.keys()].join(", ")}` },
      high_stakes: false,
      overlapping_domains: []
    };
  }

  // TIER 2: Check domain prefix
  const domainKey = parseDomainPrefix(input);
  if (domainKey && DOMAIN_REGISTRY.has(domainKey)) {
    const domainConfig = DOMAIN_REGISTRY.get(domainKey);
    return {
      tier: 2,
      nicheCode: `domain:${domainKey}`,
      domain: domainConfig.domain,
      policies: [...domainConfig.policies],
      safeguards: [...new Set(domainConfig.safeguards)],
      validation: { valid: true },
      high_stakes: domainConfig.high_stakes,
      overlapping_domains: [domainKey]
    };
  }

  // TIER 2: Check if description matches a known domain
  const overlaps = detectDomainOverlaps(input);
  if (overlaps.length > 0) {
    const combinedPolicies = [];
    const combinedSafeguards = new Set(UNIVERSAL_SAFEGUARDS);
    let anyHighStakes = false;

    for (const key of overlaps) {
      const cfg = DOMAIN_REGISTRY.get(key);
      combinedPolicies.push(...cfg.policies);
      cfg.safeguards.forEach(s => combinedSafeguards.add(s));
      if (cfg.high_stakes) anyHighStakes = true;
    }

    const uniquePolicies = [...new Set(combinedPolicies)];

    return {
      tier: 2,
      nicheCode: overlaps.length === 1 ? `domain:${overlaps[0]}` : `domain:${overlaps.join("+")}`,
      domain: overlaps.map(k => DOMAIN_REGISTRY.get(k).domain).join(" + "),
      policies: uniquePolicies,
      safeguards: [...combinedSafeguards],
      validation: { valid: true },
      high_stakes: anyHighStakes || detectHighStakes(input),
      overlapping_domains: overlaps
    };
  }

  // TIER 3: Open niche
  const isHighStakes = detectHighStakes(input);
  const safeguards = [...UNIVERSAL_SAFEGUARDS];
  if (isHighStakes) {
    safeguards.push(HOLD_TYPES.REVIEW);
  }

  return {
    tier: 3,
    nicheCode: `open:${input.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
    domain: input,
    policies: [
      "Apply all 24 UNIVERSAL writing standards",
      "Every factual claim must be traceable to evidence",
      "Preserve epistemic qualifiers",
      "Do not fabricate quotes, characters, or evidence"
    ],
    safeguards: [...new Set(safeguards)],
    validation: { valid: true, open_niche: true },
    high_stakes: isHighStakes,
    overlapping_domains: []
  };
}

export function registerNiche(code, config) {
  if (!code || typeof code !== "string") {
    throw new Error("Niche code must be a non-empty string");
  }
  if (!config || typeof config !== "object") {
    throw new Error("Niche config must be an object");
  }
  const normalized = normalizeNicheCode(code);
  if (!normalized) {
    throw new Error("Niche code normalizes to empty");
  }

  const entry = {
    code: normalized,
    domain: config.domain || normalized,
    key_concern: config.key_concern || "",
    policies: Array.isArray(config.policies) ? [...config.policies] : [],
    safeguards: Array.isArray(config.safeguards)
      ? [...new Set([...UNIVERSAL_SAFEGUARDS, ...config.safeguards])]
      : [...UNIVERSAL_SAFEGUARDS],
    requires_context: Array.isArray(config.requires_context) ? [...config.requires_context] : [],
    validator: config.validator || null
  };

  NICHE_REGISTRY.set(normalized, entry);
  return entry;
}

export function isRegisteredNiche(code) {
  if (!code || typeof code !== "string") return false;
  return NICHE_REGISTRY.has(normalizeNicheCode(code));
}

export function getRegisteredNicheCodes() {
  return [...NICHE_REGISTRY.keys()];
}

export function getRecognizedDomains() {
  return [...DOMAIN_REGISTRY.keys()];
}

export { NICHE_REGISTRY, DOMAIN_REGISTRY, HOLD_TYPES, UNIVERSAL_SAFEGUARDS, HIGH_STAKES_KEYWORDS };
