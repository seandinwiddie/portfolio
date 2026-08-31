"""Blocking contracts for the installed functional core."""

from __future__ import annotations

from fp.findings import Rule, Severity, register
from fp.skill_paths import skill_file


TS_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"}
SOURCE_SUFFIXES = TS_SUFFIXES

TS_REQUIRED_FP_EXPORTS = (
    "Dispatcher", "Either", "Maybe", "Predicate", "_",
    "just", "nothing", "fmap", "mbind", "match", "orElse", "isJust",
    "isNothing", "fromNullable", "requireJust", "left", "right", "efmap",
    "ebind", "ematch", "isLeft", "isRight", "compose", "curry", "fold",
    "filter", "traverse", "createDispatcher", "multiMatch",
)

FP_CORE_SURFACE = register(Rule(
    "FP-SOURCE-012", Severity.HIGH,
    "functional core surface is missing its shipped primitive contract",
    "Keep the declared functional core and installed runtime surface aligned.",
    f"{skill_file('fp')}:69-157",
))
FP_CORE_DEPENDENCIES = register(Rule(
    "FP-SOURCE-013", Severity.HIGH,
    "functional core declares runtime dependencies",
    "Keep the functional core dependency-free; application and boundary layers may depend on it, never the reverse.",
    f"{skill_file('fp')}:64-65",
))

BLOCKING_SEVERITIES = {Severity.CRITICAL, Severity.HIGH}
