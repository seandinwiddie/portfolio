"""Shared finding model and reporters for the functional-programming guards."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


SEVERITY_ORDER = {
    Severity.CRITICAL: 0,
    Severity.HIGH: 1,
    Severity.MEDIUM: 2,
    Severity.LOW: 3,
}

SARIF_LEVEL = {
    Severity.CRITICAL: "error",
    Severity.HIGH: "error",
    Severity.MEDIUM: "warning",
    Severity.LOW: "note",
}


@dataclass(frozen=True)
class Rule:
    id: str
    severity: Severity
    summary: str
    guidance: str
    skill: str
    roles: frozenset[str] = frozenset()


RULES: dict[str, Rule] = {}


def register(rule: Rule) -> Rule:
    if rule.id in RULES and RULES[rule.id] is not rule:
        raise ValueError(f"duplicate rule id: {rule.id}")
    RULES[rule.id] = rule
    return rule


@dataclass(frozen=True)
class Finding:
    path: Path
    line: int
    rule_id: str
    severity: Severity
    message: str
    column: int = 1

    @property
    def guidance(self) -> str:
        rule = RULES.get(self.rule_id)
        return rule.guidance if rule else ""


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def column_number(text: str, index: int) -> int:
    return index - (text.rfind("\n", 0, index) + 1) + 1


def display_path(finding: Finding, project_root: Path) -> str:
    try:
        return finding.path.relative_to(project_root).as_posix()
    except ValueError:
        return finding.path.as_posix()


def sort_findings(findings: list[Finding]) -> list[Finding]:
    return sorted(
        findings,
        key=lambda finding: (
            SEVERITY_ORDER[finding.severity],
            finding.path.as_posix(),
            finding.line,
            finding.rule_id,
        ),
    )


def format_text(findings: list[Finding], project_root: Path, guard_name: str) -> str:
    counts = {severity: 0 for severity in Severity}
    for finding in findings:
        counts[finding.severity] += 1
    summary = ", ".join(
        f"{counts[severity]} {severity.value}"
        for severity in Severity
        if counts[severity]
    )
    lines = [f"{guard_name} failed: {len(findings)} issue(s) ({summary})."]
    for finding in sort_findings(findings):
        lines.append(
            f"{display_path(finding, project_root)}:{finding.line}:{finding.column}: "
            f"[{finding.severity.value.upper()} {finding.rule_id}] {finding.message}"
        )
        if finding.guidance:
            lines.append(f"    fix: {finding.guidance}")
        rule = RULES.get(finding.rule_id)
        if rule and rule.skill:
            lines.append(f"    skill: {rule.skill}")
            lines.append("    advice: Read the complete fp skill before acting on this finding.")
    return "\n".join(lines)


def format_json(findings: list[Finding], project_root: Path) -> str:
    import json

    payload = [
        {
            "path": display_path(finding, project_root),
            "line": finding.line,
            "column": finding.column,
            "ruleId": finding.rule_id,
            "severity": finding.severity.value,
            "message": finding.message,
            "guidance": finding.guidance,
            "skill": RULES[finding.rule_id].skill if finding.rule_id in RULES else "",
        }
        for finding in sort_findings(findings)
    ]
    return json.dumps({"findings": payload, "count": len(payload)}, indent=2)


def format_sarif(findings: list[Finding], project_root: Path, guard_name: str) -> str:
    import json

    rule_ids = sorted({finding.rule_id for finding in findings if finding.rule_id in RULES})
    rules = [
        {
            "id": rule_id,
            "name": rule_id,
            "shortDescription": {"text": RULES[rule_id].summary},
            "fullDescription": {"text": RULES[rule_id].guidance},
            "properties": {
                "skill": RULES[rule_id].skill,
                "severity": RULES[rule_id].severity.value,
            },
            "defaultConfiguration": {"level": SARIF_LEVEL[RULES[rule_id].severity]},
        }
        for rule_id in rule_ids
    ]
    results = [
        {
            "ruleId": finding.rule_id,
            "level": SARIF_LEVEL[finding.severity],
            "message": {"text": finding.message},
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": {"uri": display_path(finding, project_root)},
                    "region": {"startLine": finding.line, "startColumn": finding.column},
                }
            }],
        }
        for finding in sort_findings(findings)
    ]
    return json.dumps({
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "version": "2.1.0",
        "runs": [{"tool": {"driver": {"name": guard_name, "rules": rules}}, "results": results}],
    }, indent=2)


def explain(rule_id: str | None) -> str:
    if rule_id and rule_id in RULES:
        rule = RULES[rule_id]
        return (
            f"{rule.id}  [{rule.severity.value.upper()}]\n"
            f"  what : {rule.summary}\n"
            f"  fix  : {rule.guidance}\n"
            f"  skill: {rule.skill}"
        )
    lines = ["Rules (id  severity  summary):"]
    for rule in sorted(RULES.values(), key=lambda item: (SEVERITY_ORDER[item.severity], item.id)):
        lines.append(f"  {rule.id:<16} {rule.severity.value:<8} {rule.summary}")
    return "\n".join(lines)
