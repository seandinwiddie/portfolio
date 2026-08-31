"""Contextual FP skill reviews that static analysis cannot decide honestly."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re

from fp.skill_paths import skill_file
from fp.source_engine import PROJECT_ROOT, code_only, rel
from fp.source_paths import authored_source_files, is_runtime_source
from fp.source_surface import FP_PACKAGE_NAME, package_type_entry, ts_export_names


SKILL_PATH = skill_file("fp")


@dataclass(frozen=True)
class ReviewNotice:
    level: str
    section: str
    lines: str
    guidance: str


REVIEW_CONTRACTS = (
    ReviewNotice(
        "REVIEW",
        "Core Patterns > Pick the weakest abstraction that solves the problem",
        "161-187",
        "Review whether each pipeline stops at Functor, Applicative, Monad, Monoid, Traversable, Lens, or Transducer instead of climbing higher than the problem requires.",
    ),
    ReviewNotice(
        "REVIEW",
        "Core Patterns > Applicative for independent validation, Monad for dependent steps",
        "189-212",
        "Review form, config, schema, and request validation for accumulating Validation/ap semantics; reserve Either/chain for genuinely dependent steps.",
    ),
    ReviewNotice(
        "REVIEW",
        "Common Mistakes > Collapsing every error into Nothing",
        "494-513",
        "Review whether Maybe represents expected absence only; retain a diagnostic with Either or Validation whenever a caller needs to know why work failed.",
    ),
    ReviewNotice(
        "REVIEW",
        "Core Patterns > Replace branches by data shape; Compose conditions as functions",
        "228-242,285-295",
        "Review branch shape and predicate intent: match for variants, a dispatch table for keys, multiMatch for predicates, and named predicate combinators instead of inline boolean routing.",
    ),
    ReviewNotice(
        "REVIEW",
        "Core Patterns > Replace loops with folds, and unbounded loops with a trampoline",
        "260-283,343-369,515-536",
        "Review recursive collection walkers as fold/traverse candidates and require Bounce plus the single core trampoline for work whose depth is unbounded.",
    ),
    ReviewNotice(
        "REVIEW",
        "Core Patterns > Compose with pipe/fold, and keep effects at the edges",
        "297-312",
        "Review grouping data, point-free clarity, curry/partial boundaries, repeated factory families, and effect placement; use tap only to declare an intentional edge effect.",
    ),
    ReviewNotice(
        "REVIEW",
        "Portability; Laws",
        "138-157,314-317,538-560",
        "This scan covers a TypeScript app only, so cross-language parity is not evaluated; review every maintained language port and require Functor, Applicative, Monad, or Monoid laws before treating a new primitive as shipped.",
    ),
)

ADVANCED_SURFACE_NAMES = (
    "Validation", "success", "failure", "ap", "liftA3",
    "concat", "empty", "sequence", "pipe", "partial",
    "both", "either", "allPass", "complement", "trampoline",
    "view", "set", "over", "transduce", "tap",
)

FUNCTION_RETURN_RE = re.compile(
    r"\b(?:export\s+)?const\s+"
    r"(?P<name>(?:validate|decode|parse|check)[A-Za-z0-9_$]*)\s*="
    r"[\s\S]{0,500}?\)\s*:\s*(?P<wrapper>Either|Maybe)\s*<",
)
EITHER_COLLAPSE_RE = re.compile(
    r"\bematch\s*\([\s\S]{0,500}?(?:=>\s*null\b|=>\s*fromNullable(?:<[^>]+>)?\(\s*null\s*\))",
)
EFFECT_RE = re.compile(
    r"\b(?:fetch|setTimeout|setInterval)\s*\(|"
    r"\b(?:Math\.random|Date\.now)\s*\(|"
    r"\b(?:console|localStorage|document|window)\.",
)
MUTATION_RE = re.compile(
    r"\.\s*(?:forEach|push|pop|shift|unshift|splice|sort|reverse|add|set|delete|clear)\s*\(",
)
NULLISH_RE = re.compile(
    r"\b(?:null|undefined)\b\s*(?:={2,3}|!={1,2})|"
    r"(?:={2,3}|!={1,2})\s*\b(?:null|undefined)\b",
)


def missing_advanced_surface_names(text: str) -> list[str]:
    exports = ts_export_names(text)
    return [name for name in ADVANCED_SURFACE_NAMES if name not in exports]


def _line(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def wrapper_smells_for_text(path: Path, text: str) -> list[ReviewNotice]:
    notices: list[ReviewNotice] = []
    code = code_only(text)
    for match in FUNCTION_RETURN_RE.finditer(code):
        wrapper = match.group("wrapper")
        name = match.group("name")
        section = (
            "Core Patterns > Applicative for independent validation, Monad for dependent steps"
            if wrapper == "Either"
            else "Common Mistakes > Collapsing every error into Nothing"
        )
        lines = "189-212,423-444" if wrapper == "Either" else "494-513"
        decision = (
            "confirm its checks are dependent; independent checks must accumulate with Validation/ap"
            if wrapper == "Either"
            else "confirm absence needs no diagnostic; otherwise return Either or Validation"
        )
        notices.append(ReviewNotice(
            "SMELL",
            section,
            lines,
            f"{rel(path)}:{_line(code, match.start())}: `{name}` returns {wrapper}; {decision}.",
        ))
    for match in EITHER_COLLAPSE_RE.finditer(code):
        notices.append(ReviewNotice(
            "SMELL",
            "Common Mistakes > Collapsing every error into Nothing",
            "494-513",
            f"{rel(path)}:{_line(code, match.start())}: ematch appears to erase a Left diagnostic into null/Nothing; verify this is an intentional guard boundary.",
        ))
    return notices


def effect_smells_for_text(path: Path, text: str) -> list[ReviewNotice]:
    code = code_only(text)
    return [
        ReviewNotice(
            "SMELL",
            "Core Patterns > Compose with pipe/fold, and keep effects at the edges",
            "297-312",
            f"{rel(path)}:{_line(code, match.start())}: effectful API `{match.group(0).strip()}` appears here; confirm this module is a declared edge and inject plain data/capabilities into the core.",
        )
        for match in EFFECT_RE.finditer(code)
    ]


def mutation_smells_for_text(path: Path, text: str) -> list[ReviewNotice]:
    code = code_only(text)
    return [
        ReviewNotice(
            "SMELL",
            "Core Patterns > Replace loops with folds, and unbounded loops with a trampoline",
            "260-283,515-536",
            f"{rel(path)}:{_line(code, match.start())}: void iteration or in-place collection operation `{match.group(0).strip()}` appears here; verify it does not mutate captured/input state and prefer a returned fold/traverse accumulator.",
        )
        for match in MUTATION_RE.finditer(code)
    ]


def nullish_reviews_for_text(path: Path, text: str) -> list[ReviewNotice]:
    code = code_only(text)
    return [
        ReviewNotice(
            "REVIEW",
            "Core Patterns > Chain a null-guarded pipeline instead of nested guards",
            "214-226,321-341,371-396",
            f"{rel(path)}:{_line(code, match.start())}: raw nullable comparison `{match.group(0).strip()}` appears here; confirm it is one serialization/lift boundary rather than scattered absence control.",
        )
        for match in NULLISH_RE.finditer(code)
    ]


def _wrapper_smells() -> list[ReviewNotice]:
    notices: list[ReviewNotice] = []
    for path in authored_source_files():
        if not is_runtime_source(path):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        notices.extend(wrapper_smells_for_text(path, text))
        notices.extend(effect_smells_for_text(path, text))
        notices.extend(mutation_smells_for_text(path, text))
        notices.extend(nullish_reviews_for_text(path, text))
    return notices


def _surface_smells() -> list[ReviewNotice]:
    package_root = PROJECT_ROOT / "node_modules" / FP_PACKAGE_NAME
    manifest = package_root / "package.json"
    if not manifest.exists():
        return []
    declaration = package_root / package_type_entry(
        manifest.read_text(encoding="utf-8", errors="replace"),
    )
    if not declaration.exists():
        return []
    missing = missing_advanced_surface_names(
        declaration.read_text(encoding="utf-8", errors="replace"),
    )
    return [ReviewNotice(
        "SMELL",
        "Core Patterns > Pick the weakest abstraction that solves the problem",
        "161-187",
        f"{FP_PACKAGE_NAME} lacks the skill's advanced composition frontier: {', '.join(missing)}; review before adding another one-off helper.",
    )] if missing else []


def collect_skill_review_notices() -> list[ReviewNotice]:
    return [*REVIEW_CONTRACTS, *_surface_smells(), *_wrapper_smells()]


def format_skill_review_notice(notice: ReviewNotice) -> list[str]:
    return [
        f"[{notice.level}] {notice.guidance}",
        f"  Skill: {SKILL_PATH}",
        f"  Skill section: FP > {notice.section}",
        f"  Skill reference: {SKILL_PATH}:{notice.lines}",
        f"  Canon reference: {SKILL_PATH}:31-45",
        "  Guidance: Read the fp skill for the contextual decision process.",
    ]
