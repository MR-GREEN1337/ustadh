// services/ProfessorAssignmentService.ts
import { API_BASE_URL } from "@/lib/config";
import fileService, { FileUploadResponse } from "./FileService";

export interface Assignment {
  id: number;
  title: string;
  description: string;
  assignmentType: string; // 'homework', 'quiz', 'exam', 'project', 'lab', 'discussion'
  courseId: number;
  courseName?: string;
  dueDate: string;
  pointsPossible: number;
  status: string; // 'draft', 'published', 'closed', 'grading'
  classIds?: number[];
  createdAt: string;
  updatedAt?: string;
  instructions: string;
  materials: AssignmentMaterial[];
  submissionCount?: number;
  gradedCount?: number;
  averageGrade?: number;
  gradingCriteria?: GradingCriteria[];
}

export interface AssignmentMaterial {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

export interface GradingCriteria {
  id: number;
  name: string;
  description: string;
  points: number;
  weight?: number;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  submissionDate: string;
  status: string; // 'submitted', 'late', 'graded', 'returned'
  grade?: number;
  feedback?: string;
  attachments: AssignmentMaterial[];
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  assignmentType: string;
  courseId: number;
  dueDate: string;
  pointsPossible: number;
  instructions: string;
  classIds?: number[];
  gradingCriteria?: Omit<GradingCriteria, 'id'>[];
  status?: string;
  materialIds?: number[];
}

export interface UpdateAssignmentRequest extends Partial<CreateAssignmentRequest> {
  id: number;
}

export interface AssignmentResponse {
  assignment: Assignment;
}

export interface AssignmentsResponse {
  assignments: Assignment[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterAssignmentsParams {
  courseId?: number;
  assignmentType?: string;
  status?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssignmentSubmissionsResponse {
  submissions: AssignmentSubmission[];
  total: number;
  page: number;
  limit: number;
}

export interface GradeSubmissionRequest {
  submissionId: number;
  grade: number;
  feedback?: string;
  criteriaGrades?: { criteriaId: number; points: number }[];
}

export interface BulkGradeRequest {
  submissionIds: number[];
  grade: number;
  feedback?: string;
}

export interface QuizQuestion {
  id?: number;
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

export interface CreateQuizRequest extends Omit<CreateAssignmentRequest, 'assignmentType'> {
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  allowMultipleAttempts?: boolean;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  showCorrectAnswers?: boolean;
  passingScore?: number;
}

class ProfessorAssignmentService {
  private readonly API_URL = `${API_BASE_URL}/api/v1/professor/assignments`;

  /**
   * Get a list of assignments with optional filtering
   */
  async getAssignments(params: FilterAssignmentsParams = {}): Promise<AssignmentsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.courseId) queryParams.append('course_id', params.courseId.toString());
      if (params.assignmentType) queryParams.append('assignment_type', params.assignmentType);
      if (params.status) queryParams.append('status', params.status);
      if (params.searchTerm) queryParams.append('search', params.searchTerm);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sort_by', params.sortBy);
      if (params.sortOrder) queryParams.append('sort_order', params.sortOrder);

      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch assignments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  /**
   * Get a single assignment by ID
   */
  async getAssignment(id: number): Promise<AssignmentResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch assignment #${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching assignment #${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new assignment
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<AssignmentResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create assignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Create a quiz assignment
   */
  async createQuiz(data: CreateQuizRequest): Promise<AssignmentResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create quiz');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  }

  /**
   * Update an existing assignment
   */
  async updateAssignment(data: UpdateAssignmentRequest): Promise<AssignmentResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update assignment #${data.id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating assignment #${data.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete assignment #${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting assignment #${id}:`, error);
      throw error;
    }
  }

  /**
   * Publish an assignment
   */
  async publishAssignment(id: number): Promise<AssignmentResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to publish assignment #${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error publishing assignment #${id}:`, error);
      throw error;
    }
  }

  /**
   * Clone an existing assignment
   */
  async cloneAssignment(id: number, newDueDate?: string): Promise<AssignmentResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_due_date: newDueDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to clone assignment #${id}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error cloning assignment #${id}:`, error);
      throw error;
    }
  }

  /**
   * Get submissions for an assignment
   */
  async getSubmissions(
    assignmentId: number,
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<AssignmentSubmissionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);

      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${this.API_URL}/${assignmentId}/submissions?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch submissions for assignment #${assignmentId}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching submissions for assignment #${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Grade a submission
   */
  async gradeSubmission(data: GradeSubmissionRequest): Promise<{ success: boolean; message: string }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/submissions/${data.submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to grade submission #${data.submissionId}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error grading submission #${data.submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk grade submissions
   */
  async bulkGradeSubmissions(data: BulkGradeRequest): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    message: string;
  }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/submissions/bulk-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to bulk grade submissions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk grading submissions:', error);
      throw error;
    }
  }

  /**
   * Upload assignment materials
   */
  async uploadAssignmentMaterials(
    files: File[],
    assignmentId?: number
  ): Promise<FileUploadResponse[]> {
    try {
      const options = {
        reference_id: assignmentId ? assignmentId.toString() : undefined,
        metadata: {
          purpose: 'assignment_material'
        }
      };

      return await fileService.uploadMultipleFiles(
        files,
        undefined,
        'assignment_material',
        assignmentId?.toString(),
        false,
        options
      );
    } catch (error) {
      console.error('Error uploading assignment materials:', error);
      throw error;
    }
  }

  /**
   * Generate assignment from AI
   */
  async generateAssignmentWithAI(prompt: string, courseId: number, assignmentType: string): Promise<{
    title: string;
    description: string;
    instructions: string;
    gradingCriteria: Omit<GradingCriteria, 'id'>[];
    questions?: QuizQuestion[];
  }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          course_id: courseId,
          assignment_type: assignmentType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate assignment with AI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating assignment with AI:', error);
      throw error;
    }
  }

  /**
   * Export assignment data
   */
  async exportAssignment(
    assignmentId: number,
    format: 'pdf' | 'csv' | 'xlsx' = 'pdf',
    includeSubmissions: boolean = false
  ): Promise<string> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      queryParams.append('include_submissions', includeSubmissions.toString());

      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${this.API_URL}/${assignmentId}/export?${queryParams.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to export assignment #${assignmentId}`);
      }

      const data = await response.json();
      return data.download_url;
    } catch (error) {
      console.error(`Error exporting assignment #${assignmentId}:`, error);
      throw error;
    }
  }

  // Helper method to get authFetch with fallback
  private getAuthFetch() {
    if (typeof window !== 'undefined' && window.authFetch) {
      return window.authFetch;
    }

    // Fallback to regular fetch with credentials if authFetch not available
    return (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && !options.body) {
        headers.set('Content-Type', 'application/json');
      }

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    };
  }
}

// Export singleton instance
export const professorAssignmentService = new ProfessorAssignmentService();
export default professorAssignmentService;
