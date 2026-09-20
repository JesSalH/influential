/** Messages sent by the server. Receiving text and finishing a model reply are separate events. */
export type ChatServerEvent =
    | { type: "greeting"; conversationId: string; message: string }
    | { type: "accepted" }
    | { type: "reply"; message: string }
    | { type: "error"; code: string; message: string };

/** The browser supplies new text only; conversation identity comes from its connection. */
export type ChatClientEvent = {
    type: "message";

    message: string;
};

export const CHAT_SOCKET_PATH = "/api/chat/socket";

// Retains the existing HTTP input-byte limit for WebSocket messages.
export const MAX_CHAT_EVENT_BYTES = 16384;
