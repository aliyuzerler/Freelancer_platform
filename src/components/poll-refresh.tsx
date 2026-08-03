'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-runs the surrounding server component on an interval so its data stays
 * fresh — our stand-in for push updates while the realtime driver is `none`.
 *
 * Two behaviours that matter:
 *  - Polling pauses while the tab is hidden, so background tabs cost nothing.
 *  - Returning to the tab refreshes immediately rather than waiting out the
 *    remaining interval, which is what makes it feel live.
 *
 * Renders nothing. Set `intervalMs={0}` to disable (e.g. once a push driver
 * is configured).
 */
export function PollRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();
  // Keep the latest router in a ref so the effect never re-subscribes.
  const refresh = useRef(() => router.refresh());
  refresh.current = () => router.refresh();

  useEffect(() => {
    if (intervalMs <= 0) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => refresh.current(), intervalMs);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh.current(); // catch up on anything missed while away
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);

  return null;
}
