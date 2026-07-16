"use client";

import { useEffect, useRef } from "react";

/**
 * Attaches an IntersectionObserver to the returned ref.
 * When the element enters the viewport, class `in-view` is added
 * (triggers CSS animations defined in globals.css).
 *
 * Usage:
 *   const ref = useReveal();
 *   <div ref={ref} className="reveal delay-200">...</div>
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target); // fire once
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
