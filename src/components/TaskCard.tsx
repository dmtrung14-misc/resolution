import { Task, Assignee, UserRole } from '../types';
import { Calendar, AlertCircle, Trash2, Edit, MessageCircle, CheckCircle2, CheckSquare, Link } from 'lucide-react';
import { format } from 'date-fns';
import ProgressRing from './ProgressRing';
import SeasonalEmoji from './SeasonalEmoji';
import { celebrateTaskCompletion } from '../utils/customCelebrations';

interface TaskCardProps {
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

export default function TaskCard({ task, userName, partnerName, currentUser, onUpdate, onDelete, onEdit, onViewDetails, onCopyLink }: TaskCardProps) {
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

  return (
    <div 
      className={`bg-white rounded-lg border transition-all hover:border-primary-300 cursor-pointer flex flex-col ${
        task.completed ? 'border-green-300 opacity-90' : isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}
      onClick={onViewDetails}
    >
      <div className="p-5 flex-1 min-h-[280px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 cursor-pointer" onClick={onViewDetails}>
            <h3 className={`font-semibold text-lg mb-2 ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            {/* Deadline */}
            <div className={`flex items-center gap-1.5 text-xs mb-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              <Calendar size={12} />
              <span>{task.deadline instanceof Date && !isNaN(task.deadline.getTime()) 
                ? format(task.deadline, 'MMM d, yyyy') 
                : 'Invalid date'}</span>
              {task.deadline instanceof Date && !isNaN(task.deadline.getTime()) && (
                <SeasonalEmoji date={task.deadline} size="small" />
              )}
            </div>
            {/* Assignee Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getAssigneeColor(task.assignee)}`}>
              <span>{getAssigneeEmoji(task.assignee)}</span>
              <span>{getAssigneeName(task.assignee)}</span>
            </span>
          </div>
          
          {task.type === 'countable' ? (
            <ProgressRing 
              progress={progress}
              size={56}
              strokeWidth={4}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete();
              }}
              className={`p-2 rounded-lg transition-all ${
                task.completed 
                  ? 'text-green-500' 
                  : 'text-gray-400 hover:bg-green-50'
              }`}
            >
              <CheckCircle2 size={24} />
            </button>
          )}
        </div>

        {/* Description and Progress - takes available space */}
        <div className="flex-1 flex flex-col">
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 cursor-pointer" onClick={onViewDetails}>
            {task.description}
          </p>

          {/* Countable Progress */}
          {task.type === 'countable' && task.targetCount && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {task.currentCount || 0} / {task.targetCount} {task.countLabel || 'items'}
                </span>
                <span className="text-sm font-bold" style={{ color: '#10b981' }}>
                  {Math.round(progress)}%
                </span>
              </div>
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
          )}
        </div>

        {/* Footer - always at bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3 text-sm">
            <div className={`flex items-center gap-1 ${getUrgencyColor(task.urgency)}`}>
              <AlertCircle size={14} />
              <span className="capitalize">{task.urgency}</span>
            </div>

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <CheckSquare size={14} className={
                  task.subtasks.every(st => st.completed) ? 'text-green-500' : 'text-gray-500'
                } />
                <span className={
                  task.subtasks.every(st => st.completed) ? 'text-green-600 font-medium' : ''
                }>
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.comments.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors relative"
                style={{ color: task.comments.length > 0 ? '#3b82f6' : undefined }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <MessageCircle size={16} />
                {task.comments.length > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
                  >
                    {task.comments.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              title="Copy link to share"
            >
              <Link size={16} />
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
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* View Details Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails();
        }}
        className="w-full py-3 text-sm font-medium transition-all border-t border-gray-100 hover:bg-gray-50 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        View Details & Comments
      </button>
    </div>
  );
}

