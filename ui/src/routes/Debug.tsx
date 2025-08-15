import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../services/apiClient';
import { backendHealthService } from '../services/backendHealth';

export default function Debug() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});
  
  useEffect(() => {
    // Test direct health endpoint
    testHealthEndpoint();
    
    // Subscribe to health service
    const unsubscribe = backendHealthService.subscribe(setHealthStatus);
    return unsubscribe;
  }, []);
  
  const testHealthEndpoint = async () => {
    const results: any = {};
    
    // Test configured URL
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      results.configuredUrl = {
        url: `${API_BASE_URL}/api/health`,
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : null
      };
    } catch (error: any) {
      results.configuredUrl = {
        url: `${API_BASE_URL}/api/health`,
        error: error.message
      };
    }
    
    // Test common backend URLs
    const testUrls = [
      'https://phish-intel.onrender.com',
      'https://phishintel-backend.onrender.com',
      'https://phish-intel-backend.onrender.com',
      'http://localhost:5000'
    ];
    
    for (const baseUrl of testUrls) {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        results[baseUrl] = {
          status: response.status,
          ok: response.ok
        };
      } catch (error: any) {
        results[baseUrl] = {
          error: error.message
        };
      }
    }
    
    setTestResults(results);
  };
  
  return (
    <main className="min-h-screen bg-[#0b0e16] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Backend Connection Debug</h1>
        
        <div className="space-y-6">
          <section className="bg-black/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                API_BASE_URL,
                VITE_API_URL: import.meta.env.VITE_API_URL || 'not set',
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                isProduction: window.location.hostname.includes('vercel.app')
              }, null, 2)}
            </pre>
          </section>
          
          <section className="bg-black/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Health Service Status</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          </section>
          
          <section className="bg-black/30 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Backend Test Results</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </section>
          
          <button 
            onClick={testHealthEndpoint}
            className="bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600"
          >
            Retest Backends
          </button>
        </div>
      </div>
    </main>
  );
}