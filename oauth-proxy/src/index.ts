/**
 * Password-gated "suggest an edit" → GitHub issue (bot PAT).
 * Players never need GitHub accounts.
 *
 * Secrets (wrangler secret put …):
 *   GITHUB_TOKEN       — fine-scoped PAT (issues:write) or classic with public_repo
 *   PLAYER_PASSWORDS   — JSON map {"alice":"pass1","bob":"pass2"}
 *
 * Optional vars:
 *   GITHUB_REPO        — default dannyirwin/tales-from-the-bright-wiki
 *   WIKI_ORIGIN        — CORS allowlist for wiki origin (optional)
 */

interface Env {
  GITHUB_TOKEN: string
  PLAYER_PASSWORDS: string
  GITHUB_REPO?: string
  WIKI_ORIGIN?: string
}

const DEFAULT_REPO = "dannyirwin/tales-from-the-bright-wiki"
const WIKI_BASE = "https://dannyirwin.github.io/tales-from-the-bright-wiki"

function corsHeaders(env: Env, request: Request): HeadersInit {
  const origin = request.headers.get("Origin") || ""
  const allowed = env.WIKI_ORIGIN || WIKI_BASE
  const allow = origin === allowed || origin.startsWith("http://localhost") ? origin : allowed
  return {
    "Access-Control-Allow-Origin": allow || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const aa = enc.encode(a)
  const bb = enc.encode(b)
  if (aa.length !== bb.length) {
    // still compare to reduce trivial timing leaks on length
    let diff = aa.length ^ bb.length
    const n = Math.max(aa.length, bb.length)
    for (let i = 0; i < n; i++) {
      diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0)
    }
    return false
  }
  let out = 0
  for (let i = 0; i < aa.length; i++) out |= aa[i] ^ bb[i]
  return out === 0
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
  if (!timingSafeEqual(entry[1], password)) return null
  return entry[0]
}

function formHtml(prefill: { page: string; title: string; url: string }): string {
  const page = escapeHtml(prefill.page)
  const title = escapeHtml(prefill.title)
  const url = escapeHtml(prefill.url)
  const defaultSubject = escapeHtml(
    prefill.title ? `Edit: ${prefill.title}` : prefill.page ? `Edit: ${prefill.page}` : "Wiki suggestion",
  )
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Suggest an edit — Tales From the Bright</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { max-width: 36rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1.25rem; }
    label { display: block; font-weight: 600; margin: 0.75rem 0 0.25rem; }
    input, textarea { width: 100%; box-sizing: border-box; padding: 0.5rem; font: inherit; }
    textarea { min-height: 10rem; resize: vertical; }
    button { margin-top: 1rem; padding: 0.55rem 1rem; font: inherit; cursor: pointer; }
    .err { color: #b00020; margin-top: 0.75rem; }
    .ok { color: #0a7; margin-top: 0.75rem; }
    a { color: inherit; }
  </style>
</head>
<body>
  <h1>Suggest an edit</h1>
  <p class="meta">
    ${title || page ? `About: <strong>${title || page}</strong>` : "General wiki suggestion"}
    ${url ? `<br/><a href="${url}">${url}</a>` : ""}
  </p>
  <form id="f">
    <input type="hidden" name="page" value="${page}" />
    <input type="hidden" name="pageTitle" value="${title}" />
    <input type="hidden" name="pageUrl" value="${url}" />
    <label for="player">Your name</label>
    <input id="player" name="player" required autocomplete="username" />
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required autocomplete="current-password" />
    <label for="subject">Subject</label>
    <input id="subject" name="subject" required value="${defaultSubject}" />
    <label for="body">What should change?</label>
    <textarea id="body" name="body" required placeholder="Describe the edit, or paste the corrected text…"></textarea>
    <button type="submit">Send suggestion</button>
    <p id="msg" hidden></p>
  </form>
  <script>
    const form = document.getElementById("f");
    const msg = document.getElementById("msg");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.hidden = true;
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        msg.hidden = false;
        if (!res.ok) {
          msg.className = "err";
          msg.textContent = json.error || ("Failed (" + res.status + ")");
          return;
        }
        msg.className = "ok";
        msg.innerHTML = "Thanks — suggestion sent." +
          (json.url ? ' <a href="' + json.url + '" target="_blank" rel="noopener">View issue</a> (DM only).' : "");
        form.querySelector("textarea").value = "";
      } catch (err) {
        msg.hidden = false;
        msg.className = "err";
        msg.textContent = "Network error — try again.";
      }
    });
  </script>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 400)}`)
  }
  return res.json() as Promise<{ number: number; html_url: string }>
}

async function handleSuggest(request: Request, env: Env): Promise<Response> {
  const headers = { "Content-Type": "application/json", ...corsHeaders(env, request) }
  if (!env.GITHUB_TOKEN || !env.PLAYER_PASSWORDS) {
    return Response.json({ error: "Server not configured" }, { status: 500, headers })
  }

  let data: Record<string, string>
  try {
    data = (await request.json()) as Record<string, string>
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400, headers })
  }

  const player = (data.player || "").trim()
  const password = data.password || ""
  const subject = (data.subject || "").trim()
  const body = (data.body || "").trim()
  const page = (data.page || "").trim()
  const pageTitle = (data.pageTitle || "").trim()
  const pageUrl = (data.pageUrl || "").trim()

  if (!player || !password || !subject || !body) {
    return Response.json({ error: "Missing fields" }, { status: 400, headers })
  }
  if (body.length > 20000 || subject.length > 200) {
    return Response.json({ error: "Too long" }, { status: 400, headers })
  }

  const verifiedName = verifyPlayer(env, player, password)
  if (!verifiedName) {
    return Response.json({ error: "Wrong name or password" }, { status: 401, headers })
  }

  const issueBody = [
    `**From:** ${verifiedName}`,
    pageTitle || page ? `**Page:** ${pageTitle || page}` : null,
    page ? `**Slug:** \`${page}\`` : null,
    pageUrl ? `**URL:** ${pageUrl}` : null,
    "",
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
    const msg = e instanceof Error ? e.message : "GitHub error"
    // Don't leak token details to clients
    console.error(msg)
    return Response.json({ error: "Could not create issue" }, { status: 502, headers })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) })
    }

    if (url.pathname === "/api/suggest" && request.method === "POST") {
      return handleSuggest(request, env)
    }

    if (url.pathname === "/" || url.pathname === "/suggest") {
      const page = url.searchParams.get("page") || ""
      const title = url.searchParams.get("title") || ""
      let pageUrl = url.searchParams.get("url") || ""
      if (!pageUrl && page) {
        pageUrl = `${WIKI_BASE}/${page.replace(/^\//, "")}`
      }
      return new Response(formHtml({ page, title, url: pageUrl }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    return new Response("Not found", { status: 404 })
  },
}
