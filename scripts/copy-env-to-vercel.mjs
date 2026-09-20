#!/usr/bin/env node
/**
 * Grok/Vercel functions do not receive gitignored .env files.
 * Copy the private file into every serverless function directory after `vite build`
 * so CONTACT_EMAIL and LLM_* are available at runtime even if hosting secrets
 * are missing from process.env.
 */
import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const from = join(root, ".env");

if (!existsSync(from)) {
    process.exit(0);
}

const destinations = [];
const functionsRoot = join(root, ".vercel/output/functions");

if (existsSync(functionsRoot)) {
    for (const entry of readdirSync(functionsRoot, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            destinations.push(join(functionsRoot, entry.name, ".env"));
        }
    }
}

destinations.push(join(root, ".output/.env"));

for (const dest of destinations) {
    if (!existsSync(dirname(dest))) {
        continue;
    }
    copyFileSync(from, dest);
}
