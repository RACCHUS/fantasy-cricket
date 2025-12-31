'use client';

import Link from 'next/link';
import { Trophy, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <span className="font-bold text-xl">Fantasy Cricket</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary mb-6">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Live fantasy cricket</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Build Your Dream
          <span className="text-primary block">Cricket Team</span>
        </h1>

        <p className="text-lg text-foreground-muted max-w-2xl mx-auto mb-8">
          Pick your players, compete in contests, and win based on real match
          performances. IPL, World Cup, and more!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
          <Link href="/contests">
            <Button variant="secondary" size="lg" className="text-lg px-8">
              View Contests
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Why Fantasy Cricket?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Trophy className="h-8 w-8 text-warning" />}
            title="Compete & Win"
            description="Join public contests and climb the leaderboards with your cricket knowledge."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-primary" />}
            title="Live Points"
            description="Watch your fantasy points update in real-time as matches progress."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-success" />}
            title="Multiple Leagues"
            description="IPL, World Cup, CPL, and more. All your favorite tournaments in one place."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <Step number={1} title="Pick Tournament" icon="📅" />
          <Step number={2} title="Build Team" icon="👥" />
          <Step number={3} title="Join Contest" icon="🏆" />
          <Step number={4} title="Win Points" icon="⭐" />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 text-center p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to play?
          </h2>
          <p className="text-foreground-muted mb-6 max-w-lg mx-auto">
            Create your account in seconds and start building your fantasy team today.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Create Free Account
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-foreground-muted">
          <p>&copy; {new Date().getFullYear()} Fantasy Cricket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 text-center">
      <div className="inline-flex items-center justify-center rounded-full bg-background-secondary p-4 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-foreground-muted">{description}</p>
    </Card>
  );
}

function Step({
  number,
  title,
  icon,
}: {
  number: number;
  title: string;
  icon: string;
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="text-4xl">{icon}</div>
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <h3 className="font-medium">{title}</h3>
    </div>
  );
}
