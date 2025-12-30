import { useState, useEffect } from 'react';
import { Task, AppState, UserRole } from './types';
import { firebaseService } from './services/firebaseService';
import { authService } from './services/authService';
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import TaskListItem from './components/TaskListItem';
import TaskModal from './components/TaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import LoginModal from './components/LoginModal';
import SettingsModal from './components/SettingsModal';
import FeatureGuide from './components/FeatureGuide';
import { Plus, Info, Loader2, LayoutGrid, List } from 'lucide-react';

function App() {
  const [state, setState] = useState<AppState>({
    tasks: [],
    userName: '',
    partnerName: '',
  });

  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeatureGuide, setShowFeatureGuide] = useState(false);
  const [filter, setFilter] = useState<'my' | 'partner' | 'together' | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize default users in Firebase
        await authService.initializeDefaultUsers();
        
        // Check if user is already logged in (from localStorage)
        const storedUser = authService.getStoredAuth();
        
        if (storedUser) {
          setCurrentUser(storedUser);
          setIsAuthenticated(true);
          await loadAppData();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Load app data (tasks and display names)
  const loadAppData = async () => {
    try {
      const [loaded, displayNames] = await Promise.all([
        firebaseService.loadState(),
        authService.getDisplayNames(),
      ]);
      
      if (loaded) {
        setState({
          ...loaded,
          userName: displayNames.doggo,
          partnerName: displayNames.ducko,
        });
      } else {
        setState(prev => ({
          ...prev,
          userName: displayNames.doggo,
          partnerName: displayNames.ducko,
        }));
      }
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  };

  // Save state to Firebase whenever it changes
  useEffect(() => {
    if (isLoading || !isAuthenticated) return; // Don't save during initial load or if not authenticated
    
    const saveData = async () => {
      setIsSaving(true);
      try {
        await firebaseService.saveState(state);
      } catch (error) {
        console.error('Error saving to Firebase:', error);
      } finally {
        setIsSaving(false);
      }
    };
    
    // Debounce saves
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [state, isLoading, isAuthenticated]);

  // Handle login
  const handleLogin = async (username: UserRole, password: string): Promise<boolean> => {
    const success = await authService.login(username, password);
    
    if (success) {
      setCurrentUser(username);
      setIsAuthenticated(true);
      await loadAppData();
    }
    
    return success;
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setState({
      tasks: [],
      userName: '',
      partnerName: '',
    });
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
    }));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleSettingsClosed = async () => {
    setShowSettings(false);
    // Reload display names in case they changed
    await loadAppData();
  };

  // Determine assignee values based on current user
  const myAssignee: Assignee = 'me';
  const partnerAssignee: Assignee = 'her';
  
  const filteredTasks = state.tasks.filter(task => {
    if (filter === null) {
      // No filter selected - show all tasks
      return true;
    } else if (filter === 'my') {
      // Show tasks assigned to me OR together
      return task.assignee === myAssignee || task.assignee === 'together';
    } else if (filter === 'partner') {
      // Show tasks assigned to partner OR together
      return task.assignee === partnerAssignee || task.assignee === 'together';
    } else if (filter === 'together') {
      // Show only together tasks
      return task.assignee === 'together';
    }
    return true;
  });
  
  // Vietnamese greeting message based on current user
  const getGreetingMessage = () => {
    if (currentUser === 'ducko') {
      return 'Hôm nay em sẽ làm gì bbi?';
    } else {
      return 'Hôm nay anh sẽ làm gì bbi?';
    }
  };

  const completedCount = state.tasks.filter(t => t.completed).length;
  const totalCount = state.tasks.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" style={{ color: '#3b82f6' }} size={48} />
          <p className="text-gray-600 text-lg">Loading your resolutions...</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-2xl">🐕</span>
            <span className="text-2xl">🦆</span>
          </div>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userName={state.userName}
        partnerName={state.partnerName}
        completedCount={completedCount}
        totalCount={totalCount}
        onOpenSettings={() => setShowSettings(true)}
        isSaving={isSaving}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs and Display Mode Toggle */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(['my', 'partner', 'together'] as const).map((f) => {
            const getEmoji = () => {
              if (f === 'my') return currentUser === 'doggo' ? '🐕' : '🦆';
              if (f === 'partner') return currentUser === 'doggo' ? '🦆' : '🐕';
              return '😚';
            };
            
            const getLabel = () => {
              if (f === 'my') return 'My Tasks';
              if (f === 'partner') return currentUser === 'doggo' ? state.partnerName : state.userName;
              return 'Together';
            };
            
            return (
              <button
                key={f}
                onClick={() => setFilter(filter === f ? null : f)}
                style={filter === f ? { background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' } : {}}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? 'text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{getEmoji()}</span>
                <span>{getLabel()}</span>
              </button>
            );
          })}
          </div>

          {/* Display Mode Toggle */}
          <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-2 rounded transition-all ${
                displayMode === 'grid'
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              style={displayMode === 'grid' ? { background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' } : {}}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setDisplayMode('list')}
              className={`p-2 rounded transition-all ${
                displayMode === 'list'
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              style={displayMode === 'list' ? { background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' } : {}}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Tasks Display */}
        {filter === null ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <span className="text-6xl mb-4 block">
                {currentUser === 'doggo' ? '🐕' : '🦆'}
              </span>
              <p 
                className="text-3xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {getGreetingMessage()}
              </p>
              <p className="text-gray-500 text-lg">Choose a category above to see your tasks</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No resolutions in this category yet!</p>
            <p className="text-gray-400 mb-8">Start by adding your first goal</p>
          </div>
        ) : displayMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                userName={state.userName}
                partnerName={state.partnerName}
                currentUser={currentUser!}
                onUpdate={(updates) => updateTask(task.id, updates)}
                onDelete={() => deleteTask(task.id)}
                onEdit={() => handleEditTask(task)}
                onViewDetails={() => setSelectedTask(task)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskListItem
                key={task.id}
                task={task}
                userName={state.userName}
                partnerName={state.partnerName}
                currentUser={currentUser!}
                onUpdate={(updates) => updateTask(task.id, updates)}
                onDelete={() => deleteTask(task.id)}
                onEdit={() => handleEditTask(task)}
                onViewDetails={() => setSelectedTask(task)}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={() => setIsTaskModalOpen(true)}
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
          className="fixed bottom-8 right-8 hover:brightness-110 text-white rounded-full p-4 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-lg"
          aria-label="Add new resolution"
        >
          <Plus size={28} />
        </button>

        <button
          onClick={() => setShowFeatureGuide(true)}
          style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)' }}
          className="fixed bottom-8 left-8 hover:brightness-95 text-gray-700 rounded-full p-4 transition-all hover:scale-110 border border-gray-200 shadow-lg"
          aria-label="Feature guide"
        >
          <Info size={24} />
        </button>
      </main>

      {/* Modals */}
      {showSettings && currentUser && (
        <SettingsModal
          currentUser={currentUser}
          onClose={handleSettingsClosed}
          onLogout={handleLogout}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal
          userName={state.userName}
          partnerName={state.partnerName}
          editingTask={editingTask}
          onSave={(task) => {
            if (editingTask) {
              updateTask(editingTask.id, task);
            } else {
              addTask(task);
            }
            handleCloseTaskModal();
          }}
          onClose={handleCloseTaskModal}
        />
      )}

      {selectedTask && currentUser && (
        <TaskDetailModal
          task={selectedTask}
          userName={state.userName}
          partnerName={state.partnerName}
          currentUser={currentUser}
          onUpdate={(updates) => {
            updateTask(selectedTask.id, updates);
            setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
          }}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showFeatureGuide && (
        <FeatureGuide onClose={() => setShowFeatureGuide(false)} />
      )}
    </div>
  );
}

export default App;

