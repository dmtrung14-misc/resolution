import { useState, useEffect } from 'react';
import { X, Loader2, LogOut } from 'lucide-react';
import { UserRole } from '../types';
import { authService } from '../services/authService';

interface SettingsModalProps {
  currentUser: UserRole;
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsModal({ currentUser, onClose, onLogout }: SettingsModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await authService.updateDisplayName(currentUser, displayName.trim());
      setMessage({ type: 'success', text: 'Display name updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update display name' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const success = await authService.updatePassword(currentUser, oldPassword, newPassword);
      
      if (success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'Incorrect old password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentUser === 'doggo' ? '🐕' : '🦆'}</span>
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Display Name Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Display Name</h3>
            <p className="text-sm text-gray-600 mb-3">
              Change how your name appears in the app (for fun inside jokes!)
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                onClick={handleUpdateDisplayName}
                disabled={isLoading}
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
                className="px-4 py-2 hover:brightness-110 text-white rounded-lg transition-all disabled:opacity-50 shadow-sm"
              >
                Update
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Change Password</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password"
                className="input-field"
                disabled={isLoading}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="input-field"
                disabled={isLoading}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input-field"
                disabled={isLoading}
              />
              <button
                onClick={handleUpdatePassword}
                disabled={isLoading}
                className="w-full btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>

          {/* Message Display */}
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

          {/* Logout Section */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

