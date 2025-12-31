import { Notification, UserRole } from '../types';
import { X, MessageCircle, Heart, CheckCircle, Plus, Edit, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
  notifications: Notification[];
  currentUser: UserRole;
  userName: string;
  partnerName: string;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (taskId: string, notificationId: string) => void;
}

export default function NotificationPanel({
  notifications,
  currentUser,
  userName,
  partnerName,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationPanelProps) {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment_reply':
        return <MessageCircle size={18} className="text-blue-500" />;
      case 'comment_reaction':
        return <Heart size={18} className="text-red-500" />;
      case 'task_comment':
        return <MessageCircle size={18} className="text-purple-500" />;
      case 'task_completed':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'task_created':
        return <Plus size={18} className="text-blue-500" />;
      case 'task_edited':
        return <Edit size={18} className="text-orange-500" />;
    }
  };

  const getActorName = (actorRole: UserRole) => {
    if (actorRole === currentUser) {
      return 'You';
    }
    return actorRole === 'doggo' ? userName : partnerName;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] flex flex-col z-50 border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span 
                className="px-2 py-0.5 text-xs font-semibold text-white rounded-full"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mark All as Read */}
        {unreadCount > 0 && (
          <div className="px-6 py-2 border-b border-gray-200">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">No notifications yet</p>
              <p className="text-gray-400 text-xs mt-1">
                You'll see updates about your shared tasks here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => onNotificationClick(notification.taskId, notification.id)}
                  className={`px-6 py-4 cursor-pointer transition-colors ${
                    notification.read
                      ? 'hover:bg-gray-50'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.taskTitle}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

