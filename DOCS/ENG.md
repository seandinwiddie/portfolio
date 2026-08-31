# sdin.dev — Engineering and Quality Contract

**Canonical product and release specification**
**Systems:** `portfolio.sdin.dev` and `api.sdin.dev`

This is the forward-facing engineering authority for the portfolio. It defines
the experience to preserve, the architecture to extend, and the checks a future
release must pass.

## Product contract

sdin.dev is a responsive Expo/Tamagui portfolio presented as an original
**Orbital Registry**. It combines authored portfolio content with live GitHub
records and exposes the system's real data state rather than masking failure
with client-bundled content.

| Route | Visitor outcome |
| :---- | :---- |
| `/` | Enter the registry, read its live feed state, use the primary calls to action, scan the phone QR, and explore theme-aware signal/plate visuals when data is available. |
| `/home` | Open Sean Dinwiddie's web presences and portfolio destinations with correct link behavior. |
| `/about` | Read API-authored portfolio features and application procedures. |
| `/projects` | Explore live repositories, owners, languages, contributions, recent activity, and commits without internal API error codes leaking into copy. |
| `/status` | Inspect honest application/API availability, cache provenance, partial resources, selected theme, and effects mode. |
| Any unknown route | Remain inside the application shell, receive a meaningful not-found title/message, and have a keyboard-operable path home. |

Global controls must remain available without obscuring content:

* switch among Ayu Dark, Ayu Light, Ayu Mirage, Dracula, and SynthWave '84;
* import, update, export, and leave a custom CSS theme without leaking resources;
* choose persisted **Cinematic** or **Quiet** effects;
* open Archive Control, run its supported data/theme commands, close it with a
  visible button or Escape, and resume where focus began; and
* navigate through real links with normal browser history, new-tab, copy-link,
  and keyboard semantics.

## Runtime data authority

The portfolio adopts therapy-11's ownership grammar but not its local-data
model. **All authored portfolio values and live records used at runtime come
from `api.sdin.dev`.** A client `data/` directory, imported JSON, or a bundled
content fallback must never become a second authority.

### API contracts

* `/data` supplies authored content and the ambient-scene ECS world.
* `/github` supplies profile, repository, language, contribution, and activity
  records.
* `/github/commits` supplies commit records.
* `/status`, `/brandName`, and `/description` expose focused service contracts.
* RTK Query owns the client document cache and is the only UI-facing network
  authority.

When the service is unavailable, views render an honest loading, omission,
partial, stale, or error state. They do not silently substitute authored local
records. Server-side stale cache remains allowed because it is network-derived,
bounded, and reports provenance/partial availability; it is not a bundled
client fallback.

### Enforced boundary

The API-data-authority gate must reject:

1. runtime imports from local authored-data paths;
2. every non-test `src/**/*.json` file, including an unimported file;
3. direct `fetch` or Axios usage outside
   `src/features/systems/platform/foundation/api/*Api` and `*Adapters`; and
4. an RTK Query `createApi` root outside the system API boundary.

The Redux conformance suite includes this contract, so it cannot pass while an
alternate runtime authority exists. `src/data/initialState.json` must remain
absent.

Type-only contracts and canonical presentation theme profiles are allowed: they
describe how remote data is interpreted and displayed, not the portfolio
records themselves. A local file named `Types` or `Schemas` cannot launder a
runtime value through this boundary. Theme/effects persistence is visitor-owned
preference state and is also allowed.

The API must bound upstream requests, coalesce concurrent work, retain cache
provenance, serve stale network-derived data when safe, report partial-resource
availability, and return a structured `no-store` `/status` response. Every
release must rerun the API suite on the final tree.

## Architecture contract

The cross-platform client uses React Native and Expo with TypeScript, Tamagui,
Redux Toolkit/RTK Query, and React-Redux. Those tools serve the ownership model;
they do not replace it.

The source tree follows the components/entities/systems/views engineering model
used by therapy-11:

* `src/features/components/` owns serializable component and API data shapes.
* `src/features/entities/` owns events, reducer state, adapters, and selectors.
* `src/features/systems/` owns pure projections, orchestration thunks, listener
  effects, and the RTK Query boundary.
* `src/views/` owns all React presentation. Every production `.tsx` file must
  live under this tree.
* `src/app/*.ts` files are thin Expo Router exports, not UI or state owners.
* `src/store.ts` is the root Redux authority and composes RTK Query, listener,
  and diagnostics middleware.

The three feature buckets mirror the declared `portfolio`, `platform`, and
`shell` pillars in `scripts/concern-tree.mjs`. Pillars divide into named concern
branches before concrete domains, and every owned node stays at or below seven
direct subnodes. Direct `src/views/<route>/` directories remain the Expo Router
contract; reusable portfolio and shell views use the same bounded concern
branches beneath their presentation roots. The fan-out gate rejects off-tree
folders and unbounded nodes.

Reducers own event-driven state transitions, and the platform composition
reducers provide the feature-owned reducer map consumed by `src/store.ts`.
Selectors and dispatch tables form the functional core. RTK Query owns server
documents. Listener middleware owns reactive persistence and API-lifecycle
effects. Thunks and effect adapters live at system boundaries. Non-route views
receive prepared props and must not invent store or network authority.

The ambient scene is ECS data supplied by the API, projected by systems, and
rendered by views. JSX must not become the world-data source.

Diagnostics are Redux-owned, serializable, and bounded to the 30 newest observed
actions. The observation middleware must ignore its own diagnostics events, and
status projections must not create an unbounded action list or permanent hidden
DOM inspector.

## Theme and visualization authority

Every built-in theme is compared with its original upstream project, not with
the deployed portfolio or another local copy. Canonical raw values remain
distinct from application-derived accessibility, surface, and visualization
roles.

| Stored ID | Visitor-facing identity | Pinned canonical source | Representative audited values |
| :---- | :---- | :---- | :---- |
| `dark` | Ayu Dark | [Ayu Colors `e3f44fdf`](https://github.com/ayu-theme/ayu-colors/tree/e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c) | base/lift `#0D1017` / `#10141C`, constant `#D2A6FF`, selection `#3388FF40` |
| `light` | Ayu Light | [Ayu Colors `e3f44fdf`](https://github.com/ayu-theme/ayu-colors/tree/e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c) | base/lift `#F8F9FA` / `#FCFCFC`, constant `#A37ACC`, selection `#035BD626` |
| `mirage` | Ayu Mirage | [Ayu Colors `e3f44fdf`](https://github.com/ayu-theme/ayu-colors/tree/e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c) | foreground `#CCCAC2`, constant `#DFBFFF`, selection `#409FFF40` |
| `dracula` | Dracula | [Dracula specification `b1f9d352`](https://github.com/dracula/draculatheme.com/blob/b1f9d35242a1a7ac3e45f3ad34843ffab700f8d2/content/spec.mdx) | classic/current UI roles and selection `#44475A` |
| `neon` | SynthWave '84 | [SynthWave '84 `ecfa2fe1`](https://github.com/robb0wen/synthwave-vscode/blob/ecfa2fe1279f7233663fa3f98a96e6756000567b/themes/synthwave-color-theme.json) | tag `#72F1B8`, function `#36F9F6`, keyword `#FEDE5D`, constant `#F97E72`, selection `#FFFFFF20` |

`neon` remains a compatibility ID for stored visitor preferences; the interface
uses the canonical display name “SynthWave '84”.

The typed profile catalog is the single theme authority. CSS variables and
Tamagui objects are pure projections from it. A release must prove:

* exactly one palette-variable block per CSS theme;
* exact representative raw values and pinned source revisions;
* CSS/Tamagui projection parity after every theme switch;
* at least 4.5:1 contrast for normal body, muted, link, and semantic text;
* at least 3:1 contrast for focus and control boundaries;
* a designed light treatment with stronger boundaries and without dark-scene
  grain/star effects; and
* active custom CSS with one owned style boundary, followed by complete cleanup
  when leaving the custom theme.

### Contribution-calendar invariant

The contribution calendar must never own hard-coded GitHub green. Its pure
selector receives the active Redux theme's `ThemeVisualization`, applies the
five-step ramp to cells and legend, and uses `axisInk` for month/weekday labels.
Every built-in theme must have a visibly distinct ramp; custom CSS must project
the same roles through variables.

The five Monosnap captures from 21:26–21:27 on 30 August are comparison fixtures.
They demonstrate the unacceptable state in which one green ramp persists across
different active themes:

* `Snapshot 2026-08-30 21.26.482.png`
* `Snapshot 2026-08-30 21.27.09.png`
* `Snapshot 2026-08-30 21.27.15.png`
* `Snapshot 2026-08-30 21.27.22.png`
* `Snapshot 2026-08-30 21.27.30.png`

A render test must compare at least two active profiles and require different
SVG cell, legend, and axis fills. The deployed release must then be sampled in
all five built-in themes because a unit projection test cannot prove browser
repaint behavior.

## Visual and interaction system

The Orbital Registry is one original instrument system, not copied franchise
art. It may use a theme-aware star field, archive orbit, registry spine,
pilgrim transit, relay beacon, terminus horizon, survey monolith,
flight-recorder rows, route transitions, a signal trace, unit plate, and Archive
Control where those elements communicate state or provide interaction.

Visual novelty must remain functional and coherent:

* repository/contribution totals appear once in the most useful context rather
  than repeating across the telemetry rail, plate, and trace;
* trace labeling stays inside the Orbital Registry vocabulary and excludes an
  unrelated runic/FORBOC mark;
* reserve the permanent rail for feed state, active theme, and effects mode;
* retain clear hierarchy and readable labels instead of using low opacity as a
  substitute for hierarchy; and
* keep light mode intentionally architectural rather than treating it as the
  dark scene on white.

Cinematic mode can enable spatial movement and atmosphere. Quiet mode must keep
all content and functionality while reducing visual activity. The OS reduced
motion preference must independently disable or remove transit, beacon, route,
scan, sweep, ignition, and comparable motion. Forced-colors mode must remove
decorative layers that interfere with system colors.

## Accessibility and UX acceptance criteria

* Every interactive control uses native or equivalent semantics, an accessible
  name, visible focus, and a keyboard path.
* Brand and route destinations are real links. External destinations preserve
  new-tab behavior with `noopener noreferrer`.
* Archive Control opens from and returns focus to its trigger. Escape closes it
  from the auto-focused input. Submitting a command does not blur the input.
* Backtick typed in the command input remains text; the document shortcut must
  not hijack ordinary editing.
* Navigation and all route content have zero horizontal overflow at 375px and
  800px. The QR, plate, footer, theme control, and console remain reachable.
* Browser zoom is not locked. Landmarks, headings, status messages, and the
  not-found experience remain semantic.
* The phone QR retains a theme-independent high-contrast quiet zone, decodes to
  the destination named by its copy, and never implies a native install when no
  install URL exists.
* All text/focus contrast meets the theme criteria above. Translucent text must
  be evaluated after compositing against its real backdrop.
* Motion is never required to understand content or complete an action.

## Reliability and state acceptance criteria

* Unknown direct URLs resolve to the application 404 rather than the hosting
  provider's bare error page.
* Every route has exactly one meaningful title.
* Each route navigation pushes one history entry; Back returns to the prior
  route without an intermediate flash or rewrite.
* A valid built-in theme ID is present at every observed transition; the UI must
  never emit `theme-undefined`.
* Default and persisted built-in themes paint coherently before hydration; body,
  CSS variables, and the Tamagui provider do not expose a white or stale-theme
  frame.
* Built-in theme preference survives reload. A custom stylesheet may reset on a
  document load because its contents are not reducible to a stored mode name.
* Custom mode uses one stable human-facing and DOM identity; internal timestamps
  never appear in its label or class.
* Theme export uses the active profile's real values. One export creates one
  disposable download resource and revokes it.
* Service requests are bounded. `/projects` must leave loading within the
  eight-second client timeout and render plain-language failure copy.
* A fulfilled API response must project immediately; the landing feed must not
  remain in SYNC while already-fulfilled data waits in a mirrored local store.
* Degraded landing content omits unavailable data frames rather than rendering
  empty totals. `/status` must distinguish live, partial, stale, and unreachable.
* Activity grammar uses explicit known-event inflection, including `push` and
  `pushes`.
* Project records preserve API order/normalization, use real external-link
  semantics, omit unavailable panels cleanly, and never expose internal query
  error codes or fabricated placeholder descriptions.

## Focused release scenarios

Every candidate must satisfy these end-to-end scenarios in addition to the
automated contracts above:

| Scenario | Required proof |
| :---- | :---- |
| Theme repaint | Cycle every built-in theme across cards, body, nav, calendar, console, and dialogs; CSS and Tamagui computed colors must agree after every switch. |
| Theme transition integrity | Capture rapid class/provider transitions and require a valid theme ID at every observation. |
| Custom-theme lifecycle | Import real CSS, verify its values, export it once, and leave it; one owned style/download resource exists only for its intended lifetime. |
| Bounded project failure | Block `api.sdin.dev`; `/projects` must leave loading inside the eight-second client boundary and use plain-language copy. |
| Immediate feed projection | Correlate API completion with FEED LIVE, trace, and plate paint over repeated cold runs; fulfilled data must not wait in a mirrored client state. |
| Console keyboard flow | Use a physical keyboard to open the deck, run consecutive commands without refocusing, close from the focused input with Escape, and confirm focus returns to the trigger. |
| Contrast | Measure computed/composited label, value, focus, and control colors in every theme and both effects modes against the required ratios. |
| Responsive reach | At 375px and 800px, require zero horizontal overflow and reach the nav, QR, plate, footer, theme control, and console by ordinary scrolling. |
| Route semantics | Inspect served and hydrated titles, direct unknown-route handling, real links, normal new-tab behavior, and one history push per navigation. |
| Data degradation | Exercise live, cached, stale, partial, timed-out, and unreachable service states; unavailable frames are omitted and status stays truthful. |
| Activity grammar | Render zero, one, and multiple events for every supported kind and verify its explicit singular/plural label. |
| Calendar projection | Capture every built-in theme plus a custom theme and require cells, legend, and axis ink to follow the selected visualization roles. |

## Open product decision

`/home` is currently specified as a focused link hub, while `/about` owns the
feature and procedure detail. Decide explicitly whether `/home` should remain
focused or duplicate that content. Until the decision changes this contract,
do not add or remove the duplicated material implicitly.

## Automated release gates

The settled tree must pass application tests, type analysis, formatting/lint,
functional-core conformance, Redux/RTK and API-authority conformance, ECS
topology, feature-file contracts, static export, whitespace validation, and a
refreshed/diagnosed code graph. Production React source must remain inside the
view boundary, production JSON data must remain absent, and the exported
application 404 must exist.

[SCRIPTS.md](./SCRIPTS.md) is the command and script authority: it lists the
exact setup, development, validation, export, Graphify, and maintenance commands plus
their ownership and success conditions. Command detail belongs there rather
than in this engineering contract.

Do not record a green baseline before the final edit as release evidence. If a
gate reports architectural drift, fix the code or authored contract rather than
weakening the check or updating a documentation count.

## Browser release matrix

After deploying a candidate, verify:

1. all known routes plus direct unknown URLs;
2. every built-in theme, custom import/export/exit, reload persistence, and
   contribution-calendar ramp;
3. healthy, partial, stale, slow, timed-out, and unreachable API states;
4. first feed paint and repeated cold-load timing;
5. Archive Control with a physical keyboard and focus inspection;
6. 375px, 800px, and desktop layout, full vertical reach, and browser zoom;
7. normal, reduced-motion, Quiet, and forced-colors behavior;
8. computed/composited contrast for labels, values, focus, and controls;
9. client navigation/history with a survival sentinel; and
10. console, unhandled rejections, hydration signals, and failed resources.

### Method constraints to preserve

* If responsive testing uses sized iframes, label it as layout/media-query
  evidence rather than physical-device testing.
* Confirm an API block caused zero real service requests. Do not use a `srcdoc`
  setup that changes router location.
* Native file dialogs cannot be fully automated by assigning `input.files`;
  retain a manual custom-theme confirmation.
* Synthetic Backquote/Escape events do not replace a physical-keyboard pass.
* CSS/DOM inspection of reduced-motion selectors does not replace watching the
  experience with the OS preference enabled.
* A quiet production React console is evidence, not proof that no development-
  only hydration warning exists.
* GitHub repository counts, order, activity, and contribution totals drift; test
  consistency with the current API instead of pinning historic totals.
* Fork exclusion remains corroborated rather than independently proven until the
  API contract exposes the necessary flag or the server-side source is audited.

## Release boundary

The implementation may be called **locally verified** only after every automated
gate above passes on the final tree. It may be called **production verified**
only after the deployed browser matrix passes. Commit, push, deployment, and
production verification are separate actions and must be reported separately.

No local or deployed behavior is production-verified until its applicable gate
passes on that same candidate. The `/home` ownership decision remains explicit
and unresolved until this contract is deliberately revised.
