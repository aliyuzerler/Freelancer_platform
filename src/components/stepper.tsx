import { Check } from 'lucide-react';

/** Presentational horizontal step indicator, shared by the onboarding wizard
 * and the dashboard checklist. */
export function Stepper({
  steps,
  currentIndex,
}: {
  steps: { label: string; done: boolean }[];
  currentIndex: number;
}) {
  // Progress must read monotonically: a later step never shows as complete while
  // an earlier one is outstanding, otherwise the bar tells a story that
  // contradicts itself (a ticked "Approval" sitting after an unfinished step).
  const firstOutstanding = steps.findIndex((s) => !s.done);
  const isComplete = (i: number) =>
    steps[i]!.done && (firstOutstanding === -1 || i < firstOutstanding);

  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex-1">
          {i < steps.length - 1 ? (
            <span
              className={`absolute left-1/2 top-4 h-0.5 w-full ${
                isComplete(i) ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ) : null}
          <div className="relative flex flex-col items-center gap-1.5 text-center">
            <span
              className={`grid size-8 place-items-center rounded-full border text-xs font-semibold ${
                isComplete(i)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : i === currentIndex
                    ? 'border-primary bg-background text-primary'
                    : 'border-muted bg-background text-muted-foreground'
              }`}
            >
              {isComplete(i) ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={`text-xs leading-tight ${
                i === currentIndex ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
