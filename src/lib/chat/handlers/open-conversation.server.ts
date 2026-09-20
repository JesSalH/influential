import "@tanstack/react-start/server-only";

import { conversationManager } from "../conversation-manager/index.server.ts";
import { readChatSettings } from "../chat-settings.server.ts";
import type { ChatOutput } from "../websocket-transport/chat-output.ts";

/** Opens a conversation and sends the greeting. Does not touch the socket peer. */
export function openConversation(output: ChatOutput): string {
    const conversationId = conversationManager.openConversation({
        onResponse: output.sendResponse.bind(output),
        onError: output.sendError.bind(output),
    });

    output.sendEvent({
        type: "greeting",
        conversationId,
        message: readChatSettings().greeting,
    });

    return conversationId;
}
