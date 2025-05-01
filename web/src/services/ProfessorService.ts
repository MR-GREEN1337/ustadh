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

interface CourseCreateRequest {
  title: string;
  code: string;
  description?: string;
  academic_year?: string;
  education_level?: string;
  academic_track?: string | null;
  credits?: number | null;
  syllabus?: Record<string, any>;
  learning_objectives?: string[];
  prerequisites?: string[];
  aiGenerated?: boolean;
  ai_tutoring_config?: Record<string, any>;
  topics?: string[];
  required_materials?: Record<string, any>;
  supplementary_resources?: Record<string, any>;
  grading_schema?: Record<string, any>;
  assessment_types?: string[];
  allow_group_work?: boolean;
  peer_review_enabled?: boolean;
  discussion_enabled?: boolean;
  status?: string;
  department_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ClassItem {
  id: number;
  name: string;
  studentCount: number;
  academicYear: string;
  educationLevel: string;
  academicTrack?: string;
  roomNumber?: string;
  nextSession?: string;
}

export interface ClassMetadata {
  academicYears?: string[];
  educationLevels?: { id: string; name: string }[];
  academicTracks?: { id: string; name: string }[];
  courses?: { id: number; title: string }[];
  departments?: { id: number; name: string }[];
  currentAcademicYear?: string;
}

export interface ClassCreateRequest {
  name: string;
  academicYear: string;
  educationLevel: string;
  academicTrack?: string;
  roomNumber?: string;
  capacity?: number;
  courseId?: number;
  departmentId?: number;
  description?: string;
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
  },): Promise<{ entries: ScheduleEntry[] }> {
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
  async createEntry(entryData: Omit<ScheduleEntry, 'id'>,): Promise<ScheduleEntry> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/schedule/entries`, {
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
  async updateEntry(entryId: number | string, entryData: Partial<ScheduleEntry>,): Promise<ScheduleEntry> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/schedule/entries/${entryId}`, {
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
  async deleteEntry(entryId: number | string,): Promise<void> {
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

  /**
 * Get detailed information for a specific course
 * @param courseId The ID of the course to fetch
 */
  async getCourse(courseId: string | number) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/course/${courseId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getCourse:', error);
      throw error;
    }
  }

  async createCourse(courseData: Omit<CourseCreateRequest, 'id'>): Promise<Course> {
    try {
      const authFetch = this.getAuthFetch();

      // Transform data to match backend expectations
      const requestData = {
        title: courseData.title,
        code: courseData.code,
        description: courseData.description || "",
        academic_year: courseData.academic_year || new Date().getFullYear().toString(),
        education_level: courseData.education_level || "",
        academic_track: courseData.academic_track || null,
        credits: courseData.credits || null,
        syllabus: courseData.syllabus || {},
        learning_objectives: courseData.learning_objectives || [],
        prerequisites: courseData.prerequisites || [],
        ai_tutoring_enabled: courseData.aiGenerated || true,
        ai_tutoring_config: courseData.ai_tutoring_config || {},
        suggested_topics: courseData.topics || [],
        required_materials: courseData.required_materials || {},
        supplementary_resources: courseData.supplementary_resources || {},
        grading_schema: courseData.grading_schema || {},
        assessment_types: courseData.assessment_types || [],
        allow_group_work: courseData.allow_group_work || true,
        peer_review_enabled: courseData.peer_review_enabled || false,
        discussion_enabled: courseData.discussion_enabled || true,
        status: courseData.status || "active",
        department_id: courseData.department_id || null,
        start_date: courseData.start_date || null,
        end_date: courseData.end_date || null,
      };

      // Make sure we're using the correct API endpoint path
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Get error details if possible
        const errorData = await response.json().catch(() => null);
        console.error('Course creation error details:', errorData);
        throw new Error(`Failed to create course: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // Update an existing course
  async updateCourse(courseId: number, courseData: Partial<Course>,): Promise<Course> {
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
  async deleteCourse(courseId: number,): Promise<void> {
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
  },): Promise<{ status: string; message: string; }> {
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
  },): Promise<Course> {
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
  }): Promise<{ status: string; message: string; assessmentId?: number }> {
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
  async sendAIMessage(message: string,): Promise<{
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

  /**
 * Enhanced error handling for API requests
 * @param response The fetch Response object
 * @returns Promise that rejects with an enhanced error containing status code
 */
private async handleApiError(response: Response): Promise<never> {
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;

  try {
    // Try to get a more detailed error message from the response body
    const errorData = await response.json();
    errorMessage = errorData.detail || errorMessage;
  } catch (e) {
    // If we can't parse JSON, just use the status text
  }

  // Create an enhanced error object with status code
  const error = new Error(errorMessage);
  (error as any).statusCode = response.status;

  throw error;
}

  /**
   * Get classes that the professor teaches
   * @returns List of classes the professor is assigned to teach
   */
  async getTeachingClasses(): Promise<{ classes: ClassItem[] }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes`);

      if (!response.ok) {
        return this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teaching classes:', error);
      // Return empty array as fallback to prevent UI breaking
      return { classes: [] };
    }
  }

  /**
   * Get detailed information for a specific class
   * @param classId The ID of the class to fetch
   */
  async getClass(classId: string | number) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}`);

      if (!response.ok) {
        return this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getClass:', error);
      throw error;
    }
  }


/**
 * Get metadata needed for creating or editing a class
 * @returns Class metadata including academic years, education levels, etc.
 */
async getClassMetadata(): Promise<ClassMetadata> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/metadata`);

    if (!response.ok) {
      return this.handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching class metadata:', error);
    // Return empty object as fallback
    return {};
  }
}

/**
 * Create a new class
 * @param classData The class data to create
 * @returns The created class
 */
async createClass(classData: ClassCreateRequest): Promise<ClassItem> {
  try {
    const authFetch = this.getAuthFetch();

    // Format the request according to the API requirements
    const requestData = {
      name: classData.name,
      academic_year: classData.academicYear,
      education_level: classData.educationLevel,
      academic_track: classData.academicTrack || null,
      room_number: classData.roomNumber || null,
      capacity: classData.capacity || null,
      course_id: classData.courseId || null,
      department_id: classData.departmentId || null,
      description: classData.description || null,
    };

    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      return this.handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
}

/**
 * Update an existing class
 * @param classId The ID of the class to update
 * @param classData The class data to update
 * @returns The updated class
 */
async updateClass(classId: number | string, classData: Partial<ClassCreateRequest>): Promise<ClassItem> {
  try {
    const authFetch = this.getAuthFetch();

    // Format the request according to the API requirements
    // Use camelCase to snake_case conversion for API compatibility
    const requestData: Record<string, any> = {};

    if (classData.name !== undefined) requestData.name = classData.name;
    if (classData.academicYear !== undefined) requestData.academic_year = classData.academicYear;
    if (classData.educationLevel !== undefined) requestData.education_level = classData.educationLevel;
    if (classData.academicTrack !== undefined) requestData.academic_track = classData.academicTrack || null;
    if (classData.roomNumber !== undefined) requestData.room_number = classData.roomNumber || null;
    if (classData.capacity !== undefined) requestData.capacity = classData.capacity || null;
    if (classData.courseId !== undefined) requestData.course_id = classData.courseId || null;
    if (classData.departmentId !== undefined) requestData.department_id = classData.departmentId || null;
    if (classData.description !== undefined) requestData.description = classData.description || null;

    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      return this.handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating class ${classId}:`, error);
    throw error;
  }
}

/**
 * Delete a class
 * @param classId The ID of the class to delete
 * @returns Success response
 */
async deleteClass(classId: number | string): Promise<{ success: boolean; message?: string }> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return this.handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting class ${classId}:`, error);
    throw error;
  }
}

/**
 * Get the schedule for a specific class
 * @param classId The ID of the class
 * @returns Class schedule entries
 */
async getClassSchedule(classId: number | string): Promise<Array<any>> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}/schedule`);

    if (!response.ok) {
      return this.handleApiError(response);
    }

    const data = await response.json();
    return data.schedule || [];
  } catch (error) {
    console.error(`Error fetching class schedule for ${classId}:`, error);
    throw error;
  }
}

/**
 * Add a schedule entry to a class
 * @param classId The ID of the class
 * @param scheduleData The schedule data to add
 * @returns The created schedule entry
 */
async addClassSchedule(
  classId: number | string,
  scheduleData: {
    day_of_week: number; // 0-6 (Monday-Sunday)
    start_time: string; // HH:MM format
    end_time: string; // HH:MM format
    room?: string;
    course_id?: number;
    recurring?: boolean;
    color?: string;
  }
): Promise<any> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...scheduleData,
        recurrence_pattern: scheduleData.recurring ? "weekly" : "once",
      }),
    });

    if (!response.ok) {
      return this.handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error adding class schedule for ${classId}:`, error);
    throw error;
  }
}

  /**
   * Get students in a specific class
   * @param classId The ID of the class
   */
  async getClassStudents(classId: string | number) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}/students`);

      if (!response.ok) {
        return this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  }

  /**
   * Get attendance for a specific class
   * @param classId The ID of the class
   * @param date Optional date to filter (ISO format)
   */
  async getClassAttendance(classId: string | number, date?: string) {
    try {
      const authFetch = this.getAuthFetch();
      let url = `${API_BASE_URL}/api/v1/professors/classes/${classId}/attendance`;

      if (date) {
        url += `?date=${date}`;
      }

      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch class attendance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      throw error;
    }
  }

  /**
   * Record attendance for a class
   * @param classId The ID of the class
   * @param attendanceData Attendance data
   */
  async recordAttendance(classId: string | number, attendanceData: {
    date: string;
    records: Array<{
      studentId: number;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }>;
  }) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        throw new Error('Failed to record attendance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }
}

export const ProfessorService = new ProfessorServiceClass();
