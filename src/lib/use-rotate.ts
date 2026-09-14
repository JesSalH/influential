import { useEffect, useRef, useState } from "react";

export function useRotate(length: number, ms = 4500) {
  const [active, setActive] = useState(0);
  const held = useRef(false);

  useEffect(() => {
    if (length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (held.current) return;
      setActive((i) => (i + 1) % length);
    }, ms);
    return () => window.clearInterval(id);
  }, [length, ms]);

  return {
    active,
    enter: (i: number) => {
      held.current = true;
      setActive(i);
    },
    leave: () => {
      held.current = false;
    },
    tap: (i: number) => setActive(i),
  };
}
