'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminDashboardContentProps {
  initialStats: {
    users: number;
    teams: number;
    contests: number;
    matches: number;
  };
}

interface AnalyticsSummary {
  period: { days: number; startDate: string };
  totals: { events: number; uniqueUsers: number; uniqueSessions: number };
  byType: Record<string, number>;
}

export default function AdminDashboardContent({ initialStats }: AdminDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'matches' | 'contests' | 'system'>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics/events?days=7');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    }
    fetchAnalytics();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'matches', label: 'Matches', icon: '🏏' },
    { id: 'contests', label: 'Contests', icon: '🏆' },
    { id: 'system', label: 'System', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-medium">
            ADMIN
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <OverviewTab stats={initialStats} analytics={analytics} isLoading={isLoadingAnalytics} />
        )}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'matches' && <MatchesTab />}
        {activeTab === 'contests' && <ContestsTab />}
        {activeTab === 'system' && <SystemTab />}
      </main>
    </div>
  );
}

// Overview Tab
function OverviewTab({
  stats,
  analytics,
  isLoading,
}: {
  stats: { users: number; teams: number; contests: number; matches: number };
  analytics: AnalyticsSummary | null;
  isLoading: boolean;
}) {
  const statCards = [
    { label: 'Total Users', value: stats.users, icon: '👥', color: 'bg-blue-500' },
    { label: 'Fantasy Teams', value: stats.teams, icon: '🏏', color: 'bg-green-500' },
    { label: 'Active Contests', value: stats.contests, icon: '🏆', color: 'bg-yellow-500' },
    { label: 'Matches', value: stats.matches, icon: '📅', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', stat.color)}>
                <span>{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Last 7 Days Activity</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
          ) : analytics ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Events</span>
                <span className="font-medium">{analytics.totals.events.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-medium">{analytics.totals.uniqueUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">{analytics.totals.uniqueSessions.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Event Breakdown</h3>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-secondary rounded w-full" />
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
            </div>
          ) : analytics?.byType ? (
            <div className="space-y-2">
              {Object.entries(analytics.byType)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{type.replace('_', ' ')}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No events recorded</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin/users"
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center"
          >
            <span className="text-2xl block mb-1">👥</span>
            <span className="text-sm">Manage Users</span>
          </Link>
          <Link
            href="/admin/matches"
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center"
          >
            <span className="text-2xl block mb-1">🏏</span>
            <span className="text-sm">Sync Matches</span>
          </Link>
          <Link
            href="/admin/contests"
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center"
          >
            <span className="text-2xl block mb-1">🏆</span>
            <span className="text-sm">Create Contest</span>
          </Link>
          <Link
            href="/admin/notifications"
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-center"
          >
            <span className="text-2xl block mb-1">📢</span>
            <span className="text-sm">Send Notification</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Users Tab
function UsersTab() {
  const [users, setUsers] = useState<Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">User Management</h2>
        <input
          type="search"
          placeholder="Search users..."
          className="px-3 py-2 rounded-lg border bg-background w-64"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">User</th>
              <th className="text-left p-3 text-sm font-medium">Email</th>
              <th className="text-left p-3 text-sm font-medium">Role</th>
              <th className="text-left p-3 text-sm font-medium">Joined</th>
              <th className="text-left p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30">
                  <td className="p-3">{user.username}</td>
                  <td className="p-3 text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      user.role === 'admin' && 'bg-red-500/10 text-red-500',
                      user.role === 'user' && 'bg-gray-500/10 text-gray-500'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button className="text-sm text-primary hover:underline">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Matches Tab
function MatchesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Match Management</h2>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          Sync from API
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-medium mb-2">Upcoming</h3>
          <p className="text-3xl font-bold">12</p>
          <p className="text-sm text-muted-foreground">matches scheduled</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-medium mb-2">Live</h3>
          <p className="text-3xl font-bold text-green-500">2</p>
          <p className="text-sm text-muted-foreground">matches in progress</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-medium mb-2">Completed</h3>
          <p className="text-3xl font-bold">156</p>
          <p className="text-sm text-muted-foreground">matches this season</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          Match management interface - sync matches, update scores, manage player data
        </p>
      </div>
    </div>
  );
}

// Contests Tab
function ContestsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contest Management</h2>
        <Link
          href="/contests/create"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Create Contest
        </Link>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <p className="text-muted-foreground text-center py-8">
          Contest management interface - create, edit, and monitor contests
        </p>
      </div>
    </div>
  );
}

// System Tab
function SystemTab() {
  const [systemInfo, setSystemInfo] = useState<{
    version: string;
    environment: string;
    uptime: string;
  } | null>(null);

  useEffect(() => {
    // This would fetch from a system info endpoint
    setSystemInfo({
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: 'N/A',
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">System Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Version</h3>
          <p className="text-xl font-bold">{systemInfo?.version || 'N/A'}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Environment</h3>
          <p className="text-xl font-bold capitalize">{systemInfo?.environment || 'N/A'}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Status</h3>
          <p className="text-xl font-bold text-green-500">Healthy</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">System Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            Clear Cache
          </button>
          <button className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            Sync Database
          </button>
          <button className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            Export Data
          </button>
          <button className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm">
            View Logs
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">API Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cricket Data API</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Connected</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Supabase</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Connected</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Push Notifications</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm">Configured</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
