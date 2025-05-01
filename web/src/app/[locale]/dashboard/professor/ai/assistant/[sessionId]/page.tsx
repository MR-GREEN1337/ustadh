"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  CornerDownLeft,
  FileText,
  PaperclipIcon,
  Brain,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Sparkles,
  ClipboardList,
  Users,
  ArrowUpRight,
  Zap,
  Layers,
  PencilRuler,
  BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { v4 as uuidv4 } from 'uuid';
import { ProfessorAIService } from '@/services/ProfessorAIService';
import { ProfessorService } from '@/services/ProfessorService';
import fileService from '@/services/FileService';
import ChatMessage from '@/app/[locale]/dashboard/tutor/chat/[chatId]/_components/ChatMessage';
import ChatInput from '@/app/[locale]/dashboard/tutor/chat/[chatId]/_components/ChatInput';
import ScheduleService from '@/services/ScheduleService';
import { ProfileService } from '@/services/ProfileService';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  exchangeId?: number;
  isBookmarked?: boolean;
  hasWhiteboard?: boolean;
  attachedFiles?: Array<{
    id: string;
    fileName: string;
    contentType: string;
    url: string;
  }>;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  sessionId?: string;
  category?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  academicLevel: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  status: string;
}

// @ mention options for professor-specific features
const atMentionOptions = [
  {
    id: 'course',
    name: 'course',
    description: 'Ajouter du contexte d\'un cours',
    icon: <BookOpen className="h-4 w-4 text-primary" />
  },
  {
    id: 'assignment',
    name: 'assignment',
    description: 'Créer ou modifier un devoir',
    icon: <ClipboardList className="h-4 w-4 text-primary" />
  },
  {
    id: 'lecture',
    name: 'lecture',
    description: 'Préparer une leçon',
    icon: <GraduationCap className="h-4 w-4 text-primary" />
  },
  {
    id: 'rubric',
    name: 'rubric',
    description: 'Créer une grille d\'évaluation',
    icon: <PencilRuler className="h-4 w-4 text-primary" />
  },
  {
    id: 'students',
    name: 'students',
    description: 'Analyse des élèves',
    icon: <Users className="h-4 w-4 text-primary" />
  },
  {
    id: 'file',
    name: 'file',
    description: 'Joindre des fichiers',
    icon: <PaperclipIcon className="h-4 w-4 text-primary" />
  },
];

// Professor prompt templates
const professorPromptTemplates = [
  {
    name: "Plan de cours",
    prompt: "Aide-moi à créer un plan de cours complet pour mon cours de [sujet]. Je dois inclure les objectifs d'apprentissage, les ressources nécessaires, et une répartition sur [nombre] semaines."
  },
  {
    name: "Évaluation",
    prompt: "J'ai besoin de créer une évaluation pour mesurer la compréhension de mes élèves sur [sujet]. Pourrais-tu me suggérer différents types de questions et une grille d'évaluation?"
  },
  {
    name: "Analyse d'élèves",
    prompt: "J'ai remarqué que certains de mes élèves ont des difficultés avec [concept]. Quelles stratégies pourrais-je mettre en place pour mieux les accompagner?"
  },
  {
    name: "Activité pédagogique",
    prompt: "Suggère-moi des activités pédagogiques engageantes pour enseigner [concept] à mes élèves de [niveau]."
  }
];

// Chat context items for education context
const contextItems = [
  {
    id: 'teaching_style',
    title: 'Style d\'enseignement',
    description: 'Votre approche pédagogique personnelle',
    icon: <GraduationCap className="h-5 w-5" />
  },
  {
    id: 'course_materials',
    title: 'Matériels de cours',
    description: 'Manuels, ressources et supports utilisés',
    icon: <BookMarked className="h-5 w-5" />
  },
  {
    id: 'student_needs',
    title: 'Besoins des élèves',
    description: 'Caractéristiques de votre groupe d\'élèves',
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 'curriculum',
    title: 'Programme éducatif',
    description: 'Cadre officiel et objectifs pédagogiques',
    icon: <Layers className="h-5 w-5" />
  }
];

export function ProfessorAIAssistantDetailPage() {
  const { chatId } = useParams();
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exchangeId, setExchangeId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('');
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [professorCourses, setProfessorCourses] = useState<Course[]>([]);
  const [professorAssignments, setProfessorAssignments] = useState<Assignment[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    fileName: string;
    contentType: string;
    url: string;
  }>>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('chat');

  // Load chat from localStorage or API
  useEffect(() => {
    const loadChat = async () => {
      try {
        setIsLoading(true);

        // Try to get from localStorage first
        const storedChats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
        const existingChat = storedChats.find((c: Chat) => c.id === chatId);

        if (existingChat) {
          setChat(existingChat);
          setChatTitle(existingChat.title);
          if (existingChat.sessionId) {
            setSessionId(existingChat.sessionId);
          }
          setIsLoading(false);
          return;
        }

        // If not found in localStorage and user is logged in, try the API
        if (user) {
          try {
            // This would be the API call to get the chat
            // For now, we'll create a new one since it doesn't exist
            const newChat: Chat = {
              id: chatId as string,
              title: "Nouvelle conversation avec l'assistant",
              createdAt: new Date().toISOString(),
              messages: [
                {
                  id: `system-${Date.now()}`,
                  role: 'system',
                  content: "Je suis l'assistant pédagogique, conçu pour aider les professeurs à préparer leurs cours, créer des évaluations, analyser les performances des élèves et plus encore. Comment puis-je vous aider aujourd'hui?",
                  timestamp: new Date().toISOString()
                }
              ]
            };

            // Initialize session in API
            const session = await ProfessorAIService.initializeAssistantSession({
              session_id: newChat.id,
              title: newChat.title,
              new_session: true
            });

            newChat.sessionId = session.id;
            setSessionId(session.id);

            // Save to localStorage
            localStorage.setItem('professor_chats', JSON.stringify([newChat, ...storedChats]));

            setChat(newChat);
            setChatTitle(newChat.title);
          } catch (error) {
            console.error("Error initializing chat with API:", error);
            // Create new chat anyway
            createNewChat();
          }
        } else {
          // Create new chat
          createNewChat();
        }
      } catch (error) {
        console.error("Error loading chat:", error);
        createNewChat();
      }

      setIsLoading(false);
    };

    const createNewChat = () => {
      const newChat: Chat = {
        id: chatId as string,
        title: "Nouvelle conversation avec l'assistant",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: `system-${Date.now()}`,
            role: 'system',
            content: "Je suis l'assistant pédagogique, conçu pour aider les professeurs à préparer leurs cours, créer des évaluations, analyser les performances des élèves et plus encore. Comment puis-je vous aider aujourd'hui?",
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Save to localStorage
      const storedChats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
      localStorage.setItem('professor_chats', JSON.stringify([newChat, ...storedChats]));

      setChat(newChat);
      setChatTitle(newChat.title);
    };

    loadChat();

    // Load professor courses and assignments
    const loadProfessorResources = async () => {
      if (user) {
        try {
          const coursesResponse = await ScheduleService.getProfessorCourses();
          setProfessorCourses(coursesResponse.courses || []);

          const assignmentsResponse = await ProfileService.getProfessorAssignments();
          setProfessorAssignments(assignmentsResponse.assignments || []);
        } catch (error) {
          console.error("Error loading professor resources:", error);
        }
      }
    };

    loadProfessorResources();
  }, [chatId, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages, currentResponse, shouldAutoScroll]);

  // Add scroll position detection
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) return;

    const handleScroll = () => {
      // Get the scroll container
      const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]') || scrollArea;

      // Calculate if we're near the bottom (within 100px)
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;

      setShouldAutoScroll(isAtBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll, { capture: true });

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // Check for initial prompt from sessionStorage
  useEffect(() => {
    const checkForInitialPrompt = async () => {
      try {
        const initialPrompt = sessionStorage.getItem(`chat-${chatId}-initial-prompt`);
        if (initialPrompt && chat && chat.messages.length === 1) {
          // Set input and simulate sending after a brief delay
          setInput(initialPrompt);
          setTimeout(() => {
            handleSubmit(new CustomEvent('submit') as unknown as React.FormEvent);
            sessionStorage.removeItem(`chat-${chatId}-initial-prompt`);
          }, 500);
        }
      } catch (error) {
        console.error("Error checking for initial prompt:", error);
      }
    };

    if (chat) {
      checkForInitialPrompt();
    }
  }, [chat]);

  const updateChatTitle = (newTitle: string) => {
    if (!chat) return;

    const updatedChat = { ...chat, title: newTitle };
    setChat(updatedChat);
    setChatTitle(newTitle);

    // Update localStorage
    const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
    const updatedChats = chats.map((c: Chat) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('professor_chats', JSON.stringify(updatedChats));
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files.length || !chat) return;

    setUploadingFiles(true);

    try {
      let fileUploadResults;

      // Use the API if user is logged in, otherwise store locally
      if (user && sessionId) {
        fileUploadResults = await fileService.uploadMultipleFiles(files, sessionId);
      } else {
        // Fallback to local storage for offline mode
        //const uploadPromises = files.map(file => fileService.storeFileLocally(file, chat.id));
        //fileUploadResults = await Promise.all(uploadPromises);
      }

      // Store the uploaded files in state
      setUploadedFiles(prev => [...prev, ...fileUploadResults]);

      // Return the file information to be included in the message
      return fileUploadResults;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Échec du téléchargement",
        description: "Impossible de télécharger les fichiers",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSelectTemplate = (promptTemplate: string) => {
    setInput(promptTemplate);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddCourseContext = (courseId: string) => {
    // Find the selected course
    const course = professorCourses.find(c => c.id === courseId);
    if (!course) return;

    // Add course context to the input
    const courseContext = `@course: ${course.title}\nJ'aimerais travailler sur mon cours de ${course.title} (${course.subject}) pour mes élèves de ${course.academicLevel}. ${course.description}\n\n`;
    setInput(prev => courseContext + prev);
    setShowContextPanel(false);
  };

  const handleAddAssignmentContext = (assignmentId: string) => {
    // Find the selected assignment
    const assignment = professorAssignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Add assignment context to the input
    const assignmentContext = `@assignment: ${assignment.title}\nJ'ai besoin d'aide avec le devoir "${assignment.title}" qui est dû le ${assignment.dueDate}. Son statut actuel est "${assignment.status}".\n\n`;
    setInput(prev => assignmentContext + prev);
    setShowContextPanel(false);
  };

  const handleAddContextItem = (contextId: string) => {
    let contextText = "";

    switch(contextId) {
      case 'teaching_style':
        contextText = "@context: style d'enseignement\nMon approche pédagogique est basée sur l'apprentissage actif, avec un focus sur la collaboration et les projets pratiques. J'encourage les discussions et j'utilise souvent l'évaluation formative.\n\n";
        break;
      case 'course_materials':
        contextText = "@context: matériels\nJ'utilise principalement des ressources numériques interactives et des documents que je crée moi-même. Nous avons également un manuel de référence mais je préfère les activités contextualisées.\n\n";
        break;
      case 'student_needs':
        contextText = "@context: élèves\nMa classe est composée d'élèves de niveaux très variés. Plusieurs ont des besoins spécifiques d'apprentissage et j'ai quelques élèves particulièrement avancés qui ont besoin d'être stimulés davantage.\n\n";
        break;
      case 'curriculum':
        contextText = "@context: programme\nJe dois suivre le programme officiel qui insiste sur l'acquisition des compétences suivantes: analyse critique, résolution de problèmes, communication efficace et maîtrise des concepts fondamentaux de la matière.\n\n";
        break;
    }

    setInput(prev => contextText + prev);
    setActiveContext(contextId);
    setShowContextPanel(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || !chat || isLoading) return;

    // Process any newly uploaded files
    let attachedFiles = [...uploadedFiles];
    setUploadedFiles([]); // Clear the uploaded files state after attaching them to a message

    // Add user message
    const updatedMessages = [
      ...chat.messages,
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
        attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
      }
    ];

    // If this is the first user message, update the title
    let updatedTitle = chat.title;
    if (chat.messages.length === 1 && chat.messages[0].role === 'system' &&
        (chat.title === "Nouvelle conversation avec l'assistant")) {
      updatedTitle = input.length > 30 ? `${input.substring(0, 30)}...` : input;
      updateChatTitle(updatedTitle);
    }

    const updatedChat = {
      ...chat,
      messages: updatedMessages,
      title: updatedTitle
    };

    setChat(updatedChat);

    // Save to localStorage
    const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
    const chatExists = chats.some((c: Chat) => c.id === updatedChat.id);
    const updatedChats = chatExists
      ? chats.map((c: Chat) => c.id === updatedChat.id ? updatedChat : c)
      : [updatedChat, ...chats];
    localStorage.setItem('professor_chats', JSON.stringify(updatedChats));

    // Reset input
    setInput('');

    // Send to API if user is logged in
    if (user) {
      await sendToAPI(updatedChat, input, attachedFiles);
    } else {
      // Fallback to simulated response for demo
      simulateResponse(updatedChat, input);
    }
  };

  const sendToAPI = async (
    currentChat: Chat,
    userMessage: string,
    attachedFiles?: Array<{ id: string; fileName: string; contentType: string; url: string }> | null
  ) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setCurrentResponse('');

      // Important variables for tracking response state
      let responseCompleted = false;
      let fullResponse = '';
      let responseExchangeId = '';

      // Prepare the messages
      const messages = currentChat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attached_files: msg.attachedFiles
      }));

      // Create streaming request
      const response = await ProfessorAIService.createAssistantChatStream({
        messages,
        session_id: sessionId || undefined,
        new_session: !sessionId,
        session_title: currentChat.title,
        ...(attachedFiles && attachedFiles.length > 0
          ? { attached_files: attachedFiles }
          : {})
      });

      // Get the session ID from headers if this is a new session
      const responseSessionId = response.headers.get('Session-Id');
      responseExchangeId = response.headers.get('Exchange-Id') || '';

      if (responseSessionId) {
        setSessionId(responseSessionId);
        const updatedChat = { ...currentChat, sessionId: responseSessionId };
        setChat(updatedChat);

        // Update in localStorage
        const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
        const updatedChats = chats.map((c: Chat) =>
          c.id === updatedChat.id ? updatedChat : c
        );
        localStorage.setItem('professor_chats', JSON.stringify(updatedChats));
      }

      if (responseExchangeId) {
        setExchangeId(responseExchangeId);
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
                    responseCompleted = true;
                    finalizeResponse(currentChat, fullResponse, responseExchangeId);
                  }
                } catch (e) {
                  console.error('Error parsing SSE:', e);
                }
              }
            }
          }

          // Handle end of stream without completion signal
          if (done && !responseCompleted && fullResponse) {
            responseCompleted = true;
            finalizeResponse(currentChat, fullResponse, responseExchangeId);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      setIsLoading(false);

      // If we have a partial response, save it
      if (currentResponse && currentResponse.length > 0) {
        finalizeResponse(currentChat, currentResponse, exchangeId);
      } else {
        // Fallback to simulated response
        simulateResponse(currentChat, userMessage);
      }

      toast({
        title: "Erreur de connexion",
        description: "Passage au mode hors ligne. Certaines fonctionnalités peuvent être limitées.",
        variant: "destructive"
      });
    }
  };

  const finalizeResponse = async (currentChat: Chat, responseText: string, exchangeId: string | null) => {
    setIsLoading(false);

    if (!responseText || responseText.trim() === '') {
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
    setChat(updatedChat);

    // Update localStorage
    try {
      const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
      const updatedChats = chats.map((c: Chat) =>
        c.id === updatedChat.id ? updatedChat : c
      );
      localStorage.setItem('professor_chats', JSON.stringify(updatedChats));
    } catch (storageError) {
      console.error("Error updating localStorage:", storageError);
    }

    // Reset current response
    setCurrentResponse('');

    // Signal completion to the backend if we have an exchange ID and user
    if (exchangeId && user) {
      try {
        await ProfessorAIService.completeAssistantExchange(exchangeId, responseText);
      } catch (apiError) {
        console.error("Error completing exchange with API:", apiError);
      }
    }
  };

  // Fallback for offline mode
  const simulateResponse = (currentChat: Chat, prompt: string) => {
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      let aiResponse = "";

      // Provide relevant response based on prompt content
      if (prompt.toLowerCase().includes("plan de cours") || prompt.toLowerCase().includes("séquence d'apprentissage")) {
        aiResponse = "Je peux vous aider à développer un plan de cours structuré. Pour commencer, voici les éléments essentiels d'un plan de cours efficace :\n\n1. **Objectifs d'apprentissage** - Ce que les élèves seront capables de faire à la fin du cours\n2. **Contenu et séquence** - Organisation logique des sujets à couvrir\n3. **Méthodologie** - Approches pédagogiques que vous utiliserez\n4. **Évaluation** - Comment vous mesurerez l'apprentissage\n5. **Ressources** - Matériels nécessaires\n\nVoulez-vous que je développe l'un de ces aspects en particulier pour votre cours?";
      }
      else if (prompt.toLowerCase().includes("évaluation") || prompt.toLowerCase().includes("examen") || prompt.toLowerCase().includes("devoir")) {
        aiResponse = "Développer des évaluations efficaces est essentiel pour mesurer l'apprentissage des élèves. Voici quelques approches que je vous suggère :\n\n**Évaluations formatives** :\n- Questions à réponse courte pour vérifier la compréhension\n- Exercices d'application\n- Discussions en classe avec feedback immédiat\n\n**Évaluations sommatives** :\n- Tests écrits combinant différents types de questions\n- Projets de recherche ou de création\n- Présentations orales\n\nJe peux vous aider à élaborer l'un de ces types d'évaluation en détail si vous le souhaitez.";
      }
      else if (prompt.toLowerCase().includes("élèves") || prompt.toLowerCase().includes("étudiants") || prompt.toLowerCase().includes("apprentissage")) {
        aiResponse = "Pour mieux accompagner vos élèves, il est important d'adapter votre enseignement à leurs besoins spécifiques. Voici quelques stratégies que vous pourriez mettre en place :\n\n1. **Évaluation diagnostique** - Identifier précisément les zones de difficulté\n2. **Différenciation pédagogique** - Adapter les activités selon les profils d'apprentissage\n3. **Tutorat par les pairs** - Mettre en place des groupes de travail mixtes\n4. **Rétroaction constructive** - Fournir des commentaires détaillés sur leur travail\n5. **Suivi individualisé** - Prévoir des moments d'échange en tête-à-tête\n\nSouhaitez-vous approfondir l'une de ces approches?";
      }
      else {
        aiResponse = "Je suis votre assistant pédagogique et je peux vous aider dans plusieurs aspects de votre travail d'enseignant :\n\n- Création de plans de cours et de séquences d'apprentissage\n- Développement d'évaluations formatives et sommatives\n- Analyse des performances des élèves\n- Stratégies pédagogiques innovantes\n- Gestion de classe et organisation\n\nN'hésitez pas à me poser des questions spécifiques sur ces sujets ou d'autres aspects de votre enseignement. Comment puis-je vous aider aujourd'hui?";
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
      setChat(updatedChat);
      const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
      const updatedChats = chats.map((c: Chat) =>
        c.id === updatedChat.id ? updatedChat : c
      );
      localStorage.setItem('professor_chats', JSON.stringify(updatedChats));

      setIsLoading(false);
    }, 1500);
  };

  // Handle toggle bookmark
  const handleToggleBookmark = (message: Message) => {
    if (!chat || !user || !message.exchangeId) return;

    // Clone the current chat
    const updatedChat = { ...chat };

    // Find the message and toggle bookmark state
    const updatedMessages = chat.messages.map(msg => {
      if (msg.id === message.id) {
        return {
          ...msg,
          isBookmarked: !msg.isBookmarked
        };
      }
      return msg;
    });

    // Update the chat
    updatedChat.messages = updatedMessages;
    setChat(updatedChat);

    // Update localStorage
    const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
    const updatedChats = chats.map((c: Chat) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('professor_chats', JSON.stringify(updatedChats));

    // Update API (implement when available)
    toast({
      title: message.isBookmarked ? "Supprimé des favoris" : "Ajouté aux favoris",
      description: message.isBookmarked ?
        "Ce message a été retiré de vos favoris" :
        "Ce message a été ajouté à vos favoris pour référence future",
    });
  };

  // Handle edit message
  const handleEditMessage = (originalMessage: Message, newContent: string) => {
    if (!chat) return;

    // Find the message index
    const messageIndex = chat.messages.findIndex(m => m.id === originalMessage.id);
    if (messageIndex === -1) return;

    // Remove all messages that came after this one
    const updatedMessages = chat.messages.slice(0, messageIndex);

    // Add the edited message
    updatedMessages.push({
      ...originalMessage,
      content: newContent,
      timestamp: new Date().toISOString()
    });

    // Update the chat
    const updatedChat = { ...chat, messages: updatedMessages };
    setChat(updatedChat);

    // Update localStorage
    const chats = JSON.parse(localStorage.getItem('professor_chats') || '[]');
    const updatedChats = chats.map((c: Chat) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('professor_chats', JSON.stringify(updatedChats));

    // Send to API or simulate
    if (user) {
      sendToAPI(updatedChat, newContent);
    } else {
      simulateResponse(updatedChat, newContent);
    }
  };

  const isRTL = locale === "ar";

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Chargement de votre conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Chat header */}
      <div className="fixed top-0 left-0 right-0 md:left-60 bg-background/95 backdrop-blur-sm border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center">
            <Link href={`/${locale}/dashboard/professor/ai/assistant`} className="mr-3">
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            {chat.title ? (
              <div className="flex items-center">
                <h2 className="font-medium text-lg truncate max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                  {chat.title}
                </h2>
                <div className="flex items-center ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Assistant Professeur
                </div>
              </div>
            ) : (
              <Input
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                onBlur={() => {
                  if (chatTitle.trim()) {
                    updateChatTitle(chatTitle);
                  }
                }}
                placeholder="Titre de la conversation"
                className="max-w-[250px]"
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setShowContextPanel(!showContextPanel)}
                  >
                    <Layers className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Contexte éducatif</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setActiveTab(activeTab === 'chat' ? 'templates' : 'chat')}
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modèles de prompts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="flex flex-1 mt-16 overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsContent value="chat" className="flex-1 overflow-hidden m-0 p-0">
              <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                <div className="px-4 py-4 space-y-6 pb-36 max-w-4xl mx-auto">
                  {/* Initial welcome message for empty chat */}
                  {chat.messages.length <= 1 && (
                    <div className="flex flex-col items-center text-center my-12">
                      <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <GraduationCap className="h-10 w-10" />
                      </div>
                      <h2 className="text-xl font-medium mb-2">Assistant du professeur</h2>
                      <p className="text-muted-foreground max-w-md mb-6">
                        Je peux vous aider à préparer vos cours, créer des évaluations, analyser les performances des élèves et bien plus encore.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                        {professorPromptTemplates.map((template, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            className="justify-start h-auto py-3 text-left flex items-start"
                            onClick={() => handleSelectTemplate(template.prompt)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium mb-1">{template.name}</span>
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {template.prompt.substring(0, 60)}...
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display chat messages (skipping system message) */}
                  {chat.messages.filter(msg => msg.role !== 'system').map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLatest={index === chat.messages.length - 1}
                      user={user}
                      onToggleBookmark={() => handleToggleBookmark(message)}
                      onResend={() => {}}
                      onEdit={handleEditMessage}
                    />
                  ))}

                  {/* Current streaming response */}
                  {currentResponse && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[75%]">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-secondary">
                            <GraduationCap className="h-4 w-4" />
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
                            <GraduationCap className="h-4 w-4" />
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
            </TabsContent>

            <TabsContent value="templates" className="m-0 p-0 overflow-auto">
              <div className="p-4 space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Modèles pour enseignants
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('chat')}>
                    Retour au chat
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                        Plans de cours
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Pouvez-vous m'aider à créer un plan de cours pour [sujet] destiné à des élèves de [niveau]? Je dois couvrir les objectifs suivants: [liste d'objectifs].");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Plan de cours complet</h4>
                          <p className="text-xs text-muted-foreground mt-1">Structure complète avec objectifs et séquence pédagogique</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Je dois créer une séquence pédagogique sur [concept/thème] pour [durée]. Comment structurer les activités pour maximiser l'engagement et la compréhension?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Séquence d'activités</h4>
                          <p className="text-xs text-muted-foreground mt-1">Séquence d'activités d'apprentissage structurées</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Comment puis-je intégrer plus efficacement [compétence/concept] dans mon cours de [matière]? Mes élèves ont des difficultés particulières avec [point spécifique].");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Intégration de concepts</h4>
                          <p className="text-xs text-muted-foreground mt-1">Conseils pour l'intégration efficace de concepts spécifiques</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3 flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2 text-amber-500" />
                        Évaluations
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("J'ai besoin de créer une évaluation formative pour vérifier la compréhension de [concept] chez mes élèves de [niveau]. Quels types de questions ou d'activités seraient les plus efficaces?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Évaluation formative</h4>
                          <p className="text-xs text-muted-foreground mt-1">Vérification rapide de la compréhension</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Pouvez-vous m'aider à créer un examen complet sur [sujet] pour mes élèves de [niveau]? Je voudrais inclure différents types de questions pour évaluer plusieurs niveaux de compréhension.");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Examen complet</h4>
                          <p className="text-xs text-muted-foreground mt-1">Évaluation sommative avec variété de formats</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("J'ai besoin d'une grille d'évaluation détaillée pour [type de projet/devoir]. Les critères principaux devraient inclure [liste de critères].");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Grille d'évaluation</h4>
                          <p className="text-xs text-muted-foreground mt-1">Rubrique détaillée avec critères et niveaux</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-emerald-500" />
                        Analyse d'élèves
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("J'ai remarqué que plusieurs de mes élèves ont des difficultés avec [concept/compétence]. Quelles stratégies de remédiation puis-je mettre en place?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Stratégies de remédiation</h4>
                          <p className="text-xs text-muted-foreground mt-1">Approches pour aider les élèves en difficulté</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Comment puis-je différencier mon enseignement pour mieux répondre aux besoins variés de mes élèves, particulièrement pour [sujet/compétence]?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Différenciation pédagogique</h4>
                          <p className="text-xs text-muted-foreground mt-1">Adapter l'enseignement aux divers besoins</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("J'aimerais analyser les résultats de ma dernière évaluation sur [sujet]. Quelles tendances devrais-je rechercher et comment interpréter ces données pour améliorer mon enseignement?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Analyse de performances</h4>
                          <p className="text-xs text-muted-foreground mt-1">Interprétation des données de performance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-purple-500" />
                        Pédagogie innovante
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Quelles activités pédagogiques innovantes puis-je utiliser pour enseigner [concept] de manière plus engageante? Mes élèves ont [caractéristiques] et s'intéressent particulièrement à [centres d'intérêt].");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Activités engageantes</h4>
                          <p className="text-xs text-muted-foreground mt-1">Méthodes créatives pour captiver l'attention</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Comment puis-je intégrer efficacement la technologie dans mon enseignement de [matière], particulièrement pour [objectif pédagogique spécifique]?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Intégration technologique</h4>
                          <p className="text-xs text-muted-foreground mt-1">Outils numériques pour l'enseignement</p>
                        </div>
                        <div className="p-3 border rounded-md hover:bg-accent hover:border-primary/20 cursor-pointer transition-colors"
                             onClick={() => {
                               handleSelectTemplate("Je cherche à mettre en place une approche basée sur les projets pour [sujet/unité]. Quels types de projets authentiques pourraient engager mes élèves tout en couvrant les objectifs d'apprentissage essentiels?");
                               setActiveTab('chat');
                             }}>
                          <h4 className="font-medium text-sm">Apprentissage par projets</h4>
                          <p className="text-xs text-muted-foreground mt-1">Conception de projets authentiques et engageants</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Context panel (slide-in from right) */}
          {showContextPanel && (
            <div className="absolute top-0 right-0 bottom-0 z-10 w-80 bg-background border-l shadow-lg animate-slide-in-right">
              <div className="p-4 h-full overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Contexte éducatif</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowContextPanel(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                {/* Context categories */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-muted-foreground">Ajouter du contexte à votre requête</p>

                  {contextItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-md hover:bg-accent cursor-pointer ${
                        activeContext === item.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleAddContextItem(item.id)}
                    >
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-3">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Courses section */}
                {professorCourses.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <BookOpen className="h-4 w-4 mr-1 text-blue-500" />
                      Mes cours
                    </h4>
                    <div className="space-y-2">
                      {professorCourses.slice(0, 3).map(course => (
                        <div
                          key={course.id}
                          className="p-2 border rounded-md hover:bg-accent cursor-pointer text-sm"
                          onClick={() => handleAddCourseContext(course.id)}
                        >
                          <div className="font-medium">{course.title}</div>
                          <div className="text-xs text-muted-foreground">{course.subject} • {course.academicLevel}</div>
                        </div>
                      ))}
                      {professorCourses.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          asChild
                        >
                          <Link href={`/${locale}/dashboard/professor/courses`}>
                            Voir tous les cours
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignments section */}
                {professorAssignments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <ClipboardList className="h-4 w-4 mr-1 text-amber-500" />
                      Mes évaluations
                    </h4>
                    <div className="space-y-2">
                      {professorAssignments.slice(0, 3).map(assignment => (
                        <div
                          key={assignment.id}
                          className="p-2 border rounded-md hover:bg-accent cursor-pointer text-sm"
                          onClick={() => handleAddAssignmentContext(assignment.id)}
                        >
                          <div className="font-medium">{assignment.title}</div>
                          <div className="text-xs text-muted-foreground">Échéance: {assignment.dueDate}</div>
                        </div>
                      ))}
                      {professorAssignments.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          asChild
                        >
                          <Link href={`/${locale}/dashboard/professor/assignments`}>
                            Voir toutes les évaluations
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat input */}
      <ChatInput
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading || uploadingFiles}
        placeholder={t("askProfessorAssistant") || "Posez une question à votre assistant pédagogique..."}
        isRTL={locale === "ar"}
        atMentionOptions={atMentionOptions}
        t={t}
        onFileUpload={handleFileUpload}
        uploadedFiles={uploadedFiles}
      />

      {/* Floating help button */}
      <div className="fixed bottom-24 right-4 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={() => setActiveTab(activeTab === 'chat' ? 'templates' : 'chat')}
              >
                {activeTab === 'chat' ? (
                  <FileText className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{activeTab === 'chat' ? 'Voir les modèles' : 'Retour au chat'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// Add this CSS for slide-in animation
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    .animate-slide-in-right {
      animation: slideInRight 0.3s ease-out forwards;
    }
  `}</style>
);

export default function ProfessorAIAssistantDetailPageWithStyles() {
  return (
    <>
      <GlobalStyles />
      <ProfessorAIAssistantDetailPage />
    </>
  );
}
