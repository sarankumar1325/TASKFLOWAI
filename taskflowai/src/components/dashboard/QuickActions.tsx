import { Button } from '../ui/Button';
import { Plus, MessageCircle } from 'lucide-react';
import { useUIStore } from '../../store';

export function QuickActions() {
  const { openTaskModal, openAIChat } = useUIStore();
  
  return (
    <div className="flex items-center space-x-3">
      <h3 className="text-sm font-medium text-muted-foreground">Quick Actions:</h3>
      
      <Button size="sm" onClick={() => openTaskModal()}>
        <Plus className="h-4 w-4 mr-2" />
        New Task
      </Button>
      
      <Button variant="outline" size="sm" onClick={() => openAIChat()}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat with your Notes/Todos
      </Button>
    </div>
  );
}
