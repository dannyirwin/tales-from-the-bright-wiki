import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypes } from "./quartz/plugins"
import PageTitle from "./quartz/components/PageTitle"
import SiteMeta from "./quartz/components/SiteMeta"
import AuthGate from "./quartz/components/AuthGate"
import SuggestEdit from "./quartz/components/SuggestEdit"
import OutgoingLinks from "./quartz/components/OutgoingLinks"
import { QuartzComponent } from "./quartz/components/types"

const config = await loadQuartzConfig()
const layout = await loadQuartzLayout()

const siteTitle = PageTitle()
const outgoingLinks = OutgoingLinks()

/** Left nav should always show the site brand, never the current page/folder title. */
function withFixedSiteTitle(components: QuartzComponent[] | undefined): QuartzComponent[] {
  const rest = (components ?? []).filter((c) => {
    const css = typeof c.css === "string" ? c.css : ""
    return !css.includes(".page-title") && !css.includes(".article-title")
  })
  return [siteTitle, ...rest]
}

/** Right column: Graph → TOC → Links on this page → Backlinks */
function withOutgoingLinks(components: QuartzComponent[] | undefined): QuartzComponent[] {
  const right = [...(components ?? [])]
  const already = right.some((c) => c.displayName === "OutgoingLinks")
  if (already) return right
  const tocIdx = right.findIndex((c) => {
    const css = typeof c.css === "string" ? c.css : ""
    const name = c.displayName ?? ""
    return name === "TableOfContents" || name === "TOC" || css.includes(".toc")
  })
  if (tocIdx >= 0) {
    right.splice(tocIdx + 1, 0, outgoingLinks)
  } else {
    const backIdx = right.findIndex(
      (c) =>
        (c.displayName ?? "").includes("Backlink") ||
        (typeof c.css === "string" && c.css.includes(".backlinks")),
    )
    if (backIdx >= 0) right.splice(backIdx, 0, outgoingLinks)
    else right.push(outgoingLinks)
  }
  return right
}

layout.defaults.left = withFixedSiteTitle(layout.defaults.left)
layout.defaults.right = withOutgoingLinks(layout.defaults.right)
for (const pageType of Object.values(layout.byPageType)) {
  pageType.left = withFixedSiteTitle(pageType.left)
  pageType.right = withOutgoingLinks(pageType.right)
}

const authGate = AuthGate()
const suggestEdit = SuggestEdit()
const siteMeta = SiteMeta()
const footer = [...(layout.defaults.footer ?? []), suggestEdit, siteMeta]
layout.defaults.footer = footer
layout.defaults.beforeBody = [authGate, ...(layout.defaults.beforeBody ?? [])]
for (const pageType of Object.values(layout.byPageType)) {
  pageType.footer = footer
  pageType.beforeBody = [authGate, ...(pageType.beforeBody ?? [])]
}

config.plugins.emitters = config.plugins.emitters.filter((e) => e.name !== "PageTypeDispatcher")
config.plugins.emitters.push(
  PageTypes.PageTypeDispatcher({
    defaults: layout.defaults,
    byPageType: layout.byPageType,
  }),
)

export default config
export { layout }
