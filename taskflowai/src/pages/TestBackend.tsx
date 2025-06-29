import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const TestBackend: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [healthData, setHealthData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testBackendConnection = async () => {
    setBackendStatus('loading');
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHealthData(data);
      setBackendStatus('connected');
    } catch (err: any) {
      setError(err.message);
      setBackendStatus('error');
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Backend Connection Test</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Backend Health Status</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500' :
                backendStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <span className="font-medium">
                {backendStatus === 'connected' ? 'Connected' :
                 backendStatus === 'error' ? 'Error' : 'Loading...'}
              </span>
            </div>

            <Button 
              onClick={testBackendConnection}
              disabled={backendStatus === 'loading'}
              className="mb-4"
            >
              {backendStatus === 'loading' ? 'Testing...' : 'Test Connection'}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-800 mb-2">Connection Error:</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {healthData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Backend Response:</h3>
                <pre className="text-sm text-green-700 overflow-auto">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Health Check:</span>
                <span className="font-mono">GET /health</span>
              </div>
              <div className="flex justify-between">
                <span>Authentication:</span>
                <span className="font-mono">POST /api/auth/*</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks:</span>
                <span className="font-mono">GET/POST/PUT/DELETE /api/tasks/*</span>
              </div>
              <div className="flex justify-between">
                <span>Users:</span>
                <span className="font-mono">GET /api/users/*</span>
              </div>
              <div className="flex justify-between">
                <span>AI:</span>
                <span className="font-mono">POST /api/ai/*</span>
              </div>
              <div className="flex justify-between">
                <span>Analytics:</span>
                <span className="font-mono">GET /api/analytics/*</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">MongoDB Atlas Connection:</h3>
              <p className="text-yellow-700 mb-2">
                The backend is running but MongoDB connection may need IP whitelisting.
              </p>
              <div className="text-sm text-yellow-600">
                <p><strong>Steps to fix:</strong></p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to <a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">MongoDB Atlas</a></li>
                  <li>Navigate to Network Access → IP Access List</li>
                  <li>Click "Add IP Address"</li>
                  <li>Add your current IP or use 0.0.0.0/0 for development</li>
                  <li>Wait for the changes to take effect (1-2 minutes)</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Frontend URL:</span>
                <span className="font-mono">http://localhost:5175</span>
              </div>
              <div className="flex justify-between">
                <span>Backend URL:</span>
                <span className="font-mono">http://localhost:5000</span>
              </div>
              <div className="flex justify-between">
                <span>API Base URL:</span>
                <span className="font-mono">{import.meta.env.VITE_API_URL || 'Not configured'}</span>
              </div>
              <div className="flex justify-between">
                <span>Socket URL:</span>
                <span className="font-mono">{import.meta.env.VITE_SOCKET_URL || 'Not configured'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestBackend;
