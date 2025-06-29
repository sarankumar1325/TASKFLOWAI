import { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  User, 
  MoreHorizontal,
  Calendar,
  Tag,
  AlertCircle
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { cn } from '../../lib/utils';
import { useTaskStore, useUIStore } from '../../store';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { Task } from '../../types';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

interface TaskItemProps {
  task: Task;
}

function TaskItem({ task }: TaskItemProps) {
  const { updateTask } = useTaskStore();
  const { openTaskModal, openShareModal } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleStatus = () => {
    const newStatus = task.status === 'completed' 
      ? 'todo' 
      : task.status === 'todo' 
        ? 'in-progress' 
        : 'completed';
    updateTask(task._id, { status: newStatus });
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-950';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-950';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  
  return (
    <Card className={cn(
      "p-4 transition-all duration-200 hover:shadow-md",
      task.status === 'completed' && "opacity-75",
      isOverdue && "border-red-200 dark:border-red-800"
    )}>
      <div className="flex items-start space-x-3">
        {/* Status Icon */}
        <button
          onClick={toggleStatus}
          className="mt-0.5 transition-transform hover:scale-110"
        >
          {getStatusIcon()}
        </button>
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 
                className={cn(
                  "font-medium text-foreground cursor-pointer hover:text-primary",
                  task.status === 'completed' && "line-through text-muted-foreground"
                )}
                onClick={() => openTaskModal(task._id)}
              >
                {task.title}
              </h3>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              {/* Task Meta */}
              <div className="flex items-center space-x-4 mt-2">
                {/* Priority */}
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  getPriorityColor(task.priority)
                )}>
                  {task.priority}
                </span>
                
                {/* Due Date */}
                {task.dueDate && (
                  <div className={cn(
                    "flex items-center space-x-1 text-xs",
                    isOverdue ? "text-red-500" : isDueToday ? "text-orange-500" : "text-muted-foreground"
                  )}>
                    <Calendar className="h-3 w-3" />
                    <span>
                      {isToday(new Date(task.dueDate)) 
                        ? 'Today' 
                        : format(new Date(task.dueDate), 'MMM d')
                      }
                    </span>
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                  </div>
                )}
                
                {/* Category */}
                {task.category && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span>{task.category}</span>
                  </div>
                )}
                
                {/* Assigned To */}
                {task.assignedTo && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{task.assignedTo}</span>
                  </div>
                )}
                
                {/* Shared indicator */}
                {task.sharedWith.length > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{task.sharedWith.length} shared</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{task.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              
              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-10 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[150px]">
                  <button
                    onClick={() => {
                      openTaskModal(task._id);
                      setIsMenuOpen(false);
                    }}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      openShareModal(task._id);
                      setIsMenuOpen(false);
                    }}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      updateTask(task._id, { isArchived: !task.isArchived });
                      setIsMenuOpen(false);
                    }}
                    className="block px-3 py-2 text-sm text-foreground hover:bg-accent w-full text-left"
                  >
                    {task.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => {
                      // Handle delete
                      setIsMenuOpen(false);
                    }}
                    className="block px-3 py-2 text-sm text-red-600 hover:bg-accent w-full text-left"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TaskList({ tasks, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
        <p className="text-muted-foreground mb-4">
          Get started by creating your first task.
        </p>
        <Button onClick={() => useUIStore.getState().openTaskModal()}>
          Create Task
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 group">
      {tasks.map((task) => (
        <div key={task._id} className="group">
          <TaskItem task={task} />
        </div>
      ))}
    </div>
  );
}
