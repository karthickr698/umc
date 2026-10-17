import { useCallback, useEffect } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router';
import { useSession } from '@/features/auth';
import { usePersistentBoolean } from '@/hooks/use-persistent-boolean';
import { useSetupProgress } from '../hooks/use-setup-progress';

const HIDDEN_KEY = 'umc:getting-started-hidden';

/**
 * Numbered first steps for a new company; the next step to do is highlighted. Hidden for good once
 * dismissed or every step is done.
 */
export function GettingStarted() {
  const userId = useSession().user?.id ?? 'anonymous';
  const [hidden, setHidden] = usePersistentBoolean(`${HIDDEN_KEY}:${userId}`, false);
  const hide = useCallback(() => setHidden(true), [setHidden]);
  if (hidden) return null;
  return <SetupChecklist onHide={hide} />;
}

function SetupChecklist({ onHide }: { onHide: () => void }) {
  const steps = useSetupProgress();
  const loaded = steps.every((step) => step.done !== undefined);
  const doneCount = steps.filter((step) => step.done).length;
  const complete = loaded && doneCount === steps.length;

  useEffect(() => {
    if (complete) onHide();
  }, [complete, onHide]);

  if (steps.length === 0 || !loaded || complete) return null;
  const nextIndex = steps.findIndex((step) => !step.done);

  return (
    <section className="card getting-started" aria-labelledby="getting-started-title">
      <header className="getting-started__header">
        <div>
          <h2 id="getting-started-title" className="getting-started__title">
            Getting started
          </h2>
          <p className="getting-started__subtitle">
            Follow these steps in order. {doneCount} of {steps.length} done.
          </p>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onHide}
          aria-label="Hide getting started guide"
          title="Hide this guide"
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      <div
        className="getting-started__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
        aria-label="Setup progress"
      >
        <span style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="getting-started__steps">
        {steps.map((step, index) => {
          const current = index === nextIndex;
          const state = step.done ? 'done' : current ? 'current' : 'todo';
          return (
            <li key={step.page} className={`setup-step setup-step--${state}`}>
              <span className="setup-step__marker" aria-hidden>
                {step.done ? <Check size={16} strokeWidth={3} /> : index + 1}
              </span>
              <span className="setup-step__text">
                <span className="setup-step__title">
                  {step.title}
                  {step.done && <span className="visually-hidden"> (done)</span>}
                </span>
                <span className="setup-step__hint">{step.hint}</span>
              </span>
              <Link
                to={step.path}
                className={current ? 'button button--primary' : 'button button--ghost'}
              >
                {step.done ? 'Open' : step.action}
                {current && <ArrowRight size={16} aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
