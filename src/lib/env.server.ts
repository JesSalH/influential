import process from "node:process";

export function env(key: string): string | undefined {
    // Read at call time from node:process so Vite/Nitro cannot replace
    // `process.env.LLM_API_KEY` with an empty string at build time.
    const v = process.env[key]?.trim();
    return v || undefined;
}

/**
 * Workspace preview vs deployed app. The deployer writes GROK_PROJECT_ID on
 * every publish; the sandbox preview never has it. Single source of truth for
 * the split — gate audience, gate endpoints and connector-token semantics all
 * key off this predicate.
 */
export function isWorkspacePreview(): boolean {
    return !env("GROK_PROJECT_ID");
}
