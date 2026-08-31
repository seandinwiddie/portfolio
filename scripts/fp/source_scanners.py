"""Installed functional-core conformance scanner."""

from __future__ import annotations

from fp.findings import Finding
from fp.source_rules import BLOCKING_SEVERITIES
from fp.source_surface import scan_fp_core_surface


def find_findings() -> list[Finding]:
    return scan_fp_core_surface()


def has_blocking_findings(findings: list[Finding]) -> bool:
    return any(finding.severity in BLOCKING_SEVERITIES for finding in findings)
