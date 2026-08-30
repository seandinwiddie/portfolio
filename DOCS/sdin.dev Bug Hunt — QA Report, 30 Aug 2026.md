# **sdin.dev Bug Hunt**

**Live browser QA · post-deploy verification**  
**Target:** portfolio.sdin.dev \+ api.sdin.dev  |  **Date:** 30 August 2026  |  **Browser:** Chrome, 1534px viewport  
Eleven findings ranked by severity, with the reproduction and exact evidence for each, plus the twelve fixes from this deploy confirmed to hold in a real browser.  
**Summary: 3 High · 4 Medium · 4 Low · 12 fixes verified.** The app itself emitted zero console output on every route.

# ---

**Findings**

*Ranked by user impact. Numbering is the severity ranking, not a sequence. Every item was reproduced at least twice.*

## **01 — HIGH — Unknown routes serve Vercel's own 404 page; the app's not-found screen never renders**

**Did:** Navigated to /nope directly in the address bar.  
**Expected:** The app shell with nav and footer, "Oops\! This screen doesn't exist.", and a working "Go to home screen\!" button.  
**Actual:** A bare Vercel error card — no nav, no footer, no app shell, no way back. The user is dropped out of the site entirely.  
**Evidence:**  
GET /nope  
  → 404  
  content-type: text/plain   (79 bytes)  
  x-vercel-error: NOT\_FOUND

  The page could not be found

  NOT\_FOUND

  sfo1::fs48t-1788068619024-96bfd4c28a2e  
**Diagnosis — the screen itself is fine.** This is hosting config, not app code. Pushing /nope client-side renders the not-found screen correctly, with nav and footer intact, and its "Go to home screen\!" button navigates to / client-side with no full reload. The static export just has no 404 fallback wired up, so Vercel answers first. /store and /hooks hit the same wall — they correctly no longer serve real pages, but they also land on Vercel's error card rather than yours.

## **02 — HIGH — The tab title is empty on all four routes**

**Did:** Loaded /, /home, /about and /status, then read the served HTML and the hydrated document.title.  
**Expected:** "Sean Dinwiddie \-- Portfolio"  
**Actual:** Empty on every route, both in the served markup and after hydration. Chrome falls back to showing the bare URL in the tab, and bookmarks, history and search results all inherit that.  
**Evidence:**  
// served HTML, identical on /, /home, /about, /status  
\<title data-rh="true"\>\</title\>

// after hydration  
document.title \=== ""  
**Note:** The data-rh="true" attribute means react-helmet *is* rendering the tag — it's just being handed no value. The title fix did not survive this deploy.

## **03 — HIGH — The nav bar needs \~951px and never wraps, so controls fall off-screen below that**

**Did:** Rendered /about at 375px and 800px viewport widths and measured every nav item's box against the viewport edge.  
**Expected:** Nav wraps, collapses to a menu, or otherwise stays reachable at mobile and tablet widths.  
**Actual:** The nav keeps its full desktop width and pushes the page into horizontal overflow. At 375px everything from "About" rightward is off-screen; at 800px the theme switcher is off-screen.  
**Evidence:**  
@ 375px \- scrollWidth 951 vs clientWidth 375 (576px overflow)  
  Portfolio.sdin.dev   L=18   R=256   visible  
  Home                 L=276  R=311   visible  
  About                L=349  R=393   CLIPPED at 375  
  Status               L=431  R=484   off-screen  
  Download Theme       L=503  R=643   off-screen  
  Load Custom Theme    L=669  R=794   off-screen  
  Theme: toggle        L=840  R=884   off-screen

@ 800px \- 151px overflow  
  Theme: toggle        L=840  R=884   off-screen

@ 1534px \- scrollWidth \=== clientWidth, no overflow  
**Reachable, but only by scrolling the whole page sideways.** body is overflow-x: hidden but html is overflow-x: visible, so the page does scroll horizontally (I drove scrollLeft to 576 and the hidden items came into view). The controls aren't lost — but reaching them drags the article text sideways with them, which is the classic broken-mobile-layout experience.

## **04 — MEDIUM — Back silently loses a step when you navigate to a route already in history**

**Did:** Loaded /about fresh, clicked Status, clicked About, then pressed Back — with pushState, replaceState and popstate instrumented.  
**Expected:** Three pushes, and Back returns to /status.  
**Actual:** The second nav *replaced* the /status entry instead of pushing. Back leaves you sitting on /about — it looks like the button did nothing, and /status is gone from history.  
**Evidence:**  
// load /about \-\> click Status \-\> click About  
\["pushState /status", "replaceState /about"\]  
history.length: 24 \-\> 25   (should be 26\)

// press Back  
location.pathname \=== "/about"   (unchanged)

// variant, target further back in the stack:  
// /about \-\> Status \-\> Home \-\> About  
\["pushState /status", "pushState /home",  
 "POPSTATE /status", "replaceState /about"\]  
**Second-order effect:** In the variant above the router does go(-1) and *then* rewrites the URL, so /status briefly renders on the way from /home to /about — a visible flash of a route you didn't ask for. Both behaviours look like React Navigation's "navigate to an existing screen" semantics leaking into the browser history stack.

## **05 — MEDIUM — "Download Theme" always exports the same hardcoded light values, whatever theme is active**

**Did:** Switched to neon and clicked Download Theme; switched to dark and clicked again; compared the two files.  
**Expected:** The exported CSS carries the active theme's actual colours, so it's a usable starting point.  
**Actual:** Byte-identical except the comment. In dark — where the real body background is \#0A0E14 — the file still declares \--background: \#ffffff. The "Based on:" line is the only thing that changes, which makes it actively misleading.  
**Evidence:**  
/\* Theme: Custom \*/  
/\* Based on: dark \*/          \<- only differing line

:root {  
  \--background: \#ffffff;      \<- dark theme is \#0A0E14  
  \--color:      \#000000;      \<- dark theme is \#B3B1AD  
  \--primary:    \#3498db;  
  \--secondary:  \#2ecc71;  
  \--accent:     \#e74c3c;  
}  
**The download mechanism itself is correct:** filename theme-custom.css, blob type text/css, 247 bytes — all as specified. I intercepted the blob rather than writing to disk, so the filename and exact contents are verified but the save itself isn't.

## **06 — MEDIUM — The chosen theme resets to "light" on every page load**

**Did:** Set the theme to neon, confirmed theme-neon, then reloaded /home.  
**Expected:** The theme survives a refresh, or at least a same-session one.  
**Actual:** Back to theme-light. Nothing is written to localStorage or sessionStorage — the only keys present belong to MetaMask and the Vercel toolbar. It survives client-side navigation fine; only a document load loses it.  
**Evidence:**  
before reload  body.className \= "theme-neon"  
after  reload  body.className \= "theme-light"

Object.keys(localStorage)  
  \-\> \["-walletlink:...EIP6963ProviderUUID",  
      "\_\_vercel\_toolbar\_injector"\]     // no theme key  
**May be by design.** Persistence wasn't listed as a requirement, so this is flagged rather than asserted. Worth noting it reads oddly against the app's own /about copy, which says the theme "is stored in the Redux store" — and that a visitor who picks a theme loses it on every refresh.

## **07 — MEDIUM — /home renders none of the 2 features or 5 procedures**

**Did:** Loaded /home and string-matched all seven expected items against the rendered text.  
**Expected:** Per spec, both /about and /home show the 2 portfolio features and 5 app procedures.  
**Actual:** /home is a link hub — "Sean Dinwiddie's Portfolio" plus three web-presence buttons. All seven strings are absent. The page isn't scrollable (scrollHeight \=== innerHeight), so nothing is hidden below the fold. /about has all seven correctly.  
**Evidence:**  
/home  featuresPresent:   \[\]  
       proceduresPresent: \[\]  
       full text: "Sean Dinwiddie's Portfolio /  
         Explore my various web presences and projects. /  
         seandinwiddie.com / sdin.dev / seandinwiddie.github.io"

/about featuresPresent:   2 of 2  OK  
       proceduresPresent: 5 of 5  OK  
**Flagged uncertainty — not confident this is a bug.** /home looks deliberately built as a link hub, not like a page that failed to load data. This may be an intentional redesign and the spec line may simply be stale.

## **08 — LOW — The brand name is a span with an inert href: not keyboard-reachable, can't open in a new tab**

**Did:** Inspected the brand element, then clicked it with a survival sentinel set on window.  
**Expected:** A real link: focusable, middle-clickable, copyable.  
**Actual:** Navigation works correctly and **is client-side** — the sentinel survived, no document request. But it's a \<span role="link"\> carrying an href attribute, which does nothing on a span, and it has no tabindex. So: not keyboard-focusable, no open-in-new-tab, no copy-link, and screen readers announce a link with no destination.  
**Evidence:**  
SPAN\[role=link\] href="/" tabindex=NONE   \<- brand  
A   \[role=link\] href="/home"  tabindex=0  \<- nav items, correct  
**Same pattern elsewhere:** /home's three web-presence items and the landing page's "Explore Portfolio" / "View Status" are \<button\> elements, so those external destinations also can't be opened in a new tab. All of them work on click.

## **09 — LOW — "API Status" reports "succeeded" while the API is unreachable**

**Did:** Blocked api.sdin.dev at the network layer and loaded /status fresh (0 requests actually reached the API).  
**Expected:** A page headed "API Status" distinguishes a live API from a dead one.  
**Actual:** Renders identically to the healthy case, including "Current status: succeeded". The fallback rendering is exactly what was wanted — but the status readout can't tell you the API is down.  
**Evidence:**  
blocked:      \["https://api.sdin.dev/data"\]  
realApiReqs:  0

rendered: "Brand Name: Portfolio.sdin.dev  
           Current status: succeeded  
           Current theme: light  
           Available themes: dark, dracula, light, mirage, neon"  
**Partly a labelling question.** "Current status" may well be reporting the Redux fetch state — which genuinely did succeed, via the fallback. It's only misleading because it sits under an "API Status" heading. Low confidence this is a bug rather than a wording choice.

## **10 — LOW — Loading a custom theme leaks an internal timestamp into the UI**

**Did:** Loaded a real .css through Load Custom Theme.  
**Expected:** A human-readable label.  
**Actual:** The nav button reads "Theme: custom-1788068942990" and the body class becomes theme-custom-1788068942990. Cosmetic only — the theme applies correctly and the cycle recovers cleanly afterwards.  
**Evidence:**  
button label:      "Theme: custom-1788068942990"  
body.className:    "theme-custom-1788068942990"  
**Worth noting against spec:** this is the one case where the body class isn't theme-\<name\>. It is never theme-undefined, though — see verified fixes below.

## **11 — LOW — The injected custom-theme style tag is never removed**

**Did:** Loaded a custom theme, then cycled through to dark and dracula, then counted style tags.  
**Expected:** The injected stylesheet is torn down when you leave the custom theme.  
**Actual:** The /\* Theme: Custom \*/ style tag is still in the DOM. It caused no visible misbehaviour — the built-in themes overrode it and every colour resolved correctly — but repeated loads would accumulate tags.  
**Evidence:**  
after cycling custom \-\> dark \-\> dracula  
  leftoverCustomStyleTags: 1  
  totalStyleTags: 16

# ---

**Fixes that hold**

*Each of these was actively attacked, not just eyeballed. Theming in particular was stress-tested.*

> * **Theme cycle, all five, in order.** dark → dracula → light → mirage → neon → dark. Matches the order /status advertises.  
> * **Never theme-undefined.** body.className was a valid theme-\<name\> at every step — including under 7 rapid consecutive clicks captured with a MutationObserver. No empty class, no undefined, no skipped state.  
> * **Colours really change.** Measured computed values on body, nav, footer and h1 for all five — five distinct grounds: \#0A0E14, \#282A36, \#FAFAFA, \#1F2430, \#2B213A. No label-without-repaint.  
> * **Load Custom Theme no longer hangs.** The button never enters a disabled state at all — disabled:false, pointer-events:auto, opacity:1 after cancel, and it opened the picker three times in a row with no errors.  
> * **Custom CSS actually applies.** A real .css took effect immediately — body went to rgb(255,255,255) / rgb(0,0,0) from the file's variables — and the built-in cycle recovered cleanly afterwards.  
> * **Bundled fallback survives a dead API.** With api.sdin.dev blocked and zero requests reaching it, /about rendered all 2 features and all 5 procedures, /status rendered brand, theme and theme list, /home rendered normally. No blank page, no empty list, no stuck loader.  
> * **Dank Mono genuinely applied.** DankMono-Regular...otf returns 200, and a canvas pixel comparison shows it rendering differently from both generic monospace and a bogus-font fallback. Not a silent fallback.  
> * **The dead font URL is gone.** No request to seandinwiddie.com/.../dank-mono.css, and the string appears nowhere in the served HTML. The only external hosts are vercel.live and api.sdin.dev.  
> * **Zoom is unlocked.** width=device-width, initial-scale=1.0, viewport-fit=cover — no maximum-scale, no user-scalable=no.  
> * **Brand navigates client-side.** Clicking it went to / with the sentinel intact and no document request. No regression to a full reload. (Its markup is finding 08.)  
> * **/store and /hooks no longer exist.** Both return 404 — they are no longer served as real pages.  
> * **Nav, back/forward and CTAs are client-side.** Home, About and Status all navigate without a document request, as do "Explore Portfolio" → /about and "View Status" → /status. Data on /about and /status is complete and correct.

# ---

**Console & network**

Reporting everything, unfiltered. Across every route the app itself emitted **zero** console output — no React key warnings, no hydration mismatches, no unhandled rejections, and no static asset returned ≥ 400\. Every message that appeared came from one Chrome extension:  
// all from chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn  
//   (MetaMask) /scripts/contentscript.js

MaxListenersExceededWarning: Possible EventEmitter memory leak  
  detected. 11 close listeners added. Use emitter.setMaxListeners()  
  to increase limit

MaxListenersExceededWarning: Possible EventEmitter memory leak  
  detected. 11 end listeners added. Use emitter.setMaxListeners()  
  to increase limit

ObjectMultiplex \- orphaned data for stream "app-init-liveness"  
ObjectMultiplex \- orphaned data for stream "background-liveness"  
**Two things about the browser, not the app:** MetaMask, Phantom and the Vercel toolbar all inject into the page. The Vercel toolbar also pulls vercel.live scripts and a geist.woff2 font — extra requests that ordinary visitors won't make, so don't read those as app requests when profiling.

# ---

**Method & limits**

> * **Client-side navigation was verified with a survival sentinel**, not by eyeballing the Network tab — a window property was set before each click and checked afterwards. A full page reload wipes it, so this catches a regression the Network tab can miss under caching.  
> * **The first API-blocking test was invalid and was discarded.** Loading the page into a srcdoc iframe made the router see about:srcdoc and render the not-found screen; a control run with the API *unblocked* reproduced the same thing, proving the confound. The result above comes from a re-run against the real /about URL with fetch patched — realApiReqs: 0 confirms nothing reached the API.  
> * **Cancel could not be pressed in the native OS file dialog** — it's outside the browser's reach. The dialog was suppressed and the same code path exercised by dispatching the cancel event and clicking the button repeatedly. The evidence is strong (the button never becomes disabled in the first place, so there's no state to get stuck in) but it isn't a literal OS-dialog cancel.  
> * **Responsive widths were tested with sized iframes**, because resize\_window had no effect on the maximised window — innerWidth stayed 1534\. Layout and media queries evaluate against the iframe width, so the measurements reflect real narrow-viewport behaviour, but this isn't a real device or DevTools device emulation.  
> * **Pinch-zoom wasn't physically performed.** The viewport meta was verified to no longer lock scale, which is the thing that was broken; no gesture was performed.  
> * **The download was intercepted, not saved.** The blob and the download attribute were captured rather than writing theme-custom.css to disk, so the file contents and filename are verified but the save itself isn't.  
> * **A quiet console isn't proof of no hydration mismatch.** This is a production React build, which strips most development warnings. Good evidence, not a guarantee.  
> * **Noticed but not called a bug:** before hydration completes, nav items render as inert spans and only become real anchors afterwards. Normal for a static export, but very early clicks do nothing.

*Browser QA of portfolio.sdin.dev · 30 August 2026 · 11 findings, 12 fixes verified*