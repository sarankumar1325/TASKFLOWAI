import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useTaskStore, useUIStore } from '../store';
import { socketService } from '../services/socket';
import { apiService } from '../services/api';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { TaskList } from '../components/tasks/TaskList';
import { TaskModal } from '../components/tasks/TaskModal';
import { ShareModal } from '../components/tasks/ShareModal';
import { AIChat } from '../components/ai/AIChat';
import { FilterBar } from '../components/tasks/FilterBar';
import { QuickActions } from '../components/dashboard/QuickActions';
import { StatsCards } from '../components/dashboard/StatsCards';
import toast from 'react-hot-toast';
import type { Task } from '../types';

export function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { 
    tasks, 
    filteredTasks, 
    isLoading, 
    setTasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    setLoading, 
    setError 
  } = useTaskStore();
  
  const { 
    isSidebarOpen, 
    isTaskModalOpen, 
    isShareModalOpen, 
    isAIChatOpen 
  } = useUIStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize data and socket connection
  useEffect(() => {
    if (!user || isInitialized) return;
    
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        
        // Set up API token getter for Clerk authentication
        apiService.setTokenGetter(getToken);
        
        // Fetch initial tasks
        const response = await apiService.getTasks();
        if (response.success && response.data) {
          setTasks(response.data);
        }
        
        // Connect to socket for real-time updates
        socketService.connect(user.id);
        
        // Set up socket event listeners
        socketService.onTaskCreated((task: Task) => {
          addTask(task);
        });
        
        socketService.onTaskUpdated((task: Task) => {
          updateTask(task._id, task);
        });
        
        socketService.onTaskDeleted((taskId: string) => {
          deleteTask(taskId);
        });
        
        socketService.onTaskShared((data) => {
        });
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [user, isInitialized, setTasks, addTask, updateTask, deleteTask, setLoading, setError, getToken]);
  
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'w-64' : 'w-0'} 
          transition-all duration-300 overflow-hidden bg-card border-r border-border
        `}>
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Cards */}
          <div className="p-6 border-b border-border">
            <StatsCards tasks={tasks} />
          </div>
          
          {/* Quick Actions */}
          <div className="p-6 border-b border-border">
            <QuickActions />
          </div>
          
          {/* Filter Bar */}
          <div className="p-6 border-b border-border">
            <FilterBar />
          </div>
          
          {/* Task List */}
          <div className="flex-1 overflow-auto p-6">
            <TaskList tasks={filteredTasks} isLoading={isLoading} />
          </div>
        </div>
        
        {/* AI Chat Sidebar */}
        {isAIChatOpen && (
          <div className={
            `w-80 transition-all duration-300 overflow-hidden bg-card border-l border-border`
          }>
            <AIChat />
          </div>
        )}
      </div>
      
      {/* Modals */}
      {isTaskModalOpen && <TaskModal />}
      {isShareModalOpen && <ShareModal />}
    </div>
  );
}
