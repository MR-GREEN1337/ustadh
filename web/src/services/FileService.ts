import { API_BASE_URL } from "@/lib/config";

interface FileUploadResponse {
  id?: string;
  fileName: string;
  contentType: string;
  url: string;
  permanent_url?: string;
  size?: number;
  metadata?: Record<string, any>;
}

interface FileDeleteResponse {
  success: boolean;
  message?: string;
}

class FileService {
  private readonly API_URL = API_BASE_URL

  /**
   * Upload a file to the server
   * @param file File to upload
   * @param sessionId Current chat session ID
   * @param category Category of the file
   * @param referenceId Optional reference ID for linking to other content
   * @param isPublic Whether the file should be publicly accessible
   * @returns Promise with upload details
   */
  async uploadFile(
    file: File,
    sessionId?: string,
    category: string = 'general',
    referenceId?: string,
    isPublic: boolean = false
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      if (referenceId) {
        formData.append('reference_id', referenceId);
      }

      formData.append('category', category);
      formData.append('is_public', isPublic.toString());

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${this.API_URL}/files/upload`, {
        method: 'POST',
        body: formData,
        // Don't set content-type header - browser will set it with boundary for multipart/form-data
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
   * Upload an avatar image
   * @param file Image file to upload as avatar
   * @returns Promise with avatar URL details
   */
  async uploadAvatar(file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${this.API_URL}/files/upload/avatar`, {
        method: 'POST',
        body: formData,
        // Don't set content-type header - browser will set it with boundary for multipart/form-data
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
   * Upload multiple files to the server
   * @param files Array of files to upload
   * @param sessionId Current chat session ID
   * @param category Category for all files
   * @returns Promise with array of upload details
   */
  async uploadMultipleFiles(
    files: File[],
    sessionId?: string,
    category: string = 'general'
  ): Promise<FileUploadResponse[]> {
    try {
      const uploadPromises = files.map(file =>
        this.uploadFile(file, sessionId, category)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   * @param fileId ID of the file to download
   * @returns Promise with download URL
   */
  async getFileDownloadUrl(fileId: string): Promise<string> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${this.API_URL}/files/download/${fileId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get download URL');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the server
   * @param fileId ID of the file to delete
   * @param permanent Whether to permanently delete the file
   * @returns Promise with deletion status
   */
  async deleteFile(fileId: string, permanent: boolean = false): Promise<FileDeleteResponse> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${this.API_URL}/files/${fileId}?permanent=${permanent}`, {
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
   * List files uploaded by the current user
   * @param category Optional category filter
   * @param sessionId Optional session ID filter
   * @param page Page number for pagination
   * @param limit Items per page
   * @returns Promise with array of file details
   */
  async listFiles(
    category?: string,
    sessionId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FileUploadResponse[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (sessionId) params.append('session_id', sessionId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${this.API_URL}/files/list?${params.toString()}`);

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
   * Handle file uploads for offline mode by storing in localStorage
   * This is a temporary solution for when the API is unavailable
   * @param file File to store locally
   * @param chatId Current chat ID
   * @returns Mock upload response
   */
  storeFileLocally(file: File, chatId?: string): Promise<FileUploadResponse> {
    return new Promise((resolve) => {
      // Create a reader to get file data as base64
      const reader = new FileReader();

      reader.onload = () => {
        const fileData = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          fileName: file.name,
          contentType: file.type,
          data: reader.result,
          chatId,
          timestamp: new Date().toISOString(),
          size: file.size
        };

        // Get existing files from localStorage
        let localFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');

        // Add new file
        localFiles.push(fileData);

        // Store back in localStorage (with size limits in mind)
        try {
          localStorage.setItem('localFiles', JSON.stringify(localFiles));
        } catch (storageError) {
          // If localStorage is full, remove oldest files and try again
          console.warn('localStorage may be full, removing oldest files');
          localFiles = localFiles.slice(-5); // Keep only the 5 most recent files
          localStorage.setItem('localFiles', JSON.stringify(localFiles));
        }

        // Resolve with a format matching the server response
        resolve({
          fileName: file.name,
          contentType: file.type,
          url: `local://${fileData.id}`,
          size: file.size,
          metadata: {
            isOffline: true,
            timestamp: fileData.timestamp
          }
        });
      };

      // Read the file as data URL (base64)
      reader.readAsDataURL(file);
    });
  }

  /**
   * Store avatar locally when offline
   * Similar to storeFileLocally but for avatar use case
   * @param file Avatar image file
   * @returns Mock upload response for avatar
   */
  storeAvatarLocally(file: File): Promise<FileUploadResponse> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        const avatarData = {
          id: `avatar-${Date.now()}`,
          fileName: file.name,
          contentType: file.type,
          data: reader.result,
          timestamp: new Date().toISOString(),
          size: file.size
        };

        // Store avatar in localStorage
        try {
          localStorage.setItem('localAvatar', JSON.stringify(avatarData));
        } catch (storageError) {
          console.warn('Failed to store avatar locally:', storageError);
        }

        // Resolve with local URL
        resolve({
          fileName: file.name,
          contentType: file.type,
          url: reader.result as string,
          size: file.size,
          metadata: {
            isOffline: true,
            timestamp: avatarData.timestamp
          }
        });
      };

      // Read the file as data URL (base64)
      reader.readAsDataURL(file);
    });
  }

  /**
   * Try to upload files stored locally when coming back online
   * @returns Promise with success status
   */
  async syncOfflineFiles(): Promise<{ success: boolean; synced: number }> {
    try {
      // Check if we have locally stored files
      const localFilesStr = localStorage.getItem('localFiles');
      if (!localFilesStr) return { success: true, synced: 0 };

      const localFiles = JSON.parse(localFilesStr);
      if (!Array.isArray(localFiles) || localFiles.length === 0) {
        return { success: true, synced: 0 };
      }

      let syncedCount = 0;
      const failedItems: any[] = [];

      // Process each stored file
      for (const storedFile of localFiles) {
        try {
          // Convert data URL back to File object
          const blob = await fetch(storedFile.data).then(r => r.blob());
          const file = new File([blob], storedFile.fileName, { type: storedFile.contentType });

          // Upload the file
          await this.uploadFile(file, storedFile.chatId);
          syncedCount++;
        } catch (itemError) {
          console.warn('Failed to sync file:', itemError);
          failedItems.push(storedFile);
        }
      }

      // If we still have failed items, store them back
      if (failedItems.length > 0) {
        localStorage.setItem('localFiles', JSON.stringify(failedItems));
      } else {
        // All files synced, clear storage
        localStorage.removeItem('localFiles');
      }

      return {
        success: true,
        synced: syncedCount
      };
    } catch (error) {
      console.error('Error syncing offline files:', error);
      return {
        success: false,
        synced: 0
      };
    }
  }
}

// Export singleton instance
export const fileService = new FileService();
export default fileService;
