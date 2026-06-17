'use client';

import { useEffect } from 'react';

export default function CustomCursor() {
  useEffect(() => {
    // Only on desktop (pointer device)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cursor = document.createElement('div');
    cursor.id = 'sl-cursor';
    document.body.appendChild(cursor);

    let raf: number;
    let mx = -100, my = -100;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cursor.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
      });
    };

    const onEnter = () => cursor.classList.add('sl-cursor-expanded');
    const onLeave = () => cursor.classList.remove('sl-cursor-expanded');

    document.addEventListener('mousemove', onMove, { passive: true });

    const addListeners = () => {
      document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };
    addListeners();
    const observer = new MutationObserver(addListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cursor.remove();
      observer.disconnect();
    };
  }, []);

  return null;
}
