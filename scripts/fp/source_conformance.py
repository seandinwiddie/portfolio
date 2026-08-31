#!/usr/bin/env python3
"""Run first-party FP source conformance checks."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fp.findings import Finding, RULES, Severity, explain, format_json, format_sarif, format_text
from fp.source_engine import PROJECT_ROOT, rel
from fp.source_scanners import find_findings, has_blocking_findings
from fp.source_rules import BLOCKING_SEVERITIES
from fp.skill_reviews import collect_skill_review_notices, format_skill_review_notice
from fp.structured_reviews import format_json_with_reviews, format_sarif_with_reviews


def format_text_with_warning_exit(findings: list[Finding], guard: str) -> str:
    if not findings:
        return f"{guard} passed."
    blockers = sum(1 for finding in findings if finding.severity in BLOCKING_SEVERITIES)
    if blockers:
        return format_text(findings, PROJECT_ROOT, guard)
    lines = [f"{guard} passed with {len(findings)} warning(s)."]
    for finding in sorted(findings, key=lambda item: (item.path.as_posix(), item.line, item.rule_id)):
        lines.append(
            f"{rel(finding.path)}:{finding.line}:{finding.column}: "
            f"[{finding.severity.value.upper()} {finding.rule_id}] {finding.message}"
        )
        if finding.guidance:
            lines.append(f"    fix: {finding.guidance}")
        rule = RULES.get(finding.rule_id)
        if rule and rule.skill:
            lines.append(f"    skill: {rule.skill}")
            lines.append("    advice: Read the complete fp skill before acting on this finding.")
    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--format", choices=("text", "json", "sarif"), default="text")
    parser.add_argument("--explain", nargs="?", const="", metavar="RULE-ID")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.explain is not None:
        print(explain(args.explain or None))
        return 0

    findings = find_findings()
    reviews = collect_skill_review_notices()
    guard = "FP source conformance guard"
    if args.format == "json":
        print(format_json_with_reviews(format_json(findings, PROJECT_ROOT), reviews))
    elif args.format == "sarif":
        print(format_sarif_with_reviews(
            format_sarif(findings, PROJECT_ROOT, guard),
            reviews,
        ))
    else:
        print(format_text_with_warning_exit(findings, guard))
        print("\n[notice] Non-blocking FP skill REVIEW/SMELL notices")
        for notice in reviews:
            for line in format_skill_review_notice(notice):
                print(line)
    return 1 if has_blocking_findings(findings) else 0


if __name__ == "__main__":
    sys.exit(main())
