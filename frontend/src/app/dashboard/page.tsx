'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardTodos } from '@/hooks/useTodos';
import Navigation from '@/components/Navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, FileText, Users, Plus, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const formatDate = (dateString?: string) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
};

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { todos = [], loading: todosLoading, fetchTodos } = useDashboardTodos();

  // 🔹 Fetch todos once
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // 🔹 Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // 🔹 Memoized recent todos (hooks must be called unconditionally!)
  const recentTodos = useMemo(() => {
    if (!todos) return [];
    return [...todos]
      .filter((todo) => todo.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [todos]);

  // 🔹 Stats
  const pendingTodos = todos.filter((todo) => todo.status === 'PENDING');
  const inProgressTodos = todos.filter((todo) => todo.status === 'IN_PROGRESS');
  const completedTodos = todos.filter((todo) => todo.status === 'COMPLETED');
  const assignedToMe = todos.filter((todo) => String(todo.assignedTo?.id) === String(user?.id));
  const createdByMeTodos = todos.filter((todo) => String(todo.createdBy?.id) === String(user?.id));

  const stats = [
    { title: 'Total Todos', value: todos.length, icon: CheckSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Pending', value: pendingTodos.length, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { title: 'In Progress', value: inProgressTodos.length, icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { title: 'Completed', value: completedTodos.length, icon: CheckSquare, color: 'text-green-600', bgColor: 'bg-green-100' },
  ];

  // 🔹 Early return for loading
  if (authLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name || 'User'}!</h1>
          <p className="mt-2 text-gray-600">Here&apos;s what&apos;s happening with your todos today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Todos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Todos</CardTitle>
                  <CardDescription>Your latest todo items</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/todos">
                    <Plus className="h-4 w-4 mr-2" />
                    New Todo
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todosLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading todos...</p>
                </div>
              ) : recentTodos.length > 0 ? (
                <div className="space-y-4">
                  {recentTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{todo.title}</h4>
                        <p className="text-sm text-gray-600">Assigned to: {todo.assignedTo?.name || 'Unassigned'}</p>
                        {todo.dueDate && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {formatDate(todo.dueDate)}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          todo.status === 'COMPLETED' ? 'default' : todo.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                        }
                      >
                        {todo.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No todos yet</p>
                  <Button asChild className="mt-4">
                    <Link href="/todos">Create your first todo</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/todos">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    View All Todos
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/files">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Files
                  </Link>
                </Button>
                {user.role === 'ADMIN' && (
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/admin/users">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users
                    </Link>
                  </Button>
                )}
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href="/profile">
                    <Users className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Assigned to Me</CardTitle>
              <CardDescription>Todos assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{assignedToMe.length}</div>
              <p className="text-sm text-gray-600 mt-1">
                {assignedToMe.filter((t) => t.status === 'PENDING').length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Created by Me</CardTitle>
              <CardDescription>Todos you&apos;ve created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{createdByMeTodos.length}</div>
              <p className="text-sm text-gray-600 mt-1">
                {createdByMeTodos.filter((t) => t.status === 'COMPLETED').length} completed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
