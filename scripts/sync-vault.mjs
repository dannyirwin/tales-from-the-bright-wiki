#!/usr/bin/env node
/**
 * Sync the full Obsidian vault into content/.
 * Quartz ExplicitPublish still hides unpublished notes from the live wiki
 * (only notes with `publish: true` are built).
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

const SKIP_DIRS = new Set([".git", ".obsidian", "node_modules", ".trash"])
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

function copyTree(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  let count = 0
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue
    const src = path.join(srcDir, entry.name)
    const dest = path.join(destDir, entry.name)
    if (entry.isDirectory()) {
      count += copyTree(src, dest)
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dest)
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
      `---\ntitle: Tales From the Bright\npublish: true\n---\n\n# Tales From the Bright\n\nCampaign wiki for **Into the Arecene**.\n`,
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
  const copied = copyTree(VAULT_DIR, CONTENT_DIR)
  ensureIndexPublish()

  console.log(`Synced ${copied} file(s) from vault → content/`)
  console.log("Wiki build still only includes notes with publish: true")
  console.log("Next: npx quartz build --serve")
}

main()
