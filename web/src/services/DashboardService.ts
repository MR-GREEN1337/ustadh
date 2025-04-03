// services/DashboardService.ts

import { API_BASE_URL } from "@/lib/config";

// Export as a class/object to match your component import
export class DashboardService {
  /**
   * Fetch comprehensive dashboard data including user, subjects, recommendations, etc.
   */
  static async fetchDashboardData() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/dashboard/summary`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      throw error;
    }
  }

  /**
   * Fetch user data including profile information
   */
  static async fetchUserData() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/auth/me`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  /**
   * Fetch personalized recommendations for the current user
   */
  static async fetchRecommendations() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/recommendations`);
      if (!response.ok) {
        // Handle 404 specially - it might just mean no recommendations
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      // Return empty array rather than throwing to handle gracefully
      return [];
    }
  }

  /**
   * Fetch all subjects the user is enrolled in
   */
  static async fetchSubjects() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/enrolled`);
      if (!response.ok) {
        // Handle 404 specially - it might just mean no subjects enrolled
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching subjects:", error);
      // Return empty array rather than throwing to handle gracefully
      return [];
    }
  }

  /**
   * Fetch progress summary for user
   */
  static async fetchProgressSummary() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/progress/summary`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching progress summary:", error);
      throw error;
    }
  }

  /**
   * Start a new learning session
   */
  static async startLearningSession(sessionType: string, subjectId?: number, topicId?: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionType,
          subjectId,
          topicId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to start learning session:", error);
      throw error;
    }
  }

  /**
   * Update session progress
   */
  static async updateSessionProgress(sessionId: string, progressData: any) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating session progress:", error);
      throw error;
    }
  }

  /**
   * End a learning session
   */
  static async endLearningSession(sessionId: string, sessionData: any) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error ending learning session:", error);
      throw error;
    }
  }

  /**
   * Fetch user activities
   */
  static async fetchActivities(limit: number = 5) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/activities?limit=${limit}`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  }
}

export default DashboardService;
