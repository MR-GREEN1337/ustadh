import { API_BASE_URL } from "@/lib/config";

// Types for admin dashboard data
export interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  activeCourses: number;
  systemUsage: string;
  recentActivity: RecentActivity[];
  systemStatus: SystemStatus;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  time: string;
}

export interface SystemStatus {
  serverStatus: string;
  databaseStatus: string;
  aiServicesStatus: string;
  storageUsage: string;
  latestUpdates: string[];
}

export interface SchoolUser {
  id: number;
  full_name: string;
  email: string;
  username: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  school_id?: number;
  // Additional fields depending on user type
  [key: string]: any;
}

export interface SchoolCourse {
  id: number;
  title: string;
  code: string;
  description: string;
  academic_year: string;
  education_level: string;
  department_id?: number;
  department_name?: string;
  teacher_id?: number;
  teacher_name?: string;
  status: string;
  students_count: number;
  ai_tutoring_enabled: boolean;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  education_level?: string;
  staff_count: number;
  courses_count: number;
}

export interface ClassInfo {
  id: number;
  name: string;
  academic_year: string;
  education_level: string;
  academic_track?: string;
  homeroom_teacher_name?: string;
  students_count: number;
}

class AdminDashboardService {
  /**
   * Fetch school statistics including counts of students, teachers, courses, and recent activity
   */
  static async fetchSchoolStats(): Promise<SchoolStats> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/stats`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch school stats:", error);
      // Return mock data if API call fails
      return this.getMockSchoolStats();
    }
  }

  /**
   * Fetch all students in the school with pagination and filtering
   */
  static async fetchStudents(
    page: number = 1,
    limit: number = 20,
    filters: {
      query?: string,
      class_id?: number,
      education_level?: string,
      is_active?: boolean
    } = {}
  ): Promise<{
    students: SchoolUser[],
    total: number,
    page: number,
    totalPages: number
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters.query) queryParams.append('query', filters.query);
      if (filters.class_id) queryParams.append('class_id', filters.class_id.toString());
      if (filters.education_level) queryParams.append('education_level', filters.education_level);
      if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/admin/students?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch students:", error);
      // Return empty data if API call fails
      return { students: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Fetch all teachers in the school with pagination and filtering
   */
  static async fetchTeachers(
    page: number = 1,
    limit: number = 20,
    filters: {
      query?: string,
      department_id?: number,
      is_active?: boolean
    } = {}
  ): Promise<{
    teachers: SchoolUser[],
    total: number,
    page: number,
    totalPages: number
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters.query) queryParams.append('query', filters.query);
      if (filters.department_id) queryParams.append('department_id', filters.department_id.toString());
      if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active.toString());

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/admin/teachers?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      // Return empty data if API call fails
      return { teachers: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Fetch all courses with pagination and filtering
   */
  static async fetchCourses(
    page: number = 1,
    limit: number = 20,
    filters: {
      query?: string,
      department_id?: number,
      education_level?: string,
      academic_year?: string,
      status?: string
    } = {}
  ): Promise<{
    courses: SchoolCourse[],
    total: number,
    page: number,
    totalPages: number
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters.query) queryParams.append('query', filters.query);
      if (filters.department_id) queryParams.append('department_id', filters.department_id.toString());
      if (filters.education_level) queryParams.append('education_level', filters.education_level);
      if (filters.academic_year) queryParams.append('academic_year', filters.academic_year);
      if (filters.status) queryParams.append('status', filters.status);

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/admin/courses?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      // Return empty data if API call fails
      return { courses: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Fetch all departments in the school
   */
  static async fetchDepartments(): Promise<Department[]> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/departments`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      // Return empty array if API call fails
      return [];
    }
  }

  /**
   * Fetch all classes in the school with pagination and filtering
   */
  static async fetchClasses(
    page: number = 1,
    limit: number = 20,
    filters: {
      academic_year?: string,
      education_level?: string
    } = {}
  ): Promise<{
    classes: ClassInfo[],
    total: number,
    page: number,
    totalPages: number
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters.academic_year) queryParams.append('academic_year', filters.academic_year);
      if (filters.education_level) queryParams.append('education_level', filters.education_level);

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/admin/classes?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      // Return empty data if API call fails
      return { classes: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Add a new student to the school
   */
  static async addStudent(studentData: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    student_id: string;
    education_level: string;
    academic_track?: string;
    enrollment_date: string;
  }): Promise<SchoolUser> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to add student:", error);
      throw error;
    }
  }

  /**
   * Add a new teacher to the school
   */
  static async addTeacher(teacherData: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    staff_type: string;
    is_teacher: boolean;
    expertise_subjects: string[];
    department_id?: number;
    qualifications?: string[];
  }): Promise<SchoolUser> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacherData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to add teacher:", error);
      throw error;
    }
  }

  /**
   * Add a new course
   */
  static async addCourse(courseData: {
    title: string;
    code: string;
    description: string;
    department_id?: number;
    teacher_id?: number;
    academic_year: string;
    education_level: string;
    academic_track?: string;
    ai_tutoring_enabled?: boolean;
    status?: string;
    syllabus?: Record<string, any>;
    learning_objectives?: string[];
  }): Promise<SchoolCourse> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to add course:", error);
      throw error;
    }
  }

  /**
   * Generate system reports
   */
  static async generateReport(reportType: string, filters: Record<string, any> = {}): Promise<Blob> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        reportType: reportType
      });

      // Add all filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/admin/reports?${queryParams.toString()}`,
        {
          headers: {
            'Accept': 'application/pdf,application/vnd.ms-excel,application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Failed to generate report:", error);
      throw error;
    }
  }

  /**
   * Update school settings
   */
  static async updateSchoolSettings(settings: {
    name?: string;
    address?: string;
    city?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    logo_url?: string;
    color_scheme?: string;
    subscription_type?: string;
  }): Promise<any> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/settings/school`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to update school settings:", error);
      throw error;
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(settings: {
    ai_tutoring_enabled?: boolean;
    discussion_enabled?: boolean;
    peer_review_enabled?: boolean;
    api_key?: string;
    integration_settings?: Record<string, any>;
  }): Promise<any> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/settings/system`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to update system settings:", error);
      throw error;
    }
  }

  /**
   * Fetch activity log for the admin dashboard
   */
  static async fetchActivityLog(
    page: number = 1,
    limit: number = 20,
    filters: {
      startDate?: string;
      endDate?: string;
      activityType?: string;
    } = {}
  ): Promise<{
    activities: RecentActivity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.activityType) queryParams.append('type', filters.activityType);

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/admin/activity-log?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch activity log:", error);
      // Return empty data if API call fails
      return { activities: [], total: 0, page: 1, totalPages: 0 };
    }
  }

  /**
   * Get dashboard summary for admins
   */
  static async getDashboardSummary(): Promise<{
    stats: SchoolStats;
    recentStudents: SchoolUser[];
    recentTeachers: SchoolUser[];
    recentCourses: SchoolCourse[];
  }> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/admin/dashboard/summary`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch admin dashboard summary:", error);

      // Return mock data
      return {
        stats: this.getMockSchoolStats(),
        recentStudents: [],
        recentTeachers: [],
        recentCourses: []
      };
    }
  }

  /**
   * Mock data if API is not yet implemented
   */
  private static getMockSchoolStats(): SchoolStats {
    return {
      totalStudents: 1247,
      totalTeachers: 84,
      activeCourses: 156,
      systemUsage: "92%",
      recentActivity: [
        { id: 1, type: "user", description: "New teacher account created", time: "10 minutes ago" },
        { id: 2, type: "course", description: "New course 'Advanced Physics' added", time: "2 hours ago" },
        { id: 3, type: "system", description: "System backup completed", time: "Yesterday" },
        { id: 4, type: "security", description: "Security audit completed", time: "2 days ago" }
      ],
      systemStatus: {
        serverStatus: "Operational",
        databaseStatus: "Operational",
        aiServicesStatus: "Operational",
        storageUsage: "72% Used",
        latestUpdates: [
          "Platform v2.4.0 deployed (3 days ago)",
          "Security patches applied (1 week ago)",
          "Database optimization completed (1 week ago)"
        ]
      }
    };
  }
}

export default AdminDashboardService;
