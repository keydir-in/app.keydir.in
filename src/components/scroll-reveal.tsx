'use client';

/**
 * IntersectionObserver-based scroll reveal animation.
 * Observes elements with `.reveal` class and adds `.in` when they enter the viewport.
 * Renders nothing; attaches behavior on mount.
 */

import { useEffect } from 'react';

export function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
