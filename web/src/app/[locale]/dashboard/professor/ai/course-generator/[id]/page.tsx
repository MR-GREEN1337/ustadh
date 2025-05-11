"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { toast } from 'sonner';
import { useCourseGenerator } from '@/hooks/useCourseGenerator';
import { GENERATION_STATES } from '@/services/CourseGeneratorWebSocketService';

// UI Components
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  BookOpen,
  Sparkles,
  MessageSquare,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Save,
  Lightbulb,
  ClipboardList,
  Brain,
  Wifi,
  WifiOff,
  Eye,
  PanelRight,
  X,
  Plus,
  Clock,
  Target,
  FileText,
  Calendar,
  BarChart3,
  Maximize2,
  Minimize2,
  Share2,
  Download,
  History,
  Settings,
  Wand2,
  Layers,
  Network,
  Zap,
  Stars,
  Beaker,
  BookTemplate,
  Palette,
  Compass,
  Crown,
  Gem,
  Feather,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

// Enhanced Types
interface CourseGeneratorState {
  status: string;
  progress: number;
  currentStep: string;
  messages: any[];
  courseData: any;
  error: string | null;
  isStreamingResponse: boolean;
  lastUserMessage: string;
}

const CourseGenerator = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const { courseId } = useParams();

  // Enhanced session management
  const [sessionId] = useState(() =>
    courseId as string || `course-gen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  );

  // Enhanced state management
  const [coursePreferences, setCoursePreferences] = useState({
    subject: '',
    educationLevel: 'university',
    duration: 'semester',
    focus: 'comprehensive',
    difficulty: 'intermediate',
    language: 'en',
    specialization: '',
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [showPreview, setShowPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use the enhanced course generator hook
  const {
    isConnected,
    generatorState,
    sendMessage,
    startGeneration,
    resetGenerator,
    error: hookError,
  } = useCourseGenerator({ sessionId });

  // UI state
  const [chatMessage, setChatMessage] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);
  const [typingDots, setTypingDots] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Elegant typing indicator effect
  useEffect(() => {
    if (generatorState.isStreamingResponse || isSubmitting) {
      const interval = setInterval(() => {
        setTypingDots(prev => {
          if (prev === '...') return '.';
          return prev + '.';
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setTypingDots('');
    }
  }, [generatorState.isStreamingResponse, isSubmitting]);

  // Auto-scroll with smooth behavior
  useEffect(() => {
    if (shouldAutoScroll && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [generatorState.messages, shouldAutoScroll]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [generatorState.messages]);

  // Scroll detection for auto-scroll behavior
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]') || scrollArea;
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      setIsNearBottom(isAtBottom);
      setShouldAutoScroll(isAtBottom);
    };

    const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]') || scrollArea;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Focus management
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-preview when course is complete
  useEffect(() => {
    if (generatorState.courseData && generatorState.status === GENERATION_STATES.COMPLETE) {
      setShowPreview(true);
      setActiveTab('preview');
    }
  }, [generatorState.courseData, generatorState.status]);

  // Enhanced message submission
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !isConnected || isSubmitting) return;

    const messageContent = chatMessage.trim();
    console.log('Sending message:', messageContent, 'Status:', generatorState.status);

    setIsSubmitting(true);

    // Clear input immediately for better UX
    setChatMessage('');

    try {
      if (generatorState.status === GENERATION_STATES.IDLE) {
        console.log('Starting generation...');

        // First message - start generation
        const enhancedMessage = {
          content: messageContent,
          preferences: {
            ...coursePreferences,
            initialPrompt: messageContent,
          }
        };

        // Start generation and wait for it to begin
        await startGeneration(enhancedMessage);

        // Log status after starting
        console.log('Generation started, new status:', generatorState.status);
      } else {
        console.log('Continuing conversation...');
        // Continue conversation
        await sendMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
      toast.error('Failed to send message. Please try again.');
      // Restore the message if it failed
      setChatMessage(messageContent);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Save course with enhanced options
  const saveCourse = async () => {
    if (!generatorState.courseData) return;

    try {
      const response = await fetch(`/api/v1/professors/course-generator/sessions/${sessionId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to save course: ${response.statusText}`);
      }

      const data = await response.json();
      toast.success(t('courseCreatedSuccessfully'));
      router.push(`/${locale}/dashboard/professor/courses/${data.id}`);
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || t('errorSavingCourse'));
    }
  };

  // Export course in various formats
  const exportCourse = async (format: string) => {
    if (!generatorState.courseData) return;

    try {
      const response = await fetch(`/api/v1/professors/course-generator/sessions/${sessionId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to export course: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-${sessionId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('courseExportedSuccessfully'));
    } catch (error: any) {
      console.error('Error exporting course:', error);
      toast.error(error.message || t('errorExportingCourse'));
    }
  };

  // Elegant connection status
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 dark:bg-destructive/5">
            <div className="flex items-center">
              <WifiOff className="h-4 w-4 text-destructive" />
              <AlertTitle className="ml-2 text-destructive">
                {t('connectionIssue')}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-1 text-destructive/80">
              {lastConnectionError || t('notConnectedToCourseGenerator')}
              <Button
                variant="link"
                size="sm"
                onClick={resetGenerator}
                className="p-0 h-auto ml-2 text-destructive hover:text-destructive/80"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('reconnect')}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return null;
  };

  // Elegant progress indicator
  const renderProgressIndicator = () => {
    // Show indicator during generation OR when submitting first message
    if (generatorState.status === GENERATION_STATES.IDLE && !isSubmitting) {
      return null;
    }

    if (generatorState.status === GENERATION_STATES.COMPLETE ||
        generatorState.status === GENERATION_STATES.ERROR) {
      return null;
    }

    // If submitting first message, show a simple loading state
    if (isSubmitting && generatorState.status === GENERATION_STATES.IDLE) {
      return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-full px-6 py-3 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-primary font-medium">Starting course generation...</span>
          </div>
        </div>
      );
    }

    const steps = [
      { key: 'brainstorming', label: t('brainstorming'), icon: Lightbulb },
      { key: 'structuring', label: t('structuring'), icon: Layers },
      { key: 'detailing', label: t('detailing'), icon: FileText },
      { key: 'finalizing', label: t('finalizing'), icon: CheckCircle2 },
    ];

    const currentStepIndex = steps.findIndex(step => step.key === generatorState.status);
    const progressPercent = generatorState.progress || (currentStepIndex + 1) * 25;

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex items-center space-x-2">
                <div className={`relative transition-all duration-300 ${isActive ? 'scale-110' : isCompleted ? 'scale-100' : 'scale-90 opacity-50'
                  }`}>
                  <div className={`p-1.5 rounded-full ${isActive ? 'bg-primary text-primary-foreground animate-pulse' :
                    isCompleted ? 'bg-chart-2 text-background' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    <StepIcon className="h-3 w-3" />
                  </div>
                  {isActive && (
                    <div className="absolute -inset-1 border-2 border-primary/30 rounded-full animate-ping" />
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${isActive ? 'text-primary' :
                  isCompleted ? 'text-chart-2' :
                    'text-muted-foreground'
                  }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 w-full bg-border rounded-full h-0.5 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  };

  // Elegant chat messages
  const renderMessages = () => {
    return (
      <ScrollArea className="flex-1 h-full" ref={scrollAreaRef}>
        <div className="max-w-none mx-auto space-y-6 lg:space-y-8 p-4 sm:p-6 lg:p-8">
          {generatorState.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 lg:py-24 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
                <div className="relative bg-primary text-primary-foreground p-4 lg:p-6 rounded-3xl shadow-lg">
                  <Sparkles className="h-8 w-8 lg:h-12 lg:w-12 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl lg:text-2xl font-serif font-light mb-3">{t('startCourseGeneration')}</h3>
              <p className="text-muted-foreground mb-8 max-w-lg font-light text-sm lg:text-base px-4">
                {t('courseGenerationHelp')}
              </p>
              <div className="bg-card border border-border rounded-2xl p-4 lg:p-6 max-w-lg w-full mx-4">
                <p className="text-foreground text-sm font-light italic">
                  {t('courseExamplePrompt')}
                </p>
              </div>
            </div>
          ) : (
            generatorState.messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === 'user' ? 'justify-end md:justify-end' : 'justify-start md:justify-start'} group w-full`}
              >
                <div className={`flex gap-3 lg:gap-4 w-full max-w-[calc(100%-2rem)] md:max-w-[70%] lg:max-w-[60%] transition-all duration-200 ${message.role === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'
                  }`}>
                  <Avatar className={`h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0 transition-all duration-200 ${message.role === 'user' ? 'ring-2 ring-primary/20' : 'ring-2 ring-chart-4/20'
                    }`}>
                    <AvatarFallback className={`text-xs ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-chart-4 text-background'
                      }`}>
                      {message.role === 'user' ? 'You' :
                        message.role === 'system' ? <AlertCircle className="h-3 w-3 lg:h-4 lg:w-4" /> :
                          <Brain className="h-3 w-3 lg:h-4 lg:w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`relative ${message.role === 'user' ? 'bg-primary text-primary-foreground' :
                    message.role === 'system' ? 'bg-muted text-muted-foreground' :
                      'bg-card border border-border text-foreground'
                    } rounded-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-sm`}>
                    <div className="prose prose-sm max-w-none dark:prose-invert text-sm lg:text-base">
                      {message.content}
                    </div>
                    <div className={`text-xs mt-2 lg:mt-3 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                      {new Date(message.timestamp).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator - Show during streaming OR when submitting first message */}
          {(generatorState.isStreamingResponse || isSubmitting) && (
            <div className="flex justify-start group">
              <div className="flex gap-3 lg:gap-4 max-w-[calc(100%-2rem)] md:max-w-[70%] lg:max-w-[60%]">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0 ring-2 ring-chart-4/20">
                  <AvatarFallback className="bg-chart-4 text-background">
                    <Brain className="h-3 w-3 lg:h-4 lg:w-4 animate-pulse" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border border-border rounded-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-chart-4 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {isSubmitting && generatorState.status === GENERATION_STATES.IDLE && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Starting course generation...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
    );
  };

  // Elegant course preview
  const renderCoursePreview = () => {
    if (!generatorState.courseData) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 lg:p-12 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 blur-3xl bg-chart-4/20 rounded-full" />
            <div className="relative p-6">
              <BookOpen className="h-12 w-12 lg:h-16 lg:w-16 text-chart-4" />
            </div>
          </div>
          <h3 className="text-lg lg:text-xl font-serif mb-2">{t('noCourseDataYet')}</h3>
          <p className="text-muted-foreground max-w-md font-light text-sm lg:text-base">
            {t('startChatToGenerate')}
          </p>
        </div>
      );
    }

    const course = generatorState.courseData;

    return (
      <ScrollArea className="h-full">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Elegant course header */}
          <div className="relative mb-8 lg:mb-12">
            <div className="absolute inset-0 blur-3xl bg-primary/5 rounded-3xl" />
            <div className="relative bg-card border border-border rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6 mb-4 lg:mb-6">
                <div className="min-w-0">
                  <h1 className="text-2xl lg:text-4xl font-serif font-light mb-3 break-words">{course.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {course.code || 'DRAFT'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span>{t(course.educationLevel || 'university')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span>{t(course.courseDuration || 'semester')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportCourse('pdf')}
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <Download className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="text-xs lg:text-sm">Export</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveCourse}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-initial"
                  >
                    <Save className="h-3 w-3 lg:h-4 lg:w-4" />
                    <span className="text-xs lg:text-sm">Save Course</span>
                  </Button>
                </div>
              </div>

              <p className="text-foreground leading-relaxed font-light text-sm lg:text-base">
                {course.description}
              </p>

              {course.topics && course.topics.length > 0 && (
                <div className="mt-4 lg:mt-6 flex flex-wrap gap-2">
                  {course.topics.map((topic, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="objectives" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8 bg-muted p-1 rounded-lg overflow-x-auto">
              <TabsTrigger value="objectives" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                <Target className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Objectives</span>
              </TabsTrigger>
              <TabsTrigger value="syllabus" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                <BookOpen className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Syllabus</span>
              </TabsTrigger>
              <TabsTrigger value="assessments" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Assessments</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-1 lg:gap-2 text-xs lg:text-sm">
                <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="objectives">
              <Card className="border-0 shadow-lg bg-chart-4/5">
                <CardContent className="p-4 lg:p-6">
                  <h3 className="text-lg lg:text-xl font-serif font-medium mb-4 lg:mb-6 flex items-center gap-2 text-foreground">
                    <Lightbulb className="h-4 w-4 lg:h-5 lg:w-5 text-chart-4" />
                    Learning Objectives
                  </h3>
                  <div className="grid gap-3 lg:gap-4">
                    {course.learningObjectives?.map((objective, idx) => (
                      <div key={idx} className="flex gap-3 group">
                        <div className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-chart-4/20 text-chart-4 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-medium">{idx + 1}</span>
                        </div>
                        <p className="text-foreground leading-relaxed group-hover:text-primary transition-colors text-sm lg:text-base">
                          {objective}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="syllabus">
              <div className="space-y-3 lg:space-y-4">
                {course.syllabus?.map((week, idx) => (
                  <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-3 lg:mb-4">
                        <div className="min-w-0">
                          <h4 className="text-base lg:text-lg font-medium flex items-center gap-2">
                            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-chart-2 text-background flex items-center justify-center text-xs lg:text-sm font-medium flex-shrink-0">
                              {week.week}
                            </div>
                            <span className="min-w-0 break-words">{week.title}</span>
                          </h4>
                          <p className="text-muted-foreground mt-2 leading-relaxed text-sm lg:text-base">
                            {week.description}
                          </p>
                        </div>
                      </div>

                      {week.topics?.length > 0 && (
                        <div className="mt-3 lg:mt-4 flex flex-wrap gap-2">
                          {week.topics.map((topic, topicIdx) => (
                            <Badge
                              key={topicIdx}
                              variant="outline"
                              className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs"
                            >
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assessments">
              <div className="grid gap-3 lg:gap-4">
                {course.assessments?.map((assessment, idx) => (
                  <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                            <h4 className="text-base lg:text-lg font-medium">{assessment.title}</h4>
                            <Badge className={`text-xs ${assessment.type === 'exam' ? 'bg-destructive/10 text-destructive' :
                              assessment.type === 'project' ? 'bg-chart-4/10 text-chart-4' :
                                assessment.type === 'quiz' ? 'bg-chart-2/10 text-chart-2' :
                                  'bg-chart-1/10 text-chart-1'
                              }`}>
                              {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {assessment.description}
                          </p>
                        </div>
                        {assessment.weight && (
                          <div className="text-right sm:text-left">
                            <div className="text-xs text-muted-foreground">Weight</div>
                            <div className="text-base lg:text-lg font-semibold text-foreground">
                              {assessment.weight}%
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 lg:p-6">
                  <h3 className="text-lg lg:text-xl font-serif font-medium mb-4 lg:mb-6 flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-chart-2" />
                    Course Resources
                  </h3>
                  <div className="space-y-3 lg:space-y-4">
                    {course.recommendedMaterials?.map((material: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-chart-2/10 text-chart-2 flex items-center justify-center">
                          <BookTemplate className="h-3 w-3 lg:h-4 lg:w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground text-sm lg:text-base break-words">{material}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    );
  };

  // Elegant chat input
  const renderChatInput = () => {
    return (
      <div className="sticky bottom-0 w-full bg-background/98 backdrop-blur-md border-t border-border z-30">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="bg-card/98 dark:bg-card/98 backdrop-blur-sm rounded-xl shadow-2xl p-3 lg:p-6 border border-border/50">
            <div className="flex gap-2 lg:gap-4">
              {/* Enhanced input area */}
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !isConnected
                      ? t('waitingForConnection')
                      : generatorState.status === GENERATION_STATES.IDLE
                        ? isSubmitting
                          ? t('startingGeneration')
                          : t('askForCourseGeneration')
                        : isSubmitting
                          ? t('sending')
                          : t('typeMessageToContinue')
                  }
                  disabled={!isConnected}
                  className="min-h-[44px] resize-none border-input bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary focus:ring-2 text-sm lg:text-base leading-relaxed rounded-lg shadow-sm transition-all duration-200"
                  style={{
                    height: Math.min(Math.max(44, chatMessage.split('\n').length * 24 + 20), 120) + 'px'
                  }}
                />

                {/* Input actions */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1 lg:gap-2">
                  {chatMessage.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-muted text-muted-foreground hidden sm:inline-block">
                      {chatMessage.length}
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!isConnected || !chatMessage.trim() || isSubmitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-200 h-7 w-7 p-0 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-3 w-3 lg:h-4 lg:w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Send className="h-3 w-3 lg:h-4 lg:w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-1 lg:gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="bg-background/50 hover:bg-muted/80 border-input shadow-sm h-8 w-8 lg:h-10 lg:w-10"
                      >
                        <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('coursePreferences')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {generatorState.courseData && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPreview(!showPreview)}
                          className="bg-background/50 hover:bg-muted/80 border-input shadow-sm h-8 w-8 lg:h-10 lg:w-10"
                        >
                          <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('viewCourse')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* Advanced options panel */}
            {showAdvancedOptions && (
              <div className="mt-3 lg:mt-4 p-3 lg:p-4 border border-border rounded-lg bg-muted/20 backdrop-blur-sm">
                <h3 className="text-sm font-medium mb-2 lg:mb-3 text-foreground">Course Preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Education Level</label>
                    <Select
                      value={coursePreferences.educationLevel}
                      onValueChange={(value) => setCoursePreferences({ ...coursePreferences, educationLevel: value })}
                    >
                      <SelectTrigger className="h-8 text-sm bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Elementary</SelectItem>
                        <SelectItem value="middle">Middle School</SelectItem>
                        <SelectItem value="high">High School</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Duration</label>
                    <Select
                      value={coursePreferences.duration}
                      onValueChange={(value) => setCoursePreferences({ ...coursePreferences, duration: value })}
                    >
                      <SelectTrigger className="h-8 text-sm bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (4 weeks)</SelectItem>
                        <SelectItem value="quarter">Quarter (10 weeks)</SelectItem>
                        <SelectItem value="semester">Semester (15 weeks)</SelectItem>
                        <SelectItem value="year">Full Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Difficulty</label>
                    <Select
                      value={coursePreferences.difficulty}
                      onValueChange={(value) => setCoursePreferences({ ...coursePreferences, difficulty: value })}
                    >
                      <SelectTrigger className="h-8 text-sm bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col overflow-hidden bg-background"
      style={{
        height: "100vh",
        maxHeight: "100vh",
        position: "relative",
        paddingBottom: "0px"
      }}
    >
      {/* Minimal header optimized for space */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-background/98 backdrop-blur-sm border-b border-border/50">
        <div className="px-3 lg:px-6 py-2 lg:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4 min-w-0">
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 blur-lg bg-primary/20 rounded-lg" />
                <div className="relative bg-primary text-primary-foreground p-2 rounded-lg shadow-lg">
                  <Wand2 className="h-4 w-4" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-base lg:text-xl font-serif font-light tracking-tight flex items-center gap-2 truncate">
                  {t('conversationalCourseGenerator')}
                </h1>
                <p className="text-xs text-muted-foreground font-light hidden lg:block">
                  {t('conversationalCourseGeneratorDescription')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-3 flex-shrink-0">
              {/* Connection status */}
              {isConnected && (
                <div className="hidden sm:flex items-center gap-1 lg:gap-2 px-2 py-1 bg-chart-2/10 border border-chart-2/30 text-chart-2 rounded-full">
                  <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-chart-2 rounded-full animate-pulse" />
                  <span className="text-xs font-medium hidden lg:inline">
                    {t('connected')}
                  </span>
                </div>
              )}

              {/* Quick actions */}
              {generatorState.status !== GENERATION_STATES.IDLE && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetGenerator}
                  className="gap-1 lg:gap-2 h-7 lg:h-8 px-2 lg:px-3 text-xs lg:text-sm"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">{t('restart')}</span>
                </Button>
              )}

              {generatorState.courseData && (
                <div className="relative">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 lg:gap-2 h-7 lg:h-8 px-2 lg:px-3 text-xs lg:text-sm">
                        <Share2 className="h-3 w-3" />
                        <span className="hidden sm:inline">{t('share')}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{t('shareCourse')}</DialogTitle>
                        <DialogDescription>
                          {t('shareCourseDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                          <label htmlFor="link" className="sr-only">
                            {t('link')}
                          </label>
                          <Input
                            id="link"
                            defaultValue={`${window.location.origin}/share/course/${sessionId}`}
                            readOnly
                          />
                        </div>
                        <Button type="submit" size="sm" className="px-3">
                          <span className="sr-only">{t('copy')}</span>
                          <ClipboardList className="h-4 w-4" />
                        </Button>
                      </div>
                      <DialogFooter className="sm:justify-start">
                        <Button type="button" variant="secondary">
                          {t('close')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-card hover:bg-muted h-7 w-7 lg:h-8 lg:w-8"
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection status overlay */}
      {renderConnectionStatus()}

      {/* Progress indicator */}
      {renderProgressIndicator()}

      {/* Main content area - optimized spacing */}
      <div className="flex-1 overflow-hidden pt-12 lg:pt-16 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start px-3 lg:px-6 bg-transparent border-b border-border gap-0 lg:gap-1 h-10 lg:h-12">
            <TabsTrigger value="chat" className="gap-1 lg:gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs lg:text-sm px-3 lg:px-4">
              <MessageSquare className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1 lg:gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs lg:text-sm px-3 lg:px-4" disabled={!generatorState.courseData}>
              <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 lg:gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs lg:text-sm px-3 lg:px-4">
              <History className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="chat" className="h-full m-0 p-0 flex flex-col absolute inset-0">
              <div className="flex-1 overflow-hidden pb-[100px] lg:pb-[150px]">
                {renderMessages()}
              </div>
              <div className="absolute bottom-0 left-0 right-0">
                {renderChatInput()}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full m-0 p-0">
              {renderCoursePreview()}
            </TabsContent>

            <TabsContent value="history" className="h-full m-0 p-0">
              <div className="h-full flex items-center justify-center p-6 lg:p-8">
                <div className="text-center">
                  <History className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-base lg:text-lg font-medium mb-2">{t('generationHistory')}</h3>
                  <p className="text-sm text-muted-foreground">{t('noHistoryYet')}</p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Floating action button for mobile */}
      <div className="fixed bottom-4 right-4 md:hidden z-50">
        <Button
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => inputRef.current?.focus()}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default CourseGenerator;
