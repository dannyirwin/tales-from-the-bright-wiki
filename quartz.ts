import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypes } from "./quartz/plugins"
import SiteMeta from "./quartz/components/SiteMeta"

// Config first so community plugins register their layout components
const config = await loadQuartzConfig()

const layout = await loadQuartzLayout()
const siteMeta = SiteMeta()
const footer = [...(layout.defaults.footer ?? []), siteMeta]
layout.defaults.footer = footer
for (const pageType of Object.values(layout.byPageType)) {
  pageType.footer = footer
}

// Replace the dispatcher baked into config with one that includes SiteMeta
config.plugins.emitters = config.plugins.emitters.filter((e) => e.name !== "PageTypeDispatcher")
config.plugins.emitters.push(
  PageTypes.PageTypeDispatcher({
    defaults: layout.defaults,
    byPageType: layout.byPageType,
  }),
)

export default config
export { layout }
