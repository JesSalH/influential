import { cn } from "@/lib/utils";

export function BrandLockup({
    variant = "nav",
    className,
}: {
    variant?: "nav" | "hero" | "footer";
    className?: string;
}) {
    if (variant === "hero") {
        return (
            <h1 className={cn("mt-5", className)}>
                <span className="wordmark">INFLUENTIAL</span>
                <span className="wordmark wordmark-labs">LABS</span>
            </h1>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex flex-col font-display font-extrabold uppercase leading-[0.82] tracking-[-0.04em]",
                variant === "footer" ? "text-sm" : "text-[13px]",
                className,
            )}
        >
            <span>INFLUENTIAL</span>
            <span className="text-spot">LABS</span>
        </span>
    );
}
