// Backend API integration for live DVSA data
import axios from 'axios';

class DVSlotBackendAPI {
  private baseURL: string;
  
  constructor() {
    // Use deployed backend URL or fallback to local development
    this.baseURL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  async getBackendHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return {
        success: true,
        data: response.data,
        message: 'Backend is healthy'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getScrapingStats() {
    try {
      const response = await axios.get(`${this.baseURL}/api/stats`);
      return {
        success: true,
        data: response.data,
        message: 'Statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async triggerManualScrape() {
    try {
      const response = await axios.post(`${this.baseURL}/api/scrape`);
      return {
        success: true,
        data: response.data,
        message: 'Manual scraping triggered successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if backend is available, fallback to Supabase direct if not
  async isBackendAvailable(): Promise<boolean> {
    const health = await this.getBackendHealth();
    return health.success;
  }
}

export const backendApi = new DVSlotBackendAPI();
