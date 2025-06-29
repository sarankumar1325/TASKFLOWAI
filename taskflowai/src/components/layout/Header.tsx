import { UserButton, useUser } from '@clerk/clerk-react';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  Bot, 
  Sparkles,
  Plus
} from 'lucide-react';
import { useUIStore } from '../../store';
import { Button } from '../ui/Button';

export function Header() {
  const { user } = useUser();
  const { 
    toggleSidebar, 
    toggleAIChat, 
    openTaskModal,
    isAIChatOpen 
  } = useUIStore();
  
  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center px-6">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              TaskFlow AI
            </span>
          </div>
        </div>
        
        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Quick Add Task */}
          <Button
            size="sm"
            onClick={() => openTaskModal()}
            className="hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          
          <Button
            size="icon"
            onClick={() => openTaskModal()}
            className="sm:hidden"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* AI Chat Toggle */}
          <Button
            variant={isAIChatOpen ? "default" : "ghost"}
            size="icon"
            onClick={toggleAIChat}
            title="AI Assistant"
          >
            <Bot className="h-5 w-5" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" title="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
