import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypes } from "./quartz/plugins"
import PageTitle from "./quartz/components/PageTitle"
import SiteMeta from "./quartz/components/SiteMeta"
import { QuartzComponent } from "./quartz/components/types"

const config = await loadQuartzConfig()
const layout = await loadQuartzLayout()

const siteTitle = PageTitle()

/** Left nav should always show the site brand, never the current page/folder title. */
function withFixedSiteTitle(components: QuartzComponent[] | undefined): QuartzComponent[] {
  const rest = (components ?? []).filter((c) => {
    const css = typeof c.css === "string" ? c.css : ""
    return !css.includes(".page-title") && !css.includes(".article-title")
  })
  return [siteTitle, ...rest]
}

layout.defaults.left = withFixedSiteTitle(layout.defaults.left)
for (const pageType of Object.values(layout.byPageType)) {
  pageType.left = withFixedSiteTitle(pageType.left)
}

const siteMeta = SiteMeta()
const footer = [...(layout.defaults.footer ?? []), siteMeta]
layout.defaults.footer = footer
for (const pageType of Object.values(layout.byPageType)) {
  pageType.footer = footer
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
