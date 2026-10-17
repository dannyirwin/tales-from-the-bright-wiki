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
    font-size: 0.82rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    max-height: 8rem;
    overflow: auto;
    background: var(--lightgray);
    background: color-mix(in srgb, var(--lightgray) 35%, transparent);
    border-radius: 0 0.25rem 0.25rem 0;
  }
  .tftb-suggest-modal textarea.tftb-md {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    line-height: 1.4;
    min-height: 8rem;
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
    btn.setAttribute("aria-label", "Suggest an edit");
    btn.title = "Suggest an edit (this page or a new file)";
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

  var turndownLoading = null;
  function ensureTurndown() {
    if (window.TurndownService) return Promise.resolve();
    if (turndownLoading) return turndownLoading;
    turndownLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js";
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { turndownLoading = null; reject(new Error("turndown")); };
      document.head.appendChild(s);
    });
    return turndownLoading;
  }

  function selectionToMarkdown() {
    var sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return "";
    var plain = (sel.toString() || "").trim();
    if (!window.TurndownService) return plain.slice(0, 8000);
    try {
      var range = sel.getRangeAt(0);
      var div = document.createElement("div");
      div.appendChild(range.cloneContents());
      var td = new window.TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        bulletListMarker: "-",
      });
      td.addRule("quartzInternal", {
        filter: function (node) {
          return node.nodeName === "A" && node.classList && node.classList.contains("internal");
        },
        replacement: function (content, node) {
          var href = (node.getAttribute("href") || "").replace(/\\/$/, "");
          var name = href.split("/").filter(Boolean).pop() || content;
          try { name = decodeURIComponent(name); } catch (e) {}
          return "[[" + (content || name) + "]]";
        },
      });
      return (td.turndown(div.innerHTML) || plain).trim().slice(0, 8000);
    } catch (err) {
      return plain.slice(0, 8000);
    }
  }

  function showFloat(rect, quoteMd) {
    hideFloat();
    floatBtn = document.createElement("button");
    floatBtn.type = "button";
    floatBtn.className = "tftb-suggest-float";
    floatBtn.textContent = "Suggest edit";
    floatBtn.title = "Suggest an edit for this selection (markdown)";
    floatBtn.style.left = (rect.left + rect.width / 2 + window.scrollX) + "px";
    floatBtn.style.top = (rect.top + window.scrollY) + "px";
    floatBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    floatBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal({ mode: "quote", quote: quoteMd });
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
    if (!el.closest("article, .center, .page-content, #quartz-body")) {
      hideFloat();
      return;
    }
    if (el.closest(".tftb-suggest-modal, .tftb-suggest-global, .tftb-suggest-float")) {
      return;
    }
    var range, rect;
    try {
      range = sel.getRangeAt(0);
      rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        hideFloat();
        return;
      }
    } catch (err) {
      hideFloat();
      return;
    }
    ensureTurndown().then(function () {
      // selection may have changed while loading
      var sel2 = window.getSelection && window.getSelection();
      if (!sel2 || sel2.isCollapsed) return;
      var md = selectionToMarkdown();
      if (!md) return;
      var r2 = sel2.getRangeAt(0).getBoundingClientRect();
      showFloat(r2, md);
    }).catch(function () {
      showFloat(rect, text.slice(0, 8000));
    });
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
    var quote = (opts.quote || "").trim();
    var hasQuote = quote.length > 0;
    // file path for vault-ish display (no leading slash)
    var defaultFile = meta.page === "index" ? "index.md" : meta.page + ".md";

    backdrop = document.createElement("div");
    backdrop.className = "tftb-suggest-backdrop";
    backdrop.innerHTML =
      '<div class="tftb-suggest-modal" role="dialog" aria-modal="true">' +
      "<h2>Suggest an edit</h2>" +
      '<p class="meta">Edit this note, or change the file path to propose a new one.</p>' +
      '<label for="tftb-file">File</label>' +
      '<input id="tftb-file" type="text" spellcheck="false" />' +
      '<div class="tftb-quote-wrap" hidden>' +
      "<label>Quoted markdown</label>" +
      '<pre class="quote"></pre>' +
      "</div>" +
      '<label for="tftb-message">Message</label>' +
      '<textarea id="tftb-message" class="tftb-md" spellcheck="true"></textarea>' +
      '<div class="tftb-suggest-actions">' +
      '<button type="button" class="cancel">Cancel</button>' +
      '<button type="button" class="primary submit">Send</button>' +
      "</div>" +
      '<p class="tftb-suggest-msg" hidden></p>' +
      "</div>";

    var modal = backdrop.querySelector(".tftb-suggest-modal");
    var fileInput = modal.querySelector("#tftb-file");
    var message = modal.querySelector("#tftb-message");
    var quoteWrap = modal.querySelector(".tftb-quote-wrap");
    fileInput.value = defaultFile;
    fileInput.placeholder = "e.g. Locations/Lumenhold.md or Lore/New Idea.md";

    if (hasQuote) {
      quoteWrap.hidden = false;
      quoteWrap.querySelector(".quote").textContent = quote;
      message.value = quote;
      message.placeholder = "Edit the quoted markdown and/or add a short comment…";
    } else {
      quoteWrap.hidden = true;
      message.value = "";
      message.placeholder =
        "Write markdown for the change, notes about this file, or a draft for a new note…";
    }

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });
    modal.querySelector(".cancel").addEventListener("click", closeModal);
    modal.querySelector(".submit").addEventListener("click", function () {
      submitSuggestion(meta, quote, modal);
    });
    document.body.appendChild(backdrop);
    message.focus();
    if (hasQuote) {
      try { message.setSelectionRange(message.value.length, message.value.length); } catch (e) {}
    }
  }

  async function submitSuggestion(meta, quote, modal) {
    var s = requireAuth();
    if (!s) return;
    var msg = modal.querySelector(".tftb-suggest-msg");
    msg.hidden = true;

    var file = (modal.querySelector("#tftb-file").value || "").trim().replace(/^\\/+/, "");
    var message = (modal.querySelector("#tftb-message").value || "").trim();
    if (!file) {
      msg.hidden = false;
      msg.className = "tftb-suggest-msg err";
      msg.textContent = "Add a file path.";
      return;
    }
    if (!message) {
      msg.hidden = false;
      msg.className = "tftb-suggest-msg err";
      msg.textContent = "Write a message (edit, comment, or new note draft).";
      return;
    }

    var currentPath = meta.page === "index" ? "index" : meta.page;
    var filePath = file.replace(/\\.md$/i, "");
    var isOtherFile = filePath !== currentPath;
    var subject = (isOtherFile ? "New/other: " : "Edit: ") + file;
    var body = "**File:** \`" + file + "\`\\n\\n**Message:**\\n\\n\`\`\`md\\n" + message + "\\n\`\`\`";

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
          page: file.replace(/\\.md$/i, ""),
          pageTitle: file,
          pageUrl: meta.url,
          quote: quote || "",
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
