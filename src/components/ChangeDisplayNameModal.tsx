import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { authService } from '../services/authService';

interface ChangeDisplayNameModalProps {
  currentUser: UserRole;
  onClose: () => void;
}

export default function ChangeDisplayNameModal({ currentUser, onClose }: ChangeDisplayNameModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    const profile = await authService.getUserProfile(currentUser);
    if (profile) {
      setDisplayName(profile.displayName);
    }
  };

  const handleUpdate = async () => {
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await authService.updateDisplayName(currentUser, displayName.trim());
      setMessage({ type: 'success', text: 'Display name updated!' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update display name' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Change Display Name</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Change how your name appears in the app (for fun inside jokes!)
          </p>
          
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className="input-field w-full"
            disabled={isLoading}
          />

          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={isLoading}
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
              className="flex-1 px-4 py-2 hover:brightness-110 text-white rounded-lg transition-all disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Updating...
                </span>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

