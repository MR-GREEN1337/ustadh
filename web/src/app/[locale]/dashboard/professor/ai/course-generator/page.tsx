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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  Lock,
  Eye,
  PanelRight,
  X,
} from 'lucide-react';

// CourseGeneratorPage Component with Sheet for Preview
const CourseGeneratorPage = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const { courseId } = useParams();

  // Generate a unique session ID if not provided
  const [sessionId] = useState(() =>
    courseId as string || `course-gen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  );

  // Use the course generator hook
  const {
    isConnected,
    generatorState,
    sendMessage,
    startGeneration,
    resetGenerator
  } = useCourseGenerator({ sessionId });

  // UI state
  const [chatMessage, setChatMessage] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (shouldAutoScroll && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatorState.messages, shouldAutoScroll]);

  // Add this new useEffect to detect scroll position and set auto-scroll behavior
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      // Get the scroll container
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
    // Force scroll to bottom when the user sends a new message or when a system message arrives
    if (
      (generatorState.messages.length &&
        generatorState.messages[generatorState.messages.length - 1].role === 'user') ||
      (generatorState.messages.length &&
        generatorState.messages[generatorState.messages.length - 1].role === 'system')
    ) {
      setShouldAutoScroll(true);
    }
  }, [generatorState.messages]);

  // Focus the input on initial load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-open the sheet when course data becomes available
  useEffect(() => {
    if (generatorState.courseData && generatorState.status === GENERATION_STATES.COMPLETE) {
      setIsSheetOpen(true);
    }
  }, [generatorState.courseData, generatorState.status]);

  // Handle message submission
  const handleSendMessage = () => {
    if (!chatMessage.trim() || !isConnected) return;

    // If this is the first message and we're in IDLE state, start generation
    if (generatorState.status === GENERATION_STATES.IDLE) {
      startGeneration(chatMessage);
    } else {
      // Otherwise, just send a message
      sendMessage(chatMessage);
    }

    // Clear input
    setChatMessage('');
  };

  // Handle keydown events for the chat input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Save the generated course
  const saveCourse = async () => {
    if (!generatorState.courseData) return;

    try {
      const response = await fetch('/api/v1/professors/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generatorState.courseData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save course: ${response.statusText}`);
      }

      const data = await response.json();
      toast.success(t('courseCreatedSuccessfully'));

      // Navigate to course page
      router.push(`/${locale}/dashboard/professor/courses/${data.id}`);
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(t('errorSavingCourse'));
    }
  };

  // Render connection status
  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <Alert variant="warning" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>{t('connectionIssue')}</AlertTitle>
          <AlertDescription>
            {t('notConnectedToCourseGenerator')}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGenerator}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> {t('reconnect')}
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  // Render chat messages
  const renderMessages = () => {
    return (
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {generatorState.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('startCourseGeneration')}</h3>
              <p className="text-muted-foreground mb-4 max-w-lg">
                {t('courseGenerationHelp')}
              </p>
              <p className="text-muted-foreground mb-8 italic max-w-lg">
                {t('courseExamplePrompt')}
              </p>
            </div>
          ) : (
            generatorState.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex gap-3 max-w-[80%]">
                  {message.role !== 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className={message.role === 'system' ? 'bg-secondary' : 'bg-primary'}>
                        {message.role === 'system' ? <AlertCircle className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'system'
                        ? 'bg-muted text-muted-foreground text-sm'
                        : 'bg-accent'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1 ml-2">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
    );
  };

  // Render course preview content
  const renderCoursePreviewContent = () => {
    if (!generatorState.courseData) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{t('noCourseDataYet')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('startChatToGenerate')}</p>
        </div>
      );
    }

    const course = generatorState.courseData;

    return (
      <div className="space-y-6">
        {/* Course Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{course.title}</h2>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {course.code || t('draft')}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>{t(course.educationLevel || 'university')}</span>
            <span>•</span>
            <span>{t(course.courseDuration || 'semester')}</span>
          </div>

          <p className="text-muted-foreground mt-2">{course.description}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {course.topics?.map((topic, idx) => (
              <Badge key={idx} variant="outline" className="bg-primary/5">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Learning Objectives */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {t('learningObjectives')}
          </h3>
          <ul className="space-y-1 pl-5 list-disc">
            {course.learningObjectives?.map((objective, idx) => (
              <li key={idx}>{objective}</li>
            ))}
          </ul>
        </div>

        {/* Syllabus */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            {t('syllabus')}
          </h3>
          <div className="space-y-4">
            {course.syllabus?.map((week, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <h4 className="text-lg font-medium">{t('week')} {week.week}: {week.title}</h4>
                <p className="text-muted-foreground mt-2">{week.description}</p>

                {week.topics?.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1 mt-1">
                      {week.topics.map((topic, topicIdx) => (
                        <Badge key={topicIdx} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Assessments */}
        {course.assessments?.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              {t('assessments')}
            </h3>
            <div className="space-y-3">
              {course.assessments?.map((assessment, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{assessment.title}</h4>
                    <Badge>{assessment.type}</Badge>
                  </div>
                  <p className="text-sm mt-2">{assessment.description}</p>
                  {assessment.weight && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {t('weight')}: {assessment.weight}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t('conversationalCourseGenerator')}
          </h1>
          <p className="text-muted-foreground">
            {t('conversationalCourseGeneratorDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && <Badge variant="outline" className="bg-green-500/10 text-green-600">
            <Wifi className="h-3 w-3 mr-1" /> {t('connected')}
          </Badge>}

          {generatorState.courseData && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  <PanelRight className="h-4 w-4 mr-2" />
                  {t('viewCourse')}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-auto">
                <SheetHeader className="mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <SheetTitle>{t('coursePreview')}</SheetTitle>
                  </div>
                  <div className="flex gap-2">
                    {generatorState.status === GENERATION_STATES.COMPLETE && (
                      <Button
                        onClick={saveCourse}
                        size="sm"
                        className="h-8"
                        disabled={!isConnected}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {t('saveCourse')}
                      </Button>
                    )}
                  </div>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-12rem)]">
                  {renderCoursePreviewContent()}
                </ScrollArea>

                {/* Error or success message */}
                {generatorState.status === GENERATION_STATES.ERROR && (
                  <div className="mt-4 p-4 border-t bg-destructive/10 text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p className="text-sm">{generatorState.error || t('errorGeneratingCourse')}</p>
                  </div>
                )}

                {generatorState.status === GENERATION_STATES.COMPLETE && (
                  <div className="mt-4 p-4 border-t bg-green-500/10 text-green-700 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p className="text-sm">{t('courseGeneratedSuccessfully')}</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          )}

          {(generatorState.status !== GENERATION_STATES.IDLE || generatorState.messages.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetGenerator}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('restart')}
            </Button>
          )}
        </div>
      </div>

      {/* Connection status indicator */}
      {renderConnectionStatus()}

      {/* Progress indicator for active generation */}
      {generatorState.status !== GENERATION_STATES.IDLE &&
       generatorState.status !== GENERATION_STATES.COMPLETE &&
       generatorState.status !== GENERATION_STATES.ERROR && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{generatorState.currentStep}</span>
            <span className="text-sm text-muted-foreground">{generatorState.progress}%</span>
          </div>
          <Progress value={generatorState.progress} className="h-2" />
        </div>
      )}

      {/* Main chat interface container - full width */}
      <div className="flex-1 flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 flex flex-col">
              {renderMessages()}
            </div>

            {/* Chat input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !isConnected
                      ? t('waitingForConnection')
                      : generatorState.status === GENERATION_STATES.IDLE
                      ? t('askForCourseGeneration')
                      : t('typeMessageToContinue')
                  }
                  disabled={!isConnected}
                  className="flex-1 resize-none min-h-[2.5rem] h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    overflow: 'hidden',
                    height: Math.min(chatMessage.split('\n').length * 24 + 24, 120) + 'px'
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  className="h-10 w-10"
                  disabled={!isConnected}
                >
                  <Send className="h-4 w-4" />
                </Button>

                {/* Quick access to view course if available */}
                {generatorState.courseData && !isSheetOpen && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSheetOpen(true)}
                    className="h-10 w-10"
                    title={t('viewCourse')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseGeneratorPage;
