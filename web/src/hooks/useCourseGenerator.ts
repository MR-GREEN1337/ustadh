import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import courseGeneratorService, {
  CourseData,
  CourseMessage,
  GENERATION_STATES
} from '@/services/CourseGeneratorWebSocketService';
import courseGenerationService from '@/services/CourseGenerationService';
import { toast } from 'sonner';

interface UseCourseGeneratorProps {
  sessionId: string;
}

interface UseCourseGeneratorReturn {
  isConnected: boolean;
  generatorState: {
    status: string;
    progress: number;
    currentStep: string;
    messages: CourseMessage[];
    courseData: CourseData | null;
    error: string | null;
    isStreamingResponse: boolean;
    lastUserMessage: string;
  };
  sendMessage: (message: string) => void;
  startGeneration: (data: any) => void;
  resetGenerator: () => void;
  error: string | null;
}

export const useCourseGenerator = ({ sessionId }: UseCourseGeneratorProps): UseCourseGeneratorReturn => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // @ts-ignore
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingUserMessages = useRef<Set<string>>(new Set());

  // Generator state
  const [generatorState, setGeneratorState] = useState({
    status: GENERATION_STATES.IDLE,
    progress: 0,
    currentStep: '',
    messages: [] as CourseMessage[],
    courseData: null as CourseData | null,
    error: null as string | null,
    isStreamingResponse: false,
    lastUserMessage: ''
  });

  // Load existing session data on mount
  useEffect(() => {
    const loadExistingSession = async () => {
      if (!user || !sessionId || sessionId === 'new') {
        return;
      }

      try {
        const sessionData = await courseGenerationService.getSession(sessionId);

        // Initialize state from loaded session
        setGeneratorState(prev => ({
          ...prev,
          status: sessionData.status,
          progress: sessionData.progress,
          currentStep: sessionData.currentStep || '',
          messages: sessionData.messages || [],
          courseData: sessionData.courseData || null,
          error: sessionData.error || null,
        }));
      } catch (error) {
        console.error('Failed to load session:', error);
        // Only show error if it's not a new session
        if (!sessionId.includes('course-gen-')) {
          setError('Failed to load session data');
        }
      }
    };

    loadExistingSession();
  }, [user, sessionId]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    mountedRef.current = true;

    if (!user || !sessionId || sessionId === 'new') {
      console.log('Missing user or sessionId, not connecting');
      return;
    }

    // Initialize connection
    const initializeConnection = async () => {
      try {
        // Connect to WebSocket
        courseGeneratorService.connect(user.id.toString(), sessionId);

        // Set up event handlers
        courseGeneratorService.on({
          onConnectionOpen: () => {
            if (!mountedRef.current) return;
            console.log('Connected to course generation service');
            setIsConnected(true);
            setError(null);
          },

          onConnectionClose: () => {
            if (!mountedRef.current) return;
            console.log('Disconnected from course generation service');
            setIsConnected(false);
          },

          onStatusUpdate: (data) => {
            if (!mountedRef.current) return;
            console.log('Status update:', data);
            setGeneratorState(prev => ({
              ...prev,
              status: data.status,
              progress: data.progress,
              currentStep: data.step,
              isStreamingResponse: ['brainstorming', 'structuring', 'detailing'].includes(data.status)
            }));
          },

          onMessage: (data) => {
            if (!mountedRef.current) return;
            console.log('Message received:', data);

            // Skip user messages that we already added optimistically
            if (data.role === 'user' && pendingUserMessages.current.has(data.content)) {
              pendingUserMessages.current.delete(data.content);
              return;
            }

            const newMessage: CourseMessage = {
              id: data.messageId || `msg-${Date.now()}`,
              role: data.role,
              content: data.content,
              timestamp: typeof data.timestamp === 'number'
                ? new Date(data.timestamp).toISOString()
                : String(data.timestamp)
            };

            setGeneratorState(prev => ({
              ...prev,
              messages: [...prev.messages, newMessage],
              isStreamingResponse: data.role === 'assistant' ? false : prev.isStreamingResponse
            }));
          },

          onCourseData: (data) => {
            if (!mountedRef.current) return;
            console.log('Course data received:', data);

            setGeneratorState(prev => ({
              ...prev,
              courseData: data.courseData,
              status: GENERATION_STATES.COMPLETE,
              isStreamingResponse: false
            }));

            // Add system message about completion
            const systemMessage: CourseMessage = {
              id: `system-${Date.now()}`,
              role: 'system',
              content: 'Course generation completed successfully!',
              timestamp: new Date().toISOString()
            };

            setGeneratorState(prev => ({
              ...prev,
              messages: [...prev.messages, systemMessage]
            }));
          },

          onError: (data) => {
            if (!mountedRef.current) return;
            console.error('Error from course generation service:', data.message);

            // Set error states
            setError(data.message || 'An unknown error occurred');

            // Show toast notification with more context
            toast.error(`Error: ${data.message || 'An error occurred during course generation'}`);

            // Update state
            setGeneratorState(prev => ({
              ...prev,
              error: data.message,
              status: GENERATION_STATES.ERROR,
              isStreamingResponse: false
            }));

            // Add error message to chat if it's not a connection error
            if (!data.message.includes('connect') && !data.message.includes('token')) {
              const errorMessage: CourseMessage = {
                id: `error-${Date.now()}`,
                role: 'system',
                content: `Error: ${data.message || 'An error occurred during course generation.'}`,
                timestamp: new Date().toISOString()
              };

              setGeneratorState(prev => ({
                ...prev,
                messages: [...prev.messages, errorMessage]
              }));
            }
          }
        });
      } catch (err) {
        console.error('Failed to initialize connection:', err);
        setError('Failed to initialize WebSocket connection');
      }
    };

    // Initialize connection with delay to ensure auth is ready
    const initTimeout = setTimeout(initializeConnection, 100);

    // Clean up on unmount
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      console.log('Cleaning up WebSocket connection');
      courseGeneratorService.disconnect();
    };
  }, [user, sessionId]);

  // Action handlers
  const sendMessage = useCallback((message: string) => {
    if (!user || !sessionId || !message.trim() || sessionId === 'new') return;

    if (!isConnected) {
      toast.error('Not connected to course generation service. Attempting to reconnect...');
      courseGeneratorService.connect(user.id.toString(), sessionId);
      return;
    }

    // Add message to pending set to prevent duplicates
    pendingUserMessages.current.add(message);

    // Add user message to state immediately for better UX
    const userMessage: CourseMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setGeneratorState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      lastUserMessage: message,
      isStreamingResponse: true
    }));

    // Send message via WebSocket
    const sent = courseGeneratorService.sendMessage({
      content: message,
      userId: user.id,
      sessionId
    });

    if (!sent) {
      // Remove from pending if send failed
      pendingUserMessages.current.delete(message);
      toast.error('Failed to send message. Attempting to reconnect...');
      courseGeneratorService.connect(user.id.toString(), sessionId);
    }
  }, [user, sessionId, isConnected]);

  const startGeneration = useCallback(async (data: any) => {
    if (!user || sessionId === 'new') return;

    if (!isConnected) {
      toast.error('Not connected to course generation service. Attempting to reconnect...');
      courseGeneratorService.connect(user.id.toString(), sessionId);
      return;
    }

    // Update generator state
    setGeneratorState(prev => ({
      ...prev,
      status: GENERATION_STATES.BRAINSTORMING,
      progress: 0,
      currentStep: 'Initializing course generation...',
      error: null,
      isStreamingResponse: true
    }));

    // Ensure data has proper structure
    const generationData = {
      ...data,
      userId: user.id,
      sessionId: sessionId,
      locale: navigator.language || 'en'
    };

    // Send generation request via WebSocket
    const sent = courseGeneratorService.startGeneration(generationData);

    if (!sent) {
      toast.error('Failed to start generation. Attempting to reconnect...');
      courseGeneratorService.connect(user.id.toString(), sessionId);
    }
  }, [user, sessionId, isConnected]);

  const resetGenerator = useCallback(() => {
    // Clear pending messages
    pendingUserMessages.current.clear();

    // Reset all state
    setGeneratorState({
      status: GENERATION_STATES.IDLE,
      progress: 0,
      currentStep: '',
      messages: [],
      courseData: null,
      error: null,
      isStreamingResponse: false,
      lastUserMessage: ''
    });

    setError(null);

    // Disconnect and reconnect to ensure clean state
    courseGeneratorService.disconnect();

    // Reconnect after a brief delay
    if (user && sessionId && sessionId !== 'new') {
      reconnectTimeoutRef.current = setTimeout(() => {
        courseGeneratorService.connect(user.id.toString(), sessionId);
      }, 500);
    }
  }, [user, sessionId]);

  return {
    isConnected,
    generatorState,
    sendMessage,
    startGeneration,
    resetGenerator,
    error
  };
};

export default useCourseGenerator;
