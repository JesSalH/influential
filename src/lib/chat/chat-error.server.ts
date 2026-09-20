import "@tanstack/react-start/server-only";

/** Carries a safe error message and an HTTP status across the chat layers. */
export class ChatError extends Error {
    readonly status: number;

    readonly code: string;

    /** Creates an error whose message may be returned to the visitor. */
    constructor(status: number, code: string, message: string) {
        super(message);

        this.name = "ChatError";

        this.status = status;

        this.code = code;
    }
}
