import { API_BASE_URL } from "@/lib/config";

interface ProfileUpdateData {
  username?: string;
  email?: string;
  full_name?: string;
  grade_level?: number | null;
  school_type?: string | null;
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

  static async updateProfile(data: ProfileUpdateData) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update profile");
    }

    return await response.json();
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
