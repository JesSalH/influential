import "@tanstack/react-start/server-only";

import { setTimeout as delay } from "node:timers/promises";

import { generateChatResponse } from "./client.server.ts";

import type { ChatMessage } from "./client.server.ts";

import { LlmRequestError } from "./request-error.server.ts";

type RetrySettings = {
    maxAttempts: number;

    retryDelayMs: number;
};

type LogFields = Record<string, string | number | boolean | undefined>;

type LogEvent = (level: "info" | "warn" | "error", event: string, fields: LogFields) => void;

type ModelAttemptContext = {
    conversationId: string;

    batchId: string;

    attemptNumber: number;
};

export type LlmRequestOptions = {
    conversationId: string;

    batchId: string;

    signal: AbortSignal;

    // The caller checks its allowance before every attempt, without coupling this client to a limiter.
    beforeAttempt: () => void;
};

/** The manager depends on this contract, without knowing the provider or HTTP implementation. */
export interface LlmClient {
    /** Returns one reply, or a final error after any permitted retries. */
    generateReply(messages: ChatMessage[], options: LlmRequestOptions): Promise<string>;
}

/** Owns provider calls and automatic retries, without storing conversations or knowing frontend transports. */
export class RetryingLlmClient implements LlmClient {
    private readonly settings: RetrySettings;

    private readonly log: LogEvent;

    /** Receives retry configuration and a logger from the application's composition code. */
    constructor(settings: RetrySettings, log: LogEvent) {
        this.settings = settings;

        this.log = log;
    }

    /** Retries an unchanged context on temporary failures, keeping intermediate errors inside the server. */
    async generateReply(messages: ChatMessage[], options: LlmRequestOptions): Promise<string> {
        const { conversationId, batchId, signal } = options;

        const maximumAttempts = this.settings.maxAttempts;

        for (let attemptNumber = 1; attemptNumber <= maximumAttempts; attemptNumber++) {
            signal.throwIfAborted();

            // Rejected calls do not reach the client and must not be retried.
            options.beforeAttempt();

            const context = { conversationId, batchId, attemptNumber };

            try {
                return await this.performAttempt(messages, context, signal);
            } catch (error) {
                signal.throwIfAborted();

                const canRetry = error instanceof LlmRequestError && error.retryable;

                if (!canRetry || attemptNumber === maximumAttempts) {
                    throw error;
                }

                this.log("info", "model.retry_scheduled", {
                    ...context,
                    delayMs: this.settings.retryDelayMs,
                });

                // New messages stay in the next batch during this cancellable wait.
                await delay(this.settings.retryDelayMs, undefined, { signal });
            }
        }

        throw new Error("Model request attempts must be configured as a positive integer.");
    }

    /** Calls the provider once and records its duration and safe outcome for the current batch. */
    private async performAttempt(
        messages: ChatMessage[],
        context: ModelAttemptContext,
        signal?: AbortSignal,
    ): Promise<string> {
        const startedAt = performance.now();

        this.log("info", "model.attempt_started", context);

        try {
            const reply = await generateChatResponse(messages, { signal });

            this.log("info", "model.attempt_succeeded", {
                ...context,
                durationMs: Math.round(performance.now() - startedAt),
            });

            return reply;
        } catch (error) {
            this.log(
                signal?.aborted ? "info" : "warn",
                signal?.aborted ? "model.attempt_cancelled" : "model.attempt_failed",
                {
                    ...context,
                    durationMs: Math.round(performance.now() - startedAt),
                    ...describeFailure(error),
                },
            );

            throw error;
        }
    }
}

/** Returns only classified provider diagnostics; arbitrary errors may contain sensitive data. */
function describeFailure(error: unknown): LogFields {
    if (error instanceof LlmRequestError) {
        return { errorCode: error.code, status: error.status, retryable: error.retryable };
    }

    return { errorCode: "INTERNAL_ERROR" };
}
