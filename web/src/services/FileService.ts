// services/FileService.ts
import { API_BASE_URL } from "@/lib/config";

export interface FileUploadResponse {
  id: number;
  fileName: string;
  contentType: string;
  url: string;
  permanentUrl?: string;
  size: number;
  isPublic: boolean;
  sharingLevel: string;
  fileCategory: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
}

export interface FileListResponse {
  files: FileListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface FileListItem {
  id: number;
  fileName: string;
  contentType: string;
  url: string;
  permanentUrl?: string;
  size: number;
  isPublic: boolean;
  sharingLevel: string;
  fileCategory: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface FileDeleteResponse {
  success: boolean;
  message: string;
}

export interface FileDownloadResponse {
  url: string;
  fileName: string;
  contentType: string;
}

export interface ShareFileOptions {
  sharing_level?: 'private' | 'shared' | 'course' | 'department' | 'school' | 'public';
  shared_with?: Array<{id: string|number, type: string}>;
  course_id?: number;
  department_id?: number;
  school_id?: number;
  expires_after_days?: number;
}

export interface FileUploadOptions extends ShareFileOptions {
  reference_id?: string;
  metadata?: Record<string, any>;
}

class FileService {
  private readonly API_URL = `${API_BASE_URL}/api/v1/files`;

  /**
   * Upload a file to the server
   * @param file File to upload
   * @param sessionId Current chat session ID (optional)
   * @param category Category of the file
   * @param referenceId Optional reference ID for linking to other content
   * @param isPublic Whether the file should be publicly accessible
   * @param options Additional upload options including sharing settings
   * @returns Promise with upload details
   */
  async uploadFile(
    file: File,
    sessionId?: string,
    category: string = 'general',
    referenceId?: string,
    isPublic: boolean = false,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      if (referenceId || options.reference_id) {
        formData.append('reference_id', referenceId || options.reference_id || '');
      }

      formData.append('category', category);
      formData.append('is_public', isPublic.toString());

      // Add sharing options
      if (options.sharing_level) {
        formData.append('sharing_level', options.sharing_level);
      }

      if (options.shared_with && options.shared_with.length > 0) {
        formData.append('shared_with', JSON.stringify(options.shared_with));
      }

      if (options.course_id) {
        formData.append('course_id', options.course_id.toString());
      }

      if (options.department_id) {
        formData.append('department_id', options.department_id.toString());
      }

      if (options.school_id) {
        formData.append('school_id', options.school_id.toString());
      }

      if (options.expires_after_days) {
        formData.append('expires_after_days', options.expires_after_days.toString());
      }

      // Add any custom metadata
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          formData.append(`metadata_${key}`, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/upload`, {
        method: 'POST',
        body: formData,
        // Don't set content-type header - browser will set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Get a file's details by ID
   * @param fileId ID of the file to retrieve
   * @returns Promise with file details and download URL
   */
  async getFile(fileId: number): Promise<FileUploadResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${fileId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get file details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  /**
   * Get a presigned download URL for a file
   * @param fileId ID of the file to download
   * @returns Promise with download URL information
   */
  async getDownloadUrl(fileId: number): Promise<FileDownloadResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/download/${fileId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get download URL');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * List files with optional filtering
   * @param category Optional category filter
   * @param sessionId Optional session ID filter
   * @param referenceId Optional reference ID filter
   * @param page Page number for pagination
   * @param limit Items per page
   * @returns Promise with list of files
   */
  async listFiles(
    category?: string,
    sessionId?: string,
    referenceId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FileListResponse> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (sessionId) params.append('session_id', sessionId);
      if (referenceId) params.append('reference_id', referenceId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/list?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to list files');
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   * @param fileId ID of the file to delete
   * @param permanent Whether to permanently delete or just mark as deleted
   * @returns Promise with deletion status
   */
  async deleteFile(fileId: number, permanent: boolean = false): Promise<FileDeleteResponse> {
    try {
      const params = new URLSearchParams();
      if (permanent) params.append('permanent', 'true');

      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${fileId}?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Update a file's metadata
   * @param fileId ID of the file to update
   * @param updates Metadata updates to apply
   * @returns Promise with updated file details
   */
  async updateFile(fileId: number, updates: Partial<{
    fileName: string;
    fileCategory: string;
    isPublic: boolean;
    sharingLevel: string;
    metadata: Record<string, any>;
    expiresAt: string | null;
  }>): Promise<FileUploadResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  /**
   * Share a file with users or groups
   * @param fileId ID of the file to share
   * @param options Sharing options
   * @returns Promise with updated file details
   */
  async shareFile(fileId: number, options: ShareFileOptions): Promise<FileUploadResponse> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/${fileId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to share file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  /**
   * Upload an avatar image
   * @param file Image file to upload as avatar
   * @returns Promise with avatar details
   */
  async uploadAvatar(file: File): Promise<{
    url: string;
    permanent_url: string;
    filename: string;
    content_type: string;
    size: number;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/upload/avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload avatar');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files at once
   * @param files Array of files to upload
   * @param sessionId Optional session ID
   * @param category File category
   * @param referenceId Optional reference ID
   * @param isPublic Whether files should be public
   * @param options Additional upload options
   * @returns Promise with array of upload responses
   */
  async uploadMultipleFiles(
    files: File[],
    sessionId?: string,
    category: string = 'general',
    referenceId?: string,
    isPublic: boolean = false,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResponse[]> {
    try {
      const uploadPromises = files.map(file =>
        this.uploadFile(file, sessionId, category, referenceId, isPublic, options)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Perform a batch action on multiple files
   * @param fileIds Array of file IDs to process
   * @param action Action to perform (delete, share, archive)
   * @param actionParams Additional parameters for the action
   * @returns Promise with batch result
   */
  async batchAction(
    fileIds: number[],
    action: 'delete' | 'share' | 'archive',
    actionParams?: Record<string, any>
  ): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    failures?: Record<string, string>;
  }> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${this.API_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: fileIds,
          action,
          action_params: actionParams,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to perform batch action');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error performing batch ${action}:`, error);
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
      headers.set('Content-Type', 'application/json');

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    };
  }
}

// Export singleton instance
export const fileService = new FileService();
export default fileService;
