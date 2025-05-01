import { API_BASE_URL } from "@/lib/config";
import fileService from "./FileService";

// Types for the materials
export interface CourseMaterial {
  id: number;
  title: string;
  description: string;
  material_type: MaterialType;
  content: Record<string, any>;
  file_id?: number;
  // File properties from associated file
  file_url?: string;
  file_name?: string;
  file_size?: number;
  content_type?: string;
  thumbnail_url?: string;
  course_id: number;
  professor_id: number;
  unit?: string;
  sequence?: number;
  tags: string[];
  visibility: "students" | "professors" | "public";
  requires_completion: boolean;
  ai_enhanced: boolean;
  ai_features?: Record<string, any>;
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
  file_ids?: number[];
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

export interface EnhancementOptions {
  improve_content?: boolean;
  generate_questions?: boolean;
  create_summary?: boolean;
}

export interface AttachFileOptions {
  file_id: number;
  replace_existing?: boolean;
  update_sharing?: boolean;
}

class ProfessorMaterialsServiceClass {
  private readonly API_BASE = `${API_BASE_URL}/api/v1/professors`;

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

  /**
   * Get all materials with optional filtering
   * @param filters Optional filter criteria
   * @returns Promise with materials and total count
   */
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

      const response = await authFetch(`${this.API_BASE}/materials?${queryParams.toString()}`);

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
   * Get a single material by ID
   * @param id Material ID
   * @returns Promise with material details
   */
  async getMaterial(id: number): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/materials/${id}`);

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
   * Create a new material
   * @param material Material data
   * @param file Optional file to attach
   * @returns Promise with created material
   */
  async createMaterial(
    material: Omit<CourseMaterial, 'id' | 'professor_id' | 'created_at' | 'updated_at' | 'ai_enhanced'>,
    file?: File
  ): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();

      // First create the material entry
      const materialResponse = await authFetch(`${this.API_BASE}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(material),
      });

      if (!materialResponse.ok) {
        const errorData = await materialResponse.json();
        throw new Error(errorData.detail || 'Failed to create material');
      }

      const createdMaterial = await materialResponse.json();

      // If there's a file, upload and attach it
      if (file) {
        try {
          // Upload the file
          const uploadOptions = {
            course_id: material.course_id,
            sharing_level: material.visibility === 'public' ? 'public' :
                          material.visibility === 'professors' ? 'department' : 'course',
            metadata: {
              material_type: material.material_type,
              material_id: createdMaterial.id,
            }
          };

          const uploadResponse = await fileService.uploadFile(
            file,
            undefined,
            'course_material',
            createdMaterial.id.toString(),
            material.visibility === 'public',
            uploadOptions as any
          );

          // Attach the file to the material
          if (uploadResponse && uploadResponse.id) {
            const attachResponse = await authFetch(`${this.API_BASE}/materials/${createdMaterial.id}/attach-file`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                file_id: uploadResponse.id,
                update_sharing: true,
              }),
            });

            if (attachResponse.ok) {
              // Get updated material with file info
              return await attachResponse.json();
            }
          }
        } catch (fileError) {
          console.error('Error handling file upload:', fileError);
          // Continue with the material creation even if file upload fails
        }
      }

      return createdMaterial;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  /**
   * Update an existing material
   * @param id Material ID
   * @param material Updated material data
   * @param file Optional new file to attach
   * @returns Promise with updated material
   */
  async updateMaterial(
    id: number,
    material: Partial<CourseMaterial>,
    file?: File
  ): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();

      // Update the material data
      const updateResponse = await authFetch(`${this.API_BASE}/materials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(material),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.detail || 'Failed to update material');
      }

      const updatedMaterial = await updateResponse.json();

      // If there's a new file, upload and attach it
      if (file) {
        try {
          // Upload the new file
          const uploadOptions = {
            course_id: material.course_id || updatedMaterial.course_id,
            sharing_level: material.visibility === 'public' ? 'public' :
                          material.visibility === 'professors' ? 'department' : 'course',
            metadata: {
              material_type: material.material_type || updatedMaterial.material_type,
              material_id: id,
            }
          };

          const uploadResponse = await fileService.uploadFile(
            file,
            undefined,
            'course_material',
            id.toString(),
            material.visibility === 'public' || updatedMaterial.visibility === 'public',
            uploadOptions as any
          );

          // Attach the file to the material, replacing any existing one
          if (uploadResponse && uploadResponse.id) {
            const attachResponse = await authFetch(`${this.API_BASE}/materials/${id}/attach-file`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                file_id: uploadResponse.id,
                replace_existing: true,
                update_sharing: true,
              }),
            });

            if (attachResponse.ok) {
              // Get updated material with file info
              return await attachResponse.json();
            }
          }
        } catch (fileError) {
          console.error('Error handling file upload during update:', fileError);
          // Continue with the material update even if file upload fails
        }
      }

      return updatedMaterial;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  /**
   * Delete a material
   * @param id Material ID
   * @returns Promise with deletion status
   */
  async deleteMaterial(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/materials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete material');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  /**
   * Enhance material with AI
   * @param id Material ID
   * @param options Enhancement options
   * @returns Promise with enhanced material
   */
  async enhanceMaterial(
    id: number,
    options: EnhancementOptions = { improve_content: true }
  ): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/materials/${id}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to enhance material with AI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error enhancing material:', error);
      throw error;
    }
  }

  /**
   * Attach a file to a material
   * @param materialId Material ID
   * @param options Attachment options
   * @returns Promise with updated material
   */
  async attachFile(
    materialId: number,
    options: AttachFileOptions
  ): Promise<CourseMaterial> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/materials/${materialId}/attach-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to attach file to material');
      }

      return await response.json();
    } catch (error) {
      console.error('Error attaching file to material:', error);
      throw error;
    }
  }

  /**
   * Get all lesson plans with optional filtering
   * @param filters Optional filter criteria
   * @returns Promise with lesson plans and total count
   */
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

      const response = await authFetch(`${this.API_BASE}/lesson-plans?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch lesson plans');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      throw error;
    }
  }

  /**
   * Get a single lesson plan by ID
   * @param id Lesson plan ID
   * @returns Promise with lesson plan details
   */
  async getLessonPlan(id: number): Promise<LessonPlan> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_BASE}/lesson-plans/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch lesson plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson plan:', error);
      throw error;
    }
  }

  /**
   * Create a new lesson plan
   * @param lessonPlan Lesson plan data
   * @param files Optional files to attach
   * @returns Promise with created lesson plan
   */
  async createLessonPlan(
    lessonPlan: Omit<LessonPlan, 'id' | 'created_at' | 'updated_at'>,
    files?: File[]
  ): Promise<LessonPlan> {
    try {
      const authFetch = this.getAuthFetch();

      // If there are files, upload them first
      let fileIds: number[] = [];
      if (files && files.length > 0) {
        try {
          const uploadPromises = files.map(file =>
            fileService.uploadFile(
              file,
              undefined,
              'lesson_plan',
              undefined,
              false,
              {
                course_id: lessonPlan.course_id,
                sharing_level: 'course',
                metadata: {
                  lesson_plan_title: lessonPlan.title,
                }
              }
            )
          );

          const uploadResponses = await Promise.all(uploadPromises);
          fileIds = uploadResponses.map(response => response.id).filter(Boolean) as number[];

          // Add file IDs to the lesson plan
          lessonPlan.file_ids = fileIds;
        } catch (fileError) {
          console.error('Error uploading lesson plan files:', fileError);
          // Continue without files if upload fails
        }
      }

      const response = await authFetch(`${this.API_BASE}/lesson-plans`, {
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

/**
   * Update an existing lesson plan
   * @param id Lesson plan ID
   * @param lessonPlan Updated lesson plan data
   * @param newFiles Optional new files to attach
   * @returns Promise with updated lesson plan
   */
async updateLessonPlan(
  id: number,
  lessonPlan: Partial<LessonPlan>,
  newFiles?: File[]
): Promise<LessonPlan> {
  try {
    const authFetch = this.getAuthFetch();

    // If there are new files, upload them first
    if (newFiles && newFiles.length > 0) {
      try {
        const uploadPromises = newFiles.map(file =>
          fileService.uploadFile(
            file,
            undefined,
            'lesson_plan',
            id.toString(),
            false,
            {
              course_id: lessonPlan.course_id || id,
              sharing_level: 'course',
              metadata: {
                lesson_plan_id: id,
                lesson_plan_title: lessonPlan.title,
              }
            }
          )
        );

        const uploadResponses = await Promise.all(uploadPromises);
        const newFileIds = uploadResponses.map(response => response.id).filter(Boolean) as number[];

        // Merge with existing file IDs if any
        if (lessonPlan.file_ids && lessonPlan.file_ids.length > 0) {
          lessonPlan.file_ids = [...lessonPlan.file_ids, ...newFileIds];
        } else {
          lessonPlan.file_ids = newFileIds;
        }
      } catch (fileError) {
        console.error('Error uploading lesson plan files:', fileError);
        // Continue without files if upload fails
      }
    }

    const response = await authFetch(`${this.API_BASE}/lesson-plans/${id}`, {
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

/**
 * Delete a lesson plan
 * @param id Lesson plan ID
 * @returns Promise with deletion status
 */
async deleteLessonPlan(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/lesson-plans/${id}`, {
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

/**
 * Generate a lesson plan with AI
 * @param courseId Course ID
 * @param options Generation options
 * @returns Promise with generated lesson plan
 */
async generateLessonPlan(
  courseId: number,
  options: {
    topic: string;
    duration_minutes: number;
    difficulty_level?: string;
    learning_objectives?: string[];
    include_activities?: boolean;
    include_resources?: boolean;
  }
): Promise<LessonPlan> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/lesson-plans/generate`, {
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

/**
 * Get recommended materials based on course content
 * @param courseId Course ID
 * @returns Promise with recommended materials
 */
async getRecommendedMaterials(courseId: number): Promise<CourseMaterial[]> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/recommendations?course_id=${courseId}`);

    if (!response.ok) {
      throw new Error('Failed to get recommended materials');
    }

    const data = await response.json();
    return data.materials;
  } catch (error) {
    console.error('Error getting recommended materials:', error);
    throw error;
  }
}

/**
 * Download a material's file
 * @param materialId Material ID
 * @returns Promise with download URL
 */
async downloadMaterial(materialId: number): Promise<{ url: string, fileName: string }> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/${materialId}/download`);

    if (!response.ok) {
      throw new Error('Failed to generate download URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error downloading material:', error);
    throw error;
  }
}

/**
 * Clone an existing material to create a new one
 * @param materialId Source material ID
 * @param modifications Optional modifications to the cloned material
 * @returns Promise with the cloned material
 */
async cloneMaterial(materialId: number, modifications?: Partial<CourseMaterial>): Promise<CourseMaterial> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/${materialId}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modifications || {}),
    });

    if (!response.ok) {
      throw new Error('Failed to clone material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error cloning material:', error);
    throw error;
  }
}

/**
 * Publish a material to make it available to students
 * @param materialId Material ID
 * @returns Promise with the published material
 */
async publishMaterial(materialId: number): Promise<CourseMaterial> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/${materialId}/publish`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to publish material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error publishing material:', error);
    throw error;
  }
}

/**
 * Unpublish a material to hide it from students
 * @param materialId Material ID
 * @returns Promise with the unpublished material
 */
async unpublishMaterial(materialId: number): Promise<CourseMaterial> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/${materialId}/unpublish`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to unpublish material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error unpublishing material:', error);
    throw error;
  }
}

/**
 * Get material usage statistics
 * @param materialId Material ID
 * @returns Promise with usage statistics
 */
async getMaterialStats(materialId: number): Promise<{
  views: number;
  downloads: number;
  unique_users: number;
  completion_rate: number;
  average_time_spent: number;
  student_feedback: Array<{
    rating: number;
    comment?: string;
    timestamp: string;
  }>;
}> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/${materialId}/statistics`);

    if (!response.ok) {
      throw new Error('Failed to fetch material statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching material statistics:', error);
    throw error;
  }
}

/**
 * Convert lesson plan to teaching material
 * @param lessonPlanId Lesson plan ID
 * @param materialType Type of material to create
 * @returns Promise with the new material
 */
async convertLessonPlanToMaterial(lessonPlanId: number, materialType: MaterialType): Promise<CourseMaterial> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/lesson-plans/${lessonPlanId}/convert-to-material`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ material_type: materialType }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert lesson plan to material');
    }

    return await response.json();
  } catch (error) {
    console.error('Error converting lesson plan to material:', error);
    throw error;
  }
}

/**
 * Get a list of tags used across materials
 * @param courseId Optional course ID filter
 * @returns Promise with list of tags and counts
 */
async getMaterialTags(courseId?: number): Promise<Array<{ tag: string; count: number }>> {
  try {
    const authFetch = this.getAuthFetch();
    const url = courseId
      ? `${this.API_BASE}/materials/tags?course_id=${courseId}`
      : `${this.API_BASE}/materials/tags`;

    const response = await authFetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch material tags');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching material tags:', error);
    throw error;
  }
}

/**
 * Import materials from external source or file format
 * @param source Source of import (e.g., 'file', 'url', 'lms')
 * @param data Import data
 * @returns Promise with import result
 */
async importMaterials(
  source: 'file' | 'url' | 'lms',
  data: any
): Promise<{
  success: boolean;
  materials_imported: number;
  materials: CourseMaterial[];
}> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to import materials');
    }

    return await response.json();
  } catch (error) {
    console.error('Error importing materials:', error);
    throw error;
  }
}

/**
 * Export materials to a specific format
 * @param materialIds IDs of materials to export
 * @param format Export format
 * @returns Promise with export result or download URL
 */
async exportMaterials(
  materialIds: number[],
  format: 'pdf' | 'zip' | 'json' | 'html'
): Promise<{ url: string; expires_at: string }> {
  try {
    const authFetch = this.getAuthFetch();
    const response = await authFetch(`${this.API_BASE}/materials/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_ids: materialIds,
        format,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to export materials');
    }

    return await response.json();
  } catch (error) {
    console.error('Error exporting materials:', error);
    throw error;
  }
}
}

export const ProfessorMaterialsService = new ProfessorMaterialsServiceClass();
export default ProfessorMaterialsService;
