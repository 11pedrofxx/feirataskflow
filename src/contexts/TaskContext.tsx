import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_CATEGORIES, type Category, type Notification, type Subtask, type Task, type TaskInput } from '@/types';

interface TaskContextValue {
  tasks: Task[];
  categories: Category[];
  notifications: Notification[];
  loading: boolean;
  createTask: (input: TaskInput, subtasks?: { title: string }[]) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<TaskInput>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (task: Task) => Promise<void>;
  duplicateTask: (task: Task) => Promise<void>;
  postponeTask: (task: Task, days: number) => Promise<void>;
  createCategory: (name: string, color: string, icon: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtask: Subtask) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const ensureDefaultCategories = useCallback(async (userId: string) => {
    const { data: existing } = await supabase.from('categories').select('*').eq('user_id', userId);
    if (existing && existing.length > 0) return existing;

    const inserts = DEFAULT_CATEGORIES.map((c) => ({
      user_id: userId,
      name: c.name,
      color: c.color,
      icon: c.icon,
      is_default: true,
    }));

    const { data } = await supabase.from('categories').insert(inserts).select();
    return data ?? [];
  }, []);

  const loadAll = useCallback(async (userId: string) => {
    const cats = await ensureDefaultCategories(userId);
    setCategories(cats as Category[]);

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*, subtasks(*), category:categories(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const tasksResult = (taskData ?? []) as Task[];
    setTasks(tasksResult);

    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications((notifData ?? []) as Notification[]);
  }, [ensureDefaultCategories]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setCategories([]);
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadAll(user.id).finally(() => setLoading(false));
  }, [user, loadAll]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadAll(user.id);
  }, [user, loadAll]);

  const createTask = useCallback(async (input: TaskInput, subtasks?: { title: string }[]): Promise<Task | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('tasks')
      .insert({ ...input, user_id: user.id })
      .select('*, subtasks(*), category:categories(*)')
      .single();

    if (data && subtasks && subtasks.length > 0) {
      const subtaskInserts = subtasks.map((s, i) => ({
        task_id: (data as Task).id,
        title: s.title,
        sort_order: i,
      }));
      await supabase.from('subtasks').insert(subtaskInserts);
      const { data: refreshed } = await supabase
        .from('tasks')
        .select('*, subtasks(*), category:categories(*)')
        .eq('id', (data as Task).id)
        .single();
      if (refreshed) {
        setTasks((prev) => [refreshed as Task, ...prev]);
        return refreshed as Task;
      }
    }

    if (data) setTasks((prev) => [data as Task, ...prev]);
    return data as Task | null;
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskInput>) => {
    const { data } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, subtasks(*), category:categories(*)')
      .single();
    if (data) {
      setTasks((prev) => prev.map((t) => (t.id === id ? (data as Task) : t)));
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTaskComplete = useCallback(async (task: Task) => {
    const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida';
    const { data } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'concluida' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)
      .select('*, subtasks(*), category:categories(*)')
      .single();
    if (data) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as Task) : t)));
    }
  }, []);

  const duplicateTask = useCallback(async (task: Task) => {
    if (!user) return;
    const { id, subtasks, category, user_id, created_at, completed_at, ...rest } = task;
    const { data } = await supabase
      .from('tasks')
      .insert({ ...rest, user_id: user.id, title: `${task.title} (cópia)`, status: 'pendente', completed_at: null })
      .select('*, subtasks(*), category:categories(*)')
      .single();
    if (data) {
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskInserts = task.subtasks.map((s, i) => ({
          task_id: (data as Task).id,
          title: s.title,
          completed: false,
          sort_order: i,
        }));
        await supabase.from('subtasks').insert(subtaskInserts);
        const { data: refreshed } = await supabase
          .from('tasks')
          .select('*, subtasks(*), category:categories(*)')
          .eq('id', (data as Task).id)
          .single();
        if (refreshed) setTasks((prev) => [refreshed as Task, ...prev]);
      } else {
        setTasks((prev) => [data as Task, ...prev]);
      }
    }
  }, [user]);

  const postponeTask = useCallback(async (task: Task, days: number) => {
    if (!task.due_date) return;
    const current = new Date(task.due_date);
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split('T')[0];
    await updateTask(task.id, { due_date: newDate });
  }, [updateTask]);

  const createCategory = useCallback(async (name: string, color: string, icon: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name, color, icon, is_default: false })
      .select()
      .single();
    if (data) setCategories((prev) => [...prev, data as Category]);
  }, [user]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addSubtask = useCallback(async (taskId: string, title: string) => {
    const { data } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, sort_order: 0 })
      .select()
      .single();
    if (data) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...(t.subtasks ?? []), data as Subtask] } : t
        )
      );
    }
  }, []);

  const toggleSubtask = useCallback(async (subtask: Subtask) => {
    const { data } = await supabase
      .from('subtasks')
      .update({ completed: !subtask.completed })
      .eq('id', subtask.id)
      .select()
      .single();
    if (data) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === subtask.task_id
            ? { ...t, subtasks: (t.subtasks ?? []).map((s) => (s.id === subtask.id ? data as Subtask : s)) }
            : t
        )
      );
    }
  }, []);

  const deleteSubtask = useCallback(async (id: string) => {
    await supabase.from('subtasks').delete().eq('id', id);
    setTasks((prev) =>
      prev.map((t) => ({ ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== id) }))
    );
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        categories,
        notifications,
        loading,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        duplicateTask,
        postponeTask,
        createCategory,
        deleteCategory,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        markNotificationRead,
        markAllNotificationsRead,
        refresh,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTask() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within TaskProvider');
  return ctx;
}
