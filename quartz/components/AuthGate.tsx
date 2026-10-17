import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { TFTB_AUTH_WORKER, TFTB_SESSION_KEY } from "./tftbAuth"

export default (() => {
  const AuthGate: QuartzComponent = () => null

  AuthGate.displayName = "AuthGate"

  AuthGate.beforeDOMLoaded = `
document.documentElement.classList.add("tftb-auth-pending");
`

  AuthGate.css = `
html.tftb-auth-pending body {
  visibility: hidden;
}
`

  AuthGate.afterDOMLoaded = `
(function () {
  var WORKER = ${JSON.stringify(TFTB_AUTH_WORKER)};
  var KEY = ${JSON.stringify(TFTB_SESSION_KEY)};

  function clearPending() {
    document.documentElement.classList.remove("tftb-auth-pending");
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  // Capture token from login redirect (#tftb_token=...)
  var hash = location.hash || "";
  if (hash.indexOf("tftb_token=") === 1 || hash.indexOf("tftb_token=") === 0) {
    var raw = hash.replace(/^#/, "");
    var params = new URLSearchParams(raw.indexOf("tftb_token=") === 0 ? raw : raw);
    // also support #tftb_token=value directly
    var token = params.get("tftb_token");
    if (!token && raw.indexOf("tftb_token=") === 0) {
      token = decodeURIComponent(raw.slice("tftb_token=".length));
    }
    if (token) {
      var exp = null;
      try {
        var payload = token.split(".")[1];
        var pad = payload.length % 4 === 0 ? "" : "=".repeat(4 - (payload.length % 4));
        var json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/") + pad));
        exp = json.exp || null;
      } catch (e) {}
      localStorage.setItem(KEY, JSON.stringify({ token: token, exp: exp }));
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  var session = readSession();
  if (!session || !session.token || (session.exp && session.exp * 1000 < Date.now())) {
    localStorage.removeItem(KEY);
    var ret = encodeURIComponent(location.href.split("#")[0]);
    location.href = WORKER + "/login?return=" + ret;
    return;
  }

  clearPending();
})();
`

  return AuthGate
}) satisfies QuartzComponentConstructor
