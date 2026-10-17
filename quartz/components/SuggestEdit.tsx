import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { TFTB_AUTH_WORKER } from "./tftbAuth"

const WIKI_BASE = "https://dannyirwin.github.io/tales-from-the-bright-wiki"

export default (() => {
  const SuggestEdit: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    const title = String(fileData.frontmatter?.title ?? slug)
    const pageUrl = slug ? `${WIKI_BASE}/${slug}` : WIKI_BASE

    return (
      <p class={classNames(displayClass, "suggest-edit")}>
        <a
          href="#"
          class="suggest-edit-link"
          data-router-ignore
          data-suggest-page={slug}
          data-suggest-title={title}
          data-suggest-url={pageUrl}
        >
          Suggest an edit
        </a>
        <span class="suggest-edit-hint"> (select text first to quote it)</span>
      </p>
    )
  }

  SuggestEdit.displayName = "SuggestEdit"

  SuggestEdit.css = `
  .suggest-edit {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
  }
  .suggest-edit a {
    color: var(--gray);
    background-color: transparent;
  }
  .suggest-edit a:hover {
    color: var(--secondary);
  }
  .suggest-edit-hint {
    color: var(--gray);
    opacity: 0.85;
  }
  `

  SuggestEdit.afterDOMLoaded = `
(function () {
  var WORKER = ${JSON.stringify(TFTB_AUTH_WORKER)};
  var KEY = "tftb_session";
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest("a.suggest-edit-link");
    if (!a) return;
    e.preventDefault();
    var session = null;
    try { session = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (err) {}
    if (!session || !session.token) {
      location.href = WORKER + "/login?return=" + encodeURIComponent(location.href);
      return;
    }
    var sel = "";
    try {
      sel = (window.getSelection() && window.getSelection().toString()) || "";
    } catch (err) {}
    sel = (sel || "").trim().slice(0, 4000);
    var params = new URLSearchParams();
    var page = a.getAttribute("data-suggest-page") || "";
    var title = a.getAttribute("data-suggest-title") || "";
    var url = a.getAttribute("data-suggest-url") || "";
    if (page) params.set("page", page);
    if (title) params.set("title", title);
    if (url) params.set("url", url);
    if (sel) params.set("quote", sel);
    var href = WORKER + "/suggest?" + params.toString() + "#tftb_token=" + encodeURIComponent(session.token);
    window.open(href, "_blank", "noopener,noreferrer");
  });
})();
`

  return SuggestEdit
}) satisfies QuartzComponentConstructor
