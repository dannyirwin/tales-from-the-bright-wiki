import { QuartzComponent, QuartzComponentConstructor } from "./types"
import { TFTB_AUTH_WORKER } from "./tftbAuth"

/**
 * Three suggest modes (same dialog):
 * 1. Selection — editor starts with highlighted markdown; issue knows current file
 * 2. Edit page — load whole file markdown (or blank message); issue knows current file
 * 3. New note — choose a new path; issue uses that proposed file
 */
export default (() => {
  const SuggestEdit: QuartzComponent = () => null

  SuggestEdit.displayName = "SuggestEdit"

  SuggestEdit.css = `
  .tftb-toolbar {
    position: fixed;
    top: 0.85rem;
    right: 0.85rem;
    z-index: 10050;
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .tftb-toolbar button {
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
    padding: 0 0.7rem;
    font-size: 0.75rem;
    font-weight: 600;
    gap: 0.3rem;
  }
  .tftb-toolbar button.icon-only {
    width: 2.25rem;
    padding: 0;
  }
  .tftb-toolbar button:hover {
    color: var(--secondary);
    border-color: var(--secondary);
  }
  .tftb-toolbar button svg {
    width: 1.05rem;
    height: 1.05rem;
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
    padding: 8vh 1rem 2rem;
    overflow: auto;
  }
  .tftb-suggest-modal {
    width: min(40rem, 100%);
    background: var(--light);
    color: var(--darkgray);
    border: 1px solid var(--lightgray);
    border-radius: 0.5rem;
    padding: 1.1rem 1.2rem 1.25rem;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18);
  }
  .tftb-suggest-modal .EasyMDEContainer { margin-top: 0.15rem; }
  .tftb-suggest-modal .EasyMDEContainer .CodeMirror {
    border-color: var(--lightgray);
    border-radius: 0 0 0.3rem 0.3rem;
    background: var(--light);
    color: var(--darkgray);
    min-height: 200px;
  }
  .tftb-suggest-modal .editor-toolbar {
    border-color: var(--lightgray);
    border-radius: 0.3rem 0.3rem 0 0;
    background: var(--light);
    opacity: 1;
  }
  .tftb-suggest-modal .editor-toolbar button { color: var(--darkgray) !important; }
  .tftb-suggest-modal .editor-toolbar button:hover,
  .tftb-suggest-modal .editor-toolbar button.active {
    background: var(--lightgray) !important;
    border-color: transparent !important;
  }
  .tftb-suggest-modal .editor-preview {
    background: var(--light);
    color: var(--darkgray);
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
  .tftb-suggest-modal input[readonly] {
    opacity: 0.85;
    background: color-mix(in srgb, var(--lightgray) 25%, var(--light));
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
  .tftb-suggest-msg { margin-top: 0.65rem; font-size: 0.9rem; }
  .tftb-suggest-msg.err { color: #b00020; }
  .tftb-suggest-msg.ok { color: #0a7; }
  `

  SuggestEdit.afterDOMLoaded = `
(function () {
  var WORKER = ${JSON.stringify(TFTB_AUTH_WORKER)};
  var KEY = "tftb_session";
  var BASE = "/tales-from-the-bright-wiki";
  var RAW =
    "https://raw.githubusercontent.com/dannyirwin/tales-from-the-bright-wiki/v5/content/";

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

  function currentFilePath(meta) {
    return meta.page === "index" ? "index.md" : meta.page + ".md";
  }

  function logout() {
    localStorage.removeItem(KEY);
    location.href = WORKER + "/login?return=" + encodeURIComponent(location.href.split("#")[0]);
  }

  function ensureToolbar() {
    if (document.querySelector(".tftb-toolbar")) return;
    var bar = document.createElement("div");
    bar.className = "tftb-toolbar";

    var editPage = document.createElement("button");
    editPage.type = "button";
    editPage.className = "icon-only";
    editPage.setAttribute("aria-label", "Edit this page");
    editPage.title = "Edit this page (whole file or your own message)";
    editPage.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    editPage.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal({ mode: "page" });
    });

    var newNote = document.createElement("button");
    newNote.type = "button";
    newNote.textContent = "New note";
    newNote.title = "Suggest a new note";
    newNote.setAttribute("aria-label", "Suggest a new note");
    newNote.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal({ mode: "new" });
    });

    var out = document.createElement("button");
    out.type = "button";
    out.textContent = "Log out";
    out.title = "Log out";
    out.setAttribute("aria-label", "Log out");
    out.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      logout();
    });

    bar.appendChild(editPage);
    bar.appendChild(newNote);
    bar.appendChild(out);
    document.body.appendChild(bar);
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
    floatBtn.title = "Edit this highlighted text";
    floatBtn.style.left = (rect.left + rect.width / 2 + window.scrollX) + "px";
    floatBtn.style.top = (rect.top + window.scrollY) + "px";
    floatBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
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
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideFloat(); return; }
    var text = (sel.toString() || "").trim();
    if (text.length < 2) { hideFloat(); return; }
    var node = sel.anchorNode;
    var el = node && node.nodeType === 3 ? node.parentElement : node;
    if (!el || !el.closest) { hideFloat(); return; }
    if (!el.closest("article, .center, .page-content, #quartz-body")) { hideFloat(); return; }
    if (el.closest(".tftb-suggest-modal, .tftb-toolbar, .tftb-suggest-float")) return;
    var rect;
    try {
      rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) { hideFloat(); return; }
    } catch (err) { hideFloat(); return; }
    ensureTurndown().then(function () {
      var sel2 = window.getSelection && window.getSelection();
      if (!sel2 || sel2.isCollapsed) return;
      var md = selectionToMarkdown();
      if (!md) return;
      showFloat(sel2.getRangeAt(0).getBoundingClientRect(), md);
    }).catch(function () {
      showFloat(rect, text.slice(0, 8000));
    });
  }

  var backdrop = null;
  var easyMde = null;
  var easyMdeLoading = null;

  function ensureEasyMde() {
    if (window.EasyMDE) return Promise.resolve();
    if (easyMdeLoading) return easyMdeLoading;
    easyMdeLoading = new Promise(function (resolve, reject) {
      if (!document.querySelector("link[data-tftb-easymde]")) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/easymde@2.18.0/dist/easymde.min.css";
        link.setAttribute("data-tftb-easymde", "1");
        document.head.appendChild(link);
      }
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/easymde@2.18.0/dist/easymde.min.js";
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { easyMdeLoading = null; reject(new Error("easymde")); };
      document.head.appendChild(s);
    });
    return easyMdeLoading;
  }

  function destroyEasyMde() {
    if (!easyMde) return;
    try { easyMde.toTextArea(); } catch (e) {}
    easyMde = null;
  }

  function closeModal() {
    destroyEasyMde();
    if (backdrop) backdrop.remove();
    backdrop = null;
  }

  function readMessage(modal) {
    if (easyMde) {
      try { return (easyMde.value() || "").trim(); } catch (e) {}
    }
    var el = modal.querySelector("#tftb-message");
    return ((el && el.value) || "").trim();
  }

  function fetchPageMarkdown(filePath) {
    var path = filePath.replace(/^\\/+/, "");
    return fetch(RAW + path, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("fetch");
      return res.text();
    });
  }

  function modeCopy(mode) {
    if (mode === "quote") {
      return {
        title: "Edit selection",
        meta: "This suggestion is for the current page. The editor starts with your highlight — change it or add a note.",
        placeholder: "Edit the highlighted markdown…",
      };
    }
    if (mode === "new") {
      return {
        title: "Suggest a new note",
        meta: "Pick a file path for the new note, then write the draft (or a short description) below.",
        placeholder: "Draft the new note in markdown…",
      };
    }
    return {
      title: "Edit this page",
      meta: "This suggestion is for the current page. Edit the full markdown, or replace it with your own message.",
      placeholder: "Edit the page markdown, or write your own suggestion…",
    };
  }

  function openModal(opts) {
    if (!requireAuth()) return;
    closeModal();
    hideFloat();
    var meta = pageMeta();
    var mode = opts.mode || "page"; // quote | page | new
    var quote = (opts.quote || "").trim();
    var copy = modeCopy(mode);
    var defaultFile = currentFilePath(meta);

    backdrop = document.createElement("div");
    backdrop.className = "tftb-suggest-backdrop";
    backdrop.innerHTML =
      '<div class="tftb-suggest-modal" role="dialog" aria-modal="true">' +
      "<h2></h2>" +
      '<p class="meta"></p>' +
      '<label for="tftb-file">File</label>' +
      '<input id="tftb-file" type="text" spellcheck="false" />' +
      '<label for="tftb-message">Message</label>' +
      '<textarea id="tftb-message" spellcheck="true"></textarea>' +
      '<div class="tftb-suggest-actions">' +
      '<button type="button" class="cancel">Cancel</button>' +
      '<button type="button" class="primary submit">Send</button>' +
      "</div>" +
      '<p class="tftb-suggest-msg" hidden></p>' +
      "</div>";

    var modal = backdrop.querySelector(".tftb-suggest-modal");
    modal.querySelector("h2").textContent = copy.title;
    modal.querySelector(".meta").textContent = copy.meta;
    var fileInput = modal.querySelector("#tftb-file");
    var message = modal.querySelector("#tftb-message");

    if (mode === "new") {
      fileInput.readOnly = false;
      fileInput.value = "";
      fileInput.placeholder = "e.g. Locations/New Place.md";
      message.value = "";
    } else {
      fileInput.readOnly = true;
      fileInput.value = defaultFile;
      fileInput.placeholder = defaultFile;
      message.value = mode === "quote" ? quote : "";
    }
    message.placeholder = copy.placeholder;

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });
    modal.querySelector(".cancel").addEventListener("click", closeModal);
    modal.querySelector(".submit").addEventListener("click", function () {
      submitSuggestion(mode, meta, quote, modal);
    });
    document.body.appendChild(backdrop);

    var bootEditor = function (initial) {
      message.value = initial || "";
      ensureEasyMde().then(function () {
        if (!backdrop || !document.body.contains(message)) return;
        destroyEasyMde();
        easyMde = new window.EasyMDE({
          element: message,
          initialValue: message.value || "",
          placeholder: copy.placeholder,
          spellChecker: false,
          status: false,
          autofocus: true,
          minHeight: "200px",
          renderingConfig: { singleLineBreaks: false },
          toolbar: [
            "bold", "italic", "heading", "|",
            "quote", "unordered-list", "ordered-list", "|",
            "link", "|", "preview", "side-by-side", "guide",
          ],
        });
      }).catch(function () { message.focus(); });
    };

    if (mode === "page") {
      var msgEl = modal.querySelector(".tftb-suggest-msg");
      msgEl.hidden = false;
      msgEl.className = "tftb-suggest-msg";
      msgEl.textContent = "Loading page markdown…";
      fetchPageMarkdown(defaultFile).then(function (md) {
        msgEl.hidden = true;
        bootEditor(md);
      }).catch(function () {
        msgEl.hidden = false;
        msgEl.className = "tftb-suggest-msg err";
        msgEl.textContent = "Couldn’t load the file — you can still write a message.";
        bootEditor("");
      });
    } else {
      bootEditor(message.value);
    }
  }

  async function submitSuggestion(mode, meta, quote, modal) {
    var s = requireAuth();
    if (!s) return;
    var msg = modal.querySelector(".tftb-suggest-msg");
    msg.hidden = true;

    var file = (modal.querySelector("#tftb-file").value || "").trim().replace(/^\\/+/, "");
    var message = readMessage(modal);
    if (!file) {
      msg.hidden = false;
      msg.className = "tftb-suggest-msg err";
      msg.textContent = "Add a file path.";
      return;
    }
    if (!/\\.md$/i.test(file)) file = file + ".md";
    if (!message) {
      msg.hidden = false;
      msg.className = "tftb-suggest-msg err";
      msg.textContent = "Write something in the message editor.";
      return;
    }

    var kind =
      mode === "quote" ? "Selection edit" :
      mode === "new" ? "New note" :
      "Page edit";
    var subject = kind + ": " + file;
    var body =
      "**Mode:** " + kind + "\\n" +
      "**File:** \`" + file + "\`\\n" +
      (mode !== "new" ? "**Page URL:** " + meta.url + "\\n" : "") +
      "\\n**Message:**\\n\\n\`\`\`md\\n" + message + "\\n\`\`\`";

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
          pageUrl: mode === "new" ? "" : meta.url,
          quote: mode === "quote" ? quote : "",
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

  ensureToolbar();
  document.addEventListener("mouseup", function () { setTimeout(onSelectionChange, 10); });
  document.addEventListener("keyup", function (e) {
    if (e.key === "Escape") closeModal();
    else setTimeout(onSelectionChange, 10);
  });
  document.addEventListener("mousedown", function (e) {
    if (floatBtn && e.target && !(e.target.closest && e.target.closest(".tftb-suggest-float"))) {
      setTimeout(function () {
        var sel = window.getSelection && window.getSelection();
        if (!sel || sel.isCollapsed) hideFloat();
      }, 0);
    }
  });
  document.addEventListener("nav", function () {
    hideFloat();
    closeModal();
    ensureToolbar();
  });
})();
`

  return SuggestEdit
}) satisfies QuartzComponentConstructor
