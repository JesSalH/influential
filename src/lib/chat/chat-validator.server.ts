import "@tanstack/react-start/server-only";

import { z } from "zod";

import { ChatError } from "./chat-error.server.ts";
import { MAX_MESSAGE_CHARACTERS } from "./websocket-transport/chat-socket-protocol.ts";

export type ChatInput = {
    message: string;
};

export { MAX_MESSAGE_CHARACTERS };

// Visitors supply text only, never roles, history, instructions or model settings.
const chatSchema = z
    .object({
        message: z.string().max(MAX_MESSAGE_CHARACTERS).trim().min(1),
    })
    .strict();

/** Validates the input structure and returns trimmed text without stripping punctuation. */
export function validateChatInput(input: unknown): ChatInput {
    const result = chatSchema.safeParse(input);

    if (!result.success) {
        throw new ChatError(
            400,
            "INVALID_MESSAGE",
            "Provide a non-empty message of at most 2000 characters, with no extra fields.",
        );
    }

    // Allow normal line breaks and tabs, but reject invisible ASCII control characters.
    if (hasUnsupportedControlCharacters(result.data.message)) {
        throw new ChatError(
            400,
            "INVALID_MESSAGE",
            "The message contains unsupported control characters.",
        );
    }

    return result.data;
}

/** Detects ASCII control characters, allowing tabs and normal line breaks. */
function hasUnsupportedControlCharacters(message: string): boolean {
    for (const character of message) {
        const code = character.charCodeAt(0);

        const isAllowedWhitespace = character === "\t" || character === "\n" || character === "\r";

        if ((code < 32 && !isAllowedWhitespace) || code === 127) {
            return true;
        }
    }

    return false;
}
