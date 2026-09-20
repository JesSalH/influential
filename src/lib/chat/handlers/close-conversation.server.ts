import "@tanstack/react-start/server-only";

import { conversationManager } from "../conversation-manager/index.server.ts";

/** Ends paid work and drops history. Safe to call twice or with a missing id. */
export function closeConversation(conversationId: string | undefined): void {
    if (conversationId === undefined) {
        return;
    }

    conversationManager.closeConversation(conversationId);
}
