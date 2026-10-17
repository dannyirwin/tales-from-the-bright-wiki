# Wiki auth + suggest (character password)

Thin gate for the published wiki and suggest-edit flow. Players sign in with **their name** + **character name** as the password (no GitHub).

## Flow

1. Open the wiki → redirected to Worker `/login` if not signed in  
2. After login, return to the wiki with a session token (stored in `localStorage`)  
3. **Suggest an edit** opens the Worker form (optional: select text first to quote it)  
4. Worker opens a GitHub issue via bot `GITHUB_TOKEN`

This is a soft client-side gate (HTML is still on public Pages). Suggest API always verifies the signed token.

## Cloudflare Root directory: `oauth-proxy`

Build: `npm install`  
Deploy: `npx wrangler deploy`

### Secrets

```bash
cd oauth-proxy
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put PLAYER_PASSWORDS   # {"Josh":"grag","Arvind":"ensel",...}
npx wrangler secret put SESSION_SECRET     # openssl rand -hex 32
```

Shuffle player access anytime by updating `PLAYER_PASSWORDS`.

### Wiki Worker URL

[`quartz/components/tftbAuth.ts`](../quartz/components/tftbAuth.ts) — `TFTB_AUTH_WORKER` must match your Worker URL, then publish the wiki.

## Canon

Issues are suggestions. Apply text in Obsidian, then `npm run publish`.
