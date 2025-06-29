import { 
  Home, 
  CheckSquare, 
  Clock, 
  Users, 
  Archive, 
  Settings,
  BarChart3,
  Tag,
  Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store';
import { Button } from '../ui/Button';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: CheckSquare, label: 'All Tasks', href: '/dashboard?filter=all' },
  { icon: Clock, label: 'Today', href: '/dashboard?filter=today' },
  { icon: Calendar, label: 'This Week', href: '/dashboard?filter=week' },
  { icon: Users, label: 'Shared', href: '/dashboard?filter=shared' },
  { icon: Archive, label: 'Archived', href: '/dashboard?filter=archived' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { tasks } = useTaskStore();
  
  // Calculate counts for different categories
  const counts = {
    all: tasks.length,
    today: tasks.filter(task => {
      if (!task.dueDate) return false;
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === today.toDateString();
    }).length,
    week: tasks.filter(task => {
      if (!task.dueDate) return false;
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= weekFromNow;
    }).length,
    shared: tasks.filter(task => task.sharedWith.length > 0).length,
    archived: tasks.filter(task => task.isArchived).length,
  };
  
  // Get unique categories from tasks
  const categories = Array.from(new Set(
    tasks.map(task => task.category).filter(Boolean)
  ));
  
  return (
    <div className="h-full flex flex-col">
      {/* Navigation Menu */}
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href.includes('?') && location.search.includes(item.href.split('?')[1]));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {/* Show counts for relevant items */}
                {item.label === 'All Tasks' && counts.all > 0 && (
                  <span className="ml-auto bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                    {counts.all}
                  </span>
                )}
                {item.label === 'Today' && counts.today > 0 && (
                  <span className="ml-auto bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.today}
                  </span>
                )}
                {item.label === 'This Week' && counts.week > 0 && (
                  <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.week}
                  </span>
                )}
                {item.label === 'Shared' && counts.shared > 0 && (
                  <span className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.shared}
                  </span>
                )}
                {item.label === 'Archived' && counts.archived > 0 && (
                  <span className="ml-auto bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.archived}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Tag className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {categories.slice(0, 5).map((category) => {
              const categoryTasks = tasks.filter(task => task.category === category);
              return (
                <Link
                  key={category}
                  to={`/dashboard?category=${encodeURIComponent(category!)}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <span className="truncate">{category}</span>
                  <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                    {categoryTasks.length}
                  </span>
                </Link>
              );
            })}
            {categories.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                View all categories
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="bg-muted rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">Quick Stats</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Tasks</span>
              <span>{tasks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed</span>
              <span>{tasks.filter(task => task.status === 'completed').length}</span>
            </div>
            <div className="flex justify-between">
              <span>In Progress</span>
              <span>{tasks.filter(task => task.status === 'in-progress').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
