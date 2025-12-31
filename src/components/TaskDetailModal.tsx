import { useState, useRef, useEffect } from 'react';
import { Task, Comment, UserRole, Reaction, SubTask } from '../types';
import { X, Send, Camera, Plus, Minus, CheckCircle2, Loader2, Calendar, AlertCircle, Smile, Film, Reply, Heart, ThumbsUp, Laugh } from 'lucide-react';
import { format } from 'date-fns';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import ProgressRing from './ProgressRing';
import GifPicker from './GifPicker';
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
  onCreateNotification?: (type: string, taskId: string, taskTitle: string, message: string) => void;
}

export default function TaskDetailModal({ task, userName, partnerName, currentUser, onUpdate, onClose, onCreateNotification }: TaskDetailModalProps) {
  const [commentText, setCommentText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [gifUrl, setGifUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically use current user as comment author
  const commentAuthor: 'me' | 'her' = currentUser === 'doggo' ? 'me' : 'her';

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reactionPickerFor) {
          // Close reaction picker first
          setReactionPickerFor(null);
          setShowEmojiPicker(false);
        } else if (showEmojiPicker || showGifPicker) {
          // Close emoji/gif picker
          setShowEmojiPicker(false);
          setShowGifPicker(false);
        } else {
          // Close the entire panel
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, reactionPickerFor, showEmojiPicker, showGifPicker]);

  const handleAddComment = async () => {
    if (commentText.trim() || photos.length > 0 || gifUrl.trim()) {
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
          author: commentAuthor,
          timestamp: new Date(),
          photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
          gifUrl: gifUrl.trim() || undefined,
          replyTo: replyingTo || undefined,
        };

        // If replying, add to parent's replies, otherwise add as new comment
        let updatedComments: Comment[];
        if (replyingTo) {
          updatedComments = addReplyToComment(task.comments, replyingTo, newComment);
        } else {
          updatedComments = [...task.comments, newComment];
        }

        console.log('Updating task with new comments:', {
          taskId: task.id,
          oldCommentCount: task.comments.length,
          newCommentCount: updatedComments.length,
          updatedComments
        });

        onUpdate({
          comments: updatedComments,
        });

        // Create notification
        if (onCreateNotification) {
          const actorName = currentUser === 'doggo' ? userName : partnerName;
          if (replyingTo) {
            // Find if replying to partner's comment
            const findComment = (comments: Comment[]): Comment | null => {
              for (const comment of comments) {
                if (comment.id === replyingTo) return comment;
                if (comment.replies) {
                  const found = findComment(comment.replies);
                  if (found) return found;
                }
              }
              return null;
            };
            const parentComment = findComment(task.comments);
            if (parentComment && parentComment.author !== commentAuthor) {
              onCreateNotification('comment_reply', task.id, task.title, 
                `${actorName} replied to your comment`);
            }
          } else if (task.assignee === 'together' || task.assignee !== (currentUser === 'doggo' ? 'me' : 'her')) {
            // Notify partner about comment on their task or mutual task
            onCreateNotification('task_comment', task.id, task.title,
              `${actorName} commented on this task`);
          }
        }

        setCommentText('');
        setPhotos([]);
        setGifUrl('');
        setReplyingTo(null);
        setShowGifPicker(false);
        setShowEmojiPicker(false);
      } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to upload photos. Please try again.');
      } finally {
        setIsUploadingPhotos(false);
      }
    }
  };

  const addReplyToComment = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply],
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, reply),
        };
      }
      return comment;
    });
  };

  const toggleReaction = (commentId: string, emoji: string, isReply: boolean = false, parentId?: string) => {
    let shouldNotify = false;
    let commentAuthorToNotify: 'me' | 'her' | null = null;

    const toggleReactionInComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const reactions = comment.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);
          
          let newReactions: Reaction[];
          if (existingReaction) {
            // Toggle user in this reaction
            const hasReacted = existingReaction.users.includes(commentAuthor);
            if (hasReacted) {
              // Remove user's reaction
              const updatedUsers = existingReaction.users.filter(u => u !== commentAuthor);
              if (updatedUsers.length === 0) {
                // Remove reaction entirely if no users left
                newReactions = reactions.filter(r => r.emoji !== emoji);
              } else {
                newReactions = reactions.map(r => 
                  r.emoji === emoji ? { ...r, users: updatedUsers } : r
                );
              }
            } else {
              // Add user to reaction - trigger notification
              newReactions = reactions.map(r => 
                r.emoji === emoji ? { ...r, users: [...r.users, commentAuthor] } : r
              );
              if (comment.author !== commentAuthor) {
                shouldNotify = true;
                commentAuthorToNotify = comment.author;
              }
            }
          } else {
            // Create new reaction - trigger notification
            newReactions = [...reactions, { emoji, users: [commentAuthor] }];
            if (comment.author !== commentAuthor) {
              shouldNotify = true;
              commentAuthorToNotify = comment.author;
            }
          }
          
          return { ...comment, reactions: newReactions };
        }
        
        // Check replies
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: toggleReactionInComments(comment.replies),
          };
        }
        
        return comment;
      });
    };

    const updatedComments = toggleReactionInComments(task.comments);
    onUpdate({ comments: updatedComments });

    // Trigger notification if reacting to partner's comment
    if (shouldNotify && onCreateNotification && commentAuthorToNotify) {
      const actorName = currentUser === 'doggo' ? userName : partnerName;
      onCreateNotification('comment_reaction', task.id, task.title,
        `${actorName} reacted ${emoji} to your comment`);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    if (reactionPickerFor) {
      // Adding a reaction
      toggleReaction(reactionPickerFor, emojiData.emoji);
      setReactionPickerFor(null);
    } else {
      // Adding emoji to comment text
      setCommentText(prev => prev + emojiData.emoji);
    }
  };

  const handleGifSelect = (url: string) => {
    setGifUrl(url);
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

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: SubTask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
    };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    onUpdate({ subtasks: updatedSubtasks });
    
    // Create notification for mutual tasks
    if (onCreateNotification && task.assignee === 'together') {
      const actorName = currentUser === 'doggo' ? userName : partnerName;
      onCreateNotification('task_edited', task.id, task.title,
        `${actorName} added a subtask: "${newSubtask.title}"`);
    }
    
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ subtasks: updatedSubtasks });
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    onUpdate({ subtasks: updatedSubtasks });
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
      
      // Create notification for mutual tasks when completing
      if (onCreateNotification && task.assignee === 'together') {
        const actorName = currentUser === 'doggo' ? userName : partnerName;
        onCreateNotification('task_completed', task.id, task.title,
          `${actorName} completed this task! 🎉`);
      }
    }
    onUpdate({ completed: !task.completed });
  };

  const progress = task.type === 'countable' && task.targetCount && task.currentCount
    ? (task.currentCount / task.targetCount) * 100
    : task.completed ? 100 : 0;

  const milestoneMsg = getMilestoneMessage(progress);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-end" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl h-full overflow-hidden flex flex-col shadow-2xl slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-primary-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Description */}
          {task.description && (
            <div className="text-gray-700 text-sm leading-relaxed">
              {task.description}
            </div>
          )}
          
          {/* Task Info Bar - Slim and Compact */}
          <div className="flex items-center justify-between gap-4 text-xs bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-500" />
                <span className="text-gray-700">
                  {(() => {
                    const deadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
                    return deadline instanceof Date && !isNaN(deadline.getTime()) 
                      ? format(deadline, 'MMM d, yyyy') 
                      : 'Invalid date';
                  })()}
                </span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className={
                  task.urgency === 'high' ? 'text-red-600' : 
                  task.urgency === 'medium' ? 'text-orange-600' : 
                  'text-gray-500'
                } />
                <span className={`capitalize font-medium ${
                  task.urgency === 'high' ? 'text-red-600' : 
                  task.urgency === 'medium' ? 'text-orange-600' : 
                  'text-gray-700'
                }`}>{task.urgency}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-base">
                  {task.assignee === 'me' ? '🐕' : task.assignee === 'her' ? '🦆' : '😚'}
                </span>
                <span className="text-gray-700">
                  {task.assignee === 'me' ? userName : task.assignee === 'her' ? partnerName : 'Together'}
                </span>
              </div>
            </div>
            
            {/* Complete Button */}
            {task.type !== 'countable' && (
              <button
                onClick={handleToggleComplete}
                className={`p-1.5 rounded-lg transition-all ${
                  task.completed 
                    ? 'text-green-500' 
                    : 'text-gray-400 hover:bg-green-50'
                }`}
              >
                <CheckCircle2 size={20} />
              </button>
            )}
          </div>

          {/* Progress Section */}
          {task.type === 'countable' && task.targetCount && (
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
          )}

          {/* Subtasks Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Subtasks</h3>
            
            {/* Subtask List */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="space-y-2 mb-4">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors"
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className="flex-shrink-0"
                    >
                      {subtask.completed ? (
                        <CheckCircle2 size={20} className="text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-400 transition-colors" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-900'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleRemoveSubtask(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
                className="px-4 py-2 text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

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
                  <div key={comment.id}>
                    <div className="bg-gray-50 rounded-lg p-4">
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
                            {(() => {
                              const timestamp = comment.timestamp instanceof Date ? comment.timestamp : new Date(comment.timestamp);
                              if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
                                return (
                                  <span className="text-xs text-gray-500">
                                    {format(timestamp, 'MMM d, h:mm a')}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {comment.text && (
                            <p className="text-gray-700 mb-2 whitespace-pre-wrap">{comment.text}</p>
                          )}
                          {comment.gifUrl && (
                            <div className="mt-2 mb-2">
                              <img
                                src={comment.gifUrl}
                                alt="GIF"
                                className="rounded-lg max-w-full h-auto max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(comment.gifUrl, '_blank')}
                              />
                            </div>
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
                          {/* Reactions */}
                          {comment.reactions && comment.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 items-center">
                              {comment.reactions.map((reaction, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => toggleReaction(comment.id, reaction.emoji)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all hover:scale-110 ${
                                    reaction.users.includes(commentAuthor)
                                      ? 'bg-blue-100 border-2 border-blue-400'
                                      : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                                  }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="text-xs font-medium">{reaction.users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 mt-2 relative">
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Reply size={12} />
                              Reply
                            </button>
                            
                            <button
                              onClick={() => {
                                setReactionPickerFor(comment.id);
                                setShowEmojiPicker(true);
                                setShowGifPicker(false);
                              }}
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                              title="Add reaction"
                            >
                              <Smile size={12} />
                              React
                            </button>
                            
                            {/* Reaction Emoji Picker */}
                            {reactionPickerFor === comment.id && showEmojiPicker && (
                              <div className="absolute left-0 top-6 z-50 shadow-xl rounded-lg border border-gray-200 bg-white">
                                <EmojiPicker
                                  onEmojiClick={onEmojiClick}
                                  width={350}
                                  height={400}
                                  searchPlaceHolder="Search emoji..."
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-12 mt-2 space-y-2">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                                reply.author === 'me' ? 'bg-doggo-100' : 'bg-ducko-100'
                              }`}>
                                {reply.author === 'me' ? '🐕' : '🦆'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900">
                                    {reply.author === 'me' ? userName : partnerName}
                                  </span>
                                  {(() => {
                                    const timestamp = reply.timestamp instanceof Date ? reply.timestamp : new Date(reply.timestamp);
                                    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
                                      return (
                                        <span className="text-xs text-gray-500">
                                          {format(timestamp, 'MMM d, h:mm a')}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                {reply.text && (
                                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.text}</p>
                                )}
                                {reply.gifUrl && (
                                  <div className="mt-2">
                                    <img
                                      src={reply.gifUrl}
                                      alt="GIF"
                                      className="rounded-lg max-w-full h-auto max-h-48 cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(reply.gifUrl, '_blank')}
                                    />
                                  </div>
                                )}
                                {reply.photos && reply.photos.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {reply.photos.map((photo, idx) => (
                                      <img
                                        key={idx}
                                        src={photo}
                                        alt={`Photo ${idx + 1}`}
                                        className="rounded-lg w-full h-20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(photo, '_blank')}
                                      />
                                    ))}
                                  </div>
                                )}
                                
                                {/* Reactions for replies */}
                                {reply.reactions && reply.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2 items-center">
                                    {reply.reactions.map((reaction, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => toggleReaction(reply.id, reaction.emoji)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110 ${
                                          reaction.users.includes(commentAuthor)
                                            ? 'bg-blue-100 border-2 border-blue-400'
                                            : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                                        }`}
                                      >
                                        <span className="text-xs">{reaction.emoji}</span>
                                        <span className="font-medium text-xs">{reaction.users.length}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Action Buttons for replies */}
                                <div className="flex items-center gap-3 mt-1 relative">
                                  <button
                                    onClick={() => setReplyingTo(reply.id)}
                                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                                  >
                                    <Reply size={11} />
                                    Reply
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      setReactionPickerFor(reply.id);
                                      setShowEmojiPicker(true);
                                      setShowGifPicker(false);
                                    }}
                                    className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                                    title="Add reaction"
                                  >
                                    <Smile size={11} />
                                    React
                                  </button>
                                  
                                  {/* Reaction Emoji Picker for replies */}
                                  {reactionPickerFor === reply.id && showEmojiPicker && (
                                    <div className="absolute left-0 top-5 z-50 shadow-xl rounded-lg border border-gray-200 bg-white">
                                      <EmojiPicker
                                        onEmojiClick={onEmojiClick}
                                        width={350}
                                        height={400}
                                        searchPlaceHolder="Search emoji..."
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                    currentUser === 'doggo' ? 'bg-doggo-100' : 'bg-ducko-100'
                  }`}>
                    {currentUser === 'doggo' ? '🐕' : '🦆'}
                  </div>
                  <span className="font-medium text-gray-700">
                    {currentUser === 'doggo' ? userName : partnerName}
                  </span>
                </div>
                {replyingTo && (
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <X size={14} />
                    Cancel reply
                  </button>
                )}
              </div>
              
              {replyingTo && (
                <div className="mb-2 text-xs text-blue-600 flex items-center gap-1">
                  <Reply size={12} />
                  Replying to a comment
                </div>
              )}


              {/* GIF Preview */}
              {gifUrl && (
                <div className="mb-3 relative">
                  <img
                    src={gifUrl}
                    alt="GIF preview"
                    className="rounded-lg max-h-40 object-contain w-full"
                  />
                  <button
                    onClick={() => setGifUrl('')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

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

              <div className="flex gap-2 relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowGifPicker(false);
                      setReactionPickerFor(null);
                    }}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                    title="Add emoji"
                  >
                    <Smile size={18} />
                  </button>
                  
                  {/* Emoji Picker for adding to comment text */}
                  {showEmojiPicker && !reactionPickerFor && (
                    <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg border border-gray-200 bg-white">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={350}
                        height={400}
                        searchPlaceHolder="Search emoji..."
                      />
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowGifPicker(!showGifPicker);
                      setShowEmojiPicker(false);
                      setReactionPickerFor(null);
                    }}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                    title="Add GIF"
                  >
                    <Film size={18} />
                  </button>
                  
                  {/* GIF Picker */}
                  {showGifPicker && (
                    <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg border border-gray-200 bg-white overflow-hidden">
                      <GifPicker
                        onSelect={handleGifSelect}
                        onClose={() => setShowGifPicker(false)}
                      />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
                  title="Add photos"
                >
                  <Camera size={18} />
                </button>
                
                <div className="flex-1"></div>
                
                <button
                  onClick={handleAddComment}
                  disabled={(!commentText.trim() && photos.length === 0 && !gifUrl.trim()) || isUploadingPhotos}
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
                  className="w-10 h-10 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center shadow-sm"
                  title="Post comment"
                >
                  {isUploadingPhotos ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
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

