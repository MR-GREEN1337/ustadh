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
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { ChatService } from '@/services/ChatService';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  exchangeId?: number;
  isBookmarked?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  sessionId?: string;
}

// Suggested topics that can be used for empty states or recommendations
const suggestedTopics = [
  "L'influence de la dynastie mérinide sur l'architecture marocaine",
  "Les applications de la trigonométrie dans l'astronomie arabe médiévale",
  "Comment analyser la métrique dans la poésie arabe classique",
  "Les contributions d'Al-Khwarizmi aux mathématiques modernes"
];

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exchangeId, setExchangeId] = useState<string | null>(null);
  const [showWelcomeState, setShowWelcomeState] = useState(false);
  const [isNewBlankChat, setIsNewBlankChat] = useState(false);
  const [chatTitle, setChatTitle] = useState('');

  useEffect(() => {
    // Safety timeout to prevent endless loading states
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
  }, [chat, chatId, t]);

  // Fetch chat data on mount
  useEffect(() => {
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
          // Continue execution even if sessionStorage fails
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

          try {
            // Save the new chat
            const chats = JSON.parse(localStorage.getItem('chats') || '[]');
            const updatedChats = [newChat, ...chats];
            localStorage.setItem('chats', JSON.stringify(updatedChats));
          } catch (localStorageError) {
            console.error("Error saving to localStorage:", localStorageError);
            // Continue without saving to localStorage
          }

          setChat(newChat);

          try {
            // Clean up this flag as we've processed it
            sessionStorage.removeItem(`chat-${chatId}-blank`);
          } catch (sessionStorageError) {
            console.error("Error removing session storage item:", sessionStorageError);
          }

          // Show the welcome state for blank chats
          setShowWelcomeState(true);
          console.log("Blank chat created successfully");
          return;
        }

        // Try to get existing chats
        console.log("Checking for existing chat");
        let chats = [];
        try {
          chats = JSON.parse(localStorage.getItem('chats') || '[]');
        } catch (parseError) {
          console.error("Error parsing chats from localStorage:", parseError);
          chats = [];
        }

        const foundChat = chats.find((c: any) => c.id === chatId);
        console.log("Found existing chat:", !!foundChat);

        if (foundChat) {
          setChat(foundChat);
          setSessionId(foundChat.sessionId || null);
          console.log("Existing chat loaded successfully");

          // Additional code for API fetch can remain as is...
        } else {
          // This block handles when a chat is not found but has an initial prompt
          let initialPrompt = "";
          try {
            initialPrompt = sessionStorage.getItem(`chat-${chatId}-initial-prompt`) || "";
            console.log("Initial prompt found:", !!initialPrompt);
          } catch (storageError) {
            console.error("Error getting initial prompt from sessionStorage:", storageError);
          }

          // Create a new chat whether we have an initial prompt or not
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
  }, [chatId, t, user]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, currentResponse]);

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

  const sendToAPI = async (currentChat: Chat, userMessage: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setIsProcessing(true);
      setCurrentResponse('');
      // Hide welcome state once we start getting a response
      setShowWelcomeState(false);

      // Prepare the messages in the format the API expects
      const messages = currentChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create a streaming request
      const response = await ChatService.createChatStream({
        messages,
        session_id: sessionId || undefined,
        new_session: !sessionId,
        session_title: currentChat.title
      });

      // Get the session ID from headers if this is a new session
      const responseSessionId = response.headers.get('Session-Id');
      const responseExchangeId = response.headers.get('Exchange-Id');

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
      }

      // Handle the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
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
                    setIsLoading(false);
                    setIsProcessing(false);

                    // Add the assistant message to the chat
                    const updatedMessages = [
                      ...currentChat.messages,
                      {
                        id: `msg-${Date.now()}`,
                        role: 'assistant',
                        content: fullResponse,
                        timestamp: new Date().toISOString(),
                        exchangeId: Number(responseExchangeId)
                      }
                    ];

                    const updatedChat = { ...currentChat, messages: updatedMessages };
                    setChat(updatedChat as Chat);

                    // Update local storage
                    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
                    const updatedChats = chats.map((c: any) =>
                      c.id === updatedChat.id ? updatedChat : c
                    );
                    localStorage.setItem('chats', JSON.stringify(updatedChats));

                    // Reset current response
                    setCurrentResponse('');

                    // Signal completion to the backend
                    if (responseExchangeId) {
                      await ChatService.completeExchange(responseExchangeId, fullResponse);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE:', e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      setIsLoading(false);
      setIsProcessing(false);

      // Fallback to offline mode
      simulateOfflineResponse(currentChat, userMessage);

      toast({
        title: "Connection Error",
        description: "Using offline mode. Some features may be limited.",
        variant: "destructive"
      });
    }
  };

  // Fallback for offline mode
  const simulateOfflineResponse = (currentChat: Chat, prompt: string) => {
    setIsLoading(true);
    setShowWelcomeState(false);

    // This would be your actual AI API call in production
    setTimeout(() => {
      let aiResponse = "";

      // Enhanced demo responses based on prompt keywords
      if (prompt.toLowerCase().includes("math") || prompt.toLowerCase().includes("equation") ||
          prompt.toLowerCase().includes("mathématique") || prompt.toLowerCase().includes("nombre")) {
        aiResponse = "Les mathématiques sont le langage dans lequel l'univers est écrit. Des motifs élégants de la suite de Fibonacci apparaissant dans la nature aux équations différentielles complexes qui décrivent les phénomènes physiques, les mathématiques nous fournissent les outils pour comprendre et modéliser la réalité.\n\nQuel aspect spécifique aimeriez-vous explorer davantage? Je pourrais vous parler des applications pratiques, de l'histoire des mathématiques, ou peut-être des concepts fondamentaux qui vous intriguent.";
      } else if (prompt.toLowerCase().includes("literature") || prompt.toLowerCase().includes("poetry") ||
                 prompt.toLowerCase().includes("littérature") || prompt.toLowerCase().includes("poésie") ||
                 prompt.toLowerCase().includes("poème")) {
        aiResponse = "La littérature et la poésie nous offrent des fenêtres sur l'expérience humaine à travers les cultures et le temps. Elles nous aident à explorer des émotions, des idées et des perspectives que nous ne rencontrerions peut-être jamais autrement.\n\nLa tradition littéraire arabe en particulier est riche de merveilles poétiques, de récits captivants et d'innovations qui ont influencé la littérature mondiale.\n\nQuelles traditions ou formes littéraires vous intéressent le plus?";
      } else if (prompt.toLowerCase().includes("physics") || prompt.toLowerCase().includes("science") ||
                 prompt.toLowerCase().includes("physique") || prompt.toLowerCase().includes("science")) {
        aiResponse = "La physique révèle les règles fondamentales qui régissent notre univers, des plus petites particules aux plus grandes structures cosmiques. Chaque découverte conduit à de nouvelles questions et possibilités.\n\nLes savants arabes et persans du Moyen Âge ont d'ailleurs fait des contributions fondamentales à cette discipline, notamment en optique avec les travaux d'Ibn al-Haytham.\n\nY a-t-il un phénomène ou un concept spécifique qui vous intéresse?";
      } else if (prompt.toLowerCase().includes("histoire") || prompt.toLowerCase().includes("history") ||
                 prompt.toLowerCase().includes("civilisation") || prompt.toLowerCase().includes("culture")) {
        aiResponse = "L'histoire nous permet de comprendre comment nous sommes arrivés où nous sommes aujourd'hui. L'étude des civilisations passées révèle des modèles, des innovations et des leçons qui résonnent encore dans notre monde moderne.\n\nL'histoire du monde arabe et nord-africain est particulièrement fascinante avec ses dynasties, ses avancées scientifiques et ses échanges culturels qui ont façonné non seulement la région mais aussi l'Europe et bien au-delà.\n\nQuelle période ou quel aspect de l'histoire vous passionne le plus?";
      } else {
        aiResponse = "C'est un domaine fascinant à explorer ! Ce qui est passionnant dans l'apprentissage, c'est que chaque question ouvre des portes vers de nouvelles questions auxquelles nous n'avions même pas pensé.\n\nLe savoir est interconnecté - les découvertes dans un domaine influencent souvent les avancées dans d'autres. C'est cette richesse de connexions qui rend l'exploration intellectuelle si enrichissante.\n\nQuel aspect de ce sujet éveille le plus votre curiosité?";
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
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    // Add user message
    const updatedMessages = [
      ...chat.messages,
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
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

  // Handle suggested topics - creates a new message
  const handleSuggestedTopic = (topic: string) => {
    setInput(topic);
  };

  // Handle textarea auto-resize and submit on Enter (unless Shift is pressed)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
      {/* Simple header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
  <div className="flex items-center p-3">
    <Link href={`/${locale}/dashboard/tutor/chat`}>
      <Button variant="ghost" size="icon" aria-label="Back">
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </Link>

    {isNewBlankChat || chat.messages.length === 0 ? (
      <div className="ml-3 flex-1">
        <Input
          value={chatTitle || chat.title}
          onChange={(e) => setChatTitle(e.target.value)}
          onBlur={() => {
            if (chatTitle.trim()) {
              updateChatTitle(chatTitle);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder={t("nameYourChat") || "Nommez votre conversation..."}
          className="max-w-md"
        />
      </div>
    ) : (
      <h1 className="text-lg font-medium ml-3">{chat.title}</h1>
    )}

    {!user && (
      <div className="ml-auto">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
          Mode Hors Ligne
        </span>
      </div>
    )}
  </div>
</div>

      {/* Chat messages */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-4 pb-28">
          {/* Welcome state for new chats */}
          {chat.messages.length < 1 && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedTopics.slice(0, 2).map((topic, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="justify-start text-left whitespace-normal h-auto py-3"
                    onClick={() => handleSuggestedTopic(topic)}
                  >
                    <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                    <span className="text-sm">{topic}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {chat.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`flex gap-3 max-w-[75%] ${
                  message.role === 'user'
                    ? 'flex-row-reverse'
                    : 'flex-row'
                }`}
              >
                {message.role === 'user' ? (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-secondary">
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>

                  {/* Bookmark button for assistant messages */}
                  {message.role === 'assistant' && message.exchangeId && user && (
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1"
                        onClick={() => toggleBookmark(message)}
                      >
                        <Bookmark
                          className={`h-3 w-3 ${message.isBookmarked ? 'fill-primary' : ''}`}
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-0 left-60 right-0 bg-background/95 backdrop-blur-sm border-t z-10 p-4">
        <form onSubmit={handleSubmit} className="mx-auto">
          <div className="flex items-end gap-2 relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("whatAreYouCuriousAbout") || "Qu'est-ce qui éveille votre curiosité?"}
              className="min-h-12 py-3 resize-none border-primary/20 focus-visible:ring-primary/30 pr-10 rounded-xl"
              rows={1}
              disabled={isLoading}
            />
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
        </form>
      </div>
    </div>
  );
}
