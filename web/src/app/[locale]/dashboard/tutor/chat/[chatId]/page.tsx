"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Brain,
  CornerDownLeft,
  Bookmark,
  PencilLine,
  AtSign,
  SquareFunction,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { ChatService } from '@/services/ChatService';
import { Input } from '@/components/ui/input';
import { WhiteboardPanel } from './_components/WhiteBoardPanel';
import { MathTemplates } from './_components/MathTemplates';
import { DesmosPanel } from './_components/MathCalculator';
import ChatMessage from './_components/ChatMessage';
import { useChatTools } from '@/providers/ChatToolsContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  exchangeId?: number;
  isBookmarked?: boolean;
  hasWhiteboard?: boolean;
  whiteboardScreenshots?: Array<{
    pageId: string;
    image: string;
  }>;
  whiteboardState?: any;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  sessionId?: string;
}

const atMentionOptions = [
  { id: 'whiteboard', name: 'Whiteboard', description: 'Référencer le tableau blanc' },
  { id: 'math', name: 'Math', description: 'Formules mathématiques' },
  { id: 'code', name: 'Code', description: 'Blocs de code' },
  { id: 'reference', name: 'Reference', description: 'Références bibliographiques' },
  { id: 'book', name: 'Book', description: 'Livres et manuels' },
];

// Add this to the window global object for TypeScript
declare global {
  interface Window {
    addWhiteboardToChat?: () => void;
  }
}

export default function ChatPage() {
  const { chatId } = useParams();
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exchangeId, setExchangeId] = useState<string | null>(null);
  const [showWelcomeState, setShowWelcomeState] = useState(false);
  const [isNewBlankChat, setIsNewBlankChat] = useState(false);
  const [chatTitle, setChatTitle] = useState('');

  const [showAtMentions, setShowAtMentions] = useState(false);
  const [atMentionFilter, setAtMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const atMentionPopoverRef = useRef<HTMLDivElement>(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { setToolsComponent } = useChatTools();

  // Add whiteboard to chat function
  useEffect(() => {
    window.addWhiteboardToChat = handleShareWhiteboard;

    // Listen for whiteboard-share events with enhanced data handling
    const handleWhiteboardShare = (event: CustomEvent) => {
      if (event.detail) {
        // Set the message content
        setInput(event.detail.message || "@Whiteboard");

        // Store the screenshots and state in session storage to retrieve when sending
        if (event.detail.screenshots) {
          console.log('Storing whiteboard screenshots:', event.detail.screenshots.length);
          sessionStorage.setItem('whiteboard-screenshots', JSON.stringify(event.detail.screenshots));
        } else {
          // Clear any old screenshots
          sessionStorage.removeItem('whiteboard-screenshots');
        }

        if (event.detail.whiteboardState) {
          console.log('Storing whiteboard state');
          sessionStorage.setItem('whiteboard-state', JSON.stringify(event.detail.whiteboardState));
        } else {
          // Clear any old state
          sessionStorage.removeItem('whiteboard-state');
        }
      } else {
        handleShareWhiteboard();
      }
    };

    window.addEventListener('whiteboard-share', handleWhiteboardShare as EventListener);

    // Check for a flag in sessionStorage
    const shouldAddWhiteboard = sessionStorage.getItem('add-whiteboard-to-chat') === 'true';
    if (shouldAddWhiteboard) {
      sessionStorage.removeItem('add-whiteboard-to-chat');
      handleShareWhiteboard();
    }

    return () => {
      window.removeEventListener('whiteboard-share', handleWhiteboardShare as EventListener);
      delete window.addWhiteboardToChat;
    };
  }, []);

  // Safety timeout to prevent endless loading states
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (!chat) {
        console.log("Safety timeout: Creating default chat to prevent endless loading");
        // Create a fallback empty chat if we're still loading after 5 seconds
        const fallbackChat = {
          id: chatId as string,
          title: t("newChat") || "Nouvelle Conversation",
          createdAt: new Date().toISOString(),
          messages: []
        };
        setChat(fallbackChat);
        setShowWelcomeState(true);

        toast({
          title: "Notice",
          description: "Created a new conversation due to loading issues",
        });
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(safetyTimeout);
  }, [chat, chatId, t, toast]);

  // Fetch chat data on mount
  useEffect(() => {
    // Complete fetchChat implementation for ChatPage.tsx
    const fetchChat = async () => {
      try {
        console.log("Starting fetchChat for chatId:", chatId);

        // First, check if this is a new blank chat
        let isBlank = false;
        try {
          isBlank = sessionStorage.getItem(`chat-${chatId}-blank`) === 'true';
          console.log("Is blank chat check:", isBlank);
        } catch (storageError) {
          console.error("Error accessing sessionStorage:", storageError);
        }

        if (isBlank) {
          console.log("Processing blank chat path");
          setIsNewBlankChat(true);
          // Create a new empty chat with no initial messages
          const newChat = {
            id: chatId as string,
            title: t("newChat") || "Nouvelle Conversation",
            createdAt: new Date().toISOString(),
            messages: [] // No initial messages
          };

          // IMPORTANT CHANGE: Initialize the session in the backend if the user is logged in
          if (user) {
            try {
              // Initialize the session in the API even though there are no messages yet
              const initialSession = await ChatService.initializeSession({
                session_id: newChat.id,
                title: newChat.title,
                new_session: true
              });

              console.log("Initialized blank session in API:", initialSession);
              setSessionId(initialSession.id);
              newChat.sessionId = initialSession.id;
            } catch (apiError) {
              console.error("Error initializing session in API:", apiError);
            }
          }

          try {
            // Save the new chat
            const chats = JSON.parse(localStorage.getItem('chats') || '[]');
            const updatedChats = [newChat, ...chats];
            localStorage.setItem('chats', JSON.stringify(updatedChats));
          } catch (localStorageError) {
            console.error("Error saving to localStorage:", localStorageError);
          }

          setChat(newChat);
          sessionStorage.removeItem(`chat-${chatId}-blank`);
          setShowWelcomeState(true);
          console.log("Blank chat created successfully");
          return;
        }

        // Check if we have user authentication
        if (user) {
          try {
            // Try to fetch the session from the API first
            const sessionData = await ChatService.getSessionById(chatId as string);
            console.log("Session fetched from API:", sessionData);

            // Transform the API session data into our local chat format
            const chatMessages = [];

            // Add messages from exchanges
            for (const exchange of sessionData.exchanges) {
              // Add the user message
              const userMessage = {
                id: `user-${exchange.id}`,
                role: 'user',
                content: exchange.student_input.text || '',
                timestamp: exchange.timestamp,
                hasWhiteboard: exchange.student_input.has_whiteboard || false
              };

              chatMessages.push(userMessage);

              // Add the assistant message
              const assistantMessage = {
                id: `assistant-${exchange.id}`,
                role: 'assistant',
                content: exchange.ai_response.text || '',
                timestamp: exchange.timestamp,
                exchangeId: exchange.id,
                isBookmarked: exchange.is_bookmarked
              };

              chatMessages.push(assistantMessage);
            }

            const apiChat = {
              id: sessionData.id,
              title: sessionData.title,
              createdAt: sessionData.start_time,
              messages: chatMessages,
              sessionId: sessionData.id
            };

            setChat(apiChat as Chat);
            setSessionId(sessionData.id);

            // Save to localStorage for offline access
            try {
              const chats = JSON.parse(localStorage.getItem('chats') || '[]');
              // Update if exists, otherwise add
              const chatExists = chats.some((c: any) => c.id === apiChat.id);
              const updatedChats = chatExists
                ? chats.map((c: any) => c.id === apiChat.id ? apiChat : c)
                : [apiChat, ...chats];
              localStorage.setItem('chats', JSON.stringify(updatedChats));
            } catch (localStorageError) {
              console.error("Error saving API chat to localStorage:", localStorageError);
            }

            return;
          } catch (apiError) {
            console.warn("Couldn't fetch session from API, falling back to localStorage:", apiError);

            // NEW: If the API returned a 404, try to initialize the session
            if (apiError.message?.includes('404')) {
              try {
                console.log("Session not found in API, attempting to initialize it");
                const initialChat = {
                  id: chatId as string,
                  title: t("newChat") || "Nouvelle Conversation",
                  createdAt: new Date().toISOString(),
                  messages: []
                };

                // Try to initialize the session on the backend
                const initialSession = await ChatService.initializeSession({
                  session_id: initialChat.id,
                  title: initialChat.title,
                  new_session: true
                });

                console.log("Successfully initialized missing session in API:", initialSession);
                setSessionId(initialSession.id);
                initialChat.sessionId = initialSession.id;

                setChat(initialChat as Chat);
                setShowWelcomeState(true);

                // Save to localStorage
                try {
                  const chats = JSON.parse(localStorage.getItem('chats') || '[]');
                  const updatedChats = [initialChat, ...chats];
                  localStorage.setItem('chats', JSON.stringify(updatedChats));
                } catch (storageError) {
                  console.error("Error saving initialized chat to localStorage:", storageError);
                }

                return;
              } catch (initError) {
                console.error("Failed to initialize missing session:", initError);
                // Continue to fallback logic
              }
            }
          }
        }

        // Try to get existing chats from localStorage as fallback
        console.log("Checking for existing chat in localStorage");
        let chats = [];
        try {
          chats = JSON.parse(localStorage.getItem('chats') || '[]');
        } catch (parseError) {
          console.error("Error parsing chats from localStorage:", parseError);
          chats = [];
        }

        const foundChat = chats.find((c: any) => c.id === chatId);
        console.log("Found existing chat in localStorage:", !!foundChat);

        if (foundChat) {
          setChat(foundChat);
          setSessionId(foundChat.sessionId || null);
          console.log("Existing chat loaded successfully from localStorage");

          // NEW: If we found a chat in localStorage but user is logged in and the chat doesn't have a sessionId,
          // try to create it on the backend for syncing
          if (user && !foundChat.sessionId) {
            try {
              console.log("Chat exists locally but not in API, initializing it");
              const initialSession = await ChatService.initializeSession({
                session_id: foundChat.id,
                title: foundChat.title,
                new_session: true
              });

              console.log("Successfully initialized existing local chat in API:", initialSession);
              setSessionId(initialSession.id);

              // Update the chat with the session ID
              const updatedChat = { ...foundChat, sessionId: initialSession.id };
              setChat(updatedChat);

              // Update in localStorage
              const updatedChats = chats.map((c: any) =>
                c.id === updatedChat.id ? updatedChat : c
              );
              localStorage.setItem('chats', JSON.stringify(updatedChats));
            } catch (initError) {
              console.error("Failed to initialize existing local chat in API:", initError);
            }
          }
        } else {
          // This block handles when a chat is not found but has an initial prompt
          let initialPrompt = "";
          try {
            initialPrompt = sessionStorage.getItem(`chat-${chatId}-initial-prompt`) || "";
            console.log("Initial prompt found:", !!initialPrompt);
          } catch (storageError) {
            console.error("Error getting initial prompt from sessionStorage:", storageError);
          }

          // Create a new chat
          console.log("Creating new chat with prompt:", initialPrompt ? "yes" : "no");
          setShowWelcomeState(true);

          const newChat = {
            id: chatId as string,
            title: initialPrompt.length > 0 ?
              (initialPrompt.length > 30 ? `${initialPrompt.substring(0, 30)}...` : initialPrompt) :
              (t("newChat") || "Nouvelle Conversation"),
            createdAt: new Date().toISOString(),
            messages: initialPrompt.length > 0 ? [
              {
                id: `msg-${Date.now()}`,
                role: 'user',
                content: initialPrompt,
                timestamp: new Date().toISOString()
              }
            ] : []
          };

          // NEW: Initialize the session in the backend if user is logged in
          if (user) {
            try {
              console.log("Initializing new chat in API");
              const initialSession = await ChatService.initializeSession({
                session_id: newChat.id,
                title: newChat.title,
                new_session: true
              });

              console.log("Successfully initialized new chat in API:", initialSession);
              setSessionId(initialSession.id);
              newChat.sessionId = initialSession.id;
            } catch (initError) {
              console.error("Failed to initialize new chat in API:", initError);
            }
          }

          try {
            // Save the new chat
            const updatedChats = [newChat, ...chats];
            localStorage.setItem('chats', JSON.stringify(updatedChats));
          } catch (saveError) {
            console.error("Error saving new chat to localStorage:", saveError);
          }

          setChat(newChat as Chat);
          console.log("New chat created successfully");

          // If we have a token and an initial prompt, send to API
          if (user && initialPrompt && initialPrompt.length > 0) {
            await sendToAPI(newChat as Chat, initialPrompt);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat:', error);

        // Create a fallback chat to prevent loading forever
        const fallbackChat = {
          id: chatId as string,
          title: t("newChat") || "Nouvelle Conversation",
          createdAt: new Date().toISOString(),
          messages: []
        };
        setChat(fallbackChat);
        setShowWelcomeState(true);

        toast({
          title: "Error",
          description: "Failed to load chat data. Created a new conversation.",
          variant: "destructive"
        });
      }
    };

    fetchChat();
  }, [chatId, t, user, toast]);

  // Replace the current useEffect for scrolling with this improved version
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages, currentResponse, shouldAutoScroll]);

  useEffect(() => {
    // When chat title changes, notify the parent layout
    if (chat?.title) {
      window.dispatchEvent(new CustomEvent('chat-title-update', {
        detail: {
          title: chat.title,
          isNewChat: isNewBlankChat || chat.messages.length === 0
        }
      }));
    }
  }, [chat?.title, isNewBlankChat, chat?.messages?.length]);

  // Add listener for title updates from the parent layout
  useEffect(() => {
    const handleTitleUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.title && chat) {
        updateChatTitle(event.detail.title);
      }
    };

    window.addEventListener('update-chat-title', handleTitleUpdate as EventListener);

    return () => {
      window.removeEventListener('update-chat-title', handleTitleUpdate as EventListener);
    };
  }, [chat]);

  // Add this new useEffect to detect scroll position and set auto-scroll behavior
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) return;

    const handleScroll = () => {
      // Get the scroll container (this might need adjustment based on the actual ScrollArea implementation)
      const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]') || scrollArea;

      // Calculate if we're near the bottom (within 100px)
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;

      setIsNearBottom(isAtBottom);

      // Only auto-scroll if user is already near the bottom
      setShouldAutoScroll(isAtBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll, { capture: true });

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // Add this effect to ensure we scroll on new messages from user or AI
  useEffect(() => {
    // Force scroll to bottom when the user sends a new message
    // or when a new response starts streaming
    if (
      (chat?.messages.length && chat.messages[chat.messages.length - 1].role === 'user') ||
      (currentResponse && currentResponse.length === 1) // Just started responding
    ) {
      setShouldAutoScroll(true);
    }
  }, [chat?.messages, currentResponse]);

  useEffect(() => {
    // Set the tools component for the header
    setToolsComponent(
      <div className="flex items-center gap-1">
        <MathTemplates onSelectTemplate={handleTemplateSelect} />
        <WhiteboardPanel />
        <DesmosPanel />
      </div>
    );

    // Clean up when component unmounts
    return () => {
      setToolsComponent(null);
    };
  }, []);

  // Focus the input on initial load
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Hide welcome state when messages arrive
  useEffect(() => {
    if (chat?.messages && chat.messages.length > 1) {
      setShowWelcomeState(false);
    }
  }, [chat?.messages]);

  // Header scroll behavior
  useEffect(() => {
    // Initialize scroll position state
    let lastScrollTop = 0;
    const dashboardHeader = document.querySelector('header');
    const chatHeader: any = document.querySelector('.chat-header');

    if (!chatHeader || !dashboardHeader) return;

    // Initial state - hide dashboard header, show chat header
    dashboardHeader.style.transform = 'translateY(-100%)';
    chatHeader.style.position = 'sticky';
    chatHeader.style.top = '0';

    // Scroll event handler
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop <= 0) {
        // At the top of the page - reset positions
        dashboardHeader.style.transform = 'translateY(0)';
        chatHeader.style.top = '2.5rem'; // Height of dashboard header
      } else if (scrollTop > lastScrollTop) {
        // Scrolling down - hide dashboard header, keep chat header visible
        dashboardHeader.style.transform = 'translateY(-100%)';
        chatHeader.style.top = '0';
      } else {
        // Scrolling up - show dashboard header
        dashboardHeader.style.transform = 'translateY(0)';
        chatHeader.style.top = '2.5rem'; // Height of dashboard header
      }

      lastScrollTop = scrollTop;
    };

    // Add scroll event listener with throttling to improve performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        atMentionPopoverRef.current &&
        !atMentionPopoverRef.current.contains(e.target as Node)
      ) {
        setShowAtMentions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Fixed portion of sendToAPI function to properly store exchangeId
  const sendToAPI = async (
    currentChat: Chat,
    userMessage: string,
    whiteboardScreenshots?: Array<{ pageId: string; image: string }> | null,
    whiteboardState?: any | null
  ) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setCurrentResponse('');
      // Hide welcome state once we start getting a response
      setShowWelcomeState(false);

      // Check if this message contains a whiteboard reference
      const hasWhiteboard = userMessage.toLowerCase().includes('@whiteboard');

      // Important variables for tracking response state
      let responseCompleted = false;
      let fullResponse = '';
      let responseExchangeId = '';
      let streamEnded = false;

      // Set a safety timeout to ensure message is saved even if streaming completion signal fails
      const safetyTimeout = setTimeout(() => {
        if (!responseCompleted && fullResponse) {
          console.log("Safety timeout triggered: Saving AI response manually");
          console.log("Using exchangeId:", responseExchangeId);
          finalizeResponse(currentChat, fullResponse, responseExchangeId, hasWhiteboard);
        }
      }, 30000); // 30 second timeout

      // Prepare the messages in the format the API expects
      const messages = currentChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        has_whiteboard: msg.hasWhiteboard,
      }));

      // Create a streaming request
      const response = await ChatService.createChatStream({
        messages,
        session_id: sessionId || undefined,
        new_session: !sessionId,
        session_title: currentChat.title,
        has_whiteboard: hasWhiteboard,
        // Only add these fields if they actually have values
        ...(whiteboardScreenshots && whiteboardScreenshots.length > 0 ?
          { whiteboard_screenshots: whiteboardScreenshots } : {}),
        ...(whiteboardState ? { whiteboard_state: whiteboardState } : {})
      });


      console.log("Response headers:", response.headers);
      // Get the session ID from headers if this is a new session
      const responseSessionId = response.headers.get('Session-Id');
      responseExchangeId = response.headers.get('Exchange-Id') || '';

      // IMPORTANT: Log the exchangeId immediately
      console.log("Received exchangeId from API:", responseExchangeId);

      if (responseSessionId) {
        setSessionId(responseSessionId);

        // Update the chat with the session ID
        const updatedChat = { ...currentChat, sessionId: responseSessionId };
        setChat(updatedChat);

        // Also update in localStorage
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const updatedChats = chats.map((c: any) =>
          c.id === updatedChat.id ? updatedChat : c
        );
        localStorage.setItem('chats', JSON.stringify(updatedChats));
      }

      if (responseExchangeId) {
        setExchangeId(responseExchangeId);
      } else {
        console.warn("No Exchange-Id received from API response headers");
      }

      // Handle the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            console.log("Received chunk, length:", chunk.length, "done:", done);
            const lines = chunk.split('\n\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    fullResponse += data.content;
                    setCurrentResponse(fullResponse);
                  }

                  // End of stream
                  if (data.done) {
                    console.log("Received data.done signal");
                    responseCompleted = true;
                    clearTimeout(safetyTimeout);

                    console.log("Finalizing response with exchangeId:", responseExchangeId);
                    finalizeResponse(currentChat, fullResponse, responseExchangeId, hasWhiteboard);
                  }
                } catch (e) {
                  console.error('Error parsing SSE:', e);
                }
              }
            }
          }

          // This flag helps us detect when the stream ends
          if (done) {
            streamEnded = true;
            console.log("Stream ended naturally, done =", done);
          }
        }

        // CRITICAL FIX: If we've reached the end of the stream without a data.done signal,
        // make sure we still save the response
        if (streamEnded && !responseCompleted && fullResponse) {
          console.log("Stream ended without completion signal: Saving AI response");
          console.log("Using exchangeId:", responseExchangeId);
          responseCompleted = true;
          clearTimeout(safetyTimeout);
          finalizeResponse(currentChat, fullResponse, responseExchangeId, hasWhiteboard);
        }
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      setIsLoading(false);

      // If we have a partial response, save it before going to offline mode
      if (currentResponse && currentResponse.length > 0) {
        console.log("Saving partial response before fallback:", currentResponse.substring(0, 50) + "...");
        finalizeResponse(currentChat, currentResponse, exchangeId, userMessage.toLowerCase().includes('@whiteboard'));
      } else {
        // Fallback to offline mode only if no partial response
        simulateOfflineResponse(currentChat, userMessage);
      }

      toast({
        title: "Connection Error",
        description: "Using offline mode. Some features may be limited.",
        variant: "destructive"
      });
    }
  };

  const finalizeResponse = async (currentChat: Chat, responseText: string, exchangeId: string | null, hasWhiteboard: boolean = false) => {
    console.log(`finalizeResponse called with exchangeId: ${exchangeId}`);
    console.log(`Response text length: ${responseText.length}`);

    setIsLoading(false);

    if (!responseText || responseText.trim() === '') {
      console.error("Empty response text - not finalizing");
      setCurrentResponse('');
      return;
    }

    // Add the assistant message to the chat
    const updatedMessages = [
      ...currentChat.messages,
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        exchangeId: exchangeId ? Number(exchangeId) : undefined
      }
    ];

    const updatedChat = { ...currentChat, messages: updatedMessages };
    setChat(updatedChat as Chat);

    // Update local storage
    try {
      const chats = JSON.parse(localStorage.getItem('chats') || '[]');
      const updatedChats = chats.map((c: any) =>
        c.id === updatedChat.id ? updatedChat : c
      );
      localStorage.setItem('chats', JSON.stringify(updatedChats));
    } catch (storageError) {
      console.error("Error updating localStorage:", storageError);
    }

    // Reset current response
    setCurrentResponse('');

    // Signal completion to the backend if we have an exchange ID and user
    if (exchangeId && user) {
      console.log(`Calling completeExchange with exchangeId: ${exchangeId}, text length: ${responseText.length}`);

      try {
        // Call completeExchange and log the result
        const result = await ChatService.completeExchange(exchangeId, responseText, hasWhiteboard);
        console.log("Exchange completion result:", result);

        // Show success toast only in development
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: "Response Saved",
            description: `Successfully saved AI response for exchange ${exchangeId}`,
            variant: "default",
            duration: 3000,
          });
        }
      } catch (apiError) {
        console.error("Error completing exchange with API:", apiError);

        // Show a toast to the user
        toast({
          title: "Warning",
          description: "Having trouble saving the assistant's response. It may not appear if you reload.",
          variant: "warning"
        });

        // Try again once with a delay in case it was a temporary issue
        setTimeout(async () => {
          try {
            console.log("Retrying completeExchange...");
            await ChatService.completeExchange(exchangeId, responseText, hasWhiteboard);
            console.log("Retry successful");

            toast({
              title: "Success",
              description: "Successfully saved the assistant's response on retry",
              variant: "default"
            });
          } catch (retryError) {
            console.error("Retry failed:", retryError);

            toast({
              title: "Error",
              description: "Failed to save the assistant's response. It may not appear in future sessions.",
              variant: "destructive"
            });
          }
        }, 2000);
      }
    } else {
      if (!exchangeId) {
        console.error("Not calling completeExchange - missing exchangeId");

        // Show a toast to the user in development
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: "Error",
            description: "Missing exchange ID - response won't be saved to the database",
            variant: "destructive"
          });
        }
      }
      if (!user) {
        console.log("Not calling completeExchange - missing user authentication");
      }
    }
  };
  // Fallback for offline mode
  const simulateOfflineResponse = (currentChat: Chat, prompt: string) => {
    setIsLoading(true);
    setShowWelcomeState(false);

    // Check if this message contains a whiteboard reference
    const hasWhiteboard = prompt.toLowerCase().includes('@whiteboard');

    // Simulate API response
    setTimeout(() => {
      let aiResponse = "";

      // Special response for whiteboard references
      if (hasWhiteboard) {
        aiResponse = "Je vois que vous avez partagé un tableau blanc. C'est une excellente façon de visualiser vos idées! Pourriez-vous m'expliquer plus en détail ce que représente votre diagramme? Je serais ravi de vous aider à l'analyser ou à l'améliorer.";
      }
      // Enhanced demo responses based on prompt keywords
      else if (prompt.toLowerCase().includes("math") || prompt.toLowerCase().includes("equation") ||
        prompt.toLowerCase().includes("mathématique") || prompt.toLowerCase().includes("nombre")) {
        aiResponse = "Les mathématiques sont le langage dans lequel l'univers est écrit. Des motifs élégants de la suite de Fibonacci apparaissant dans la nature aux équations différentielles complexes qui décrivent les phénomènes physiques, les mathématiques nous fournissent les outils pour comprendre et modéliser la réalité.\n\nQuel aspect spécifique aimeriez-vous explorer davantage?";
      } else if (prompt.toLowerCase().includes("literature") || prompt.toLowerCase().includes("poetry") ||
        prompt.toLowerCase().includes("littérature") || prompt.toLowerCase().includes("poésie")) {
        aiResponse = "La littérature et la poésie nous offrent des fenêtres sur l'expérience humaine à travers les cultures et le temps. Elles nous aident à explorer des émotions, des idées et des perspectives que nous ne rencontrerions peut-être jamais autrement.\n\nLa tradition littéraire arabe en particulier est riche de merveilles poétiques, de récits captivants et d'innovations qui ont influencé la littérature mondiale.";
      } else if (prompt.toLowerCase().includes("physics") || prompt.toLowerCase().includes("science") ||
        prompt.toLowerCase().includes("physique") || prompt.toLowerCase().includes("science")) {
        aiResponse = "La physique révèle les règles fondamentales qui régissent notre univers, des plus petites particules aux plus grandes structures cosmiques. Chaque découverte conduit à de nouvelles questions et possibilités.\n\nLes savants arabes et persans du Moyen Âge ont d'ailleurs fait des contributions fondamentales à cette discipline, notamment en optique avec les travaux d'Ibn al-Haytham.";
      } else {
        aiResponse = "C'est un domaine fascinant à explorer ! Ce qui est passionnant dans l'apprentissage, c'est que chaque question ouvre des portes vers de nouvelles questions auxquelles nous n'avions même pas pensé.\n\nLe savoir est interconnecté - les découvertes dans un domaine influencent souvent les avancées dans d'autres. C'est cette richesse de connexions qui rend l'exploration intellectuelle si enrichissante.";
      }

      const updatedChat = {
        ...currentChat,
        messages: [
          ...currentChat.messages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Update state and save to storage
      setChat(updatedChat as Chat);
      const chats = JSON.parse(localStorage.getItem('chats') || '[]');
      const updatedChats = chats.map((c: any) =>
        c.id === updatedChat.id ? updatedChat : c
      );
      localStorage.setItem('chats', JSON.stringify(updatedChats));

      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const hasWhiteboard = input.toLowerCase().includes('@whiteboard');

    // Retrieve whiteboard screenshots and state if this is a whiteboard message
    let whiteboardScreenshots = null;
    let whiteboardState = null;

    if (hasWhiteboard) {
      try {
        const screenshotsJson = sessionStorage.getItem('whiteboard-screenshots');
        const stateJson = sessionStorage.getItem('whiteboard-state');

        if (screenshotsJson) {
          whiteboardScreenshots = JSON.parse(screenshotsJson);
          console.log('Retrieved whiteboard screenshots:', whiteboardScreenshots.length);
          // Clear after retrieving
          sessionStorage.removeItem('whiteboard-screenshots');
        } else {
          console.log('No whiteboard screenshots found in session storage');
        }

        if (stateJson) {
          whiteboardState = JSON.parse(stateJson);
          console.log('Retrieved whiteboard state');
          // Clear after retrieving
          sessionStorage.removeItem('whiteboard-state');
        } else {
          console.log('No whiteboard state found in session storage');
        }
      } catch (error) {
        console.error('Error retrieving whiteboard data:', error);
      }
    }

    // Add user message with whiteboard data if available
    const updatedMessages = [
      ...chat.messages,
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
        hasWhiteboard,
        whiteboardScreenshots: whiteboardScreenshots || undefined,
        whiteboardState: whiteboardState || undefined
      }
    ];
    // If this is the first message and we haven't set a custom title yet,
    // use the first message as the title
    let updatedTitle = chat.title;
    if (chat.messages.length === 0 && (chat.title === t("newChat") || chat.title === "Nouvelle Conversation")) {
      updatedTitle = input.length > 30 ? `${input.substring(0, 30)}...` : input;
      setChatTitle(updatedTitle);
    }

    const updatedChat = {
      ...chat,
      messages: updatedMessages,
      title: updatedTitle
    };

    setChat(updatedChat as Chat);

    // Save to storage
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const updatedChats = chats.map((c: any) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('chats', JSON.stringify(updatedChats));

    // Reset input
    setInput('');

    // If this is the first message, hide the welcome state
    if (chat.messages.length === 0) {
      setShowWelcomeState(false);
      setIsNewBlankChat(false);
    }

    // Send to API if authenticated
    if (user) {
      await sendToAPI(updatedChat as Chat, input);
    } else {
      // Fallback to offline mode
      simulateOfflineResponse(updatedChat as Chat, input);
    }
  };

  const handleEditMessage = async (originalMessage: Message, newContent: string) => {
    if (!chat) return;

    // Find the original message index
    const messageIndex = chat.messages.findIndex(m => m.id === originalMessage.id);
    if (messageIndex === -1) return;

    // Remove all messages that came after this one (including AI responses)
    const updatedMessages = chat.messages.slice(0, messageIndex);

    // Add the edited message
    const editedMessage = {
      ...originalMessage,
      content: newContent,
      timestamp: new Date().toISOString()
    };
    updatedMessages.push(editedMessage);

    // Update the chat
    const updatedChat = { ...chat, messages: updatedMessages };
    setChat(updatedChat);

    // Update localStorage
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const updatedChats = chats.map((c: any) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('chats', JSON.stringify(updatedChats));

    // Send to API
    setInput('');
    if (user) {
      await sendToAPI(updatedChat, newContent);
    } else {
      simulateOfflineResponse(updatedChat, newContent);
    }
  };

  const updateChatTitle = (newTitle: string) => {
    if (!chat) return;

    const updatedChat = { ...chat, title: newTitle };
    setChat(updatedChat);

    // Update localStorage
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const updatedChats = chats.map((c: any) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('chats', JSON.stringify(updatedChats));
  };

  const toggleBookmark = async (message: Message) => {
    // Only allow bookmarking assistant messages with an exchangeId
    if (message.role !== 'assistant' || !message.exchangeId || !user) return;

    const newIsBookmarked = !message.isBookmarked;

    try {
      await ChatService.bookmarkExchange(message.exchangeId, newIsBookmarked);

      // Update local state
      if (chat) {
        const updatedMessages = chat.messages.map(msg =>
          msg.id === message.id ? { ...msg, isBookmarked: newIsBookmarked } : msg
        );

        const updatedChat = { ...chat, messages: updatedMessages };
        setChat(updatedChat);

        // Update localStorage
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const updatedChats = chats.map((c: any) =>
          c.id === chat.id ? updatedChat : c
        );
        localStorage.setItem('chats', JSON.stringify(updatedChats));
      }

      toast({
        title: newIsBookmarked ? "Bookmarked" : "Bookmark removed",
        description: newIsBookmarked
          ? "This message has been saved in your bookmarks"
          : "This message has been removed from your bookmarks",
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to toggle bookmark status",
        variant: "destructive"
      });
    }
  };

  // Handle suggested topics
  const handleSuggestedTopic = (topic: string) => {
    setInput(topic);
  };

  const filteredAtMentions = atMentionOptions.filter(option =>
    option.name.toLowerCase().includes(atMentionFilter.toLowerCase())
  );

  const renderMessageContent = (content: string) => {
    // Format @mentions to be bold
    const formattedContent = content.replace(
      /@(\w+)/g,
      '<strong>@$1</strong>'
    );

    return (
      <div
        className="whitespace-pre-wrap text-sm"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Store current cursor position
    setCursorPosition(e.target.selectionStart);

    // Check for @ mentions
    if (e.target.selectionStart) {
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);

      // Find the last @ symbol before cursor
      const lastAtPos = textBeforeCursor.lastIndexOf('@');

      if (
        lastAtPos >= 0 &&
        (lastAtPos === 0 || /\s/.test(textBeforeCursor.charAt(lastAtPos - 1)))
      ) {
        // Get the text between @ and cursor
        const mentionText = textBeforeCursor.substring(lastAtPos + 1);

        // If we have a space after the mention, close the popover
        if (mentionText.includes(' ')) {
          setShowAtMentions(false);
        } else {
          setAtMentionFilter(mentionText);
          setShowAtMentions(true);
        }
      } else {
        setShowAtMentions(false);
      }
    }
  };

  const insertAtMention = (mention: string) => {
    if (inputRef.current && cursorPosition !== null) {
      const beforeCursor = input.substring(0, cursorPosition);
      const afterCursor = input.substring(cursorPosition);

      // Find the position of the @ that triggered this
      const lastAtPos = beforeCursor.lastIndexOf('@');

      if (lastAtPos >= 0) {
        // Replace the partial @mention with the full one
        const newInput =
          beforeCursor.substring(0, lastAtPos) +
          `@${mention} ` +
          afterCursor;

        setInput(newInput);

        // Set cursor position after the inserted mention
        setTimeout(() => {
          if (inputRef.current) {
            const newPosition = lastAtPos + mention.length + 2; // @ + mention + space
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    }

    // Close the popover
    setShowAtMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If @ mention popover is open, handle navigation
    if (showAtMentions && filteredAtMentions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Navigation would be implemented here
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertAtMention(filteredAtMentions[0].name);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAtMentions(false);
        return;
      }
    }

    // Normal Enter key handling (submit on Enter without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTemplateSelect = (templateText: string) => {
    setInput(templateText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle whiteboard sharing in chat
  const handleShareWhiteboard = () => {
    const whiteboardMessage = "@Whiteboard\nJ'ai créé un diagramme dans le tableau blanc pour illustrer ce concept. Pouvez-vous l'examiner et me donner vos commentaires?";
    setInput(whiteboardMessage);

    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isRTL = locale === "ar";

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Chat messages */}
      <ScrollArea className="flex-1 pt-20" ref={scrollAreaRef}>

        <div className="px-4 py-4 space-y-4 pb-28">
          {/* Welcome state for new chats */}
          {chat?.messages.length < 1 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 mb-8">
              <div className="mb-8 opacity-80">
                <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />

                  {/* Knowledge nodes */}
                  <circle cx="100" cy="20" r="5" fill="currentColor" opacity="0.8" />
                  <circle cx="30" cy="70" r="5" fill="currentColor" opacity="0.8" />
                  <circle cx="140" cy="50" r="5" fill="currentColor" opacity="0.8" />
                  <circle cx="70" cy="150" r="5" fill="currentColor" opacity="0.8" />
                  <circle cx="170" cy="130" r="5" fill="currentColor" opacity="0.8" />
                  <circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.3" />

                  {/* Connections */}
                  <line x1="100" y1="20" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="30" y1="70" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="140" y1="50" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="70" y1="150" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="170" y1="130" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />

                  {/* Additional connections */}
                  <line x1="100" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
                  <line x1="30" y1="70" x2="70" y2="150" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
                  <line x1="140" y1="50" x2="170" y2="130" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />

                  {/* Animated pulse */}
                  <circle cx="100" cy="100" r="15" fill="none" stroke="currentColor" opacity="0.5">
                    <animate attributeName="r" from="15" to="85" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="3s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>

              <h3 className="text-xl font-medium mb-2">
                {t("startNewJourney") || "Commencez un nouveau voyage d'apprentissage"}
              </h3>
              <p className="text-muted-foreground max-w-md mb-8">
                {t("askAnything") || "Posez n'importe quelle question ou explorez un nouveau sujet. Votre tuteur IA vous guidera à travers une exploration connectée de la connaissance."}
              </p>

              {/* Topics with subject-specific icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {/* Math topic */}
                <Button
                  variant="outline"
                  className="justify-start text-left whitespace-normal h-auto py-3"
                  onClick={() => handleSuggestedTopic("Comment résoudre l'équation quadratique x² - 7x + 12 = 0")}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <SquareFunction className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Comment résoudre l'équation quadratique x² - 7x + 12 = 0</span>
                </Button>

                {/* Physics topic */}
                <Button
                  variant="outline"
                  className="justify-start text-left whitespace-normal h-auto py-3"
                  onClick={() => handleSuggestedTopic("Les principes de la mécanique quantique et le modèle de Bohr")}
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="4"></circle>
                      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                      <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
                      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                    </svg>
                  </div>
                  <span className="text-sm">Les principes de la mécanique quantique et le modèle de Bohr</span>
                </Button>

                {/* History topic */}
                <Button
                  variant="outline"
                  className="justify-start text-left whitespace-normal h-auto py-3"
                  onClick={() => handleSuggestedTopic("L'influence de la dynastie mérinide sur l'architecture marocaine")}
                >
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-2 flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>
                      <polyline points="3 7 12 3 21 7"></polyline>
                      <rect x="8" y="12" width="8" height="8"></rect>
                      <path d="M7 12v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"></path>
                    </svg>
                  </div>
                  <span className="text-sm">L'influence de la dynastie mérinide sur l'architecture marocaine</span>
                </Button>

                {/* Literature topic */}
                <Button
                  variant="outline"
                  className="justify-start text-left whitespace-normal h-auto py-3"
                  onClick={() => handleSuggestedTopic("Comment analyser la métrique dans la poésie arabe classique")}
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-2 flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h3"></path>
                      <path d="M15 18h6"></path>
                      <path d="M15 14h6"></path>
                      <path d="M15 10h6"></path>
                      <path d="M9 18h1"></path>
                    </svg>
                  </div>
                  <span className="text-sm">Comment analyser la métrique dans la poésie arabe classique</span>
                </Button>
              </div>
            </div>
          )}

{/* Message display */}
{chat?.messages.map((message, index) => (
  <ChatMessage
    key={message.id}
    message={message}
    isLatest={index === chat.messages.length - 1}
    user={user}
    onToggleBookmark={toggleBookmark}
    onResend={(content) => {
      // Find the original message index
      const messageIndex = chat.messages.findIndex(m => m.id === message.id);
      if (messageIndex === -1) return;

      // Remove all messages that came after this one
      const updatedMessages = chat.messages.slice(0, messageIndex + 1);

      const updatedChat = {
        ...chat,
        messages: updatedMessages
      };

      setChat(updatedChat);

      // Update localStorage
      const chats = JSON.parse(localStorage.getItem('chats') || '[]');
      const updatedChats = chats.map((c: any) =>
        c.id === updatedChat.id ? updatedChat : c
      );
      localStorage.setItem('chats', JSON.stringify(updatedChats));

      // Send to API - we're continuing from this message
      if (user) {
        sendToAPI(updatedChat, content);
      } else {
        simulateOfflineResponse(updatedChat, content);
      }
    }}
    onEdit={handleEditMessage}
  />
))}
          {/* Current streaming response */}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[75%]">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary">
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-4 bg-muted">
                  <div className="whitespace-pre-wrap text-sm">
                    {currentResponse}
                    <span className="animate-pulse ml-1">▌</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !currentResponse && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[75%]">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary">
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-4 bg-muted">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area with @ mention feature */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-background/95 backdrop-blur-sm border-t z-10 p-4">
        <form onSubmit={handleSubmit} className="mx-auto">
          <div className="flex items-end gap-2 relative">
            <div className="relative w-full">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t("whatAreYouCuriousAbout") || "Qu'est-ce qui éveille votre curiosité?"}
                className="min-h-12 py-3 resize-none border-primary/20 focus-visible:ring-primary/30 pr-10 rounded-xl w-full"
                rows={1}
                disabled={isLoading}
              />

              {/* @ mention popover */}
              {/* @ mention popover */}
              {showAtMentions && filteredAtMentions.length > 0 && (
                <div
                  ref={atMentionPopoverRef}
                  className="absolute bottom-full left-0 mb-2 bg-card rounded-lg shadow-lg border border-border z-50 w-80 overflow-hidden"
                >
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Mentions</span>
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    {filteredAtMentions.map(option => (
                      <div
                        key={option.id}
                        className="px-3 py-2.5 hover:bg-accent rounded-md cursor-pointer flex items-center gap-3 transition-colors"
                        onClick={() => insertAtMention(option.name)}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {option.id === 'whiteboard' && <PencilLine className="h-4 w-4 text-primary" />}
                          {option.id === 'math' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 12h18"></path><path d="M7 4v16"></path></svg>}
                          {option.id === 'code' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>}
                          {option.id === 'reference' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>}
                          {option.id === 'book' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium text-foreground">{option.name.toLowerCase()}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 rounded-full h-8 w-8"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              <span className="absolute right-12 bottom-[10px] text-xs text-muted-foreground">
                {isRTL ? <CornerDownLeft className="h-3 w-3 rotate-90" /> : <CornerDownLeft className="h-3 w-3" />}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
