# Wiki “Suggest an edit” (password → GitHub issue)

Players open a simple form, enter the name/password you gave them, and a **GitHub issue** is opened by a bot PAT. No Decap, no player GitHub accounts.

## Cloudflare (this folder = Root directory)

Build: `npm install`  
Deploy: `npx wrangler deploy`  
Root: `oauth-proxy`

### Secrets

```bash
cd oauth-proxy
npx wrangler secret put GITHUB_TOKEN        # PAT with issues:write on the wiki repo
npx wrangler secret put PLAYER_PASSWORDS    # JSON, e.g. {"alice":"s3cret","bob":"other"}
```

Shuffle passwords anytime by re-running `PLAYER_PASSWORDS` with a new JSON map.

### One-time GitHub setup

1. Create a fine-grained PAT (or classic) that can open issues on `dannyirwin/tales-from-the-bright-wiki`.
2. Optional: create label `wiki-suggestion` on the repo (Worker will try to apply it).
3. After deploy, note the Worker URL (e.g. `https://tales-from-the-bright-wiki-decap.<account>.workers.dev`).

### Point the wiki footer link at the Worker

Set `SUGGEST_FORM_URL` in [`../quartz/components/SuggestEdit.tsx`](../quartz/components/SuggestEdit.tsx) to that Worker origin, then publish the wiki (`npm run publish` / merge to `v5`).

## Canon

Issues are suggestions only. Apply accepted text in the Obsidian vault, then `npm run publish`.
