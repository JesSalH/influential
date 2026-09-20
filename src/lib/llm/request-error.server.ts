import "@tanstack/react-start/server-only";

/** Describes a provider failure without exposing headers, keys or response bodies. */
export class LlmRequestError extends Error {
    readonly retryable: boolean;

    readonly code: string;

    readonly status?: number;

    /** Marks temporary failures for retry; rejected credentials and invalid requests are not retryable. */
    constructor(
        message: string,
        retryable: boolean,
        code: string = "LLM_REQUEST_FAILED",
        status?: number,
    ) {
        super(message);

        this.name = "LlmRequestError";

        this.retryable = retryable;

        this.code = code;

        this.status = status;
    }
}
