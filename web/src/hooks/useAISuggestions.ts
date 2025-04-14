import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from "@/lib/config";
import { useAuth } from '@/providers/AuthProvider';

interface UseAISuggestionsProps {
  noteId?: string;
  isAiEnabled?: boolean;
}

interface UseAISuggestionsReturn {
  isConnected: boolean;
  liveSuggestion: string;
  isGenerating: boolean;
  sendContent: (content: string) => void;
  clearSuggestion: () => void;
}

/**
 * Custom hook to handle WebSocket connections for AI suggestions in the note editor
 */
export const useAISuggestions = ({ noteId, isAiEnabled = false }: UseAISuggestionsProps): UseAISuggestionsReturn => {
  const [wsConnected, setWsConnected] = useState(false);
  const [liveSuggestion, setLiveSuggestion] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for WebSocket connection
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    setWsConnected(false);
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        // Close any existing connection
        cleanupWebSocket();

        if (!noteId || !isAiEnabled) return;

        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No auth token available');
          return;
        }

        const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
        const wsUrl = `${wsBaseUrl}/api/v1/notes/ws/suggestions?token=${token}&note_id=${noteId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connection established for AI suggestions');
          setWsConnected(true);

          // Setup ping interval to keep connection alive
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              cleanupWebSocket();
            }
          }, 30000); // Send ping every 30 seconds
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'suggestion_chunk') {
              setLiveSuggestion(prev => prev + (data.content || ''));
              setIsGenerating(false);
            } else if (data.type === 'processing') {
              setIsGenerating(true);
              setLiveSuggestion('');
            } else if (data.type === 'error') {
              console.error('WebSocket error:', data.message);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setWsConnected(false);

          // Try to reconnect after a delay
          setTimeout(() => {
            if (wsRef.current?.readyState !== WebSocket.OPEN && wsRef.current?.readyState !== WebSocket.CONNECTING) {
              setupWebSocket();
            }
          }, 5000);
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        setWsConnected(false);
      }
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      cleanupWebSocket();
    };
  }, [noteId, isAiEnabled, cleanupWebSocket]);

  // Function to send content to WebSocket for suggestions
  const sendContent = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && content.trim()) {
      setIsGenerating(true);
      wsRef.current.send(JSON.stringify({
        type: 'note_content',
        content
      }));
    }
  }, []);

  // Function to clear the current suggestion
  const clearSuggestion = useCallback(() => {
    setLiveSuggestion('');
    setIsGenerating(false);
  }, []);

  return {
    isConnected: wsConnected,
    liveSuggestion,
    isGenerating,
    sendContent,
    clearSuggestion
  };
};

export default useAISuggestions;
