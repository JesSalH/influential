import "@tanstack/react-start/server-only";

import { logChatEvent } from "../chat-logger.server.ts";
import { closeConversation } from "./close-conversation.server.ts";
import type { ChatOutput } from "../websocket-transport/chat-output.ts";

/** Socket failed. Stop the conversation, then close the peer. */
export function handleConnectionError(
    conversationId: string | undefined,
    output: ChatOutput,
): void {
    logChatEvent("error", "socket.transport_failed", {
        conversationId,
        errorCode: "SOCKET_ERROR",
    });

    closeConversation(conversationId);
    output.closeConnection(1011, "Chat connection failed");
}
