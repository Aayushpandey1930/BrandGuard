/**
 * Deterministic rule-based checks against a brand profile.
 * Runs entirely in the browser — no API key required.
 * Accepts a dynamic profile so custom uploads work out of the box.
 */

import type { Finding } from "./types";
import { BRAND_PROFILE } from "./brandRules";

// ------------------------------------------------------------------
// Extended profile shape (superset of what brandRules.ts exports)
// ------------------------------------------------------------------

export interface DynamicBrandProfile {
  organisation: string;
  tagline?: string;
  disclaimer?: string;
  voice?: {
    description?: string;
    guidelines?: readonly string[];
  };
  preferred_terms: ReadonlyArray<{
    use: string;
    avoid: readonly string[];
    context?: string;
    rationale?: string;
  }>;
  approved_facts: ReadonlyArray<{
    id: string;
    statement: string;
    approved_number?: number;
    keywords?: readonly string[];
    required_phrase?: string;
  }>;
  restricted_claims: ReadonlyArray<{
    id: string;
    patterns?: readonly string[];
    rule: string;
    severity?: string;
  }>;
  accessibility?: {
    rule?: string;
    keywords?: readonly string[];
  };
}

let idCounter = 0;
function makeId() {
  return (++idCounter).toString().padStart(3, "0");
}

function findExcerpt(text: string, phrase: string): string {
  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) return phrase;
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + phrase.length + 60);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = "…" + excerpt;
  if (end < text.length) excerpt = excerpt + "…";
  return excerpt;
}

function checkPreferredTerms(draft: string, profile: DynamicBrandProfile): Finding[] {
  const findings: Finding[] = [];
  for (const termRule of profile.preferred_terms) {
    for (const avoid of termRule.avoid) {
      const re = new RegExp(`\\b${avoid}\\b`, "gi");
      if (re.test(draft)) {
        findings.push({
          id: makeId(),
          title: `Preferred term: use "${termRule.use}"`,
          category: "Terminology",
          triggered_text: findExcerpt(draft, avoid),
          explanation: `The word "${avoid}" appears in this draft. ${profile.organisation} uses "${termRule.use}" in all ${termRule.context ?? "copy"} to keep language consistent.`,
          related_rule: `Use "${termRule.use}" — avoid "${termRule.avoid.join('", "')}" in ${termRule.context ?? "copy"}. ${termRule.rationale ?? ""}`,
          severity: "review",
          source: "rule",
          suggestion: `Replace "${avoid}" with "${termRule.use}".`,
          status: "open",
        });
      }
    }
  }
  return findings;
}

function checkApprovedFacts(draft: string, profile: DynamicBrandProfile): Finding[] {
  const findings: Finding[] = [];
  const lower = draft.toLowerCase();

  for (const fact of profile.approved_facts) {
    // Number check
    if (fact.approved_number !== undefined && fact.keywords && fact.keywords.length > 0) {
      const kwPattern = fact.keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const re = new RegExp(`\\b(\\d+)\\s+(?:${kwPattern})\\b`, "gi");
      let m: RegExpExecArray | null;
      let flagged = false;
      while ((m = re.exec(draft)) !== null && !flagged) {
        const found = parseInt(m[1], 10);
        if (found !== fact.approved_number) {
          findings.push({
            id: makeId(),
            title: `Incorrect count — ${fact.id}`,
            category: "Fact accuracy",
            triggered_text: findExcerpt(draft, m[0]),
            explanation: `The draft says "${m[0]}" but the approved fact is "${fact.statement}". Using the wrong number risks misleading readers.`,
            related_rule: fact.statement,
            severity: "needs_attention",
            source: "rule",
            suggestion: `Change "${m[0]}" to match the approved fact: "${fact.statement}".`,
            status: "open",
          });
          flagged = true;
        }
      }
    }

    // Required phrase check
    if (fact.required_phrase && fact.keywords && fact.keywords.length > 0) {
      for (const kw of fact.keywords) {
        const kwRe = new RegExp(`\\b${kw}\\b`, "i");
        if (kwRe.test(draft)) {
          const required = fact.required_phrase;
          if (!lower.includes(required.toLowerCase())) {
            findings.push({
              id: makeId(),
              title: "Missing required qualifier",
              category: "Fact accuracy",
              triggered_text: findExcerpt(draft, kw),
              explanation: `The draft mentions "${kw}" but does not include the required phrase "${required}".`,
              related_rule: fact.statement,
              severity: "review",
              source: "rule",
              suggestion: `Add "${required}" after the relevant mention.`,
              confidence_note: "Needs human review — context may already imply this.",
              status: "open",
            });
          }
          break;
        }
      }
    }
  }

  return findings;
}

function checkRestrictedClaims(draft: string, profile: DynamicBrandProfile): Finding[] {
  const findings: Finding[] = [];
  const lower = draft.toLowerCase();

  for (const claimRule of profile.restricted_claims) {
    for (const pattern of claimRule.patterns ?? []) {
      if (lower.includes(pattern.toLowerCase())) {
        findings.push({
          id: makeId(),
          title: "Unsupported claim",
          category: "Claims & compliance",
          triggered_text: findExcerpt(draft, pattern),
          explanation: `The phrase "${pattern}" is a promotional claim that requires documented evidence before it can be published.`,
          related_rule: claimRule.rule,
          severity: (claimRule.severity as "review" | "needs_attention") ?? "needs_attention",
          source: "rule",
          suggestion: "Remove or replace with a specific, verifiable statement.",
          status: "open",
        });
        break;
      }
    }
  }
  return findings;
}

export function runAllChecks(
  draft: string,
  profile: DynamicBrandProfile = BRAND_PROFILE as unknown as DynamicBrandProfile
): Finding[] {
  idCounter = 0;
  return [
    ...checkPreferredTerms(draft, profile),
    ...checkApprovedFacts(draft, profile),
    ...checkRestrictedClaims(draft, profile),
  ];
}
