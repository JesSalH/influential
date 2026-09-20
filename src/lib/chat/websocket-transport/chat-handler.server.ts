import "@tanstack/react-start/server-only";

import type { Hooks, Message, Peer } from "crossws";

import { conversationManager } from "../conversation-manager/index.server.ts";

import { ChatError } from "../chat-error.server.ts";

import { logChatEvent } from "../chat-logger.server.ts";

import { readChatSettings } from "../chat-settings.server.ts";

import { MAX_CHAT_EVENT_BYTES } from "./chat-socket-protocol.ts";

import { readChatSocketEvent, validateChatSocketOrigin } from "./chat-socket-validator.server.ts";

import { WebSocketSender } from "./websocket-sender.server.ts";

/** Checks the browser origin before accepting an incoming connection. */
function upgrade(request: Request): void {
    try {
        validateChatSocketOrigin(request);
    } catch (error) {
        logChatEvent("warn", "socket.upgrade_rejected", { errorCode: "ORIGIN_REJECTED" });

        throw error;
    }
}

/** Creates one conversation and registers its outgoing sender when CrossWS opens the connection. */
function openConversationHandler(peer: Peer): void {
    const sender = new WebSocketSender(peer, (id) => conversationManager.closeConversation(id));

    peer.context.chatSender = sender;

    try {
        const conversationId = conversationManager.openConversation({
            // Register sender methods once. Future replies do not re-enter an incoming handler.
            onResponse: sender.sendResponse.bind(sender),

            onError: sender.sendError.bind(sender),
        });

        peer.context.conversationId = conversationId;

        logChatEvent("info", "socket.opened", { connectionId: peer.id, conversationId });

        sender.sendEvent({
            type: "greeting",
            conversationId,
            message: readChatSettings().greeting,
        });
    } catch (error) {
        sender.sendError(error);

        sender.closeConnection(1011, "Unable to start chat");
    }
}

/** Validates an incoming message and requests a response; the sender delivers that response independently. */
function requestResponseHandler(peer: Peer, incoming: Message): void {
    const sender = getSender(peer);

    try {
        const conversationId = getConversationId(peer);

        logChatEvent("info", "socket.message_received", { connectionId: peer.id, conversationId });

        if (incoming.uint8Array().byteLength > MAX_CHAT_EVENT_BYTES) {
            throw new ChatError(413, "BODY_TOO_LARGE", "The message is too large.");
        }

        const input = readChatSocketEvent(incoming.text());

        conversationManager.requestResponse(conversationId, input.message);

        sender.sendEvent({ type: "accepted" });
    } catch (error) {
        sender.sendError(error);
    }
}

/** Handles the transport's close event and releases the associated conversation. */
function closeConversationHandler(peer: Peer): void {
    const sender = peer.context.chatSender;

    if (sender instanceof WebSocketSender) {
        sender.releaseConversation();

        delete peer.context.chatSender;
    }
}

/** Handles a connection error without logging raw transport data or provider details. */
function connectionErrorHandler(peer: Peer): void {
    logChatEvent("error", "socket.transport_failed", {
        connectionId: peer.id,
        errorCode: "SOCKET_ERROR",
    });

    closeConversationHandler(peer);

    peer.close(1011, "Chat connection failed");
}

/** Retrieves the outgoing sender created once for this connection. */
function getSender(peer: Peer): WebSocketSender {
    const sender = peer.context.chatSender;

    if (!(sender instanceof WebSocketSender)) {
        throw new ChatError(
            410,
            "SESSION_EXPIRED",
            "This chat has ended. Please start a new chat.",
        );
    }

    return sender;
}

/** Retrieves the conversation ID assigned by the server when the connection opened. */
function getConversationId(peer: Peer): string {
    const conversationId = peer.context.conversationId;

    if (typeof conversationId !== "string") {
        throw new ChatError(
            410,
            "SESSION_EXPIRED",
            "This chat has ended. Please start a new chat.",
        );
    }

    return conversationId;
}

// CrossWS dispatches incoming connection events to these handlers.
export const chatRequestHandler: Partial<Hooks> = {
    upgrade,
    open: openConversationHandler,
    message: requestResponseHandler,
    close: closeConversationHandler,
    error: connectionErrorHandler,
};
