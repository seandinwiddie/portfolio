# Portfolio production systems-console playtest

Target: https://portfolio.sdin.dev/

Test the deployed production application through ordinary visible controls.
Do not inspect or mutate Redux state, storage, source code, hidden APIs, or the
DOM to manufacture state. Read-only DOM/computed-style inspection is allowed
only to verify rendered layout, accessibility, overflow, and activity CSS
variables against the observed `/data` response. Capture console errors and
failed network requests from first load onward.

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
   accurately marks the active station, and never strands the operator. Confirm
   the registry identity control returns to ingress. The visible shell must not
   expose the retired `/home` route, generic Home/Welcome/Page navigation, or an
   `FX CINEMATIC` status badge; effects themselves remain active.
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
   Within the observatory, require exactly six deterministic `estate-*`
   sections matching the six Open Signal Channel destinations. Confirm every
   estate exposes its API-supplied URL, selected observation period, observed
   timestamp, presence state, HTTP result, latency, and machine-readable
   presence/analytics/search status. Require real Google metric tiles,
   prior-period direction, and traces only for explicitly instrumented estates;
   the other estates must visibly report `not-instrumented` without synthetic
   zero metrics. Require compact `public-source` repository controls only where
   the API estate supplies repository attribution; confirm no inferred
   repository controls appear for estates with an empty attribution array.
   Confirm the visible API Source provenance link remains available.
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
   In the desktop appearance matrix, confirm the API-authored Sound control
   announces its current state and the action it will perform. Disable sound,
   exercise representative pointer/press/route activity, and require every
   visual light sweep and signal pulse to remain present. Re-enable sound before
   continuing. Reload once after a visible toggle and confirm the selected state
   restores without inspecting storage. Record audible SFX `BLOCKED` when the
   harness cannot capture audio; use the automated SFX checks as separate
   non-browser evidence.
6. Capture visible `query-sync`, `query-resolve`, `route-transit`, and
   `query-fault` instrument pulses when those real lifecycle states occur; mark
   a naturally unreached state `BLOCKED` rather than manufacturing it. Across
   all six themes, correlate duration, intensity, geometry, and travel CSS
   variables with the observed API activity components, and require
   theme-coherent color with zero overflow or layout shift. Verify silence
   before an allowed press gesture, silence while the visible Sound control is
   disabled, and attempt enabled audio evidence only after a press gesture; use
   `BLOCKED` when the harness cannot capture sound.
7. Confirm the dashboard is meaningfully horizontal at desktop width without
   document-level horizontal overflow, clipped text, overlapping controls, or
   unreachable telemetry.

## iPhone SE coverage (320x568)

1. Repeat ingress and all four stations using only visible compact controls.
2. Confirm every rendered interactive border box is at least 44 by 44 CSS pixels,
   center-hit-testable, labels remain readable, focus is visible, and the active
   station is understandable without hover. The compact route dock must remain
   above the utility rail at the bottom of the viewport and must never overlap
   the top identity/appearance row. Require `clientWidth >= scrollWidth` for
   every compact dock label. The fixed Archive control must have zero geometric
   overlap with the route dock. Any exception is a `FAIL` and must identify the
   exact control. Audit the focus-only skip control by keyboard after it is
   revealed: its computed stack must be above the compact navigation and its
   center must hit itself. Do not treat its intentionally hidden resting
   position as a failed pointer target.
3. Confirm ordinary vertical scrolling reaches every surfaced signal and action;
   there must be zero document-level horizontal overflow, panel collision,
   obscured fixed controls, or content hidden behind the shell. During ordinary
   scroll traversal, center-hit-test each route control and require the Archive
   control never intercept it. Require document, bridge, main, screen, and canvas
   `scrollWidth` to remain at or below the 320px viewport. A contained
   contribution-calendar scroller may overflow only inside its own named region.
   Clipped `aria-hidden` ambient geometry is not document overflow; record it
   only if it enlarges a document or route scroll container.
4. Exercise all six named themes and the same static/representative control scope
   at mobile width. Motion, glow, blur, and glass effects must remain responsive
   and must not erase content contrast or cause blocking layout shifts. Repeat
   the route pulse and any naturally occurring query pulses, requiring zero
   overflow or shell displacement. Open the appearance drawer, require the same
   API-authored Sound state/action labels and a 44x44 target, then repeat the
   disable/visual-continuity/re-enable path without the drawer or control
   exceeding 320px. Report audible SFX with the gesture and evidence limitations
   from desktop items 5 and 6.

## Agent and crawler discovery

This section is the narrow exception to the ordinary-control-only rule: navigate
directly to the listed public discovery resources, but do not call undocumented
endpoints, mutate data, bypass rate limits, or inspect private security findings.

1. In both the initial HTML response and the hydrated DOM for ingress, Nexus,
   Dossier, Missions, and Telemetry, require one self-referential canonical URL
   matching the visible route, one stable `sdin:route-id` named
   `portfolio:<station>`, the current `sdin:manifest-schema`, one
   `application/json` alternate link to the API agent manifest, and parseable
   `WebPage` JSON-LD whose name and description match the API-backed document
   metadata. On a genuinely missing coordinate, require
   `portfolio:lost-signal`, `noindex,follow`, no canonical, and no JSON-LD. Confirm
   these identities remain unchanged at desktop and iPhone SE widths.
2. Open `/robots.txt`, `/sitemap.xml`, and `/llms.txt` and require successful
   text/XML responses. Robots must allow the public interface and advertise the
   canonical sitemap. The sitemap must contain exactly the five canonical
   interface routes and exclude 404, lost-signal, Expo-internal, preview, and
   query-string variants. `llms.txt` must identify the same routes, schema version,
   provenance authority, HTTPS discovery links, and public read-only resources as
   the current API manifest; stale or locally invented business copy is a `FAIL`.
3. Open `https://api.sdin.dev/agent-manifest` and require JSON with a semantic
   version, stable resource IDs, HTTPS links for `self`, `portfolio`,
   `authoritative-data`, `documentation`, and `source`, explicit public read-only
   access semantics, provenance back to `/data`, and advertised rate-limit
   headers. Confirm the generated discovery files expose no credentials, raw scan
   evidence, private findings, arbitrary scan targets, or mutation instructions.

## Evidence and report

Start a Browser Harness recording before navigation and retain the exact returned
directory. Save desktop and mobile full-page screenshots plus focused before/after
evidence for theme and route transitions. Because each `.system-screen` owns its
vertical scroll independently of the fixed document, capture top and bottom
screenshots for every station at both viewports; a document-level full-page image
does not substitute for those scroll-container endpoints. Report:

- release identity and final `PASS`/`FAIL`/`BLOCKED` result;
- one evidence row per numbered item above;
- exact reproduction steps for every defect;
- console/network findings, including `none` explicitly;
- coverage gaps and the reason each was not reached;
- prompt-maintenance corrections if the deployed visible contract changed.

Do not use vague conclusions such as “looks fine.”
