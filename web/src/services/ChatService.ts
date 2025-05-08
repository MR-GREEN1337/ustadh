import { API_BASE_URL } from "@/lib/config";

interface Message {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: Array<{
    role: string;
    content: string;
    has_whiteboard?: boolean;
    attached_files?: Array<{ id: string; fileName: string; contentType: string; url: string }>;
    context_files?: Array<{ id: string; fileName: string; contentType: string; url: string }>;
  }>;
  session_id?: string;
  new_session?: boolean;
  session_title?: string;
  has_whiteboard?: boolean;
  whiteboard_screenshots?: Array<{ pageId: string; image: string }>;
  whiteboard_state?: any;
  attached_files?: Array<{ id: string; fileName: string; contentType: string; url: string }>;
  context_files?: Array<{ id: string; fileName: string; contentType: string; url: string }>;
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

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
  created_at: string;
}

interface FlashcardResponse {
  flashcards: Flashcard[];
  total: number;
}

interface FlashcardCreateRequest {
  front: string;
  back: string;
  tags?: string[];
}

interface FlashcardUpdateRequest {
  id: string;
  front?: string;
  back?: string;
  tags?: string[];
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

  /**
 * Updates the title of a chat session in the database
 * @param sessionId The ID of the chat session to update
 * @param title The new title for the chat session
 * @returns A promise that resolves to the result of the update operation
 */
static async updateSessionTitle(sessionId: string, title: string): Promise<{ status: string; message: string; title: string }> {
  console.log(`ChatService: Updating title for session ${sessionId} to "${title}"`);

  try {
    // @ts-ignore - using the global authFetch
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating session title:', error);
    throw error;
  }
}


  static async getFlashcards(sessionId: string): Promise<FlashcardResponse> {
    console.log(`ChatService: Getting flashcards for session ${sessionId}`);

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/flashcards`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching flashcards (${response.status}):`, errorText);
        throw new Error(`Error fetching flashcards: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`ChatService: Received ${data.flashcards?.length || 0} flashcards`);
      return data;
    } catch (error) {
      console.error('ChatService: Failed to fetch flashcards:', error);
      throw error;
    }
  }

  static async createFlashcard(sessionId: string, flashcard: FlashcardCreateRequest): Promise<Flashcard> {
    console.log(`ChatService: Creating flashcard for session ${sessionId}`, flashcard);

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flashcard),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating flashcard (${response.status}):`, errorText);
        throw new Error(`Error creating flashcard: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`ChatService: Flashcard created successfully with ID ${data.id}`);
      return data;
    } catch (error) {
      console.error('ChatService: Failed to create flashcard:', error);
      throw error;
    }
  }

  static async generateFlashcardsFromMessage(sessionId: string, messageContent: string): Promise<Flashcard[]> {
    console.log(`ChatService: Generating flashcards from message for session ${sessionId}`);
    console.log(`Message content length: ${messageContent.length} chars`);

    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/generate-flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error generating flashcards (${response.status}):`, errorText);
        throw new Error(`Error generating flashcards: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`ChatService: Successfully generated ${data.flashcards?.length || 0} flashcards`);
      return data.flashcards || [];
    } catch (error) {
      console.error('ChatService: Failed to generate flashcards:', error);
      throw error;
    }
  }

  /**
 * Updates a flashcard by ID
 * @param sessionId The session ID that contains the flashcard
 * @param flashcard The flashcard data to update, must include ID
 * @returns The updated flashcard object
 */
static async updateFlashcard(sessionId: string, flashcard: FlashcardUpdateRequest): Promise<Flashcard> {
  if (!flashcard.id) {
    throw new Error("Flashcard ID is required for updates");
  }

  // @ts-ignore - using the global authFetch
  const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/flashcards`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(flashcard),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error updating flashcard (${response.status}):`, errorText);
    throw new Error(`Error updating flashcard: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Deletes a flashcard by ID
 * @param sessionId The session ID that contains the flashcard
 * @param flashcardId The ID of the flashcard to delete
 * @returns Success message
 */
static async deleteFlashcard(sessionId: string, flashcardId: string): Promise<{ success: boolean, message: string }> {
  // @ts-ignore - using the global authFetch
  const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/flashcards/${flashcardId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error deleting flashcard (${response.status}):`, errorText);
    throw new Error(`Error deleting flashcard: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

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
