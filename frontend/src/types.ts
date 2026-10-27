// BrandGuard shared TypeScript types

export type Severity = "review" | "needs_attention";
export type FindingSource = "rule" | "ai";
export type FindingStatus = "open" | "accepted" | "edited" | "dismissed";
export type ReviewDecision = "approve" | "request_changes";

export interface Finding {
  id: string;
  title: string;
  category: string;
  triggered_text: string;
  explanation: string;
  related_rule: string;
  severity: Severity;
  source: FindingSource;
  suggestion?: string;
  confidence_note?: string;
  status: FindingStatus;
  applied_text?: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  detail?: string;
}

export interface BrandProfile {
  organisation: string;
  tagline: string;
  disclaimer: string;
  voice: {
    description: string;
    guidelines: readonly string[];
  };
  preferred_terms: ReadonlyArray<{
    use: string;
    avoid: readonly string[];
    context: string;
    rationale: string;
  }>;
  approved_facts: ReadonlyArray<{
    id: string;
    statement: string;
  }>;
  restricted_claims: ReadonlyArray<{
    id: string;
    rule: string;
  }>;
  accessibility: {
    rule: string;
  };
}
