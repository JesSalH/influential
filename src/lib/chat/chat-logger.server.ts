import "@tanstack/react-start/server-only";

import { randomUUID } from "node:crypto";

import { ChatError } from "./chat-error.server.ts";

import { LlmRequestError } from "../llm/request-error.server.ts";

type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | undefined>;

const processInstanceId = randomUUID();

/** Writes one JSON record to the server console. Callers supply metadata, never text, headers or credentials. */
export function logChatEvent(level: LogLevel, event: string, fields: LogFields = {}): void {
    const record = JSON.stringify({
        ...fields,
        timestamp: new Date().toISOString(),
        level: level,
        service: "influential-chat",
        processInstanceId: processInstanceId,
        event: event,
    });

    // Logging must not interrupt message delivery if the output stream is unavailable.
    try {
        if (level === "error") {
            console.error(record);
        } else if (level === "warn") {
            console.warn(record);
        } else {
            console.info(record);
        }
    } catch {
        // There is no independent log destination to report a console failure to.
    }
}

/** Extracts known diagnostic fields without serializing arbitrary errors, provider bodies or secret-bearing stacks. */
export function describeChatFailure(error: unknown): LogFields {
    if (error instanceof ChatError) {
        return { errorCode: error.code, status: error.status };
    }

    if (error instanceof LlmRequestError) {
        return { errorCode: error.code, status: error.status, retryable: error.retryable };
    }

    return { errorCode: "INTERNAL_ERROR" };
}
