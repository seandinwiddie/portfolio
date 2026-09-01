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
| `/` (Ingress) | Enter the registry, read its live feed state, use the primary calls to action, scan the phone QR, and explore theme-aware signal/plate visuals when data is available. |
| `/nexus` | Monitor public aggregate reach, discovery, GitHub impact, channel presence, and registry destinations with honest provenance and correct link behavior. |
| `/dossier` | Read API-authored registry capabilities and operating protocols. |
| `/missions` | Explore live repositories, custodians, dialects, contributions, recent activity, and commits without internal API error codes leaking into copy. |
| `/telemetry` | Inspect honest application/API availability, cache provenance, partial resources, selected theme, and runtime state. |
| Any unknown route (Lost Signal) | Remain inside the application bridge, receive a meaningful lost-signal title/message, and have a keyboard-operable path to Ingress. |

Global controls must remain available without obscuring content:

* switch among Ayu Dark, Ayu Light, Ayu Mirage, Dracula, SynthWave '84, and
  Ruby Crystal;
* import, update, export, and leave a custom CSS theme without leaking resources;
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
* `/observatory` supplies fixed-channel public aggregate Analytics and Search
  Console periods, direction, bounded daily trends, and availability.
* `/presence` supplies bounded API-authored channel reachability, latency, and
  check provenance.
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
   `src/features/systems/substrate/kernel/api/*Api` and `*Adapters`; and
4. an RTK Query `createApi` root outside the system API boundary; and
5. locally authored ingress, nexus, lost-signal, utility-rail, or identity-bearing
   signal-metadata copy and destinations in their governed runtime presentation
   paths.

The checker always discovers and scans the entire production `src` tree; a
caller cannot narrow it to a convenient subdirectory. Tests are the only
fixture exemption. The Redux conformance suite includes this contract, so it
cannot pass while an alternate runtime authority exists.
`src/data/initialState.json` must remain absent.

Type-only contracts and canonical presentation theme profiles are allowed: they
describe how remote data is interpreted and displayed, not the portfolio
records themselves. A local file named `Types` or `Schemas` cannot launder a
runtime value through this boundary. Theme persistence is visitor-owned
preference state and is also allowed.

Selector-owned neutral product labels, route names, service-state messages, and
static-export metadata are structural interface semantics and are allowed. They
must not embed personal identity, portfolio claims, or external destinations;
the API presentation replaces them with authored metadata after hydration.

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

The three feature buckets mirror the declared `registry`, `substrate`, and
`bridge` pillars in `scripts/concern-tree.mjs`. Pillars divide into named concern
branches before concrete domains, and every owned node stays at or below seven
direct subnodes. Direct `src/views/<route>/` directories remain the Expo Router
contract; reusable registry and bridge views use the same bounded concern
branches beneath their presentation roots. The fan-out gate rejects off-tree
folders and unbounded nodes.

Reducers own event-driven state transitions, and the substrate composition
reducers provide the feature-owned reducer map consumed by `src/store.ts`.
Selectors and dispatch tables form the functional core. RTK Query owns server
documents. Listener middleware owns reactive persistence and API-lifecycle
effects. Thunks and effect adapters live at system boundaries. Non-route views
receive prepared props and must not invent store or network authority.

The ambient scene is ECS data supplied by the API, projected by systems, and
rendered by views. JSX must not become the world-data source.

Signal activity extends that world with API-authored visual and acoustic
component tables. RTK Query pending, fulfilled, and rejected lifecycles plus
resolved route transitions dispatch semantic events into a small serializable
`activeId`/`sequence` slice. Pure FP selectors join that ephemeral identity to
the API ECS tables; the ambient view remounts one bounded instrument pulse, and
listener middleware schedules its low-gain cue through the press-armed Web Audio
bus with at most two concurrent voices and deterministic node cleanup. The flow
stays `event -> reducer -> selector -> view/listener -> adapter`:
no interval fabricates activity, no server document is copied into a client
slice, and absent API configuration produces no invented local fallback.

Diagnostics are Redux-owned, serializable, and bounded to the 30 newest observed
actions. The observation middleware must ignore its own diagnostics events, and
status projections must not create an unbounded action list or permanent hidden
DOM inspector.

## Functional-core and RTK contract

The portfolio is an extensive production consumer of
`functional-programming-composition`, not a token dependency. Maybe
(`fromNullable`/`match`) projects optional API documents and metrics; Either
(`ebind`/`ematch`) owns custom-theme parse/application failure; `multiMatch`,
`orElse`, and `_` own command, diagnostics, provenance, and mission-state
dispatch; and small composed selectors own all derived view models. These
constructs keep reducers deterministic, remove nested branch ladders, and make
error/provenance behavior independently testable.

Use the weakest lawful abstraction, curry before adding data arguments, keep
functions at two data arguments or fewer, and keep effects outside selectors.
Redux reducers remain the event authority, listener middleware owns reactive
effects, RTK Query owns server documents, and views receive projections. The
TypeScript lectures link outward to pinned portfolio/API source examples at
beginner, intermediate, and advanced levels; no reciprocal curriculum links or
teaching concern enters runtime UI architecture.

## Public observatory contract

Nexus includes a public systems observatory for web presence, impact, and
influence. Four independent RTK Query documents—authored presentation,
observatory aggregates, presence observations, and GitHub summary—compose one
view without mirroring server data into feature slices. Observatory and
presence signals refetch every 60 seconds only while focused. The layout owns
one focus-gated GitHub refresh clock aligned to the API's ten-minute resource
TTL; every route reuses that document. All live documents reconnect on
focus/network return.

The observatory must:

* show current and prior 28-day aggregate periods, absolute/percentage
  direction, realtime active users when available, and bounded daily traces;
* treat measured zero as a real baseline and never invent a percentage from a
  zero prior value;
* keep `available`, `partial`, `unconfigured`, `unavailable`, `cached`, and
  `stale` semantics visible and distinct;
* label RTK-retained data as stale when a later transport request fails instead
  of calling visible metrics unavailable;
* bound daily points to 28, public channels to seven, activity/language arrays
  to seven, owners to five, and repositories per owner to seven before DOM
  projection; and
* exclude visitor identities, raw searches, path-level records, countries,
  Google property identifiers, OAuth material, and upstream diagnostics.

The API is the privacy and source authority; the client neither possesses nor
requests excluded dimensions. Charts and growth labels must be theme-aware,
keyboard/zoom readable, and truthful when values are small.

## Theme and visualization authority

Every canonical built-in theme is compared with its original upstream project,
not with the deployed portfolio or another local copy. Original portfolio
themes cite their visual-research dossier while keeping every palette value and
product-facing identity independently authored. Raw values remain distinct from
application-derived accessibility, surface, and visualization roles.

| Stored ID | Visitor-facing identity | Audited source | Representative audited values |
| :---- | :---- | :---- | :---- |
| `dark` | Ayu Dark | [Ayu Colors `e3f44fdf`](https://github.com/ayu-theme/ayu-colors/tree/e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c) | base/lift `#0D1017` / `#10141C`, constant `#D2A6FF`, selection `#3388FF40` |
| `light` | Ayu Light | [Ayu Colors `e3f44fdf`](https://github.com/ayu-theme/ayu-colors/tree/e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c) | base/lift `#F8F9FA` / `#FCFCFC`, constant `#A37ACC`, selection `#035BD626` |
| `mirage` | Ayu Mirage | [Ayu Colors `e3f44fdf`](https://github.com/ayu-theme/ayu-colors/tree/e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c) | foreground `#CCCAC2`, constant `#DFBFFF`, selection `#409FFF40` |
| `dracula` | Dracula | [Dracula specification `ac4c351c`](https://github.com/dracula/draculatheme.com/blob/ac4c351c763aeca2cc093b8ae77a6c3160bb1125/content/spec.mdx) | classic/current UI roles and selection `#44475A` |
| `neon` | SynthWave '84 | [SynthWave '84 `ecfa2fe1`](https://github.com/robb0wen/synthwave-vscode/blob/ecfa2fe1279f7233663fa3f98a96e6756000567b/themes/synthwave-color-theme.json) | tag `#72F1B8`, function `#36F9F6`, keyword `#FEDE5D`, constant `#F97E72`, selection `#FFFFFF20` |
| `ruby` | Ruby Crystal | [practical on-screen graphics visual research](https://forresthogg.com/projects/alien-romulus-gfx) | original oxblood base/surface `#090507` / `#14080D`, ruby emission `#FF335F`, crystal highlight `#FF9AAE` |

`neon` remains a compatibility ID for stored visitor preferences; the interface
uses the canonical display name “SynthWave '84”.

The typed profile catalog is the single theme authority. CSS variables and
Tamagui objects are pure projections from it. A release must prove:

* exactly one palette-variable block per CSS theme;
* exact representative raw values and pinned source revisions;
* CSS/Tamagui projection parity after every theme switch;
* at least 4.5:1 contrast for normal body, muted, link, and semantic text;
* at least 3:1 contrast for focus and control boundaries;
* a designed light architectural treatment with stronger boundaries and
  visible theme-appropriate grain/star layers; and
* active custom CSS with one owned style boundary, RTK-stored appearance
  derived from the validated custom palette, and complete cleanup when leaving
  the custom theme.

### Contribution-calendar invariant

The contribution calendar must never own hard-coded GitHub green. Its pure
selector receives the active Redux theme's `ThemeVisualization`, applies the
five-step ramp to cells and legend, and uses `axisInk` for month/weekday labels.
Every built-in theme must have a visibly distinct ramp; custom CSS must project
the same roles through variables.

The five Monosnap captures are permanent regression fixtures. A candidate must
fail theme acceptance if it reproduces their theme-invariant green ramp:

* `Snapshot 2026-08-30 21.26.482.png`
* `Snapshot 2026-08-30 21.27.09.png`
* `Snapshot 2026-08-30 21.27.15.png`
* `Snapshot 2026-08-30 21.27.22.png`
* `Snapshot 2026-08-30 21.27.30.png`

A render test must compare at least two active profiles and require different
SVG cell, legend, and axis fills. The deployed release must then be sampled in
all six built-in themes because a unit projection test cannot prove browser
repaint behavior.

## Visual and interaction system

The Orbital Registry is an original **Mission Operations Bridge**, not copied
franchise art. At desktop widths it is a viewport-scale application: a
persistent command rail, live telemetry header, independently scrollable
12-column operations canvas, and lower utility rail. Dossier, Missions, and Telemetry
compose their modules horizontally across that canvas instead of serializing
every instrument into one narrow article column.

At compact widths the bridge recomposes rather than shrinks. A top identity bar,
persistent four-destination dock, single-column workspace, compact telemetry,
and safe-area-aware overlays keep the same system understandable at 320x568,
375x667, and 568x320. The whole document must never scroll sideways; the
contribution calendar is the sole intentional local horizontal scroller.

Primary navigation language remains immediately understandable: Ingress,
Nexus, Dossier, Missions, Telemetry, and Lost Signal. Command, Field Record,
Operations, and Uplink act as secondary atmosphere, never as a decoding requirement. The bridge can use
a theme-aware star field, archive orbit, registry spine, pilgrim transit, relay
beacon, terminus horizon, survey monolith, architectural lens, flight-recorder
rows, lateral route transitions, signal trace, unit plate, and Archive Control
where those elements communicate real state or provide interaction.

The interaction model follows the functional clarity of [NASA Open
MCT](https://github.com/nasa/openmct), the mission context and environmental
integration visible in Territory Studio's
[Foundation](https://territorystudio.com/project/foundation/) and
[Prometheus](https://territorystudio.com/project/prometheus/) work, and WCAG's
[reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) requirement.
These are design principles, not visual assets or templates: franchise names,
marks, typefaces, terminology, and one-to-one screen recreations remain outside
the product.

Visual novelty must remain functional and coherent:

* repository/contribution totals appear once in the most useful context rather
  than repeating across the telemetry rail, plate, and trace;
* trace labeling stays inside the Orbital Registry vocabulary and excludes an
  unrelated runic/FORBOC mark;
* reserve the permanent rail for feed state and active theme;
* retain clear hierarchy and readable labels instead of using low opacity as a
  substitute for hierarchy; and
* keep light mode intentionally architectural rather than treating it as the
  dark scene on white.

Spatial movement and atmosphere remain part of the authored interface rather
than an optional registry mode. The OS reduced-motion preference must
independently disable or remove transit, beacon, route, scan, sweep, ignition,
and comparable motion. Forced-colors mode must remove decorative layers that
interfere with system colors.

### Button feedback

Every native button, button-role link, and interactive control crosses one
delegated `buttonFx` boundary. Hover and press emit separate serializable RTK
events with a stable interaction identity. A pure selector derives a short,
deterministic, theme-aware science-fiction cue; the Web Audio adapter is the
only imperative synthesis boundary. Hover never attempts to unlock browser
audio, while an intentional press may resume a suspended context before
playing. Unsupported runtimes remain silent without changing the original
control action.

The cue family also carries an original, quiet mechanical transient beneath the
theme voice: a brief relay-like acknowledgement on hover and a stronger,
slightly longer servo-like engagement on press. The family is derived as data
by the same selector, so related controls remain coherent while every command
state is immediately distinguishable. This takes only interaction principles
from Blizzard's official [sound
retrospective](https://news.blizzard.com/en-gb/article/20722027/the-sounds-of-koprulu)
and [interface
post](https://news.blizzard.com/en-gb/article/19911221/new-user-interface-coming-to-starcraft-ii):
evolve related cue sets together, preserve recognizable command feedback, keep
important information persistent, and expose adjacent detail without
unnecessary surface changes. No franchise sound, name, visual asset, or sample
enters the product.

The same controls receive a theme-aware light sweep, focus treatment, and
short press compression. No in-app Quiet, mute, FX-off, or persisted effects
mode exists. Button feedback follows the explicit event -> listener -> adapter
shape established by Therapy 11 without importing its game data or creating a
second registry data authority.

## Accessibility and UX acceptance criteria

* Every interactive control uses native or equivalent semantics, an accessible
  name, visible focus, and a keyboard path.
* Brand and route destinations are real links. External destinations preserve
  new-tab behavior with `noopener noreferrer`.
* Archive Control opens from and returns focus to its trigger. Escape closes it
  from the auto-focused input. Submitting a command does not blur the input.
* Backtick typed in the command input remains text; the document shortcut must
  not hijack ordinary editing.
* Navigation and all route content have zero horizontal overflow at 320px,
  375px, 568px landscape, 800px, 1024px, and desktop widths. The QR, plate,
  utility rail, theme control, dock, and console remain reachable.
* Primary touch controls expose at least a 44x44 CSS-pixel target. Dock and
  overlay placement include `env(safe-area-inset-*)` without obscuring final
  scroll content.
* A keyboard-visible skip link reaches the workspace. Client route changes
  announce the new workspace and move focus without stealing it on first load.
* Browser zoom is not locked. Landmarks, headings, status messages, and the
  Lost Signal experience remain semantic.
* The phone QR retains a theme-independent high-contrast quiet zone, decodes to
  the destination named by its copy, and never implies a native install when no
  install URL exists.
* All text/focus contrast meets the theme criteria above. Translucent text must
  be evaluated after compositing against its real backdrop.
* Motion is never required to understand content or complete an action.

## Reliability and state acceptance criteria

* Unknown direct URLs resolve to the application 404 rather than the hosting
  provider's bare error response.
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
  disposable download anchor and removes it after the transfer starts.
* Service requests are bounded. `/missions` must leave loading within the
  eight-second client timeout and render plain-language failure copy.
* A fulfilled API response must project immediately; the ingress feed must not
  remain in SYNC while already-fulfilled data waits in a mirrored local store.
* Degraded ingress content omits unavailable data frames rather than rendering
  empty totals. `/status` must distinguish live, partial, stale, and unreachable.
* Activity grammar uses explicit known-event inflection, including `push` and
  `pushes`.
* Mission records preserve API order/normalization, use real external-link
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
| Bounded mission failure | Block `api.sdin.dev`; `/missions` must leave loading inside the eight-second client boundary and use plain-language copy. |
| Immediate feed projection | Correlate API completion with FEED LIVE, trace, and plate paint over repeated cold runs; fulfilled data must not wait in a mirrored client state. |
| Console keyboard flow | Use a physical keyboard to open the deck, run consecutive commands without refocusing, close from the focused input with Escape, and confirm focus returns to the trigger. |
| Button feedback | Hover and press representative buttons in every theme; require distinct deterministic RTK cue identities, no hover-time audio unlock, one press acknowledgement, original control behavior, and a silent safe path when Web Audio is unavailable. |
| Signal activity | Correlate route transitions and RTK Query pending/fulfilled/rejected actions with the matching API-authored pulse and low-gain cue; audio remains silent before the first permitted visitor gesture, and reduced-motion/forced-color modes retain a bounded response instead of disabling the layer. |
| Contrast | Measure computed/composited label, value, focus, and control colors in every theme against the required ratios. |
| Responsive reach | At 320x568, 375x667, 568x320, 800px, 1024px, and desktop widths, require zero document overflow and reach the nav, dock, QR, plate, utility rail, theme control, and console by ordinary scrolling. |
| Route semantics | Inspect served and hydrated titles, direct unknown-route handling, real links, normal new-tab behavior, and one history push per navigation. |
| Data degradation | Exercise live, cached, stale, partial, timed-out, and unreachable service states; unavailable frames are omitted and status stays truthful. |
| Observatory privacy and growth | Exercise positive, negative, flat, zero-prior, unconfigured, partial, retained-stale, and unavailable public aggregates; require bounded traces and prove excluded raw dimensions never enter the DOM or serialized client state. |
| Activity grammar | Render zero, one, and multiple events for every supported kind and verify its explicit singular/plural label. |
| Calendar projection | Capture every built-in theme plus a custom theme and require cells, legend, and axis ink to follow the selected visualization roles. |

## Route content ownership

`/nexus` remains the focused command overview, public observatory, and
external-presence hub.
`/dossier` owns capability, evidence, language, and working-principle detail.
Routes link to one another through the persistent bridge and do not duplicate
those bodies of content.

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
6. 320x568, 375x667, 568x320, 800px, 1024px, and desktop layout, full content
   reach, safe-area behavior, and browser zoom;
7. normal, reduced-motion, and forced-colors behavior;
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
passes on that same candidate. Route ownership and the responsive bridge remain
explicit contracts and change only through a deliberate product revision.
