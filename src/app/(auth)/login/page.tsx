import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">🏏</div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-foreground-muted">
          Sign in to continue to Fantasy Cricket
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-foreground-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
