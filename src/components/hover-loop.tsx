import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function HoverLoop({
    poster,
    src,
    alt,
    className,
    playing = false,
}: {
    poster: string;
    src?: string;
    alt: string;
    className?: string;
    playing?: boolean;
}) {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = ref.current;
        if (!v || !src) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (playing && !reduce) {
            void v.play();
        } else {
            v.pause();
            try {
                v.currentTime = 0;
            } catch {
                /* ignore seek on unloaded */
            }
        }
    }, [playing, src]);

    return (
        <span className={cn("relative block h-full w-full overflow-hidden", className)}>
            <img src={poster} alt={alt} className="h-full w-full object-cover object-top" />
            {src ? (
                <video
                    ref={ref}
                    className={cn(
                        "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-200",
                        playing ? "opacity-100" : "opacity-0",
                    )}
                    poster={poster}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden
                >
                    <source src={src} type="video/mp4" />
                </video>
            ) : null}
        </span>
    );
}
