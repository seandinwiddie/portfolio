"""Source discovery, tokenization, and fp-vocabulary helpers for FP guards."""

from __future__ import annotations

import os
from pathlib import Path


def path_from_env(name: str, fallback: Path) -> Path:
    value = os.environ.get(name)
    return Path(value).resolve() if value else fallback.resolve()


def first_existing(paths: tuple[Path, ...]) -> Path:
    return next((path for path in paths if path.exists()), paths[0])


SCRIPT_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = path_from_env("FP_PROJECT_ROOT", SCRIPT_ROOT.parent)
SOURCE_ROOT = path_from_env("FP_SOURCE_ROOT", PROJECT_ROOT / "src")
def rel(path: Path, root: Path = PROJECT_ROOT) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def code_only(text: str) -> str:
    """Blank comments and string/char literals while preserving offsets."""
    output: list[str] = []
    index = 0
    state = "code"
    quote = ""
    while index < len(text):
        char = text[index]
        following = text[index + 1] if index + 1 < len(text) else ""
        if state == "line_comment":
            output.append("\n" if char == "\n" else " ")
            state = "code" if char == "\n" else state
            index += 1
            continue
        if state == "block_comment":
            ending = char == "*" and following == "/"
            output.append("  " if ending else ("\n" if char == "\n" else " "))
            index += 2 if ending else 1
            state = "code" if ending else state
            continue
        if state in ("string", "char"):
            if char == "\\":
                output.append("  ")
                index += 2
                continue
            output.append("\n" if char == "\n" else " ")
            state = "code" if char == quote else state
            index += 1
            continue
        if char == "/" and following == "/":
            output.append("  ")
            state = "line_comment"
            index += 2
            continue
        if char == "/" and following == "*":
            output.append("  ")
            state = "block_comment"
            index += 2
            continue
        if char in ('"', "'"):
            output.append(" ")
            quote = char
            state = "string" if char == '"' else "char"
            index += 1
            continue
        output.append(char)
        index += 1
    return "".join(output)
