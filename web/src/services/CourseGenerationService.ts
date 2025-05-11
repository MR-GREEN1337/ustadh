import { API_BASE_URL } from "@/lib/config";

export interface GenerationSession {
  id: string;
  subject: string;
  educationLevel: string;
  duration: string;
  status: 'created' | 'brainstorming' | 'structuring' | 'detailing' | 'finalizing' | 'complete' | 'error';
  progress: number;
  createdAt: string;
  title?: string;
  description?: string;
  lastModified?: string;
  difficulty?: string;
  language?: string;
}

export interface DetailedSession extends GenerationSession {
  currentStep?: string;
  courseData?: any;
  messages?: any[];
  error?: string;
  preferences?: any;
}

export interface CreateSessionRequest {
  subject_area: string;
  education_level: string;
  course_duration: string;
  difficulty_level?: string;
  key_topics?: string;
  include_assessments?: boolean;
  include_project_ideas?: boolean;
  teaching_materials?: boolean;
  additional_context?: string;
}

// Get authFetch from window or fallback
const getAuthFetch = () => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.authFetch) {
    // @ts-ignore
    return window.authFetch;
  }

  // Fallback implementation
  return async (...args: Parameters<typeof fetch>) => {
    const token = localStorage.getItem('access_token');
    const [url, init = {}] = args;

    const headers = new Headers(init.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...init,
      headers,
      credentials: 'include'
    });
  };
};

class CourseGenerationService {
  private authFetch = getAuthFetch();

  async getSessions(status?: string, limit = 20, offset = 0): Promise<GenerationSession[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const url = `${API_BASE_URL}/api/v1/course-generator/sessions?${params.toString()}`;
      const response = await this.authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<DetailedSession> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.sessionId,
        subject: data.subject,
        educationLevel: data.educationLevel,
        duration: data.duration,
        status: data.status,
        progress: data.progress,
        createdAt: data.createdAt,
        title: data.courseData?.title,
        description: data.courseData?.description,
        lastModified: data.updatedAt,
        difficulty: data.difficulty,
        language: data.language,
        currentStep: data.currentStep,
        courseData: data.courseData,
        messages: data.messages,
        error: data.error,
        preferences: data.preferences,
      };
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  async createSession(request: CreateSessionRequest): Promise<{ sessionId: string }> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      return { sessionId: data.sessionId };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async duplicateSession(sessionId: string): Promise<{ sessionId: string }> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to duplicate session: ${response.statusText}`);
      }

      const data = await response.json();
      return { sessionId: data.sessionId };
    } catch (error) {
      console.error('Error duplicating session:', error);
      throw error;
    }
  }

  async startSession(sessionId: string): Promise<void> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  async saveCourse(sessionId: string): Promise<{ courseId: number }> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/save`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to save course: ${response.statusText}`);
      }

      const data = await response.json();
      return { courseId: data.id };
    } catch (error) {
      console.error('Error saving course:', error);
      throw error;
    }
  }


  async exportToCourse(sessionId: string): Promise<{
    courseId: number;
    title: string;
    code: string;
    courseUrl: string;
    status: string;
  }> {
    try {
      const response = await this.authFetch(
        `${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/export-to-course`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to export course: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        courseId: data.course_id,
        title: data.title,
        code: data.code,
        courseUrl: data.course_url,
        status: data.status
      };
    } catch (error) {
      console.error('Error exporting to course:', error);
      throw error;
    }
  }

  async getExportStatus(sessionId: string): Promise<{
    exported: boolean;
    courseId: number | null;
    courseUrl: string | null;
    exportedAt?: string;
    courseTitle?: string;
    courseCode?: string;
    courseStatus?: string;
  }> {
    try {
      const response = await this.authFetch(
        `${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/export-status`
      );

      if (!response.ok) {
        throw new Error(`Failed to get export status: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting export status:', error);
      throw error;
    }
  }
}

export const courseGenerationService = new CourseGenerationService();
export default courseGenerationService;
