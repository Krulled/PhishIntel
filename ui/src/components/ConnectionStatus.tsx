import React, { useEffect, useState } from 'react';
import { backendHealthService, type HealthStatus } from '../services/backendHealth';

export const ConnectionStatus: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(
    backendHealthService.getStatus()
  );
  
  useEffect(() => {
    // Subscribe to health status updates
    const unsubscribe = backendHealthService.subscribe(setHealthStatus);
    return unsubscribe;
  }, []);
  
  if (healthStatus.isHealthy) {
    return null; // Don't show anything when connected
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            Connecting to backend...
          </span>
          <span className="text-xs opacity-75">
            {healthStatus.error || 'Please wait while we establish connection'}
          </span>
        </div>
      </div>
    </div>
  );
};