import { API_BASE_URL } from "@/lib/config";

export interface StudentProfile {
  id: number;
  user_id: number;
  student_id: string; // School ID for the student
  name: string;
  education_level: string;
  academic_track?: string;
  enrollment_date: string;
  is_active: boolean;
  graduation_year?: string;
  courses?: StudentCourse[];
  attendance?: number;
  performance?: number;
  avatar?: string;
  email?: string;
}

export interface StudentCourse {
  id: number;
  courseId: number;
  title: string;
  grade?: number | null;
  grade_letter?: string | null;
  status: string; // enrolled, completed, dropped, failed
  attendance_percentage?: number | null;
  progress: number;
}

export interface AssignHomeworkParams {
  studentIds: number[];
  courseId: number;
  title: string;
  description: string;
  dueDate: string;
  pointsPossible: number;
  materials?: Record<string, any>;
  resources?: Record<string, any>;
}

export interface StudentNotificationParams {
  studentIds: number[];
  title: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionType?: string;
  actionData?: Record<string, any>;
}

export interface StudentScheduleEntryParams {
  studentIds: number[];
  title: string;
  description?: string;
  entryType: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  daysOfWeek?: number[];
  courseId?: number;
  subjectId?: number;
  location?: string;
  color?: string;
}

export interface FilterParams {
  courseId?: number;
  educationLevel?: string;
  academicTrack?: string;
  isActive?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

// Helper type for authFetch from window
declare global {
  interface Window {
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  }
}

class ProfessorStudentServiceClass {
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

  async getStudents(filters: FilterParams = {}): Promise<{ students: StudentProfile[], total: number }> {
    try {
      const authFetch = this.getAuthFetch();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.courseId) queryParams.append('course_id', filters.courseId.toString());
      if (filters.educationLevel) queryParams.append('education_level', filters.educationLevel);
      if (filters.academicTrack) queryParams.append('academic_track', filters.academicTrack);
      if (filters.isActive !== undefined) queryParams.append('is_active', filters.isActive.toString());
      if (filters.searchTerm) queryParams.append('search', filters.searchTerm);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/students?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async getStudentDetails(studentId: number): Promise<StudentProfile> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/students/${studentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching student details:', error);
      throw error;
    }
  }

  async getStudentCourses(studentId: number): Promise<StudentCourse[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/students/${studentId}/courses`);

      if (!response.ok) {
        throw new Error('Failed to fetch student courses');
      }

      const data = await response.json();
      return data.courses;
    } catch (error) {
      console.error('Error fetching student courses:', error);
      throw error;
    }
  }

  async assignHomework(params: AssignHomeworkParams): Promise<{ success: boolean; assignmentId: number }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/assignments`, {
        method: 'POST',
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to assign homework');
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning homework:', error);
      throw error;
    }
  }

  async sendNotification(params: StudentNotificationParams): Promise<{ success: boolean; count: number }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/students/notify`, {
        method: 'POST',
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async addScheduleEntry(params: StudentScheduleEntryParams): Promise<{ success: boolean; entryId: number }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/students/schedule`, {
        method: 'POST',
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to add schedule entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      throw error;
    }
  }

  async exportStudentData(studentIds: number[], format: 'csv' | 'pdf' = 'csv'): Promise<string> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/students/export`, {
        method: 'POST',
        body: JSON.stringify({ studentIds, format })
      });

      if (!response.ok) {
        throw new Error(`Failed to export student data as ${format}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error exporting student data:', error);
      throw error;
    }
  }

  async getEducationLevels(): Promise<string[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/education-levels`);

      if (!response.ok) {
        throw new Error('Failed to fetch education levels');
      }

      const data = await response.json();
      return data.levels;
    } catch (error) {
      console.error('Error fetching education levels:', error);
      // Return sensible defaults on error
      return [
        'primary_1', 'primary_2', 'primary_3', 'primary_4', 'primary_5', 'primary_6',
        'college_7', 'college_8', 'college_9',
        'tronc_commun', 'bac_1', 'bac_2',
        'university'
      ];
    }
  }

  async getAcademicTracks(): Promise<string[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/academic-tracks`);

      if (!response.ok) {
        throw new Error('Failed to fetch academic tracks');
      }

      const data = await response.json();
      return data.tracks;
    } catch (error) {
      console.error('Error fetching academic tracks:', error);
      // Return sensible defaults on error
      return [
        'sciences_math_a', 'sciences_math_b', 'sciences_physiques',
        'svt', 'lettres', 'economie', 'arts'
      ];
    }
  }
}

export const ProfessorStudentService = new ProfessorStudentServiceClass();
