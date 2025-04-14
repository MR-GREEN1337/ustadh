import { API_BASE_URL } from "@/lib/config";

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_shared: boolean;
  collaborators?: NoteCollaborator[];
  tags?: string[];
  folder_id?: string;
  version?: number;
  ai_enhanced?: boolean;
  ai_suggestions?: AISuggestion[];
}

export interface NoteCollaborator {
  id: string;
  user_id: string;
  note_id: string;
  permissions: 'read' | 'write' | 'admin';
  joined_at: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface AISuggestion {
  id: string;
  content: string;
  type: 'completion' | 'clarification' | 'connection' | 'insight';
  created_at: string;
  applied: boolean;
}

export interface NoteFolder {
  id: string;
  name: string;
  owner_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteParams {
  title: string;
  content: string;
  folder_id?: string;
  tags?: string[];
  ai_enhanced?: boolean;
}

export interface UpdateNoteParams {
  title?: string;
  content?: string;
  folder_id?: string;
  tags?: string[];
  ai_enhanced?: boolean;
}

export interface ShareNoteParams {
  note_id: string;
  email: string;
  permissions: 'read' | 'write' | 'admin';
}

export interface NoteSearchParams {
  query?: string;
  folder_id?: string;
  tags?: string[];
  ai_enhanced?: boolean;
  shared?: boolean;
  sort_by?: 'updated_at' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

export class IntelligentNoteService {
  static async getNotes(params: NoteSearchParams = {}) {
    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(val => queryParams.append(`${key}[]`, val));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Error fetching notes: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getNotes:', error);
      throw error;
    }
  }

  static async getNote(noteId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}`);

      if (!response.ok) {
        throw new Error(`Error fetching note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getNote:', error);
      throw error;
    }
  }

  static async createNote(noteData: CreateNoteParams) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error(`Error creating note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createNote:', error);
      throw error;
    }
  }

  static async updateNote(noteId: string, noteData: UpdateNoteParams) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      });

      if (!response.ok) {
        throw new Error(`Error updating note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateNote:', error);
      throw error;
    }
  }

  static async deleteNote(noteId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error deleting note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in deleteNote:', error);
      throw error;
    }
  }

  static async shareNote(shareData: ShareNoteParams) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${shareData.note_id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: shareData.email,
          permissions: shareData.permissions
        })
      });

      if (!response.ok) {
        throw new Error(`Error sharing note: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in shareNote:', error);
      throw error;
    }
  }

  static async removeCollaborator(noteId: string, userId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}/collaborators/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error removing collaborator: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in removeCollaborator:', error);
      throw error;
    }
  }

  static async getNoteFolders() {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/folders`);

      if (!response.ok) {
        throw new Error(`Error fetching note folders: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getNoteFolders:', error);
      throw error;
    }
  }

  static async createFolder(name: string, parentId?: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          parent_id: parentId
        })
      });

      if (!response.ok) {
        throw new Error(`Error creating folder: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createFolder:', error);
      throw error;
    }
  }

  static async updateFolder(folderId: string, name: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/folders/${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error(`Error updating folder: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateFolder:', error);
      throw error;
    }
  }

  static async deleteFolder(folderId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/folders/${folderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error deleting folder: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in deleteFolder:', error);
      throw error;
    }
  }

  static async getAISuggestions(noteId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}/ai-suggestions`);

      if (!response.ok) {
        throw new Error(`Error fetching AI suggestions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getAISuggestions:', error);
      throw error;
    }
  }

  static async applyAISuggestion(noteId: string, suggestionId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}/ai-suggestions/${suggestionId}/apply`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error applying AI suggestion: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in applyAISuggestion:', error);
      throw error;
    }
  }

  static async generateAISuggestions(noteId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/notes/${noteId}/generate-suggestions`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error generating AI suggestions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in generateAISuggestions:', error);
      throw error;
    }
  }
}
