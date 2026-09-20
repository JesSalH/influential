import "@tanstack/react-start/server-only";

import { z } from "zod";

import { ChatError } from "../chat-error.server.ts";

import { validateChatInput } from "../chat-validator.server.ts";

import type { ChatClientEvent } from "./chat-socket-protocol.ts";

const messageEventSchema = z
    .object({
        type: z.literal("message"),

        message: z.string(),
    })
    .strict();

/** Parses one socket event and validates the visitor's text before it reaches the conversation manager. */
export function readChatSocketEvent(text: string): ChatClientEvent {
    let input: unknown;

    try {
        input = JSON.parse(text);
    } catch {
        throw new ChatError(400, "INVALID_JSON", "Send a valid JSON chat event.");
    }

    const result = messageEventSchema.safeParse(input);

    if (!result.success) {
        throw new ChatError(
            400,
            "INVALID_EVENT",
            "Send a message event containing only type and message.",
        );
    }

    const validatedInput = validateChatInput({ message: result.data.message });

    return { type: "message", message: validatedInput.message };
}

/** Rejects cross-origin browser connections before they can create a conversation. This is not authentication. */
export function validateChatSocketOrigin(request: Request): void {
    const origin = request.headers.get("origin");

    if (origin !== new URL(request.url).origin) {
        throw new Response("Forbidden", { status: 403 });
    }
}
