/** Cloudflare Worker origin for login + suggest form. Update if CF URL changes. */
export const TFTB_AUTH_WORKER = "https://tales-from-the-bright-wiki-decap.dirwin123.workers.dev"

export const TFTB_SESSION_KEY = "tftb_session"

/** Inlined into AuthGate / SuggestEdit afterDOMLoaded scripts. */
export const TFTB_LOGIN_HELPER_JS = `
function tftbTheme() {
  var saved = document.documentElement.getAttribute("saved-theme");
  if (saved === "dark" || saved === "light") return saved;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch (e) {
    return "light";
  }
}
function tftbLoginUrl(returnUrl) {
  return ${JSON.stringify(TFTB_AUTH_WORKER)} + "/login?return=" +
    encodeURIComponent(String(returnUrl || location.href).split("#")[0]) +
    "&theme=" + tftbTheme();
}
`
