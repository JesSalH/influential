import "@tanstack/react-start/server-only";

import { ConversationMemory } from "./conversation-memory.server.ts";

import { ConversationSessions } from "./conversation-sessions.server.ts";

import { ConversationManager } from "./conversation-manager.server.ts";

import { ModelRequestLimiter } from "./model-request-limiter.server.ts";

import { RetryingLlmClient } from "../../llm/llm-client.server.ts";

import { readChatSettings } from "../chat-settings.server.ts";

import { logChatEvent } from "../chat-logger.server.ts";

// Entry handlers can only open, receive messages and close; storage and policies remain internal.
type ConversationManagerApi = Pick<
    ConversationManager,
    "openConversation" | "requestResponse" | "closeConversation"
>;

/** Creates the shared manager and injects its independent LLM client, storage and session policies. */
function createConversationManager(): ConversationManagerApi {
    const settings = readChatSettings();

    const memory = new ConversationMemory();

    const sessions = new ConversationSessions(memory);

    const modelRequestLimiter = new ModelRequestLimiter();

    const llmClient = new RetryingLlmClient(
        {
            maxAttempts: settings.maxModelRequestAttempts,
            retryDelayMs: settings.modelRetryDelayMs,
        },
        logChatEvent,
    );

    const manager = new ConversationManager(memory, sessions, llmClient, modelRequestLimiter);

    logChatEvent("info", "services.initialized");

    return manager;
}

// Shared within this server process. The module exposes no memory, session or limiter instances.
export const conversationManager = createConversationManager();

export type { ResponseMessage } from "./response-message.ts";
