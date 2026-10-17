#!/usr/bin/env node
/**
 * Sync published Obsidian notes into content/.
 * Only markdown with `publish: true` (quoted or unquoted) is copied,
 * so collaborators/CMS never see DM-only notes.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WIKI_ROOT = path.resolve(__dirname, "..")
const CONTENT_DIR = path.join(WIKI_ROOT, "content")
const VAULT_DIR =
  process.env.VAULT_DIR ||
  path.resolve(WIKI_ROOT, "..", "Tales From the Bright")

const SKIP_DIRS = new Set([
  ".git",
  ".obsidian",
  ".cursor",
  "Excalidraw",
  "node_modules",
  ".trash",
])
const SKIP_NAMES = new Set([".DS_Store"])

function shouldSkip(name) {
  return SKIP_DIRS.has(name) || SKIP_NAMES.has(name)
}

function emptyContent() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true })
    return
  }
  for (const entry of fs.readdirSync(CONTENT_DIR)) {
    fs.rmSync(path.join(CONTENT_DIR, entry), { recursive: true, force: true })
  }
}

/** Keep content/media/ in git after emptyContent() wipes content/. */
function ensureMediaGitkeep() {
  const mediaDir = path.join(CONTENT_DIR, "media")
  fs.mkdirSync(mediaDir, { recursive: true })
  fs.writeFileSync(path.join(mediaDir, ".gitkeep"), "")
}

/** True when frontmatter has publish: true or publish: "true". */
function hasPublishTrue(filePath) {
  const text = fs.readFileSync(filePath, "utf8")
  if (!text.startsWith("---")) return false
  const end = text.indexOf("\n---", 3)
  const frontmatter = end === -1 ? text : text.slice(0, end + 1)
  return /^publish:\s*"?true"?\s*$/m.test(frontmatter)
}

/**
 * Copy only .md files with publish: true. Directories are created as needed.
 * Skips *.base and all other non-markdown assets (v1).
 */
function copyPublished(srcDir, destDir) {
  let count = 0
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue
    const src = path.join(srcDir, entry.name)
    if (entry.isDirectory()) {
      count += copyPublished(src, path.join(destDir, entry.name))
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".base")) continue
      if (!entry.name.endsWith(".md")) continue
      if (!hasPublishTrue(src)) continue
      fs.mkdirSync(destDir, { recursive: true })
      fs.copyFileSync(src, path.join(destDir, entry.name))
      count++
    }
  }
  return count
}

function ensureIndexPublish() {
  const indexPath = path.join(CONTENT_DIR, "index.md")
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(
      indexPath,
      `---\ntitle: Tales from the Bright\npublish: true\n---\n\n# Tales from the Bright\n\nCampaign wiki for **Into the Arecene**.\n`,
    )
    return
  }
  const text = fs.readFileSync(indexPath, "utf8")
  // Obsidian Properties may save publish: "true" (quoted)
  if (/^publish:\s*"?true"?\s*$/m.test(text)) return
  if (text.startsWith("---")) {
    fs.writeFileSync(indexPath, text.replace(/^---\n/, "---\npublish: true\n"))
  } else {
    fs.writeFileSync(indexPath, `---\npublish: true\n---\n\n${text}`)
  }
}

function main() {
  if (!fs.existsSync(VAULT_DIR)) {
    console.error(`Vault not found: ${VAULT_DIR}`)
    process.exit(1)
  }

  emptyContent()
  ensureMediaGitkeep()
  const copied = copyPublished(VAULT_DIR, CONTENT_DIR)
  ensureIndexPublish()

  console.log(`Synced ${copied} published note(s) from vault → content/`)
  console.log("Only notes with publish: true were copied")
  console.log("Next: npx quartz build --serve")
}

main()
