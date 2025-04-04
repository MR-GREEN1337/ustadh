import { API_BASE_URL } from "@/lib/config";

interface Subject {
  id: number;
  name: string;
  level?: string;
  grade_level?: string;
  progress: number;
  unitsCompleted?: number;
  totalUnits?: number;
  timeSpent?: string;
  icon: string;
  colorClass: string;
}

interface Course {
  id: number;
  title: string;
  subject?: string;
  category?: string;
  level?: string;
  duration?: string;
  tags?: string[];
  icon: string;
  colorClass?: string;
}

interface Topic {
  id: number;
  title: string;
  description: string;
  learners: number;
  icon: string;
}

interface ScheduleEvent {
  id: number;
  title: string;
  subject?: string;
  day: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

export class LearningService {
  static async getEnrolledSubjects() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/enrolled`);

      if (!response.ok) {
        throw new Error(`Error fetching enrolled subjects: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getEnrolledSubjects:', error);
      throw error;
    }
  }

  static async getAllSubjects() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects`);

      if (!response.ok) {
        throw new Error(`Error fetching all subjects: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getAllSubjects:', error);
      throw error;
    }
  }

  static async getSubjectDetails(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`);

      if (!response.ok) {
        throw new Error(`Error fetching subject details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getSubjectDetails:', error);
      throw error;
    }
  }

  static async enrollInSubject(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error enrolling in subject: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in enrollInSubject:', error);
      throw error;
    }
  }

  static async unenrollFromSubject(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/unenroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Error unenrolling from subject: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in unenrollFromSubject:', error);
      throw error;
    }
  }

  static async getRecommendations() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/recommendations`);

      if (!response.ok) {
        throw new Error(`Error fetching recommendations: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      throw error;
    }
  }

  static async getCourses(limit = 10, offset = 0) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses?limit=${limit}&offset=${offset}`);

      if (!response.ok) {
        throw new Error(`Error fetching courses: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getCourses:', error);
      throw error;
    }
  }

  static async getCourseDetails(courseId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}`);

      if (!response.ok) {
        throw new Error(`Error fetching course details: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getCourseDetails:', error);
      throw error;
    }
  }

  static async getExploreTopics(query?: string) {
    try {
      const url = query
        ? `${API_BASE_URL}/api/v1/explore/topics?q=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/api/v1/explore/topics`;

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(url);

      if (!response.ok) {
        throw new Error(`Error fetching explore topics: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getExploreTopics:', error);
      throw error;
    }
  }

  static async getSchedule(startDate?: string, endDate?: string) {
    try {
      let url = `${API_BASE_URL}/api/v1/schedule`;
      if (startDate && endDate) {
        url += `?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
      }

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(url);

      if (!response.ok) {
        throw new Error(`Error fetching schedule: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getSchedule:', error);
      throw error;
    }
  }

  static async createScheduleEvent(eventData: any) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Error creating schedule event: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createScheduleEvent:', error);
      throw error;
    }
  }

  static async updateScheduleEvent(eventId: number, eventData: any) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Error updating schedule event: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateScheduleEvent:', error);
      throw error;
    }
  }

  static async deleteScheduleEvent(eventId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error deleting schedule event: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in deleteScheduleEvent:', error);
      throw error;
    }
  }

  static async getLearningProgress() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/progress`);

      if (!response.ok) {
        throw new Error(`Error fetching learning progress: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getLearningProgress:', error);
      throw error;
    }
  }
}
