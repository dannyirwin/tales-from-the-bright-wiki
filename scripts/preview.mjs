#!/usr/bin/env node
/**
 * Run Quartz with --serve and copy Decap admin into public/ after the
 * initial build cleans the output directory (so /admin survives serve).
 */
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const publicIndex = path.join(root, "public", "index.html")

const child = spawn("npx", ["quartz", "build", "--serve", ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  shell: true,
})

let sawMissing = !fs.existsSync(publicIndex)
let copied = false

function copyAdmin() {
  if (copied) return
  copied = true
  const copy = spawn("npm", ["run", "copy-admin"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  })
  copy.on("exit", (code) => {
    if (code !== 0) {
      console.error("copy-admin failed; /admin may be missing from the preview tree")
    }
  })
}

const timer = setInterval(() => {
  const exists = fs.existsSync(publicIndex)
  if (!exists) {
    sawMissing = true
    return
  }
  if (sawMissing && exists) {
    clearInterval(timer)
    copyAdmin()
  }
}, 300)

function shutdown(code) {
  clearInterval(timer)
  process.exit(code ?? 0)
}

child.on("exit", (code) => shutdown(code ?? 0))
process.on("SIGINT", () => {
  child.kill("SIGINT")
})
process.on("SIGTERM", () => {
  child.kill("SIGTERM")
})
