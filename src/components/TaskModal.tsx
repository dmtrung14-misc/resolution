import { useState } from 'react';
import { Task, Assignee, Urgency, TaskType } from '../types';
import { X } from 'lucide-react';

interface TaskModalProps {
  userName: string;
  partnerName: string;
  editingTask: Task | null;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function TaskModal({ userName, partnerName, editingTask, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [assignee, setAssignee] = useState<Assignee>(editingTask?.assignee || 'together');
  const [deadline, setDeadline] = useState(
    editingTask?.deadline 
      ? new Date(editingTask.deadline).toISOString().split('T')[0]
      : ''
  );
  const [urgency, setUrgency] = useState<Urgency>(editingTask?.urgency || 'medium');
  const [type, setType] = useState<TaskType>(editingTask?.type || 'regular');
  const [targetCount, setTargetCount] = useState(editingTask?.targetCount?.toString() || '');
  const [currentCount, setCurrentCount] = useState(editingTask?.currentCount?.toString() || '0');
  const [tags, setTags] = useState(editingTask?.tags?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Omit<Task, 'id' | 'createdAt'> = {
      title,
      description,
      assignee,
      deadline: new Date(deadline),
      urgency,
      type,
      completed: editingTask?.completed || false,
      comments: editingTask?.comments || [],
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
    };

    if (type === 'countable') {
      taskData.targetCount = parseInt(targetCount);
      taskData.currentCount = parseInt(currentCount);
      taskData.countLabel = 'items';
    }

    onSave(taskData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingTask ? 'Edit Resolution' : 'New Resolution'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read 50 books, Run a marathon"
              className="input-field"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this resolution..."
              rows={3}
              className="input-field"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 text-xs">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., food, travel, study"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add tags to get custom celebration emojis! Try: food, cooking, movie, travel, study, photo, career, art, music
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('regular')}
                className={`p-3 rounded-lg transition-all ${
                  type === 'regular'
                    ? ''
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                style={type === 'regular' ? { 
                  border: '2px solid #3b82f6',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)',
                  color: '#3b82f6'
                } : {}}
              >
                <div className="font-medium">Regular Task</div>
                <div className="text-xs text-gray-500 mt-1">Simple yes/no completion</div>
              </button>
              <button
                type="button"
                onClick={() => setType('countable')}
                className={`p-3 rounded-lg transition-all ${
                  type === 'countable'
                    ? ''
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                style={type === 'countable' ? { 
                  border: '2px solid #10b981',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)',
                  color: '#10b981'
                } : {}}
              >
                <div className="font-medium">Countable Goal</div>
                <div className="text-xs text-gray-500 mt-1">Track progress with numbers</div>
              </button>
            </div>
          </div>

          {/* Countable Fields */}
          {type === 'countable' && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target *
                </label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  placeholder="50"
                  min="1"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current
                </label>
                <input
                  type="number"
                  value={currentCount}
                  onChange={(e) => setCurrentCount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who's working on this? *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAssignee('me')}
                className={`p-4 rounded-lg border font-medium transition-colors flex flex-col items-center gap-1 ${
                  assignee === 'me'
                    ? 'border-doggo-500 bg-doggo-50 text-doggo-800'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl">🐕</span>
                <span>{userName}</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignee('her')}
                className={`p-4 rounded-lg border font-medium transition-colors flex flex-col items-center gap-1 ${
                  assignee === 'her'
                    ? 'border-ducko-500 bg-ducko-50 text-ducko-800'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl">🦆</span>
                <span>{partnerName}</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignee('together')}
                className={`p-4 rounded-lg border font-medium transition-colors flex flex-col items-center gap-1 ${
                  assignee === 'together'
                    ? 'border-purple-500 bg-gradient-to-br from-primary-50 to-purple-50 text-purple-800'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-2xl">😚</span>
                <span>Together</span>
              </button>
            </div>
          </div>

          {/* Deadline & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {editingTask ? 'Save Changes' : 'Create Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

