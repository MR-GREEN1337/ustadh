// Updated ProfileService.ts with FormData support
import { API_BASE_URL } from "@/lib/config";

interface ProfileUpdateData {
  username?: string;
  email?: string;
  full_name?: string;
  grade_level?: number | null;
  school_type?: string | null;
  locale?: string;
  bio?: string;
}

interface ProfessorProfileUpdateData {
  title?: string;
  academic_rank?: string;
  specializations?: string[];
  office_location?: string;
  office_hours?: Record<string, string>;
  tutoring_availability?: boolean;
}

interface StudentProfileUpdateData {
  education_level?: string;
  academic_track?: string;
  learning_style?: string;
  study_habits?: string[];
  academic_goals?: string[];
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export class ProfileService {
  static async getProfile() {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/profile`);

    if (!response.ok) {
      throw new Error(`Error fetching profile: ${response.status}`);
    }

    return await response.json();
  }

  static async updateProfile(data: FormData | ProfileUpdateData) {
    // @ts-ignore - using the global authFetch
    let response;

    // Check if we're dealing with FormData (for file uploads) or regular JSON data
    if (data instanceof FormData) {
      response = await window.authFetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: "PUT",
        body: data,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      });
    } else {
      response = await window.authFetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update profile");
    }

    return await response.json();
  }

  static async updateStudentProfile(data: StudentProfileUpdateData) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/student-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update student profile");
    }

    return await response.json();
  }

  static async updateProfessorProfile(data: ProfessorProfileUpdateData) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/professors/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update professor profile");
    }

    return await response.json();
  }

  static async changePassword(data: PasswordChangeData) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to change password");
    }

    return true;
  }

  static async getGuardians() {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/guardians`);

    if (!response.ok) {
      throw new Error(`Error fetching guardians: ${response.status}`);
    }

    return await response.json();
  }

  static async addGuardian(email: string, relationship: string, canView: boolean, canEdit: boolean) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/guardians`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        relationship,
        can_view: canView,
        can_edit: canEdit,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to add guardian");
    }

    return await response.json();
  }

  static async removeGuardian(id: number) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/guardians/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error removing guardian: ${response.status}`);
    }

    return true;
  }

  static async getActivityLog(page = 1, limit = 10) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(
      `${API_BASE_URL}/api/v1/users/activity?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Error fetching activity log: ${response.status}`);
    }

    return await response.json();
  }

  static async getStudentInfo(userId?: number) {
    if (!userId) return null;

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/students/${userId}`);

      if (!response.ok) {
        throw new Error(`Error fetching student info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getStudentInfo:", error);
      throw error;
    }
  }

  static async getStudentEnrollments(userId?: number) {
    if (!userId) return [];

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/students/${userId}/enrollments`);

      if (!response.ok) {
        throw new Error(`Error fetching student enrollments: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getStudentEnrollments:", error);
      return [];
    }
  }

  static async getStudentAchievements(userId?: number) {
    if (!userId) return [];

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/progress/achievements?user_id=${userId}`);

      if (!response.ok) {
        throw new Error(`Error fetching student achievements: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getStudentAchievements:", error);
      return [];
    }
  }

  static async getStudentActivityStats(userId?: number) {
    if (!userId) return null;

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/progress/stats?user_id=${userId}`);

      if (!response.ok) {
        throw new Error(`Error fetching student activity stats: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getStudentActivityStats:", error);
      return null;
    }
  }

  static async getStudentProgress(studentId?: number) {
    const url = studentId
      ? `${API_BASE_URL}/api/v1/progress/student/${studentId}`
      : `${API_BASE_URL}/api/v1/progress/own`;

    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching progress: ${response.status}`);
    }

    return await response.json();
  }

  // Professor profile methods
  static async getProfessorInfo(userId?: number) {
    if (!userId) return null;

    try {
      // First get the professor's basic info
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/professors/${userId}`);

      if (!response.ok) {
        throw new Error(`Error fetching professor info: ${response.status}`);
      }

      const professorData = await response.json();

      // Get additional information
      const [coursesData, students] = await Promise.all([
        this.getProfessorCourses(userId),
        this.getProfessorStudents(userId)
      ]);

      // Calculate total teaching hours based on courses
      const teachingHours = coursesData.reduce((total: number, course: any) => {
        // Assuming each course has weekly hours in its data
        const courseHours = course.weekly_hours || 0;
        return total + courseHours;
      }, 0);

      // Return combined data
      return {
        ...professorData,
        studentCount: students.length,
        teachingHours,
        students
      };
    } catch (error) {
      console.error("Error in getProfessorInfo:", error);
      throw error;
    }
  }

  static async getProfessorCourses(userId?: number) {
    if (!userId) return [];

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/professors/${userId}/courses`);

      if (!response.ok) {
        throw new Error(`Error fetching professor courses: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getProfessorCourses:", error);
      return [];
    }
  }

  static async getProfessorStudents(userId?: number) {
    if (!userId) return [];

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/professors/${userId}/students`);

      if (!response.ok) {
        throw new Error(`Error fetching professor students: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getProfessorStudents:", error);
      return [];
    }
  }

  static async getProfessorAssignments(userId?: number, courseId?: number) {
    if (!userId) return [];

    try {
      const courseParam = courseId ? `?course_id=${courseId}` : '';

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/schools/professors/${userId}/assignments${courseParam}`
      );

      if (!response.ok) {
        throw new Error(`Error fetching professor assignments: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error in getProfessorAssignments:", error);
      return [];
    }
  }

  // School Admin methods
  static async getSchoolInfo(userId?: number) {
    if (!userId) return null;

    // First get the admin profile to find associated school
    // @ts-ignore - using the global authFetch
    const adminResponse = await window.authFetch(`${API_BASE_URL}/api/v1/users/staff/${userId}`);

    if (!adminResponse.ok) {
      throw new Error(`Error fetching admin staff info: ${adminResponse.status}`);
    }

    const adminData = await adminResponse.json();
    const schoolId = adminData.school_id;

    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/${schoolId}`);

    if (!response.ok) {
      throw new Error(`Error fetching school info: ${response.status}`);
    }

    const schoolData = await response.json();

    // Get school statistics to include with the school data
    const stats = await this.getSchoolStats(schoolId);

    return { ...schoolData, ...stats };
  }

  static async getSchoolStats(schoolId: number) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/${schoolId}/stats`);

    if (!response.ok) {
      throw new Error(`Error fetching school stats: ${response.status}`);
    }

    return await response.json();
  }

  static async getSchoolStaff(schoolId: number, page = 1, limit = 20) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(
      `${API_BASE_URL}/api/v1/schools/${schoolId}/staff?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Error fetching school staff: ${response.status}`);
    }

    return await response.json();
  }

  static async getSchoolDepartments(schoolId: number) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/schools/${schoolId}/departments`);

    if (!response.ok) {
      throw new Error(`Error fetching school departments: ${response.status}`);
    }

    return await response.json();
  }

  static async deleteAccount() {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/account`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete account");
    }

    return true;
  }
}
