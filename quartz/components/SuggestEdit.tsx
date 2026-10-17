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
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: 1px solid var(--dark);
    border-radius: 999px;
    background: var(--dark);
    color: var(--light);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.22);
  }
  .tftb-suggest-float:hover {
    filter: brightness(1.12);
  }
  .tftb-suggest-float svg {
    width: 1.05rem;
    height: 1.05rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
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
    width: min(52rem, 100%);
    background: var(--light);
    color: var(--darkgray);
    border: 1px solid var(--lightgray);
    border-radius: 0.5rem;
    padding: 1.1rem 1.2rem 1.25rem;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18);
  }
  .tftb-suggest-modal .tftb-md-editor {
    margin-top: 0.15rem;
    border: 1px solid var(--lightgray);
    border-radius: 0.4rem;
    overflow: hidden;
    background: var(--light);
  }
  .tftb-suggest-modal .toastui-editor-defaultUI {
    border: none !important;
    border-radius: 0;
  }
  .tftb-suggest-modal .toastui-editor-defaultUI-toolbar {
    background: var(--light) !important;
    border: none !important;
    border-bottom: 1px solid var(--lightgray) !important;
    padding: 0.35rem 0.4rem !important;
    height: auto !important;
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    align-items: center;
  }
  .tftb-suggest-modal .toastui-editor-toolbar-group {
    display: flex;
    gap: 0.2rem;
    align-items: center;
    margin: 0 !important;
  }
  .tftb-suggest-modal .toastui-editor-toolbar-divider {
    background-color: var(--lightgray) !important;
    margin: 0 0.25rem !important;
    height: 1.1rem !important;
  }
  .tftb-suggest-modal .toastui-editor-mode-switch {
    display: none !important;
  }
  .tftb-suggest-modal .tftb-ed-btn {
    width: 2rem;
    height: 2rem;
    margin: 0 !important;
    padding: 0 !important;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent !important;
    background-image: none !important;
    color: var(--darkgray);
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-sizing: border-box;
  }
  .tftb-suggest-modal .tftb-ed-btn:hover {
    color: var(--secondary);
    border-color: var(--secondary);
  }
  .tftb-suggest-modal .tftb-ed-btn.active {
    color: var(--secondary);
    background: color-mix(in srgb, var(--secondary) 12%, var(--light)) !important;
    border-color: var(--secondary);
  }
  .tftb-suggest-modal .tftb-ed-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .tftb-suggest-modal .tftb-ed-btn svg {
    width: 1.05rem;
    height: 1.05rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tftb-suggest-modal .toastui-editor-main,
  .tftb-suggest-modal .toastui-editor-ww-container,
  .tftb-suggest-modal .toastui-editor-contents {
    background: var(--light) !important;
    color: var(--darkgray) !important;
  }
  .tftb-suggest-modal .toastui-editor-contents {
    font-family: var(--bodyFont), system-ui, sans-serif;
    font-size: 1rem;
    line-height: 1.55;
    padding: 0.85rem 1rem !important;
  }
  .tftb-suggest-modal .toastui-editor-contents h1,
  .tftb-suggest-modal .toastui-editor-contents h2,
  .tftb-suggest-modal .toastui-editor-contents h3,
  .tftb-suggest-modal .toastui-editor-contents h4 {
    font-family: var(--titleFont), var(--bodyFont), system-ui, sans-serif;
    color: var(--darkgray);
    margin: 1rem 0 0.4rem;
  }
  .tftb-suggest-modal .toastui-editor-contents a {
    color: var(--secondary);
    font-weight: 600;
  }
  .tftb-suggest-modal .toastui-editor-contents blockquote {
    border-left: 3px solid var(--secondary);
    color: var(--gray);
    margin: 0.75rem 0;
    padding-left: 0.75rem;
  }
  .tftb-suggest-modal .toastui-editor-contents code {
    background: var(--highlight, color-mix(in srgb, var(--lightgray) 35%, var(--light)));
    border-radius: 0.25rem;
    padding: 0.05rem 0.3rem;
    font-size: 0.9em;
  }
  .tftb-suggest-modal .toastui-editor-tooltip {
    background: var(--dark) !important;
    color: var(--light) !important;
  }
  .tftb-suggest-modal .toastui-editor-popup {
    border: 1px solid var(--lightgray) !important;
    border-radius: 0.4rem !important;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18) !important;
    background: var(--light) !important;
    color: var(--darkgray) !important;
  }
  .tftb-suggest-modal .toastui-editor-popup-body label {
    color: var(--darkgray) !important;
  }
  .tftb-suggest-modal .toastui-editor-popup-body input[type="text"] {
    border: 1px solid var(--lightgray) !important;
    border-radius: 0.3rem !important;
    background: var(--light) !important;
    color: var(--darkgray) !important;
  }
  .tftb-suggest-modal .toastui-editor-popup-body .toastui-editor-ok-button {
    background: var(--secondary) !important;
    border-color: var(--secondary) !important;
    color: var(--light) !important;
    border-radius: 999px !important;
  }
  .tftb-suggest-modal .toastui-editor-popup-body .toastui-editor-close-button {
    border: 1px solid var(--lightgray) !important;
    border-radius: 999px !important;
    background: var(--light) !important;
    color: var(--darkgray) !important;
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
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.4rem 0.9rem;
    height: 2.25rem;
    border-radius: 999px;
    cursor: pointer;
    border: 1px solid var(--lightgray);
    background: var(--light);
    color: var(--darkgray);
  }
  .tftb-suggest-actions button:hover {
    color: var(--secondary);
    border-color: var(--secondary);
  }
  .tftb-suggest-actions button.primary {
    background: var(--secondary);
    border-color: var(--secondary);
    color: var(--light);
  }
  .tftb-suggest-actions button.primary:hover {
    color: var(--light);
    filter: brightness(1.05);
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
    var slugAttr = document.body && document.body.getAttribute("data-slug");
    var path = slugAttr || location.pathname || "";
    if (!slugAttr) {
      if (path.indexOf(BASE) === 0) path = path.slice(BASE.length);
      path = path.replace(/^\\/+/, "").replace(/\\/+$/, "") || "index";
    }
    path = String(path).replace(/\\/+$/, "") || "index";
    var h1 = document.querySelector("article h1, .center h1, h1");
    var title = (h1 && h1.textContent || path).trim();
    return { page: path, title: title, url: location.href.split("#")[0] };
  }

  // URL slugs are kebab-case; vault files keep spaces/casing (Mount Steradian.md)
  function fallbackFilePath(meta) {
    return meta.page === "index" ? "index.md" : meta.page + ".md";
  }

  function loadContentIndex() {
    if (window.fetchData) return window.fetchData;
    return fetch(BASE + "/static/contentIndex.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("index");
      return r.json();
    });
  }

  function resolveFilePath(meta) {
    var slug = (meta.page || "").toLowerCase();
    return loadContentIndex()
      .then(function (idx) {
        if (!idx || typeof idx !== "object") return fallbackFilePath(meta);
        var entry = idx[slug] || idx[meta.page];
        if (!entry) {
          for (var k in idx) {
            if (!Object.prototype.hasOwnProperty.call(idx, k)) continue;
            var e = idx[k];
            if (e && (e.slug === slug || e.slug === meta.page || String(k).toLowerCase() === slug)) {
              entry = e;
              break;
            }
          }
        }
        if (entry && entry.filePath) return entry.filePath;
        return fallbackFilePath(meta);
      })
      .catch(function () {
        return fallbackFilePath(meta);
      });
  }

  function encodeRawPath(filePath) {
    return String(filePath || "")
      .replace(/^\\/+/, "")
      .split("/")
      .map(function (seg) {
        return encodeURIComponent(seg);
      })
      .join("/");
  }

  // Toast WYSIWYG mangles --- frontmatter; keep it aside and reattach on submit
  function splitFrontmatter(md) {
    var text = String(md || "").replace(/^\\uFEFF/, "");
    if (!/^---(?:\\r?\\n|$)/.test(text)) return { frontmatter: "", body: text };
    var match = text.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)([\\s\\S]*)$/);
    if (!match) return { frontmatter: "", body: text };
    return {
      frontmatter: "---\\n" + match[1] + "\\n---\\n",
      body: match[2].replace(/^\\r?\\n/, ""),
    };
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
    floatBtn.setAttribute("aria-label", "Suggest edit");
    floatBtn.title = "Edit this highlighted text";
    floatBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
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
  var mdEditor = null;
  var toastLoading = null;

  function ensureToastEditor() {
    if (window.toastui && window.toastui.Editor) return Promise.resolve();
    if (toastLoading) return toastLoading;
    toastLoading = new Promise(function (resolve, reject) {
      if (!document.querySelector("link[data-tftb-toast]")) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://uicdn.toast.com/editor/3.2.2/toastui-editor.min.css";
        link.setAttribute("data-tftb-toast", "1");
        document.head.appendChild(link);
      }
      var s = document.createElement("script");
      s.src = "https://uicdn.toast.com/editor/3.2.2/toastui-editor-all.min.js";
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { toastLoading = null; reject(new Error("toastui")); };
      document.head.appendChild(s);
    });
    return toastLoading;
  }

  function destroyMdEditor() {
    if (!mdEditor) return;
    try { mdEditor.destroy(); } catch (e) {}
    mdEditor = null;
  }

  function tftbIcon(paths) {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + "</svg>"
    );
  }

  function tftbToolBtn(tooltip, svg) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tftb-ed-btn";
    btn.title = tooltip;
    btn.setAttribute("aria-label", tooltip);
    btn.innerHTML = svg;
    return btn;
  }

  function tftbToolbarItems() {
    function item(tooltip, svg, command, state, payload) {
      var btn = tftbToolBtn(tooltip, svg);
      var cfg = {
        name: command + (payload ? String(payload.level || "") : ""),
        el: btn,
        command: command,
        tooltip: tooltip,
        state: state,
        onUpdated: function (s) {
          btn.classList.toggle("active", !!(s && s.active));
          btn.disabled = !!(s && s.disabled);
        },
      };
      if (payload) cfg.payload = payload;
      return cfg;
    }
    return [
      [
        item("Heading", tftbIcon('<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>'), "heading", "heading", { level: 2 }),
        item("Bold", tftbIcon('<path d="M7 5h6.5a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7.5a3.5 3.5 0 0 1 0 7H7z"/>'), "bold", "strong"),
        item("Italic", tftbIcon('<path d="M19 4h-9"/><path d="M14 20H5"/><path d="M15 4 9 20"/>'), "italic", "emph"),
        item("Strikethrough", tftbIcon('<path d="M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8"/><path d="M4 12h16"/>'), "strike", "strike"),
      ],
      [
        item("Quote", tftbIcon('<path d="M3 21c3 0 7-1 7-8V5H3v8h5c0 5-2 8-5 8z"/><path d="M14 21c3 0 7-1 7-8V5h-7v8h5c0 5-2 8-5 8z"/>'), "quote", "blockQuote"),
        item("Bullet list", tftbIcon('<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'), "ul", "bulletList"),
        item("Numbered list", tftbIcon('<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'), "ol", "orderedList"),
      ],
      [
        item("Link", tftbIcon('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'), "link", null),
        item("Horizontal rule", tftbIcon('<path d="M4 12h16"/>'), "hr", "thematicBreak"),
      ],
    ];
  }

  function closeModal() {
    destroyMdEditor();
    if (backdrop) backdrop.remove();
    backdrop = null;
  }

  function readMessage(modal) {
    var body = "";
    if (mdEditor) {
      try { body = (mdEditor.getMarkdown() || "").trim(); } catch (e) { body = ""; }
    }
    if (!body) {
      var el = modal.querySelector("#tftb-message");
      body = ((el && el.value) || "").trim();
    }
    var fm = (modal && modal.getAttribute("data-tftb-fm")) || "";
    if (fm) return (fm.replace(/\\s*$/, "") + "\\n\\n" + body).trim();
    return body;
  }

  function fetchPageMarkdown(filePath) {
    return fetch(RAW + encodeRawPath(filePath), { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("fetch");
      return res.text();
    });
  }

  function modeCopy(mode) {
    if (mode === "quote") {
      return {
        title: "Edit selection",
        meta: "This suggestion is for the current page. The editor starts with your highlight — change it or add a note.",
        placeholder: "Edit the highlighted text…",
      };
    }
    if (mode === "new") {
      return {
        title: "Suggest a new note",
        meta: "Pick a file path for the new note, then write the draft (or a short description) below.",
        placeholder: "Draft the new note…",
      };
    }
    return {
      title: "Edit this page",
      meta: "This suggestion is for the current page. Edit the page, or replace it with your own message.",
      placeholder: "Edit the page, or write your own suggestion…",
    };
  }

  function openModal(opts) {
    if (!requireAuth()) return;
    closeModal();
    hideFloat();
    var meta = pageMeta();
    var mode = opts.mode || "page"; // quote | page | new
    var quote = (opts.quote || "").trim();
    // Snapshot for the GitHub issue only (not shown in the UI)
    var original = mode === "quote" ? quote : "";
    var copy = modeCopy(mode);
    var preservedFm = "";

    backdrop = document.createElement("div");
    backdrop.className = "tftb-suggest-backdrop";
    backdrop.innerHTML =
      '<div class="tftb-suggest-modal" role="dialog" aria-modal="true">' +
      "<h2></h2>" +
      '<p class="meta"></p>' +
      '<label for="tftb-file">File</label>' +
      '<input id="tftb-file" type="text" spellcheck="false" />' +
      '<label for="tftb-message">Message</label>' +
      '<textarea id="tftb-message" spellcheck="true" hidden></textarea>' +
      '<div id="tftb-md-editor" class="tftb-md-editor"></div>' +
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
    var msgEl = modal.querySelector(".tftb-suggest-msg");

    if (mode === "new") {
      fileInput.readOnly = false;
      fileInput.value = "";
      fileInput.placeholder = "e.g. Locations/New Place.md";
      message.value = "";
    } else {
      fileInput.readOnly = true;
      fileInput.value = "";
      fileInput.placeholder = "Resolving file…";
      message.value = mode === "quote" ? quote : "";
    }
    message.placeholder = copy.placeholder;

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });
    modal.querySelector(".cancel").addEventListener("click", closeModal);
    modal.querySelector(".submit").addEventListener("click", function () {
      submitSuggestion(mode, meta, original, modal);
    });
    document.body.appendChild(backdrop);

    var bootEditor = function (initial) {
      message.value = initial || "";
      modal.setAttribute("data-tftb-fm", preservedFm || "");
      var mount = modal.querySelector("#tftb-md-editor");
      ensureToastEditor().then(function () {
        if (!backdrop || !mount || !document.body.contains(mount)) return;
        destroyMdEditor();
        mount.innerHTML = "";
        mdEditor = new window.toastui.Editor({
          el: mount,
          height: "420px",
          initialEditType: "wysiwyg",
          hideModeSwitch: true,
          usageStatistics: false,
          autofocus: true,
          placeholder: copy.placeholder,
          initialValue: message.value || "",
          toolbarItems: tftbToolbarItems(),
        });
      }).catch(function () {
        message.hidden = false;
        if (mount) mount.hidden = true;
        message.focus();
      });
    };

    if (mode === "new") {
      bootEditor("");
      return;
    }

    msgEl.hidden = false;
    msgEl.className = "tftb-suggest-msg";
    msgEl.textContent = mode === "page" ? "Loading page markdown…" : "Resolving file…";

    resolveFilePath(meta).then(function (filePath) {
      fileInput.value = filePath;
      fileInput.placeholder = filePath;
      if (mode !== "page") {
        msgEl.hidden = true;
        bootEditor(message.value);
        return;
      }
      return fetchPageMarkdown(filePath).then(function (md) {
        original = md || "";
        var parts = splitFrontmatter(md || "");
        preservedFm = parts.frontmatter;
        msgEl.hidden = true;
        bootEditor(parts.body);
      });
    }).catch(function () {
      fileInput.value = fallbackFilePath(meta);
      fileInput.placeholder = fileInput.value;
      original = "";
      preservedFm = "";
      modal.setAttribute("data-tftb-fm", "");
      msgEl.hidden = false;
      msgEl.className = "tftb-suggest-msg err";
      msgEl.textContent = "Couldn’t load the file — you can still write a message.";
      bootEditor(mode === "quote" ? quote : "");
    });
  }

  async function submitSuggestion(mode, meta, original, modal) {
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
      "\\n**Suggested:**\\n\\n\`\`\`md\\n" + message + "\\n\`\`\`";

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
          original: original || "",
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
