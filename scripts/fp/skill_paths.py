"""Portable discovery for the installed FP skill authority."""

from __future__ import annotations

import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _configured_roots() -> tuple[Path, ...]:
    values = (
        os.environ.get("AGENT_SKILLS_ROOT"),
        os.environ.get("CODEX_SKILLS_ROOT"),
    )
    return tuple(Path(value).expanduser() for value in values if value)


def _discovered_roots() -> tuple[Path, ...]:
    workspace = tuple(parent / ".agents" / "skills" for parent in (
        PROJECT_ROOT,
        *PROJECT_ROOT.parents,
    ))
    home = (
        Path.home() / ".agents" / "skills",
        Path.home() / ".codex" / "skills",
    )
    return workspace + home


def skill_file(directory_name: str) -> Path:
    """Resolve one installed skill entrypoint from configured and known roots."""
    roots = tuple(dict.fromkeys(_configured_roots() + _discovered_roots()))
    candidates = tuple(root / directory_name / "SKILL.md" for root in roots)
    return next((candidate for candidate in candidates if candidate.is_file()), candidates[0])
