# felix-kramer.com

Public static homepage for [felix-kramer.com](https://felix-kramer.com) — football
intelligence simulators (match, tournament, league, bracket, draft) plus profile and
blog. **Zero hosting cost**: pure frontend (SvelteKit + TypeScript), prerendered to
static HTML, served by GitHub Pages. No signup, no login, no backend.

Plan: [`PLAN_STATIC_HOMEPAGE.md`](https://github.com/Team-Kramer/felix-kramer-saas/blob/main/PLAN_STATIC_HOMEPAGE.md)
(private repo).

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes) + [adapter-static](https://github.com/sveltejs/kit/tree/main/packages/adapter-static)
- [Tailwind CSS 4](https://tailwindcss.com) with the **Green Deck** design tokens
  (synced from `felix-kramer-saas/frontend/src/app.css`)
- [Apple Design](https://developer.apple.com/design/) motion rules: springs
  (damping 1.0, no overshoot), interruptibility, translucent materials,
  size-specific typography
- [Vitest](https://vitest.dev) + Testing Library + axe-core

## Development

```bash
pnpm install
pnpm dev        # local dev server
pnpm check      # svelte-check + tsc
pnpm test       # vitest
pnpm build      # prerender all routes to build/
pnpm preview    # serve the production build locally
pnpm sync-tokens  # warn-only Green Deck drift check vs. the SaaS repo
```

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/pages.yml`) runs
`check → test → build` and deploys `build/` to GitHub Pages.

**One-time setup**: in the repo settings, set
*Pages → Build and deployment → Source* to **GitHub Actions** (it was previously
"Deploy from a branch"). The `CNAME` file keeps `felix-kramer.com` pointed at the
site.

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing: hero → profile → blog → simulator showcase → features → stats |
| `/match` | Match simulator (Phase 2) |
| `/tournament` | Tournament simulator (Phase 2) |
| `/league` | League simulator (Phase 2) |
| `/bracket` | Knockout bracket simulator (Phase 2) |
| `/draft` | Draft simulator (Phase 2) |
| `/about` | Profile |
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post (static markdown in `content/blog/`) |

## Blog

Add a post by dropping a markdown file into `content/blog/` with a
`title:`/`date:` frontmatter block, then register it in
[`src/lib/blog.ts`](src/lib/blog.ts). Posts are prerendered at build time.
