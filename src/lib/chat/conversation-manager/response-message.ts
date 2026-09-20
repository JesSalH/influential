/** A completed assistant response passed from Conversation Manager back to the entry handler. */
export type ResponseMessage = {
    role: "assistant";

    content: string;
};
