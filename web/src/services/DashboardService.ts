import { API_BASE_URL } from "@/lib/config";

// Memoization cache with expiration times
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MemoizationCache {
  private cache: Record<string, CacheEntry<any>> = {};

  // Default cache duration of 5 minutes in milliseconds
  private defaultTTL = 5 * 60 * 1000;

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): T {
    const now = Date.now();
    this.cache[key] = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };
    return data;
  }

  get<T>(key: string): T | null {
    const entry = this.cache[key];
    const now = Date.now();

    // Return null if no entry or entry has expired
    if (!entry || entry.expiresAt < now) {
      return null;
    }

    return entry.data;
  }

  clear(keyPrefix?: string): void {
    if (keyPrefix) {
      // Clear only entries with the given prefix
      Object.keys(this.cache).forEach(key => {
        if (key.startsWith(keyPrefix)) {
          delete this.cache[key];
        }
      });
    } else {
      // Clear the entire cache
      this.cache = {};
    }
  }

  // Invalidate all cache entries related to sessions
  invalidateSessionCache(): void {
    this.clear('sessions');
  }

  // Invalidate all cache entries related to user data
  invalidateUserCache(): void {
    this.clear('user');
    this.clear('dashboard');
    this.clear('recommendations');
    this.clear('subjects');
    this.clear('progress');
    this.clear('activities');
  }
}

// Create a singleton instance of the cache
const memoCache = new MemoizationCache();

// Export as a class/object to match your component import
export class DashboardService {
  /**
   * Fetch comprehensive dashboard data including user, subjects, recommendations, etc.
   * Memoized with a 2-minute TTL
   */
  static async fetchDashboardData() {
    const cacheKey = 'dashboard:summary';
    const cachedData = memoCache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/dashboard/summary`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return memoCache.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes TTL
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      throw error;
    }
  }

  /**
   * Fetch user data including profile information
   * Memoized with a 5-minute TTL
   */
  static async fetchUserData() {
    const cacheKey = 'user:profile';
    const cachedData = memoCache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/auth/me`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return memoCache.set(cacheKey, data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  /**
   * Fetch personalized recommendations for the current user
   * Memoized with a 10-minute TTL (recommendations change less frequently)
   */
  static async fetchRecommendations() {
    const cacheKey = 'recommendations:list';
    const cachedData = memoCache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/recommendations`);
      if (!response.ok) {
        // Handle 404 specially - it might just mean no recommendations
        if (response.status === 404) {
          return memoCache.set(cacheKey, [], 10 * 60 * 1000);
        }
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return memoCache.set(cacheKey, data, 10 * 60 * 1000);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      // Return empty array rather than throwing to handle gracefully
      return [];
    }
  }

  /**
   * Fetch all subjects the user is enrolled in
   * Memoized with a 10-minute TTL (subjects change less frequently)
   */
  static async fetchSubjects() {
    const cacheKey = 'subjects:enrolled';
    const cachedData = memoCache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/enrolled`);
      if (!response.ok) {
        // Handle 404 specially - it might just mean no subjects enrolled
        if (response.status === 404) {
          return memoCache.set(cacheKey, [], 10 * 60 * 1000);
        }
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return memoCache.set(cacheKey, data, 10 * 60 * 1000);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      // Return empty array rather than throwing to handle gracefully
      return [];
    }
  }

  /**
   * Fetch progress summary for user
   * Memoized with a 5-minute TTL
   */
  static async fetchProgressSummary() {
    const cacheKey = 'progress:summary';
    const cachedData = memoCache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/progress/summary`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return memoCache.set(cacheKey, data);
    } catch (error) {
      console.error("Error fetching progress summary:", error);
      throw error;
    }
  }

  /**
   * Start a new learning session
   * Not memoized as this is a write operation
   * But invalidates related caches since state has changed
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

      const data = await response.json();

      // Invalidate relevant caches when starting a new session
      memoCache.invalidateSessionCache();

      return data;
    } catch (error) {
      console.error("Failed to start learning session:", error);
      throw error;
    }
  }

  /**
   * Update session progress
   * Not memoized as this is a write operation
   * But invalidates related caches since state has changed
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

      const data = await response.json();

      // Invalidate progress cache when updating progress
      memoCache.clear('progress');

      return data;
    } catch (error) {
      console.error("Error updating session progress:", error);
      throw error;
    }
  }

  /**
   * End a learning session
   * Not memoized as this is a write operation
   * But invalidates many caches since state has significantly changed
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

      const data = await response.json();

      // When a session ends, invalidate all user-related caches
      // as progress, recommendations, etc. may all have changed
      memoCache.invalidateUserCache();

      return data;
    } catch (error) {
      console.error("Error ending learning session:", error);
      throw error;
    }
  }

  /**
   * Fetch user activities
   * Memoized with a short 1-minute TTL since activities update frequently
   */
  static async fetchActivities(limit: number = 5) {
    const cacheKey = `activities:list:${limit}`;
    const cachedData = memoCache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/activities?limit=${limit}`);
      if (!response.ok) {
        if (response.status === 404) {
          return memoCache.set(cacheKey, [], 60 * 1000); // 1 minute TTL
        }
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return memoCache.set(cacheKey, data, 60 * 1000); // 1 minute TTL
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  }

  /**
   * Force refresh of cached data
   * Useful when you need to ensure you have the latest data
   */
  static refreshCache(specific?: string) {
    if (specific) {
      memoCache.clear(specific);
    } else {
      memoCache.clear();
    }
  }
}

export default DashboardService;
