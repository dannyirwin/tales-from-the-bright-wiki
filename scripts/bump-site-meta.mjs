#!/usr/bin/env node
/** Bump site patch version and stamp updatedAt (UTC). */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const metaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "site-meta.json")
const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))

const parts = String(meta.version || "0.1.0").split(".").map((n) => parseInt(n, 10) || 0)
while (parts.length < 3) parts.push(0)
parts[2] += 1

meta.version = parts.join(".")
meta.updatedAt = new Date().toISOString()

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n")
console.log(`site-meta → v${meta.version} @ ${meta.updatedAt}`)
