import "@tanstack/react-start/server-only";

import type { Peer } from "crossws";

import type { ResponseMessage } from "../conversation-manager/response-message.ts";

import type { ChatServerEvent } from "./chat-socket-protocol.ts";

import { ChatError } from "../chat-error.server.ts";

import { describeChatFailure, logChatEvent } from "../chat-logger.server.ts";

/** Sends outgoing events through one connection. It is not an incoming message handler. */
export class WebSocketSender {
    private readonly peer: Peer;

    private readonly endConversation: (conversationId: string) => void;

    /** Receives the connection and a cleanup action to stop paid work if delivery becomes impossible. */
    constructor(peer: Peer, endConversation: (conversationId: string) => void) {
        this.peer = peer;

        this.endConversation = endConversation;
    }

    /** Converts the manager's completed response into the browser's reply event. */
    sendResponse(response: ResponseMessage): void {
        this.sendEvent({ type: "reply", message: response.content });
    }

    /** Sends a safe final error; provider retry failures remain internal until all attempts finish. */
    sendError(failure: unknown): void {
        logChatEvent("error", "socket.request_failed", {
            connectionId: this.peer.id,
            conversationId: this.conversationId(),
            ...describeChatFailure(failure),
        });

        const code = failure instanceof ChatError ? failure.code : "REPLY_FAILED";

        const message =
            failure instanceof ChatError
                ? failure.message
                : "Sorry, I couldn't process your request. Please ask me again.";

        this.sendEvent({ type: "error", code, message });

        if (failure instanceof ChatError && failure.status === 410) {
            this.closeConnection(1000, "Conversation ended");
        }
    }

    /** Sends a greeting, receipt or reply to this peer only, without invoking any input handler. */
    sendEvent(event: ChatServerEvent): boolean {
        try {
            if (this.peer.websocket.readyState !== 1) {
                this.releaseConversation();

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

    /** Releases conversation state once when the socket closes or can no longer deliver responses. */
    releaseConversation(): void {
        const conversationId = this.conversationId();

        if (conversationId !== undefined) {
            this.endConversation(conversationId);

            delete this.peer.context.conversationId;

            logChatEvent("info", "socket.closed", { connectionId: this.peer.id, conversationId });
        }
    }

    /** Cancels conversation work before closing the transport, including when a write has failed. */
    closeConnection(code: number, reason: string): void {
        this.releaseConversation();

        this.peer.close(code, reason);
    }

    /** Reads the server-owned conversation identity associated with this connection, if still active. */
    private conversationId(): string | undefined {
        const value = this.peer.context.conversationId;

        return typeof value === "string" ? value : undefined;
    }
}
