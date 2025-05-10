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
  PING: 'ping'
};

// Message interface
export interface CourseMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Course data interface
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

// Handlers interface for WebSocket events
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

/**
 * CourseGeneratorWebSocketService
 * A service to handle WebSocket connections for course generation
 */
export class CourseGeneratorWebSocketService {
  private socket: WebSocket | null = null;
  private handlers: CourseGeneratorHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private pingInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;

  /**
   * Connect to the WebSocket server
   * @param userId - The user ID
   * @param sessionId - The session ID
   */
  public connect(userId: string, sessionId: string): void {
    // Store user and session IDs for reconnection
    this.userId = userId;
    this.sessionId = sessionId;

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
      // Convert http/https to ws/wss
      const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');

      // Align with notes pattern - use snake_case parameters
      this.socket = new WebSocket(
        `${wsBaseUrl}/api/v1/professors/ws/course-generator?token=${encodeURIComponent(token)}&user_id=${userId}&session_id=${sessionId}`
      );

      // Setup WebSocket event handlers
      this.setupEventHandlers();

      // Setup ping interval to keep connection alive
      this.setupPingInterval();
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      if (this.handlers.onError) {
        this.handlers.onError({ message: 'Failed to connect to course generation service' });
      }
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established for course generation');
      this.reconnectAttempts = 0;

      if (this.handlers.onConnectionOpen) {
        this.handlers.onConnectionOpen();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'status_update' && this.handlers.onStatusUpdate) {
          this.handlers.onStatusUpdate(data);
        }
        else if (data.type === 'message' && this.handlers.onMessage) {
          this.handlers.onMessage(data);
        }
        else if (data.type === 'course_data' && this.handlers.onCourseData) {
          this.handlers.onCourseData(data);
        }
        else if (data.type === 'error' && this.handlers.onError) {
          this.handlers.onError(data);
        }
        else if (data.type === 'connection_established') {
          console.log('Connection confirmed by server:', data.message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', event);

      if (this.handlers.onConnectionClose) {
        this.handlers.onConnectionClose();
      }

      // Clear ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      // Auto-reconnect logic for unexpected disconnections
      if (event.code !== 1000 && event.code !== 1008) {
        this.attemptReconnect();
      } else {
        console.log('Clean disconnect or authentication error, not reconnecting');
        if (event.code === 1008 && this.handlers.onError) {
          this.handlers.onError({ message: event.reason || 'Authentication failed' });
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.handlers.onError) {
        this.handlers.onError({ message: 'Connection error occurred' });
      }
    };
  }

  /**
   * Set up a ping interval to keep the connection alive
   */
  private setupPingInterval(): void {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Set up new interval
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.socket!.send(JSON.stringify({ type: 'ping' }));
      } else {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId && this.sessionId) {
      this.reconnectAttempts++;

      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect(this.userId!, this.sessionId!);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnect attempts reached or missing user/session ID');
      if (this.handlers.onError) {
        this.handlers.onError({ message: 'Failed to reconnect after multiple attempts' });
      }
    }
  }

  /**
   * Register event handlers
   * @param handlers - The event handlers
   */
  public on(handlers: CourseGeneratorHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Send data to the WebSocket server
   * @param data - The data to send
   * @returns True if message was sent, false otherwise
   */
  public send(data: any): boolean {
    if (this.isConnected()) {
      this.socket!.send(JSON.stringify(data));
      return true;
    } else {
      console.error('WebSocket is not connected');
      if (this.handlers.onError) {
        this.handlers.onError({ message: 'Cannot send message - not connected' });
      }
      return false;
    }
  }

  /**
   * Start course generation
   * @param data - The course generation request data
   * @returns True if request was sent, false otherwise
   */
  public startGeneration(data: any): boolean {
    return this.send({
      type: 'start_generation',
      data
    });
  }

  /**
   * Send a message during course generation
   * @param data - The message data
   * @returns True if message was sent, false otherwise
   */
  public sendMessage(data: any): boolean {
    return this.send({
      type: 'message',
      data
    });
  }

  /**
   * Check if the WebSocket is connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Create a singleton instance of the service
export const courseGeneratorService = new CourseGeneratorWebSocketService();

export default courseGeneratorService;
