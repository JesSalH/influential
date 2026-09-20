import { defineWebSocketHandler } from "nitro";

import { chatRequestHandler } from "../lib/chat/websocket-transport/chat-socket-hooks.server.ts";

// Nitro registers this endpoint explicitly. The leading '-' excludes it from TanStack's page routes.
export default defineWebSocketHandler(chatRequestHandler);
