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

  // Additional methods for course management, teaching materials, etc.
  async getCourses() {
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
}

export const ProfessorService = new ProfessorServiceClass();
