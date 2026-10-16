import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, SimpleSlug, resolveRelative, simplifySlug } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { classNames } from "../util/lang"

interface Options {
  hideWhenEmpty: boolean
}

const defaultOptions: Options = {
  hideWhenEmpty: true,
}

function resolveOutgoing(
  links: SimpleSlug[] | undefined,
  allFiles: QuartzPluginData[],
): QuartzPluginData[] {
  if (!links?.length) return []
  const bySimple = new Map<string, QuartzPluginData>()
  for (const file of allFiles) {
    if (!file.slug || file.unlisted) continue
    bySimple.set(simplifySlug(file.slug), file)
  }
  const seen = new Set<string>()
  const out: QuartzPluginData[] = []
  for (const link of links) {
    const key = simplifySlug(link as FullSlug)
    if (seen.has(key)) continue
    const file = bySimple.get(key)
    if (!file) continue
    seen.add(key)
    out.push(file)
  }
  out.sort((a, b) =>
    (a.frontmatter?.title ?? a.slug ?? "").localeCompare(b.frontmatter?.title ?? b.slug ?? "", undefined, {
      sensitivity: "base",
    }),
  )
  return out
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const OutgoingLinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const pages = resolveOutgoing(fileData.links as SimpleSlug[] | undefined, allFiles)
    if (opts.hideWhenEmpty && pages.length === 0) return null

    return (
      <div class={classNames(displayClass, "outgoing-links")}>
        <h3>Links on this page</h3>
        <ul class="overflow">
          {pages.map((f) => (
            <li>
              <a href={resolveRelative(fileData.slug!, f.slug!)} class="internal">
                {f.frontmatter?.title ?? f.slug}
              </a>
            </li>
          ))}
          <li class="overflow-end" />
        </ul>
      </div>
    )
  }

  OutgoingLinks.displayName = "OutgoingLinks"
  OutgoingLinks.css = `
.outgoing-links {
  flex-direction: column;
}
.outgoing-links > h3 {
  font-size: 1rem;
  margin: 0;
}
.outgoing-links > ul.overflow {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
  max-height: calc(100% - 2rem);
  overscroll-behavior: contain;
}
.outgoing-links > ul.overflow > li > a {
  background-color: transparent;
}
`
  return OutgoingLinks
}) satisfies QuartzComponentConstructor<Partial<Options>>
