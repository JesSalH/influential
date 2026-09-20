import assert from "node:assert/strict";

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";

import { tmpdir } from "node:os";

import { join } from "node:path";

import { test } from "node:test";

import { readLlmConfig } from "../src/lib/llm/config.server.ts";

import { generateChatResponse } from "../src/lib/llm/client.server.ts";

const config = {
    baseUrl: "https://example.invalid/v1",
    apiKey: "test-secret",
    model: "test-model",
    maxOutputTokens: 400,
};

// Uses a temporary .env file to check environment precedence and configuration validation.
test("loads dotenv, preserves hosting overrides, and does not mutate process.env", () => {
    const dir = mkdtempSync(join(tmpdir(), "influential-llm-"));

    try {
        const path = join(dir, ".env");

        const fileContents = [
            "LLM_API_FORMAT=openai-compatible",
            "LLM_BASE_URL=https://example.invalid/v1/",
            'LLM_MODEL="file-model"',
            "LLM_API_KEY=test-secret",
        ].join("\n");

        writeFileSync(path, fileContents);

        const environment = { LLM_MODEL: "host-model" };

        assert.equal(readLlmConfig(environment, path).model, "host-model");

        assert.equal(readLlmConfig(environment, path).baseUrl, config.baseUrl);

        assert.deepEqual(environment, { LLM_MODEL: "host-model" });

        assert.throws(() => readLlmConfig({ LLM_API_KEY: "" }, path), /LLM_API_KEY/);

        assert.throws(
            () => readLlmConfig({ LLM_BASE_URL: "http://remote.example" }, path),
            /HTTPS/,
        );

        assert.throws(() => readLlmConfig({ LLM_MAX_OUTPUT_TOKENS: "0" }, path), /integer/);

        assert.throws(() => readLlmConfig({ LLM_API_FORMAT: "other" }, path), /Unsupported/);
    } finally {
        // Removes only this test's temporary directory, even when an assertion fails.
        rmSync(dir, { recursive: true, force: true });
    }
});

// Checks the HTTP request without network access or a real API key.
test("sends configured model, credentials and budget through the compatible protocol", async () => {
    const messages = [{ role: "user", content: "Hello" }];

    const result = await generateChatResponse(messages, {
        config,
        // Replaces fetch: inspects the request and returns a simulated response.
        request: async (url, options) => {
            assert.equal(url, "https://example.invalid/v1/chat/completions");

            assert.equal(options.headers.Authorization, "Bearer test-secret");

            assert.equal(options.redirect, "error");

            assert.deepEqual(JSON.parse(options.body), {
                model: "test-model",
                messages,
                max_tokens: 400,
                stream: false,
            });

            return Response.json({ choices: [{ message: { content: "Hi" } }] });
        },
    });

    assert.equal(result, "Hi");
});

// Checks that oversized conversations are rejected before contacting the provider.
test("rejects oversized history without a network call", async () => {
    await assert.rejects(
        generateChatResponse([{ role: "user", content: "x".repeat(16001) }], {
            config,
            // If this function runs, the size limit failed to prevent the request.
            request: async () => {
                assert.fail("Must not contact the provider");
            },
        }),

        /16000/,
    );
});

// Simulates failures and checks that sensitive details do not appear in the final error.
test("provider failures never expose response bodies or transport secrets", async () => {
    const simulatedRequests = [
        rejectAuthentication,
        failConnection,
        returnEmptyResponse,
        returnInvalidJson,
    ];

    for (const request of simulatedRequests) {
        await assert.rejects(
            generateChatResponse([{ role: "user", content: "Hi" }], { config, request }),
            errorHidesSecret,
        );
    }
});

/** Simulates an HTTP authentication failure containing sensitive provider details. */
async function rejectAuthentication() {
    return new Response("test-secret", { status: 401 });
}

/** Simulates a connection failure whose original error includes sensitive details. */
async function failConnection() {
    throw new Error("test-secret");
}

/** Simulates a valid JSON response without any assistant messages. */
async function returnEmptyResponse() {
    return Response.json({ choices: [] });
}

/** Simulates a provider response that cannot be parsed as JSON. */
async function returnInvalidJson() {
    return new Response("not json");
}

/** Checks that the error reported to the caller does not contain the fake secret. */
function errorHidesSecret(error) {
    return !error.message.includes("test-secret");
}
