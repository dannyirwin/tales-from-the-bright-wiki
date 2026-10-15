#!/usr/bin/env node
/**
 * Copy only notes with `publish: true` from the Obsidian vault into content/.
 * Unpublished vault notes never touch this public repo.
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

function hasPublishTrue(filePath) {
  const text = fs.readFileSync(filePath, "utf8")
  if (!text.startsWith("---")) return false
  const end = text.indexOf("\n---", 3)
  if (end === -1) return false
  const fm = text.slice(3, end)
  return /^publish:\s*true\s*$/m.test(fm)
}

function walkMarkdown(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkMarkdown(full, out)
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full)
  }
  return out
}

function emptyContentKeepIndex() {
  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true })
  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    const full = path.join(CONTENT_DIR, entry.name)
    if (entry.name === "index.md") continue
    fs.rmSync(full, { recursive: true, force: true })
  }
}

function main() {
  if (!fs.existsSync(VAULT_DIR)) {
    console.error(`Vault not found: ${VAULT_DIR}`)
    process.exit(1)
  }

  emptyContentKeepIndex()

  const published = walkMarkdown(VAULT_DIR).filter(hasPublishTrue)
  let copied = 0

  for (const src of published) {
    const rel = path.relative(VAULT_DIR, src)
    const dest = path.join(CONTENT_DIR, rel)
    if (path.resolve(dest) === path.resolve(path.join(CONTENT_DIR, "index.md"))) {
      // Prefer vault index if it exists and is published; otherwise keep wiki index.
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    copied++
    console.log(`  + ${rel}`)
  }

  // Ensure homepage always exists with publish: true
  const indexPath = path.join(CONTENT_DIR, "index.md")
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(
      indexPath,
      `---\ntitle: Tales From the Bright\npublish: true\n---\n\n# Tales From the Bright\n`,
    )
  } else if (!hasPublishTrue(indexPath)) {
    const body = fs.readFileSync(indexPath, "utf8")
    if (body.startsWith("---")) {
      fs.writeFileSync(indexPath, body.replace(/^---\n/, "---\npublish: true\n"))
    } else {
      fs.writeFileSync(indexPath, `---\npublish: true\n---\n\n${body}`)
    }
  }

  console.log(`\nSynced ${copied} published note(s) → content/`)
  console.log("Next: npx quartz build --serve")
}

main()
