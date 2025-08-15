import { API_BASE_URL } from './apiClient';

export interface HealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  error?: string;
}

class BackendHealthService {
  private healthStatus: HealthStatus = {
    isHealthy: false,
    lastChecked: new Date(),
  };
  
  private listeners: ((status: HealthStatus) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 10;
  private baseDelay = 1000; // Start with 1 second
  
  constructor() {
    // Start checking immediately
    this.startHealthCheck();
  }
  
  private async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
  
  private async performHealthCheck() {
    const isHealthy = await this.checkHealth();
    
    this.healthStatus = {
      isHealthy,
      lastChecked: new Date(),
      error: isHealthy ? undefined : 'Backend connection failed',
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.healthStatus));
    
    if (isHealthy) {
      this.retryCount = 0;
      // Once healthy, check every 30 seconds
      this.scheduleNextCheck(30000);
    } else {
      // Exponential backoff with max delay of 30 seconds
      const delay = Math.min(this.baseDelay * Math.pow(2, this.retryCount), 30000);
      this.retryCount = Math.min(this.retryCount + 1, this.maxRetries);
      this.scheduleNextCheck(delay);
    }
  }
  
  private scheduleNextCheck(delay: number) {
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
    }
    this.checkInterval = setTimeout(() => this.performHealthCheck(), delay);
  }
  
  private startHealthCheck() {
    this.performHealthCheck();
  }
  
  public getStatus(): HealthStatus {
    return { ...this.healthStatus };
  }
  
  public isHealthy(): boolean {
    return this.healthStatus.isHealthy;
  }
  
  public subscribe(listener: (status: HealthStatus) => void): () => void {
    this.listeners.push(listener);
    // Immediately notify with current status
    listener(this.healthStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  public async waitForHealthy(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.healthStatus.isHealthy) {
        return true;
      }
      
      // Check health immediately
      await this.performHealthCheck();
      
      if (this.healthStatus.isHealthy) {
        return true;
      }
      
      // Wait a bit before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }
  
  public destroy() {
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const backendHealthService = new BackendHealthService();