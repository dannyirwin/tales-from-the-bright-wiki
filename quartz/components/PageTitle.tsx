import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? "Tales from the Bright"
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={`${displayClass ?? ""} page-title`}>
      <a href={baseDir}>{title}</a>
    </h2>
  )
}

PageTitle.displayName = "PageTitle"
PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
