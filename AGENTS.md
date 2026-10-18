<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- The WhatsApp floating banner uses bundled movie-wall artwork and the existing bundled brand logo with semantic channel tokens. Why: its imagery must render on independent Cloudflare deployments without Lovable asset URLs.

- Catalog playback and downloads use only unlocked, full-length MP4 streams from the website BFF through `/api/public/movie`, with its media referer; never substitute TV/mobile resources or adaptive manifests. Why: the website's actual full files must match the selected title.
- Website catalog reads may run browser-first with `catalog.functions.ts` as SSR/failure fallback; home sections must never call TV/mobile gateways. Why: hosted egress may receive incomplete website responses.
- Pure website rail-merging and full-stream validation rules live in `web-catalog-rules.ts` with focused tests. Why: rotated empty blocks and locked previews must not hide or replace real content.
- In the browser the home page loads MovieBox web sections directly first and uses the server function only as fallback/SSR. Why: Cloudflare-hosted servers get refused or a trimmed home.
- Activity records capture only signed-in users' actionable clicks, internal destinations, and page paths; never store typed field values or other sensitive input.
- Keep every existing sitemap in the sitemap index and robots file when adding a new content-group sitemap, because external indexes may already rely on those URLs.
- Extra providers (4KHDHub, Dramachi, Addons/Cinemeta, CircleFTP, DhakaFlix) live in `src/lib/providers/*.server.ts` behind `src/lib/providers.functions.ts`; source links resolve lazily via tokens and play/download through `/api/public/stream`. Why: provider sites block browsers and their mirror links expire quickly.
- Packages that break the server runtime (e.g. `qrcode`/pngjs) must be dynamically imported inside browser-only handlers; why: one static import crashed every hosted page with "This page didn't load".
- Provider `resolveSource` probes every mirror and returns only ones that answer with real media bytes (unwrapping `?link=` landing pages); why: hosts list dead mirrors first, which produced "file wasn't available" downloads.
- PayPal orders and captures run server-side behind `paypal.functions.ts`, while the v6 Web SDK renders PayPal's real button and modal approval UI; the public client ID lives in code and `PAYPAL_CLIENT_SECRET` stays server-only.
- Card payments use Whop's express "whop-pay" button (floating Whop window) with a floating embedded checkout as fallback, never a new tab or inline full checkout; why: user wants a one-click button that opens Whop's overlay on the page.
- Mobile money (deposits, payouts, wallet balances) runs through Relworx via the Railway payments backend in `src/lib/relworx.ts` (CORS-open, browser-called); PawaPay was removed. Why: user chose the Relworx backend.
- Mobile money network detection uses only the national prefix table in `countries.ts`.
- Catalog and subtitle downloads open the same-origin attachment URL directly so the browser's own download manager handles them; no in-app download panel. Why: user wants downloads to behave like the MovieBox website.
- Home rows come only from the MovieBox web home (retried); no search-built or TV-app fallback rows. Why: fallbacks showed outdated sections on other hosts.
- Admin uploads write through the site's authenticated Worker endpoint to the `MOVIE_MAX_MEDIA` Cloudflare R2 binding and serve from the same origin; never use the retired Railway signer. Why: uploads must work on Cloudflare without an external backend URL.
- Display the uploaded MOVIEMAX logo as a file bundled in the project and derive the browser icon from that same upload; keep brand gradients in global CSS and fall back to a bundled/loaded sans font when the requested licensed font is unavailable. Why: visual identity stays consistent without committing a binary or assuming a font license.
- Keep the desktop sidebar as five icon-only links backed by the existing category routes, with TV as a series category and icons bundled in the project. Why: externally hosted asset links break when the site is deployed outside Lovable (e.g. Cloudflare).
- Display catalog collections and searches only from the MovieBox web BFF, accepting any real subject-bearing home block and retaining the last good home response during brief failures. Why: strict block names and empty replacement responses made genuine web sections disappear intermittently.
