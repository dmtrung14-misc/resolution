import { useState, useEffect } from 'react';
import { Task, AppState, UserRole, Notification } from './types';
import { firebaseService } from './services/firebaseService';
import { authService } from './services/authService';
import { celebrateTaskCreation } from './utils/customCelebrations';
import Header from './components/Header';
import TaskCard from './components/TaskCard';
import TaskListItem from './components/TaskListItem';
import TaskModal from './components/TaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import LoginModal from './components/LoginModal';
import SettingsModal from './components/SettingsModal';
import NotificationPanel from './components/NotificationPanel';
import { Plus, Loader2, LayoutGrid, List, ChevronDown } from 'lucide-react';

function App() {
  const [state, setState] = useState<AppState>({
    tasks: [],
    userName: '',
    partnerName: '',
    notifications: [],
  });

  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState<'my' | 'partner' | 'together' | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'deadline' | 'interaction'>('deadline');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

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

  // Handle task links from URL
  useEffect(() => {
    if (!isLoading && isAuthenticated && state.tasks.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const taskId = urlParams.get('taskId');
      
      if (taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          // Clear URL parameters after opening
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [isLoading, isAuthenticated, state.tasks]);

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
    
    console.log('State changed, scheduling save. Task count:', state.tasks.length);
    
    const saveData = async () => {
      setIsSaving(true);
      console.log('Saving state to Firebase...');
      try {
        await firebaseService.saveState(state);
        console.log('Save completed');
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

  const handleShowCopyNotification = () => {
    setShowCopyNotification(true);
    setTimeout(() => {
      setShowCopyNotification(false);
    }, 3000);
  };

  // Create notification
  const createNotification = (
    type: Notification['type'],
    taskId: string,
    taskTitle: string,
    message: string
  ) => {
    if (!currentUser) return;

    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      taskId,
      taskTitle,
      actorRole: currentUser,
      message,
      timestamp: new Date(),
      read: false,
    };

    setState(prev => ({
      ...prev,
      notifications: [newNotification, ...(prev.notifications || [])],
    }));
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => ({ ...n, read: true })),
    }));
  };

  // Handle notification click
  const handleNotificationClick = (taskId: string, notificationId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      markNotificationAsRead(notificationId);
      setShowNotifications(false);
    }
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
    
    // Celebrate task creation with tag-based or seasonal animation
    celebrateTaskCreation(new Date(task.deadline), task.tags);

    // Create notification for mutual tasks
    if (currentUser && newTask.assignee === 'together') {
      const actorName = currentUser === 'doggo' ? state.userName : state.partnerName;
      createNotification('task_created', newTask.id, newTask.title,
        `${actorName} created a new task for us!`);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    console.log('updateTask called:', { id, updates });
    setState(prev => {
      const updatedTasks = prev.tasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      );
      console.log('Updated tasks:', updatedTasks.find(t => t.id === id));
      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
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
  
  // Helper function to get latest interaction time
  const getLatestInteraction = (task: Task): Date => {
    const commentTimes = task.comments.map(c => c.timestamp);
    const allTimes = [task.createdAt, ...commentTimes];
    return new Date(Math.max(...allTimes.map(t => t.getTime())));
  };

  // Helper function for urgency sorting (high > medium > low)
  const getUrgencyValue = (urgency: Urgency): number => {
    if (urgency === 'high') return 3;
    if (urgency === 'medium') return 2;
    return 1;
  };
  
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

  // Sort tasks based on selected sort option
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'priority':
        // Sort by urgency (high first), then by deadline
        const urgencyDiff = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.deadline.getTime() - b.deadline.getTime();
      case 'deadline':
        return a.deadline.getTime() - b.deadline.getTime();
      case 'interaction':
        return getLatestInteraction(b).getTime() - getLatestInteraction(a).getTime();
      default:
        return 0;
    }
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
  
  // Get unread notifications for current user
  const unreadNotifications = (state.notifications || []).filter(
    n => !n.read && n.actorRole !== currentUser
  ).length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/assets/icon-removebg.png" 
            alt="Loading" 
            className="w-24 h-24 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600 text-lg">Loading your resolutions...</p>
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
        completedCount={completedCount}
        totalCount={totalCount}
        currentUser={currentUser}
        filter={filter}
        unreadNotifications={unreadNotifications}
        showNotifications={showNotifications}
        notifications={(state.notifications || []).filter(n => n.actorRole !== currentUser)}
        userName={state.userName}
        partnerName={state.partnerName}
        onOpenSettings={() => setShowSettings(true)}
        onOpenNotifications={() => setShowNotifications(!showNotifications)}
        onCloseNotifications={() => setShowNotifications(false)}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onNotificationClick={handleNotificationClick}
        isSaving={isSaving}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs, Sort, and Display Mode Toggle */}
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

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:border-blue-300 transition-colors shadow-sm"
              >
                <span className="text-sm text-gray-500 whitespace-nowrap">Sort by</span>
                <span className="text-sm font-medium text-gray-900">
                  {sortBy === 'deadline' ? 'Deadline' : 
                   sortBy === 'name' ? 'Name' : 
                   sortBy === 'priority' ? 'Priority' : 
                   'Latest Activity'}
                </span>
                <ChevronDown size={16} className={`text-blue-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {showSortDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[180px]">
                    {[
                      { value: 'deadline', label: 'Deadline' },
                      { value: 'name', label: 'Name' },
                      { value: 'priority', label: 'Priority' },
                      { value: 'interaction', label: 'Latest Activity' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value as any);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortBy === option.value
                            ? 'bg-gray-200 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
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
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No resolutions in this category yet!</p>
            <p className="text-gray-400 mb-8">Start by adding your first goal</p>
          </div>
        ) : displayMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTasks.map(task => (
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
                onCopyLink={handleShowCopyNotification}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(task => (
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
                onCopyLink={handleShowCopyNotification}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Task Button */}
      <button
        onClick={() => setIsTaskModalOpen(true)}
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
        className="fixed bottom-8 right-8 hover:brightness-110 text-white rounded-full p-4 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-lg"
        aria-label="Add new resolution"
      >
        <Plus size={28} />
      </button>

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
          onCreateNotification={createNotification}
        />
      )}

      {/* Copy Link Notification */}
      {showCopyNotification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
          <div 
            className="bg-white rounded-xl px-6 py-4 shadow-2xl border-2 flex items-center gap-3"
            style={{ borderColor: '#10b981' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Link copied!</p>
              <p className="text-sm text-gray-600">Share it with your partner 💕</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

