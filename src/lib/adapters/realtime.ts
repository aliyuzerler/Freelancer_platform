/**
 * Realtime adapter — the seam between "how the UI learns something changed" and
 * the rest of the app. Call sites publish; they never care which driver runs.
 *
 * The default `none` driver publishes nothing and tells clients to poll. That is
 * deliberate: on serverless hosting there is no persistent process to hold
 * WebSocket connections, and at low traffic a 5–30s poll costs less (in money
 * and moving parts) than idle push connections.
 *
 * Swapping to Pusher/Ably later means implementing `publish` and setting the
 * poll intervals to 0 — no changes anywhere else.
 */
export type RealtimeDriver = 'none' | 'pusher' | 'socketio';

/** How often clients should re-check, in ms. 0 disables polling entirely. */
export interface PollIntervals {
  /** Navbar notification bell. */
  notifications: number;
  /** An open conversation thread. */
  thread: number;
}

export interface RealtimeAdapter {
  readonly driver: RealtimeDriver;
  readonly poll: PollIntervals;
  /**
   * Signal that a channel changed. A no-op for the polling driver.
   * Channels are namespaced per user: `user:<id>` or `conversation:<id>`.
   */
  publish(channel: string, event: string, payload?: unknown): Promise<void>;
}

/**
 * Polling driver. Chat polls faster than the bell because a stale message in an
 * open conversation is far more noticeable than a late notification badge.
 */
const pollingAdapter: RealtimeAdapter = {
  driver: 'none',
  poll: { notifications: 30_000, thread: 5_000 },
  async publish() {
    // Nothing to push — clients re-check on their own schedule.
  },
};

/** Resolve the configured adapter. Extend the switch as drivers are added. */
export function getRealtime(): RealtimeAdapter {
  switch (process.env.REALTIME_DRIVER) {
    // case 'pusher': return pusherAdapter;
    // case 'socketio': return socketIoAdapter;
    default:
      return pollingAdapter;
  }
}

/**
 * Poll intervals for client components. Client bundles cannot read
 * REALTIME_DRIVER (it is not NEXT_PUBLIC_), so they use the polling defaults —
 * which is correct: a push driver would set these to 0 at build time.
 */
export const POLL = pollingAdapter.poll;
