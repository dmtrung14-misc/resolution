import { useEffect } from 'react';
import { X, Heart, MessageCircle, Camera, TrendingUp, Users, CheckCircle } from 'lucide-react';

interface FeatureGuideProps {
  onClose: () => void;
}

export default function FeatureGuide({ onClose }: FeatureGuideProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Heart style={{ color: '#3b82f6' }} size={28} />
            <h2 className="text-2xl font-bold text-gray-900">How to Use Our App</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-600">
              Your personal resolution tracker built for couples! Here's everything you can do together 🐕🦆
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-5">
            {/* Create Tasks */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)' }}>
                  <CheckCircle style={{ color: '#3b82f6' }} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Create Resolutions</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Click the <strong>+ button</strong> to add new resolutions with:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• <strong>Regular tasks</strong> - Simple complete/incomplete goals</li>
                    <li>• <strong>Countable goals</strong> - Track progress (e.g., "Read 50 books")</li>
                    <li>• <strong>Deadlines & urgency</strong> - Stay on track</li>
                    <li>• <strong>Assign to anyone</strong> - You 🐕, partner 🦆, or together 😚</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Together Tasks */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="text-purple-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    Do It Together 😚
                  </h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Mark tasks as <strong>"Together"</strong> and they'll appear in both of your task lists!
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Perfect for shared goals like "Visit 10 new restaurants"</li>
                    <li>• Both can track progress and add updates</li>
                    <li>• Filter by "Together 😚" to see only shared goals</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="bg-gradient-to-r from-doggo-50 to-green-50 border border-doggo-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="bg-doggo-100 p-2 rounded-lg">
                  <TrendingUp className="text-doggo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Track Your Progress</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    For countable goals, use the <strong>+/- buttons</strong> to update your count:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Visual progress rings show completion %</li>
                    <li>• Celebrate milestones at 25%, 50%, 75%, 100%</li>
                    <li>• Confetti animations when you complete goals! 🎉</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Comments & Photos */}
            <div className="bg-gradient-to-r from-ducko-50 to-yellow-50 border border-ducko-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="bg-ducko-100 p-2 rounded-lg">
                  <MessageCircle className="text-ducko-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Comments & Discussions</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Click <strong>"View Details"</strong> on any task to:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Add comments and thoughts</li>
                    <li>• Share recommendations and tips</li>
                    <li>• Encourage each other</li>
                    <li>• See full task history</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Photo Sharing */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Camera className="text-pink-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Share Photos</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Document your journey with photos:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Upload photos in comments</li>
                    <li>• Share your achievements visually</li>
                    <li>• Create a memory timeline together</li>
                    <li>• Photos stored securely in cloud</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Filtering */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Smart Filtering</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Use the filter tabs at the top:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>My Tasks</strong> - Your tasks + Together tasks</li>
                  <li>• <strong>[Partner Name]</strong> - Their tasks + Together tasks</li>
                  <li>• <strong>Together 😚</strong> - Only shared goals</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gray-100 rounded-lg p-5 mt-6">
            <h3 className="font-bold text-gray-900 mb-3">💡 Pro Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✨ Use Settings (⚙️) to change your display name for fun inside jokes</li>
              <li>🎯 Set "Together" tasks for goals you want to achieve as a couple</li>
              <li>📸 Add photos regularly to document your progress</li>
              <li>💬 Comment on each other's tasks to show support</li>
              <li>🎉 Watch for confetti when completing goals - it's motivating!</li>
              <li>☁️ Everything syncs automatically - use from any device</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            Got it! Let's go 🚀
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd> or{' '}
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

