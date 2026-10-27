"""
Northstar Coffee — Brand Profile (fictional demo content)
This file is intentionally separate from display code so brand guidance
can be updated without touching the UI or check logic.
"""

BRAND_PROFILE = {
    "organisation": "Northstar Coffee",
    "tagline": "Warm. Clear. Confident.",
    "disclaimer": "Fictional demo content — for hackathon demonstration only.",
    "voice": {
        "description": "Warm, clear and confident. Write like a knowledgeable friend, not a salesperson.",
        "guidelines": [
            "Use plain, direct language.",
            "Be encouraging without exaggerating.",
            "Avoid pushy or superlative language unless specifically approved.",
        ],
    },
    "preferred_terms": [
        {
            "use": "coffee shop",
            "avoid": ["café", "cafe"],
            "context": "customer-facing copy",
            "rationale": "Consistent terminology across all customer-facing materials.",
        }
    ],
    "approved_facts": [
        {
            "id": "fact_locations",
            "statement": "Northstar Coffee has 12 locations.",
            "keywords": ["location", "locations", "store", "stores", "branch", "branches", "outlet", "outlets"],
            "numbers": [12],
        },
        {
            "id": "fact_seasonal_blend",
            "statement": "The seasonal blend is available while supplies last.",
            "keywords": ["seasonal blend", "seasonal", "limited"],
            "required_phrase": "while supplies last",
        },
    ],
    "restricted_claims": [
        {
            "id": "claim_best_city",
            "patterns": ["best in the city", "best coffee in", "number one coffee", "#1 coffee", "top coffee in"],
            "rule": "Do not say 'best in the city' or similar superlatives without approved evidence.",
            "severity": "needs_attention",
        },
        {
            "id": "claim_health",
            "patterns": ["boosts immunity", "improves health", "health benefits", "cures", "prevents disease", "antioxidant-rich"],
            "rule": "Do not make health claims without approved evidence from the marketing science team.",
            "severity": "needs_attention",
        },
    ],
    "accessibility": {
        "rule": "Images used in campaign content should have meaningful alt text.",
        "keywords": ["image", "photo", "picture", "banner", "graphic"],
    },
}

SAMPLE_DRAFT = """\
Come visit our café on Main Street — Northstar Coffee is the best in the city! \
With over 18 locations across the region, we've become a community favourite. \
Try our seasonal blend today, perfect for those chilly mornings. \
Our knowledgeable baristas are always happy to help you find your perfect cup. \
Stop by and see why everyone is talking about us — we guarantee you'll love it.\
"""

SAMPLE_DRAFT_LABEL = "Sample draft — contains intentional issues for demonstration purposes."
