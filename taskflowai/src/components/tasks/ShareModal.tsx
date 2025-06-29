import React, { useState } from 'react';
import { X, Share2, Mail, Copy, Check, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useTaskStore } from '../../store';
import type { Task } from '../../types';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, task }) => {
  const { updateTask } = useTaskStore();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // Update task with new collaborator
      const updatedSharedWith = [...(task.sharedWith || []), email];
      await updateTask(task._id, { sharedWith: updatedSharedWith });
      toast.success('Task shared successfully');
      setEmail('');
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Failed to share task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const shareLink = `${window.location.origin}/tasks/${task._id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleRemoveAccess = async (userId: string) => {
    try {
      const updatedSharedWith = (task.sharedWith || []).filter(id => id !== userId);
      await updateTask(task._id, { sharedWith: updatedSharedWith });
      toast.success('Access removed');
    } catch (err) {
      console.error('Remove access error:', err);
      toast.error('Failed to remove access');
    }
  };

  const handleUpdatePermission = async (userId: string, newPermission: 'view' | 'edit') => {
    try {
      // In a real implementation, you would update user permissions
      toast.success('Permission updated');
    } catch (err) {
      console.error('Update permission error:', err);
      toast.error('Failed to update permission');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <Card className="relative w-full max-w-lg bg-white dark:bg-gray-800 m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Task
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
            )}
          </div>

          {/* Share via Email */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Share via Email
            </h4>
            <form onSubmit={handleShare} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Email address to share with"
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Permission level"
                >
                  <option value="view">Can View</option>
                  <option value="edit">Can Edit</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isLoading ? 'Sharing...' : 'Share Task'}
              </Button>
            </form>
          </div>

          {/* Share Link */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Share Link
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/tasks/${task._id}`}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                aria-label="Shareable task link"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="px-3 flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Anyone with this link can view the task
            </p>
          </div>

          {/* Current Collaborators */}
          {task.sharedWith && task.sharedWith.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Current Collaborators
              </h4>
              <div className="space-y-2">
                {task.sharedWith.map((collaborator, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {collaborator.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {collaborator}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Can view and edit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue="edit"
                        onChange={(e) => handleUpdatePermission(collaborator, e.target.value as 'view' | 'edit')}
                        className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        aria-label={`Permission for ${collaborator}`}
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                      <Button
                        onClick={() => handleRemoveAccess(collaborator)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 px-2"
                        aria-label={`Remove access for ${collaborator}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Privacy:</strong> Shared tasks are visible to all collaborators. 
              Users with edit permissions can modify the task content and sharing settings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
