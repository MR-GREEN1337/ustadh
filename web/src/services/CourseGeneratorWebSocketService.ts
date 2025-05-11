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
      const wsUrl = `${wsBaseUrl}/api/v1/course-generator/ws/course-generator?userId=${userId}&sessionId=${sessionId}&token=${encodedToken}`;

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
}

// Create a singleton instance of the service
export const courseGeneratorService = new CourseGeneratorWebSocketService();

export default courseGeneratorService;
