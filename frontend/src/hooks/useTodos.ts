'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Todo, CreateTodoData, UpdateTodoData } from '@/types';
import { apiClient } from '@/utils/api';
import { toast } from 'sonner';

export const useDashboardTodos = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** ✅ useCallback ensures stable function reference */
  const fetchTodos = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { todos: fetchedTodos } = await apiClient.getTodos({
        type: 'all',
        userId: user.id,
      });

      setTodos(fetchedTodos);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch todos';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // ✅ dependency is user.id

  const createTodo = async (data: CreateTodoData) => {
    try {
      const { todo } = await apiClient.createTodo(data);
      setTodos((prev) => [todo, ...prev]);
      toast.success('Todo created successfully!');
      return todo;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create todo';
      toast.error(message);
      throw err;
    }
  };

  const updateTodo = async (id: string, data: UpdateTodoData) => {
    try {
      const { todo } = await apiClient.updateTodo(id, data);
      setTodos((prev) => prev.map((t) => (t.id === id ? todo : t)));
      toast.success('Todo updated successfully!');
      return todo;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update todo';
      toast.error(message);
      throw err;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await apiClient.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success('Todo deleted successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete todo';
      toast.error(message);
      throw err;
    }
  };

  const reorderTodos = async (todoUpdates: { id: string; order: number }[]) => {
    try {
      await apiClient.reorderTodos(todoUpdates);
      const updatedTodos = [...todos];
      todoUpdates.forEach((update) => {
        const todo = updatedTodos.find((t) => t.id === update.id);
        if (todo) todo.order = update.order;
      });
      updatedTodos.sort((a, b) => a.order - b.order);
      setTodos(updatedTodos);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reorder todos';
      toast.error(message);
      throw err;
    }
  };

  /** ✅ Now the warning disappears */
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]); // useCallback + dependency

  return {
    todos,
    loading,
    error,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
  };
};
