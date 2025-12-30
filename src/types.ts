export type Assignee = 'me' | 'her' | 'together';
export type Urgency = 'low' | 'medium' | 'high';
export type TaskType = 'regular' | 'countable';
export type UserRole = 'doggo' | 'ducko';

export interface Comment {
  id: string;
  text: string;
  author: 'me' | 'her';
  timestamp: Date;
  photos?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: Assignee;
  deadline: Date;
  urgency: Urgency;
  type: TaskType;
  completed: boolean;
  createdAt: Date;
  
  // For countable tasks
  targetCount?: number;
  currentCount?: number;
  countLabel?: string; // e.g., "books", "workouts", "dates"
  
  // Comments and photos
  comments: Comment[];
}

export interface UserProfile {
  username: UserRole; // 'doggo' or 'ducko'
  displayName: string;
  passwordHash: string;
}

export interface AppState {
  tasks: Task[];
  userName: string;
  partnerName: string;
}

export interface AuthState {
  currentUser: UserRole | null;
  isAuthenticated: boolean;
}
