import { API_BASE_URL } from "@/lib/config";

export interface CoursePerformance {
  id: number;
  title: string;
  totalStudents: number;
  averageGrade: number;
  completionRate: number;
  engagementScore: number;
  difficultyRating: number;
  aiGeneratedImprovement: string;
}

export interface PerformanceByTopic {
  topic: string;
  score: number;
  difficulty: number;
  engagementLevel: number;
  timeSpent: number;
  improvementSuggestion?: string;
}

export interface StudentActivity {
  date: string;
  activeStudents: number;
  submissions: number;
  tutoringSessions: number;
}

export interface ProblemArea {
  id: number;
  title: string;
  category: string;
  affectedStudents: number;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

export interface LearningOutcome {
  id: string;
  name: string;
  achievementRate: number;
  targetRate: number;
}

export interface StrengthWeakness {
  strength: boolean;
  topic: string;
  details: string;
  students: number;
  impact: number;
}

export interface AIInsights {
  problemAreas?: ProblemArea[];
  topicSuggestions?: {
    topic: string;
    improvement: string;
  }[];
  engagementRecommendations?: string[];
  outcomeImprovements?: string[];
}

// Helper type for authFetch from window
declare global {
  interface Window {
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  }
}

class ProfessorAnalyticsServiceClass {
  // Helper method to get authFetch with fallback
  private getAuthFetch() {
    if (typeof window !== 'undefined' && window.authFetch) {
      return window.authFetch;
    }

    // Fallback to regular fetch with credentials if authFetch not available
    return (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      headers.set('Content-Type', 'application/json');

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    };
  }

  async getCourses(): Promise<{ courses: { id: number; title: string }[] }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async getCoursePerformance(courseId: number, timeRange: string): Promise<CoursePerformance[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/course-performance?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch course performance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course performance:', error);
      throw error;
    }
  }

  async getTopicPerformance(courseId: number, timeRange: string): Promise<PerformanceByTopic[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/topic-performance?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch topic performance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching topic performance:', error);
      throw error;
    }
  }

  async getStudentActivity(courseId: number, timeRange: string): Promise<StudentActivity[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/student-activity?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch student activity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching student activity:', error);
      throw error;
    }
  }

  async getProblemAreas(courseId: number, timeRange: string): Promise<ProblemArea[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/problem-areas?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch problem areas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching problem areas:', error);
      throw error;
    }
  }

  async getLearningOutcomes(courseId: number, timeRange: string): Promise<LearningOutcome[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/learning-outcomes?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch learning outcomes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching learning outcomes:', error);
      throw error;
    }
  }

  async getStrengthsWeaknesses(courseId: number, timeRange: string): Promise<StrengthWeakness[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/strengths-weaknesses?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch strengths and weaknesses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching strengths and weaknesses:', error);
      throw error;
    }
  }

  async generateAIInsights(courseId: number): Promise<AIInsights> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/generate-insights`,
        {
          method: 'POST',
          body: JSON.stringify({
            courseId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating AI insights:', error);
      throw error;
    }
  }

  async exportAnalytics(courseId: number, timeRange: string): Promise<string> {
    try {
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professors/analytics/export?courseId=${courseId}&timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const data = await response.json();
      return data.downloadUrl;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }
}

export const ProfessorAnalyticsService = new ProfessorAnalyticsServiceClass();
