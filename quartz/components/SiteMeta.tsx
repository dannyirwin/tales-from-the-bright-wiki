import fs from "fs"
import path from "path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type SiteMetaFile = {
  version: string
  updatedAt: string
}

function readSiteMeta(): SiteMetaFile {
  const metaPath = path.join(process.cwd(), "site-meta.json")
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8")) as SiteMetaFile
  } catch {
    return { version: "0.0.0", updatedAt: new Date().toISOString() }
  }
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

export default (() => {
  const meta = readSiteMeta()
  const label = formatUpdatedAt(meta.updatedAt)

  const SiteMeta: QuartzComponent = (_props: QuartzComponentProps) => {
    return (
      <p class="site-meta">
        Last updated{" "}
        <time datetime={meta.updatedAt}>{label}</time>
        {" · "}
        <span class="site-version">v{meta.version}</span>
      </p>
    )
  }

  SiteMeta.displayName = "SiteMeta"
  SiteMeta.css = `
  .site-meta {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: var(--gray);
  }
  .site-meta .site-version {
    font-variant-numeric: tabular-nums;
  }
  `
  return SiteMeta
}) satisfies QuartzComponentConstructor
