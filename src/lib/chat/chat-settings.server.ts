import "@tanstack/react-start/server-only";

import { z } from "zod";

import settings from "../../../config/chat.json" with { type: "json" };

import { logChatEvent } from "./chat-logger.server.ts";

// These are public chat policies, not API credentials. Changes require a restart or redeploy.
const settingsSchema = z
    .object({
        maxModelCallsPerConversationPerMinute: z.number().int().positive(),

        maxModelCallsPerProcessPerMinute: z.number().int().positive(),

        maxModelRequestAttempts: z.number().int().positive(),

        modelRetryDelayMs: z.number().int().nonnegative().max(2147483647),

        greeting: z.string().trim().min(1),
    })
    .strict();

/** Reads and validates the editable chat settings before any conversation is created. */
export function readChatSettings() {
    const result = settingsSchema.safeParse(settings);

    if (!result.success) {
        logChatEvent("error", "configuration.invalid", { errorCode: "INVALID_CHAT_SETTINGS" });

        throw new Error("Invalid chat settings in config/chat.json.");
    }

    return result.data;
}
