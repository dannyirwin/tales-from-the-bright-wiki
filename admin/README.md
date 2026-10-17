# Player wiki editor (Decap CMS)

Players edit markdown via Decap at:

**https://dannyirwin.github.io/tales-from-the-bright-wiki/admin/**

Quartz still builds the public site from `content/` on GitHub Pages. Decap writes to GitHub (editorial workflow → PRs against `v5`).

---

## 1. Cloudflare Worker OAuth — NEEDS-MANUAL

GitHub Pages cannot hold OAuth client secrets. Decap talks to a small Cloudflare Worker that completes the GitHub OAuth dance.

### 1.1 Create a GitHub OAuth App

1. Open [GitHub → Developer settings → OAuth Apps → New](https://github.com/settings/applications/new).
2. **Application name:** e.g. `Tales From the Bright Wiki (Decap)`.
3. **Homepage URL:** your Worker URL once known, e.g. `https://tftb-decap-oauth.<account>.workers.dev`  
   (placeholder until deploy: `https://tftb-decap-oauth.dannyirwin.workers.dev`).
4. **Authorization callback URL:** `https://WORKER_HOST/callback`  
   Example: `https://tftb-decap-oauth.<account>.workers.dev/callback`.
5. Save the **Client ID** and generate a **Client Secret**.

### 1.2 Deploy the Worker

Either use the scaffold in [`../oauth-proxy/`](../oauth-proxy/) or upstream [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy).

**Scaffold (this repo):**

```bash
cd oauth-proxy
npm install
npx wrangler login          # opens browser — NEEDS-MANUAL if no Cloudflare access
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npm run deploy
```

**Upstream decap-proxy** uses secret names `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` instead; our Worker accepts either pair. Set `GITHUB_REPO_PRIVATE=0` (default) while the wiki repo is public.

Confirm the Worker root URL shows a hello message, then visit `/auth?provider=github` only via Decap’s login button (not manually for production use).

### 1.3 Point Decap at the Worker

Edit [`config.yml`](./config.yml):

```yaml
backend:
  base_url: https://YOUR_WORKER.workers.dev   # replace PLACEHOLDER
  auth_endpoint: auth
```

Commit and deploy the wiki so Pages serves the updated config under `/admin/config.yml`.

---

## 2. GitHub access — NEEDS-MANUAL (collaborators)

### Protect `v5` (PR required) — NEEDS-MANUAL

Direct pushes to `v5` should go through PRs so player Decap edits can be reviewed.

**Do not** use classic “Require a pull request” branch protection alone on this personal repo: it also blocks the GitHub Actions version-bump push in `.github/workflows/deploy.yml`, and personal repos cannot grant an Actions bypass via the classic API.

**Preferred (UI):** Repo → Settings → Rules → Rulesets → New branch ruleset:

1. Target branch: `v5`.
2. Require a pull request before merging (1 approval is fine).
3. Under **Bypass list**, add **GitHub Actions** and your admin account (so deploy bumps + `npm run publish` still work).
4. Enable the ruleset.

Until that ruleset exists, Decap’s `editorial_workflow` still opens PRs for player edits; merge them manually.

### Invite players as Write collaborators — NEEDS-MANUAL

1. Repo → Settings → Collaborators → Add people.
2. Grant **Write** so Decap can open PRs / use the editorial workflow.
3. Players sign in at `/admin/` with GitHub (via the Worker OAuth App).

Decap `publish_mode: editorial_workflow` opens PRs instead of pushing straight to `v5`.

---

## 3. Canon workflow (after merging a player PR)

Accepted wiki text lives in two places:

| Role | Path |
|------|------|
| Public / Git source of truth for Pages | `content/` in this repo |
| GM Obsidian vault (canon working copy) | `../Tales From the Bright` |

**After you merge a player PR into `v5`:**

1. Copy the accepted files from `content/` into the Obsidian vault at  
   `../Tales From the Bright`  
   (same relative paths: e.g. `content/Locations/Lumenhold.md` → `Locations/Lumenhold.md`).
2. Review in Obsidian (tags, wikilinks, DM-only `%%` blocks).
3. From this wiki repo, publish the vault back out when ready:

```bash
npm run publish
# or: npm run publish -- "your message"
```

That runs `sync-vault.mjs` (vault → `content/`), commits, and pushes `v5` so Pages rebuilds.

**Do not** treat Decap-only `content/` edits as permanent GM canon until they have been copied into the vault (otherwise the next `npm run publish` can overwrite them from Obsidian).

---

## Local builds (include `/admin`)

CI copies `admin/` into the Pages artifact after Quartz builds. Locally:

```bash
npm run build        # quartz build + copy admin → public/admin
# or after any quartz build:
npm run copy-admin
```

Then open `public/admin/` via whatever static server you use. `npm run preview` syncs the vault, runs Quartz `--serve`, and copies admin into `public/admin/` after the initial build.
