import { useEffect, useRef, type RefObject } from 'react';

/**
 * Custom Hook: Automatically scrolls smoothly to the top of the activity content container
 * whenever the step/activity index changes. Respects prefers-reduced-motion.
 */
export function useActivityScrollTop<T extends HTMLElement = HTMLDivElement>(
  triggerKey: number | string
): RefObject<T | null> {
  const topRef = useRef<T>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid scrolling on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (topRef.current) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      topRef.current.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [triggerKey]);

  return topRef;
}
