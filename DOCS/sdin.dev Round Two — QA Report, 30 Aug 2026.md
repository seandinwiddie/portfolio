# **sdin.dev Round Two**

**Round two · new features \+ regression sweep**  
**Target:** portfolio.sdin.dev \+ api.sdin.dev  |  **Routes:** / /home /about /projects /status  |  **Date:** 30 August 2026  
Three new features verified and eleven earlier fixes re-checked. Almost everything held — **ten of eleven regressions pass**, and all three features work. Three new bugs surfaced, one of them a feature that silently does nothing.  
**Summary: 1 new High · 2 new Medium · 10 of 11 regressions pass · 2 items flagged as uncertain.**

# ---

**New bugs, ranked**

*All three are new since the last round. Each was reproduced at least twice, and where the test method could have caused the result, the control is given.*

## **01 — HIGH — Loading a custom theme accepts the file, renames the theme, and never applies the CSS**

**Did:** Clicked Load Custom Theme and supplied a .css file — including, on one run, the app's own Download Theme export byte-for-byte.  
**Expected:** The file's declarations apply, as they did last round. For the dark export, body should land on \#0a0e14.  
**Actual:** The label becomes "Theme: custom", the button switches to "Update Custom Theme", body.className becomes theme-custom and Tamagui switches to t\_custom — but the stylesheet never reaches the CSSOM. The page renders on pure black with default white text.  
**Evidence:**  
`// after loading the app's own dark export`  
`body.className                           "theme-custom"`  
`getComputedStyle(body).backgroundColor   rgb(0, 0, 0)   <- expected rgb(10,14,20)`  
`--background-color                       ""             <- never defined`  
`style tags containing "0a0e14"           0`  
`style[data-custom-theme]                 0`

`// control - the same variable on a built-in theme`  
`body.className                           "theme-dark"`  
`--background-color                       "#0a0e14"      <- mechanism works fine here`  
**Console:**  
`[ERROR] Failed to load theme: Object`  
**Two things worth knowing about this one.** That console error is *app* code, not an extension — it is attributed to installHook.js only because React DevTools proxies console. It fired on two load attempts at exactly the right moments, but not on later ones, so the logging looks conditional while the visual failure reproduced every single time.  
The honest caveat: a native OS file dialog cannot be operated from the browser, so input.files was set and a change event dispatched. If the handler reads the file some other way, that simulation could be the cause. Two things argue against it — the handler clearly ran (it flipped the label, the class, the Tamagui theme and the button text), and the app logged its own "Failed to load theme". Worth one manual confirmation with a real file before digging in.

## **02 — MEDIUM — Every "Download Theme" click leaks \~15,000 blob URLs and revokes none**

**Did:** Counted URL.createObjectURL and URL.revokeObjectURL calls across single clicks of Download Theme.  
**Expected:** One blob created, one revoked.  
**Actual:** A burst of roughly 14,000–15,500 blob URLs per click, none revoked. They accumulate linearly and stay alive for the document's lifetime.  
**Evidence:**  
`click 1   blobsCreated 14117   revoked 0`  
`click 2   blobsCreated 29549   revoked 0   (+15432)`

`// the burst terminates - it is not an infinite loop`  
`count at t+0s   14117`  
`count at t+3s   14117    stillGrowing false`

`// cost so far`  
`jsResponsiveMs   4 -> 21     (2M-iteration loop, before -> after)`  
**Control, because the first measurement was suspect.** This first appeared while instrumentation was suppressing the anchor click, which could plausibly have caused the handler to retry in a loop. It was re-run on a fresh page with only a counter hooked and the real download path fully intact — 14,117 blobs, zero revoked. Not an artifact.  
The count varies between clicks (14,117 then 15,432), suggesting a time-bounded or racing loop rather than a fixed iteration count. No crash was observed and the JS heap barely moved (blob storage lives outside it) — but the page slowed from 4 ms to 21 ms on a fixed benchmark, and 30,000 live blob URLs is a real leak in a tab left open.

## **03 — MEDIUM — Nav wrapping is fixed at 800px but still overflows at 375px, now on both rows**

**Did:** Rendered /about at 375px and 800px and measured every nav item against the viewport edge.  
**Expected:** scrollWidth \=== clientWidth at both widths, theme toggle reachable.  
**Actual:** 800px passes cleanly. 375px still overflows by 238px. The nav does now wrap onto a second row — real progress — but neither row wraps internally, so items run off the right edge of both.  
**Evidence:**  
`@ 800px  - PASS`  
`scrollWidth 800 === clientWidth 800      themeToggle right=782  visible`

`@ 375px  - FAIL, 238px overflow`  
`scrollWidth 613  vs  clientWidth 375`  
  `row 1  brand + Home/About/Projects/Status  -> right edge 613`  
         `About    L=332 R=414   clipped`  
         `Projects L=414 R=522   off-screen`  
         `Status   L=522 R=613   off-screen`  
  `row 2  Download / Load Custom / Theme      -> right edge 474`  
         `Theme toggle                        clipped`  
**The new route made row one wider.** Adding Projects pushed the first row past the viewport — last round row one still fit and only the right-hand controls overflowed. The two-row split is the fix landing; each row needs to wrap too.

# ---

**Part 1 — New features**

*All three work. The notes below are things still worth looking at, not blockers.*

## **A · Live GitHub data on /projects — VERIFIED**

Every claim in the spec checked and matched.

> * **33 repos**, rendered in exactly the API's order — compared position by position, 33/33 match.  
> * **Ordering is genuinely most-recently-pushed.** Every pushedAt parsed; the sequence is strictly descending with zero violations, newest 2026-08-30 back to 2014-08-20. First five: portfolio, api.sdin.dev, lectures, sdin.dev, seandinwiddie.com.  
> * **10 languages, counts exact:** HTML 9, JavaScript 9, PHP 3, TypeScript 3, Vim Script 2, CSS 1, Go 1, Haskell 1, Python 1, Shell 1\. Profile 45 public repos, 95 followers.  
> * **No raw GitHub fields leak.** Repo keys are description, forks, homepage, htmlUrl, id, language, name, pushedAt, stars, topics; profile keys are avatarUrl, bio, blog, followers, htmlUrl, location, login, name, publicRepos. Zero snake\_case survivors in the payload or the DOM.  
> * **Titles link out correctly** — all 33 anchors carry target="\_blank" and rel="noopener noreferrer".  
> * **API blocked:** /projects shows a clean bordered message, not a blank page or spinner. /about still renders 2 features and 5 procedures. /status now reads "Unreachable — serving bundled fallback content", which fixes last round's misleading "succeeded".  
> * **Two small notes.** The error copy exposes the internal code — "Could not reach the projects API (FETCH\_ERROR)". And fork exclusion could not be independently confirmed: the payload carries no fork flag, so the exclusion is a server-side guarantee only corroborated circumstantially (45 public → 33 shown).

## **B · Live Redux inspector — VERIFIED**

Including the unbounded-growth concern.

> * **It caps at exactly 30\.** Roughly 100 theme cycles were driven through it. The header read "dispatched actions (30)" and exactly 30 timestamped rows rendered. No unbounded growth, no recursion.  
> * **It stays responsive and doesn't leak DOM.** A fixed 2M-iteration benchmark held at 4–6 ms throughout, and the node count stayed flat at 137 closed / 258 open no matter how many actions passed through.  
> * **Live updates work.** Cycling the theme appended themeToggle/cycleTheme with a timestamp and themeToggle.mode tracked mirage → neon → dark in step. State panel shows themes discovered, brand name, feature and procedure counts, and body.source.  
> * **clear empties it and the next interaction repopulates** — went to 0, then one cycle brought it to 1, another to 2, newest first.  
> * **Survives navigation** — stayed open across /home → /about → /projects → /status → /home, and the floating button is present on every route including the landing page, which has no nav bar.

## **C · Native-app QR on the landing page — WORKS, with two notes**

> * **Decoded successfully.** The module matrix was extracted from the SVG path and the mask brute-forced: version 2, 25×25, mask 2, byte mode, 26 chars — https://portfolio.sdin.dev. All three finder patterns valid. It will scan.  
> * **Contrast is genuinely theme-independent.** Black \#000000 stroke on a white \#ffffff rect baked into the SVG itself, not read from theme tokens. Measured on all five themes including neon and dracula — identical every time.  
> * **Heading is right** — "Open this on your phone".  
> * **Flagged, not asserted:** the body copy reads "One Expo codebase — this same page also builds as a native iOS and Android app. Scan to open it here." It does not claim an install is available, and "Scan to open it here" is a fair disambiguation. But the native-app sentence sits directly above the QR, and some readers will scan expecting an app. A judgment call — worth tightening, but not clearly wrong.  
> * **Dead markup:** the QR's \<defs\> contains an unused linearGradient going red → cyan that nothing references. Harmless today. If it was ever meant to paint the QR, wiring it up would badly hurt scannability — red on cyan has poor luminance contrast.

# ---

**Part 2 — Regression sweep**

Ten of eleven hold. Number 3 is the partial failure detailed above; number 9 passes on a technicality worth reading.

| \# | Check | Status | Evidence |
| :---- | :---- | :---- | :---- |
| 1 | One populated \<title\> per route | PASS | 1 tag on every route, all distinct: "Welcome / Home / About / Projects / Status — Sean Dinwiddie" |
| 2 | App's own 404 screen, no Vercel error | PASS | /nope /store /hooks → 404 \+ text/html \+ app shell, x-vercel-error: null. Renders Oops with nav and footer; title "Page not found — Sean Dinwiddie" |
| 3 | No sideways scroll at 375 & 800px | PARTIAL FAIL | 800px: 800 \=== 800, toggle visible. 375px: 613 vs 375, toggle clipped at 474\. See finding 03 |
| 4 | Back lands on /status; every nav pushes | PASS | \["pushState /status","pushState /about"\], histLen 25→26→27, Back → /status, h1 "Application Status" |
| 5 | Download Theme carries real colors | PASS | dark \#0a0e14 / \#b3b1ad / \#e6b450 / \#0f1419; neon \#2b213a / \#fff / \#f92aad / \#241b2f. Differ in 5 values, not just a comment. But see finding 02 |
| 6 | Theme persists across reload | PASS | localStorage\["portfolio.themeMode"\] \= "neon", survives reload as theme-neon rgb(43,33,58) |
| 7 | Mirage default, no white flash | PASS | Cleared storage → theme-mirage rgb(31,36,48). \#1f2430 is set on body in an inline head \<style\>, so it paints before any JS runs |
| 8 | Label reads "Theme: custom" | PASS | Exactly "Theme: custom", class theme-custom. No timestamp anywhere |
| 9 | style\[data-custom-theme\] cleaned up | VACUOUS PASS | Count is 0 after leaving — but also 0 while active, because the tag is never created. Passes for the wrong reason; see finding 01 |
| 10 | Brand is a focusable anchor; /home opens new tabs | PASS | Brand is \<a href="/" tabindex="0"\>, focus works, and still navigates client-side (sentinel survived). All three /home links target="\_blank" rel="noopener noreferrer" |
| 11 | Never theme-undefined | PASS | 40 rapid clicks, 41 observed class transitions, zero invalid values |

# ---

**API, console & network**

## **The API behaves exactly as specified**

`GET /github  -> 200`  
  `keys        profile, repos, languages, cached, authenticated`  
  `repos       33          cached  true      authenticated  false`

`GET /bogus   -> 404   content-type: application/json`  
  `{ "error": "Not Found", "path": "/bogus",`  
    `"availableEndpoints": [ "/", "/status", "/data", "/github",`  
      `"/github/profile", "/github/repos", "/bddTests", "/brandName",`  
      `"/description", "/iniTheme", "/portfolioFeatures",`  
      `"/appProcedures", "/themeToggle", "/nav",`  
      `"/brandNameLoading", "/themeCustom" ] }`  
**Two headers that could not be read, and why that isn't a finding.** access-control-allow-origin and x-vercel-cache are not CORS-safelisted response headers, so page JavaScript cannot read them regardless of whether they are present. What is certain: the cross-origin fetch from portfolio.sdin.dev to api.sdin.dev succeeded, which means ACAO must be present and permissive — a missing or wrong value would have been blocked outright. The literal "\*" and the HIT on repeat requests need a curl \-I; neither is reported either way rather than guessing.

## **Console is quiet apart from the custom-theme error**

Across all five routes: no React key warnings, no hydration mismatches, no unhandled rejections, and zero requests returning ≥ 400 (19 resources per page load). The only app-origin output all session was "Failed to load theme: Object", twice, during custom-theme loads. Everything else came from extensions:  
`// MetaMask - chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn`  
`MaxListenersExceededWarning: Possible EventEmitter memory leak`  
  `detected. 11 close listeners added...`  
`MaxListenersExceededWarning: ... 11 end listeners added...`  
`ObjectMultiplex - orphaned data for stream "app-init-liveness"`  
`ObjectMultiplex - orphaned data for stream "background-liveness"`

`// React DevTools - chrome-extension://fmkadmapgofadopljbjfkapdkoienihi`  
`// proxies console, so app errors get attributed here. The`  
`// "Failed to load theme" line above is YOUR code, not the extension.`

`// External hosts contacted: vercel.live (toolbar), api.sdin.dev`

# ---

**Method & limits**

> * **API blocking used a real-URL iframe with fetch patched**, re-applied in a tight loop until the app's bundle picked it up. realApiReqs: 0 on every run confirms nothing reached the API. This is the method corrected to last round after the srcdoc approach proved confounded.  
> * **Responsive widths were measured in sized iframes** — resize\_window had no effect on the maximised window (innerWidth stayed 1534). Layout and media queries evaluate against the iframe width, so the numbers reflect real narrow-viewport behaviour, but this is not a device or DevTools emulation.  
> * **The file picker cannot be driven.** Native OS dialogs are outside the browser's reach, so custom-theme loads were simulated by setting input.files and dispatching change. Finding 01 carries the caveat this creates and the evidence that argues against it.  
> * **The QR decode was hand-rolled.** The page's CSP blocks external scripts, so jsQR would not load. The 25×25 matrix was reconstructed from the SVG path's stroke segments and all eight mask patterns brute-forced; exactly one produced a valid byte-mode segment, which is itself a good integrity check.  
> * **Two real downloads happened.** Verifying the blob leak required the genuine anchor-click path, so theme-custom.css landed in the Downloads folder twice. The file contents were verified by intercepting the blob, without writing to disk.  
> * **Fork exclusion is corroborated, not proven.** The payload carries no fork or archived flag, so the only available observation is that 45 public repos become 33 shown, consistent with filtering. Confirming each of the 33 is a non-fork means checking GitHub directly.  
> * **A quiet console still isn't proof of no hydration mismatch** — production React strips most development warnings.  
> * **Not a bug, just noted:** a custom theme does not survive a reload; the app falls back to mirage and rewrites the stored mode. That looks like the right call, since a mode name can't carry a stylesheet. And because the boot style is a fixed mirage rather than a script reading storage, a returning visitor on a non-mirage theme gets one frame of mirage before their theme applies — a fair trade for having no white flash at all.

*Round two · portfolio.sdin.dev · 3 new bugs, 10 of 11 regressions holding, 3 features verified*