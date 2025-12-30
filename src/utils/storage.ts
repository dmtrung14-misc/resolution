import { AppState } from '../types';

const STORAGE_KEY = 'resolution-app-state';

export const saveState = (state: AppState): void => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const loadState = (): AppState | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    
    const state = JSON.parse(serialized);
    
    // Convert date strings back to Date objects
    state.tasks = state.tasks.map((task: any) => ({
      ...task,
      deadline: new Date(task.deadline),
      createdAt: new Date(task.createdAt),
      comments: task.comments.map((comment: any) => ({
        ...comment,
        timestamp: new Date(comment.timestamp),
      })),
    }));
    
    return state;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

