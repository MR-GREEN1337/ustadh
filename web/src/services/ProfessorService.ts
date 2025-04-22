import { API_BASE_URL } from "@/lib/config";

export interface ProfessorProfile {
  title: string;
  academic_rank: string;
  tenure_status?: string;
  department_id?: number;
}

export interface ProfessorExpertise {
  specializations: string[];
  preferred_subjects: string[];
  education_levels: string[];
  teaching_languages: string[];
}

export interface ProfessorAvailability {
  office_location?: string;
  office_hours: Record<string, { start: string; end: string }>;
  contact_preferences: {
    email_contact: boolean;
    sms_notifications: boolean;
    app_notifications: boolean;
    preferred_contact_method: string;
    response_time_hours: number;
    custom_message?: string;
  };
  tutoring_availability: boolean;
  max_students?: number;
}

export interface ProfessorCourses {
  course_ids: number[];
  new_courses: any[];
}

export interface OnboardingStatus {
  has_completed_onboarding: boolean;
  onboarding_step: string;
  onboarding_progress: number;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
}

export interface ScheduleEntry {
  id: string | number;
  title: string;
  description?: string;
  entry_type: string;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  days_of_week?: number[];
  location?: string;
  color?: string;
  school_class_id?: number;
  course_id?: number;
  subject_id?: number;
  is_cancelled?: boolean;
  is_completed?: boolean;
  attendees?: number[];
  department_id?: number;
}

export interface Course {
  id: number;
  title: string;
  code: string;
  description?: string;
  students: number;
  nextClass?: string;
  progress: number;
  topics?: string[];
  aiGenerated?: boolean;
  status: string;
}

export interface PendingItem {
  id: number;
  type: string;
  count: number;
  label: string;
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  time: string;
}

// Helper type for authFetch from window
declare global {
  interface Window {
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  }
}

class ProfessorServiceClass {
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

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/onboarding/status`);

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      throw error;
    }
  }

  async updateProfile(profileData: ProfessorProfile): Promise<OnboardingStatus> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/onboarding/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateExpertise(expertiseData: ProfessorExpertise): Promise<OnboardingStatus> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/onboarding/expertise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expertiseData),
      });

      if (!response.ok) {
        throw new Error('Failed to update expertise');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating expertise:', error);
      throw error;
    }
  }

  async updateAvailability(availabilityData: ProfessorAvailability): Promise<OnboardingStatus> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/onboarding/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availabilityData),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  async updateCourses(coursesData: ProfessorCourses): Promise<OnboardingStatus> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/onboarding/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursesData),
      });

      if (!response.ok) {
        throw new Error('Failed to update courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating courses:', error);
      throw error;
    }
  }

  async completeOnboarding(): Promise<OnboardingStatus> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // New methods for dashboard, courses and schedule management

  // Get professor's courses
  async getCourses(): Promise<{ courses: Course[] }> {
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

  // Get professor's schedule
  async getSchedule(params: {
    start_date: string;
    end_date: string;
    view_mode?: string;
  }, ): Promise<{ entries: ScheduleEntry[] }> {
    try {
      const authFetch = this.getAuthFetch();
      const queryParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
      });

      if (params.view_mode) {
        queryParams.append('view_mode', params.view_mode);
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/schedule?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }

  // Get pending items (assignments to grade, messages, etc.)
  async getPendingItems(): Promise<{ items: PendingItem[] }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/pending-items`);

      if (!response.ok) {
        throw new Error('Failed to fetch pending items');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pending items:', error);
      throw error;
    }
  }

  // Get recent activities
  async getRecentActivities(): Promise<{ activities: Activity[] }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/activities`);

      if (!response.ok) {
        throw new Error('Failed to fetch recent activities');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  // Create a new schedule entry
  async createEntry(entryData: Omit<ScheduleEntry, 'id'>, ): Promise<ScheduleEntry> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/schedule/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        throw new Error('Failed to create schedule entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating schedule entry:', error);
      throw error;
    }
  }

  // Update an existing schedule entry
  async updateEntry(entryId: number | string, entryData: Partial<ScheduleEntry>, ): Promise<ScheduleEntry> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/schedule/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating schedule entry:', error);
      throw error;
    }
  }

  // Delete a schedule entry
  async deleteEntry(entryId: number | string, ): Promise<void> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/schedule/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule entry');
      }
    } catch (error) {
      console.error('Error deleting schedule entry:', error);
      throw error;
    }
  }

  // Create a new course
  async createCourse(courseData: Omit<Course, 'id'>, ): Promise<Course> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // Update an existing course
  async updateCourse(courseId: number, courseData: Partial<Course>, ): Promise<Course> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  // Delete a course
  async deleteCourse(courseId: number, ): Promise<void> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // AI related methods

  // Generate course content with AI
  async generateCourseContent(courseId: number, options: {
    generateSyllabus?: boolean;
    generateAssessments?: boolean;
    generateLectures?: boolean;
    difficulty?: string;
    focus?: string;
  }, ): Promise<{ status: string; message: string; }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/generate-course-content/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to generate course content');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating course content:', error);
      throw error;
    }
  }

  // Generate a new course with AI
  async generateCourse(params: {
    title?: string;
    subjectArea: string;
    educationLevel: string;
    difficulty?: string;
  }, ): Promise<Course> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/generate-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
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

  // Generate course assessments with AI
  async generateAssessments(courseId: number, params: {
    type: 'quiz' | 'exam' | 'assignment' | 'project';
    topic?: string;
    difficulty?: string;
    includeRubric?: boolean;
  } ): Promise<{ status: string; message: string; assessmentId?: number }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/generate-assessments/${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate assessments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating assessments:', error);
      throw error;
    }
  }

  // Send message to AI assistant and get response
  async sendAIMessage(message: string, ): Promise<{
    response: string;
    suggestions?: Array<{ id: number; title: string; description: string; type: string }>;
    actions?: Array<{ type: string; data: any }>;
  }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }
}

export const ProfessorService = new ProfessorServiceClass();
