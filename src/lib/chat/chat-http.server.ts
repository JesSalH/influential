import "@tanstack/react-start/server-only";

import { logChatEvent } from "./chat-logger.server.ts";

/** Explains the socket endpoint to callers of the retired request/response chat API. */
export function handleChatRequest(): Response {
    logChatEvent("warn", "http.websocket_required");

    return Response.json(
        {
            error: {
                code: "WEBSOCKET_REQUIRED",
                message: "Connect to /api/chat/socket using WebSocket.",
            },
        },
        { status: 426, headers: { "Cache-Control": "no-store", Upgrade: "websocket" } },
    );
}
