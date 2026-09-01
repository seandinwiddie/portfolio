# Portfolio production systems-console playtest

Target: https://portfolio.sdin.dev/

Test the deployed production application through ordinary visible controls.
Do not inspect or mutate Redux state, storage, source code, hidden APIs, or the
DOM to manufacture state. DOM measurement is allowed only to verify rendered
layout, accessibility, and overflow. Capture console errors and failed network
requests from first load onward.

Use `PASS`, `FAIL`, `BLOCKED`, or `INVALID` exactly. A claim passes only when it
was directly observed in this run. A changed production bundle or contaminated
browser context makes affected coverage invalid.

This file is the living production contract. At the end of every run, compare
each expectation with the visible deployed interface and update this prompt for
new routes, controls, states, evidence needs, or wording that became stale or
ambiguous. Preserve the observed verdict, rerun any materially changed coverage,
and never weaken an expectation merely to turn a defect into a pass.

## Release identity

Record the UTC start/end time, root status, every first-party executable script
URL and SHA-256 hash, browser/version, OS, and both viewports. Recheck the same
script set without cache at the end; a changed set makes affected coverage
`INVALID`.

## Desktop systems-console coverage (1920x1080)

1. Open the root ingress and traverse every visible station: Nexus, Dossier,
   Missions, and Telemetry. Confirm navigation uses systems-console vocabulary,
   accurately marks the active station, and never strands the operator.
2. Confirm visible external controls open these exact destinations in a safe new
   tab: Forboc.ai -> `https://forboc.ai`; Lectures ->
   `https://seandinwiddie.github.io/lectures/`; Functional Programming Library
   -> `https://www.npmjs.com/package/functional-programming-composition`;
   seandinwiddie.com -> `https://seandinwiddie.com`; sdin.dev ->
   `https://sdin.dev`; seandinwiddie.github.io ->
   `https://seandinwiddie.github.io`; Registry Source ->
   `https://github.com/seandinwiddie/portfolio`; and API Source ->
   `https://github.com/seandinwiddie/api.sdin.dev`.
3. Confirm the ordinary production response renders API-backed presence,
   project, observatory, analytics, search, and status provenance honestly.
   Record current, stale, partial, empty, timed-out, and unavailable variants
   that are actually reached. Mark unobserved variants `BLOCKED`; do not inject
   faults, mutate state, or treat unit-test evidence as browser evidence.
4. Exercise Ayu Dark, Ayu Light, Ayu Mirage, Dracula, SynthWave '84, and Ruby
   Crystal exactly once, then return to the initial theme. For each,
   confirm the shell, panels, controls, typography, chart/signal colors, ambient
   field, focus treatment, and glow use a coherent theme palette. Include 84's
   stronger neon treatment and Ruby Crystal's deep-red crystalline treatment.
5. Exercise every static shell/route control plus one representative dynamic
   link from each rendered repository, commit, activity, theme-source, and
   install group; record visible/covered counts. Confirm pointer, keyboard focus,
   press, navigation, transition, and ambient-motion feedback remain functional.
   Repeated input must not trap focus, stack overlays, or impair navigation.
   Record audible SFX `BLOCKED` when the harness cannot capture audio; use the
   automated SFX checks as separate non-browser evidence.
6. Confirm the dashboard is meaningfully horizontal at desktop width without
   document-level horizontal overflow, clipped text, overlapping controls, or
   unreachable telemetry.

## iPhone SE coverage (320x568)

1. Repeat ingress and all four stations using only visible compact controls.
2. Confirm every rendered interactive border box is at least 44 by 44 CSS pixels,
   center-hit-testable, labels remain readable, focus is visible, and the active
   station is understandable without hover. Any exception is a `FAIL` and must
   identify the exact control.
3. Confirm ordinary vertical scrolling reaches every surfaced signal and action;
   there must be zero document-level horizontal overflow, panel collision,
   obscured fixed controls, or content hidden behind the shell. A contained
   contribution-calendar scroller may overflow only inside its own named region.
4. Exercise all six named themes and the same static/representative control scope
   at mobile width. Motion, glow, blur, and glass effects must remain responsive
   and must not erase content contrast or cause blocking layout shifts. Report
   audible SFX with the evidence limitation from desktop item 5.

## Evidence and report

Start a Browser Harness recording before navigation and retain the exact returned
directory. Save desktop and mobile full-page screenshots plus focused before/after
evidence for theme and route transitions. Report:

- release identity and final `PASS`/`FAIL`/`BLOCKED` result;
- one evidence row per numbered item above;
- exact reproduction steps for every defect;
- console/network findings, including `none` explicitly;
- coverage gaps and the reason each was not reached;
- prompt-maintenance corrections if the deployed visible contract changed.

Do not use vague conclusions such as “looks fine.”
