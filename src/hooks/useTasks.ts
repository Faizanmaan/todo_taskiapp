import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {firebaseFirestore} from '../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import {
  setTasks,
  addTask as addTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  toggleComplete as toggleCompleteAction,
  setLoading,
  setError,
} from '../store/taskSlice';
import type {Task} from '../store/taskSlice';
import type {RootState, AppDispatch} from '../store';
import NotificationService from '../services/NotificationService';

export const useTasks = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {tasks, isLoading, error} = useSelector(
    (state: RootState) => state.tasks,
  );
  const {user} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(setTasks([]));
      return;
    }

    dispatch(setLoading(true));

    const db = firebaseFirestore();
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const tasksData: Task[] = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          const task: Task = {
            id: docSnapshot.id,
            title: data.title,
            notes: data.notes,
            tag: data.tag,
            remindAt: data.remindAt?.toDate() || null,
            completed: data.completed,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            userId: data.userId,
          };

          return task;
        });
        dispatch(setTasks(tasksData));
      },
      err => {
        console.error('Error fetching tasks:', err);
        dispatch(setError(err.message));
      },
    );

    return () => unsubscribe();
  }, [user, dispatch]);

  // Add a new task
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) return;

    try {
      const now = new Date();
      const newTask = {
        ...taskData,
        userId: user.uid,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        remindAt: taskData.remindAt ? Timestamp.fromDate(taskData.remindAt) : null,
      };

      const db = firebaseFirestore();
      const tasksRef = collection(db, 'tasks');
      const docRef = await addDoc(tasksRef, newTask);
      
      const task = {
        ...taskData,
        id: docRef.id,
        userId: user.uid,
        createdAt: now,
        updatedAt: now,
      };

      dispatch(addTaskAction(task));

      if (task.remindAt && !task.completed) {
        NotificationService.scheduleTaskNotification(task);
      }
    } catch (err: unknown) {
      console.error('Error adding task:', err);
      dispatch(setError((err as Error).message));
    }
  };

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const now = new Date();
      const { remindAt, ...restUpdates } = updates;
      const updatedData: Record<string, unknown> = {
        ...restUpdates,
        updatedAt: Timestamp.fromDate(now),
      };

      if (remindAt !== undefined) {
        updatedData.remindAt = remindAt ? Timestamp.fromDate(remindAt) : null;
      }

      const db = firebaseFirestore();
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updatedData);

      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const updatedTask = {
          ...task,
          ...updates,
          updatedAt: now,
        } as Task;

        dispatch(updateTaskAction(updatedTask));

        // Update notification
        if (updatedTask.remindAt && !updatedTask.completed) {
          NotificationService.scheduleTaskNotification(updatedTask);
        } else {
          NotificationService.cancelTaskNotification(taskId);
        }
      }
    } catch (err: unknown) {
      console.error('Error updating task:', err);
      dispatch(setError((err as Error).message));
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    console.log('useTasks: deleteTask called for', taskId);
    try {
      const db = firebaseFirestore();
      const taskRef = doc(db, 'tasks', taskId);
      console.log('useTasks: deleting doc', taskId);
      await deleteDoc(taskRef);
      console.log('useTasks: doc deleted from firestore, dispatching action');
      dispatch(deleteTaskAction(taskId));
      NotificationService.cancelTaskNotification(taskId);
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
      dispatch(setError((err as Error).message));
    }
  };

  const toggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const now = new Date();
      // Optimistic update
      dispatch(toggleCompleteAction({
        id: taskId,
        updatedAt: now.toISOString(),
      }));

      if (task.completed && task.remindAt) {
        // If it was completed, and now we toggled it back to incomplete
        NotificationService.scheduleTaskNotification({
          ...task,
          completed: false,
        });
      } else {
        // If it was incomplete, and now we toggled it to complete
        NotificationService.cancelTaskNotification(taskId);
      }

      const db = firebaseFirestore();
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !task.completed,
        updatedAt: Timestamp.fromDate(now),
      });
    } catch (err: unknown) {
      console.error('Error toggling task:', err);
      dispatch(setError((err as Error).message));
    }
  };

  return {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
};
