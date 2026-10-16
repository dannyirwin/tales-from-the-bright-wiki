#!/usr/bin/env node
/**
 * Sync the Obsidian vault into content/, commit, and push to v5
 * so GitHub Pages deploys the wiki.
 *
 * Usage:
 *   npm run publish
 *   npm run publish -- "your commit message"
 */
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const WIKI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DEPLOY_BRANCH = "v5"
const SITE_URL = "https://dannyirwin.github.io/tales-from-the-bright-wiki/"

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: WIKI_ROOT,
    encoding: "utf8",
    stdio: opts.stdio ?? ["ignore", "pipe", "pipe"],
  })
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim()
    throw new Error(`${cmd} ${args.join(" ")}\n${err || `exit ${result.status}`}`)
  }
  return (result.stdout || "").trim()
}

function hasChanges() {
  return run("git", ["status", "--porcelain"]).length > 0
}

function main() {
  const message =
    process.argv.slice(2).join(" ").trim() ||
    `Publish wiki ${new Date().toISOString().slice(0, 10)}`

  const branch = run("git", ["branch", "--show-current"])
  if (branch !== DEPLOY_BRANCH) {
    console.error(`On branch "${branch}", but deploy only runs from "${DEPLOY_BRANCH}".`)
    console.error(`Switch with: git checkout ${DEPLOY_BRANCH}`)
    process.exit(1)
  }

  console.log("1/3 Syncing vault → content/")
  run("node", ["scripts/sync-vault.mjs"], { stdio: "inherit" })

  if (!hasChanges()) {
    console.log("No changes to publish. Pushing branch anyway in case it's ahead…")
  } else {
    console.log("2/3 Committing")
    run("git", ["add", "-A"])
    run("git", ["commit", "-m", message])
    console.log(`   ${message}`)
  }

  console.log(`3/3 Pushing origin/${DEPLOY_BRANCH}`)
  run("git", ["push", "-u", "origin", DEPLOY_BRANCH], { stdio: "inherit" })

  console.log(`\nDeploy started. Site: ${SITE_URL}`)
  console.log("GitHub Actions will build and publish in a few minutes.")
}

try {
  main()
} catch (err) {
  console.error(err.message || err)
  process.exit(1)
}
