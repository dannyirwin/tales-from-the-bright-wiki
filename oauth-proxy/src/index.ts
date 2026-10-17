/**
 * Character login + wiki suggest → GitHub issues.
 *
 * Secrets:
 *   GITHUB_TOKEN        — PAT with issues:write
 *   PLAYER_PASSWORDS    — {"Josh":"grag",...}
 *   SESSION_SECRET      — long random string (HMAC for session tokens)
 *
 * Vars:
 *   GITHUB_REPO, WIKI_ORIGIN, WIKI_BASE, SESSION_DAYS
 */

interface Env {
  GITHUB_TOKEN: string
  PLAYER_PASSWORDS: string
  SESSION_SECRET: string
  GITHUB_REPO?: string
  WIKI_ORIGIN?: string
  WIKI_BASE?: string
  SESSION_DAYS?: string
}

const DEFAULT_REPO = "dannyirwin/tales-from-the-bright-wiki"
const DEFAULT_WIKI_BASE = "https://dannyirwin.github.io/tales-from-the-bright-wiki"
const DEFAULT_WIKI_ORIGIN = "https://dannyirwin.github.io"

function wikiBase(env: Env) {
  return env.WIKI_BASE || DEFAULT_WIKI_BASE
}

function corsHeaders(env: Env, request: Request): HeadersInit {
  const origin = request.headers.get("Origin") || ""
  const allowedOrigin = env.WIKI_ORIGIN || DEFAULT_WIKI_ORIGIN
  const allow =
    origin === allowedOrigin ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
      ? origin || allowedOrigin
      : allowedOrigin
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const aa = enc.encode(a)
  const bb = enc.encode(b)
  if (aa.length !== bb.length) return false
  let out = 0
  for (let i = 0; i < aa.length; i++) out |= aa[i] ^ bb[i]
  return out === 0
}

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array
  if (typeof data === "string") bytes = new TextEncoder().encode(data)
  else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data)
  else bytes = data
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

async function signToken(env: Env, name: string): Promise<{ token: string; exp: number }> {
  const days = Math.max(1, parseInt(env.SESSION_DAYS || "30", 10) || 30)
  const exp = Math.floor(Date.now() / 1000) + days * 86400
  const header = b64urlJson({ alg: "HS256", typ: "JWT" })
  const payload = b64urlJson({ sub: name, exp })
  const key = await hmacKey(env.SESSION_SECRET)
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  )
  return { token: `${header}.${payload}.${b64url(sig)}`, exp }
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function verifyToken(env: Env, token: string): Promise<string | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [header, payload, sig] = parts
  const key = await hmacKey(env.SESSION_SECRET)
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(sig),
    new TextEncoder().encode(`${header}.${payload}`),
  )
  if (!ok) return null
  try {
    const json = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)))
    if (!json.sub || typeof json.exp !== "number") return null
    if (json.exp < Math.floor(Date.now() / 1000)) return null
    return String(json.sub)
  } catch {
    return null
  }
}

function verifyPlayer(env: Env, name: string, password: string): string | null {
  let map: Record<string, string>
  try {
    map = JSON.parse(env.PLAYER_PASSWORDS || "{}")
  } catch {
    return null
  }
  const key = name.trim().toLowerCase()
  const entry = Object.entries(map).find(([k]) => k.toLowerCase() === key)
  if (!entry) return null
  // Case-insensitive for both player name and character name
  if (!timingSafeEqual(entry[1].trim().toLowerCase(), password.trim().toLowerCase())) return null
  return entry[0]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function pageShell(title: string, body: string, theme: "light" | "dark" = "light"): string {
  const savedTheme = theme === "dark" ? "dark" : "light"
  return `<!DOCTYPE html>
<html lang="en" saved-theme="${savedTheme}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;700&family=Source+Sans+Pro:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet" />
  <style>
    :root, [saved-theme="light"] {
      --light: #faf8f8;
      --lightgray: #e5e5e5;
      --gray: #b8b8b8;
      --darkgray: #4e4e4e;
      --dark: #2b2b2b;
      --secondary: #284b63;
      --tertiary: #84a59d;
      --highlight: rgba(143, 159, 169, 0.15);
      --titleFont: "Schibsted Grotesk", system-ui, sans-serif;
      --bodyFont: "Source Sans Pro", system-ui, sans-serif;
    }
    [saved-theme="dark"] {
      --light: #161618;
      --lightgray: #393639;
      --gray: #646464;
      --darkgray: #d4d4d4;
      --dark: #ebebec;
      --secondary: #7b97aa;
      --tertiary: #84a59d;
      --highlight: rgba(143, 159, 169, 0.15);
    }
    @media (prefers-color-scheme: dark) {
      :root:not([saved-theme="light"]):not([saved-theme="dark"]) {
        --light: #161618;
        --lightgray: #393639;
        --gray: #646464;
        --darkgray: #d4d4d4;
        --dark: #ebebec;
        --secondary: #7b97aa;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--bodyFont);
      font-size: 1rem;
      line-height: 1.55;
      color: var(--darkgray);
      background: var(--light);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 8vh 1rem 2rem;
    }
    /* Match wiki suggest modal chrome */
    .shell {
      width: min(26rem, 100%);
      background: var(--light);
      color: var(--darkgray);
      border: 1px solid var(--lightgray);
      border-radius: 0.5rem;
      padding: 1.1rem 1.2rem 1.25rem;
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
    }
    .brand {
      margin: 0 0 0.85rem;
      font-family: var(--titleFont);
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--dark);
      letter-spacing: -0.02em;
    }
    h1 {
      margin: 0 0 0.35rem;
      font-family: var(--titleFont);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--dark);
    }
    .meta {
      color: var(--gray);
      font-size: 0.85rem;
      margin: 0 0 0.85rem;
    }
    label {
      display: block;
      font-weight: 600;
      font-size: 0.85rem;
      margin: 0.7rem 0 0.25rem;
      color: var(--darkgray);
    }
    input, textarea {
      width: 100%;
      font: inherit;
      padding: 0.45rem 0.5rem;
      border: 1px solid var(--lightgray);
      border-radius: 0.3rem;
      background: var(--light);
      color: var(--darkgray);
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: var(--secondary);
    }
    textarea { min-height: 10rem; resize: vertical; }
    .actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }
    .actions button,
    button.primary {
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.4rem 0.9rem;
      height: 2.25rem;
      border-radius: 999px;
      cursor: pointer;
      border: 1px solid var(--secondary);
      background: var(--secondary);
      color: var(--light);
    }
    .actions button:hover,
    button.primary:hover {
      color: var(--light);
      filter: brightness(1.05);
    }
    .actions button:disabled,
    button.primary:disabled {
      opacity: 0.55;
      cursor: default;
      pointer-events: none;
      filter: none;
    }
    .err { color: #b00020; margin-top: 0.65rem; font-size: 0.9rem; }
    .ok { color: #0a7; margin-top: 0.65rem; font-size: 0.9rem; }
    .pending { color: var(--gray); margin-top: 0.65rem; font-size: 0.9rem; }
    .quote {
      border-left: 3px solid var(--secondary);
      padding-left: 0.75rem;
      margin: 0.75rem 0;
      white-space: pre-wrap;
      color: var(--gray);
    }
    a { color: var(--secondary); font-weight: 600; text-decoration: none; }
    a:hover { color: var(--tertiary); }
  </style>
</head>
<body>
<div class="shell">
${body}
</div>
</body>
</html>`
}

function loginHtml(returnUrl: string, theme: "light" | "dark" = "light"): string {
  const ret = escapeHtml(returnUrl)
  return pageShell(
    "Sign in — Tales From the Bright",
    `
  <p class="brand">Tales From the Bright</p>
  <h1>Sign in</h1>
  <p class="meta">Enter your name and your previous character’s name.</p>
  <form id="f">
    <input type="hidden" name="returnUrl" value="${ret}" />
    <label for="player">Your name</label>
    <input id="player" name="player" required autocomplete="username" autofocus placeholder="e.g. Danny" />
    <label for="password">Your previous character’s name</label>
    <input id="password" name="password" type="text" required autocomplete="off" placeholder="e.g. Sir Martin" />
    <div class="actions">
      <button type="submit" class="primary">Enter the wiki</button>
    </div>
    <p id="msg" class="err" hidden></p>
  </form>
  <script>
    const form = document.getElementById("f");
    const msg = document.getElementById("msg");
    const btn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (btn.disabled) return;
      msg.hidden = true;
      btn.disabled = true;
      btn.textContent = "Signing in…";
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player: data.player, password: data.password }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          msg.hidden = false;
          msg.className = "err";
          msg.textContent = json.error || "Login failed";
          btn.disabled = false;
          btn.textContent = "Enter the wiki";
          return;
        }
        msg.hidden = false;
        msg.className = "ok";
        msg.textContent = "Signed in…";
        btn.textContent = "Signed in";
        const returnUrl = data.returnUrl || ${JSON.stringify(DEFAULT_WIKI_BASE)};
        const u = new URL(returnUrl, ${JSON.stringify(DEFAULT_WIKI_BASE)});
        u.hash = "tftb_token=" + encodeURIComponent(json.token);
        location.href = u.toString();
      } catch {
        msg.hidden = false;
        msg.className = "err";
        msg.textContent = "Network error — try again.";
        btn.disabled = false;
        btn.textContent = "Enter the wiki";
      }
    });
  </script>`,
    theme,
  )
}

function suggestHtml(
  prefill: {
    page: string
    title: string
    url: string
    quote: string
  },
  theme: "light" | "dark" = "light",
): string {
  const page = escapeHtml(prefill.page)
  const title = escapeHtml(prefill.title)
  const url = escapeHtml(prefill.url)
  const quote = escapeHtml(prefill.quote)
  const defaultSubject = escapeHtml(
    prefill.title
      ? `Edit: ${prefill.title}`
      : prefill.page
        ? `Edit: ${prefill.page}`
        : "Wiki suggestion",
  )
  const quoteBlock = prefill.quote
    ? `<p class="meta">Quoted from the page:</p><blockquote class="quote">${quote}</blockquote>`
    : ""
  return pageShell(
    "Suggest an edit — Tales From the Bright",
    `
  <p class="brand">Tales From the Bright</p>
  <h1>Suggest an edit</h1>
  <p class="meta">
    ${title || page ? `About: <strong>${title || page}</strong>` : "General wiki suggestion"}
    ${url ? `<br/><a href="${url}">${url}</a>` : ""}
  </p>
  ${quoteBlock}
  <form id="f">
    <input type="hidden" name="page" value="${page}" />
    <input type="hidden" name="pageTitle" value="${title}" />
    <input type="hidden" name="pageUrl" value="${url}" />
    <input type="hidden" name="quote" value="${quote}" />
    <label for="subject">Subject</label>
    <input id="subject" name="subject" required value="${defaultSubject}" />
    <label for="body">What should change?</label>
    <textarea id="body" name="body" required placeholder="Describe the edit, or paste corrected text…"></textarea>
    <div class="actions">
      <button type="submit" class="primary">Send suggestion</button>
    </div>
    <p id="msg" hidden></p>
  </form>
  <script>
    const TOKEN_KEY = "tftb_session";
    const LOGIN = "/login?return=" + encodeURIComponent(location.href);
    function session() {
      try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); } catch { return null; }
    }
    // Token passed from wiki via #tftb_token= (localStorage is per-origin)
    (function captureToken() {
      var hash = location.hash || "";
      if (hash.indexOf("tftb_token=") < 0) return;
      var raw = hash.replace(/^#/, "");
      var token = null;
      if (raw.indexOf("tftb_token=") === 0) token = decodeURIComponent(raw.slice("tftb_token=".length));
      else token = new URLSearchParams(raw).get("tftb_token");
      if (!token) return;
      var exp = null;
      try {
        var payload = token.split(".")[1];
        var pad = payload.length % 4 === 0 ? "" : "=".repeat(4 - (payload.length % 4));
        exp = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/") + pad)).exp || null;
      } catch (e) {}
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: token, exp: exp }));
      history.replaceState(null, "", location.pathname + location.search);
    })();
    const s = session();
    if (!s || !s.token || (s.exp && s.exp * 1000 < Date.now())) {
      location.href = LOGIN;
    }
    const form = document.getElementById("f");
    const msg = document.getElementById("msg");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.hidden = true;
      const cur = session();
      if (!cur?.token) { location.href = LOGIN; return; }
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + cur.token,
          },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        msg.hidden = false;
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          location.href = LOGIN;
          return;
        }
        if (!res.ok) {
          msg.className = "err";
          msg.textContent = json.error || ("Failed (" + res.status + ")");
          return;
        }
        msg.className = "ok";
        msg.textContent = "Thanks — suggestion sent.";
        form.querySelector("textarea").value = "";
      } catch {
        msg.hidden = false;
        msg.className = "err";
        msg.textContent = "Network error — try again.";
      }
    });
  </script>`,
    theme,
  )
}

async function createIssue(
  env: Env,
  opts: { title: string; body: string },
): Promise<{ number: number; html_url: string }> {
  const repo = env.GITHUB_REPO || DEFAULT_REPO
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tftb-wiki-suggest",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: opts.title,
      body: opts.body,
      labels: ["wiki-suggestion"],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    // Retry without label if label missing
    if (res.status === 422 && text.includes("label")) {
      const retry = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "tftb-wiki-suggest",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: opts.title, body: opts.body }),
      })
      if (!retry.ok) throw new Error(`GitHub ${retry.status}`)
      return retry.json() as Promise<{ number: number; html_url: string }>
    }
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 400)}`)
  }
  return res.json() as Promise<{ number: number; html_url: string }>
}

function bearer(request: Request): string | null {
  const h = request.headers.get("Authorization") || ""
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m?.[1]?.trim() || null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(env, request)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors })
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      const headers = { "Content-Type": "application/json", ...cors }
      if (!env.PLAYER_PASSWORDS || !env.SESSION_SECRET) {
        return Response.json({ error: "Server not configured" }, { status: 500, headers })
      }
      let data: { player?: string; password?: string }
      try {
        data = await request.json()
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers })
      }
      const name = verifyPlayer(env, data.player || "", data.password || "")
      if (!name) {
        return Response.json({ error: "Wrong name or previous character’s name" }, { status: 401, headers })
      }
      const { token, exp } = await signToken(env, name)
      return Response.json({ ok: true, token, name, exp }, { headers })
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      const headers = { "Content-Type": "application/json", ...cors }
      const token = bearer(request)
      if (!token || !env.SESSION_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers })
      }
      const name = await verifyToken(env, token)
      if (!name) return Response.json({ error: "Unauthorized" }, { status: 401, headers })
      return Response.json({ ok: true, name }, { headers })
    }

    if (url.pathname === "/api/suggest" && request.method === "POST") {
      const headers = { "Content-Type": "application/json", ...cors }
      if (!env.GITHUB_TOKEN || !env.SESSION_SECRET) {
        return Response.json({ error: "Server not configured" }, { status: 500, headers })
      }
      const token = bearer(request)
      const player = token ? await verifyToken(env, token) : null
      if (!player) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers })
      }
      let data: Record<string, string>
      try {
        data = (await request.json()) as Record<string, string>
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400, headers })
      }
      const subject = (data.subject || "").trim()
      const body = (data.body || "").trim()
      const page = (data.page || "").trim()
      const pageTitle = (data.pageTitle || "").trim()
      const pageUrl = (data.pageUrl || "").trim()
      // Prefer `original` (selection or loaded note); keep `quote` for older clients
      const original = (data.original || data.quote || "").trim()
      if (!subject || !body) {
        return Response.json({ error: "Missing fields" }, { status: 400, headers })
      }
      if (body.length > 50000 || subject.length > 200 || original.length > 50000) {
        return Response.json({ error: "Too long" }, { status: 400, headers })
      }
      const issueBody = [
        `**From:** ${player}`,
        pageTitle || page ? `**Page:** ${pageTitle || page}` : null,
        page ? `**Slug:** \`${page}\`` : null,
        pageUrl ? `**URL:** ${pageUrl}` : null,
        original ? `\n**Original:**\n\n\`\`\`md\n${original}\n\`\`\`\n` : null,
        body,
      ]
        .filter(Boolean)
        .join("\n")
      try {
        const issue = await createIssue(env, {
          title: `[wiki] ${subject}`.slice(0, 240),
          body: issueBody,
        })
        return Response.json({ ok: true, url: issue.html_url, number: issue.number }, { headers })
      } catch (e) {
        console.error(e instanceof Error ? e.message : e)
        return Response.json({ error: "Could not create issue" }, { status: 502, headers })
      }
    }

    if (url.pathname === "/login") {
      const ret = url.searchParams.get("return") || wikiBase(env)
      const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light"
      return new Response(loginHtml(ret, theme), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    if (url.pathname === "/" || url.pathname === "/suggest") {
      const page = url.searchParams.get("page") || ""
      const title = url.searchParams.get("title") || ""
      let pageUrl = url.searchParams.get("url") || ""
      const quote = url.searchParams.get("quote") || ""
      const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light"
      if (!pageUrl && page) pageUrl = `${wikiBase(env)}/${page.replace(/^\//, "")}`
      return new Response(suggestHtml({ page, title, url: pageUrl, quote }, theme), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    return new Response("Not found", { status: 404 })
  },
}
