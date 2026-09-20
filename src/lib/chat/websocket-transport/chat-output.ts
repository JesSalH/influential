import type { ResponseMessage } from "../conversation-manager/response-message.ts";

import type { ChatServerEvent } from "./chat-socket-protocol.ts";

/** Outgoing socket. Handlers talk to this, never to a CrossWS peer. */
export type ChatOutput = {
    sendResponse(response: ResponseMessage): void;
    sendError(failure: unknown): void;
    sendEvent(event: ChatServerEvent): boolean;
    closeConnection(code: number, reason: string): void;
};
