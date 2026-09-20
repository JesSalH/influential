import { useCallback, useEffect, useRef, useState } from "react";

import chatSettings from "../../../config/chat.json" with { type: "json" };
import { MAX_MESSAGE_CHARACTERS } from "./websocket-transport/chat-socket-protocol.ts";
import { chatSocketUrl, readChatServerEvent, type ChatLine } from "./chat-client.ts";

type Status = "idle" | "connecting" | "ready" | "waiting" | "closed";

function newId(): string {
    return crypto.randomUUID();
}

function greetingLine(content: string): ChatLine {
    return { id: "greeting", role: "assistant", content };
}

export function useSiteChat(open: boolean) {
    const socketRef = useRef<WebSocket | null>(null);
    const openRef = useRef(open);
    const [lines, setLines] = useState<ChatLine[]>([]);
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");

    openRef.current = open;

    useEffect(() => {
        if (!open) {
            const current = socketRef.current;
            socketRef.current = null;
            current?.close();
            setLines([]);
            setError("");
            setStatus("idle");
            return;
        }

        setLines([greetingLine(chatSettings.greeting)]);
        setError("");
        setStatus("connecting");

        const socket = new WebSocket(chatSocketUrl());
        socketRef.current = socket;

        socket.addEventListener("open", () => {
            if (socketRef.current !== socket) {
                return;
            }
            setStatus((current) => (current === "connecting" ? "ready" : current));
        });

        socket.addEventListener("message", (event) => {
            if (socketRef.current !== socket || typeof event.data !== "string") {
                return;
            }

            const payload = readChatServerEvent(event.data);
            if (!payload) {
                return;
            }

            if (payload.type === "greeting") {
                setLines((current) => {
                    const rest = current.filter((line) => line.id !== "greeting");
                    return [greetingLine(payload.message), ...rest];
                });
                setStatus("ready");
                setError("");
                return;
            }

            if (payload.type === "accepted") {
                setStatus("waiting");
                return;
            }

            if (payload.type === "reply") {
                setLines((current) => [
                    ...current,
                    { id: newId(), role: "assistant", content: payload.message },
                ]);
                setStatus("ready");
                setError("");
                return;
            }

            setError(payload.message);
            setStatus(payload.code === "SESSION_EXPIRED" ? "closed" : "ready");
        });

        socket.addEventListener("close", () => {
            if (socketRef.current !== socket || !openRef.current) {
                return;
            }
            setStatus("closed");
            setError("Could not reach the desk. Close and open to try again.");
        });

        socket.addEventListener("error", () => {
            if (socketRef.current !== socket || !openRef.current) {
                return;
            }
            setStatus("closed");
            setError("Could not reach the desk. Close and open to try again.");
        });

        return () => {
            if (socketRef.current === socket) {
                socketRef.current = null;
            }
            socket.close();
        };
    }, [open]);

    const send = useCallback((text: string) => {
        const message = text.trim();
        if (!message || message.length > MAX_MESSAGE_CHARACTERS) {
            return false;
        }

        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setError("The desk is not connected yet.");
            return false;
        }

        socket.send(JSON.stringify({ type: "message", message }));
        setLines((current) => [...current, { id: newId(), role: "user", content: message }]);
        setStatus("waiting");
        setError("");
        return true;
    }, []);

    return { lines, status, error, send, maxCharacters: MAX_MESSAGE_CHARACTERS };
}
