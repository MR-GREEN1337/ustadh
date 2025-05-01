import { API_BASE_URL } from '@/lib/config';

type Message = {
  id: number;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  is_from_me: boolean;
  sender: {
    id: number;
    full_name: string;
    avatar: string | null;
  };
  has_attachments: boolean;
  attachments?: any;
};

type Conversation = {
  user: {
    id: number;
    full_name: string;
    avatar: string | null;
    user_type: string;
    role_info: {
      title: string;
      [key: string]: any;
    };
  };
  latest_message: {
    id: number;
    subject: string;
    preview: string;
    created_at: string;
    is_read: boolean;
    is_from_me: boolean;
  };
  unread_count: number;
};

type Contact = {
  id: number;
  full_name: string;
  avatar: string | null;
  user_type: string;
  role: string;
  role_title: string;
  is_teacher?: boolean;
  education_level?: string;
};

export class MessagingService {
  private websocket: WebSocket | null = null;
  private messageCallbacks: ((message: any) => void)[] = [];
  private unreadCountCallbacks: ((count: number) => void)[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private token: string | null = null;

  /**
   * Initialize the messaging service
   */
  init = () => {
    // Get token from localStorage
    this.token = localStorage.getItem('access_token');
    if (!this.token) {
      console.error('No auth token available for messaging');
      return;
    }

    this.connectWebSocket();
  };

  /**
   * Connect to the messaging WebSocket
   */
  private connectWebSocket = () => {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (!this.token) return;

    try {
      const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
      const wsUrl = `${wsBaseUrl}/api/v1/messaging/ws/messages?token=${this.token}`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Messaging WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different message types
          if (data.type === 'new_message') {
            // Notify subscribers about the new message
            this.messageCallbacks.forEach(callback => callback(data.message));
          } else if (data.type === 'unread_count') {
            // Notify about unread count
            this.unreadCountCallbacks.forEach(callback => callback(data.count));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        if (event.code !== 1000) {
          console.log('Messaging WebSocket disconnected. Reconnecting in 5 seconds...');
          // Attempt to reconnect after 5 seconds
          this.reconnectTimer = setTimeout(() => {
            this.connectWebSocket();
          }, 5000);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('Messaging WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error setting up messaging WebSocket:', error);
    }
  };

  /**
   * Close the WebSocket connection
   */
  disconnect = () => {
    if (this.websocket) {
      this.websocket.close(1000); // Normal closure
      this.websocket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear all callbacks
    this.messageCallbacks = [];
    this.unreadCountCallbacks = [];
  };

  /**
   * Subscribe to new message events
   */
  onNewMessage = (callback: (message: any) => void) => {
    this.messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  };

  /**
   * Subscribe to unread count updates
   */
  onUnreadCountChange = (callback: (count: number) => void) => {
    this.unreadCountCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.unreadCountCallbacks = this.unreadCountCallbacks.filter(cb => cb !== callback);
    };
  };

  /**
   * Send a message to mark a message as read
   */
  markMessageAsRead = (messageId: number) => {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'mark_read',
        message_id: messageId
      }));
    }
  };

  /**
   * Send a message to mark an entire conversation as read
   */
  markConversationAsRead = (userId: number) => {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'mark_conversation_read',
        user_id: userId
      }));
    }
  };

  /**
   * Get all conversations for the current user
   */
  getConversations = async (): Promise<Conversation[]> => {
    try {
      // @ts-ignore - Using global authFetch added by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/messaging/conversations`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  };

  /**
   * Get messages for a specific conversation
   */
  getConversationMessages = async (
    userId: number,
    limit: number = 50,
    beforeId?: number
  ): Promise<{ messages: Message[], user: any }> => {
    try {
      let url = `${API_BASE_URL}/api/v1/messaging/messages/${userId}?limit=${limit}`;
      if (beforeId) {
        url += `&before_id=${beforeId}`;
      }

      // @ts-ignore - Using global authFetch added by AuthProvider
      const response = await window.authFetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  };

  /**
   * Send a new message
   */
  sendMessage = async (recipientId: number, subject: string, content: string, attachments?: any): Promise<Message> => {
    try {
      const messageData = {
        recipient_id: recipientId,
        subject,
        content,
        attachments
      };

      // @ts-ignore - Using global authFetch added by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/messaging/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  /**
   * Delete a message
   */
  deleteMessage = async (messageId: number): Promise<boolean> => {
    try {
      // @ts-ignore - Using global authFetch added by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete message');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  /**
   * Get available contacts to message
   */
  getContacts = async (): Promise<Contact[]> => {
    try {
      // @ts-ignore - Using global authFetch added by AuthProvider
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/messaging/contacts`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch contacts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  };
}
