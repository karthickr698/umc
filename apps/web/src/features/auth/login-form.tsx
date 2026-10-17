import { LogIn } from 'lucide-react';
import type { LoginRequest } from '@umc/shared';
import { ErrorState } from '@/components/feedback/error-state';
import { FormField } from '@/components/forms/form-field';
import { PasswordInput } from '@/components/forms/password-input';
import { AuthSubmitButton } from './auth-submit-button';
import { describeLoginError } from './login-error';
import { normalizeLogin, validateLogin } from './login-validation';
import { useSession } from './session-context';
import { useAuthForm } from './use-auth-form';

const EMPTY_LOGIN: LoginRequest = { email: '', password: '' };

export function LoginForm() {
  const { signIn } = useSession();
  const { fieldErrors, alert, submitting, field, onSubmit } = useAuthForm({
    initialValues: EMPTY_LOGIN,
    validate: validateLogin,
    submit: (values) => signIn(normalizeLogin(values)),
    describeError: describeLoginError,
  });

  return (
    <form className="auth-form" noValidate onSubmit={onSubmit}>
      {alert && (
        <ErrorState
          compact
          title="Sign-in failed"
          message={alert.message}
          requestId={alert.requestId}
        />
      )}

      <fieldset className="auth-form__fields" disabled={submitting} aria-busy={submitting}>
        <FormField label="Email" error={fieldErrors.email}>
          {(control) => (
            <input
              {...control}
              {...field('email')}
              className="field__input"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              placeholder="you@company.com"
            />
          )}
        </FormField>

        <FormField label="Password" error={fieldErrors.password}>
          {(control) => (
            <PasswordInput {...control} {...field('password')} autoComplete="current-password" />
          )}
        </FormField>

        <AuthSubmitButton
          submitting={submitting}
          icon={<LogIn size={16} aria-hidden />}
          label="Sign in"
          busyLabel="Signing in…"
        />
      </fieldset>
    </form>
  );
}
