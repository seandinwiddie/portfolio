"""Preserve contextual FP judgments in JSON and SARIF reporter output."""

from __future__ import annotations

import json
import re

from fp.skill_reviews import ReviewNotice, SKILL_PATH


READ_ADVICE = "Read the fp skill for the contextual decision process."
LOCATION_RE = re.compile(
    r"^(?P<path>(?:app|src)/[^:]+):(?P<line>[1-9][0-9]*):",
)


def review_payload(notice: ReviewNotice) -> dict[str, object]:
    return {
        "disposition": notice.level,
        "message": notice.guidance,
        "section": f"FP > {notice.section}",
        "skill": str(SKILL_PATH),
        "skillReference": f"{SKILL_PATH}:{notice.lines}",
        "canonReference": f"{SKILL_PATH}:31-45",
        "advice": READ_ADVICE,
    }


def format_json_with_reviews(
    findings_json: str,
    notices: list[ReviewNotice],
) -> str:
    payload = json.loads(findings_json)
    reviews = [review_payload(notice) for notice in notices]
    payload.update({
        "reviews": reviews,
        "reviewCount": len(reviews),
        "totalCount": int(payload.get("count", 0)) + len(reviews),
    })
    return json.dumps(payload, indent=2)


def _sarif_rule(level: str) -> dict[str, object]:
    rule_id = f"FP-CONTEXT-{level}"
    return {
        "id": rule_id,
        "name": rule_id,
        "shortDescription": {
            "text": f"Functional-programming contextual {level.lower()}",
        },
        "fullDescription": {
            "text": "A static check found evidence that requires agent judgment against the complete fp skill.",
        },
        "defaultConfiguration": {
            "level": "warning" if level == "REVIEW" else "note",
        },
        "properties": {"skill": str(SKILL_PATH)},
    }


def _sarif_location(notice: ReviewNotice) -> list[dict[str, object]]:
    match = LOCATION_RE.match(notice.guidance)
    if not match:
        return []
    return [{
        "physicalLocation": {
            "artifactLocation": {"uri": match.group("path")},
            "region": {"startLine": int(match.group("line"))},
        },
    }]


def _sarif_result(notice: ReviewNotice) -> dict[str, object]:
    payload = review_payload(notice)
    result = {
        "ruleId": f"FP-CONTEXT-{notice.level}",
        "level": "warning" if notice.level == "REVIEW" else "note",
        "message": {"text": notice.guidance},
        "properties": {
            "section": payload["section"],
            "skillReference": payload["skillReference"],
            "canonReference": payload["canonReference"],
            "advice": payload["advice"],
        },
    }
    locations = _sarif_location(notice)
    return {**result, **({"locations": locations} if locations else {})}


def format_sarif_with_reviews(
    findings_sarif: str,
    notices: list[ReviewNotice],
) -> str:
    payload = json.loads(findings_sarif)
    driver = payload["runs"][0]["tool"]["driver"]
    results = payload["runs"][0]["results"]
    levels = sorted({notice.level for notice in notices})
    driver.setdefault("rules", []).extend(_sarif_rule(level) for level in levels)
    results.extend(_sarif_result(notice) for notice in notices)
    return json.dumps(payload, indent=2)
