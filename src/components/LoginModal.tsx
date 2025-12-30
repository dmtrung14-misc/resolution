import { useState } from 'react';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: UserRole, password: string) => Promise<boolean>;
}

export default function LoginModal({ onLogin }: LoginModalProps) {
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectUser = (user: UserRole) => {
    setSelectedUser(user);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await onLogin(selectedUser, password);
      
      if (!success) {
        setError('Incorrect password. Try again!');
        setPassword('');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-100 via-ducko-100 to-doggo-100 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8">
        {!selectedUser ? (
          // User selection screen
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
              <p className="text-gray-600">Who's here? Choose your persona</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectUser('doggo')}
                className="p-8 rounded-xl border-2 border-doggo-300 bg-doggo-50 hover:bg-doggo-100 transition-all flex flex-col items-center gap-3 hover:scale-105"
              >
                <span className="text-6xl">🐕</span>
                <span className="text-xl font-bold text-doggo-800">Doggo</span>
              </button>

              <button
                onClick={() => handleSelectUser('ducko')}
                className="p-8 rounded-xl border-2 border-ducko-300 bg-ducko-50 hover:bg-ducko-100 transition-all flex flex-col items-center gap-3 hover:scale-105"
              >
                <span className="text-6xl">🦆</span>
                <span className="text-xl font-bold text-ducko-800">Ducko</span>
              </button>
            </div>
          </div>
        ) : (
          // Password entry screen
          <div>
            <div className="text-center mb-6">
              <span className="text-6xl block mb-3">
                {selectedUser === 'doggo' ? '🐕' : '🦆'}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome, {selectedUser === 'doggo' ? 'Doggo' : 'Ducko'}!
              </h2>
              <p className="text-gray-600">Enter your password to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>First time? Use the default password:</p>
              <p className="font-mono text-xs mt-1 text-gray-400">
                {selectedUser === 'doggo' ? 'ngongongo' : 'dangdangdang'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

