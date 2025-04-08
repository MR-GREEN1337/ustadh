import axios from 'axios';

interface FileUploadResponse {
  id: string;
  fileName: string;
  contentType: string;
  url: string;
}

class FileService {
  private readonly API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

  /**
   * Upload a file to the server
   * @param file File to upload
   * @param sessionId Current chat session ID
   * @returns Promise with upload details
   */
  async uploadFile(file: File, sessionId: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await axios.post(`${this.API_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to the server
   * @param files Array of files to upload
   * @param sessionId Current chat session ID
   * @returns Promise with array of upload details
   */
  async uploadMultipleFiles(files: File[], sessionId: string): Promise<FileUploadResponse[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, sessionId));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   * @param fileId ID of the file to download
   * @returns Download URL
   */
  getFileDownloadUrl(fileId: string): string {
    return `${this.API_URL}/files/download/${fileId}`;
  }

  /**
   * Delete a file from the server
   * @param fileId ID of the file to delete
   * @returns Promise with deletion status
   */
  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${this.API_URL}/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
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
  storeFileLocally(file: File, chatId: string): Promise<FileUploadResponse> {
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
          timestamp: new Date().toISOString()
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
          id: fileData.id,
          fileName: file.name,
          contentType: file.type,
          url: `local://${fileData.id}`
        });
      };

      // Read the file as data URL (base64)
      reader.readAsDataURL(file);
    });
  }
}

export const fileService = new FileService();
export default fileService;
