import "@tanstack/react-start/server-only";

import { readFileSync } from "node:fs";

import { resolve } from "node:path";

import { parseEnv } from "node:util";

import { env } from "../env.server.ts";

const DEFAULT_FORMAT = "openai-compatible";
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-flash";
const DEFAULT_MAX_OUTPUT_TOKENS = "400";

const HOST_SETTING_NAMES = [
    "LLM_API_FORMAT",
    "LLM_BASE_URL",
    "LLM_MODEL",
    "LLM_API_KEY",
    "LLM_MAX_OUTPUT_TOKENS",
] as const;

// Configuration shared by the loader and the HTTP client.
export type LlmConfig = {
    baseUrl: string;

    model: string;

    apiKey: string;

    maxOutputTokens: number;
};

// Environment variables are names associated with text values, which may be absent.
type EnvironmentValues = {
    [name: string]: string | undefined;
};

/** Reads file and hosting settings, validates them, and returns the LLM configuration. */
export function readLlmConfig(
    environment: EnvironmentValues | undefined = undefined,
    envPath: string = resolve(process.cwd(), ".env"),
): LlmConfig {
    const defaultEnvPath = resolve(process.cwd(), ".env");
    const fileValues = readEnvironmentFile(envPath);

    const extraFiles =
        envPath === defaultEnvPath ? [resolve(process.cwd(), "../.env")] : [];

    for (const extraPath of extraFiles) {
        if (extraPath === envPath) {
            continue;
        }
        const extraValues = readEnvironmentFile(extraPath);
        for (const name of Object.keys(extraValues)) {
            if (fileValues[name] === undefined || fileValues[name].trim() === "") {
                fileValues[name] = extraValues[name];
            }
        }
    }

    const settings = Object.assign({}, fileValues);

    for (const name of HOST_SETTING_NAMES) {
        const hosted = readHostValue(name, environment);
        if (hosted !== undefined) {
            settings[name] = hosted;
        }
    }

    if (settings.LLM_API_FORMAT === undefined || settings.LLM_API_FORMAT.trim() === "") {
        settings.LLM_API_FORMAT = DEFAULT_FORMAT;
    }
    if (settings.LLM_BASE_URL === undefined || settings.LLM_BASE_URL.trim() === "") {
        settings.LLM_BASE_URL = DEFAULT_BASE_URL;
    }
    if (settings.LLM_MODEL === undefined || settings.LLM_MODEL.trim() === "") {
        settings.LLM_MODEL = DEFAULT_MODEL;
    }

    validateApiFormat(settings);

    const baseUrl = readBaseUrl(settings);

    const model = readRequiredValue(settings, "LLM_MODEL");

    const apiKey = readRequiredValue(settings, "LLM_API_KEY");

    const maxOutputTokens = readTokenLimit(settings);

    return {
        baseUrl: baseUrl,

        model: model,

        apiKey: apiKey,

        maxOutputTokens: maxOutputTokens,
    };
}

/** Hosting secrets (Grok Android Secrets / Vercel) must be read dynamically so Vite cannot inline them away. */
function readHostValue(name: string, environment?: EnvironmentValues): string | undefined {
    if (environment) {
        const value = environment[name];
        if (value !== undefined && value.trim() !== "") {
            return value;
        }
        return undefined;
    }

    return env(name);
}

/** Parses a private .env file; a missing file is allowed when hosting supplies the settings. */
function readEnvironmentFile(path: string): EnvironmentValues {
    try {
        const text = readFileSync(path, "utf8");

        return parseEnv(text);
    } catch (error) {
        const fileError = error as NodeJS.ErrnoException;

        if (fileError.code === "ENOENT") {
            return {};
        }

        throw new Error("Cannot read the LLM environment file.");
    }
}

/** Returns a required setting without surrounding spaces, or reports its name if missing. */
function readRequiredValue(settings: EnvironmentValues, name: string): string {
    const value = settings[name];

    if (value === undefined || value.trim() === "") {
        throw new Error(`Missing server configuration: ${name}.`);
    }

    return value.trim();
}

/** Rejects API formats for which this project does not yet have a connector. */
function validateApiFormat(settings: EnvironmentValues): void {
    const format = readRequiredValue(settings, "LLM_API_FORMAT");

    if (format !== "openai-compatible") {
        throw new Error("Unsupported LLM_API_FORMAT. Expected openai-compatible.");
    }
}

/** Validates the provider address and removes trailing slashes before adding an endpoint. */
function readBaseUrl(settings: EnvironmentValues): string {
    const address = readRequiredValue(settings, "LLM_BASE_URL");

    let url: URL;

    try {
        url = new URL(address);
    } catch {
        throw new Error("LLM_BASE_URL must be a valid URL.");
    }

    validateUrlSecurity(url);

    let baseUrl = url.toString();

    while (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
    }

    return baseUrl;
}

/** Requires HTTPS outside localhost and rejects credentials, query parameters and fragments. */
function validateUrlSecurity(url: URL): void {
    const localHosts = ["localhost", "127.0.0.1", "[::1]"];

    const isLocal = localHosts.includes(url.hostname);

    const isHttps = url.protocol === "https:";

    const isLocalHttp = isLocal && url.protocol === "http:";

    if (!isHttps && !isLocalHttp) {
        throw new Error("LLM_BASE_URL requires HTTPS, except for HTTP on localhost.");
    }

    if (url.username || url.password || url.search || url.hash) {
        throw new Error(
            "LLM_BASE_URL must not contain credentials, query parameters or a fragment.",
        );
    }
}

/** Converts the output budget to an integer; uses 400 only when the setting is absent. */
function readTokenLimit(settings: EnvironmentValues): number {
    let value = settings.LLM_MAX_OUTPUT_TOKENS;

    if (value === undefined || value.trim() === "") {
        value = DEFAULT_MAX_OUTPUT_TOKENS;
    }

    const tokens = Number(value);

    if (!Number.isInteger(tokens) || tokens < 1 || tokens > 4096) {
        throw new Error("LLM_MAX_OUTPUT_TOKENS must be an integer between 1 and 4096.");
    }

    return tokens;
}
