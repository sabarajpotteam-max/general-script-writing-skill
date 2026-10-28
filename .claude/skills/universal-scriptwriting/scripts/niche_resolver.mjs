/**
 * Dynamic Niche Resolver — M1.1 Hardened
 * 3-tier resolution with file-backed adapter registry,
 * overwrite protection, schema validation, and improved classification.
 * Node.js ESM, no dependencies.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

const VALID_HOLD_VALUES = new Set(Object.values(HOLD_TYPES));

const BUILTIN_CODES = new Set();

const HIGH_STAKES_KEYWORDS = [
  "medical", "medicine", "clinical", "pharmaceutical", "drug",
  "legal", "law", "litigation", "court",
  "financial", "investment", "trading", "securities",
  "military", "weapons", "defense", "classified",
  "nuclear", "radiation", "hazardous",
  "surgery", "diagnostic", "therapeutic",
  "cryptocurrency", "crypto", "blockchain", "defi",
  "healthcare", "medication", "prescription",
  "insurance", "pension", "retirement",
  "attorney", "lawyer",
  "ammunition", "explosives"
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Registries ---

const NICHE_REGISTRY = new Map();
const DOMAIN_REGISTRY = new Map();

// --- File-backed adapter loading ---

function resolveAdaptersDir() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  return join(scriptDir, "..", "adapters");
}

function loadBuiltinNichesFromFile() {
  const adaptersDir = resolveAdaptersDir();
  const nichesPath = join(adaptersDir, "builtin_niches.json");

  if (!existsSync(nichesPath)) return false;

  const data = JSON.parse(readFileSync(nichesPath, "utf-8"));
  if (!Array.isArray(data)) throw new Error("builtin_niches.json must be an array");

  for (const n of data) {
    if (!n.code || typeof n.code !== "string") throw new Error("Adapter missing code");
    if (!n.domain || typeof n.domain !== "string") throw new Error(`Adapter ${n.code} missing domain`);
    if (!Array.isArray(n.policies)) throw new Error(`Adapter ${n.code} missing policies array`);

    const extraSafeguards = (n.extra_safeguards || []).filter(s => VALID_HOLD_VALUES.has(s));

    NICHE_REGISTRY.set(n.code, {
      code: n.code,
      domain: n.domain,
      key_concern: n.key_concern || "",
      policies: [...n.policies],
      safeguards: [...new Set([...UNIVERSAL_SAFEGUARDS, ...extraSafeguards])],
      requires_context: Array.isArray(n.requires_context) ? [...n.requires_context] : [],
      validator: n.validator || null,
      builtin: true
    });
    BUILTIN_CODES.add(n.code);
  }
  return true;
}

function loadRecognizedDomainsFromFile() {
  const adaptersDir = resolveAdaptersDir();
  const domainsPath = join(adaptersDir, "recognized_domains.json");

  if (!existsSync(domainsPath)) return false;

  const data = JSON.parse(readFileSync(domainsPath, "utf-8"));
  if (!Array.isArray(data)) throw new Error("recognized_domains.json must be an array");

  for (const d of data) {
    if (!d.key || typeof d.key !== "string") throw new Error("Domain missing key");
    if (!d.domain || typeof d.domain !== "string") throw new Error(`Domain ${d.key} missing domain name`);
    if (!Array.isArray(d.policies)) throw new Error(`Domain ${d.key} missing policies array`);

    const extraSafeguards = (d.extra_safeguards || []).filter(s => VALID_HOLD_VALUES.has(s));

    DOMAIN_REGISTRY.set(d.key, {
      domain: d.domain,
      aliases: Array.isArray(d.aliases) ? [...d.aliases] : [],
      policies: [...d.policies],
      safeguards: [...new Set([...UNIVERSAL_SAFEGUARDS, ...extraSafeguards])],
      high_stakes: d.high_stakes === true
    });
  }
  return true;
}

// --- Hardcoded fallbacks (if adapter files missing) ---

function registerHardcodedBuiltinNiches() {
  const niches = [
    { code: "N01", domain: "USA Weather / Forecasting", key_concern: "Forecast staleness, official warning attribution", policies: ["Name issuing agency and issue time for every forecast", "Flag forecasts with validity window <= 1 hour as potentially stale", "Label projections as 'official warning' only with agency verification", "Historical weather events may use expired data IF marked historical", "Do not present model outputs as confirmed events"], extra: [HOLD_TYPES.STALE_FORECAST], requires_context: ["issued_at", "valid_until", "reference_time"], validator: "N01" },
    { code: "N02", domain: "Military / Aviation", key_concern: "Operational status claims, technology stage", policies: ["Verify deployment stage for 'operational' claims", "'Contracted' or 'development' != 'operational'", "Single-party claims must be attributed, not stated as fact", "Performance specifications require source and conditions", "Do not present classified information as public knowledge"], extra: [HOLD_TYPES.RIGHTS], requires_context: [], validator: "N02" },
    { code: "N03", domain: "German WW1/WW2 Human Stories", key_concern: "Quote authenticity, translation qualifiers, archival integrity", policies: ["Story era must overlap WW1 (1914-1918) or WW2 (1939-1945)", "era_start and era_end required in niche_context", "Every historical quote must trace to a documented source", "Translations must preserve qualifiers", "Reenacted footage must never be labelled as archival", "Survivor testimony must not be dramatized beyond the record"], extra: [HOLD_TYPES.HARM, HOLD_TYPES.REVIEW], requires_context: ["era_start", "era_end"], validator: "N03" },
    { code: "N04", domain: "Disaster News", key_concern: "Casualty figure provisionality, synthetic media disclosure", policies: ["Synthetic/AI video as authentic triggers immediate HOLD", "Provisional casualties must be labelled 'provisional' or 'estimated'", "Single-cause attribution requires study citation", "Use 'contributing factor' when causation is uncertain", "Ongoing situations need 'as of [date/time]' qualifiers"], extra: [HOLD_TYPES.HARM, HOLD_TYPES.REVIEW], requires_context: [], validator: "N04" },
    { code: "N05", domain: "Psychology / Explainers (General)", key_concern: "Study citations, effect size qualifiers, replication status", policies: ["Study citations: author, year, institution, sample size, finding", "Qualify effect sizes: small/moderate/large with numbers when available", "State replication status explicitly", "Note WEIRD sample limitations if claiming broad applicability", "Correlation != causation: state design type", "Do not present a small effect (d < 0.2) as transformative"], extra: [HOLD_TYPES.TITLE_PREMISE], requires_context: [], validator: "N05" }
  ];

  for (const n of niches) {
    NICHE_REGISTRY.set(n.code, {
      code: n.code,
      domain: n.domain,
      key_concern: n.key_concern,
      policies: [...n.policies],
      safeguards: [...new Set([...UNIVERSAL_SAFEGUARDS, ...n.extra])],
      requires_context: [...n.requires_context],
      validator: n.validator,
      builtin: true
    });
    BUILTIN_CODES.add(n.code);
  }
}

function registerHardcodedBuiltinDomains() {
  const domains = [
    { key: "science", domain: "Science", aliases: ["scientific", "research", "laboratory", "experiment"], policies: ["Cite primary sources with author, year, journal, sample size", "State replication status for key findings", "Distinguish correlation from causation", "Qualify effect sizes when available", "Note sample population limitations"], extra: [], high_stakes: false },
    { key: "history", domain: "History", aliases: ["historical", "archival", "heritage"], policies: ["Verify dates and locations against multiple sources", "Every historical quote must trace to a documented source", "Translations must preserve qualifiers", "Distinguish primary from secondary sources", "Note historiographical debates where relevant"], extra: [HOLD_TYPES.HARM], high_stakes: false },
    { key: "technology", domain: "Technology", aliases: ["tech", "technological", "computing", "software", "hardware"], policies: ["Verify operational vs development status for technology claims", "Single-party claims must be attributed, not stated as fact", "Performance specifications require source and conditions", "Distinguish announced from shipping products"], extra: [], high_stakes: false },
    { key: "health", domain: "Health", aliases: ["healthcare", "wellness", "patient care", "clinical care"], policies: ["Clinical evidence standards required for health claims", "Distinguish FDA-approved from experimental treatments", "Effect sizes and confidence intervals required for clinical claims", "Note population-specific limitations of studies", "Do not present preliminary findings as medical advice"], extra: [HOLD_TYPES.HARM, HOLD_TYPES.REVIEW], high_stakes: true },
    { key: "finance", domain: "Finance", aliases: ["banking", "monetary", "economic", "fiscal"], policies: ["All projections must include disclaimers and uncertainty qualifiers", "Past performance disclaimers required for investment claims", "Distinguish analysis from financial advice", "Market data must include source and timestamp", "Risk factors must be disclosed alongside opportunity claims"], extra: [HOLD_TYPES.REVIEW], high_stakes: true },
    { key: "education", domain: "Education", aliases: ["educational", "academic", "pedagogy", "teaching", "curriculum"], policies: ["Pedagogical claims must cite evidence base", "Adjust complexity to stated audience level", "Distinguish established findings from emerging research", "Note WEIRD sample limitations if claiming broad applicability"], extra: [], high_stakes: false },
    { key: "sports", domain: "Sports", aliases: ["athletic", "athletics", "sporting", "competition"], policies: ["Statistics must include source and season/date", "Performance claims must cite measurable data", "Distinguish official records from estimates", "Historical claims require documented sources"], extra: [], high_stakes: false },
    { key: "real_estate", domain: "Real Estate", aliases: ["property", "housing", "realty"], policies: ["Market data must include source, geography, and date", "Projections must include uncertainty qualifiers", "Distinguish listing claims from verified data", "Price history requires documented source"], extra: [HOLD_TYPES.REVIEW], high_stakes: false },
    { key: "engineering", domain: "Engineering", aliases: ["mechanical", "civil engineering", "electrical", "structural", "aerospace"], policies: ["Specifications must include source and conditions", "Safety-critical claims require multiple independent sources", "Distinguish theoretical from tested performance", "Material properties must cite standards or test reports", "Failure modes must be disclosed for safety-critical systems"], extra: [HOLD_TYPES.HARM], high_stakes: false }
  ];

  for (const d of domains) {
    DOMAIN_REGISTRY.set(d.key, {
      domain: d.domain,
      aliases: [...d.aliases],
      policies: [...d.policies],
      safeguards: [...new Set([...UNIVERSAL_SAFEGUARDS, ...d.extra])],
      high_stakes: d.high_stakes
    });
  }
}

// --- Initialize ---

if (!loadBuiltinNichesFromFile()) {
  registerHardcodedBuiltinNiches();
}
if (!loadRecognizedDomainsFromFile()) {
  registerHardcodedBuiltinDomains();
}

// --- Resolution helpers ---

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
  return HIGH_STAKES_KEYWORDS.some(kw => {
    const re = new RegExp("\\b" + escapeRegex(kw) + "\\b", "i");
    return re.test(lower);
  });
}

function detectDomainOverlaps(description) {
  if (!description || typeof description !== "string") return [];
  const lower = description.toLowerCase();
  const matches = [];

  for (const [key, config] of DOMAIN_REGISTRY) {
    const keyPattern = key.replace(/_/g, "[_ -]");
    if (new RegExp("\\b" + escapeRegex(keyPattern).replace(/\\\[_ -\\\]/g, "[_ -]") + "\\b", "i").test(lower)) {
      matches.push(key);
      continue;
    }
    if (new RegExp("\\b" + escapeRegex(config.domain.toLowerCase()) + "\\b", "i").test(lower)) {
      matches.push(key);
      continue;
    }
    if (config.aliases) {
      let matched = false;
      for (const alias of config.aliases) {
        if (new RegExp("\\b" + escapeRegex(alias.toLowerCase()) + "\\b", "i").test(lower)) {
          matches.push(key);
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }
  }
  return matches;
}

// --- Main resolution ---

export function resolveNiche(nicheInput) {
  if (!nicheInput || (typeof nicheInput !== "string" && typeof nicheInput !== "object")) {
    return {
      tier: 0, nicheCode: null, domain: null, policies: [],
      safeguards: [...UNIVERSAL_SAFEGUARDS],
      validation: { valid: false, error: "Niche input is missing or invalid" },
      high_stakes: false, requires_review: false, overlapping_domains: []
    };
  }

  const input = typeof nicheInput === "string" ? nicheInput.trim() : nicheInput;

  if (typeof input !== "string" || input.length === 0) {
    return {
      tier: 0, nicheCode: null, domain: null, policies: [],
      safeguards: [...UNIVERSAL_SAFEGUARDS],
      validation: { valid: false, error: "Niche input must be a non-empty string" },
      high_stakes: false, requires_review: false, overlapping_domains: []
    };
  }

  // TIER 1: Check registered niches
  const normalized = normalizeNicheCode(input);
  if (NICHE_REGISTRY.has(normalized)) {
    const adapter = NICHE_REGISTRY.get(normalized);
    const isCustom = !adapter.builtin;
    const isHighStakes = isCustom && (
      detectHighStakes(adapter.domain) ||
      detectHighStakes(adapter.key_concern || "")
    );
    const safeguards = [...new Set([
      ...adapter.safeguards,
      ...(isCustom ? [HOLD_TYPES.REVIEW] : []),
      ...(isHighStakes ? [HOLD_TYPES.REVIEW] : [])
    ])];
    return {
      tier: 1,
      nicheCode: adapter.code,
      domain: adapter.domain,
      policies: [...adapter.policies],
      safeguards,
      validation: { valid: true, validator: adapter.validator, custom: isCustom },
      high_stakes: isHighStakes,
      requires_review: isCustom,
      overlapping_domains: []
    };
  }

  // Reject codes that look like registered niche codes (N + digits) but aren't
  if (/^N\d+$/i.test(normalized)) {
    return {
      tier: 0, nicheCode: null, domain: null, policies: [],
      safeguards: [...UNIVERSAL_SAFEGUARDS],
      validation: { valid: false, error: `Unrecognized registered niche code: ${input}. Valid codes: ${[...NICHE_REGISTRY.keys()].join(", ")}` },
      high_stakes: false, requires_review: false, overlapping_domains: []
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
      requires_review: false,
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
      requires_review: false,
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
    requires_review: false,
    overlapping_domains: []
  };
}

// --- Registration with safety ---

export function registerNiche(code, config) {
  if (!code || typeof code !== "string") {
    throw new Error("Niche code must be a non-empty string");
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Niche config must be an object");
  }

  const normalized = normalizeNicheCode(code);
  if (!normalized) {
    throw new Error("Niche code normalizes to empty");
  }

  if (BUILTIN_CODES.has(normalized)) {
    throw new Error(`Cannot overwrite builtin niche ${normalized}. Builtin adapters (${[...BUILTIN_CODES].join(", ")}) are protected.`);
  }

  if (NICHE_REGISTRY.has(normalized)) {
    throw new Error(`Niche ${normalized} is already registered. Use a different code.`);
  }

  if (!config.domain || typeof config.domain !== "string") {
    throw new Error("Niche config requires a 'domain' string");
  }
  if (config.policies !== undefined && !Array.isArray(config.policies)) {
    throw new Error("Niche config 'policies' must be an array of strings");
  }
  if (config.safeguards !== undefined && !Array.isArray(config.safeguards)) {
    throw new Error("Niche config 'safeguards' must be an array of strings");
  }

  const customSafeguards = [];
  if (Array.isArray(config.safeguards)) {
    for (const s of config.safeguards) {
      if (typeof s !== "string") {
        throw new Error(`Safeguard must be a string, got ${typeof s}`);
      }
      if (!VALID_HOLD_VALUES.has(s)) {
        throw new Error(`Unknown safeguard: "${s}". Valid: ${[...VALID_HOLD_VALUES].join(", ")}`);
      }
      customSafeguards.push(s);
    }
  }

  // Universal safeguards always included; custom niches always require review
  const safeguards = [...new Set([...UNIVERSAL_SAFEGUARDS, ...customSafeguards, HOLD_TYPES.REVIEW])];

  const entry = {
    code: normalized,
    domain: config.domain,
    key_concern: config.key_concern || "",
    policies: Array.isArray(config.policies) ? [...config.policies] : [],
    safeguards,
    requires_context: Array.isArray(config.requires_context) ? [...config.requires_context] : [],
    validator: config.validator || null,
    builtin: false
  };

  NICHE_REGISTRY.set(normalized, entry);
  return entry;
}

// --- Query helpers ---

export function isRegisteredNiche(code) {
  if (!code || typeof code !== "string") return false;
  return NICHE_REGISTRY.has(normalizeNicheCode(code));
}

export function isBuiltinNiche(code) {
  if (!code || typeof code !== "string") return false;
  return BUILTIN_CODES.has(normalizeNicheCode(code));
}

export function getRegisteredNicheCodes() {
  return [...NICHE_REGISTRY.keys()];
}

export function getRecognizedDomains() {
  return [...DOMAIN_REGISTRY.keys()];
}

export { HOLD_TYPES, UNIVERSAL_SAFEGUARDS, HIGH_STAKES_KEYWORDS, VALID_HOLD_VALUES };
