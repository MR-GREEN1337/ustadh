// File: services/ProfessorMaterialsService.ts
import { API_BASE_URL } from "@/lib/config";
import fileService from "./FileService";

// Types for the materials
export interface CourseMaterial {
  id: number;
  title: string;
  description: string;
  material_type: MaterialType;
  file_url?: string;
  file_id?: string;
  file_name?: string;
  file_size?: number;
  content_type?: string;
  course_id: number;
  professor_id: number;
  unit?: string;
  sequence?: number;
  tags: string[];
  visibility: "students" | "professors" | "public";
  requires_completion: boolean;
  ai_enhanced: boolean;
  created_at: string;
  updated_at?: string;
}

export type MaterialType =
  | "lecture_notes"
  | "presentation"
  | "worksheet"
  | "example"
  | "reference"
  | "assignment"
  | "exam"
  | "syllabus"
  | "other";

export interface LessonPlan {
  id: number;
  title: string;
  description: string;
  course_id: number;
  objectives: string[];
  content: Record<string, any>;
  resources: Record<string, any>;
  planned_date?: string;
  duration_minutes: number;
  status: "draft" | "ready" | "delivered" | "archived";
  ai_enhanced: boolean;
  file_ids?: string[];
  created_at: string;
  updated_at?: string;
}

export interface MaterialsFilterOptions {
  course_id?: number;
  material_type?: MaterialType;
  search_term?: string;
  visibility?: string;
  ai_enhanced?: boolean;
  page?: number;
  limit?: number;
}

export interface LessonPlansFilterOptions {
  course_id?: number;
  status?: string;
  search_term?: string;
  page?: number;
  limit?: number;
}

class ProfessorMaterialsServiceClass {
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

  // Get all materials with optional filtering
  async getMaterials(filters?: MaterialsFilterOptions): Promise<{ materials: CourseMaterial[], total: number }> {
    try {
      const authFetch = this.getAuthFetch();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.course_id) queryParams.append('course_id', filters.course_id.toString());
        if (filters.material_type) queryParams.append('material_type', filters.material_type);
        if (filters.search_term) queryParams.append('search_term', filters.search_term);
        if (filters.visibility) queryParams.append('visibility', filters.visibility);
        if (filters.ai_enhanced !== undefined) queryParams.append('ai_enhanced', filters.ai_enhanced.toString());
        if (filters.page) queryParams.append('page', filters.page.toString());
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  }

  // Get a single material by ID
  async getMaterial(id: number): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch material');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching material:', error);
      throw error;
    }
  }

  // Create a new material
  async createMaterial(material: Omit<CourseMaterial, 'id' | 'created_at' | 'updated_at'>, file?: File): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();

      // If there's a file, upload it first
      if (file) {
        const uploadResponse = await fileService.uploadFile(
          file,
          undefined,
          'course_material',
          material.course_id.toString(),
          material.visibility === 'public'
        );

        // Update material with file info
        material.file_url = uploadResponse.url;
        material.file_id = uploadResponse.id;
        material.file_name = uploadResponse.fileName;
        material.file_size = uploadResponse.size;
        material.content_type = uploadResponse.contentType;
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(material),
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

  // Update an existing material
  async updateMaterial(id: number, material: Partial<CourseMaterial>, file?: File): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();

      // If there's a new file, upload it first
      if (file) {
        const uploadResponse = await fileService.uploadFile(
          file,
          undefined,
          'course_material',
          material.course_id?.toString() || id.toString(),
          material.visibility === 'public'
        );

        // Update material with file info
        material.file_url = uploadResponse.url;
        material.file_id = uploadResponse.id;
        material.file_name = uploadResponse.fileName;
        material.file_size = uploadResponse.size;
        material.content_type = uploadResponse.contentType;
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(material),
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

  // Delete a material
  async deleteMaterial(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${id}`, {
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

  // Enhance material with AI
  async enhanceMaterial(id: number, options?: { improve_content?: boolean, generate_questions?: boolean, create_summary?: boolean }): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/materials/${id}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || { improve_content: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance material with AI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error enhancing material:', error);
      throw error;
    }
  }

  // Get all lesson plans with optional filtering
  async getLessonPlans(filters?: LessonPlansFilterOptions): Promise<{ lesson_plans: LessonPlan[], total: number }> {
    try {
      const authFetch = this.getAuthFetch();

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.course_id) queryParams.append('course_id', filters.course_id.toString());
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.search_term) queryParams.append('search_term', filters.search_term);
        if (filters.page) queryParams.append('page', filters.page.toString());
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch lesson plans');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      throw error;
    }
  }

  // Get a single lesson plan by ID
  async getLessonPlan(id: number): Promise<LessonPlan> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch lesson plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson plan:', error);
      throw error;
    }
  }

  // Create a new lesson plan
  async createLessonPlan(lessonPlan: Omit<LessonPlan, 'id' | 'created_at' | 'updated_at'>, files?: File[]): Promise<LessonPlan> {
    try {
      const authFetch = this.getAuthFetch();

      // If there are files, upload them first
      if (files && files.length > 0) {
        const uploadPromises = files.map(file =>
          fileService.uploadFile(
            file,
            undefined,
            'lesson_plan',
            lessonPlan.course_id.toString()
          )
        );

        const uploadResponses = await Promise.all(uploadPromises);

        // Add file IDs to the lesson plan
        lessonPlan.file_ids = uploadResponses.map(response => response.id).filter(Boolean) as string[];
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonPlan),
      });

      if (!response.ok) {
        throw new Error('Failed to create lesson plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      throw error;
    }
  }

  // Update an existing lesson plan
  async updateLessonPlan(id: number, lessonPlan: Partial<LessonPlan>, newFiles?: File[]): Promise<LessonPlan> {
    try {
      const authFetch = this.getAuthFetch();

      // If there are new files, upload them first
      if (newFiles && newFiles.length > 0) {
        const uploadPromises = newFiles.map(file =>
          fileService.uploadFile(
            file,
            undefined,
            'lesson_plan',
            lessonPlan.course_id?.toString() || id.toString()
          )
        );

        const uploadResponses = await Promise.all(uploadPromises);
        const newFileIds = uploadResponses.map(response => response.id).filter(Boolean) as string[];

        // Merge with existing file IDs if any
        if (lessonPlan.file_ids && lessonPlan.file_ids.length > 0) {
          lessonPlan.file_ids = [...lessonPlan.file_ids, ...newFileIds];
        } else {
          lessonPlan.file_ids = newFileIds;
        }
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonPlan),
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      throw error;
    }
  }

  // Delete a lesson plan
  async deleteLessonPlan(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      throw error;
    }
  }

  // Generate lesson plan with AI
  async generateLessonPlan(courseId: number, options: {
    topic: string;
    duration_minutes: number;
    difficulty_level?: string;
    learning_objectives?: string[];
    include_activities?: boolean;
    include_resources?: boolean;
  }): Promise<LessonPlan> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/professors/lesson-plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan with AI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      throw error;
    }
  }
}

export const ProfessorMaterialsService = new ProfessorMaterialsServiceClass();
export default ProfessorMaterialsService;
