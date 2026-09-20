import "@tanstack/react-start/server-only";

import { conversationManager } from "../conversation-manager/index.server.ts";
import type { ChatOutput } from "../websocket-transport/chat-output.ts";

/** Queues the visitor's text. The reply is delivered later through ChatOutput. */
export function requestResponse(
    conversationId: string,
    message: string,
    output: ChatOutput,
): void {
    try {
        conversationManager.requestResponse(conversationId, message);
        output.sendEvent({ type: "accepted" });
    } catch (error) {
        output.sendError(error);
    }
}
