import { Settings, Cloud } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  completedCount: number;
  totalCount: number;
  currentUser: UserRole | null;
  filter: 'my' | 'partner' | 'together' | null;
  onOpenSettings: () => void;
  isSaving?: boolean;
}

export default function Header({ completedCount, totalCount, currentUser, filter, onOpenSettings, isSaving }: HeaderProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Get Vietnamese greeting based on persona
  const getGreeting = () => {
    if (filter === null) return '';
    if (currentUser === 'ducko') {
      return 'Hôm nay em sẽ làm gì bbi?';
    } else {
      return 'Hôm nay anh sẽ làm gì bbi?';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦆</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Our 2026 together
              </h1>
              <span className="text-3xl">🐕</span>
            </div>
            {getGreeting() && (
              <p className="text-gray-600 text-sm mt-1">
                {getGreeting()}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {isSaving ? (
                <div className="flex items-center gap-2 text-sm">
                  <Cloud className="animate-pulse" style={{ color: '#ef4444' }} size={16} />
                  <span className="font-medium" style={{ color: '#ef4444' }}>Syncing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Cloud style={{ color: '#10b981' }} size={16} />
                  <span className="font-medium" style={{ color: '#10b981' }}>Synced</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div 
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {percentage}%
              </div>
              <div className="text-sm text-gray-500">
                {completedCount} of {totalCount} completed
              </div>
            </div>
            
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

