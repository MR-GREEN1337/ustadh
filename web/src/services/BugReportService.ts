import { API_BASE_URL } from "@/lib/config";

interface SystemInfo {
  browser: string;
  screen: string;
  url: string;
  userId: string | number;
  userType: string;
  timestamp: string;
}

interface BugReportData {
  description: string;
  systemInfo: SystemInfo;
}

export class BugReportService {
  /**
   * Submit a bug report to the backend
   */
  static async submitBugReport(data: BugReportData): Promise<void> {
    try {
      // Use the authFetch available on the window to ensure authentication
      // @ts-ignore - authFetch is added to the window object in AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/feedback/bug-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit bug report");
      }
    } catch (error) {
      console.error("Error submitting bug report:", error);
      throw error;
    }
  }
}
