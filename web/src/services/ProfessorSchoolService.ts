// services/ProfessorSchoolService.ts
import { API_BASE_URL } from "@/lib/config";

// Types
export interface SchoolData {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  region: string;
  school_type: string;
  education_levels: string[];
  contact_email: string;
  contact_phone: string;
  website?: string;
  logo_url?: string;
  color_scheme?: string;
  is_active: boolean;
  subscription_type: string;
  subscription_expires?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  education_level?: string;
  head_staff_name?: string;
}

export interface SchoolStaff {
  id: number;
  name: string;
  staff_type: string;
  is_teacher: boolean;
  expertise_subjects: string[];
  work_email?: string;
  work_phone?: string;
}

export interface AdminContact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
}

export interface SchoolAnnouncement {
  id: number;
  title: string;
  content: string;
  published_by: string;
  published_at: string;
  priority: string;
  expires_at?: string;
}

export interface SchoolStats {
  total_students: number;
  total_teachers: number;
  total_departments: number;
  total_courses: number;
  active_courses: number;
}

export interface MessageRequest {
  recipient_id: number;
  subject: string;
  content: string;
  has_attachments?: boolean;
}

export interface SchoolResource {
  id: number;
  title: string;
  description: string;
  resource_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
  created_by: string;
}

class ProfessorSchoolService {
  private readonly API_BASE = `${API_BASE_URL}/api/v1/professors/school`;

  // Helper method to get authFetch with fallback
  private getAuthFetch() {
    if (typeof window !== 'undefined' && (window as any).authFetch) {
      return (window as any).authFetch;
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

  /**
   * Get the school data for the currently logged-in professor
   */
  async getSchoolData(): Promise<SchoolData> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/info`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch school data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching school data:', error);
      throw error;
    }
  }

  /**
   * Get departments in the professor's school
   */
  async getDepartments(): Promise<Department[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/departments`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch departments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  /**
   * Get school administrators and contact information
   */
  async getAdminContacts(): Promise<AdminContact[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/admins`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch admin contacts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin contacts:', error);
      throw error;
    }
  }

  /**
   * Get recent school announcements
   */
  async getAnnouncements(limit: number = 5): Promise<SchoolAnnouncement[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/announcements?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch announcements');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  }

  /**
   * Get staff members by department
   */
  async getStaffByDepartment(departmentId: number): Promise<SchoolStaff[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/departments/${departmentId}/staff`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch staff by department');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching staff by department:', error);
      throw error;
    }
  }

  /**
   * Get school statistics
   */
  async getSchoolStats(): Promise<SchoolStats> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/stats`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch school statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching school statistics:', error);
      throw error;
    }
  }

  /**
   * Send message to school administrator
   */
  async sendMessageToAdmin(message: MessageRequest): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message to admin');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message to admin:', error);
      throw error;
    }
  }

  /**
   * Request access to a department
   */
  async requestDepartmentAccess(departmentId: number, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/departments/${departmentId}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to request department access');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting department access:', error);
      throw error;
    }
  }

  /**
   * Get school resources (materials, guidelines, etc.)
   */
  async getSchoolResources(): Promise<SchoolResource[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/resources`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch school resources');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching school resources:', error);
      throw error;
    }
  }

  /**
   * Download a specific school resource
   */
  async downloadResource(resourceId: number): Promise<Blob> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/resources/${resourceId}/download`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to download resource');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading resource:', error);
      throw error;
    }
  }
}

export const professorSchoolService = new ProfessorSchoolService();
export default professorSchoolService;
