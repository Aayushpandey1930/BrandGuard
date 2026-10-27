// API client for BrandGuard backend

import type {
  BrandProfileResponse,
  CheckResponse,
  Finding,
  FindingStatus,
  ReviewDecision,
  ReviewSession,
} from "./types";

const BASE = "http://localhost:8000";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export async function getBrandProfile(): Promise<BrandProfileResponse> {
  return fetchJSON<BrandProfileResponse>(`${BASE}/api/brand-profile`);
}

export async function checkDraft(
  draft: string,
  isSample: boolean
): Promise<CheckResponse> {
  return fetchJSON<CheckResponse>(`${BASE}/api/check`, {
    method: "POST",
    body: JSON.stringify({ draft, is_sample: isSample }),
  });
}

export async function getSession(sessionId: string): Promise<ReviewSession> {
  const data = await fetchJSON<{ session: ReviewSession }>(
    `${BASE}/api/session/${sessionId}`
  );
  return data.session;
}

export async function updateFinding(
  sessionId: string,
  findingId: string,
  status: FindingStatus,
  appliedText?: string
): Promise<Finding> {
  const data = await fetchJSON<{ finding: Finding }>(
    `${BASE}/api/session/${sessionId}/finding/${findingId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, applied_text: appliedText }),
    }
  );
  return data.finding;
}

export async function submitReview(
  sessionId: string,
  decision: ReviewDecision,
  comment?: string
): Promise<{ final_status: string; session: ReviewSession }> {
  return fetchJSON(`${BASE}/api/session/${sessionId}/review`, {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, decision, comment }),
  });
}

export async function checkHealth(): Promise<{
  status: string;
  ai_available: boolean;
}> {
  return fetchJSON(`${BASE}/api/health`);
}
