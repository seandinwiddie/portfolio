"""Functional-core surface check for the TypeScript FP dependency."""

from __future__ import annotations

import json
import re

from fp.findings import Finding
from fp.source_engine import PROJECT_ROOT, code_only
from fp.source_rules import FP_CORE_DEPENDENCIES, FP_CORE_SURFACE, TS_REQUIRED_FP_EXPORTS


FP_PACKAGE_NAME = "functional-programming-composition"


def ts_export_names(text: str) -> set[str]:
    # JSDoc can mention exports that do not exist in the declaration surface.
    code = code_only(text)
    names = set(
        re.findall(
            r"\bexport\s+(?:declare\s+)?(?:const|function|interface|type)\s+"
            r"([A-Za-z_$][A-Za-z0-9_$]*)",
            code,
        )
    )
    names.update(
        raw.strip().removeprefix("type ").split(" as ")[-1].strip()
        for block in re.findall(r"\bexport\s*\{([^}]+)\}", code, flags=re.DOTALL)
        for raw in block.split(",")
        if raw.strip()
    )
    return names


def missing_ts_surface_names(text: str) -> list[str]:
    exports = ts_export_names(text)
    return [name for name in TS_REQUIRED_FP_EXPORTS if name not in exports]


def runtime_dependency_names(text: str) -> list[str]:
    """Return dependencies that would make the functional core depend on a layer."""
    manifest = json.loads(text)
    dependency_fields = ("dependencies", "peerDependencies", "optionalDependencies")
    return sorted({
        name
        for field in dependency_fields
        for name in manifest.get(field, {})
    })


def manifest_depends_on_fp(text: str) -> bool:
    manifest = json.loads(text)
    fields = ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies")
    return any(FP_PACKAGE_NAME in manifest.get(field, {}) for field in fields)


def package_type_entry(text: str) -> str:
    manifest = json.loads(text)
    direct = manifest.get("types") or manifest.get("typings")
    if isinstance(direct, str):
        return direct
    export = manifest.get("exports", {}).get(".", {})

    def find_types(value) -> str | None:
        if isinstance(value, dict):
            candidate = value.get("types")
            if isinstance(candidate, str):
                return candidate
            return next((found for item in value.values() if (found := find_types(item))), None)
        return None

    return find_types(export) or "dist/index.d.ts"


def _fp_dependent_manifests() -> list:
    """Return the root app manifest only when it declares the FP dependency."""
    manifest = PROJECT_ROOT / "package.json"
    return [manifest] if (
        manifest.exists()
        and manifest_depends_on_fp(manifest.read_text(encoding="utf-8", errors="replace"))
    ) else []


def scan_fp_core_surface() -> list[Finding]:
    """Verify the depended-on FP package still exports the documented surface."""
    dependents = _fp_dependent_manifests()
    if not dependents:
        return []

    package_root = PROJECT_ROOT / "node_modules" / FP_PACKAGE_NAME
    manifest = package_root / "package.json"
    if not manifest.exists():
        return [Finding(
            dependents[0], 1, FP_CORE_SURFACE.id, FP_CORE_SURFACE.severity,
            f"{FP_PACKAGE_NAME} is a dependency but is not installed; "
            "install dependencies before the FP surface can be verified",
        )]

    manifest_text = manifest.read_text(encoding="utf-8")
    declaration = package_root / package_type_entry(manifest_text)
    dependencies = runtime_dependency_names(manifest_text)
    dependency_findings = [Finding(
        manifest, 1, FP_CORE_DEPENDENCIES.id, FP_CORE_DEPENDENCIES.severity,
        f"{FP_PACKAGE_NAME} declares runtime dependencies: {', '.join(dependencies)}",
    )] if dependencies else []

    if not declaration.exists():
        return [*dependency_findings, Finding(
            manifest, 1, FP_CORE_SURFACE.id, FP_CORE_SURFACE.severity,
            f"{FP_PACKAGE_NAME} type entry does not exist: {declaration}",
        )]

    missing = missing_ts_surface_names(declaration.read_text(encoding="utf-8", errors="replace"))
    if missing:
        return [*dependency_findings, Finding(
            declaration, 1, FP_CORE_SURFACE.id, FP_CORE_SURFACE.severity,
            f"{FP_PACKAGE_NAME} missing documented FP exports: {', '.join(missing)}",
        )]
    return dependency_findings
