#!/usr/bin/env python3
"""Meta-test for the FP source guards.

Each case asserts a rule fires on a bad TypeScript snippet and stays silent on a
clean one, so a rule that silently stops matching is caught. This tests the
linters, not app source. Run it directly:

    python3 scripts/fp/fp_fixtures.py
"""

from __future__ import annotations

from pathlib import Path
import sys
import tempfile

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))
sys.path.insert(0, str(_HERE))

from fp import findings, skill_reviews, source_paths, source_rules, source_surface
from fp.structured_reviews import format_json_with_reviews, format_sarif_with_reviews


def main() -> int:
    failures: list[str] = []
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        if "nothing" not in source_surface.missing_ts_surface_names("export const just = () => undefined;\n"):
            failures.append("surface-ts: expected `nothing` to be reported missing")
        if source_surface.runtime_dependency_names('{"devDependencies":{"typescript":"latest"}}'):
            failures.append("core-dependencies-clean: dev-only tooling must not count as a runtime dependency")
        if source_surface.runtime_dependency_names('{"dependencies":{"react":"latest"}}') != ["react"]:
            failures.append("core-dependencies-bad: expected a declared runtime dependency to be reported")
        if source_surface.manifest_depends_on_fp('{"name":"functional-programming-composition"}'):
            failures.append("manifest-dependency: package name must not masquerade as a dependency")
        if not source_surface.manifest_depends_on_fp('{"devDependencies":{"functional-programming-composition":"latest"}}'):
            failures.append("manifest-dependency: actual dependency fields must be recognized")
        if source_surface.package_type_entry('{"exports":{".":{"import":{"types":"./types.d.ts"}}}}') != "./types.d.ts":
            failures.append("package-types: nested exports types entry must be resolved")
        blocking_output = findings.format_text([
            findings.Finding(
                root / "package.json",
                1,
                source_rules.FP_CORE_DEPENDENCIES.id,
                source_rules.FP_CORE_DEPENDENCIES.severity,
                "runtime dependency",
            ),
        ], root, "fixture")
        if "SKILL.md:" not in blocking_output or "Read the complete fp skill" not in blocking_output:
            failures.append("blocking-reference: finding must include exact skill guidance")
        if "Validation" not in skill_reviews.missing_advanced_surface_names("export const just = () => undefined;\n"):
            failures.append("advanced-surface: expected `Validation` to be reported missing")
        contextual = skill_reviews.wrapper_smells_for_text(
            root / "src" / "context.ts",
            """
            const validateForm = (value: Input): Either<Error, Output> => right(value);
            const parseConfig = (value: string): Maybe<Config> => nothing();
            const guarded = ematch(result, () => null, (value) => value);
            """,
        )
        contextual_text = "\n".join(notice.guidance for notice in contextual)
        if len(contextual) != 3 or "validateForm" not in contextual_text or "parseConfig" not in contextual_text or "erase a Left" not in contextual_text:
            failures.append("contextual-smells: expected Either, Maybe, and diagnostic-collapse smells")
        effects = skill_reviews.effect_smells_for_text(
            root / "src" / "audio.ts",
            "const seed = Math.random(); const id = setInterval(step, delay);",
        )
        if len(effects) != 2 or not all(notice.level == "SMELL" for notice in effects):
            failures.append("effect-smells: expected referenced edge-effect smells")
        mutations = skill_reviews.mutation_smells_for_text(
            root / "src" / "map.ts",
            "seen.add(id); rows.push(value);",
        )
        if len(mutations) != 2 or not all(notice.level == "SMELL" for notice in mutations):
            failures.append("mutation-smells: expected collection mutation smells")
        nullable = skill_reviews.nullish_reviews_for_text(
            root / "src" / "boundary.ts",
            "const missing = value === undefined;",
        )
        if len(nullable) != 1 or nullable[0].level != "REVIEW":
            failures.append("nullish-review: expected one contextual nullable review")
        review_output = "\n".join(skill_reviews.format_skill_review_notice(
            skill_reviews.REVIEW_CONTRACTS[0],
        ))
        if "[REVIEW]" not in review_output or "SKILL.md:" not in review_output or "Read the fp skill" not in review_output:
            failures.append("skill-review: notice must identify its level, exact skill reference, and review guidance")
        json_output = format_json_with_reviews(
            findings.format_json([], root),
            [skill_reviews.REVIEW_CONTRACTS[0]],
        )
        if '"reviewCount": 1' not in json_output or '"skillReference"' not in json_output or '"advice"' not in json_output:
            failures.append("structured-json-review: JSON must retain contextual disposition, references, and read-skill advice")
        sarif_output = format_sarif_with_reviews(
            findings.format_sarif([], root, "fixture"),
            [skill_reviews.REVIEW_CONTRACTS[0]],
        )
        if (
            '"FP-CONTEXT-REVIEW"' not in sarif_output
            or '"skillReference"' not in sarif_output
            or '"advice"' not in sarif_output
            or "requires agent judgment against the complete fp skill" not in sarif_output
            or "human" + " judgment" in sarif_output
        ):
            failures.append("structured-sarif-review: SARIF must retain contextual disposition, references, and read-skill advice")

        if source_paths.is_runtime_source(Path("src/features/systems/demo/__tests__/demo.test.ts")):
            failures.append("source-scope: test-only TypeScript must not be classified as runtime")
        if source_paths.is_runtime_source(Path("src/features/systems/demo/test/demoThunks.ts")):
            failures.append("source-scope: singular test directories must not be classified as runtime")
        if not source_paths.is_runtime_source(Path("src/features/systems/demo/demoAdapters.ts")):
            failures.append("source-scope: runtime TypeScript must remain in scope")

        source_root = root / "src"
        app_root = root / "app"
        source_paths.SOURCE_ROOT = source_root
        source_paths.PROJECT_ROOT = root
        source_root.mkdir(parents=True, exist_ok=True)
        app_root.mkdir(parents=True, exist_ok=True)
        discovered = set(source_paths.authored_source_roots())
        expected_roots = {source_root.resolve(), app_root.resolve()}
        if discovered != expected_roots:
            failures.append(f"source-roots: expected {sorted(expected_roots)}, got {sorted(discovered)}")

    total = 19
    if failures:
        print(f"FP fixtures FAILED: {len(failures)} case(s).")
        for failure in failures:
            print(f"  - {failure}")
        return 1
    print(f"FP fixtures passed: {total} checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
