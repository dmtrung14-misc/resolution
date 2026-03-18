import { useState, useEffect } from 'react';
import { Task, AppState, UserRole, Notification, Assignee, Urgency, FirstWish } from './types';
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
import { Plus, LayoutGrid, List, ChevronDown, ArrowUp, ArrowDown, Sparkles, CheckCircle2, Circle, Trash2 } from 'lucide-react';

// Motivational quotes for loading screen
const motivationalQuotes = [
  "Great things never come from comfort zones.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Together we can do so much.",
  "Small steps every day lead to big changes.",
  "Your only limit is you.",
  "Dream big, start small, act now.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The future depends on what you do today.",
  "Believe you can and you're halfway there.",
  "Every accomplishment starts with the decision to try.",
  "Progress, not perfection.",
  "Two hearts, one goal.",
  "Love grows when we grow together.",
  "The best project you'll ever work on is you.",
  "Make today count.",
];

const AVAILABLE_YEARS = ['2026'] as const;
type MainFilter = 'my' | 'partner' | 'together' | 'firstWishes' | null;

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
  const [filter, setFilter] = useState<MainFilter>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'deadline' | 'interaction'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [firstWishPendingDelete, setFirstWishPendingDelete] = useState<FirstWish | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(AVAILABLE_YEARS[0]);
  const [firstWishes, setFirstWishes] = useState<FirstWish[]>([]);
  const [showFirstWishModal, setShowFirstWishModal] = useState(false);
  const [newFirstWishTitle, setNewFirstWishTitle] = useState('');
  const [loadingQuote] = useState(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );
  const isSaving = pendingWrites > 0;

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
          // Load data BEFORE setting authenticated to prevent race condition with save effect
          await loadAppData();
          setIsAuthenticated(true);
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
  const loadAppData = async (year: string = selectedYear) => {
    try {
      const [loaded, displayNames, loadedFirstWishes] = await Promise.all([
        firebaseService.loadState(year),
        authService.getDisplayNames(),
        firebaseService.loadFirstWishes(),
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
      setFirstWishes(loadedFirstWishes);
    } catch (error) {
      console.error('Error loading app data:', error);
    }
  };

  const runWrite = async (operationName: string, action: () => Promise<void>) => {
    setPendingWrites((prev) => prev + 1);
    try {
      await action();
    } catch (error) {
      console.error(`Error during ${operationName}:`, error);
    } finally {
      setPendingWrites((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle login
  const handleLogin = async (username: UserRole, password: string): Promise<boolean> => {
    const success = await authService.login(username, password);
    
    if (success) {
      setCurrentUser(username);
      // Load data BEFORE setting authenticated to prevent race condition with save effect
      await loadAppData();
      setIsAuthenticated(true);
    }
    
    return success;
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setFirstWishes([]);
    setState({
      tasks: [],
      userName: '',
      partnerName: '',
      notifications: [],
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

    void runWrite('notification create', () =>
      firebaseService.upsertNotification(newNotification)
    );
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    const existingNotification = (state.notifications || []).find((n) => n.id === notificationId);
    if (!existingNotification) return;

    const updatedNotification: Notification = { ...existingNotification, read: true };
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n =>
        n.id === notificationId
          ? updatedNotification
          : n
      ),
    }));

    void runWrite('notification mark as read', () =>
      firebaseService.upsertNotification(updatedNotification)
    );
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    const updatedNotifications = (state.notifications || []).map((n) => ({ ...n, read: true }));
    setState(prev => ({
      ...prev,
      notifications: updatedNotifications,
    }));

    if (updatedNotifications.length > 0) {
      void runWrite('notification mark all as read', () =>
        firebaseService.upsertNotifications(updatedNotifications)
      );
    }
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
    void runWrite('task create', () => firebaseService.upsertTask(newTask, selectedYear));
    
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
    const existingTask = state.tasks.find((task) => task.id === id);
    if (!existingTask) return;

    const updatedTask: Task = { ...existingTask, ...updates };
    setState(prev => {
      const updatedTasks = prev.tasks.map(task => 
        task.id === id ? updatedTask : task
      );
      console.log('Updated tasks:', updatedTasks.find(t => t.id === id));
      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    void runWrite('task update', () => firebaseService.upsertTask(updatedTask, selectedYear));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
    }));
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
    void runWrite('task delete', () => firebaseService.deleteTask(id, selectedYear));
  };

  const requestDeleteTask = (task: Task) => {
    setTaskPendingDelete(task);
  };

  const confirmDeleteTask = () => {
    if (!taskPendingDelete) return;
    deleteTask(taskPendingDelete.id);
    setTaskPendingDelete(null);
  };

  const cancelDeleteTask = () => {
    setTaskPendingDelete(null);
  };

  const addFirstWish = () => {
    const title = newFirstWishTitle.trim();
    if (!title) return;

    const newWish: FirstWish = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date(),
    };

    setFirstWishes((prev) => [newWish, ...prev]);
    setNewFirstWishTitle('');
    setShowFirstWishModal(false);
    void runWrite('first wish create', () => firebaseService.upsertFirstWish(newWish));
  };

  const toggleFirstWish = (wishId: string) => {
    const existingWish = firstWishes.find((wish) => wish.id === wishId);
    if (!existingWish) return;

    const updatedWish: FirstWish = { ...existingWish, completed: !existingWish.completed };
    setFirstWishes((prev) =>
      prev.map((wish) =>
        wish.id === wishId ? updatedWish : wish
      )
    );

    void runWrite('first wish update', () => firebaseService.upsertFirstWish(updatedWish));
  };

  const deleteFirstWish = (wishId: string) => {
    setFirstWishes((prev) => prev.filter((wish) => wish.id !== wishId));
    void runWrite('first wish delete', () => firebaseService.deleteFirstWish(wishId));
  };

  const requestDeleteFirstWish = (wish: FirstWish) => {
    setFirstWishPendingDelete(wish);
  };

  const confirmDeleteFirstWish = () => {
    if (!firstWishPendingDelete) return;
    deleteFirstWish(firstWishPendingDelete.id);
    setFirstWishPendingDelete(null);
  };

  const cancelDeleteFirstWish = () => {
    setFirstWishPendingDelete(null);
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

  const handleYearChange = async (year: string) => {
    if (year === selectedYear) return;
    setSelectedYear(year);
    setSelectedTask(null);
    setEditingTask(null);
    setIsTaskModalOpen(false);
    if (isAuthenticated) {
      await loadAppData(year);
    }
  };

  // Determine assignee values based on current user
  const myAssignee: Assignee = currentUser === 'doggo' ? 'me' : 'her';
  const partnerAssignee: Assignee = currentUser === 'doggo' ? 'her' : 'me';
  
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
    if (filter === 'firstWishes') return false;
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
    // Always put completed tasks at the bottom
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Apply sort logic within completed/incomplete groups
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        // Sort by urgency (high first), then by deadline
        const urgencyDiff = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
        if (urgencyDiff !== 0) {
          comparison = urgencyDiff;
        } else {
          comparison = a.deadline.getTime() - b.deadline.getTime();
        }
        break;
      case 'deadline':
        comparison = a.deadline.getTime() - b.deadline.getTime();
        break;
      case 'interaction':
        comparison = getLatestInteraction(b).getTime() - getLatestInteraction(a).getTime();
        break;
      default:
        comparison = 0;
    }
    
    // Apply sort direction
    return sortDirection === 'asc' ? comparison : -comparison;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <img 
            src="/assets/icon-removebg.png" 
            alt="Loading" 
            className="w-24 h-24 mx-auto mb-6 animate-pulse"
          />
          <p className="text-gray-700 text-lg font-medium italic mb-2">
            "{loadingQuote}"
          </p>
          <p className="text-gray-500 text-sm">Loading your resolutions...</p>
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
          <div className="flex gap-2 overflow-x-auto overflow-y-visible scrollbar-hide py-2 -my-2 px-3 -mx-3">
            {(['my', 'partner', 'together', 'firstWishes'] as const).map((f) => {
            const getEmoji = () => {
              if (f === 'my') return currentUser === 'doggo' ? '🐕' : '🦆';
              if (f === 'partner') return currentUser === 'doggo' ? '🦆' : '🐕';
              if (f === 'firstWishes') return '✨';
              return '😚';
            };
            
            const getLabel = () => {
              if (f === 'my') return 'My Tasks';
              if (f === 'partner') return currentUser === 'doggo' ? state.partnerName : state.userName;
              if (f === 'firstWishes') return 'First Wishes';
              return 'Together';
            };
            
            return (
              <button
                key={f}
                onClick={() => setFilter(filter === f ? null : f)}
                style={
                  filter === f
                    ? f === 'firstWishes'
                      ? { background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }
                      : { background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }
                    : {}
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? 'text-white shadow-sm'
                    : f === 'firstWishes'
                      ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{getEmoji()}</span>
                <span>{getLabel()}</span>
              </button>
            );
          })}
          </div>

          {filter !== 'firstWishes' && (
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

            {/* Sort Direction Toggle */}
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center bg-white border border-gray-200 rounded-lg p-2 hover:border-blue-300 transition-colors shadow-sm"
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDirection === 'asc' ? (
                <ArrowUp size={18} className="text-blue-500" />
              ) : (
                <ArrowDown size={18} className="text-blue-500" />
              )}
            </button>

            {/* Year Selector */}
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:border-blue-300 transition-colors shadow-sm"
              >
                <span className="text-sm text-gray-500 whitespace-nowrap">Year</span>
                <span className="text-sm font-medium text-gray-900">{selectedYear}</span>
                <ChevronDown
                  size={16}
                  className={`text-blue-500 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}
                />
              </button>

              {showYearDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowYearDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[120px]">
                    {AVAILABLE_YEARS.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          void handleYearChange(year);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedYear === year
                            ? 'bg-gray-200 text-gray-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {year}
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
          )}
        </div>

        {/* Tasks Display */}
        {filter === 'firstWishes' ? (
          <div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">First Wishes</h3>
                </div>
                <button
                  onClick={() => setShowFirstWishModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}
                >
                  <Plus size={14} />
                  Add Wish
                </button>
              </div>
              <p className="text-sm text-gray-700">
                Wishlist of all the first things we want to do together.
              </p>
            </div>

            {firstWishes.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <p className="text-gray-500 text-lg mb-2">No first wishes yet</p>
                <p className="text-gray-400">Tap Add Wish to add your first wish together ✨</p>
              </div>
            ) : (
              <div className="space-y-3">
                {firstWishes.map((wish) => (
                  <div
                    key={wish.id}
                    className={`bg-white border rounded-xl p-4 flex items-center justify-between ${
                      wish.completed ? 'border-green-300' : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleFirstWish(wish.id)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      {wish.completed ? (
                        <CheckCircle2 size={20} className="text-green-500" />
                      ) : (
                        <Circle size={20} className="text-gray-400" />
                      )}
                      <span className={wish.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                        {wish.title}
                      </span>
                    </button>
                    <button
                      onClick={() => requestDeleteFirstWish(wish)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete first wish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : filter === null ? (
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
                onDelete={() => requestDeleteTask(task)}
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
                onDelete={() => requestDeleteTask(task)}
                onEdit={() => handleEditTask(task)}
                onViewDetails={() => setSelectedTask(task)}
                onCopyLink={handleShowCopyNotification}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Task Button */}
      {filter !== 'firstWishes' && (
        <button
          onClick={() => setIsTaskModalOpen(true)}
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
          className="fixed bottom-8 right-8 hover:brightness-110 text-white rounded-full p-4 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-lg"
          aria-label="Add new resolution"
        >
          <Plus size={28} />
        </button>
      )}

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

      {showFirstWishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowFirstWishModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Add First Wish</h3>
            <p className="text-sm text-gray-600 mb-4">What is the first thing we should do together?</p>
            <input
              autoFocus
              value={newFirstWishTitle}
              onChange={(e) => setNewFirstWishTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addFirstWish();
              }}
              placeholder="e.g. First sunrise trip together"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowFirstWishModal(false);
                  setNewFirstWishTitle('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addFirstWish}
                disabled={!newFirstWishTitle.trim()}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}
              >
                Add Wish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First Wish Delete Confirmation Modal */}
      {firstWishPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelDeleteFirstWish}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md p-6">
            <p className="text-gray-900 mb-6">
              Bbi không muốn <span className="font-semibold">{firstWishPendingDelete.title}</span> nữa shao?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelDeleteFirstWish}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFirstWish}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelDeleteTask}
          />
          <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete resolution?</h3>
            <p className="text-gray-900 mb-6">
              Bbi có chắc chắn muốn xóa <span className="font-semibold">{taskPendingDelete.title}</span> không?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelDeleteTask}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

