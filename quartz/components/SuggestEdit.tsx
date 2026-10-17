import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

/** Cloudflare Worker form origin (password → GitHub issue). Update after CF deploy. */
const SUGGEST_FORM_URL = "https://tales-from-the-bright-wiki-decap.dannyirwin.workers.dev"

const WIKI_BASE = "https://dannyirwin.github.io/tales-from-the-bright-wiki"

export default (() => {
  const SuggestEdit: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    const title = String(fileData.frontmatter?.title ?? slug)
    const pageUrl = slug ? `${WIKI_BASE}/${slug}` : WIKI_BASE
    const params = new URLSearchParams()
    if (slug) params.set("page", slug)
    if (title) params.set("title", title)
    params.set("url", pageUrl)
    const href = `${SUGGEST_FORM_URL}/?${params.toString()}`

    return (
      <p class={classNames(displayClass, "suggest-edit")}>
        <a href={href} data-router-ignore target="_blank" rel="noopener noreferrer">
          Suggest an edit
        </a>
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
  `
  return SuggestEdit
}) satisfies QuartzComponentConstructor
