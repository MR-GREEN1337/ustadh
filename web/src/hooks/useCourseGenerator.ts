import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import courseGeneratorService, {
  CourseData,
  CourseMessage,
  GENERATION_STATES
} from '@/services/CourseGeneratorWebSocketService';
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
  };
  sendMessage: (message: string) => void;
  startGeneration: (initialPrompt: string) => void;
  resetGenerator: () => void;
}

/**
 * Custom hook to handle course generation via WebSocket
 */
export const useCourseGenerator = ({ sessionId }: UseCourseGeneratorProps): UseCourseGeneratorReturn => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // Generator state
  const [generatorState, setGeneratorState] = useState({
    status: GENERATION_STATES.IDLE,
    progress: 0,
    currentStep: '',
    messages: [] as CourseMessage[],
    courseData: null as CourseData | null,
    error: null as string | null
  });

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user || !sessionId) return;

    // Connect to WebSocket
    courseGeneratorService.connect(user.id.toString(), sessionId);

    // Set up event handlers
    courseGeneratorService.on({
      onConnectionOpen: () => {
        console.log('Connected to course generation service');
        setIsConnected(true);
      },
      onConnectionClose: () => {
        console.log('Disconnected from course generation service');
        setIsConnected(false);
      },
      onStatusUpdate: (data) => {
        console.log('Status update:', data);
        setGeneratorState(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          currentStep: data.step
        }));
      },
      onMessage: (data) => {
        console.log('Message received:', data);
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
          messages: [...prev.messages, newMessage]
        }));
      },
      onCourseData: (data) => {
        console.log('Course data received:', data);
        setGeneratorState(prev => ({
          ...prev,
          courseData: data.courseData,
          status: GENERATION_STATES.COMPLETE
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
        console.error('Error from course generation service:', data.message);

        // Show toast notification
        toast.error(data.message || 'An error occurred during course generation');

        // Update state
        setGeneratorState(prev => ({
          ...prev,
          error: data.message,
          status: GENERATION_STATES.ERROR
        }));

        // Add error message to chat
        const errorMessage: CourseMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: data.message || 'An error occurred during course generation.',
          timestamp: new Date().toISOString()
        };

        setGeneratorState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage]
        }));
      }
    });

    // Clean up on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      courseGeneratorService.disconnect();
    };
  }, [user, sessionId]);

  // Action handlers
  const sendMessage = useCallback((message: string) => {
    if (!user || !sessionId || !message.trim()) return;

    if (!isConnected) {
      toast.error('Not connected to course generation service');
      return;
    }

    // Add user message to state immediately for better UX
    const userMessage: CourseMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setGeneratorState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Send message via WebSocket
    const sent = courseGeneratorService.sendMessage({
      content: message,
      userId: user.id,
      sessionId
    });

    if (!sent) {
      toast.error('Failed to send message. Connection may be lost.');
    }
  }, [user, sessionId, isConnected]);

  const startGeneration = useCallback((initialPrompt: string) => {
    if (!user || !sessionId || !initialPrompt.trim()) return;

    if (!isConnected) {
      toast.error('Not connected to course generation service');
      return;
    }

    // Reset generator state but keep any existing messages
    setGeneratorState(prev => ({
      ...prev,
      status: GENERATION_STATES.BRAINSTORMING,
      progress: 0,
      currentStep: 'Brainstorming ideas',
      error: null
    }));

    // Add system message if there are no messages yet
    if (generatorState.messages.length === 0) {
      const systemMessage: CourseMessage = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: 'Course generation started. I\'ll guide you through the process.',
        timestamp: new Date().toISOString()
      };

      setGeneratorState(prev => ({
        ...prev,
        messages: [systemMessage]
      }));
    }

    // Add user message
    const userMessage: CourseMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: initialPrompt,
      timestamp: new Date().toISOString()
    };

    setGeneratorState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Extract education level and duration if specified in the initial prompt
    const educationLevel = initialPrompt.match(/university|secondary|primary|middle/i)?.[0] || 'university';
    const courseDuration = initialPrompt.match(/semester|quarter|year|weeks/i)?.[0] || 'semester';

    // Send generation request via WebSocket
    const sent = courseGeneratorService.startGeneration({
      initialPrompt,
      userId: user.id,
      sessionId,
      locale: navigator.language || 'en',
      educationLevel,
      courseDuration
    });

    if (!sent) {
      toast.error('Failed to start generation. Connection may be lost.');
    }
  }, [user, sessionId, generatorState.messages, isConnected]);

  const resetGenerator = useCallback(() => {
    // Reset state
    setGeneratorState({
      status: GENERATION_STATES.IDLE,
      progress: 0,
      currentStep: '',
      messages: [],
      courseData: null,
      error: null
    });

    // Reconnect if not connected
    if (!isConnected && user && sessionId) {
      courseGeneratorService.connect(user.id.toString(), sessionId);
    }
  }, [isConnected, user, sessionId]);

  return {
    isConnected,
    generatorState,
    sendMessage,
    startGeneration,
    resetGenerator
  };
};

export default useCourseGenerator;
