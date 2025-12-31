import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">🏏</div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-foreground-muted">
          Start building your dream cricket team
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-foreground-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
