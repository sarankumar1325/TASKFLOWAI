import { io, Socket } from 'socket.io-client';
import type { Task } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  
  connect(userId?: string): void {
    if (this.connected) return;
    
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: localStorage.getItem('auth_token'),
        userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
  
  // Task-related events
  onTaskCreated(callback: (task: Task) => void): void {
    this.socket?.on('task:created', callback);
  }
  
  onTaskUpdated(callback: (task: Task) => void): void {
    this.socket?.on('task:updated', callback);
  }
  
  onTaskDeleted(callback: (taskId: string) => void): void {
    this.socket?.on('task:deleted', callback);
  }
  
  onTaskShared(callback: (data: { taskId: string; sharedWith: string }) => void): void {
    this.socket?.on('task:shared', callback);
  }
  
  // User presence events
  onUserOnline(callback: (userId: string) => void): void {
    this.socket?.on('user:online', callback);
  }
  
  onUserOffline(callback: (userId: string) => void): void {
    this.socket?.on('user:offline', callback);
  }
  
  // Emit events
  joinTaskRoom(taskId: string): void {
    this.socket?.emit('join:task', taskId);
  }
  
  leaveTaskRoom(taskId: string): void {
    this.socket?.emit('leave:task', taskId);
  }
  
  emitTaskUpdate(taskId: string, updates: Partial<Task>): void {
    this.socket?.emit('task:update', { taskId, updates });
  }
  
  emitTyping(taskId: string, isTyping: boolean): void {
    this.socket?.emit('task:typing', { taskId, isTyping });
  }
  
  // Generic event listeners
  on(event: string, callback: (...args: unknown[]) => void): void {
    this.socket?.on(event, callback);
  }
  
  off(event: string, callback?: (...args: unknown[]) => void): void {
    this.socket?.off(event, callback);
  }
  
  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }
  
  // Utility methods
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
  
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
  
  // Cleanup method to remove all listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

// Create and export singleton instance
export const socketService = new SocketService();
