import "@tanstack/react-start/server-only";

import { randomUUID } from "node:crypto";

import type { ChatMessage } from "../llm/client.server.ts";

import { ChatError } from "./chat-error.server.ts";

/** Stores message lists by conversation ID. Timing, request limits and concurrency live elsewhere. */
export class ConversationMemory {
    private readonly messagesByConversationId = new Map<string, ChatMessage[]>();

    /** Creates an empty message list and returns its new ID. Does not apply session policies. */
    createConversation(): string {
        const conversationId = randomUUID();

        this.messagesByConversationId.set(conversationId, []);

        return conversationId;
    }

    /** Returns a copy of the history so the handler cannot change stored messages by accident. */
    getMessages(conversationId: string): ChatMessage[] {
        const messages = this.getStoredMessages(conversationId);

        return structuredClone(messages);
    }

    /** Appends one message with its role and content. A deleted conversation is never recreated. */
    addMessage(conversationId: string, message: ChatMessage): void {
        const messages = this.getStoredMessages(conversationId);

        messages.push({ role: message.role, content: message.content });
    }

    /** Removes the history for this ID; deleting an already removed conversation is harmless. */
    deleteConversation(conversationId: string): void {
        this.messagesByConversationId.delete(conversationId);
    }

    /** Reports stored conversation count so a separate session service can enforce capacity. */
    getConversationCount(): number {
        return this.messagesByConversationId.size;
    }

    /** Finds the actual stored list for internal use, or reports that the conversation has ended. */
    private getStoredMessages(conversationId: string): ChatMessage[] {
        const messages = this.messagesByConversationId.get(conversationId);

        if (messages === undefined) {
            throw new ChatError(
                410,
                "SESSION_EXPIRED",
                "This chat has ended. Please start a new chat.",
            );
        }

        return messages;
    }
}
