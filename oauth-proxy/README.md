# tftb Decap OAuth proxy

Minimal Cloudflare Worker scaffold for Decap GitHub login.

**Full setup instructions (OAuth App, secrets, `config.yml`, GitHub access, canon sync):** see [`../admin/README.md`](../admin/README.md).

```bash
cd oauth-proxy
npm install
npx wrangler login          # NEEDS-MANUAL if unavailable
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npm run deploy
```

Then set `backend.base_url` in `admin/config.yml` to the Worker URL (e.g. `https://tftb-decap-oauth.<account>.workers.dev`).

Alternatively, deploy upstream [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy) and use its `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` secret names (this Worker accepts both naming styles).
