import "@tanstack/react-start/server-only";

import { readLlmConfig } from "./config.server.ts";

import type { LlmConfig } from "./config.server.ts";

import { LlmRequestError } from "./request-error.server.ts";

export type ChatMessage = {
    role: "system" | "user" | "assistant";

    content: string;
};

// Tests can supply configuration and replace the real HTTP connection.
type ChatOptions = {
    config?: LlmConfig;

    request?: typeof fetch;

    signal?: AbortSignal;
};

// Describes the part of the provider response that we need to read.
type ProviderResponse = {
    choices?: {
        message?: {
            content?: unknown;
        };
    }[];
};

/** Coordinates the steps needed to get a text response from the model. */
export async function generateChatResponse(
    messages: ChatMessage[],
    options: ChatOptions = {},
): Promise<string> {
    let config = options.config;

    if (config === undefined) {
        try {
            config = readLlmConfig();
        } catch {
            throw new LlmRequestError(
                "The model connection is not configured correctly.",
                false,
                "LLM_CONFIGURATION_INVALID",
            );
        }
    }

    let request = options.request;

    if (request === undefined) {
        request = fetch;
    }

    validateMessages(messages);

    const requestOptions = buildRequest(messages, config, options.signal);

    const url = config.baseUrl + "/chat/completions";

    const response = await sendRequest(url, requestOptions, request);

    const text = await readResponse(response);

    return text;
}

/** Checks message count, roles and content before making a paid request. */
function validateMessages(messages: ChatMessage[]): void {
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20) {
        throw new Error("Provide between 1 and 20 chat messages.");
    }

    const allowedRoles = ["system", "user", "assistant"];

    let totalCharacters = 0;

    for (const message of messages) {
        if (!message || !allowedRoles.includes(message.role)) {
            throw new Error("Each message must have a valid chat role.");
        }

        if (typeof message.content !== "string" || !message.content.trim()) {
            throw new Error("Each message must contain non-empty text.");
        }

        totalCharacters = totalCharacters + message.content.length;
    }

    if (totalCharacters > 16000) {
        throw new Error("Chat messages must contain at most 16000 characters in total.");
    }
}

/** Builds the HTTP options, including authentication and the JSON request body. */
function buildRequest(
    messages: ChatMessage[],
    config: LlmConfig,
    cancellation?: AbortSignal,
): RequestInit {
    const cleanMessages: ChatMessage[] = [];

    // Copy only the fields accepted by the provider, ignoring any extra properties.
    for (const message of messages) {
        cleanMessages.push({
            role: message.role,

            content: message.content,
        });
    }

    const body = {
        model: config.model,

        messages: cleanMessages,

        max_tokens: config.maxOutputTokens,

        stream: false,
    };

    const timeout = AbortSignal.timeout(30000);

    // Closing the chat can cancel the request before the normal provider timeout.
    const signal = cancellation ? AbortSignal.any([cancellation, timeout]) : timeout;

    return {
        method: "POST",

        redirect: "error",

        // The API key stays on the server and is sent only to the configured provider.
        headers: {
            "Content-Type": "application/json",

            Authorization: "Bearer " + config.apiKey,
        },

        // HTTP sends JSON text, not a JavaScript object.
        body: JSON.stringify(body),

        signal: signal,
    };
}

/** Sends the HTTP request and hides sensitive connection error details. */
async function sendRequest(
    url: string,
    options: RequestInit,
    request: typeof fetch,
): Promise<Response> {
    let response: Response;

    try {
        response = await request(url, options);
    } catch {
        const code = options.signal?.aborted ? "LLM_REQUEST_ABORTED" : "LLM_CONNECTION_FAILED";

        throw new LlmRequestError("The LLM request failed or timed out.", true, code);
    }

    // fetch does not throw for HTTP error codes, so check the status explicitly.
    if (!response.ok) {
        const retryable =
            response.status === 408 || response.status === 429 || response.status >= 500;

        // Release the unused error body; it may contain provider diagnostics that must remain private.
        await response.body?.cancel().catch(() => undefined);

        throw new LlmRequestError(
            `The LLM provider rejected the request (HTTP ${response.status}).`,
            retryable,
            "LLM_HTTP_ERROR",
            response.status,
        );
    }

    return response;
}

/** Parses the provider response and checks that it contains usable text. */
async function readResponse(response: Response): Promise<string> {
    let payload: ProviderResponse | null;

    try {
        payload = await response.json();
    } catch {
        throw new LlmRequestError(
            "The LLM provider returned invalid JSON.",
            true,
            "LLM_INVALID_JSON",
        );
    }

    // ?. returns undefined if a level is missing instead of throwing an error.
    const firstChoice = payload?.choices?.[0];

    const message = firstChoice?.message;

    const content = message?.content;

    // Type declarations do not validate external JSON; check the actual value here.
    if (typeof content !== "string" || !content.trim()) {
        throw new LlmRequestError(
            "The LLM provider returned no text response.",
            true,
            "LLM_EMPTY_REPLY",
        );
    }

    return content;
}
