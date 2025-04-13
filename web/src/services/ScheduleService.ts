import { API_BASE_URL } from '@/lib/config';

type ScheduleEntry = {
  id?: number;
  title: string;
  description?: string;
  entry_type: 'class' | 'study' | 'homework' | 'exam' | 'custom' | 'lecture' | 'office_hours' | 'meeting' | 'department_meeting' | 'course_event' | 'grading' | 'advising' | 'research' | 'personal' | 'admin_task';
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  days_of_week?: number[];
  school_class_id?: number | null;
  course_id?: number | null;
  assignment_id?: number | null;
  subject_id?: number | null;
  topic_id?: number | null;
  location?: string | null;
  color?: string | null;
  notification_minutes_before?: number | null;
  is_completed?: boolean;
  is_cancelled?: boolean;
  attendees?: number[];
  department_id?: number | null;
};

type ScheduleResponse = {
  entries: ScheduleEntry[];
};

type DateRange = {
  start_date: string;
  end_date: string;
};

type Department = {
  id: number;
  name: string;
  code: string;
  description?: string;
  education_level?: string;
};

type Course = {
  id: number;
  title: string;
  code: string;
  department_id?: number;
  description?: string;
  education_level?: string;
  academic_track?: string;
};

type Professor = {
  id: number;
  name: string;
  department_id?: number;
  title?: string;
  specializations?: string[];
  academic_rank?: string;
};

class ScheduleService {
  // Get user's schedule for a date range
  async getSchedule(dateRange: DateRange, locale?: string): Promise<ScheduleResponse> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/entries?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  }

  // Create a new schedule entry
  async createEntry(entry: ScheduleEntry, locale?: string): Promise<ScheduleEntry> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale || 'en',
        },
        body: JSON.stringify(entry),
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
  async updateEntry(id: number, entry: Partial<ScheduleEntry>, locale?: string): Promise<ScheduleEntry> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/entries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale || 'en',
        },
        body: JSON.stringify(entry),
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
  async deleteEntry(id: number, locale?: string): Promise<{ success: boolean }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/entries/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept-Language': locale || 'en',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting schedule entry:', error);
      throw error;
    }
  }

  // Get class schedule for a student (for school integration)
  async getClassSchedule(dateRange: DateRange, locale?: string): Promise<any> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/class-schedule?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch class schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching class schedule:', error);
      throw error;
    }
  }

  // Sync school schedule to personal schedule
  async syncSchoolSchedule(options: {
    overwrite_existing?: boolean,
    include_types?: string[]
  } = {}, locale?: string): Promise<{ success: boolean; count: number }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/sync-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale || 'en',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Failed to sync school schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing school schedule:', error);
      throw error;
    }
  }

  // Get all departments (Admin only)
  async getDepartments(locale?: string): Promise<{ departments: Department[] }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/departments`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get all professors (Admin only)
  async getProfessors(locale?: string): Promise<{ professors: Professor[] }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/professors`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch professors');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching professors:', error);
      throw error;
    }
  }

  // Get all courses (Admin only)
  async getCourses(locale?: string): Promise<{ courses: Course[] }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // Get professor's department (Professor only)
  async getProfessorDepartment(locale?: string): Promise<{ department: Department }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/professors/department`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch professor department');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching professor department:', error);
      throw error;
    }
  }

  // Get professor's courses (Professor only)
  async getProfessorCourses(locale?: string): Promise<{ courses: Course[] }> {
    try {
      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/professors/courses`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch professor courses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching professor courses:', error);
      throw error;
    }
  }

  // Get professor's office hours
  async getProfessorOfficeHours(dateRange: DateRange, locale?: string): Promise<ScheduleResponse> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/office-hours?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch office hours');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching office hours:', error);
      throw error;
    }
  }

  // Get professor's course sessions
  async getProfessorCourseSessions(dateRange: DateRange, locale?: string): Promise<ScheduleResponse> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/course-sessions?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course sessions:', error);
      throw error;
    }
  }

  // Get department schedule
  async getDepartmentSchedule(params: DateRange & { department_id: number }, locale?: string): Promise<ScheduleResponse> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        department_id: params.department_id.toString()
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/department?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch department schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching department schedule:', error);
      throw error;
    }
  }

  // Get course schedule
  async getCourseSchedule(params: DateRange & { course_id: number }, locale?: string): Promise<ScheduleResponse> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        course_id: params.course_id.toString()
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/course?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course schedule:', error);
      throw error;
    }
  }

  // Get professor schedule (Admin only)
  async getProfessorSchedule(params: DateRange & { professor_id: number }, locale?: string): Promise<ScheduleResponse> {
    try {
      // Format query parameters properly for GET request
      const queryParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        professor_id: params.professor_id.toString()
      });

      // @ts-ignore - authFetch is added to window by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/schedule/professor?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept-Language': locale || 'en',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch professor schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching professor schedule:', error);
      throw error;
    }
  }

  // Get color suggestion based on entry type or subject
  getColorSuggestion(entry: Partial<ScheduleEntry>): string {
    // Default colors for different entry types
    const colorMap: Record<string, string> = {
      // Student colors
      class: '#4F46E5', // indigo
      study: '#0EA5E9', // sky blue
      homework: '#10B981', // emerald
      exam: '#EF4444', // red

      // Professor/Admin colors
      lecture: '#F59E0B', // amber
      office_hours: '#8B5CF6', // violet
      department_meeting: '#4F46E5', // indigo
      meeting: '#0EA5E9', // sky blue
      course_event: '#10B981', // emerald
      grading: '#EF4444', // red
      advising: '#3B82F6', // blue
      research: '#F97316', // orange
      personal: '#8B5CF6', // violet
      admin_task: '#EC4899', // pink
      custom: '#8B5CF6', // violet
    };

    // Return suggested color based on entry type
    return entry.color || colorMap[entry.entry_type || 'custom'] || '#8B5CF6';
  }

  // Format date for display
  formatDate(date: Date, locale: string = 'en'): string {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  // Format time for display
  formatTime(time: string, locale: string = 'en'): string {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

export default new ScheduleService();
