import "@tanstack/react-start/server-only";

import type { Hooks, Message, Peer } from "crossws";

import { ChatError } from "../chat-error.server.ts";
import { logChatEvent } from "../chat-logger.server.ts";
import { closeConversation } from "../handlers/close-conversation.server.ts";
import { handleConnectionError } from "../handlers/connection-error.server.ts";
import { openConversation } from "../handlers/open-conversation.server.ts";
import { requestResponse } from "../handlers/request-response.server.ts";
import { MAX_CHAT_EVENT_BYTES } from "./chat-socket-protocol.ts";
import { readChatSocketEvent, validateChatSocketOrigin } from "./chat-socket-validator.server.ts";
import { WebSocketSender } from "./websocket-sender.server.ts";

function conversationIdOf(peer: Peer): string | undefined {
    const value = peer.context.conversationId;
    return typeof value === "string" ? value : undefined;
}

function senderOf(peer: Peer): WebSocketSender {
    const sender = peer.context.chatSender;
    if (sender instanceof WebSocketSender) {
        return sender;
    }
    throw new ChatError(
        410,
        "SESSION_EXPIRED",
        "This chat has ended. Please start a new chat.",
    );
}

function upgrade(request: Request): void {
    try {
        validateChatSocketOrigin(request);
    } catch (error) {
        logChatEvent("warn", "socket.upgrade_rejected", { errorCode: "ORIGIN_REJECTED" });
        throw error;
    }
}

function onOpen(peer: Peer): void {
    const sender = new WebSocketSender(peer);
    peer.context.chatSender = sender;

    try {
        const conversationId = openConversation(sender);
        peer.context.conversationId = conversationId;
        logChatEvent("info", "socket.opened", { connectionId: peer.id, conversationId });
    } catch (error) {
        sender.sendError(error);
        sender.closeConnection(1011, "Unable to start chat");
    }
}

function onMessage(peer: Peer, incoming: Message): void {
    let sender: WebSocketSender | undefined;
    try {
        sender = senderOf(peer);
        const conversationId = conversationIdOf(peer);
        if (conversationId === undefined) {
            throw new ChatError(
                410,
                "SESSION_EXPIRED",
                "This chat has ended. Please start a new chat.",
            );
        }

        logChatEvent("info", "socket.message_received", { connectionId: peer.id, conversationId });

        if (incoming.uint8Array().byteLength > MAX_CHAT_EVENT_BYTES) {
            throw new ChatError(413, "BODY_TOO_LARGE", "The message is too large.");
        }

        const input = readChatSocketEvent(incoming.text());
        requestResponse(conversationId, input.message, sender);
    } catch (error) {
        sender?.sendError(error);
    }
}

function onClose(peer: Peer): void {
    closeConversation(conversationIdOf(peer));
    delete peer.context.chatSender;
    delete peer.context.conversationId;
}

function onError(peer: Peer): void {
    let sender: WebSocketSender;
    try {
        sender = senderOf(peer);
    } catch {
        sender = new WebSocketSender(peer);
    }

    handleConnectionError(conversationIdOf(peer), sender);
    delete peer.context.chatSender;
    delete peer.context.conversationId;
}

export const chatRequestHandler: Partial<Hooks> = {
    upgrade,
    open: onOpen,
    message: onMessage,
    close: onClose,
    error: onError,
};
