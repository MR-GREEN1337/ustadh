// services/TutorService.ts

import { API_BASE_URL } from "@/lib/config";

export class TutorService {
  /**
   * Fetch all tutoring sessions for the current user
   * @param limit Number of sessions to fetch
   * @param offset Pagination offset
   */
  static async fetchSessions(limit: number = 10, offset: number = 0) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/tutoring/sessions?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { sessions: [], total: 0, limit, offset };
        }
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching tutoring sessions:", error);
      // Return empty array rather than throwing
      return { sessions: [], total: 0, limit, offset };
    }
  }

  /**
   * Fetch a specific tutoring session with its exchanges
   * @param sessionId ID of the session to fetch
   */
  static async fetchSessionDetails(sessionId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/tutoring/session/${sessionId}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching session ${sessionId} details:`, error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   * @param initialMessage First message to send to the tutor
   * @param topicId Optional topic ID to associate with the session
   * @param sessionTitle Optional title for the session
   */
  static async startChatSession(initialMessage: string, topicId?: number, sessionTitle?: string) {
    try {
      const chatRequest = {
        messages: [{ role: "user", content: initialMessage }],
        new_session: true,
        topic_id: topicId,
        session_title: sessionTitle || initialMessage.substring(0, 50)
      };

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatRequest)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // For streaming endpoints, extract session ID from headers
      const sessionId = response.headers.get('Session-Id');
      return { sessionId };
    } catch (error) {
      console.error("Error starting chat session:", error);
      throw error;
    }
  }

  /**
   * Delete a tutoring session
   * @param sessionId ID of the session to delete
   */
  static async deleteSession(sessionId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * End an active tutoring session
   * @param sessionId ID of the session to end
   */
  static async endSession(sessionId: string) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/session/${sessionId}/end`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error ending session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Bookmark or unbookmark an exchange
   * @param exchangeId ID of the exchange to bookmark/unbookmark
   * @param isBookmarked Whether to bookmark (true) or unbookmark (false)
   */
  static async toggleBookmark(exchangeId: number, isBookmarked: boolean) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/tutoring/exchange/${exchangeId}/bookmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_bookmarked: isBookmarked })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error toggling bookmark for exchange ${exchangeId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch exploration topics for the tutor
   * @param searchQuery Optional search query to filter topics
   */
  static async fetchExplorationTopics(searchQuery?: string) {
    try {
      let url = `${API_BASE_URL}/api/v1/explore/topics`;
      if (searchQuery) {
        url += `?q=${encodeURIComponent(searchQuery)}`;
      }

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching exploration topics:", error);
      // Return empty array rather than throwing
      return { topics: [] };
    }
  }

  /**
   * Get subject details - used for tutor sessions with subject context
   * @param subjectId ID of the subject to fetch
   */
  static async fetchSubjectDetails(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching subject ${subjectId}:`, error);
      throw error;
    }
  }
}

export default TutorService;
