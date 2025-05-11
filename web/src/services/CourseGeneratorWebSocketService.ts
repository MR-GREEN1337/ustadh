import { API_BASE_URL } from "@/lib/config";

// Status types for course generation
export const GENERATION_STATES = {
  IDLE: 'idle',
  BRAINSTORMING: 'brainstorming',
  STRUCTURING: 'structuring',
  DETAILING: 'detailing',
  FINALIZING: 'finalizing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

// Event types for WebSocket communication
export const WS_EVENT_TYPES = {
  STATUS_UPDATE: 'status_update',
  MESSAGE: 'message',
  COURSE_DATA: 'course_data',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong'
};

export interface CourseMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CourseData {
  title: string;
  code?: string;
  description: string;
  educationLevel: string;
  courseDuration: string;
  topics?: string[];
  learningObjectives?: string[];
  syllabus?: Array<{
    week: number;
    title: string;
    description: string;
    topics?: string[];
  }>;
  assessments?: Array<{
    title: string;
    type: string;
    description: string;
    weight?: number;
  }>;
}

export interface CourseGeneratorHandlers {
  onStatusUpdate?: (data: { status: string; progress: number; step: string }) => void;
  onMessage?: (data: {
    messageId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number | string
  }) => void;
  onCourseData?: (data: { courseData: CourseData }) => void;
  onError?: (data: { message: string }) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: () => void;
}

declare global {
  interface Window {
    authFetch: typeof fetch;
  }
}

const getAuthFetch = () => {
  if (typeof window !== 'undefined' && window.authFetch) {
    return window.authFetch;
  }

  // Fallback implementation
  return async (...args: Parameters<typeof fetch>) => {
    const token = localStorage.getItem('access_token');
    const [url, init = {}] = args;

    const headers = new Headers(init.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...init,
      headers,
      credentials: 'include'
    });
  };
};

export class CourseGeneratorWebSocketService {
  private socket: WebSocket | null = null;
  private handlers: CourseGeneratorHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private pingInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private isManualDisconnect = false;
  private connectionAttemptTimeout: NodeJS.Timeout | null = null;
  private authFetch = getAuthFetch();

  public connect(userId: string, sessionId: string): void {
    // Store user and session IDs for reconnection
    this.userId = userId;
    this.sessionId = sessionId;
    this.isManualDisconnect = false;

    // Clear any existing connection timeout
    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
    }

    // Close existing connection if any
    this.disconnect();

    // Get authentication token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token available');
      if (this.handlers.onError) {
        this.handlers.onError({ message: 'Authentication token not found' });
      }
      return;
    }

    try {
      // Convert http/https to ws/wss and properly encode the token
      const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
      const encodedToken = encodeURIComponent(token);
      const wsUrl = `${wsBaseUrl}/api/v1/course-generator/ws?userId=${userId}&sessionId=${sessionId}&token=${encodedToken}`;

      console.log('Connecting to WebSocket...');
      this.socket = new WebSocket(wsUrl);

      // Setup WebSocket event handlers
      this.setupEventHandlers();

      // Set connection timeout
      this.connectionAttemptTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log('Connection timeout reached');
          this.socket.close();
          this.handleConnectionError('Connection timeout');
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.handleConnectionError('Failed to create WebSocket connection');
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established for course generation');
      this.reconnectAttempts = 0;

      // Clear connection timeout
      if (this.connectionAttemptTimeout) {
        clearTimeout(this.connectionAttemptTimeout);
        this.connectionAttemptTimeout = null;
      }

      // Setup ping interval
      this.setupPingInterval();

      if (this.handlers.onConnectionOpen) {
        this.handlers.onConnectionOpen();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        switch (data.type) {
          case 'status_update':
            if (this.handlers.onStatusUpdate) {
              this.handlers.onStatusUpdate(data);
            }
            break;

          case 'message':
            if (this.handlers.onMessage) {
              this.handlers.onMessage(data);
            }
            break;

          case 'course_data':
            if (this.handlers.onCourseData) {
              this.handlers.onCourseData(data);
            }
            break;

          case 'error':
            console.error('Server error:', data.message);
            if (this.handlers.onError) {
              this.handlers.onError(data);
            }
            break;

          case 'connection_established':
            console.log('Connection confirmed by server:', data.message);
            break;

          case 'ping':
            // Respond to server ping
            this.send({ type: 'pong' });
            break;

          case 'pong':
            // Server responded to our ping
            console.log('Received pong from server');
            break;

          case 'message_received':
            // Server acknowledged our message
            console.log('Message acknowledged by server');
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', { code: event.code, reason: event.reason });

      // Clear ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      if (this.handlers.onConnectionClose) {
        this.handlers.onConnectionClose();
      }

      // Handle reconnection based on close code
      if (!this.isManualDisconnect) {
        if (event.code === 1008) {
          // Authentication error - don't retry
          console.log('Authentication error, not reconnecting');
          if (this.handlers.onError) {
            this.handlers.onError({ message: event.reason || 'Authentication failed' });
          }
        } else if (event.code !== 1000) {
          // Unexpected close - attempt reconnection
          this.attemptReconnect();
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError('WebSocket error occurred');
    };
  }

  private setupPingInterval(): void {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Set up new interval - send ping every 20 seconds
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      } else {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
      }
    }, 20000);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId && this.sessionId) {
      this.reconnectAttempts++;

      // Exponential backoff with jitter
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000, 10000);

      console.log(`Attempting to reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect(this.userId!, this.sessionId!);
      }, delay);
    } else {
      console.log('Max reconnect attempts reached or missing credentials');
      this.handleConnectionError('Failed to reconnect after multiple attempts');
    }
  }

  private handleConnectionError(message: string): void {
    console.error('Connection error:', message);
    if (this.handlers.onError) {
      this.handlers.onError({ message });
    }
  }

  public on(handlers: CourseGeneratorHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public send(data: any): boolean {
    if (this.isConnected()) {
      try {
        this.socket!.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        this.handleConnectionError('Failed to send message');
        return false;
      }
    } else {
      console.error('WebSocket is not connected');
      this.handleConnectionError('Cannot send message - not connected');
      return false;
    }
  }

  public startGeneration(data: any): boolean {
    return this.send({
      type: 'start_generation',
      data
    });
  }

  public sendMessage(data: any): boolean {
    return this.send({
      type: 'message',
      data
    });
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    this.isManualDisconnect = true;

    // Clear all timers
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.connectionAttemptTimeout) {
      clearTimeout(this.connectionAttemptTimeout);
      this.connectionAttemptTimeout = null;
    }

    // Close socket gracefully
    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnect');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.socket = null;
    }
  }

  // Session management methods using authFetch
  async getUserSessions(status?: string, limit = 20, offset = 0): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const url = `${API_BASE_URL}/api/v1/course-generator/sessions?${params.toString()}`;
      const response = await this.authFetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  async createSession(request: any): Promise<{ sessionId: string }> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      return { sessionId: data.sessionId };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async duplicateSession(sessionId: string): Promise<{ sessionId: string }> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to duplicate session: ${response.statusText}`);
      }

      const data = await response.json();
      return { sessionId: data.sessionId };
    } catch (error) {
      console.error('Error duplicating session:', error);
      throw error;
    }
  }

  async startSession(sessionId: string): Promise<void> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  async saveCourse(sessionId: string): Promise<{ courseId: number }> {
    try {
      const response = await this.authFetch(`${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/save`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to save course: ${response.statusText}`);
      }

      const data = await response.json();
      return { courseId: data.id };
    } catch (error) {
      console.error('Error saving course:', error);
      throw error;
    }
  }

  async exportCourse(sessionId: string, format: 'pdf' | 'docx' | 'json' | 'markdown') {
    try {
      const response = await this.authFetch(
        `${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/export?format=${format}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export course: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error exporting course:', error);
      throw error;
    }
  }

  async exportToCourse(sessionId: string): Promise<{
    courseId: number;
    title: string;
    code: string;
    courseUrl: string;
    status: string;
  }> {
    try {
      const response = await this.authFetch(
        `${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/export-to-course`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to export course: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        courseId: data.course_id,
        title: data.title,
        code: data.code,
        courseUrl: data.course_url,
        status: data.status
      };
    } catch (error) {
      console.error('Error exporting to course:', error);
      throw error;
    }
  }

  async getExportStatus(sessionId: string): Promise<{
    exported: boolean;
    courseId: number | null;
    courseUrl: string | null;
    exportedAt?: string;
    courseTitle?: string;
    courseCode?: string;
    courseStatus?: string;
  }> {
    try {
      const response = await this.authFetch(
        `${API_BASE_URL}/api/v1/course-generator/sessions/${sessionId}/export-status`
      );

      if (!response.ok) {
        throw new Error(`Failed to get export status: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting export status:', error);
      throw error;
    }
  }
}

// Create a singleton instance of the service
export const courseGeneratorService = new CourseGeneratorWebSocketService();

export default courseGeneratorService;
