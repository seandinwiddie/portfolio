# Portfolio Scripts and Command Reference

**Canonical command authority**

This document owns all setup, development, validation, export, Graphify, and
cross-repository command information for the portfolio. The consumer README
intentionally contains none of it, and [ENG.md](./ENG.md) defines the invariants
these commands enforce without duplicating their invocation details.

Unless a section says otherwise, run commands from the `portfolio` repository
root. `package.json` is the executable source of truth; update this document in
the same change whenever a package script, prerequisite, or environment contract
changes.

## Prerequisites and install

The repository targets Node.js 22.x, declares Yarn 1.22.22 as its package
manager, and keeps `yarn.lock` authoritative. The Vercel project runtime must
remain on Node.js 22.x so local verification and production builds share the
same major runtime. The functional-programming suite also invokes Python 3.
Graphify commands require the `graphify` CLI to be installed and on `PATH`.

```bash
yarn install --frozen-lockfile
```

Success means Yarn exits zero without changing `yarn.lock`. Use an intentional
dependency-update workflow rather than dropping `--frozen-lockfile` in CI or
release verification.

## Runtime configuration

| Variable | Default | Purpose |
| :---- | :---- | :---- |
| `EXPO_PUBLIC_API_URL` | `https://api.sdin.dev` | Selects a compatible portfolio API base URL for the RTK Query boundary. |
| `PORTFOLIO_AGENT_MANIFEST_URL` | `https://api.sdin.dev/agent-manifest` | Selects the versioned, read-only API manifest used only while generating deployable machine-discovery artifacts and static document metadata. The build follows the manifest's authoritative-data relation; it fails when either API contract is missing or invalid. |
| `AGENT_SKILLS_ROOT` | auto-discovered | Optional first-priority skill directory for conformance tooling. |
| `CODEX_SKILLS_ROOT` | auto-discovered | Optional additional skill directory for conformance tooling. |

Set Expo public variables in the process that starts or exports the app. Example
for a compatible local API:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000 yarn web
```

Do not place secrets in an `EXPO_PUBLIC_*` variable; Expo public variables are
part of the client bundle.

Ingress destinations and install copy are authored by the API `presentation`
contract. They do not have a second environment-variable override in the
client.

### Configuration ownership

| File | Authority |
| :---- | :---- |
| `package.json` / `yarn.lock` | Package scripts, dependency intent, and reproducible dependency resolution. |
| `app.json` | Expo application identity, platform metadata, and static web settings. |
| `babel.config.js` | Babel/Expo and Tamagui transformation configuration. |
| `metro.config.js` | Metro and Tamagui bundler composition. |
| `tamagui.config.ts` | Tamagui tokens, fonts, animations, and projected theme registration. |
| `tsconfig.json` | TypeScript compiler and path/type-analysis policy. |
| `biome.json` | Formatting/lint scope, parser behavior, and generated-directory exclusions. |
| `vercel.json` | Hosting/build integration; the package export script remains the static-artifact authority. |

Change configuration at its owner rather than adding a second ad hoc config
path. Validate every consumer affected by a configuration change.

## Setup and development scripts

| Command | Exact package expansion | Use and success expectation |
| :---- | :---- | :---- |
| `yarn start` | `expo start -c` | Starts Expo and clears Metro's cache. Success means the development server starts without configuration errors. |
| `yarn web` | `expo start --web` | Starts the web development target. Verify the printed local URL and inspect browser/runtime output. |
| `yarn browser:playtest:chrome` | `bash scripts/dev/browser-harness-chrome.sh` | Launches one owned, isolated Windows Chrome profile and writes its exact CDP endpoint and run identity below `browser-playtests/.runtime/`. Keep the process open until the playtest finishes, then enter `stop`. |
| `yarn browser:playtest` | `bash scripts/dev/browser-harness-playtest.sh` | Reads Browser Harness Python statements from stdin, binds only to the isolated Chrome endpoint, records the session, and keeps machine-local evidence under the git- and Biome-ignored `browser-playtests/harness-runs/<run-id>/`. The living acceptance authority is `browser-playtests/PROMPT.md`; reconcile it with visible production behavior after every run and rerun materially changed coverage. |
| `yarn playtest:prompt` | `node scripts/dev/browser-playtest-prompt.mjs` | Prints the checked-in production acceptance prompt for an independent Browser Harness run. |
| `yarn android` | `expo run:android` | Builds/runs the Android native target with the locally configured Android toolchain. |
| `yarn ios` | `expo run:ios` | Builds/runs the iOS native target with the locally configured Apple toolchain; it requires a supported macOS/Xcode environment. |
| `yarn test:watch` | `jest --watchAll` | Runs application tests interactively as files change. Stop it manually when finished. |

Development-server startup is not a validation result. Run the relevant focused
checks while iterating and the complete release sequence on the settled tree.

## Validation gates

Every blocking gate succeeds only with exit code zero. REVIEW/SMELL notices from
the FP or Redux analyzers remain actionable review output even when they are
non-blocking; a BLOCK/fail finding must keep the command nonzero.

| Command | Exact package expansion | What it enforces |
| :---- | :---- | :---- |
| `yarn test` | `jest` | Application unit, selector, reducer, hook/view, theme, and rendering contracts discovered by the Jest configuration. Counts may grow; success is zero failed suites/tests. |
| `yarn typecheck` | `tsc --noEmit` | TypeScript correctness without writing build output. |
| `yarn lint` | `biome check .` | Biome formatting/lint policy across the configured repository scope without applying writes. |
| `yarn lint:fix` | `biome check --write .` | Applies Biome's mechanical safe formatting/lint rewrites. Review the diff and rerun the non-writing gate. |
| `yarn check:tamagui` | `tamagui check` | Tamagui configuration/component diagnostics. This is not currently included in `verify`. |
| `yarn check:fp` | `node scripts/fp/runFpChecks.mjs` | Runs five phases: Node checker fixtures and executable laws, Python contract fixtures, live TypeScript AST conformance, the installed functional-core contract, and a contextual surface review. |
| `yarn check:api-data-authority` | `node --test scripts/redux/apiDataAuthority.node-test.mjs && node scripts/check-api-data-authority.mjs` | First validates the checker fixtures, then unconditionally discovers and scans the complete production `src` tree. It rejects local runtime data/JSON, governed authored copy/destinations, unauthorized network calls, missing public RTK Query routes, and a misplaced or absent RTK Query API boundary. Tests are the sole fixture exemption; neutral control/static-export semantics remain allowed. |
| `yarn check:rtk` | `node scripts/redux/runTests.mjs && node scripts/redux/checkConformance.mjs && node scripts/check-api-data-authority.mjs` | Runs every Redux `.node-test.mjs` fixture, live Redux/RTK Query role/store/listener/API checks, and the live API-only authority gate. |
| `yarn check:ecs` | `node scripts/check-ecs-conformance.mjs` | Requires the components/entities/systems/view topology, allowed root files, concrete domains, and grouped views; rejects vague role-bucket folders. |
| `yarn check:fan-out` | `node scripts/check-fan-out.mjs` | Enforces the declared registry/substrate/bridge concern tree, the explicit Expo station-view roots, and a maximum of seven direct subnodes everywhere below the route registry. |
| `yarn check:agent-surface` | `node --test scripts/agent-surface.node-test.mjs` | Validates accumulated manifest and presentation-contract failures, the exact five-route export, canonical sitemap/robots/`llms.txt` projection, private-surface rejection, and API-authored static HTML metadata without making a network request. |
| `yarn check:feature-files` | `node --test scripts/check-feature-file-contract.node-test.mjs && node scripts/check-feature-file-contract.mjs` | Validates and then applies immediate-folder prefixes, approved role suffixes, semantic subdomain nesting, domain-scoped name uniqueness, and barrel-decay notices. |
| `yarn verify` | `bash scripts/verify-all.sh` | Runs FP, RTK/API authority, ECS, feature filename, fan-out, lint, TypeScript, and Jest gates while collecting every failed gate. It does not run the Tamagui diagnostic or static export, so those remain separate release steps. |

### Focused checker commands

Use these to shorten a diagnosis; they do not replace their composite gate:

```bash
node scripts/fp/runAstConformance.mjs .
node scripts/redux/checkConformance.mjs .
node scripts/check-api-data-authority.mjs .
node scripts/check-ecs-conformance.mjs
node scripts/check-feature-file-contract.mjs
node --test scripts/redux/apiDataAuthority.node-test.mjs
node --test scripts/check-feature-file-contract.node-test.mjs
corepack yarn test --runInBand src/features/systems/registry/observatory/signalArray/signalArraySelectors.test.ts src/features/systems/registry/missions/operations/operationsSelectors.test.ts
```

## Build and export

| Command | Exact package expansion | Output and success expectation |
| :---- | :---- | :---- |
| `yarn vercel-build` | `expo export -p web && cp dist/+not-found.html dist/404.html && node scripts/generate-agent-surface.mjs dist` | Creates the static web export, installs Expo's not-found output as the hosting-provider 404 fallback, then fetches the versioned API manifest and its authoritative `/data` document. It generates `robots.txt`, `sitemap.xml`, and `llms.txt` and projects API-authored title, description, canonical, schema, provenance, and JSON-LD metadata into the exact five indexable HTML documents. Every stage must exit zero; contract drift, unexpected routes, private/mutating resources, or non-HTTPS authority is a blocking build failure. |

The package does not define a deploy command. Export, deployment, and deployed
browser QA are separate release stages. Do not describe a successful export as
a deployment.

Recommended final-tree sequence:

```bash
yarn verify
yarn check:tamagui
yarn vercel-build
git diff --check
find src -name '*.tsx' ! -path 'src/views/*'
find src -type f -name '*.json' ! -name '*.test.json'
```

The first four commands must exit zero. Both `find` commands must print nothing
for the current architecture/data contract; investigate every result rather
than filtering it away reflexively.

## Graphify

`graphify-out/` is the persistent architecture graph and generated report
directory. Use a code-only extraction only when no graph exists:

```bash
graphify extract . --code-only --out .
```

After source moves, deletions, or architectural refactors, replace the release
graph with a clean code-only extraction so deleted semantic nodes cannot survive,
then diagnose multigraph collapse risk and refresh the token benchmark:

```bash
graphify extract . --force --code-only --out .
graphify diagnose multigraph --graph graphify-out/graph.json --undirected
graphify benchmark graphify-out/graph.json
```

`--force` is intentional after deletions because an updated graph may correctly
contain fewer nodes. Success requires a regenerated `graph.json`, report, and
visualization. Record any remaining dangling endpoints, self-loops, or
same-endpoint collapse warnings rather than calling graph health clean.

Architecture queries use the generated graph explicitly:

```bash
graphify query "How does API data reach route views?" --graph graphify-out/graph.json
graphify affected "src/features/systems/substrate/kernel/api/apiApi.ts" --graph graphify-out/graph.json
graphify explain "src/store.ts" --graph graphify-out/graph.json
```

## Dependency maintenance

| Command | Exact package expansion | Policy |
| :---- | :---- | :---- |
| `yarn upgrade:tamagui` | `yarn upgrade tamagui@latest @tamagui/animations-react-native@latest @tamagui/config@latest @tamagui/font-inter@latest @tamagui/linear-gradient@latest @tamagui/lucide-icons@latest @tamagui/react-native-media-driver@latest @tamagui/shorthands@latest @tamagui/themes@latest @tamagui/toast@latest @tamagui/babel-plugin@latest @tamagui/cli@latest @tamagui/metro-plugin@latest` | Updates every currently owned Tamagui runtime/build package with the Yarn Classic-compatible command. Review manifest/lock changes and run every release gate. |
| `yarn upgrade:tamagui:canary` | `yarn upgrade tamagui@canary @tamagui/animations-react-native@canary @tamagui/config@canary @tamagui/font-inter@canary @tamagui/linear-gradient@canary @tamagui/lucide-icons@canary @tamagui/react-native-media-driver@canary @tamagui/shorthands@canary @tamagui/themes@canary @tamagui/toast@canary @tamagui/babel-plugin@canary @tamagui/cli@canary @tamagui/metro-plugin@canary` | Opts the same explicit package family into prerelease builds. Use only for an intentional compatibility investigation and never treat installation alone as compatibility proof. |

## Script ownership and maintenance

| Path | Ownership contract |
| :---- | :---- |
| `scripts/fp/` | Functional laws, fixtures, AST dependency/control/arity/state checks, installed-core validation, and contextual reviews. `runFpChecks.mjs` discovers every `*.node-test.mjs` file in this directory. |
| `scripts/redux/` | Redux/RTK fixtures and live checks for the root store, Provider/typed hooks, listeners, API composition/tags/wiring, role boundaries, direct fetch, state serializability, and selector review. `runTests.mjs` discovers every `*.node-test.mjs` file here. |
| `scripts/check-api-data-authority.mjs` | Thin live-tree entrypoint over the shared Redux project context and API-authority rules. Keep the wrapper and its fixture contract aligned. |
| `scripts/check-ecs-conformance.mjs` | Portfolio-specific physical topology and role-folder boundary. |
| `scripts/check-fan-out.mjs` | Live concern-tree membership and maximum-seven direct-subnode gate, with the Expo route registry as the explicit root exception. |
| `scripts/check-feature-file-contract.mjs` | Feature leaf naming/nesting contract and non-blocking barrel-decay reporting. |
| `scripts/check-feature-file-contract.node-test.mjs` | Executable fixture contract for feature filenames; update before or with a rule change. |
| `scripts/concern-tree.mjs` | Single source of truth for registry/substrate/bridge feature pillars, reusable view concerns, and domain-scoped subdomain collision resolution. |
| `scripts/agent-surface.mjs` | Pure validation and projection core for agent discovery. It derives route identifiers from exported HTML and renders crawler/agent artifacts plus static document metadata from API authorities without owning portfolio business copy. |
| `scripts/agent-surface.node-test.mjs` | Executable manifest, authoritative presentation, exact-route, static-head, sitemap, robots, and `llms.txt` contract. |
| `scripts/generate-agent-surface.mjs` | Build-edge effect that fetches `/agent-manifest` and its authoritative-data relation, discovers the current static export, injects the API-backed head metadata, and writes deployable machine artifacts. It must never expose private security findings or accept arbitrary scan targets. |
| `scripts/verify-all.sh` | Unified non-short-circuiting local gate runner and complete failure summary. |
| `scripts/skill-paths.mjs` | Portable installed-skill discovery via optional configured roots, workspace ancestors, and user skill directories. It must not embed one developer's home path. |

When a checker changes, add or update a failing fixture first, make the fixture
pass, then run the live tree. Do not weaken a rule merely to make current code
green. If the intended architecture changes, update the engineering contract,
checker, fixtures, callers, and this command reference in the same change.

Generated caches such as Python `__pycache__` are not script source and should
not be treated as authored checker files.

## Sibling service

The API repository owns all of its own setup, runtime, test, configuration,
maintenance, and release commands in
[api.sdin.dev/DOCS/SCRIPTS.md](../../api.sdin.dev/DOCS/SCRIPTS.md).
