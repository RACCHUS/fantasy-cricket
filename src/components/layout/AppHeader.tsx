'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AppHeaderProps {
  variant?: 'default' | 'transparent';
}

export function AppHeader({ variant = 'default' }: AppHeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const headerClass = variant === 'transparent'
    ? 'fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm'
    : 'border-b border-border bg-surface';

  return (
    <header className={headerClass}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏏</span>
          <span className="font-bold text-xl text-accent">Fantasy Cricket</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {loading ? (
            // Loading skeleton
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-surface-alt rounded animate-pulse"></div>
            </div>
          ) : user ? (
            // Logged in state
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            // Logged out state
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Hook to get current user for conditional rendering in pages
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isLoggedIn: !!user };
}
