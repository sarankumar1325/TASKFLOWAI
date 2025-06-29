import { UserProfile } from '@clerk/clerk-react';
import { useSettingsStore } from '../store';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Button } from '../components/ui/Button';
import { Moon, Sun, Bell, Mail, Smartphone } from 'lucide-react';

export function Settings() {
  const { settings, updateSettings, toggleTheme } = useSettingsStore();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <div className="grid gap-6">
          {/* Theme Settings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  {settings.theme.mode === 'dark' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                  <span>Appearance</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Customize how the app looks on your device.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dark Mode</span>
              <Switch
                checked={settings.theme.mode === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </Card>
          
          {/* Notification Settings */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2 mb-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose how you want to be notified about updates.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email Notifications</span>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, email: checked }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Push Notifications</span>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, push: checked }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Due Date Reminders</span>
                </div>
                <Switch
                  checked={settings.notifications.dueDateReminders}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: { ...settings.notifications, dueDateReminders: checked }
                    })
                  }
                />
              </div>
            </div>
          </Card>
          
          {/* Task Defaults */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Task Defaults</h3>
              <p className="text-sm text-muted-foreground">
                Set default values for new tasks.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Priority</label>
                <select
                  value={settings.defaultPriority}
                  onChange={(e) =>
                    updateSettings({
                      defaultPriority: e.target.value as 'low' | 'medium' | 'high'
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Default Category</label>
                <input
                  type="text"
                  value={settings.defaultCategory}
                  onChange={(e) =>
                    updateSettings({ defaultCategory: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter default category"
                />
              </div>
            </div>
          </Card>
          
          {/* Account Settings */}
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Account</h3>
              <p className="text-sm text-muted-foreground">
                Manage your account information and security.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <UserProfile />
            </div>
          </Card>
          
          {/* Danger Zone */}
          <Card className="p-6 border-red-200 dark:border-red-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground">
                Irreversible and destructive actions.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button variant="destructive" size="sm">
                Delete All Completed Tasks
              </Button>
              <Button variant="destructive" size="sm">
                Export Data and Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
