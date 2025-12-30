import { Task, Assignee, UserRole } from '../types';
import { Calendar, AlertCircle, Trash2, Edit, MessageCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import SeasonalEmoji from './SeasonalEmoji';
import { celebrateTaskCompletion } from '../utils/customCelebrations';

interface TaskListItemProps {
  task: Task;
  userName: string;
  partnerName: string;
  currentUser: UserRole;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
}

export default function TaskListItem({ task, userName, partnerName, currentUser, onUpdate, onDelete, onEdit, onViewDetails }: TaskListItemProps) {
  const getAssigneeName = (assignee: Assignee) => {
    if (assignee === 'me') return userName;
    if (assignee === 'her') return partnerName;
    return 'Together';
  };

  const getAssigneeColor = (assignee: Assignee) => {
    if (assignee === 'me') return 'bg-doggo-100 text-doggo-800 border-doggo-300';
    if (assignee === 'her') return 'bg-ducko-100 text-ducko-800 border-ducko-300';
    return 'bg-gradient-to-r from-primary-100 to-purple-100 text-purple-800 border-purple-300';
  };

  const getAssigneeEmoji = (assignee: Assignee) => {
    if (assignee === 'me') return '🐕';
    if (assignee === 'her') return '🦆';
    return '😚';
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'high') return 'text-red-600';
    if (urgency === 'medium') return 'text-orange-600';
    return 'text-gray-600';
  };

  const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
  const isOverdue = !task.completed && deadline instanceof Date && !isNaN(deadline.getTime()) && deadline < new Date();

  const handleToggleComplete = () => {
    if (!task.completed) {
      celebrateTaskCompletion(currentUser);
    }
    onUpdate({ completed: !task.completed });
  };

  const progress = task.type === 'countable' && task.targetCount && task.currentCount
    ? (task.currentCount / task.targetCount) * 100
    : task.completed ? 100 : 0;

  return (
    <div 
      className={`bg-white rounded-lg border transition-all hover:border-primary-300 cursor-pointer ${
        task.completed ? 'border-green-300 opacity-90' : isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}
      onClick={onViewDetails}
    >
      <div className="p-2 flex items-center gap-3">
        {/* Complete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleComplete();
          }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
            task.completed 
              ? 'text-green-500' 
              : 'text-gray-400 hover:bg-green-50'
          }`}
        >
          <CheckCircle2 size={18} />
        </button>

        {/* Title and Assignee */}
        <div className="flex items-center gap-2 min-w-0" style={{ width: '250px' }}>
          <h3 className={`font-semibold text-sm truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getAssigneeColor(task.assignee)}`}>
            <span>{getAssigneeEmoji(task.assignee)}</span>
            <span>{getAssigneeName(task.assignee)}</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm truncate flex-1 min-w-0">
          {task.description}
        </p>

        {/* Deadline */}
        <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          <Calendar size={12} />
          <span>{task.deadline instanceof Date && !isNaN(task.deadline.getTime()) 
            ? format(task.deadline, 'MMM d') 
            : 'Invalid date'}</span>
          {task.deadline instanceof Date && !isNaN(task.deadline.getTime()) && (
            <SeasonalEmoji date={task.deadline} size="small" />
          )}
        </div>

        {/* Urgency */}
        <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${getUrgencyColor(task.urgency)}`}>
          <AlertCircle size={12} />
          <span className="capitalize">{task.urgency}</span>
        </div>

        {/* Progress for Countable */}
        {task.type === 'countable' && task.targetCount ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-24">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${Math.min(progress, 100)}%`,
                    background: 'linear-gradient(to right, #3b82f6, #10b981)'
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-bold" style={{ color: '#10b981' }}>
              {Math.round(progress)}%
            </span>
          </div>
        ) : (
          <div className="w-28"></div>
        )}

        {/* Comments Count */}
        {task.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <MessageCircle size={12} />
            <span>{task.comments.length}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

