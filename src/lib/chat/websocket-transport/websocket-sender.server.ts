import "@tanstack/react-start/server-only";

import type { Peer } from "crossws";

import type { ResponseMessage } from "../conversation-manager/response-message.ts";
import type { ChatOutput } from "./chat-output.ts";
import type { ChatServerEvent } from "./chat-socket-protocol.ts";
import { ChatError } from "../chat-error.server.ts";
import { describeChatFailure, logChatEvent } from "../chat-logger.server.ts";
import { LlmRequestError } from "../../llm/request-error.server.ts";

/** Sends events on one connection. Does not open or close conversations. */
export class WebSocketSender implements ChatOutput {
    private readonly peer: Peer;

    constructor(peer: Peer) {
        this.peer = peer;
    }

    sendResponse(response: ResponseMessage): void {
        this.sendEvent({ type: "reply", message: response.content });
    }

    sendError(failure: unknown): void {
        logChatEvent("error", "socket.request_failed", {
            connectionId: this.peer.id,
            conversationId: this.conversationId(),
            ...describeChatFailure(failure),
        });

        const { code, message } = visitorError(failure);

        this.sendEvent({ type: "error", code, message });

        if (failure instanceof ChatError && failure.status === 410) {
            this.closeConnection(1000, "Conversation ended");
        }
    }

    sendEvent(event: ChatServerEvent): boolean {
        try {
            if (this.peer.websocket.readyState !== 1) {
                this.closeConnection(1011, "Chat connection failed");
                return false;
            }

            this.peer.send(JSON.stringify(event));

            logChatEvent("info", "socket.event_sent", {
                connectionId: this.peer.id,
                conversationId: this.conversationId(),
                eventType: event.type,
            });

            return true;
        } catch {
            logChatEvent("error", "socket.transport_failed", {
                connectionId: this.peer.id,
                conversationId: this.conversationId(),
                errorCode: "SOCKET_SEND_FAILED",
            });

            this.closeConnection(1011, "Chat connection failed");
            return false;
        }
    }

    closeConnection(code: number, reason: string): void {
        this.peer.close(code, reason);
    }

    private conversationId(): string | undefined {
        const value = this.peer.context.conversationId;
        return typeof value === "string" ? value : undefined;
    }
}

function visitorError(failure: unknown): { code: string; message: string } {
    if (failure instanceof ChatError) {
        return { code: failure.code, message: failure.message };
    }

    if (failure instanceof LlmRequestError) {
        return { code: failure.code, message: failure.message };
    }

    return {
        code: "REPLY_FAILED",
        message: "Sorry, I couldn't process your request. Please ask me again.",
    };
}
