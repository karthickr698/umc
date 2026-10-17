import { Link } from 'react-router';
import { APP_ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { AuthCard } from './auth-card';
import { LoginForm } from './login-form';

export function LoginPage() {
  useDocumentTitle('Sign in');

  return (
    <AuthCard
      title="Sign in"
      footer={
        <>
          New company? <Link to={APP_ROUTES.register}>Create an account</Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
