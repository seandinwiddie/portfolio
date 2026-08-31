"""Dynamic source ownership and discovery for FP conformance."""

from __future__ import annotations

from pathlib import Path

from fp.source_engine import PROJECT_ROOT, SOURCE_ROOT
from fp.source_rules import SOURCE_SUFFIXES, TS_SUFFIXES


IGNORED_PARTS = {".git", "coverage", "dist", "node_modules", "__pycache__"}
SKIPPED_PARTS = {"test", "tests", "__tests__", "testing", "__pycache__"}
TEST_SOURCE_MARKERS = (".test.", ".spec.", ".bdd.")


def has_part(path: Path, parts: set[str]) -> bool:
    return any(part in parts for part in path.parts)


def is_runtime_source(path: Path) -> bool:
    return (
        not has_part(path, IGNORED_PARTS | SKIPPED_PARTS)
        and not any(marker in path.name for marker in TEST_SOURCE_MARKERS)
        and path.suffix in SOURCE_SUFFIXES
    )


def is_ts_source(path: Path) -> bool:
    return path.suffix in TS_SUFFIXES


def iter_files(root: Path, suffixes: set[str] = SOURCE_SUFFIXES) -> list[Path]:
    if not root.exists():
        return []
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file() and path.suffix in suffixes and not has_part(path, IGNORED_PARTS)
    )


def authored_source_roots() -> list[Path]:
    """Return this single Expo app's authored runtime roots."""
    candidates = [SOURCE_ROOT, PROJECT_ROOT / "app"]
    return list(dict.fromkeys(path.resolve() for path in candidates if path.is_dir()))


def authored_source_files() -> list[Path]:
    files = [path for root in authored_source_roots() for path in iter_files(root)]
    return sorted(dict.fromkeys(files))
