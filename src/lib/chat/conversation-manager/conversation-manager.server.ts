import "@tanstack/react-start/server-only";

import { ConversationMemory } from "./conversation-memory.server.ts";

import { ConversationSessions } from "./conversation-sessions.server.ts";

import { ChatError } from "../chat-error.server.ts";

import { randomUUID } from "node:crypto";

import { describeChatFailure, logChatEvent } from "../chat-logger.server.ts";

import type { LlmClient } from "../../llm/llm-client.server.ts";

import type { ChatMessage } from "../../llm/client.server.ts";

import { ModelRequestLimiter } from "./model-request-limiter.server.ts";

import { CHAT_INSTRUCTIONS } from "../chat-instructions.server.ts";

import type { ResponseMessage } from "./response-message.ts";

type ConversationCallbacks = {
    onResponse: (response: ResponseMessage) => void;

    onError: (error: unknown) => void;
};

type ConversationProcessing = {
    callbacks: ConversationCallbacks;

    cancellation: AbortController;

    processingMessages: boolean;
};

/** Runs one model request at a time per conversation, grouping text received while a reply is pending. */
export class ConversationManager {
    private readonly processingByConversationId = new Map<string, ConversationProcessing>();

    private readonly memory: ConversationMemory;

    private readonly sessions: ConversationSessions;

    private readonly llmClient: LlmClient;

    private readonly modelRequestLimiter: ModelRequestLimiter;

    /** Receives storage, session rules, the LLM client and its limiter; it has no HTTP or WebSocket dependency. */
    constructor(
        memory: ConversationMemory,
        sessions: ConversationSessions,
        llmClient: LlmClient,
        modelRequestLimiter: ModelRequestLimiter,
    ) {
        this.memory = memory;

        this.sessions = sessions;

        this.llmClient = llmClient;

        this.modelRequestLimiter = modelRequestLimiter;
    }

    /** Creates a conversation and registers where its independent replies and final errors will be delivered. */
    openConversation(callbacks: ConversationCallbacks): string {
        const conversationId = this.sessions.openConversation();

        this.processingByConversationId.set(conversationId, {
            callbacks: callbacks,

            cancellation: new AbortController(),

            processingMessages: false,
        });

        logChatEvent("info", "conversation.opened", { conversationId: conversationId });

        return conversationId;
    }

    /** Accepts validated text and starts processing if idle, without waiting for the model response. */
    requestResponse(conversationId: string, message: string): void {
        this.sessions.requireActiveConversation(conversationId);

        this.memory.appendPendingMessage(conversationId, message);

        this.sessions.recordActivity(conversationId);

        logChatEvent("info", "message.queued", {
            conversationId: conversationId,
            messageCharacters: message.length,
            pendingCharacters: this.memory.getPendingMessage(conversationId).length,
            modelOccupied: this.getProcessing(conversationId).processingMessages,
        });

        this.processPendingMessages(conversationId);
    }

    /** Starts the queue if idle. Further calls leave the current request running and its pending text untouched. */
    private processPendingMessages(conversationId: string): void {
        const processing = this.getProcessing(conversationId);

        if (processing.processingMessages) {
            return;
        }

        processing.processingMessages = true;

        // The receive event finishes now. Model replies are delivered later through the callbacks.
        void this.drainMessages(conversationId, processing).catch((error: unknown) => {
            if (!processing.cancellation.signal.aborted) {
                logChatEvent("error", "conversation.processing_failed", {
                    conversationId: conversationId,
                    ...describeChatFailure(error),
                });

                processing.callbacks.onError(error);

                this.closeConversation(conversationId);
            }
        });
    }

    /** Deletes history and pending text, and cancels waiting work so it cannot restart a closed conversation. */
    closeConversation(conversationId: string): void {
        const processing = this.processingByConversationId.get(conversationId);

        processing?.cancellation.abort();

        this.processingByConversationId.delete(conversationId);

        this.sessions.closeConversation(conversationId);

        if (processing !== undefined) {
            logChatEvent("info", "conversation.closed", { conversationId: conversationId });
        }
    }

    /** Processes complete batches in arrival order; text received during an await belongs to the next batch. */
    private async drainMessages(
        conversationId: string,
        processing: ConversationProcessing,
    ): Promise<void> {
        try {
            while (!processing.cancellation.signal.aborted) {
                this.sessions.requireActiveConversation(conversationId);

                const message = this.memory.takePendingMessage(conversationId);

                if (message.length === 0) {
                    return;
                }

                await this.processBatch(conversationId, message, processing);
            }
        } finally {
            processing.processingMessages = false;
        }
    }

    /** Returns one completed response or final failure to the entry handler for the entire combined message. */
    private async processBatch(
        conversationId: string,
        message: string,
        processing: ConversationProcessing,
    ): Promise<void> {
        const signal = processing.cancellation.signal;

        const batchId = randomUUID();

        const startedAt = performance.now();

        logChatEvent("info", "batch.started", {
            conversationId: conversationId,
            batchId: batchId,
            messageCharacters: message.length,
        });

        try {
            const response = await this.generateResponse(conversationId, message, signal, batchId);

            if (!signal.aborted) {
                this.sessions.recordActivity(conversationId);

                processing.callbacks.onResponse(response);

                logChatEvent("info", "batch.completed", {
                    conversationId: conversationId,
                    batchId: batchId,
                    durationMs: Math.round(performance.now() - startedAt),
                });
            }
        } catch (error) {
            logChatEvent(
                signal.aborted ? "info" : "error",
                signal.aborted ? "batch.cancelled" : "batch.failed",
                {
                    conversationId: conversationId,
                    batchId: batchId,
                    durationMs: Math.round(performance.now() - startedAt),
                    ...describeChatFailure(error),
                },
            );

            if (!signal.aborted) {
                processing.callbacks.onError(error);
            }
        }
    }

    /** Finds the processing state for an open connection without creating a replacement session. */
    private getProcessing(conversationId: string): ConversationProcessing {
        const processing = this.processingByConversationId.get(conversationId);

        if (processing === undefined) {
            throw new ChatError(
                410,
                "SESSION_EXPIRED",
                "This chat has ended. Please start a new chat.",
            );
        }

        return processing;
    }

    /** Adds the completed history, requests one reply and saves the combined user message and answer. */
    private async generateResponse(
        conversationId: string,
        message: string,
        signal: AbortSignal,
        batchId: string,
    ): Promise<ResponseMessage> {
        const history = this.memory.getMessages(conversationId);

        const messages = this.buildMessages(history, message);

        logChatEvent("info", "context.prepared", {
            conversationId: conversationId,
            batchId: batchId,
            messageCount: messages.length,
        });

        const reply = await this.llmClient.generateReply(messages, {
            conversationId: conversationId,
            batchId: batchId,
            signal: signal,
            beforeAttempt: () => this.modelRequestLimiter.checkAndRecordModelCall(conversationId),
        });

        signal.throwIfAborted();

        this.validateReply(reply);

        // Save only after a valid reply. There is no await between these two storage operations.
        this.memory.addMessage(conversationId, { role: "user", content: message });

        this.memory.addMessage(conversationId, { role: "assistant", content: reply });

        logChatEvent("info", "history.updated", {
            conversationId: conversationId,
            batchId: batchId,
            messageCount: history.length + 2,
        });

        return { role: "assistant", content: reply };
    }

    /** Builds the model context without modifying stored history or duplicating instructions. */
    private buildMessages(history: ChatMessage[], message: string): ChatMessage[] {
        const messages: ChatMessage[] = [];

        messages.push({ role: "system", content: CHAT_INSTRUCTIONS });

        for (const previousMessage of history) {
            messages.push(previousMessage);
        }

        messages.push({ role: "user", content: message });

        let characters = 0;

        for (const item of messages) {
            characters = characters + item.content.length;
        }

        // Match the connector limits. Never silently discard messages or summarize them.
        if (messages.length > 20 || characters > 16000) {
            throw new ChatError(
                409,
                "CHAT_LIMIT",
                "This conversation has reached its limit. Please start a new chat.",
            );
        }

        return messages;
    }

    /** Rejects empty or excessive output before storing it in the shared memory. */
    private validateReply(reply: string): void {
        if (typeof reply !== "string" || !reply.trim() || reply.length > 16000) {
            throw new ChatError(
                502,
                "INVALID_REPLY",
                "The assistant could not provide a valid reply. Please try again.",
            );
        }
    }
}
