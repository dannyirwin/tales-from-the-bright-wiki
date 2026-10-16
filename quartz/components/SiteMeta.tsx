import fs from "fs"
import path from "path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

function readSiteVersion(): string {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(process.cwd(), "site-meta.json"), "utf8")) as {
      version?: string
    }
    return meta.version ?? "0.0.0"
  } catch {
    return "0.0.0"
  }
}

export default (() => {
  const version = readSiteVersion()

  const SiteMeta: QuartzComponent = (_props: QuartzComponentProps) => {
    return <p class="site-meta">v{version}</p>
  }

  SiteMeta.displayName = "SiteMeta"
  SiteMeta.css = `
  .site-meta {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: var(--gray);
    font-variant-numeric: tabular-nums;
  }
  `
  return SiteMeta
}) satisfies QuartzComponentConstructor
