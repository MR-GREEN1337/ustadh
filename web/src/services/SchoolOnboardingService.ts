/**
 * School Onboarding Service
 * Handles all API calls and data management for the school onboarding process
 */

import { API_BASE_URL } from "@/lib/config";

// Define types for the onboarding data
export interface SchoolProfile {
  name: string;
  address: string;
  city: string;
  region: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  education_levels: string[];
  color_scheme?: string;
}

export interface Department {
  id?: number;
  name: string;
  code: string;
  description?: string;
  education_level?: string;
}

export interface ProfessorInvite {
  email: string;
  full_name: string;
  title: string;
  academic_rank: string;
  specializations: string[];
  department_id?: number;
  preferred_subjects?: string[];
}

export interface AdminInvite {
  email: string;
  full_name: string;
  role: string;
  permissions?: string[];
}

export interface Course {
  title: string;
  code: string;
  description: string;
  department_id?: number;
  teacher_id?: number;
  education_level: string;
  academic_year: string;
  academic_track?: string;
  credits?: number;
  learning_objectives?: string[];
  prerequisites?: string[];
  ai_tutoring_enabled?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface SchoolClass {
  name: string;
  academic_year: string;
  education_level: string;
  academic_track?: string;
  room_number?: string;
  capacity?: number;
  homeroom_teacher_id?: number;
}

export interface OnboardingStatus {
  school_id: number;
  profile_completed: boolean;
  departments_created: boolean;
  admin_staff_invited: boolean;
  professors_invited: boolean;
  courses_created: boolean;
  classes_created: boolean;
  students_imported: boolean;
  onboarding_completed: boolean;
  completion_percentage: number;
}

export interface AnalyticsPreferences {
  track_student_progress: boolean;
  track_attendance: boolean;
  generate_weekly_reports: boolean;
  share_anonymized_data: boolean;
  ai_personalization: boolean;
}

class SchoolOnboardingService {
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor() {
    // Get the authFetch from window which is set by AuthProvider
    this.authFetch = (window as any).authFetch;

    if (!this.authFetch) {
      //console.error("authFetch is not available. Make sure AuthProvider is properly initialized.");
      // Fallback implementation
      this.authFetch = async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem("access_token");
        const headers = new Headers(options.headers || {});

        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        return fetch(url, {
          ...options,
          headers,
          credentials: "include"
        });
      };
    }
  }

  /**
   * Get the current onboarding status
   */
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/status`);

      if (!response.ok) {
        console.log(`Failed to fetch onboarding status: ${response.status} ${response.statusText}`);
        // Return default status object if the API call fails
        return {
          school_id: 0,
          profile_completed: false,
          departments_created: false,
          admin_staff_invited: false,
          professors_invited: false,
          courses_created: false,
          classes_created: false,
          students_imported: false,
          onboarding_completed: false,
          completion_percentage: 0
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      // Return default status object on error
      return {
        school_id: 0,
        profile_completed: false,
        departments_created: false,
        admin_staff_invited: false,
        professors_invited: false,
        courses_created: false,
        classes_created: false,
        students_imported: false,
        onboarding_completed: false,
        completion_percentage: 0
      };
    }
  }

  /**
   * Get school profile data
   */
  async getSchoolProfile(): Promise<SchoolProfile> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/profile`);

      if (!response.ok) {
        // If API endpoint fails, return empty object
        return {} as SchoolProfile;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching school profile:", error);
      return {} as SchoolProfile;
    }
  }

  /**
   * Update school profile
   */
  async updateSchoolProfile(profileData: SchoolProfile): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating school profile:", error);
      throw error;
    }
  }

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/departments`);

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  }

  /**
   * Create a new department
   */
  async createDepartment(department: Department): Promise<Department> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(department)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create department");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  }

  /**
   * Invite a professor
   */
  async inviteProfessor(professor: ProfessorInvite): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/invite-professor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(professor)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to invite professor");
      }

      return await response.json();
    } catch (error) {
      console.error("Error inviting professor:", error);
      throw error;
    }
  }

  /**
   * Invite an admin
   */
  async inviteAdmin(admin: AdminInvite): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/invite-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(admin)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to invite admin");
      }

      return await response.json();
    } catch (error) {
      console.error("Error inviting admin:", error);
      throw error;
    }
  }

  /**
   * Create courses
   */
  async createCourses(courses: Course[]): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(courses)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create courses");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating courses:", error);
      throw error;
    }
  }

  /**
   * Set up classes
   */
  async setupClasses(classes: SchoolClass[]): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/setup-classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(classes)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to set up classes");
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting up classes:", error);
      throw error;
    }
  }

  /**
   * Import students from a CSV file
   */
  async importStudents(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/import-students`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to import students");
      }

      return await response.json();
    } catch (error) {
      console.error("Error importing students:", error);
      throw error;
    }
  }

  /**
   * Set analytics preferences
   */
  async setAnalyticsPreferences(preferences: AnalyticsPreferences): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/analytics-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to set analytics preferences");
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting analytics preferences:", error);
      throw error;
    }
  }

  /**
   * Get analytics preferences
   */
  async getAnalyticsPreferences(): Promise<AnalyticsPreferences> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/analytics-settings`);

      if (!response.ok) {
        return {
          track_student_progress: true,
          track_attendance: true,
          generate_weekly_reports: true,
          share_anonymized_data: false,
          ai_personalization: true
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching analytics preferences:", error);
      return {
        track_student_progress: true,
        track_attendance: true,
        generate_weekly_reports: true,
        share_anonymized_data: false,
        ai_personalization: true
      };
    }
  }

  /**
   * Complete the onboarding process
   */
  async completeOnboarding(): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/school-onboarding/complete-onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to complete onboarding");
      }

      return await response.json();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  }

  /**
   * Get user and school data to pre-fill forms
   * This combines user data from auth with school profile
   */
  async getPrefilledData(): Promise<any> {
    try {
      // Get user data from localStorage
      const userString = localStorage.getItem("auth_user");
      const user = userString ? JSON.parse(userString) : null;

      // Get school profile data from API
      const schoolProfile = await this.getSchoolProfile();

      // Combine data, preferring API data over local storage
      const combinedData = {
        name: schoolProfile.name || (user?.school?.name || ""),
        address: schoolProfile.address || "",
        city: schoolProfile.city || "",
        region: schoolProfile.region || (user?.school?.region || ""),
        contact_email: schoolProfile.contact_email || (user?.email || ""),
        contact_phone: schoolProfile.contact_phone || "",
        website: schoolProfile.website || "",
        education_levels: schoolProfile.education_levels || ["lycee"], // Default to high school
        color_scheme: schoolProfile.color_scheme || "blue",
      };

      return {
        hasExistingData: !!(schoolProfile.name || schoolProfile.address || schoolProfile.city ||
                        schoolProfile.region || (schoolProfile.education_levels?.length > 0)),
        dataFromRegistration: !!(user?.school?.name || user?.school?.region || user?.email),
        data: combinedData
      };
    } catch (error) {
      console.error("Error getting prefilled data:", error);

      // Fallback to just user data from localStorage
      const userString = localStorage.getItem("auth_user");
      const user = userString ? JSON.parse(userString) : null;

      if (user?.school) {
        return {
          hasExistingData: false,
          dataFromRegistration: true,
          data: {
            name: user.school.name || "",
            address: "",
            city: "",
            region: user.school.region || "",
            contact_email: user.email || "",
            contact_phone: "",
            website: "",
            education_levels: ["lycee"], // Default to high school
            color_scheme: "blue",
          }
        };
      }

      return {
        hasExistingData: false,
        dataFromRegistration: false,
        data: {
          name: "",
          address: "",
          city: "",
          region: "",
          contact_email: "",
          contact_phone: "",
          website: "",
          education_levels: [],
          color_scheme: "blue",
        }
      };
    }
  }
}

// Export a singleton instance
export const schoolOnboardingService = new SchoolOnboardingService();
export default schoolOnboardingService;
