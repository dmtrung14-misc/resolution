import { useState } from 'react';
import { X, User, Key, Info, LogOut, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';
import ChangeDisplayNameModal from './ChangeDisplayNameModal';
import ChangePasswordModal from './ChangePasswordModal';
import FeatureGuide from './FeatureGuide';

interface SettingsModalProps {
  currentUser: UserRole;
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsModal({ currentUser, onClose, onLogout }: SettingsModalProps) {
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFeatureGuide, setShowFeatureGuide] = useState(false);

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

        <div className="p-6 space-y-3">
          {/* Settings Options */}
          <button
            onClick={() => setShowDisplayNameModal(true)}
            className="w-full flex items-center justify-between px-4 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <User size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Change Display Name</div>
                <div className="text-sm text-gray-500">Update how your name appears</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between px-4 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                <Key size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Change Password</div>
                <div className="text-sm text-gray-500">Update your password</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
          </button>

          <button
            onClick={() => setShowFeatureGuide(true)}
            className="w-full flex items-center justify-between px-4 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Info size={20} className="text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Feature Guide</div>
                <div className="text-sm text-gray-500">Learn about app features</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
          </button>

          {/* Logout Button */}
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
        
        {/* Sub-modals */}
        {showDisplayNameModal && (
          <ChangeDisplayNameModal
            currentUser={currentUser}
            onClose={() => setShowDisplayNameModal(false)}
          />
        )}
        
        {showPasswordModal && (
          <ChangePasswordModal
            currentUser={currentUser}
            onClose={() => setShowPasswordModal(false)}
          />
        )}
        
        {showFeatureGuide && (
          <FeatureGuide onClose={() => setShowFeatureGuide(false)} />
        )}
      </div>
    </div>
  );
}

