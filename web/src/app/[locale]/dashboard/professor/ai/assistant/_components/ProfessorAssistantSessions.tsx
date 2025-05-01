"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Sparkles,
  Star,
  Brain,
  Globe,
  ArrowRight,
  PenTool,
  MessageCircle,
  Plus,
  Clock,
  MoreVertical,
  Send,
  ChevronLeft,
  Lightbulb,
  FileText,
  Info,
  Trash2,
  Archive
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '@/services/ChatService';
import { Chat } from '@/app/[locale]/dashboard/tutor/chat/[chatId]/page';

// Suggested topics to explore
const suggestedTopics = [
  "L'influence de la dynastie mérinide sur l'architecture marocaine",
  "Les applications de la trigonométrie dans l'astronomie arabe médiévale",
  "Comment analyser la métrique dans la poésie arabe classique",
  "Les contributions d'Al-Khwarizmi aux mathématiques modernes"
];

const TutorChat = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const isRTL = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();

  const [chatSessions, setChatSessions] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load chat sessions
  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);

      try {
        if (user) {
          // If user is logged in, try to fetch from API
          try {
            const response = await ChatService.getSessions(20, 0);

            if (response && response.sessions) {
              // Format API response for our UI
              const formattedChats = response.sessions.map((session: any) => {
                // Map API schema to our UI schema
                let category = getCategoryFromTitle(session.title);

                return {
                  id: session.id,
                  title: session.title,
                  lastMessage: session.initial_query,
                  timestamp: formatTimestamp(new Date(session.start_time)),
                  category: category,
                  snippet: session.initial_query.substring(0, 100) + (session.initial_query.length > 100 ? "..." : ""),
                  isActive: session.status === "active",
                  exchangeCount: session.exchange_count
                };
              });

              setChatSessions(formattedChats);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Failed to fetch sessions from API:', error);
            // Fall back to localStorage if API fails
          }
        }

        // If API failed or user not logged in, fall back to localStorage
        const storedChats: Chat[] = JSON.parse(localStorage.getItem('chats') || '[]');

        if (storedChats.length > 0) {
          // Format them for our UI
          const formattedChats = storedChats.map((chat: Chat) => {
            // Get the last user message and the last assistant message
            const userMessages = chat.messages.filter(msg => msg.role === 'user');
            const assistantMessages = chat.messages.filter(msg => msg.role === 'assistant');

            const lastUserMessage = userMessages.length > 0 ?
              userMessages[userMessages.length - 1].content : "";

            const lastAssistantMessage = assistantMessages.length > 0 ?
              assistantMessages[assistantMessages.length - 1].content : "";

            // Calculate relative time
            const date = new Date(chat.createdAt);
            const timestamp = formatTimestamp(date);

            // Try to determine category from content
            let category = getCategoryFromTitle(chat.title);

            return {
              id: chat.id,
              title: chat.title,
              lastMessage: lastUserMessage,
              timestamp: timestamp,
              category: category,
              snippet: lastAssistantMessage?.substring(0, 100) + (lastAssistantMessage?.length > 100 ? "..." : ""),
              isActive: true,
              exchangeCount: chat.messages.length
            };
          });

          setChatSessions(formattedChats as any[]);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les conversations",
          variant: "destructive"
        });
      }

      setIsLoading(false);
    };

    fetchChats();
  }, [user]);

  const getCategoryFromTitle = (title: string) => {
    // Try to determine category from content
    const content = title.toLowerCase();

    if (content.includes("math") || content.includes("nombre") || content.includes("calcul") ||
        content.includes("équation") || content.includes("algèbre") || content.includes("géométrie")) {
      return "Mathématiques";
    } else if (content.includes("littérature") || content.includes("poésie") ||
                content.includes("écrivain") || content.includes("roman") ||
                content.includes("poème")) {
      return "Littérature";
    } else if (content.includes("physique") || content.includes("chimie") ||
                content.includes("science") || content.includes("atome")) {
      return "Sciences";
    } else if (content.includes("histoire") || content.includes("civilisation") ||
                content.includes("guerre") || content.includes("empire")) {
      return "Histoire";
    }

    return "Non classé";
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let timestamp;
    if (diffDays === 0) timestamp = "Aujourd'hui";
    else if (diffDays === 1) timestamp = "Hier";
    else timestamp = new Intl.DateTimeFormat('fr-FR').format(date);

    return timestamp;
  };

const handleCreateNewChat = () => {
    try {
      // Generate a unique ID for the new chat
      const chatId = uuidv4();

      // Clear any previous values that might be lingering
      sessionStorage.removeItem(`chat-${chatId}-initial-prompt`);
      sessionStorage.removeItem(`chat-${chatId}-blank`);

      // Set the blank chat flag
      sessionStorage.setItem(`chat-${chatId}-blank`, 'true');
      console.log("Set blank chat flag for", chatId);

      // Navigate to the new chat page
      router.push(`/${locale}/dashboard/tutor/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
      // Fallback: If sessionStorage fails, navigate anyway
      const chatId = uuidv4();
      router.push(`/${locale}/dashboard/tutor/chat/${chatId}`);

      toast({
        title: "Warning",
        description: "There was an issue setting up your chat. Some features might be limited.",
        variant: "destructive"
      });
    }
  };

  const handleSelectChat = (chat: Chat) => {
    // Navigate to the individual chat page
    router.push(`/${locale}/dashboard/tutor/chat/${chat.id}`);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation(); // Prevent navigating to the chat

    if (isDeleting) return;

    setIsDeleting(true);

    try {
      if (user) {
        // If user is logged in, try to delete from API
        try {
          await ChatService.deleteSession(chat.id);
          toast({
            title: "Supprimé",
            description: "La conversation a été supprimée",
          });
        } catch (error) {
          console.error('Failed to delete from API:', error);
          toast({
            title: "Erreur",
            description: "Impossible de supprimer la conversation",
            variant: "destructive"
          });
          setIsDeleting(false);
          return;
        }
      }

      // Also remove from localStorage for both authenticated and guest users
      const storedChats = JSON.parse(localStorage.getItem('chats') || '[]');
      const updatedChats = storedChats.filter((c: Chat) => c.id !== chat.id);
      localStorage.setItem('chats', JSON.stringify(updatedChats));

      // Update state
      setChatSessions(prevChats => prevChats.filter(c => c.id !== chat.id));

    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEndSession = async (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation(); // Prevent navigating to the chat

    if (isDeleting || !user) return;

    setIsDeleting(true);

    try {
      // End the session via API
      await ChatService.endSession(chat.id);

      // Update the chat in the UI
      setChatSessions(prevChats =>
        prevChats.map(c =>
          c.id === chat.id ? {...c, isActive: false} : c
        )
      );

      toast({
        title: "Session terminée",
        description: "La conversation a été archivée",
      });
    } catch (error) {
      console.error('Failed to end session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la session",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartExplorationWithTopic = (topic: string) => {
    // Generate a unique ID for the new chat
    const chatId = uuidv4();

    // Set the initial prompt in sessionStorage
    sessionStorage.setItem(`chat-${chatId}-initial-prompt`, topic);

    // Navigate to the new chat page
    router.push(`/${locale}/dashboard/tutor/chat/${chatId}`);
  };

  return (
    <div className={`max-w-6xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-tight">
            {t("tutorChat") || "Chat avec le Tuteur"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("exploreWithAI") || "Explorez des idées et posez des questions à votre tuteur IA"}
          </p>
        </div>

        {/* Create new chat button */}
        <Button
          onClick={handleCreateNewChat}
          className="w-full py-6 text-lg group transition-all"
        >
          <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          {t("newChat") || "Nouvelle Conversation"}
        </Button>

        {/* Existing chat sessions */}
        <div className="space-y-4">
          <h2 className="text-xl font-light">
            {t("recentSessions") || "Sessions récentes"}
          </h2>

          {isLoading ? (
            // Loading state
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chatSessions.length > 0 ? (
            // Chat sessions list
            <div className="grid grid-cols-1 gap-3">
              {chatSessions.map((chat: any) => (
                <Card
                  key={chat.id}
                  className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
                  onClick={() => handleSelectChat(chat)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mr-2">
                            {chat.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {chat.timestamp}
                          </span>
                          {!chat.isActive && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                              Terminée
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium">{chat.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {chat.snippet || chat.lastMessage || "Nouvelle conversation..."}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {chat.exchangeCount || 1} message{chat.exchangeCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user && chat.isActive && (
                            <DropdownMenuItem onClick={(e) => handleEndSession(e, chat)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Terminer la session
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => handleDeleteChat(e, chat)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Empty state
            <Card className="border-dashed border">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="rounded-full p-3 bg-muted mb-4">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Aucune conversation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commencez une nouvelle conversation pour explorer des idées
                </p>
                <Button variant="outline" onClick={handleCreateNewChat}>
                  Démarrer une conversation
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Suggested topics */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            <h2 className="text-xl font-light">
              {t("suggestedTopics") || "Sujets suggérés"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedTopics.map((topic, idx) => (
              <Card
                key={idx}
                className="border hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all duration-300 cursor-pointer"
                onClick={() => handleStartExplorationWithTopic(topic)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-500 font-light">{idx + 1}</span>
                      <p className="text-sm">{topic}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400">
                      {t("explore") || "Explorer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Connection visualization */}
        <Card className="border-0 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900/40 dark:to-zinc-900/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-2">
                  {t("connectedLearning") || "Apprentissage connecté"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("tutorAIDescription") || "Notre tuteur IA fait des connexions entre les sujets pour approfondir votre compréhension et stimuler votre curiosité."}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="group" onClick={handleCreateNewChat}>
                    <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                    {t("startLearning") || "Commencer à apprendre"}
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 hidden md:block opacity-80">
                <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="60" cy="60" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="60" cy="20" r="3" fill="currentColor" />
                  <circle cx="30" cy="45" r="3" fill="currentColor" />
                  <circle cx="80" cy="40" r="3" fill="currentColor" />
                  <circle cx="45" cy="80" r="3" fill="currentColor" />
                  <circle cx="90" cy="75" r="3" fill="currentColor" />
                  <line x1="60" y1="20" x2="30" y2="45" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="30" y1="45" x2="80" y2="40" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="80" y1="40" x2="45" y2="80" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="45" y1="80" x2="90" y2="75" stroke="currentColor" strokeWidth="0.5" />
                  <text x="60" y="15" textAnchor="middle" fill="currentColor" fontSize="6">Géométrie</text>
                  <text x="20" y="45" textAnchor="end" fill="currentColor" fontSize="6">Histoire</text>
                  <text x="85" y="35" textAnchor="start" fill="currentColor" fontSize="6">Physique</text>
                  <text x="40" y="90" textAnchor="middle" fill="currentColor" fontSize="6">Art</text>
                  <text x="95" y="80" textAnchor="start" fill="currentColor" fontSize="6">Littérature</text>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TutorChat;
