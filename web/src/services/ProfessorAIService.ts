import { API_BASE_URL } from "@/lib/config";

export interface AIAssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIAssistantMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIAction {
  type: string;
  name: string;
  description: string;
  icon?: string;
}

export interface AIAssistantResponse {
  response: string;
  suggestions?: Array<{ id: number; title: string; description: string; type: string }>;
  actions?: Array<{ type: string; data: any }>;
}

export interface CourseGenerationOptions {
  title?: string;
  subjectArea: string;
  educationLevel: string;
  academicTrack?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  focusAreas?: string[];
  includeAssessments?: boolean;
  duration?: string; // "semester", "year", "trimester"
}

export interface AssignmentGenerationOptions {
  courseId: number;
  title?: string;
  type: 'homework' | 'project' | 'quiz' | 'exam' | 'essay';
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  dueInDays?: number;
  includeRubric?: boolean;
  includeSolutions?: boolean;
  skillsToAssess?: string[];
  estimatedTimeMinutes?: number;
}

export interface GeneratedAssignment {
  id?: number;
  title: string;
  description: string;
  instructions: string;
  points_possible: number;
  due_date?: string;
  materials?: Record<string, any>;
  rubric?: Record<string, any>;
  solutions?: Record<string, any>;
}

export interface GeneratedCourse {
  id?: number;
  title: string;
  description: string;
  syllabus: Record<string, any>;
  learning_objectives: string[];
  topics: string[];
  assessments?: Record<string, any>[];
  materials?: Record<string, any>[];
}

// Helper type for authFetch from window
declare global {
  interface Window {
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  }
}

class ProfessorAIServiceClass {
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

  async getAvailableAIActions(): Promise<AIAction[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/actions`);

      if (!response.ok) {
        throw new Error('Failed to fetch AI actions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching AI actions:', error);
      throw error;
    }
  }

  async getAssistantConversations(): Promise<AIConversation[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/conversations`);

      if (!response.ok) {
        throw new Error('Failed to fetch AI conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching AI conversations:', error);
      throw error;
    }
  }

  async createAssistantConversation(title: string): Promise<AIConversation> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/conversations`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async sendAssistantMessage(conversationId: string, message: string): Promise<AIAssistantResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async generateCourse(options: CourseGenerationOptions): Promise<GeneratedCourse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/generate-course`, {
        method: 'POST',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to generate course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating course:', error);
      throw error;
    }
  }

  async generateAssignment(options: AssignmentGenerationOptions): Promise<GeneratedAssignment> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/generate-assignment`, {
        method: 'POST',
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to generate assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating assignment:', error);
      throw error;
    }
  }

  async feedbackOnMaterial(materialType: string, contentText: string, feedback: string): Promise<{
    improved_content: string;
    suggestions: string[];
  }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          material_type: materialType,
          content: contentText,
          feedback: feedback
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      throw error;
    }
  }

  async generateLessonPlan(courseId: number, topic: string, options: {
    duration_minutes: number;
    learning_objectives?: string[];
    include_activities?: boolean;
    include_resources?: boolean;
    difficulty?: string;
  }): Promise<any> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans/generate`, {
        method: 'POST',
        body: JSON.stringify({
          course_id: courseId,
          topic,
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      throw error;
    }
  }

  async saveGeneratedCourse(course: GeneratedCourse): Promise<GeneratedCourse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses`, {
        method: 'POST',
        body: JSON.stringify(course),
      });

      if (!response.ok) {
        throw new Error('Failed to save generated course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving generated course:', error);
      throw error;
    }
  }

  async saveGeneratedAssignment(courseId: number, assignment: GeneratedAssignment): Promise<GeneratedAssignment> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(assignment),
      });

      if (!response.ok) {
        throw new Error('Failed to save generated assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving generated assignment:', error);
      throw error;
    }
  }
}

export const ProfessorAIService = new ProfessorAIServiceClass();
