import { API_BASE_URL } from "@/lib/config";

export interface WhiteboardSession {
  id: string;
  user_id: number;
  title: string;
  description?: string;
  status: string;
  education_level?: string;
  related_session_id?: string;
  current_state: any;
  snapshots: any[];
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  ai_enabled: boolean;
  ai_model?: string;
  created_at: string;
  updated_at?: string;
}

export interface WhiteboardInteraction {
  id: string;
  session_id: string;
  type: string;
  content: any;
  image_url?: string;
  ocr_text?: string;
  timestamp: string;
  ai_processed: boolean;
  ai_response?: any;
  processing_time_ms?: number;
}

export interface CreateSessionParams {
  title: string;
  description?: string;
  education_level?: string;
  related_session_id?: string;
  ai_enabled?: boolean;
  ai_model?: string;
}

export interface UpdateSessionParams {
  title?: string;
  description?: string;
  status?: string;
  education_level?: string;
  current_state?: any;
  ai_enabled?: boolean;
  ai_model?: string;
}

export interface CreateInteractionParams {
  type: string;
  content: any;
  image_url?: string;
  ocr_text?: string;
}

export interface SessionListParams {
  status?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
}

export class WhiteboardService {
  private webSocket: WebSocket | null = null;
  private messageHandlers: Array<(message: any) => void> = [];

  constructor() {
    // Initialize any resources needed
  }

  // WebSocket methods
  connectToSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/whiteboard/ws/${sessionId}`;

        this.webSocket = new WebSocket(wsUrl);

        this.webSocket.onopen = () => {
          console.log('WebSocket connection established');
          resolve();
        };

        this.webSocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          // Notify all registered handlers
          this.messageHandlers.forEach(handler => handler(message));
        };

        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.webSocket.onclose = () => {
          console.log('WebSocket connection closed');
          this.webSocket = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnectFromSession(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  sendMessage(message: any): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  onMessage(handler: (message: any) => void): () => void {
    this.messageHandlers.push(handler);

    // Return a function to remove this handler
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index !== -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  // Session management methods
  async getSessions(params: SessionListParams = {}): Promise<{ sessions: WhiteboardSession[], total: number, page: number, page_size: number }> {
    try {
      // Build query string from parameters
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Error fetching whiteboard sessions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getSessions:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<WhiteboardSession> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Error fetching whiteboard session: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getSession:', error);
      throw error;
    }
  }

  async createSession(sessionData: CreateSessionParams): Promise<WhiteboardSession> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error(`Error creating whiteboard session: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createSession:', error);
      throw error;
    }
  }

  async updateSession(sessionId: string, sessionData: UpdateSessionParams): Promise<WhiteboardSession> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error(`Error updating whiteboard session: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateSession:', error);
      throw error;
    }
  }

  async archiveSession(sessionId: string): Promise<{ message: string }> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error archiving whiteboard session: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in archiveSession:', error);
      throw error;
    }
  }

  // Interaction methods
  async getInteractions(sessionId: string): Promise<WhiteboardInteraction[]> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions/${sessionId}/interactions`);

      if (!response.ok) {
        throw new Error(`Error fetching whiteboard interactions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getInteractions:', error);
      throw error;
    }
  }

  async createInteraction(sessionId: string, interactionData: CreateInteractionParams): Promise<WhiteboardInteraction> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/whiteboard/sessions/${sessionId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      if (!response.ok) {
        throw new Error(`Error creating whiteboard interaction: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createInteraction:', error);
      throw error;
    }
  }

  // Helper methods for whiteboard functionality
  async captureWhiteboardScreenshot(sessionId: string, boardElement: HTMLElement): Promise<WhiteboardInteraction> {
    try {
      // For a real implementation, use html2canvas or similar library
      // to capture the screen
      const screenshotData = await this.captureElementAsImage(boardElement);

      // Create an interaction with the screenshot
      const interactionData: CreateInteractionParams = {
        type: "screenshot",
        content: {
          image_data: screenshotData,
          source: "whiteboard",
          width: boardElement.clientWidth,
          height: boardElement.clientHeight
        }
      };

      return await this.createInteraction(sessionId, interactionData);
    } catch (error) {
      console.error('Error capturing whiteboard screenshot:', error);
      throw error;
    }
  }

  // Capture a DOM element as a base64 image
  private async captureElementAsImage(element: HTMLElement): Promise<string> {
    try {
      // If html2canvas is available
      if (typeof window !== 'undefined' && 'html2canvas' in window) {
        // @ts-ignore
        const canvas = await window.html2canvas(element, {
          backgroundColor: null,
          scale: 2, // Higher quality
          logging: false,
          useCORS: true
        });

        return canvas.toDataURL('image/png');
      }

      // Fallback placeholder for testing
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    } catch (error) {
      console.error('Error capturing element as image:', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }
  }

  // Method to save current Desmos state
  async saveWhiteboardState(sessionId: string, desmosState: any): Promise<WhiteboardSession> {
    return await this.updateSession(sessionId, {
      current_state: desmosState
    });
  }
}
