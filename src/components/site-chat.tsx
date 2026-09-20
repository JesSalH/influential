import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, X } from "lucide-react";
import { useSiteChat } from "@/lib/chat/use-site-chat";
import { cn } from "@/lib/utils";

export function SiteChat() {
    const [open, setOpen] = useState(false);
    const { lines, status, error, send, maxCharacters } = useSiteChat(open);
    const [draft, setDraft] = useState("");
    const scroller = useRef<HTMLDivElement>(null);
    const field = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const node = scroller.current;
        if (node) {
            node.scrollTop = node.scrollHeight;
        }
    }, [lines, status]);

    useEffect(() => {
        if (open) {
            field.current?.focus();
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onKey(event: globalThis.KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        if (status === "waiting" || status === "connecting") {
            return;
        }
        if (send(draft)) {
            setDraft("");
        }
    }

    function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    }

    if (!open) {
        return (
            <button
                type="button"
                className="group fixed right-5 bottom-5 z-50 flex h-16 w-16 flex-col items-center justify-center border-2 border-line bg-fg text-bg transition-colors duration-150 ease-out hover:border-spot hover:bg-spot hover:text-spot-fg active:scale-[0.96]"
                aria-label="Open Influential Labs chat"
                onClick={() => setOpen(true)}
            >
                <span className="font-display text-[10px] font-extrabold tracking-[0.22em]">ASK</span>
                <span className="font-display text-xs font-extrabold tracking-[-0.04em] text-spot group-hover:text-spot-fg">
                    LABS
                </span>
            </button>
        );
    }

    const canSend =
        draft.trim().length > 0 &&
        draft.trim().length <= maxCharacters &&
        status !== "waiting" &&
        status !== "connecting";

    return (
        <section
            className="fixed right-3 bottom-3 z-50 flex h-[min(36rem,calc(100dvh-1.5rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col border-2 border-line bg-bg text-fg shadow-[8px_8px_0_0_#161614] sm:right-5 sm:bottom-5"
            role="dialog"
            aria-label="Influential Labs desk"
        >
            <div className="h-1 bg-spot" />
            <header className="flex items-start justify-between gap-3 border-b-2 border-line px-4 py-3">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Vol.01 · Desk</p>
                    <p className="mt-1 font-display text-xl font-extrabold uppercase leading-none tracking-[-0.05em]">
                        Ask <span className="text-spot">Labs</span>
                    </p>
                </div>
                <button
                    type="button"
                    className="flex size-11 items-center justify-center border-2 border-line text-fg transition-colors hover:bg-fg hover:text-bg"
                    aria-label="Close chat"
                    onClick={() => setOpen(false)}
                >
                    <X className="size-4" strokeWidth={2.25} />
                </button>
            </header>

            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {status === "connecting" && lines.length === 0 ? (
                    <p className="text-sm text-muted">Opening the desk…</p>
                ) : null}

                {lines.map((line) => (
                    <p
                        key={line.id}
                        className={cn(
                            "max-w-[92%] whitespace-pre-wrap border-2 px-3 py-2 text-sm leading-relaxed",
                            line.role === "user"
                                ? "ml-auto border-spot bg-spot text-spot-fg"
                                : "border-line bg-bg text-fg",
                        )}
                    >
                        {line.content}
                    </p>
                ))}

                {status === "waiting" ? <TypingMark /> : null}
            </div>

            <form onSubmit={onSubmit} className="border-t-2 border-line p-3">
                {error ? <p className="mb-2 text-sm text-heat">{error}</p> : null}
                <div className="flex items-end gap-2">
                    <label className="sr-only" htmlFor="site-chat-draft">
                        Message
                    </label>
                    <textarea
                        ref={field}
                        id="site-chat-draft"
                        rows={2}
                        value={draft}
                        maxLength={maxCharacters}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={onComposerKey}
                        placeholder="What's the project?"
                        className="min-h-12 flex-1 resize-none border-2 border-line bg-bg px-3 py-2 font-sans text-base text-fg outline-none focus:border-spot"
                    />
                    <button
                        type="submit"
                        disabled={!canSend}
                        className="flex size-12 shrink-0 items-center justify-center bg-fg text-bg transition-colors duration-150 hover:bg-spot hover:text-spot-fg disabled:opacity-40 disabled:hover:bg-fg disabled:hover:text-bg"
                        aria-label="Send message"
                    >
                        <ArrowUp className="size-4" strokeWidth={2.5} />
                    </button>
                </div>
            </form>
        </section>
    );
}

function TypingMark() {
    return (
        <p className="flex w-fit items-center gap-1 border-2 border-line px-3 py-3" aria-label="Writing">
            <span className="size-1.5 bg-spot motion-safe:animate-pulse" />
            <span className="size-1.5 bg-spot motion-safe:animate-pulse [animation-delay:120ms]" />
            <span className="size-1.5 bg-spot motion-safe:animate-pulse [animation-delay:240ms]" />
        </p>
    );
}
