'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string };
  files?: { id: string; filename: string; path: string; originalName: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

const TodosPage = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'my-todos' | 'assigned-to-me'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    status: 'PENDING' as const,
    files: [] as File[]
  });

  useEffect(() => {
    loadTodos();
    loadUsers();
  }, [filter, statusFilter]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/todos`;
      const params = new URLSearchParams();
      if (filter === 'my-todos') params.append('type', 'created');
      else if (filter === 'assigned-to-me') params.append('type', 'assigned');
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setTodos(await res.json());
      else toast.error('Failed to load todos');
    } catch {
      toast.error('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/users/assignable`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', assignedToId: '', dueDate: '', status: 'PENDING', files: [] });
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.assignedToId) { toast.error('Select assignee'); setLoading(false); return; }
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('assignedToId', formData.assignedToId);
      if (formData.dueDate) data.append('dueDate', formData.dueDate);
      formData.files.forEach(f => data.append('files', f));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: data
      });
      if (res.ok) { toast.success('Todo created'); setIsCreateDialogOpen(false); resetForm(); loadTodos(); }
      else throw new Error('Failed');
    } catch {
      toast.error('Failed to create todo');
    } finally { setLoading(false); }
  };

  const handleEditTodo = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingTodo) return;
  setLoading(true);

  try {
    const todoData = {
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate || null,
      status: formData.status,
      assignedToId: formData.assignedToId // <-- send ID directly
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${editingTodo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(todoData)
    });

    if (res.ok) {
      toast.success('Todo updated');
      setIsEditDialogOpen(false);
      setEditingTodo(null);
      resetForm();
      loadTodos();
    } else {
      const errMsg = await res.text();
      console.error('Update failed:', errMsg);
      throw new Error('Failed to update todo');
    }
  } catch (err) {
    console.error(err);
    toast.error('Failed to update todo');
  } finally {
    setLoading(false);
  }
};

  const handleDeleteTodo = async (id: string) => {
    if (!confirm('Delete this todo?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) toast.success('Deleted'); else throw new Error('Failed');
      loadTodos();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      assignedToId: todo.assignedTo.id,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      status: todo.status,
      files: []
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = { PENDING: 'secondary', IN_PROGRESS: 'default', COMPLETED: 'success' } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-8 px-4">
{/* Create Todo */}
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogTrigger asChild>
    <Button><Plus className="w-4 h-4 mr-2" />Create Todo</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Create Todo</DialogTitle>
      <DialogDescription>Add a new todo item</DialogDescription>
    </DialogHeader>

    <form onSubmit={handleCreateTodo} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedToId">Assign To</Label>
        <Select
          value={formData.assignedToId}
          onValueChange={(v) => handleSelectChange('assignedToId', v)}
        >
          <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
          <SelectContent>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleInputChange}
        />
      </div>

      {/* ✅ File Upload */}
      <div className="space-y-2">
        <Label htmlFor="files">Attach Files</Label>
        <Input
          id="files"
          name="files"
          type="file"
          multiple
          onChange={(e) =>
            setFormData(prev => ({
              ...prev,
              files: e.target.files ? Array.from(e.target.files) : []
            }))
          }
        />
      </div>

      <div className="space-x-2 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsCreateDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>Create</Button>
      </div>
    </form>
  </DialogContent>
</Dialog>

       

        {/* Edit Todo */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
              <DialogDescription>Update your todo item</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTodo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <textarea id="edit-description" name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assignedToId">Assign To</Label>
                <Select value={formData.assignedToId} onValueChange={(v) => handleSelectChange('assignedToId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input id="edit-dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter by type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Todos</SelectItem>
              <SelectItem value="my-todos">My Todos</SelectItem>
              <SelectItem value="assigned-to-me">Assigned to Me</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Todos Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todos</CardTitle>
            <CardDescription>{todos.length} todo{todos.length !== 1 ? 's' : ''} found</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? <div>Loading...</div> : todos.length === 0 ? <div>No todos found</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todos.map(todo => (
                    <TableRow key={todo.id}>
                      <TableCell>{todo.title}</TableCell>
                      <TableCell>{todo.description || '-'}</TableCell>
                      <TableCell>{getStatusBadge(todo.status)}</TableCell>
                      <TableCell>{todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{todo.assignedTo.name}</TableCell>
                      <TableCell>
                        {todo.files?.length ? todo.files.map(f => (
                          <a key={f.id} href={f.path} target="_blank" className="block text-blue-600 underline">{f.originalName}</a>
                        )) : '-'}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(todo)}><Edit size={16} /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteTodo(todo.id)}><Trash2 size={16} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TodosPage;

