import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  FileText,
  Sparkles,
  ListChecks,
  Brain,
  X
} from 'lucide-react';

import { API_BASE_URL } from "@/lib/config";
import fileService from "./FileService";

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

export interface ProfessorClassCoursesData {
  course_ids: number[];
  academic_year: string;
  term?: string;
  is_primary_instructor?: boolean;
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
 * Assign multiple courses to a professor for a specific class
 * @param classId The ID of the class
 * @param assignmentData The course assignment data
 * @returns The created or updated assignment
 */
  async assignCoursesToClass(
    classId: number | string,
    assignmentData: ProfessorClassCoursesData
  ): Promise<any> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        return this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error assigning courses to class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple courses assigned to a professor for a specific class
   * @param classId The ID of the class
   * @returns The assignment data
   */
  async getClassCoursesAssignment(classId: number | string): Promise<any> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/classes/${classId}/courses`);

      if (!response.ok) {
        if (response.status === 404) {
          // No assignments found - return empty array
          return { course_ids: [] };
        }
        return this.handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting course assignments for class ${classId}:`, error);
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

  // ---- Add these methods to the ProfessorServiceClass ----

/**
 * Get materials for a course or filter by various criteria
 * @param params Optional filter parameters
 * @returns List of materials and pagination info
 */
async getMaterials(params?: {
  course_id?: number | string;
  material_type?: string;
  search_term?: string;
  visibility?: string;
  ai_enhanced?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  materials: Array<{
    id: number;
    title: string;
    description: string;
    material_type: string;
    content: Record<string, any>;
    course_id: number;
    professor_id: number;
    unit?: string;
    sequence?: number;
    tags: string[];
    visibility: string;
    requires_completion: boolean;
    ai_enhanced: boolean;
    created_at: string;
    updated_at?: string;
    file_id?: number;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    content_type?: string;
    thumbnail_url?: string;
  }>;
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const authFetch = this.getAuthFetch();

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.course_id) queryParams.append('course_id', params.course_id.toString());
    if (params?.material_type) queryParams.append('material_type', params.material_type);
    if (params?.search_term) queryParams.append('search_term', params.search_term);
    if (params?.visibility) queryParams.append('visibility', params.visibility);
    if (params?.ai_enhanced !== undefined) queryParams.append('ai_enhanced', params.ai_enhanced.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials${queryString}`);

    if (!response.ok) {
      throw new Error('Failed to fetch materials');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }
}

/**
 * Get a specific material by ID
 * @param materialId The ID of the material to fetch
 * @returns The material details
 */
async getMaterial(materialId: number | string): Promise<any> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${materialId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching material:', error);
    throw error;
  }
}

/**
 * Create a new course material
 * @param materialData The material data to create
 * @returns The created material
 */
async createMaterial(materialData: {
  title: string;
  description: string;
  material_type: string;
  course_id: number;
  content?: Record<string, any>;
  unit?: string;
  sequence?: number;
  tags?: string[];
  visibility?: string;
  requires_completion?: boolean;
  ai_enhanced?: boolean;
}): Promise<any> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) {
      throw new Error('Failed to create material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating material:', error);
    throw error;
  }
}

/**
 * Update an existing course material
 * @param materialId The ID of the material to update
 * @param materialData The material data to update
 * @returns The updated material
 */
async updateMaterial(materialId: number | string, materialData: Partial<{
  title: string;
  description: string;
  material_type: string;
  course_id: number;
  content: Record<string, any>;
  unit: string;
  sequence: number;
  tags: string[];
  visibility: string;
  requires_completion: boolean;
  ai_enhanced: boolean;
}>): Promise<any> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${materialId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) {
      throw new Error('Failed to update material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
}

/**
 * Delete a course material
 * @param materialId The ID of the material to delete
 * @returns Success response
 */
async deleteMaterial(materialId: number | string): Promise<{ success: boolean; message?: string }> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${materialId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
}

/**
 * Generate course materials with AI based on the course content
 * @param courseId The ID of the course
 * @param options Generation options
 * @returns The generated materials
 */
async generateMaterials(courseId: number | string, options: {
  material_types: Array<'lecture_notes' | 'presentation' | 'worksheet' | 'example' | 'reference'>;
  for_weeks?: number[];
  for_topics?: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  include_exercises?: boolean;
}): Promise<{ materials: any[]; message: string }> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/generate-materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to generate materials');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating materials:', error);
    throw error;
  }
}

/**
 * Get course students - for displaying in material access controls
 * @param courseId The ID of the course
 * @returns List of enrolled students
 */
async getCourseStudents(courseId: number | string): Promise<{
  students: Array<{
    id: number;
    name: string;
    enrollment_date: string;
    status: string;
    grade?: number;
    attendance?: number;
  }>
}> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/students`);

    if (!response.ok) {
      throw new Error('Failed to fetch course students');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching course students:', error);
    throw error;
  }
}

/**
 * Upload a file as a course material using the FileService
 * @param courseId Course ID
 * @param fileData Material and file data
 * @returns The created material with file information
 */
async uploadMaterialFile(
  courseId: number | string,
  fileData: {
    file: File;
    title: string;
    description: string;
    material_type: string;
    visibility?: string;
    unit?: string;
    tags?: string[];
  }
): Promise<any> {
  try {
    // Step 1: Upload the file using the FileService
    const fileOptions: any = {
      reference_id: `course_${courseId}`,
      course_id: Number(courseId),
      sharing_level: fileData.visibility === 'public' ? 'public' : 'course',
      metadata: {
        material_type: fileData.material_type,
        unit: fileData.unit || null,
        tags: fileData.tags || []
      }
    };

    // Upload the file
    const uploadResponse = await fileService.uploadFile(
      fileData.file,
      undefined, // No session ID
      'course_material', // Category
      `course_${courseId}`, // Reference ID
      fileData.visibility === 'public', // Is public
      fileOptions // Additional options
    );

    // Step 2: Create the material with the uploaded file's information
    const materialData = {
      title: fileData.title,
      description: fileData.description,
      material_type: fileData.material_type,
      course_id: courseId,
      unit: fileData.unit,
      tags: fileData.tags,
      visibility: fileData.visibility || 'students',
      file_id: uploadResponse.id
    };

    // Create the material
    const material = await this.createMaterial(materialData);

    // Step 3: Update the file reference to point to the newly created material
    await fileService.updateFile(uploadResponse.id, {
      metadata: {
        ...uploadResponse.metadata,
        material_id: material.id
      }
    });

    // Return the created material with file info
    return {
      ...material,
      file_url: uploadResponse.url,
      file_name: uploadResponse.fileName,
      file_size: uploadResponse.size,
      content_type: uploadResponse.contentType,
      thumbnail_url: uploadResponse.metadata?.thumbnail_url
    };
  } catch (error) {
    console.error('Error uploading material file:', error);
    throw error;
  }
}

/**
 * Get files for a course that can be attached to materials
 * @param courseId Course ID
 * @param params Optional filter parameters
 * @returns List of files for the course
 */
async getCourseFiles(
  courseId: number | string,
  params?: {
    material_type?: string;
    search_term?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  files: Array<{
    id: number;
    fileName: string;
    contentType: string;
    url: string;
    size: number;
    createdAt: string;
    fileCategory: string;
  }>;
  total: number;
  page: number;
  limit: number;
}> {
  try {
    // Use fileService to list files with the course reference ID
    const response = await fileService.listFiles(
      'course_material',
      undefined, // No session ID
      `course_${courseId}`, // Reference ID
      params?.page,
      params?.limit
    );

    // Filter files by material type if needed
    let filteredFiles = response.files;
    if (params?.material_type) {
      filteredFiles = filteredFiles.filter(
        file => file.metadata?.material_type === params.material_type
      );
    }

    // Filter by search term if provided
    if (params?.search_term) {
      const term = params.search_term.toLowerCase();
      filteredFiles = filteredFiles.filter(file =>
        file.fileName.toLowerCase().includes(term) ||
        (file.metadata?.description || '').toLowerCase().includes(term)
      );
    }

    return {
      files: filteredFiles,
      total: filteredFiles.length,
      page: params?.page || 1,
      limit: params?.limit || 20
    };
  } catch (error) {
    console.error('Error fetching course files:', error);
    throw error;
  }
}

/**
 * Download a material's file using FileService
 * @param materialId Material ID
 * @returns URL to download the file
 */
async downloadMaterialFile(materialId: number | string): Promise<{ url: string; fileName: string; contentType: string }> {
  try {
    // First, get the material to find its file ID
    const material = await this.getMaterial(materialId);

    if (!material.file_id) {
      throw new Error('No file attached to this material');
    }

    // Use fileService to get the download URL
    const downloadInfo = await fileService.getDownloadUrl(material.file_id);

    return downloadInfo;
  } catch (error) {
    console.error('Error downloading material file:', error);
    throw error;
  }
}

/**
 * Attach an existing file to a course material
 * @param materialId Material ID
 * @param fileId File ID to attach
 * @param replaceExisting Whether to replace existing file
 * @returns Updated material with file info
 */
async attachFileToMaterial(
  materialId: number | string,
  fileId: number | string,
  replaceExisting: boolean = true
): Promise<any> {
  try {
    // Get file details to ensure it exists
    const file = await fileService.getFile(Number(fileId));

    // Attach the file to the material using the API endpoint
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${materialId}/attach-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        replace_existing: replaceExisting
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to attach file to material');
    }

    // Update the file metadata to reference this material
    await fileService.updateFile(Number(fileId), {
      metadata: {
        ...file.metadata,
        material_id: materialId
      }
    });

    return await response.json();
  } catch (error) {
    console.error('Error attaching file to material:', error);
    throw error;
  }
}

/**
 * Delete a material and its associated file
 * @param materialId Material ID to delete
 * @param deleteFile Whether to also delete the associated file
 * @returns Success response
 */
async deleteMaterialWithFile(
  materialId: number | string,
  deleteFile: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    // First, get the material to find its file ID
    const material = await this.getMaterial(materialId);
    const fileId = material.file_id;

    // Delete the material through the API
    const deleteResponse = await this.deleteMaterial(materialId);

    // If requested and a file exists, delete it too
    if (deleteFile && fileId) {
      try {
        await fileService.deleteFile(fileId);
      } catch (fileError) {
        console.error('Error deleting associated file:', fileError);
        // Continue even if file deletion fails
      }
    }

    return deleteResponse;
  } catch (error) {
    console.error('Error deleting material with file:', error);
    throw error;
  }
}

/**
 * Share material files with specific users or groups
 * @param materialIds Material IDs to share
 * @param options Sharing options
 * @returns Success response
 */
async shareMaterialFiles(
  materialIds: (number | string)[],
  options: {
    sharing_level?: 'private' | 'shared' | 'course' | 'department' | 'school' | 'public';
    shared_with?: Array<{id: string|number, type: string}>;
    course_id?: number;
    department_id?: number;
    school_id?: number;
    expires_after_days?: number;
  }
): Promise<{ success: boolean; processed: number; failed: number; failures?: Record<string, string>; }> {
  try {
    // Get file IDs for all materials
    const fileIds: number[] = [];

    // Collect all file IDs
    for (const materialId of materialIds) {
      try {
        const material = await this.getMaterial(materialId);
        if (material.file_id) {
          fileIds.push(material.file_id);
        }
      } catch (error) {
        console.error(`Error getting material ${materialId}:`, error);
        // Continue with other materials even if one fails
      }
    }

    if (fileIds.length === 0) {
      return {
        success: false,
        processed: 0,
        failed: materialIds.length,
        failures: { general: 'No valid files found in the materials' }
      };
    }

    // Use batch action to share all files at once
    const result = await fileService.batchAction(
      fileIds,
      'share',
      options as Record<string, any>
    );

    return result;
  } catch (error) {
    console.error('Error sharing material files:', error);
    throw error;
  }
}


/**
 * Generate course materials with AI based on course content
 * @param courseId The course ID
 * @param options Generation options
 * @returns The generated materials
 */
async generateCourseMaterials(
  courseId: number | string,
  options: {
    material_types: Array<'lecture_notes' | 'presentation' | 'worksheet' | 'example' | 'reference'>;
    for_weeks?: number[];
    for_topics?: string[];
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    include_exercises?: boolean;
  }
): Promise<{
  materials: any[];
  message: string;
}> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/generate-materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to generate materials');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating materials:', error);
    throw error;
  }
}

/**
 * Enhance existing material with AI
 * @param materialId Material ID to enhance
 * @param options Enhancement options
 * @returns The enhanced material
 */
async enhanceMaterialWithAI(
  materialId: number | string,
  options: {
    improve_content?: boolean;
    generate_questions?: boolean;
    create_summary?: boolean;
  }
): Promise<any> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${materialId}/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to enhance material with AI');
    }

    return await response.json();
  } catch (error) {
    console.error('Error enhancing material with AI:', error);
    throw error;
  }
}

/**
 * Generate a syllabus for a course using AI
 * @param courseId Course ID
 * @param options Syllabus generation options
 * @returns The generated syllabus
 */
async generateCourseSyllabus(
  courseId: number | string,
  options: {
    syllabus_type: 'weekly' | 'topics' | 'modules';
    duration_weeks?: number;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    specific_topics?: string[];
    follow_standards?: boolean;
    include_assessments?: boolean;
  }
): Promise<{
  syllabus: {
    weeks?: Array<{
      week: number;
      title: string;
      topics: string[];
      assessments?: string[];
      learning_objectives?: string[];
    }>;
    topics?: string[];
    modules?: Array<{
      title: string;
      description: string;
      topics: string[];
      duration_weeks: number;
    }>;
  };
  message: string;
}> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/generate-syllabus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to generate syllabus');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating syllabus:', error);
    throw error;
  }
}

/**
 * Generate AI-powered assessment materials for a course
 * @param courseId Course ID
 * @param options Assessment generation options
 * @returns The generated assessments
 */
async generateCourseAssessments(
  courseId: number | string,
  options: {
    assessment_type: 'quiz' | 'exam' | 'assignment' | 'project';
    for_topic?: string;
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    num_questions?: number;
    include_solutions?: boolean;
    include_rubric?: boolean;
  }
): Promise<{
  assessment: {
    title: string;
    description: string;
    questions?: Array<{
      question: string;
      type: 'multiple_choice' | 'short_answer' | 'essay' | 'problem';
      options?: string[];
      correct_answer?: string | number;
      points: number;
      solution?: string;
    }>;
    rubric?: Record<string, any>;
    instructions?: string;
    duration_minutes?: number;
    passing_score?: number;
  };
  message: string;
}> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/generate-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to generate assessment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating assessment:', error);
    throw error;
  }
}

/**
 * Get AI suggestions for improving a course or its materials
 * @param courseId Course ID
 * @returns Array of improvement suggestions
 */
async getAICourseSuggestions(
  courseId: number | string
): Promise<Array<{
  id: number;
  title: string;
  description: string;
  type: 'objectives' | 'syllabus' | 'materials' | 'assessments' | 'prerequisites';
  preview: string;
  confidence: number;
}>> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${API_BASE_URL}/api/v1/professors/courses/${courseId}/ai-suggestions`);

    if (!response.ok) {
      throw new Error('Failed to get AI suggestions');
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error getting AI course suggestions:', error);
    return [];
  }
}

}

export const ProfessorService = new ProfessorServiceClass();

/**
 * Create an AI material generation component to add to your course detail page
 * This component includes:
 * - AI syllabus generator
 * - Material generator
 * - Assessment generator
 */
const AIMaterialGeneration = ({ courseId, onGenerationComplete }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'syllabus' | 'materials' | 'assessments'>('materials');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  // Options for materials generation
  const [materialOptions, setMaterialOptions] = useState({
    material_types: ['lecture_notes'],
    difficulty_level: 'intermediate',
    include_exercises: true,
  });

  // Options for syllabus generation
  const [syllabusOptions, setSyllabusOptions] = useState({
    syllabus_type: 'weekly',
    duration_weeks: 12,
    difficulty_level: 'intermediate',
    include_assessments: true,
  });

  // Options for assessment generation
  const [assessmentOptions, setAssessmentOptions] = useState({
    assessment_type: 'quiz',
    difficulty_level: 'intermediate',
    num_questions: 10,
    include_solutions: true,
    include_rubric: true,
  });

  const handleMaterialGeneration = async () => {
    try {
      setIsGenerating(true);
      setProgress(10);

      // Simulate progress (in a real implementation, you'd get progress updates from backend)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 1000);

      // Call ProfessorService to generate materials
      const result = await ProfessorService.generateCourseMaterials(courseId, materialOptions);

      // Clear interval and set complete
      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);

      // Notify parent component
      if (onGenerationComplete) {
        onGenerationComplete(result);
      }

      // Show success message
      toast.success(t("materialsGenerated", { count: result.materials.length }));
    } catch (error) {
      console.error("Error generating materials:", error);
      toast.error(t("errorGeneratingMaterials"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyllabusGeneration = async () => {
    try {
      setIsGenerating(true);
      setProgress(10);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 8);
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 1200);

      // Call ProfessorService to generate syllabus
      const result = await ProfessorService.generateCourseSyllabus(courseId, syllabusOptions);

      // Clear interval and set complete
      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);

      // Notify parent component
      if (onGenerationComplete) {
        onGenerationComplete(result);
      }

      // Show success message
      toast.success(t("syllabusGenerated"));
    } catch (error) {
      console.error("Error generating syllabus:", error);
      toast.error(t("errorGeneratingSyllabus"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAssessmentGeneration = async () => {
    try {
      setIsGenerating(true);
      setProgress(10);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 12);
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 800);

      // Call ProfessorService to generate assessment
      const result = await ProfessorService.generateCourseAssessments(courseId, assessmentOptions);

      // Clear interval and set complete
      clearInterval(progressInterval);
      setProgress(100);
      setResult(result);

      // Notify parent component
      if (onGenerationComplete) {
        onGenerationComplete(result);
      }

      // Show success message
      toast.success(t("assessmentGenerated"));
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast.error(t("errorGeneratingAssessment"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-primary" />
          <CardTitle>{t("aiContentGenerator")}</CardTitle>
        </div>
        <CardDescription>
          {t("aiContentGeneratorDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={mode} onValueChange={(value) => setMode(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="materials" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {t("materials")}
            </TabsTrigger>
            <TabsTrigger value="syllabus" className="flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              {t("syllabus")}
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              {t("assessments")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("materialTypes")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['lecture_notes', 'presentation', 'worksheet', 'example', 'reference'].map(type => (
                    <Badge
                      key={type}
                      variant={materialOptions.material_types.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const types = materialOptions.material_types.includes(type)
                          ? materialOptions.material_types.filter(t => t !== type)
                          : [...materialOptions.material_types, type];

                        setMaterialOptions({
                          ...materialOptions,
                          material_types: types.length ? types : ['lecture_notes']
                        });
                      }}
                    >
                      {t(type)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("difficulty")}
                </label>
                <Select
                  value={materialOptions.difficulty_level}
                  onValueChange={(value) => setMaterialOptions({
                    ...materialOptions,
                    difficulty_level: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t("beginner")}</SelectItem>
                    <SelectItem value="intermediate">{t("intermediate")}</SelectItem>
                    <SelectItem value="advanced">{t("advanced")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-exercises"
                  checked={materialOptions.include_exercises}
                  onCheckedChange={(checked) => setMaterialOptions({
                    ...materialOptions,
                    include_exercises: !!checked
                  })}
                />
                <label
                  htmlFor="include-exercises"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeExercises")}
                </label>
              </div>

              <Button
                className="w-full"
                disabled={isGenerating}
                onClick={handleMaterialGeneration}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("generateMaterials")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="syllabus">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("syllabusType")}
                </label>
                <Select
                  value={syllabusOptions.syllabus_type}
                  onValueChange={(value: any) => setSyllabusOptions({
                    ...syllabusOptions,
                    syllabus_type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t("weeklySchedule")}</SelectItem>
                    <SelectItem value="topics">{t("topicBased")}</SelectItem>
                    <SelectItem value="modules">{t("moduleBased")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("durationWeeks")}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={syllabusOptions.duration_weeks}
                  onChange={(e) => setSyllabusOptions({
                    ...syllabusOptions,
                    duration_weeks: parseInt(e.target.value) || 12
                  })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("difficulty")}
                </label>
                <Select
                  value={syllabusOptions.difficulty_level}
                  onValueChange={(value) => setSyllabusOptions({
                    ...syllabusOptions,
                    difficulty_level: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t("beginner")}</SelectItem>
                    <SelectItem value="intermediate">{t("intermediate")}</SelectItem>
                    <SelectItem value="advanced">{t("advanced")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-assessments"
                  checked={syllabusOptions.include_assessments}
                  onCheckedChange={(checked) => setSyllabusOptions({
                    ...syllabusOptions,
                    include_assessments: !!checked
                  })}
                />
                <label
                  htmlFor="include-assessments"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeAssessments")}
                </label>
              </div>

              <Button
                className="w-full"
                disabled={isGenerating}
                onClick={handleSyllabusGeneration}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("generateSyllabus")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="assessments">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("assessmentType")}
                </label>
                <Select
                  value={assessmentOptions.assessment_type}
                  onValueChange={(value: any) => setAssessmentOptions({
                    ...assessmentOptions,
                    assessment_type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">{t("quiz")}</SelectItem>
                    <SelectItem value="exam">{t("exam")}</SelectItem>
                    <SelectItem value="assignment">{t("assignment")}</SelectItem>
                    <SelectItem value="project">{t("project")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("numberOfQuestions")}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={assessmentOptions.num_questions}
                  onChange={(e) => setAssessmentOptions({
                    ...assessmentOptions,
                    num_questions: parseInt(e.target.value) || 10
                  })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("difficulty")}
                </label>
                <Select
                  value={assessmentOptions.difficulty_level}
                  onValueChange={(value) => setAssessmentOptions({
                    ...assessmentOptions,
                    difficulty_level: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t("beginner")}</SelectItem>
                    <SelectItem value="intermediate">{t("intermediate")}</SelectItem>
                    <SelectItem value="advanced">{t("advanced")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-solutions"
                  checked={assessmentOptions.include_solutions}
                  onCheckedChange={(checked) => setAssessmentOptions({
                    ...assessmentOptions,
                    include_solutions: !!checked
                  })}
                />
                <label
                  htmlFor="include-solutions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeSolutions")}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-rubric"
                  checked={assessmentOptions.include_rubric}
                  onCheckedChange={(checked) => setAssessmentOptions({
                    ...assessmentOptions,
                    include_rubric: !!checked
                  })}
                />
                <label
                  htmlFor="include-rubric"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeRubric")}
                </label>
              </div>

              <Button
                className="w-full"
                disabled={isGenerating}
                onClick={handleAssessmentGeneration}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("generateAssessment")}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {isGenerating && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("generating")}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {result && !isGenerating && (
          <div className="mt-4 rounded-lg border p-4 bg-secondary/10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{t("generationResults")}</h4>
              <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {mode === 'materials' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("materialsGeneratedDesc", { count: result.materials?.length || 0 })}
                </p>
                <ul className="space-y-1">
                  {result.materials?.map((material, index) => (
                    <li key={index} className="text-sm flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      {material.title}
                    </li>
                  ))}
                </ul>
                <Button size="sm" className="mt-2">
                  {t("viewAllMaterials")}
                </Button>
              </div>
            )}

            {mode === 'syllabus' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("syllabusGeneratedDesc")}
                </p>
                <div className="max-h-40 overflow-y-auto text-sm">
                  {result.syllabus?.weeks && (
                    <ul className="space-y-1">
                      {result.syllabus.weeks.map((week, index) => (
                        <li key={index}>
                          <span className="font-medium">{week.title}: </span>
                          {week.topics.slice(0, 2).join(', ')}
                          {week.topics.length > 2 && '...'}
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.syllabus?.topics && (
                    <ul className="space-y-1">
                      {result.syllabus.topics.slice(0, 5).map((topic, index) => (
                        <li key={index}>{topic}</li>
                      ))}
                      {result.syllabus.topics.length > 5 && (
                        <li>+ {result.syllabus.topics.length - 5} more topics</li>
                      )}
                    </ul>
                  )}
                </div>
                <Button size="sm" className="mt-2">
                  {t("applySyllabus")}
                </Button>
              </div>
            )}

            {mode === 'assessments' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("assessmentGeneratedDesc")}
                </p>
                <div className="font-medium text-sm">{result.assessment?.title}</div>
                <div className="text-sm">{result.assessment?.description}</div>

                {result.assessment?.questions && (
                  <div className="max-h-40 overflow-y-auto mt-2">
                    <p className="text-sm font-medium">{t("sampleQuestions")}:</p>
                    <ul className="space-y-1 text-sm">
                      {result.assessment.questions.slice(0, 3).map((q, index) => (
                        <li key={index} className="text-xs">{q.question}</li>
                      ))}
                      {result.assessment.questions.length > 3 && (
                        <li className="text-xs italic">+ {result.assessment.questions.length - 3} more questions</li>
                      )}
                    </ul>
                  </div>
                )}

                <Button size="sm" className="mt-2">
                  {t("createAssessment")}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { AIMaterialGeneration };
