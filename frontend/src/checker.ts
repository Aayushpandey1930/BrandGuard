/**
 * Deterministic rule-based checks against the Northstar Coffee brand profile.
 * Runs entirely in the browser — no API key required.
 */

import type { Finding } from "./types";
import { BRAND_PROFILE } from "./brandRules";

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

function checkPreferredTerms(draft: string): Finding[] {
  const findings: Finding[] = [];
  for (const termRule of BRAND_PROFILE.preferred_terms) {
    for (const avoid of termRule.avoid) {
      const re = new RegExp(`\\b${avoid}\\b`, "gi");
      if (re.test(draft)) {
        findings.push({
          id: makeId(),
          title: `Preferred term: use "${termRule.use}"`,
          category: "Terminology",
          triggered_text: findExcerpt(draft, avoid),
          explanation: `The word "${avoid}" appears in this draft. Northstar Coffee uses "${termRule.use}" in all ${termRule.context} to keep language consistent.`,
          related_rule: `Use "${termRule.use}" — avoid "${termRule.avoid.join('", "')}" in ${termRule.context}. ${termRule.rationale}`,
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

function checkApprovedFacts(draft: string): Finding[] {
  const findings: Finding[] = [];
  const lower = draft.toLowerCase();

  // Fact: locations count
  const locFact = BRAND_PROFILE.approved_facts.find((f) => f.id === "fact_locations")!;
  const locRe = /\b(\d+)\s+(?:location|locations|store|stores|branch|branches|outlet|outlets)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = locRe.exec(draft)) !== null) {
    const found = parseInt(m[1], 10);
    if (found !== (locFact as { approved_number: number }).approved_number) {
      findings.push({
        id: makeId(),
        title: "Incorrect location count",
        category: "Fact accuracy",
        triggered_text: findExcerpt(draft, m[0]),
        explanation: `The draft says "${m[0]}" but the approved fact is "${locFact.statement}". Using the wrong number risks misleading customers.`,
        related_rule: locFact.statement,
        severity: "needs_attention",
        source: "rule",
        suggestion: `Change "${m[0]}" to "12 locations" to match the approved fact.`,
        status: "open",
      });
      break;
    }
  }

  // Fact: seasonal blend availability
  const seasonalFact = BRAND_PROFILE.approved_facts.find((f) => f.id === "fact_seasonal_blend")!;
  const seasonalKws = (seasonalFact as { keywords: readonly string[] }).keywords;
  for (const kw of seasonalKws) {
    const kwRe = new RegExp(`\\b${kw}\\b`, "i");
    if (kwRe.test(draft)) {
      const required = (seasonalFact as { required_phrase: string }).required_phrase;
      if (!lower.includes(required.toLowerCase())) {
        findings.push({
          id: makeId(),
          title: "Missing availability qualifier",
          category: "Fact accuracy",
          triggered_text: findExcerpt(draft, kw),
          explanation: `The draft mentions the seasonal blend but does not include the required phrase "${required}". Without this qualifier, customers may expect availability that cannot be guaranteed.`,
          related_rule: seasonalFact.statement,
          severity: "review",
          source: "rule",
          suggestion: `Add "while supplies last" after the mention of the seasonal blend. Example: "Try our seasonal blend today, available while supplies last."`,
          confidence_note: "Needs human review — context may already imply limited availability.",
          status: "open",
        });
      }
      break;
    }
  }

  return findings;
}

function checkRestrictedClaims(draft: string): Finding[] {
  const findings: Finding[] = [];
  const lower = draft.toLowerCase();

  for (const claimRule of BRAND_PROFILE.restricted_claims) {
    for (const pattern of claimRule.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        findings.push({
          id: makeId(),
          title: "Unsupported claim",
          category: "Claims & compliance",
          triggered_text: findExcerpt(draft, pattern),
          explanation: `The phrase "${pattern}" is a promotional claim that requires documented evidence before it can be published. Using it without approval creates compliance risk.`,
          related_rule: claimRule.rule,
          severity: claimRule.severity,
          source: "rule",
          suggestion:
            "Remove or replace with a specific, verifiable statement. For example, describe a particular award, a customer milestone, or a concrete number.",
          status: "open",
        });
        break;
      }
    }
  }
  return findings;
}

export function runAllChecks(draft: string): Finding[] {
  idCounter = 0;
  return [
    ...checkPreferredTerms(draft),
    ...checkApprovedFacts(draft),
    ...checkRestrictedClaims(draft),
  ];
}
