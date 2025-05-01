import { API_BASE_URL } from "@/lib/config";

// Types
import {
  ClassStudentResponse,
  ActivityDataResponse,
  SubjectActivityResponse,
  AIInsightResponse,
  TopicClusterResponse,
  VisualizationDataResponse
} from "@/types/professor";

class ProfessorAIService {
  /**
   * Get all classes taught by the professor
   */
  static async getProfessorClasses() {
    try {
      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/professor/insights/classes`);

      if (!response.ok) {
        throw new Error('Failed to fetch professor classes');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching professor classes:', error);
      throw error;
    }
  }

  /**
   * Get all students enrolled in a specific class
   */
  static async getClassStudents(classId: string): Promise<ClassStudentResponse[]> {
    try {
      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/professor/insights/students/${classId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch class students');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  }

  /**
   * Get AI tutoring activity data for a class or student
   */
  static async getActivityData(
    classId: string,
    studentId: string = 'all',
    timeRange: string = '30days'
  ): Promise<ActivityDataResponse[]> {
    try {
      const studentParam = studentId !== 'all' ? `&student_id=${studentId}` : '';

      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professor/insights/activity/${classId}?time_range=${timeRange}${studentParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }

  /**
   * Get subject-based activity metrics
   */
  static async getSubjectActivity(
    classId: string,
    studentId: string = 'all',
    timeRange: string = '30days'
  ): Promise<SubjectActivityResponse[]> {
    try {
      const studentParam = studentId !== 'all' ? `&student_id=${studentId}` : '';

      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professor/insights/subjects/${classId}?time_range=${timeRange}${studentParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subject activity');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subject activity:', error);
      throw error;
    }
  }

  /**
   * Get AI-generated insights and recommendations
   */
  static async getAIInsights(
    classId: string,
    studentId: string = 'all',
    timeRange: string = '30days'
  ): Promise<AIInsightResponse[]> {
    try {
      const studentParam = studentId !== 'all' ? `&student_id=${studentId}` : '';

      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professor/insights/recommendations/${classId}?time_range=${timeRange}${studentParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch AI insights');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      throw error;
    }
  }

  /**
   * Get topic clusters for visualization
   */
  static async getTopicClusters(
    classId: string,
    studentId: string = 'all',
    timeRange: string = '30days'
  ): Promise<TopicClusterResponse[]> {
    try {
      const studentParam = studentId !== 'all' ? `&student_id=${studentId}` : '';

      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professor/insights/topics/${classId}?time_range=${timeRange}${studentParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch topic clusters');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching topic clusters:', error);
      throw error;
    }
  }

  /**
   * Get 3D visualization data
   */
  static async getVisualizationData(
    classId: string,
    studentId: string = 'all',
    timeRange: string = '30days'
  ): Promise<VisualizationDataResponse> {
    try {
      const studentParam = studentId !== 'all' ? `&student_id=${studentId}` : '';

      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professor/insights/visualization/${classId}?time_range=${timeRange}${studentParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch visualization data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      throw error;
    }
  }

  /**
   * Export insights report as PDF
   */
  static async exportInsightsReport(
    classId: string,
    studentId: string = 'all',
    timeRange: string = '30days'
  ): Promise<void> {
    try {
      const studentParam = studentId !== 'all' ? `&student_id=${studentId}` : '';

      // @ts-ignore - Global authFetch is defined in AuthProvider
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/professor/insights/export/${classId}?time_range=${timeRange}${studentParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to export insights report');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `insights-report-${classId}-${studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting insights report:', error);
      throw error;
    }
  }
}

export { ProfessorAIService };
