import { API_BASE_URL } from "@/lib/config";

interface Message {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: Message[];
  session_id?: string;
  topic_id?: number;
  new_session: boolean;
  session_title?: string;
  has_whiteboard?: boolean;
  whiteboard_screenshots?: Array<{pageId: string; image: string}> | null;
  whiteboard_state?: any | null;
}

interface ChatSession {
  id: string;
  title: string;
  start_time: string;
  status: string;
  topic_id?: number;
  exchange_count: number;
  initial_query: string;
}

interface ChatSessionDetail extends ChatSession {
  user_id: number;
  session_type: string;
  interaction_mode: string;
  end_time?: string;
  exchanges: ChatExchange[];
}

interface ChatExchange {
  id: number;
  sequence: number;
  timestamp: string;
  student_input: Record<string, any>;
  ai_response: Record<string, any>;
  is_bookmarked: boolean;
}

interface InitializeSessionRequest {
  session_id: string;
  title: string;
  new_session: boolean;
  topic_id?: number;
}

export class ChatService {
  static async getSessions(limit = 10, offset = 0) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/sessions?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error(`Error fetching chat sessions: ${response.status}`);
    }

    return await response.json();
  }

  static async getSessionById(sessionId: string) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Error fetching chat session: ${response.status}`);
    }

    return await response.json() as ChatSessionDetail;
  }

  static async createChatStream(request: ChatRequest): Promise<Response> {
    console.log("Creating chat stream with request:", request);
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Error creating chat stream: ${response.status}`);
    }

    return response;
  }

// Updated completeExchange function in ChatService.ts

static async initializeSession(request: InitializeSessionRequest): Promise<any> {
  console.log("Initializing session with request:", request);
  // @ts-ignore - using the global authFetch
  const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/initialize-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Error initializing session: ${response.status}`);
  }

  return await response.json();
}

// Fix for the completeExchange method in ChatService.ts

static async completeExchange(exchangeId: string, responseText: string, hasWhiteboard: boolean = false) {
  console.log(`CompleteExchange called for exchange ${exchangeId}`);
  console.log(`Response text length: ${responseText.length}`);
  console.log(`First 100 chars of response: ${responseText.substring(0, 100)}`);

  try {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/complete-exchange/${exchangeId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Simpler payload structure to avoid confusion
      body: JSON.stringify({
        response_text: responseText,
        has_whiteboard: hasWhiteboard
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error completing exchange (${response.status}):`, errorText);
      throw new Error(`Error completing exchange: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to complete exchange:", error);
    // Re-throw to allow retry logic in the calling function
    throw error;
  }
}

  static async bookmarkExchange(exchangeId: number, isBookmarked: boolean) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/exchange/${exchangeId}/bookmark`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_bookmarked: isBookmarked }),
    });

    if (!response.ok) {
      throw new Error(`Error bookmarking exchange: ${response.status}`);
    }

    return await response.json();
  }

  static async endSession(sessionId: string) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/end`, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(`Error ending session: ${response.status}`);
    }

    return await response.json();
  }

  static async deleteSession(sessionId: string) {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error deleting session: ${response.status}`);
    }

    return await response.json();
  }
}
