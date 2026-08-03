'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

type Prefs = {
  showFullName: boolean;
  indexProfile: boolean;
  notifyProposals: boolean;
  notifyMessages: boolean;
  notifyProductNews: boolean;
};

/** Toggle row that saves immediately — no save button to forget. */
function Toggle({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b py-4 last:border-0">
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 cursor-pointer accent-primary"
      />
    </label>
  );
}

export function PreferencesForm({
  initial,
  exampleName,
}: {
  initial: Prefs;
  exampleName: string;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(key: keyof Prefs, value: boolean) {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value }); // optimistic
    setError(null);
    setSaved(false);

    const res = await fetch('/api/account/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });

    if (!res.ok) {
      setPrefs(previous); // roll back
      setError('Could not save that change.');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  // Preview of how the public name renders with the current setting.
  const parts = exampleName.trim().split(/\s+/);
  const abbreviated =
    parts.length > 1
      ? `${parts.slice(0, -1).join(' ')} ${parts[parts.length - 1]![0]!.toUpperCase()}.`
      : exampleName;

  return (
    <div>
      <section>
        <h2 className="text-lg font-semibold">Privacy</h2>
        <div className="mt-2">
          <Toggle
            label="Show my full name publicly"
            desc={
              prefs.showFullName
                ? `Your profile shows "${exampleName}".`
                : `Your profile shows "${abbreviated}". Turn this on to show your full name.`
            }
            checked={prefs.showFullName}
            onChange={(v) => set('showFullName', v)}
          />
          <Toggle
            label="Show my profile in search engines"
            desc={
              prefs.indexProfile
                ? 'Your profile can appear in Google results — free inbound work. Turn off to keep it visible only to clients inside Freelancezero.'
                : 'Your profile is hidden from search engines. Clients on Freelancezero can still find and view it.'
            }
            checked={prefs.indexProfile}
            onChange={(v) => set('indexProfile', v)}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Email notifications</h2>
        <div className="mt-2">
          <Toggle
            label="Proposals and applications"
            desc="When someone applies to your job, or your proposal status changes."
            checked={prefs.notifyProposals}
            onChange={(v) => set('notifyProposals', v)}
          />
          <Toggle
            label="Messages"
            desc="When a client or freelancer sends you a message."
            checked={prefs.notifyMessages}
            onChange={(v) => set('notifyMessages', v)}
          />
          <Toggle
            label="Product news"
            desc="Occasional updates about new features. No more than monthly."
            checked={prefs.notifyProductNews}
            onChange={(v) => set('notifyProductNews', v)}
          />
          <Toggle
            label="Security and account emails"
            desc="Email confirmation, password and payout changes. Always on for your safety."
            checked
            disabled
            onChange={() => {}}
          />
        </div>
      </section>

      <div className="mt-4 h-5">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved && !error ? (
          <p className="inline-flex items-center gap-1 text-sm text-green-600">
            <Check className="size-4" /> Saved
          </p>
        ) : null}
      </div>
    </div>
  );
}
