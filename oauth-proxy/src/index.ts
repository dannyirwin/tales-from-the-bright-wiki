/**
 * Cloudflare Worker GitHub OAuth proxy for Decap CMS.
 * Pattern based on https://github.com/sterlingwes/decap-proxy
 *
 * Deploy: see ../admin/README.md (NEEDS-MANUAL if wrangler auth unavailable)
 */

import { OAuthClient } from "./oauth"

interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  /** Also accepted: GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET (sterlingwes/decap-proxy names) */
  GITHUB_OAUTH_ID?: string
  GITHUB_OAUTH_SECRET?: string
  GITHUB_REPO_PRIVATE?: string
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function clientId(env: Env): string {
  return env.GITHUB_CLIENT_ID || env.GITHUB_OAUTH_ID || ""
}

function clientSecret(env: Env): string {
  return env.GITHUB_CLIENT_SECRET || env.GITHUB_OAUTH_SECRET || ""
}

const createOAuth = (env: Env) => {
  return new OAuthClient({
    id: clientId(env),
    secret: clientSecret(env),
    target: {
      tokenHost: "https://github.com",
      tokenPath: "/login/oauth/access_token",
      authorizePath: "/login/oauth/authorize",
    },
  })
}

const handleAuth = async (url: URL, env: Env) => {
  const provider = url.searchParams.get("provider")
  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 })
  }

  if (!clientId(env) || !clientSecret(env)) {
    return new Response("OAuth secrets not configured", { status: 500 })
  }

  const repoIsPrivate = env.GITHUB_REPO_PRIVATE != undefined && env.GITHUB_REPO_PRIVATE !== "0"
  const repoScope = repoIsPrivate ? "repo,user" : "public_repo,user"

  const oauth2 = createOAuth(env)
  const authorizationUri = oauth2.authorizeURL({
    redirect_uri: `https://${url.hostname}/callback?provider=github`,
    scope: repoScope,
    state: randomHex(4),
  })

  return new Response(null, { headers: { location: authorizationUri }, status: 301 })
}

const callbackScriptResponse = (status: string, token: string) => {
  const authMessage = `authorization:github:${status}:${JSON.stringify({ token })}`
  const html = `<!DOCTYPE html>
<html>
<head><title>Authorizing Decap…</title></head>
<body>
<p>Authorizing Decap…</p>
<script>
const receiveMessage = () => {
  window.opener.postMessage(${JSON.stringify(authMessage)}, "*");
  window.removeEventListener("message", receiveMessage, false);
};
window.addEventListener("message", receiveMessage, false);
window.opener.postMessage("authorizing:github", "*");
</script>
</body>
</html>`
  return new Response(html, { headers: { "Content-Type": "text/html" } })
}

const handleCallback = async (url: URL, env: Env) => {
  const provider = url.searchParams.get("provider")
  if (provider !== "github") {
    return new Response("Invalid provider", { status: 400 })
  }

  const code = url.searchParams.get("code")
  if (!code) {
    return new Response("Missing code", { status: 400 })
  }

  const oauth2 = createOAuth(env)
  const accessToken = await oauth2.getToken({
    code,
    redirect_uri: `https://${url.hostname}/callback?provider=github`,
  })
  return callbackScriptResponse("success", accessToken)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/auth") {
      return handleAuth(url, env)
    }
    if (url.pathname === "/callback") {
      return handleCallback(url, env)
    }
    return new Response("Hello 👋 — tftb Decap OAuth proxy")
  },
}
