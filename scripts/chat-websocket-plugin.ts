import nodeAdapter from "crossws/adapters/node";

import type { Hooks } from "crossws";

import type { Plugin } from "vite";

import {
    CHAT_SOCKET_PATH,
    MAX_CHAT_EVENT_BYTES,
} from "../src/lib/chat/websocket-transport/chat-socket-protocol.ts";

/** Connects Vite's development server to the same WebSocket hooks used by Nitro in production. */
export function chatWebSocketPlugin(): Plugin {
    let closeConnections: (() => void) | undefined;

    return {
        name: "influential:chat-websocket",

        apply: "serve",

        /** Attaches only the chat upgrade path; Vite still handles its own live-reload connections. */
        configureServer(server) {
            const adapter = nodeAdapter({
                serverOptions: { maxPayload: MAX_CHAT_EVENT_BYTES },

                /** Loads server code through Vite so TypeScript and server-only imports are supported. */
                async resolve() {
                    const module = await server.ssrLoadModule(
                        "/src/lib/chat/websocket-transport/chat-handler.server.ts",
                    );

                    return module.chatRequestHandler as Partial<Hooks>;
                },
            });

            closeConnections = () => adapter.closeAll(1001, "Chat server restarted", true);

            server.httpServer?.on("upgrade", (request, socket, head) => {
                if (request.url?.split("?")[0] !== CHAT_SOCKET_PATH) {
                    return;
                }

                // Catch transport failures without printing request headers or private server settings.
                void adapter.handleUpgrade(request, socket, head).catch(() => socket.destroy());
            });

            server.httpServer?.once("close", closeConnections);
        },

        /** Ends development sessions when chat code changes, avoiding histories split across module versions. */
        handleHotUpdate(context) {
            const path = context.file.replaceAll("\\", "/");

            if (
                path.includes("/src/lib/chat/") ||
                path.includes("/src/lib/llm/") ||
                path.endsWith("/config/chat.json")
            ) {
                closeConnections?.();
            }
        },

        /** Releases open chat sockets when Vite closes or restarts. */
        closeBundle() {
            closeConnections?.();
        },
    };
}
