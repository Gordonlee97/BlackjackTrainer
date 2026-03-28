import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from its previous value to a new target
 * using requestAnimationFrame with ease-out timing.
 */
export function useAnimatedNumber(target: number, duration = 300): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;

    if (from === to) return;

    const start = performance.now();
    const diff = to - from;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + diff * eased;

      // For integers, round. For decimals (like accuracy %), keep one decimal.
      setDisplay(Number.isInteger(to) ? Math.round(current) : Math.round(current * 10) / 10);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}
