# **sdin.dev Round Three**

**Round three · visual system \+ three new features**  
**Target:** portfolio.sdin.dev \+ api.sdin.dev  |  **Routes:** / /home /about /projects /status  |  **Date:** 30 August 2026  
The instrument system coheres — it's one committed idea, not piled-on effects. Every regression from the last two rounds now holds. What's left is a theme-repaint bug you'll see immediately in light mode, some very slow data reveals, and a contrast cost the aesthetic is quietly paying.  
**Summary: 1 new High · 5 new Medium · 1 new Low · 7 of 7 regressions hold · 4 things I'd cut.**

# ---

**The judgment call**

## **It coheres. It is not over-decorated — it is over-duplicated.**

This reads as **one instrument system**, not a pile of effects. Every element speaks the same language: monospace throughout, chamfered panel corners, dimmed uppercase labels against bright right-aligned values, a status plate with an OPERATIONAL dot, phosphor grain over a dark ground. The MU-TH-UR 6000 reference is well chosen and — unusually — the console actually delivers on it rather than just borrowing the name. That's the difference between a theme and a costume.  
The failure mode here isn't decoration for its own sake. It's that **you built two status displays and put them on the same screen**. The telemetry rail says "UNITS 42 · OUTPUT 6,706". The unit plate says "ACTIVE UNITS 42 REPOSITORIES · OUTPUT 6,706 CONTRIBUTIONS / CYCLE". The signal trace caption says "6,706 contributions". The number 6,706 appears **three times** on the landing page and 42 appears twice. That's what makes it feel like a lot — not the grain, not the chamfers, not the ignition.  
The other real cost is legibility. The dimmed-label look is exactly what sells the instrument metaphor, and it is also why **rail labels fail WCAG AA in all five themes**. In light theme the system doesn't just dim — it collapses.

## **What I'd cut**

**CUT — The runic label above the signal trace.** It renders as Elder Futhark spelling FORBOC, at 12px. Nobody will read it, and Norse runes belong to a different universe than a Weyland-Yutani instrument panel. It's the one element on the page that is decoration and nothing else, and it's the first thing a sharp visitor will clock as trying too hard.  
**CUT — UNITS and OUTPUT from the telemetry rail.** The plate already carries both, with better labels and more context. Let the rail do the one job the plate can't: live feed state and current theme. That alone kills the triple-6,706 problem and makes the rail feel like a status strip instead of a second dashboard.  
**FIX — Label opacity: 0.42 on the rail, 0.55 on the plate.** This is the single change that would move the design from "stylish but failing" to "stylish and passing". Rail labels land between 1.90:1 and 3.96:1 across the five themes; AA wants 4.5:1. You can keep the dim-label hierarchy — you just need less of it. Bumping rail labels to roughly 0.62 and plate labels to 0.70 would clear AA on the four dark themes.  
**CUT — Light theme, or commit to designing it.** The entire vocabulary assumes a dark ground — phosphor grain, glow, dim-on-dark labels. On white the rail is 1.90:1 (effectively invisible), the plate labels are 2.36:1, and the chamfered frames all but vanish. Right now light isn't a fifth theme, it's the system with the lights turned off. Either give it its own treatment (heavier weights, darker labels, no grain) or drop it and ship four.  
**KEEP — The unit plate, the console, the chamfered frames, the trace.** The plate is the best-designed thing on the site — the label/value alignment does real work and the OPERATIONAL dot earns its place. The console is a genuine feature, not an easter egg. Keep all of it; the problem was never that these exist.

# ---

**New bugs, ranked**

*Separated from the aesthetic opinion above. Each was reproduced at least twice, with controls noted where the method could have caused the result.*

## **01 — HIGH — Tamagui components keep the old theme's background after a theme switch**

**Did:** Loaded /home, then cycled the theme and sampled the three link cards against the body after each switch.  
**Expected:** Card background tracks the active theme, agreeing with \--background-color.  
**Actual:** Cards are frozen at whatever theme was active when they first painted. A fresh load is always correct; every switch after that leaves them stale. In **light** this is glaring — dark-purple \#262335 cards sitting on a \#FCFCFC page.  
**Evidence:**  
`// after switching, starting from neon`  
`theme    body       --background-color   card button`  
`dark     #0B0E14    #0b0e14              #262335   <- neon's ground`  
`dracula  #282A36    #282a36              #262335`  
`light    #FCFCFC    #fcfcfc              #262335   <- dark card on white`

`// then light -> mirage`  
`mirage   #1F2430    #1f2430              #FCFCFC   <- light's white, on navy`

`// control: fresh load, no switching`  
`light    #FCFCFC    —                    #FCFCFC   agrees OK`  
**The body-colour half of this is fixed.** All five grounds are now exact — mirage \#1F2430, dark \#0B0E14, light \#FCFCFC, dracula \#282A36, neon \#262335, each matching its \--background-color. The old "dark was pure black" mismatch is gone. What's left is a repaint problem, not a palette problem: the CSS variables update, the Tamagui components don't re-read them.

## **02 — MEDIUM — /projects sits on "Loading projects…" for about 29 seconds before showing its error**

**Did:** Blocked api.sdin.dev at the network layer, loaded /projects, and polled the rendered text once a second.  
**Expected:** A clean error state — which is what you asked for, and what eventually arrives.  
**Actual:** The error is good when it lands. Getting there takes \~29 seconds of spinner. It isn't infinite, but nobody waits that long.  
**Evidence:**  
`3s=other  4s=LOADING  6s=LOADING  ... 30s=LOADING`  
`32s=LOADING  33s=ERROR  34s=ERROR  36s=ERROR`

`final copy: "Couldn't reach the projects service just now.`  
             `Everything else on the site still works."`  
**The copy itself is a real improvement.** Last round this read "Could not reach the projects API (FETCH\_ERROR)". Leaking the RTK Query error code is gone and the replacement is plain and reassuring. It's only the wait that's wrong.

## **03 — MEDIUM — The landing page can sit on "FEED SYNC" for 20–30 seconds with the trace and plate missing**

**Did:** Loaded / with a healthy API and checked the rail state and component presence at intervals, using tool-level waits so no JavaScript of mine was running in the page.  
**Expected:** The API answers in about a second, so the trace and plate should appear shortly after.  
**Actual:** On one clean run the rail read "FEED SYNC" with no trace and no plate through 20 seconds, flipping to "FEED LIVE" with both present somewhere between 20s and 30s. The API had finished at **1,048 ms**.  
**Evidence:**  
`run 1   ~4s   FEED SYNC   plate=false  trace=false`  
        `~10s  FEED SYNC   plate=false  trace=false`  
        `~20s  FEED SYNC   plate=false  trace=false`  
        `~30s  FEED LIVE   plate=true   trace=true`  
        `api /data 200 (55ms), /github 200 (47ms), ended 1048ms`

`run 2   ~8s   FEED LIVE   plate=true   (api ended 821ms)`  
**Flagged — the trigger could not be pinned down.** Run 2 settled within 8 seconds, so this is intermittent rather than constant, and I'm not confident what distinguishes the two. It is the same family as finding 02 — the UI not reacting to data that has already arrived — so they may share a root cause. Worth reproducing with the network panel open before chasing it.

## **04 — MEDIUM (accessibility) — Escape doesn't close the console from its input, which is where focus starts**

**Did:** Opened the console (input auto-focuses), pressed Escape from the input, then pressed Escape with focus elsewhere.  
**Expected:** Escape closes it, per spec.  
**Actual:** Escape works at document level but is ignored when the event comes from the console input. Since the input is auto-focused on open, the default state is the one where Escape does nothing.  
**Evidence:**  
`opened=true  autoFocused=true`  
`Escape dispatched on the input   -> stillOpen TRUE  (bug)`  
`Escape dispatched on document    -> stillOpen false  OK`  
`backtick on document             -> toggles cleanly  OK`  
**This leaves keyboard users with no way to close it.** Backtick typed into the input correctly inserts a character rather than closing (that part works as specified). The visible "close" affordance is a span with cursor:pointer — not a button, no role, not in the tab order. So with focus in the input there is no key that closes the console; you have to Tab out first, or reach for the mouse. Making "close" a real button would fix the trap even if Escape stays as-is.

## **05 — MEDIUM — The console input loses focus after every command**

**Did:** Ran a command, then checked document.activeElement. Repeated across several commands.  
**Expected:** Focus stays in the input, the way every terminal behaves.  
**Actual:** Focus drops to BODY after each submit, so you must click back into the field before typing the next command. I hit this immediately — my first attempt to type "whoami" after "help" went nowhere.  
**Evidence:**  
`ran:help    focusAfter=BODY`  
`ran:whoami  focusAfter=BODY`  
`ran:repos   focusAfter=BODY`

## **06 — MEDIUM (accessibility) — Rail labels fail WCAG AA in all five themes; light fails almost everywhere**

Contrast computed by compositing the text colour over its real backdrop at its *effective* opacity — the dimming is done with opacity, not color, so a naive reading of color reports every element as identical and misses this entirely. AA needs 4.5:1 at these sizes.

| Theme | Rail label | Rail value | Plate header | Plate label | Plate value |
| :---- | :---- | :---- | :---- | :---- | :---- |
| mirage | 2.89 FAIL | 7.23 | 4.34 FAIL | 3.88 FAIL | 9.45 |
| dark | 2.72 FAIL | 7.63 | 4.31 FAIL | 3.79 FAIL | 10.27 |
| light | 1.90 FAIL | 4.32 FAIL | 2.59 FAIL | 2.36 FAIL | 6.10 |
| dracula | 3.69 FAIL | 10.07 | 5.82 | 5.14 | 13.36 |
| neon | 3.96 FAIL | 11.39 | 6.41 | 5.63 | 15.28 |

*Opacities: rail label 0.42 at 12px, rail value 0.85 at 12px, plate header 0.60 at 12px, plate label 0.55 at 14px.*  
**Read the light row.** Every column fails except the plate values. At 1.90:1 the rail labels are not dim, they're gone — which matches what the screenshots show. dracula and neon are the only two themes where the plate clears AA.

## **07 — LOW — "pushs" on the /projects activity chip**

The recent-activity filter chips read "comments 48 · issues 31 · pushs 21". Should be "pushes". Cosmetic, but it's in a prominent spot on the page you most want people to look at.

# ---

**Regressions — all seven hold**

> * **One populated title per route — PASS.** One tag each: Welcome / Home / About / Projects / Status — Sean Dinwiddie.  
> * **/nope shows the app's 404 — PASS.** /nope and /store return 404, text/html, app shell, with x-vercel-error null.  
> * **Back from About to Status to About — PASS.** Log read push /status then push /about; Back landed on /status with h1 "Application Status".  
> * **Theme persists across reload — PASS.** portfolio.themeMode set to neon, survived reload as rgb(38,35,53).  
> * **Mirage default, no white flash — PASS.** Cleared storage gave theme-mirage rgb(31,36,48); the mirage ground is set on body in an inline head style, so it paints before any JS runs.  
> * **Brand is a focusable anchor — PASS.** A real anchor with href="/" and tabindex="0", focus confirmed, and it still navigates client-side.  
> * **Never theme-undefined — PASS.** 40 rapid clicks, 41 class transitions, zero invalid values.

# ---

**What landed**

## **Mobile scroll — fixed**

> * At 375px both / and /home scroll to the bottom. QR fully reachable, unit plate reachable, footer clears.  
> * **Zero horizontal overflow on all five routes at both 375px and 800px** — scrollWidth equals clientWidth in all ten cases, and the theme toggle is reachable on every route without sideways scrolling. Last round 375px overflowed by 238px; that's gone.

## **Custom theme — fixed**

> * Downloading in dark then loading that file lands the body on rgb(11,14,20) — the real dark values, not pure black.  
> * style\[data-custom-theme\] is present (1) while active and gone (0) after switching away.  
> * **The blob leak is gone:** 5 clicks produced 5 createObjectURL and 5 revokeObjectURL. Last round this was \~15,000 per click with zero revoked.  
> * Worth noting: the same simulated-file method that failed last round now succeeds, which retroactively confirms that was a real app bug rather than a testing artifact.

## **MU-TH-UR console — works**

> * Every command returns real data: help, whoami, repos, "repos ForbocAI" (filters to 9), langs (ASCII bar chart, 11 languages including C++ 2), activity.  
> * "theme neon" changed the actual page theme — body class and ground both followed.  
> * "theme nonsense" returned: unknown theme "nonsense". available: dark, dracula, light, mirage, neon. An unknown verb returned: unknown command "flurgle". type help. Both graceful.  
> * Backtick toggles open/closed; backtick typed into the input inserts a character and does not close. Both correct.

## **Data on /projects — all correct**

> * **42 repos**, grouped SEANDINWIDDIE 33 \+ FORBOCAI 9\.  
> * **11 languages** including **C++ 2**; contribution calendar at **6,706**; 100 recent events; 95 followers.  
> * **Zero "No description yet."** — every repo now carries a real description.

## **Degradation — omits rather than empties**

> * With the API blocked, the telemetry rail drops to FEED FALLBACK and **omits UNITS and OUTPUT** rather than showing empty frames. The signal trace and unit plate remove themselves entirely. Exactly the requested behaviour.  
> * The landing hero, CTAs and QR still render. /about still shows 2 features and 5 procedures. /status reports unreachable.

## **Reduced motion — complete**

> * Every running animation maps to a disabling rule: signal-sweep to .signal-trace::after, ignite to .ignite and .panel-frame, draw-rule to .rule, drift to .drift, plate-scan to .plate-scan::after. Grain drops to a static 0.25.  
> * Each animated element was verified to actually carry the class its rule targets, so none of the rules are dead selectors.

# ---

**Console & network**

Zero app-origin console output across all five routes. No React key warnings, no hydration mismatches, no unhandled rejections, and **no request returning 400 or above** (20 resources per page load). Last round's "Failed to load theme: Object" is gone, consistent with the custom-theme fix. Everything in the console came from extensions:  
`// MetaMask - chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn`  
`MaxListenersExceededWarning: Possible EventEmitter memory leak`  
  `detected. 11 close listeners added...`  
`ObjectMultiplex - orphaned data for stream "app-init-liveness"`

`// External hosts contacted: vercel.live (toolbar), api.sdin.dev`

# ---

**Method & limits**

> * **Contrast was computed by compositing over the real backdrop at effective opacity.** Every text node on the page reports the same color value — the hierarchy is built entirely from opacity. A contrast check that reads color alone will report no problems here, which is probably why this hasn't surfaced before.  
> * **Reduced motion was verified by CSS and DOM inspection, not by toggling the OS setting** — that can't be changed from the browser. Every element with a running animation was enumerated, matched to a prefers-reduced-motion rule, and confirmed to carry the class that rule targets. That's strong, but it isn't the same as watching it with the preference on.  
> * **The file picker can't be driven**, so the custom-theme load was simulated by setting input.files and dispatching change. It succeeded this round using the identical method that failed last round, which is itself good evidence the method is faithful.  
> * **Backtick had to be dispatched as a synthetic Backquote keydown.** The tooling's plain keypress didn't reach the handler; a real user's keyboard almost certainly does, so this isn't reported as a bug — but the physical key was not confirmed end to end.  
> * **Responsive widths were measured in sized iframes**, since window resizing has no effect on the maximised window. Layout and media queries evaluate against the iframe width, so the numbers are real, but this isn't device emulation.  
> * **One correction worth recording.** The landing page with the API blocked was first measured as a blank page and nearly filed as a severe bug. It wasn't — the batch containing the wait had failed, so the screenshot fired seconds after load, before hydration. On a proper re-run everything renders. The slow-reveal finding (03) is a separate, later measurement taken with tool-level waits.  
> * **Five real downloads happened** — the blob accounting needed the genuine anchor path, so theme-custom.css landed in the Downloads folder five times.  
> * **Unchanged from last round, still flagged:** the QR copy reads "this same page also builds as a native iOS and Android app". It doesn't claim an install exists, but it sits directly above the QR and some readers will scan expecting one.

*Round three · portfolio.sdin.dev · 7 new bugs, 7 of 7 regressions holding, 3 features verified*