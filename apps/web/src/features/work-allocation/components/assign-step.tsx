import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface AssignStepProps {
  number: number;
  /** Labels the step's controls through `titleId`. */
  title: string;
  titleId: string;
  /** One plain sentence telling the user what to do. */
  hint?: ReactNode;
  done: boolean;
  /** Shown on the right of the title, e.g. an "Optional" tag. */
  aside?: ReactNode;
  children: ReactNode;
}

/** One numbered step of the assign form; the number turns into a tick once the step is done. */
export function AssignStep({
  number,
  title,
  titleId,
  hint,
  done,
  aside,
  children,
}: AssignStepProps) {
  return (
    <section className={`assign-step${done ? ' assign-step--done' : ''}`} aria-labelledby={titleId}>
      <span className="assign-step__marker" aria-hidden>
        {done ? <Check size={14} strokeWidth={3} /> : number}
      </span>
      <div className="assign-step__body">
        <div className="assign-step__header">
          <h3 id={titleId} className="assign-step__title">
            {title}
          </h3>
          {aside}
        </div>
        {hint && <p className="assign-step__hint">{hint}</p>}
        {children}
      </div>
    </section>
  );
}
