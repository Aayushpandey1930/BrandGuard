import { useState, useRef } from "react";
import type { BrandProfile } from "../types";

const PROFILE_TEMPLATE = {
  organisation: "My Company",
  tagline: "Our brand voice.",
  disclaimer: "",
  voice: {
    description: "Describe your brand voice here.",
    guidelines: ["Keep language clear and direct.", "Avoid jargon."],
  },
  preferred_terms: [
    {
      use: "preferred word",
      avoid: ["avoid-word-1", "avoid-word-2"],
      context: "customer-facing copy",
      rationale: "Consistency across all materials.",
    },
  ],
  approved_facts: [
    {
      id: "fact_example",
      statement: "Our product is available in 5 colours.",
      approved_number: 5,
      keywords: ["colour", "colors", "colours", "color"],
    },
  ],
  restricted_claims: [
    {
      id: "claim_superlative",
      patterns: ["best in the world", "number one", "#1"],
      rule: "Do not use unsupported superlatives without approved evidence.",
      severity: "needs_attention",
    },
  ],
  accessibility: {
    rule: "All images must have meaningful alt text.",
    keywords: ["image", "photo", "banner", "graphic"],
  },
};

interface Props {
  onProfileLoaded: (profile: BrandProfile) => void;
  onReset: () => void;
  isCustom: boolean;
  customProfileName?: string;
}

export default function BrandProfileUpload({
  onProfileLoaded,
  onReset,
  isCustom,
  customProfileName,
}: Props) {
  const [mode, setMode] = useState<"closed" | "paste" | "template">("closed");
  const [rawJson, setRawJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = (obj: unknown): BrandProfile | string => {
    if (typeof obj !== "object" || obj === null) return "JSON must be an object.";
    const o = obj as Record<string, unknown>;
    if (!o.organisation || typeof o.organisation !== "string")
      return "Missing required field: organisation (string).";
    if (!o.voice || typeof o.voice !== "object")
      return "Missing required field: voice (object with description).";
    if (!o.preferred_terms || !Array.isArray(o.preferred_terms))
      return "Missing required field: preferred_terms (array).";
    if (!o.approved_facts || !Array.isArray(o.approved_facts))
      return "Missing required field: approved_facts (array).";
    if (!o.restricted_claims || !Array.isArray(o.restricted_claims))
      return "Missing required field: restricted_claims (array).";
    return obj as BrandProfile;
  };

  const handleApply = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      setError("Invalid JSON — please check your syntax and try again.");
      return;
    }
    const result = validate(parsed);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    onProfileLoaded(result);
    setMode("closed");
    setRawJson("");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawJson((ev.target?.result as string) ?? "");
      setMode("paste");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleUseTemplate = () => {
    setRawJson(JSON.stringify(PROFILE_TEMPLATE, null, 2));
    setMode("paste");
  };

  if (mode === "closed") {
    return (
      <div className="card" style={{ padding: "1rem 1.5rem" }}>
        <div className="flex items-center justify-between gap-2" style={{ flexWrap: "wrap" }}>
          <div>
            <p className="text-sm" style={{ fontWeight: 600 }}>
              {isCustom ? (
                <>
                  <span style={{ color: "var(--color-accepted-border)" }}>✓ Custom brand profile loaded</span>
                  {customProfileName && (
                    <span className="text-secondary" style={{ fontWeight: 400 }}>
                      {" "}— {customProfileName}
                    </span>
                  )}
                </>
              ) : (
                "Using built-in Northstar Coffee profile"
              )}
            </p>
            <p className="text-xs text-muted mt-1">
              {isCustom
                ? "Your custom rules are active for this session."
                : "Upload your own brand rules to check a different organisation's copy."}
            </p>
          </div>
          <div className="flex gap-2">
            {isCustom && (
              <button className="btn btn-ghost btn-sm" onClick={onReset}>
                Reset to default
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setMode("paste")}
            >
              {isCustom ? "Change profile" : "Upload brand rules"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: "1rem" }}>Upload custom brand rules</h2>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setMode("closed"); setError(null); setRawJson(""); }}
        >
          Cancel
        </button>
      </div>

      <p className="text-sm text-secondary mb-3">
        Paste a brand profile as JSON, upload a <code>.json</code> file, or start from the template below.
        The checker will use your rules instead of the built-in Northstar Coffee profile.
      </p>

      <div className="flex gap-2 mb-3" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-secondary btn-sm" onClick={handleUseTemplate}>
          📋 Load template
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fileRef.current?.click()}
        >
          📂 Upload JSON file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>

      <label htmlFor="brand-profile-json">Brand profile JSON</label>
      <textarea
        id="brand-profile-json"
        rows={12}
        value={rawJson}
        onChange={(e) => { setRawJson(e.target.value); setError(null); }}
        placeholder={"{\n  \"organisation\": \"...\",\n  ...\n}"}
        style={{ fontFamily: "'Menlo', 'Consolas', monospace", fontSize: "0.8125rem" }}
        aria-label="Brand profile JSON input"
        aria-describedby={error ? "brand-json-error" : undefined}
      />

      {error && (
        <div id="brand-json-error" className="notice notice-error mt-2" role="alert">
          {error}
        </div>
      )}

      <div
        className="notice notice-info mt-3"
        style={{ fontSize: "0.8125rem" }}
      >
        <strong>Required fields:</strong>{" "}
        <code>organisation</code>, <code>voice</code>, <code>preferred_terms</code>,{" "}
        <code>approved_facts</code>, <code>restricted_claims</code>
      </div>

      <div className="flex gap-2 mt-3" style={{ justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={handleApply}
          disabled={!rawJson.trim()}
        >
          Apply brand profile
        </button>
      </div>
    </div>
  );
}
