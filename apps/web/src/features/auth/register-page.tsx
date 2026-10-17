import { Link } from 'react-router';
import { APP_ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { AuthCard } from './auth-card';
import { RegisterForm } from './register-form';

export function RegisterPage() {
  useDocumentTitle('Create account');

  return (
    <AuthCard
      title="Create your company account"
      footer={
        <>
          Already have an account? <Link to={APP_ROUTES.login}>Sign in</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
