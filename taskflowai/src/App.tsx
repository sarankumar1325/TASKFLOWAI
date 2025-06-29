import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { useSettingsStore } from './store';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import './App.css';

function App() {
  const { settings } = useSettingsStore();
  
  useEffect(() => {
    // Apply theme to document
    if (settings.theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme.mode]);
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Router>
        {/* Header with Clerk authentication */}
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-primary">TaskFlow AI</h1>
              </div>
              <nav className="flex items-center space-x-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </nav>
            </div>
          </div>
        </header>

        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<Landing />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <SignedIn>
                <Settings />
              </SignedIn>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <SignedIn>
                <Analytics />
              </SignedIn>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            style: {
              border: '1px solid #10b981',
            },
          },
          error: {
            style: {
              border: '1px solid #ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
