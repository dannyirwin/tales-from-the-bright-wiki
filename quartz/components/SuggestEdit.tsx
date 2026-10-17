import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { TFTB_AUTH_WORKER } from "./tftbAuth"

/**
 * In-page suggest UI: global icon (top) + selection popover + modal form.
 * Submits to the auth Worker; no navigation away from the wiki.
 */
export default (() => {
  const SuggestEdit: QuartzComponent = () => null

  SuggestEdit.displayName = "SuggestEdit"

  SuggestEdit.css = `
  .tftb-suggest-global {
    position: fixed;
    top: 0.85rem;
    right: 0.85rem;
    z-index: 10050;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 999px;
    border: 1px solid var(--lightgray);
    background: var(--light);
    color: var(--darkgray);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    padding: 0;
  }
  .tftb-suggest-global:hover {
    color: var(--secondary);
    border-color: var(--secondary);
  }
  .tftb-suggest-global svg {
    width: 1.1rem;
    height: 1.1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tftb-suggest-float {
    position: absolute;
    z-index: 10040;
    transform: translate(-50%, -120%);
    border: 1px solid var(--lightgray);
    background: var(--light);
    color: var(--darkgray);
    border-radius: 0.4rem;
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    white-space: nowrap;
  }
  .tftb-suggest-float:hover {
    color: var(--secondary);
  }
  .tftb-suggest-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10100;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 10vh 1rem 2rem;
    overflow: auto;
  }
  .tftb-suggest-modal {
    width: min(32rem, 100%);
    background: var(--light);
    color: var(--darkgray);
    border: 1px solid var(--lightgray);
    border-radius: 0.5rem;
    padding: 1.1rem 1.2rem 1.25rem;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18);
  }
  .tftb-suggest-modal h2 {
    margin: 0 0 0.35rem;
    font-size: 1.15rem;
  }
  .tftb-suggest-modal .meta {
    font-size: 0.85rem;
    color: var(--gray);
    margin: 0 0 0.85rem;
  }
  .tftb-suggest-modal label {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
    margin: 0.7rem 0 0.25rem;
  }
  .tftb-suggest-modal input,
  .tftb-suggest-modal textarea {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--lightgray);
    border-radius: 0.3rem;
    background: var(--light);
    color: var(--darkgray);
  }
  .tftb-suggest-modal textarea {
    min-height: 6.5rem;
    resize: vertical;
  }
  .tftb-suggest-modal .quote {
    border-left: 3px solid var(--secondary);
    padding: 0.35rem 0.65rem;
    margin: 0.35rem 0 0.5rem;
    white-space: pre-wrap;
    font-size: 0.9rem;
    max-height: 8rem;
    overflow: auto;
  }
  .tftb-suggest-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  .tftb-suggest-actions button {
    font: inherit;
    padding: 0.4rem 0.85rem;
    border-radius: 0.3rem;
    cursor: pointer;
    border: 1px solid var(--lightgray);
    background: var(--light);
    color: var(--darkgray);
  }
  .tftb-suggest-actions button.primary {
    background: var(--secondary);
    border-color: var(--secondary);
    color: var(--light);
  }
  .tftb-suggest-msg {
    margin-top: 0.65rem;
    font-size: 0.9rem;
  }
  .tftb-suggest-msg.err { color: #b00020; }
  .tftb-suggest-msg.ok { color: #0a7; }
  `

  SuggestEdit.afterDOMLoaded = `
(function () {
  var WORKER = ${JSON.stringify(TFTB_AUTH_WORKER)};
  var KEY = "tftb_session";
  var BASE = "/tales-from-the-bright-wiki";

  function session() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }

  function requireAuth() {
    var s = session();
    if (!s || !s.token || (s.exp && s.exp * 1000 < Date.now())) {
      localStorage.removeItem(KEY);
      location.href = WORKER + "/login?return=" + encodeURIComponent(location.href.split("#")[0]);
      return null;
    }
    return s;
  }

  function pageMeta() {
    var path = location.pathname || "";
    if (path.indexOf(BASE) === 0) path = path.slice(BASE.length);
    path = path.replace(/^\\/+/, "").replace(/\\/+$/, "") || "index";
    var h1 = document.querySelector("article h1, .center h1, h1");
    var title = (h1 && h1.textContent || path).trim();
    return { page: path, title: title, url: location.href.split("#")[0] };
  }

  function ensureGlobalBtn() {
    if (document.querySelector(".tftb-suggest-global")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tftb-suggest-global";
    btn.setAttribute("aria-label", "Suggest a global edit");
    btn.title = "Suggest a global edit";
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal({ mode: "global" });
    });
    document.body.appendChild(btn);
  }

  var floatBtn = null;
  function hideFloat() {
    if (floatBtn) floatBtn.remove();
    floatBtn = null;
  }

  function showFloat(rect, quote) {
    hideFloat();
    floatBtn = document.createElement("button");
    floatBtn.type = "button";
    floatBtn.className = "tftb-suggest-float";
    floatBtn.textContent = "Suggest edit";
    floatBtn.title = "Suggest an edit for this selection";
    floatBtn.style.left = (rect.left + rect.width / 2 + window.scrollX) + "px";
    floatBtn.style.top = (rect.top + window.scrollY) + "px";
    floatBtn.addEventListener("mousedown", function (e) {
      // keep selection until click handled
      e.preventDefault();
    });
    floatBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal({ mode: "quote", quote: quote });
      hideFloat();
    });
    document.body.appendChild(floatBtn);
  }

  function onSelectionChange() {
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      hideFloat();
      return;
    }
    var text = (sel.toString() || "").trim();
    if (text.length < 2) {
      hideFloat();
      return;
    }
    var node = sel.anchorNode;
    var el = node && node.nodeType === 3 ? node.parentElement : node;
    if (!el || !el.closest) {
      hideFloat();
      return;
    }
    // only in main article content
    if (!el.closest("article, .center, .page-content, #quartz-body")) {
      hideFloat();
      return;
    }
    if (el.closest(".tftb-suggest-modal, .tftb-suggest-global, .tftb-suggest-float")) {
      return;
    }
    try {
      var range = sel.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        hideFloat();
        return;
      }
      showFloat(rect, text.slice(0, 4000));
    } catch (err) {
      hideFloat();
    }
  }

  var backdrop = null;
  function closeModal() {
    if (backdrop) backdrop.remove();
    backdrop = null;
  }

  function openModal(opts) {
    if (!requireAuth()) return;
    closeModal();
    hideFloat();
    var meta = pageMeta();
    var mode = opts.mode || "global";
    var quote = (opts.quote || "").trim();

    backdrop = document.createElement("div");
    backdrop.className = "tftb-suggest-backdrop";
    backdrop.innerHTML =
      '<div class="tftb-suggest-modal" role="dialog" aria-modal="true">' +
      "<h2>" + (mode === "quote" ? "Suggest an edit" : "Suggest a global edit") + "</h2>" +
      '<p class="meta">On: <strong></strong></p>' +
      (mode === "quote"
        ? '<label>Quoted selection</label><div class="quote"></div>' +
          "<label for=\\"tftb-rewrite\\">Your rewrite</label>" +
          '<textarea id="tftb-rewrite"></textarea>' +
          "<label for=\\"tftb-comment\\">Comment (optional)</label>" +
          '<textarea id="tftb-comment" placeholder="Why this change?"></textarea>'
        : "<label for=\\"tftb-subject\\">Subject</label>" +
          '<input id="tftb-subject" />' +
          "<label for=\\"tftb-body\\">What should change?</label>" +
          '<textarea id="tftb-body" placeholder="Describe the edit, or paste proposed text…"></textarea>') +
      '<div class="tftb-suggest-actions">' +
      '<button type="button" class="cancel">Cancel</button>' +
      '<button type="button" class="primary submit">Send</button>' +
      "</div>" +
      '<p class="tftb-suggest-msg" hidden></p>' +
      "</div>";

    var modal = backdrop.querySelector(".tftb-suggest-modal");
    modal.querySelector(".meta strong").textContent = meta.title || meta.page;
    if (mode === "quote") {
      modal.querySelector(".quote").textContent = quote;
      modal.querySelector("#tftb-rewrite").value = quote;
    } else {
      modal.querySelector("#tftb-subject").value = "Edit: " + (meta.title || meta.page);
    }

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });
    modal.querySelector(".cancel").addEventListener("click", closeModal);
    modal.querySelector(".submit").addEventListener("click", function () {
      submitSuggestion(mode, meta, quote, modal);
    });
    document.body.appendChild(backdrop);
    var focusEl = modal.querySelector(mode === "quote" ? "#tftb-rewrite" : "#tftb-body");
    if (focusEl) focusEl.focus();
  }

  async function submitSuggestion(mode, meta, quote, modal) {
    var s = requireAuth();
    if (!s) return;
    var msg = modal.querySelector(".tftb-suggest-msg");
    msg.hidden = true;

    var subject, body, quoteOut;
    if (mode === "quote") {
      var rewrite = (modal.querySelector("#tftb-rewrite").value || "").trim();
      var comment = (modal.querySelector("#tftb-comment").value || "").trim();
      if (!rewrite && !comment) {
        msg.hidden = false;
        msg.className = "tftb-suggest-msg err";
        msg.textContent = "Add a rewrite or a comment.";
        return;
      }
      subject = "Edit: " + (meta.title || meta.page);
      quoteOut = quote;
      body = [];
      if (rewrite) body.push("**Proposed text:**\\n\\n" + rewrite);
      if (comment) body.push("**Comment:**\\n\\n" + comment);
      body = body.join("\\n\\n");
    } else {
      subject = (modal.querySelector("#tftb-subject").value || "").trim();
      body = (modal.querySelector("#tftb-body").value || "").trim();
      quoteOut = "";
      if (!subject || !body) {
        msg.hidden = false;
        msg.className = "tftb-suggest-msg err";
        msg.textContent = "Subject and suggestion are required.";
        return;
      }
    }

    try {
      var res = await fetch(WORKER + "/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + s.token,
        },
        body: JSON.stringify({
          subject: subject,
          body: body,
          page: meta.page,
          pageTitle: meta.title,
          pageUrl: meta.url,
          quote: quoteOut,
        }),
      });
      var json = await res.json().catch(function () { return {}; });
      if (res.status === 401) {
        localStorage.removeItem(KEY);
        location.href = WORKER + "/login?return=" + encodeURIComponent(location.href);
        return;
      }
      if (!res.ok) {
        msg.hidden = false;
        msg.className = "tftb-suggest-msg err";
        msg.textContent = json.error || ("Failed (" + res.status + ")");
        return;
      }
      msg.hidden = false;
      msg.className = "tftb-suggest-msg ok";
      msg.textContent = "Thanks — suggestion sent.";
      setTimeout(closeModal, 900);
    } catch (err) {
      msg.hidden = false;
      msg.className = "tftb-suggest-msg err";
      msg.textContent = "Network error — try again.";
    }
  }

  ensureGlobalBtn();
  document.addEventListener("mouseup", function () {
    setTimeout(onSelectionChange, 10);
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === "Escape") closeModal();
    else setTimeout(onSelectionChange, 10);
  });
  document.addEventListener("mousedown", function (e) {
    if (floatBtn && e.target && !floatBtn.contains(e.target)) {
      // don't hide before float click; hide on outside
      if (!(e.target.closest && e.target.closest(".tftb-suggest-float"))) {
        setTimeout(function () {
          var sel = window.getSelection && window.getSelection();
          if (!sel || sel.isCollapsed) hideFloat();
        }, 0);
      }
    }
  });
  document.addEventListener("nav", function () {
    hideFloat();
    closeModal();
    ensureGlobalBtn();
  });
})();
`

  return SuggestEdit
}) satisfies QuartzComponentConstructor
