import { createFileRoute } from "@tanstack/react-router";

/** Loads the server-only chat code when an HTTP request reaches this route. */
async function handleChat(): Promise<Response> {
    const chatHttp = await import("../lib/chat/chat-http.server.ts");

    return chatHttp.handleChatRequest();
}

export const Route = createFileRoute("/api/chat")({
    server: {
        handlers: {
            GET: handleChat,

            POST: handleChat,

            DELETE: handleChat,
        },
    },
});
