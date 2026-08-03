'use client';

import { useState } from 'react';

/** Inline "resend confirmation email" action for the onboarding checklist. */
export function ResendVerificationButton() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  return (
    <button
      type="button"
      className="font-medium text-primary hover:underline disabled:opacity-60"
      disabled={state !== 'idle'}
      onClick={async () => {
        setState('sending');
        await fetch('/api/account/email-verification', { method: 'POST' }).catch(() => {});
        setState('sent');
      }}
    >
      {state === 'sent' ? 'Sent — check your inbox.' : state === 'sending' ? 'Sending…' : 'Resend it.'}
    </button>
  );
}
