import "@tanstack/react-start/server-only";

import { z } from "zod";

import { ChatError } from "../chat-error.server.ts";
import { validateChatInput } from "../chat-validator.server.ts";
import { isGrokEmbedderOrigin } from "../../preview-embedder-origin.ts";
import type { ChatClientEvent } from "./chat-socket-protocol.ts";

const messageEventSchema = z
    .object({
        type: z.literal("message"),
        message: z.string(),
    })
    .strict();

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** Parses one socket event and validates the visitor's text before it reaches the conversation manager. */
export function readChatSocketEvent(text: string): ChatClientEvent {
    let input: unknown;

    try {
        input = JSON.parse(text);
    } catch {
        throw new ChatError(400, "INVALID_JSON", "Send a valid JSON chat event.");
    }

    const result = messageEventSchema.safeParse(input);

    if (!result.success) {
        throw new ChatError(
            400,
            "INVALID_EVENT",
            "Send a message event containing only type and message.",
        );
    }

    const validatedInput = validateChatInput({ message: result.data.message });

    return { type: "message", message: validatedInput.message };
}

/**
 * Same-site check for WebSocket upgrades.
 * Browsers send an http(s) Origin; the upgrade URL is often ws(s). Compare hosts, not full origins.
 */
export function validateChatSocketOrigin(request: Request): void {
    const originHeader = request.headers.get("origin");
    if (!originHeader) {
        throw new Response("Forbidden", { status: 403 });
    }

    let originUrl: URL;
    try {
        originUrl = new URL(originHeader);
    } catch {
        throw new Response("Forbidden", { status: 403 });
    }

    const hostHeader = request.headers.get("host");
    if (hostHeader && sameChatHost(originUrl.host, hostHeader)) {
        return;
    }

    try {
        const requestUrl = new URL(request.url);
        if (sameChatHost(originUrl.host, requestUrl.host)) {
            return;
        }
    } catch {
        // request.url may be a path
    }

    if (isGrokEmbedderOrigin(originHeader)) {
        return;
    }

    throw new Response("Forbidden", { status: 403 });
}

function sameChatHost(originHost: string, requestHost: string): boolean {
    const origin = originHost.toLowerCase();
    const request = requestHost.toLowerCase();
    if (origin === request) {
        return true;
    }

    const [originName, originPort] = splitHost(origin);
    const [requestName, requestPort] = splitHost(request);
    if (originPort !== requestPort) {
        return false;
    }

    return loopbackHosts.has(originName) && loopbackHosts.has(requestName);
}

function splitHost(host: string): [string, string] {
    if (host.startsWith("[")) {
        const end = host.indexOf("]");
        const name = end === -1 ? host : host.slice(0, end + 1);
        const port = end === -1 || end + 1 >= host.length ? "" : host.slice(end + 2);
        return [name, port];
    }

    const index = host.lastIndexOf(":");
    if (index === -1) {
        return [host, ""];
    }

    return [host.slice(0, index), host.slice(index + 1)];
}
