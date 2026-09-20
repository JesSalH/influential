import {
    CHAT_SOCKET_PATH,
    type ChatServerEvent,
} from "./websocket-transport/chat-socket-protocol.ts";

export type ChatLine = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export function chatSocketUrl(location: { protocol: string; host: string } = window.location): string {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.host}${CHAT_SOCKET_PATH}`;
}

export function readChatServerEvent(raw: string): ChatServerEvent | null {
    try {
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== "object" || !("type" in value)) {
            return null;
        }

        const event = value as { type: string; message?: unknown; code?: unknown; conversationId?: unknown };

        if (event.type === "greeting" && typeof event.message === "string" && typeof event.conversationId === "string") {
            return { type: "greeting", conversationId: event.conversationId, message: event.message };
        }
        if (event.type === "accepted") {
            return { type: "accepted" };
        }
        if (event.type === "reply" && typeof event.message === "string") {
            return { type: "reply", message: event.message };
        }
        if (event.type === "error" && typeof event.code === "string" && typeof event.message === "string") {
            return { type: "error", code: event.code, message: event.message };
        }

        return null;
    } catch {
        return null;
    }
}
