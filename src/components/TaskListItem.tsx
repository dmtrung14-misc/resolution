import { useState } from 'react';
import { Task, Assignee, UserRole, SubTask } from '../types';
import { Calendar, AlertCircle, Trash2, Edit, MessageCircle, CheckCircle2, CheckSquare, Link, ChevronDown, ChevronRight } from 'lucide-react';
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
  onCopyLink: () => void;
}

export default function TaskListItem({ task, userName, partnerName, currentUser, onUpdate, onDelete, onEdit, onViewDetails, onCopyLink }: TaskListItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);

  const getAssigneeName = (assignee: Assignee) => {
    if (assignee === 'me') return userName;
    if (assignee === 'her') return partnerName;
    return 'Together';
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?taskId=${task.id}`;
    navigator.clipboard.writeText(url).then(() => {
      onCopyLink();
    });
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

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ subtasks: updatedSubtasks });
  };

  return (
    <div 
      className={`bg-white rounded-lg border transition-all hover:border-primary-300 cursor-pointer ${
        task.completed ? 'border-green-300 opacity-90' : isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}
      onClick={onViewDetails}
    >
      <div className="p-2 flex items-center gap-2">
        {/* Complete Button - Fixed width */}
        <div className="w-10 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete();
            }}
            className={`p-1.5 rounded-lg transition-all ${
              task.completed 
                ? 'text-green-500' 
                : 'text-gray-400 hover:bg-green-50'
            }`}
          >
            <CheckCircle2 size={18} />
          </button>
        </div>

        {/* Title - Fixed width */}
        <div className="w-52 flex-shrink-0 min-w-0">
          <h3 className={`font-semibold text-sm truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
        </div>

        {/* Assignee - Fixed width */}
        <div className="w-28 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getAssigneeColor(task.assignee)}`}>
            <span>{getAssigneeEmoji(task.assignee)}</span>
            <span>{getAssigneeName(task.assignee)}</span>
          </span>
        </div>

        {/* Description - Flexible */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-sm truncate">
            {task.description}
          </p>
        </div>

        {/* Deadline - Fixed width */}
        <div className={`w-24 flex-shrink-0 flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          <Calendar size={12} />
          <span>{task.deadline instanceof Date && !isNaN(task.deadline.getTime()) 
            ? format(task.deadline, 'MMM d') 
            : 'Invalid'}</span>
          {task.deadline instanceof Date && !isNaN(task.deadline.getTime()) && (
            <SeasonalEmoji date={task.deadline} size="small" />
          )}
        </div>

        {/* Urgency - Fixed width */}
        <div className={`w-20 flex-shrink-0 flex items-center gap-1 text-xs ${getUrgencyColor(task.urgency)}`}>
          <AlertCircle size={12} />
          <span className="capitalize">{task.urgency}</span>
        </div>

        {/* Progress for Countable - Fixed width */}
        <div className="w-36 flex-shrink-0">
          {task.type === 'countable' && task.targetCount ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
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
              <span className="text-xs font-bold w-9 text-right" style={{ color: '#10b981' }}>
                {Math.round(progress)}%
              </span>
            </div>
          ) : null}
        </div>

        {/* Subtasks - Fixed width */}
        <div className="w-12 flex-shrink-0 flex items-center justify-center">
          {task.subtasks && task.subtasks.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSubtasks(!showSubtasks);
              }}
              className="flex items-center gap-0.5 text-xs hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
            >
              {showSubtasks ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <CheckSquare size={12} className={
                task.subtasks.every(st => st.completed) ? 'text-green-500' : 'text-gray-500'
              } />
              <span className={
                task.subtasks.every(st => st.completed) ? 'text-green-600 font-medium' : 'text-gray-500'
              }>
                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
              </span>
            </button>
          ) : null}
        </div>

        {/* Comments - Fixed width */}
        <div className="w-10 flex-shrink-0 flex items-center justify-center">
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MessageCircle size={12} />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {/* Actions - Fixed width */}
        <div className="w-28 flex-shrink-0 flex items-center justify-end gap-1">
          <button
            onClick={handleCopyLink}
            className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            title="Copy link to share"
          >
            <Link size={14} />
          </button>
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

      {/* Expandable Subtasks Section */}
      {showSubtasks && task.subtasks && task.subtasks.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-2 py-2">
          <div className="ml-14 space-y-1">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 py-1.5 px-3 bg-white rounded border border-gray-100 hover:border-gray-200 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSubtask(subtask.id);
                  }}
                  className={`flex-shrink-0 ${
                    subtask.completed 
                      ? 'text-green-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <CheckCircle2 size={14} />
                </button>
                <span className={`text-sm flex-1 ${
                  subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'
                }`}>
                  {subtask.title}
                </span>
                {subtask.createdAt && (() => {
                  try {
                    const date = subtask.createdAt instanceof Date ? subtask.createdAt : new Date(subtask.createdAt);
                    if (date instanceof Date && !isNaN(date.getTime())) {
                      return (
                        <span className="text-xs text-gray-400">
                          {format(date, 'MMM d')}
                        </span>
                      );
                    }
                  } catch (e) {
                    // Invalid date, don't show anything
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

