export type Assignee = 'me' | 'her' | 'together';
export type Urgency = 'low' | 'medium' | 'high';
export type TaskType = 'regular' | 'countable';
export type UserRole = 'doggo' | 'ducko';

export interface Reaction {
  emoji: string;
  users: ('me' | 'her')[];
}

export interface Comment {
  id: string;
  text: string;
  author: 'me' | 'her';
  timestamp: Date;
  photos?: string[];
  gifUrl?: string; // GIF link
  replyTo?: string; // ID of the comment being replied to
  replies?: Comment[]; // Nested replies
  reactions?: Reaction[]; // Reactions to the comment
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
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
  tags?: string[]; // Optional tags for categorization
  
  // For countable tasks
  targetCount?: number;
  currentCount?: number;
  countLabel?: string; // e.g., "books", "workouts", "dates"
  
  // Comments and photos
  comments: Comment[];
  
  // Subtasks
  subtasks?: SubTask[];
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
