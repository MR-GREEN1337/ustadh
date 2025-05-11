import { API_BASE_URL } from "@/lib/config";

export interface AIAssistantMessage {
  role: 'user' | 'assistant' | 'system';
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

export interface AIAnalysis {
  id: string;
  topic: string;
  strength: number;
  weakness: number;
  confusion_points: string[];
  recommended_resources: {
    title: string;
    description: string;
    relevance: number;
  }[];
  suggested_classroom_activities: string[];
}

export interface EnhancementSuggestion {
  id: string;
  title: string;
  description: string;
  type: "material" | "assignment" | "activity";
  generated_content: string;
  relevance: number;
}

export interface TopicCluster {
  id: string;
  name: string;
  count: number;
  difficulty: number;
  color: string;
}

export interface VisualizationDataResponse {
  points: Array<{
    id: string;
    cluster_id: string;
    x: number;
    y: number;
    z: number;
    label: string;
    color: string;
  }>;
  centers: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    color: string;
  }>;
  clusters: TopicCluster[];
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

  // New functions to support streaming assistant chat

  /**
   * Get assistant sessions with pagination
   * @param limit Maximum number of sessions to return
   * @param offset Offset for pagination
   * @returns List of assistant sessions
   */
  async getAssistantSessions(limit: number = 10, offset: number = 0): Promise<{
    sessions: any[];
    total: number;
  }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/professors/ai/assistant/sessions?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get assistant sessions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getAssistantSessions:", error);
      return { sessions: [], total: 0 };
    }
  }

  /**
   * Initialize a new assistant session
   * @param params Session parameters
   * @returns Created session
   */
  async initializeAssistantSession(params: {
    session_id: string;
    title: string;
    new_session: boolean;
  }): Promise<any> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/assistant/sessions`, {
        method: "POST",
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize assistant session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in initializeAssistantSession:", error);
      throw error;
    }
  }

  /**
   * Create a streaming chat with the AI assistant
   * @param params Chat parameters
   * @returns Streaming response
   */
  async createAssistantChatStream(params: {
    messages: Array<{
      role: string;
      content: string;
      attached_files?: Array<{
        id: string;
        fileName: string;
        contentType: string;
        url: string;
      }>;
    }>;
    session_id?: string;
    new_session: boolean;
    session_title: string;
    attached_files?: Array<{
      id: string;
      fileName: string;
      contentType: string;
      url: string;
    }>;
  }): Promise<Response> {
    try {
      const authFetch = this.getAuthFetch();
      return await authFetch(`${API_BASE_URL}/api/v1/professors/ai/assistant/chat/stream`, {
        method: "POST",
        body: JSON.stringify(params),
        // Don't set Content-Type here as it will be set by authFetch
      });
    } catch (error) {
      console.error("Error in createAssistantChatStream:", error);
      throw error;
    }
  }

  /**
   * Complete an exchange with the AI assistant
   * @param exchangeId ID of the exchange to complete
   * @param response Full response content
   * @returns Success status
   */
  async completeAssistantExchange(exchangeId: string, response: string): Promise<{ success: boolean }> {
    try {
      const authFetch = this.getAuthFetch();
      const result = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/assistant/exchanges/${exchangeId}/complete`, {
        method: "POST",
        body: JSON.stringify({ response }),
      });

      if (!result.ok) {
        throw new Error(`Failed to complete assistant exchange: ${result.statusText}`);
      }

      return await result.json();
    } catch (error) {
      console.error("Error in completeAssistantExchange:", error);
      throw error;
    }
  }

  /**
   * Delete an assistant session
   * @param sessionId ID of the session to delete
   * @returns Success status
   */
  async deleteAssistantSession(sessionId: string): Promise<{ success: boolean }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/assistant/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete assistant session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in deleteAssistantSession:", error);
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

  // New methods for student insights and course analysis

  /**
   * Get AI course analysis data
   * @param courseId - Course ID
   * @returns Array of AI analysis objects
   */
  async getCourseAnalysis(courseId: string): Promise<AIAnalysis[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/insights/analysis/${courseId}`);

      if (!response.ok) {
        throw new Error(`Failed to get course analysis: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getCourseAnalysis:", error);
      return [];
    }
  }

  /**
   * Get AI enhancement suggestions for a course
   * @param courseId - Course ID
   * @returns Array of enhancement suggestion objects
   */
  async getEnhancementSuggestions(courseId: string): Promise<EnhancementSuggestion[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/insights/suggestions/${courseId}`);

      if (!response.ok) {
        throw new Error(`Failed to get enhancement suggestions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getEnhancementSuggestions:", error);
      return [];
    }
  }

  /**
   * Submit a prompt to the AI assistant for a course
   * @param courseId - Course ID
   * @param prompt - The text prompt to send to the AI
   * @returns AI response object
   */
  async submitCoursePrompt(courseId: string, prompt: string): Promise<{ content: string; timestamp: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/ai/prompt`, {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit prompt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in submitCoursePrompt:", error);
      return {
        content: "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate a new course material using AI
   * @param courseId - Course ID
   * @param title - Material title
   * @param description - Material description
   * @param content - AI-generated content
   * @returns New material object
   */
  async generateCourseMaterial(courseId: string, title: string, description: string, content: string): Promise<any> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/materials/generate`, {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
          title,
          description,
          content,
          material_type: "lecture_notes",
          ai_generated: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate material: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in generateCourseMaterial:", error);
      throw error;
    }
  }

  /**
   * Generate a new assignment using AI
   * @param courseId - Course ID
   * @param title - Assignment title
   * @param description - Assignment description
   * @param content - AI-generated content
   * @returns New assignment object
   */
  async generateCourseAssignment(courseId: string, title: string, description: string, content: string): Promise<any> {
    try {
      // Calculate a due date 2 weeks from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/assignments/generate`, {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
          title,
          description,
          instructions: content,
          assignment_type: "homework",
          due_date: dueDate.toISOString(),
          points_possible: 100,
          ai_generated: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate assignment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in generateCourseAssignment:", error);
      throw error;
    }
  }

  /**
   * Download AI insights report for a course
   * @param courseId - Course ID
   */
  async downloadCourseInsightsReport(courseId: string): Promise<void> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/insights/export/${courseId}`);

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      // Create a blob from the PDF data
      const blob = await response.blob();

      // Create a link to download the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `course-insights-${courseId}.pdf`;

      // Append the link to the body
      document.body.appendChild(a);

      // Trigger the download
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error in downloadCourseInsightsReport:", error);
      throw error;
    }
  }

  /**
   * Get AI tutoring usage data for student insights page
   * @param classId - Class ID
   * @param studentId - Optional student ID for filtering
   * @param timeRange - Time range for data (7days, 30days, 90days, semester)
   * @returns Activity data for the specified time range
   */
  async getActivityData(classId: string, studentId: string = "all", timeRange: string = "30days"): Promise<any[]> {
    try {
      let url = `${API_BASE_URL}/api/v1/professor/insights/activity/${classId}?time_range=${timeRange}`;

      if (studentId !== "all") {
        url += `&student_id=${studentId}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get activity data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getActivityData:", error);
      return [];
    }
  }

  /**
   * Get subject activity data for student insights page
   * @param classId - Class ID
   * @param studentId - Optional student ID for filtering
   * @param timeRange - Time range for data (7days, 30days, 90days, semester)
   * @returns Subject activity data
   */
  async getSubjectActivity(classId: string, studentId: string = "all", timeRange: string = "30days"): Promise<any[]> {
    try {
      let url = `${API_BASE_URL}/api/v1/professor/insights/subjects/${classId}?time_range=${timeRange}`;

      if (studentId !== "all") {
        url += `&student_id=${studentId}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get subject activity: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getSubjectActivity:", error);
      return [];
    }
  }

  /**
   * Get AI-generated insights for student insights page
   * @param classId - Class ID
   * @param studentId - Optional student ID for filtering
   * @param timeRange - Time range for data (7days, 30days, 90days, semester)
   * @returns AI insights data
   */
  async getAIInsights(classId: string, studentId: string = "all", timeRange: string = "30days"): Promise<any[]> {
    try {
      let url = `${API_BASE_URL}/api/v1/professor/insights/recommendations/${classId}?time_range=${timeRange}`;

      if (studentId !== "all") {
        url += `&student_id=${studentId}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get AI insights: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getAIInsights:", error);
      return [];
    }
  }

  /**
   * Get topic clusters for student insights visualizations
   * @param classId - Class ID
   * @param studentId - Optional student ID for filtering
   * @param timeRange - Time range for data (7days, 30days, 90days, semester)
   * @returns Topic clusters data
   */
  async getTopicClusters(classId: string, studentId: string = "all", timeRange: string = "30days"): Promise<TopicCluster[]> {
    try {
      let url = `${API_BASE_URL}/api/v1/professor/insights/topics/${classId}?time_range=${timeRange}`;

      if (studentId !== "all") {
        url += `&student_id=${studentId}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get topic clusters: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getTopicClusters:", error);
      return [];
    }
  }

  /**
   * Get visualization data for 3D embeddings visualization
   * @param classId - Class ID
   * @param studentId - Optional student ID for filtering
   * @param timeRange - Time range for data (7days, 30days, 90days, semester)
   * @returns Visualization data for 3D plot
   */
  async getVisualizationData(classId: string, studentId: string = "all", timeRange: string = "30days"): Promise<VisualizationDataResponse | null> {
    try {
      let url = `${API_BASE_URL}/api/v1/professor/insights/visualization/${classId}?time_range=${timeRange}`;

      if (studentId !== "all") {
        url += `&student_id=${studentId}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get visualization data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getVisualizationData:", error);
      return null;
    }
  }

  /**
   * Get professor classes for student insights page
   * @returns List of classes taught by the professor
   */
  async getProfessorClasses(): Promise<any[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/insights/classes`);

      if (!response.ok) {
        throw new Error(`Failed to get professor classes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getProfessorClasses:", error);
      return [];
    }
  }

  /**
   * Get student list for a class
   * @param classId - Class ID
   * @returns List of students enrolled in the class
   */
  async getClassStudents(classId: string): Promise<any[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professor/insights/students/${classId}`);

      if (!response.ok) {
        throw new Error(`Failed to get class students: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getClassStudents:", error);
      return [];
    }
  }

  /**
   * Export insights report as PDF
   * @param classId - Class ID
   * @param studentId - Optional student ID for filtering
   * @param timeRange - Time range for data
   */
  async exportInsightsReport(classId: string, studentId: string = "all", timeRange: string = "30days"): Promise<void> {
    try {
      let url = `${API_BASE_URL}/api/v1/professor/insights/export/${classId}?time_range=${timeRange}`;

      if (studentId !== "all") {
        url += `&student_id=${studentId}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }

      // Create a blob from the PDF data
      const blob = await response.blob();

      // Create a link to download the blob
      const url_obj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url_obj;
      a.download = `student-insights-${classId}${studentId !== "all" ? `-${studentId}` : ""}.pdf`;

      // Append the link to the body
      document.body.appendChild(a);

      // Trigger the download
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url_obj);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error in exportInsightsReport:", error);
      throw error;
    }
  }
}

export const ProfessorAIService = new ProfessorAIServiceClass();
