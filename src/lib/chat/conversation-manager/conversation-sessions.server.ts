import "@tanstack/react-start/server-only";

import { ConversationMemory } from "./conversation-memory.server.ts";

import { ChatError } from "../chat-error.server.ts";

import { logChatEvent } from "../chat-logger.server.ts";

export const CONVERSATION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const MAX_ACTIVE_CONVERSATIONS = 100;

/** Owns session lifetime and capacity policies; the memory class only stores messages. */
export class ConversationSessions {
    private readonly memory: ConversationMemory;

    private readonly lastActivityTimeByConversationId = new Map<string, number>();

    private readonly getCurrentTime: () => number;

    /** Receives the shared store and an optional test clock; does not start background timers. */
    constructor(memory: ConversationMemory, getCurrentTime: () => number = Date.now) {
        this.memory = memory;

        this.getCurrentTime = getCurrentTime;
    }

    /**
     * Removes abandoned sessions, checks capacity and then asks memory to create a history.
     * These are session-admission policies, not responsibilities of memory.createConversation.
     */
    openConversation(): string {
        this.removeInactiveConversations();

        if (this.memory.getConversationCount() >= MAX_ACTIVE_CONVERSATIONS) {
            logChatEvent("warn", "conversation.capacity_rejected", {
                activeConversations: this.memory.getConversationCount(),
            });

            throw new ChatError(503, "CHAT_CAPACITY", "Chat is busy. Please try again later.");
        }

        const conversationId = this.memory.createConversation();

        this.lastActivityTimeByConversationId.set(conversationId, this.getCurrentTime());

        return conversationId;
    }

    /** Checks that the conversation is still live before the manager accepts or processes its messages. */
    requireActiveConversation(conversationId: string): void {
        this.removeInactiveConversations();

        if (!this.lastActivityTimeByConversationId.has(conversationId)) {
            throw new ChatError(
                410,
                "SESSION_EXPIRED",
                "This chat has ended. Please start a new chat.",
            );
        }
    }

    /** Updates inactivity timing when processing starts or finishes, without recreating a closed session. */
    recordActivity(conversationId: string): void {
        if (this.lastActivityTimeByConversationId.has(conversationId)) {
            this.lastActivityTimeByConversationId.set(conversationId, this.getCurrentTime());
        }
    }

    /** Removes both the history and its lifetime metadata when the browser explicitly closes the chat. */
    closeConversation(conversationId: string): void {
        this.memory.deleteConversation(conversationId);

        this.lastActivityTimeByConversationId.delete(conversationId);
    }

    /**
     * Deletes histories idle for 30 minutes, including sessions whose connection disappeared silently.
     * Cleanup runs on the next session open/check, not continuously in a background task.
     */
    private removeInactiveConversations(): void {
        const currentTime = this.getCurrentTime();

        for (const [conversationId, lastActivityTime] of this.lastActivityTimeByConversationId) {
            if (currentTime - lastActivityTime >= CONVERSATION_INACTIVITY_TIMEOUT_MS) {
                logChatEvent("info", "conversation.expired", { conversationId: conversationId });

                this.closeConversation(conversationId);
            }
        }
    }
}
