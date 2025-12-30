import { useState, useRef } from 'react';
import { Task, Comment, UserRole } from '../types';
import { X, Send, Camera, Plus, Minus, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ProgressRing from './ProgressRing';
import { celebrateTaskCompletion, celebrateMilestoneCustom } from '../utils/customCelebrations';
import { getMilestoneMessage } from '../utils/messages';
import { firebaseService } from '../services/firebaseService';

interface TaskDetailModalProps {
  task: Task;
  userName: string;
  partnerName: string;
  currentUser: UserRole;
  onUpdate: (updates: Partial<Task>) => void;
  onClose: () => void;
}

export default function TaskDetailModal({ task, userName, partnerName, currentUser, onUpdate, onClose }: TaskDetailModalProps) {
  const [commentText, setCommentText] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<'me' | 'her'>('me');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = async () => {
    if (commentText.trim() || photos.length > 0) {
      setIsUploadingPhotos(true);
      
      try {
        // Upload photos to Firebase Storage
        const commentId = Date.now().toString();
        const uploadedPhotoUrls: string[] = [];
        
        for (const photo of photos) {
          try {
            const url = await firebaseService.uploadImageFromBase64(photo, task.id, commentId);
            uploadedPhotoUrls.push(url);
          } catch (error) {
            console.error('Error uploading photo:', error);
          }
        }
        
        const newComment: Comment = {
          id: commentId,
          text: commentText.trim(),
          author: selectedAuthor,
          timestamp: new Date(),
          photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
        };

        onUpdate({
          comments: [...task.comments, newComment],
        });

        setCommentText('');
        setPhotos([]);
      } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to upload photos. Please try again.');
      } finally {
        setIsUploadingPhotos(false);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUpdateCount = (delta: number) => {
    if (task.type === 'countable' && task.targetCount) {
      const newCount = Math.max(0, Math.min((task.currentCount || 0) + delta, task.targetCount));
      const oldProgress = task.currentCount && task.targetCount 
        ? (task.currentCount / task.targetCount) * 100 
        : 0;
      const newProgress = (newCount / task.targetCount) * 100;
      
      // Check for milestone
      const milestones = [25, 50, 75, 100];
      const crossedMilestone = milestones.find(m => 
        oldProgress < m && newProgress >= m
      );
      
      if (crossedMilestone) {
        if (crossedMilestone === 100) {
          celebrateTaskCompletion(currentUser);
        } else {
          celebrateMilestoneCustom(crossedMilestone, currentUser);
        }
      }
      
      onUpdate({ currentCount: newCount });
    }
  };

  const handleToggleComplete = () => {
    if (!task.completed) {
      celebrateTaskCompletion(currentUser);
    }
    onUpdate({ completed: !task.completed });
  };

  const progress = task.type === 'countable' && task.targetCount && task.currentCount
    ? (task.currentCount / task.targetCount) * 100
    : task.completed ? 100 : 0;

  const milestoneMsg = getMilestoneMessage(progress);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="text-gray-700 mb-4">{task.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Deadline: {format(new Date(task.deadline), 'MMM d, yyyy')}</span>
              <span>•</span>
              <span className="capitalize">Urgency: {task.urgency}</span>
              <span>•</span>
              <span>
                Assigned to: {task.assignee === 'me' ? userName : task.assignee === 'her' ? partnerName : 'Together'}
              </span>
            </div>
          </div>

          {/* Progress Section */}
          {task.type === 'countable' && task.targetCount ? (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Progress Tracker</h3>
                  <p className="text-gray-600">
                    {task.currentCount || 0} of {task.targetCount} {task.countLabel}
                  </p>
                </div>
                <ProgressRing progress={progress} size={80} strokeWidth={6} />
              </div>

              {milestoneMsg && (
                <div className="mb-4 p-3 bg-white rounded-lg text-center font-medium" style={{ color: '#10b981' }}>
                  {milestoneMsg}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleUpdateCount(-1)}
                  disabled={(task.currentCount || 0) === 0}
                  className="p-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
                <div className="flex-1 text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {task.currentCount || 0}
                  </div>
                  <div className="text-sm text-gray-500">{task.countLabel}</div>
                </div>
                <button
                  onClick={() => handleUpdateCount(1)}
                  disabled={(task.currentCount || 0) >= task.targetCount}
                  className="p-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Task Status</h3>
                  <p className="text-gray-600">
                    {task.completed ? 'Completed! 🎉' : 'Mark as complete when done'}
                  </p>
                </div>
                <button
                  onClick={handleToggleComplete}
                  className={`p-4 rounded-lg transition-all ${
                    task.completed 
                      ? 'text-green-500 bg-white' 
                      : 'text-gray-400 bg-white hover:bg-green-50'
                  }`}
                >
                  <CheckCircle2 size={32} />
                </button>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Comments & Updates</h3>
            
            {/* Comment List */}
            <div className="space-y-4 mb-6">
              {task.comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No comments yet. Share your thoughts, recommendations, or progress photos!
                </div>
              ) : (
                task.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                        comment.author === 'me' ? 'bg-doggo-100' : 'bg-ducko-100'
                      }`}>
                        {comment.author === 'me' ? '🐕' : '🦆'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.author === 'me' ? userName : partnerName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        {comment.text && (
                          <p className="text-gray-700 mb-2">{comment.text}</p>
                        )}
                        {comment.photos && comment.photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {comment.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setSelectedAuthor('me')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                    selectedAuthor === 'me'
                      ? 'bg-doggo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>🐕</span>
                  <span>{userName}</span>
                </button>
                <button
                  onClick={() => setSelectedAuthor('her')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                    selectedAuthor === 'her'
                      ? 'bg-ducko-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>🦆</span>
                  <span>{partnerName}</span>
                </button>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts, recommendations, or updates..."
                rows={3}
                className="input-field mb-3"
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={photo}
                        alt={`Upload ${idx + 1}`}
                        className="rounded-lg w-full h-20 object-cover"
                      />
                      <button
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Camera size={18} />
                  Add Photos
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={(!commentText.trim() && photos.length === 0) || isUploadingPhotos}
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
                  className="flex-1 px-6 py-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUploadingPhotos ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Post Comment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

