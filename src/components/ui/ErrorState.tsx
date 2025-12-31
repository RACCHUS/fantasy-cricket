import { type ReactNode } from 'react';
import { AlertCircle, RefreshCw, WifiOff, LogIn } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  type?: 'error' | 'network' | 'auth' | 'notFound' | 'empty';
  title?: string;
  message?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
  children?: ReactNode;
}

const errorConfig = {
  error: {
    icon: AlertCircle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    color: 'text-danger',
  },
  network: {
    icon: WifiOff,
    title: 'No internet connection',
    message: 'Please check your connection and try again.',
    color: 'text-warning',
  },
  auth: {
    icon: LogIn,
    title: 'Session expired',
    message: 'Please sign in again to continue.',
    color: 'text-primary',
  },
  notFound: {
    icon: AlertCircle,
    title: 'Not found',
    message: "We couldn't find what you're looking for.",
    color: 'text-foreground-muted',
  },
  empty: {
    icon: AlertCircle,
    title: 'Nothing here yet',
    message: 'Get started by creating your first item.',
    color: 'text-foreground-muted',
  },
};

export function ErrorState({
  type = 'error',
  title,
  message,
  onRetry,
  onAction,
  actionLabel,
  className,
  children,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full p-4 bg-background-secondary mb-4',
          config.color
        )}
      >
        <Icon className="h-8 w-8" />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {title ?? config.title}
      </h3>

      <p className="text-foreground-muted max-w-sm mb-6">
        {message ?? config.message}
      </p>

      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        )}

        {onAction && actionLabel && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}
