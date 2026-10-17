import { UserPlus } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { AuthSubmitButton } from './auth-submit-button';
import { describeRegisterError } from './register-error';
import { EMPTY_REGISTER_FORM, normalizeRegister, validateRegister } from './register-validation';
import { useSession } from './session-context';
import { useAuthForm } from './use-auth-form';

export function RegisterForm() {
  const { signUp } = useSession();
  const { fieldErrors, alert, submitting, field, onSubmit } = useAuthForm({
    initialValues: EMPTY_REGISTER_FORM,
    validate: validateRegister,
    submit: (values) => signUp(normalizeRegister(values)),
    describeError: describeRegisterError,
  });

  return (
    <form className="auth-form" noValidate onSubmit={onSubmit}>
      {alert && (
        <ErrorState
          compact
          title="Sign-up failed"
          message={alert.message}
          requestId={alert.requestId}
        />
      )}

      <fieldset className="auth-form__fields" disabled={submitting} aria-busy={submitting}>
        <FormField label="Company name" error={fieldErrors.companyName}>
          {(control) => (
            <input
              {...control}
              {...field('companyName')}
              className="field__input"
              type="text"
              autoComplete="organization"
              autoFocus
              placeholder="Acme Builders"
            />
          )}
        </FormField>

        <FormField label="Your name" error={fieldErrors.name}>
          {(control) => (
            <input
              {...control}
              {...field('name')}
              className="field__input"
              type="text"
              autoComplete="name"
            />
          )}
        </FormField>

        <FormField label="Email" error={fieldErrors.email}>
          {(control) => (
            <input
              {...control}
              {...field('email')}
              className="field__input"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@company.com"
            />
          )}
        </FormField>

        <FormField label="Phone (optional)" error={fieldErrors.phone}>
          {(control) => (
            <input
              {...control}
              {...field('phone')}
              className="field__input"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
            />
          )}
        </FormField>

        <FormField label="Password" error={fieldErrors.password}>
          {(control) => (
            <PasswordInput {...control} {...field('password')} autoComplete="new-password" />
          )}
        </FormField>

        <FormField label="Confirm password" error={fieldErrors.confirmPassword}>
          {(control) => (
            <PasswordInput {...control} {...field('confirmPassword')} autoComplete="new-password" />
          )}
        </FormField>

        <AuthSubmitButton
          submitting={submitting}
          icon={<UserPlus size={16} aria-hidden />}
          label="Create account"
          busyLabel="Creating account…"
        />
      </fieldset>
    </form>
  );
}
