import "@tanstack/react-start/server-only";

import { randomUUID } from "node:crypto";

import type { ChatMessage } from "../../llm/client.server.ts";

import { ChatError } from "../chat-error.server.ts";

type Conversation = {
    messages: ChatMessage[];

    pendingUserMessage: string;
};

/** Stores each conversation's completed history and the combined text waiting for its next reply. */
export class ConversationMemory {
    private readonly conversationsById = new Map<string, Conversation>();

    /** Creates an empty history and pending-text buffer, then returns their shared conversation ID. */
    createConversation(): string {
        const conversationId = randomUUID();

        this.conversationsById.set(conversationId, {
            messages: [],

            pendingUserMessage: "",
        });

        return conversationId;
    }

    /** Returns a history copy so building the next model context cannot change stored messages by accident. */
    getMessages(conversationId: string): ChatMessage[] {
        const conversation = this.getConversation(conversationId);

        return structuredClone(conversation.messages);
    }

    /** Appends one message with its role and content. A deleted conversation is never recreated. */
    addMessage(conversationId: string, message: ChatMessage): void {
        const conversation = this.getConversation(conversationId);

        conversation.messages.push({ role: message.role, content: message.content });
    }

    /** Appends accepted user text to the next combined message, preserving arrival order with blank lines. */
    appendPendingMessage(conversationId: string, message: string): void {
        const conversation = this.getConversation(conversationId);

        if (conversation.pendingUserMessage.length > 0) {
            conversation.pendingUserMessage = conversation.pendingUserMessage + "\n\n";
        }

        conversation.pendingUserMessage = conversation.pendingUserMessage + message;
    }

    /** Returns the combined text waiting to be sent; it is separate from completed history. */
    getPendingMessage(conversationId: string): string {
        return this.getConversation(conversationId).pendingUserMessage;
    }

    /** Takes all pending text for one model call and empties the buffer for messages arriving during it. */
    takePendingMessage(conversationId: string): string {
        const conversation = this.getConversation(conversationId);

        const message = conversation.pendingUserMessage;

        conversation.pendingUserMessage = "";

        return message;
    }

    /** Removes the history for this ID; deleting an already removed conversation is harmless. */
    deleteConversation(conversationId: string): void {
        this.conversationsById.delete(conversationId);
    }

    /** Reports stored conversation count so a separate session service can enforce capacity. */
    getConversationCount(): number {
        return this.conversationsById.size;
    }

    /** Finds stored history and pending text for internal use, or reports that the conversation has ended. */
    private getConversation(conversationId: string): Conversation {
        const conversation = this.conversationsById.get(conversationId);

        if (conversation === undefined) {
            throw new ChatError(
                410,
                "SESSION_EXPIRED",
                "This chat has ended. Please start a new chat.",
            );
        }

        return conversation;
    }
}
