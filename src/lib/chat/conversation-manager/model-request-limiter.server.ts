import "@tanstack/react-start/server-only";

import { ChatError } from "../chat-error.server.ts";

import { readChatSettings } from "../chat-settings.server.ts";

import { logChatEvent } from "../chat-logger.server.ts";

const REQUEST_HISTORY_DURATION_MS = 60 * 1000;

/** Limits model-client calls by their start times, independently of stored chat messages. */
export class ModelRequestLimiter {
    private readonly settings = readChatSettings();

    private readonly callStartTimesByConversationId = new Map<string, number[]>();

    private processCallStartTimes: number[] = [];

    private readonly getCurrentTime: () => number;

    /** Uses the real clock normally; tests supply a clock to advance time without waiting. */
    constructor(getCurrentTime: () => number = Date.now) {
        this.getCurrentTime = getCurrentTime;
    }

    /**
     * Called immediately before invoking the model client, after input/context validation.
     * Rejects excess calls without recording them; otherwise records this call's start time.
     * Recorded calls remain counted if the client later fails. These are neither success
     * counts nor rejection counts. Structured logs expose counts for diagnosis, not billing.
     */
    checkAndRecordModelCall(conversationId: string): void {
        const currentTime = this.getCurrentTime();

        this.removeOldCallTimes(currentTime);

        const conversationCallStartTimes =
            this.callStartTimesByConversationId.get(conversationId) ?? [];

        if (
            conversationCallStartTimes.length >=
                this.settings.maxModelCallsPerConversationPerMinute ||
            this.processCallStartTimes.length >= this.settings.maxModelCallsPerProcessPerMinute
        ) {
            logChatEvent("warn", "model.rate_limit_rejected", {
                conversationId: conversationId,
                conversationCallsLastMinute: conversationCallStartTimes.length,
                processCallsLastMinute: this.processCallStartTimes.length,
            });

            throw new ChatError(429, "CHAT_RATE_LIMIT", "Too many messages. Please wait a minute.");
        }

        conversationCallStartTimes.push(currentTime);

        this.callStartTimesByConversationId.set(conversationId, conversationCallStartTimes);

        this.processCallStartTimes.push(currentTime);

        logChatEvent("info", "model.call_admitted", {
            conversationId: conversationId,
            conversationCallsLastMinute: conversationCallStartTimes.length,
            processCallsLastMinute: this.processCallStartTimes.length,
        });
    }

    /**
     * Keeps only calls started within the last minute, across all conversations.
     * Empty entries are removed so abandoned IDs do not accumulate in this limiter.
     */
    private removeOldCallTimes(currentTime: number): void {
        const oldestIncludedTime = currentTime - REQUEST_HISTORY_DURATION_MS;

        this.processCallStartTimes = this.processCallStartTimes.filter(
            (startedAt) => startedAt > oldestIncludedTime,
        );

        for (const [conversationId, startTimes] of this.callStartTimesByConversationId) {
            const recentStartTimes = startTimes.filter(
                (startedAt) => startedAt > oldestIncludedTime,
            );

            if (recentStartTimes.length === 0) {
                this.callStartTimesByConversationId.delete(conversationId);
            } else {
                this.callStartTimesByConversationId.set(conversationId, recentStartTimes);
            }
        }
    }
}
