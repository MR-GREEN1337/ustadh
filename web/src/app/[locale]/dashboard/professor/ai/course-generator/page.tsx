"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

// Icons
import {
  BookOpen,
  Sparkles,
  MessageSquare,
  BookMarked,
  Loader2,
  RefreshCw,
  Send,
  Clock,
  FilePlus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit,
  Lightbulb,
  GraduationCap,
  Layers,
  PlusCircle,
  X
} from 'lucide-react';

// WebSocket for real-time updates
class CourseGeneratorWebSocket {
  socket: WebSocket | null = null;
  handlers: { [key: string]: (data: any) => void } = {};
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectDelay = 2000;

  connect(userId: string, sessionId: string) {
    // Close any existing connection
    if (this.socket) {
      this.socket.close();
    }

    // Create new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}/api/ws/course-generator?userId=${userId}&sessionId=${sessionId}`);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type && this.handlers[data.type]) {
          this.handlers[data.type](data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', event);

      // Auto-reconnect logic
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connect(userId, sessionId);
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  on(type: string, handler: (data: any) => void) {
    this.handlers[type] = handler;
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Define types for the course generator
interface GeneratorState {
  status: 'idle' | 'brainstorming' | 'structuring' | 'detailing' | 'finalizing' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  messages: Message[];
  courseData: CourseData | null;
  error: string | null;
}

interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CourseData {
  id?: number;
  title: string;
  code: string;
  description: string;
  status: string;
  topics: string[];
  learningObjectives: string[];
  prerequisites: string[];
  assessments: CourseAssessment[];
  syllabus: CourseSyllabus[];
  recommendedMaterials: string[];
}

interface CourseAssessment {
  title: string;
  type: string; // 'quiz', 'assignment', 'project', 'exam'
  description: string;
  weight: number;
}

interface CourseSyllabus {
  week: number;
  title: string;
  topics: string[];
  description: string;
  activities: string[];
}

// Main Component
const AIGenerateCourse = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const socketRef = useRef<CourseGeneratorWebSocket | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

// Continuing from where we left off

  // Course generation form state
  const [formData, setFormData] = useState({
    subjectArea: '',
    educationLevel: '',
    keyTopics: '',
    courseDuration: 'semester',
    difficultyLevel: 'intermediate',
    includeAssessments: true,
    includeProjectIdeas: true,
    teachingMaterials: true,
    contextPrompt: '',
  });

  // Generator state
  const [generatorState, setGeneratorState] = useState<GeneratorState>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    messages: [],
    courseData: null,
    error: null
  });

  // UI state
  const [view, setView] = useState<'form' | 'generating' | 'review'>('form');
  const [chatMessage, setChatMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize WebSocket connection when component mounts
  useEffect(() => {
    // Fetch user info from session
    const fetchUserSession = async () => {
      try {
        const response = await fetch('/api/v1/auth/session');
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          // Generate a unique session ID
          const newSessionId = `course-gen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          setSessionId(newSessionId);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
        toast.error(t('errorFetchingUserSession'));
      }
    };

    fetchUserSession();

    return () => {
      // Clean up WebSocket connection when component unmounts
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Initialize WebSocket when user and sessionId are available
  useEffect(() => {
    if (user && sessionId && !socketRef.current) {
      socketRef.current = new CourseGeneratorWebSocket();
      socketRef.current.connect(user.id, sessionId);

      // Set up event handlers
      socketRef.current.on('status_update', handleStatusUpdate);
      socketRef.current.on('message', handleMessage);
      socketRef.current.on('course_data', handleCourseData);
      socketRef.current.on('error', handleError);
    }
  }, [user, sessionId]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messageEndRef.current && view === 'generating') {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatorState.messages, view]);

  // Event handlers for WebSocket events
  const handleStatusUpdate = (data: any) => {
    setGeneratorState(prev => ({
      ...prev,
      status: data.status,
      progress: data.progress,
      currentStep: data.step
    }));
  };

  const handleMessage = (data: any) => {
    const newMessage: Message = {
      id: data.messageId || `msg-${Date.now()}`,
      role: data.role,
      content: data.content,
      timestamp: new Date(data.timestamp || Date.now())
    };

    setGeneratorState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  };

  const handleCourseData = (data: any) => {
    setGeneratorState(prev => ({
      ...prev,
      courseData: data.courseData,
      status: 'complete'
    }));

    if (view === 'generating') {
      setView('review');
    }
  };

  const handleError = (data: any) => {
    setGeneratorState(prev => ({
      ...prev,
      error: data.message,
      status: 'error'
    }));

    toast.error(data.message || t('errorGeneratingCourse'));
  };

  // Function to handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Function to handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });

    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Function to handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  // Function to start course generation
  const startGeneration = () => {
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.subjectArea.trim()) {
      errors.subjectArea = t('fieldRequired');
    }
    if (!formData.educationLevel) {
      errors.educationLevel = t('fieldRequired');
    }

    // If there are errors, show them and don't proceed
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Reset generator state
    setGeneratorState({
      status: 'brainstorming',
      progress: 0,
      currentStep: t('brainstormingIdeas'),
      messages: [],
      courseData: null,
      error: null
    });

    // Switch to generating view
    setView('generating');

    // Send generation request via WebSocket
    if (socketRef.current) {
      socketRef.current.send({
        type: 'start_generation',
        data: {
          ...formData,
          userId: user?.id,
          sessionId: sessionId,
          locale: locale
        }
      });
    } else {
      setGeneratorState(prev => ({
        ...prev,
        error: t('websocketNotConnected'),
        status: 'error'
      }));
      toast.error(t('websocketNotConnected'));
    }
  };

  // Function to send a message during generation
  const sendMessage = () => {
    if (!chatMessage.trim() || !socketRef.current) return;

    // Add user message to state
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatMessage,
      timestamp: new Date()
    };

    setGeneratorState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // Send message to server
    socketRef.current.send({
      type: 'message',
      data: {
        content: chatMessage,
        userId: user?.id,
        sessionId: sessionId
      }
    });

    // Clear input
    setChatMessage('');
  };

  // Function to save the generated course
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

  // Function to restart the generation process
  const restartGeneration = () => {
    setView('form');
    setGeneratorState({
      status: 'idle',
      progress: 0,
      currentStep: '',
      messages: [],
      courseData: null,
      error: null
    });
  };

  // Render progress indicator
  const renderProgress = () => {
    const steps = [
      { key: 'brainstorming', label: t('brainstormingIdeas') },
      { key: 'structuring', label: t('structuringCourse') },
      { key: 'detailing', label: t('developingDetails') },
      { key: 'finalizing', label: t('finalizingCourse') }
    ];

    const currentStepIndex = steps.findIndex(step => step.key === generatorState.status);

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('progress')}</span>
          <span>{generatorState.progress}%</span>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${generatorState.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex flex-col items-center ${
                index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-3 h-3 rounded-full mb-1 ${
                index < currentStepIndex ? 'bg-primary' :
                index === currentStepIndex ? 'bg-primary animate-pulse' : 'bg-secondary'
              }`}></div>
              <span className="text-xs hidden md:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render form view
  const renderFormView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('aiCourseGenerator')}
        </CardTitle>
        <CardDescription>
          {t('aiCourseGeneratorDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subjectArea">
              {t('subjectArea')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subjectArea"
              name="subjectArea"
              value={formData.subjectArea}
              onChange={handleInputChange}
              placeholder={t('subjectAreaPlaceholder')}
              className={formErrors.subjectArea ? 'border-destructive' : ''}
            />
            {formErrors.subjectArea && (
              <p className="text-destructive text-sm mt-1">{formErrors.subjectArea}</p>
            )}
          </div>
          <div>
            <Label htmlFor="educationLevel">
              {t('educationLevel')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.educationLevel}
              onValueChange={(value) => handleSelectChange('educationLevel', value)}
            >
              <SelectTrigger className={formErrors.educationLevel ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('selectEducationLevel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">{t('primary')}</SelectItem>
                <SelectItem value="middle">{t('middle')}</SelectItem>
                <SelectItem value="secondary">{t('secondary')}</SelectItem>
                <SelectItem value="university">{t('university')}</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.educationLevel && (
              <p className="text-destructive text-sm mt-1">{formErrors.educationLevel}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="keyTopics">{t('keyTopics')}</Label>
          <Textarea
            id="keyTopics"
            name="keyTopics"
            value={formData.keyTopics}
            onChange={handleInputChange}
            placeholder={t('keyTopicsPlaceholder')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="courseDuration">{t('courseDuration')}</Label>
            <Select
              value={formData.courseDuration}
              onValueChange={(value) => handleSelectChange('courseDuration', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectCourseDuration')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semester">{t('semester')}</SelectItem>
                <SelectItem value="year">{t('fullYear')}</SelectItem>
                <SelectItem value="quarter">{t('quarter')}</SelectItem>
                <SelectItem value="short">{t('shortCourse')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="difficultyLevel">{t('difficultyLevel')}</Label>
            <Select
              value={formData.difficultyLevel}
              onValueChange={(value) => handleSelectChange('difficultyLevel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectDifficultyLevel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">{t('beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('advanced')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAssessments"
              checked={formData.includeAssessments}
              onCheckedChange={(checked) => handleCheckboxChange('includeAssessments', !!checked)}
            />
            <Label htmlFor="includeAssessments">{t('includeAssessments')}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeProjectIdeas"
              checked={formData.includeProjectIdeas}
              onCheckedChange={(checked) => handleCheckboxChange('includeProjectIdeas', !!checked)}
            />
            <Label htmlFor="includeProjectIdeas">{t('includeProjectIdeas')}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="teachingMaterials"
              checked={formData.teachingMaterials}
              onCheckedChange={(checked) => handleCheckboxChange('teachingMaterials', !!checked)}
            />
            <Label htmlFor="teachingMaterials">{t('suggestTeachingMaterials')}</Label>
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="contextPrompt">{t('additionalContext')}</Label>
          <Textarea
            id="contextPrompt"
            name="contextPrompt"
            value={formData.contextPrompt}
            onChange={handleInputChange}
            placeholder={t('additionalContextPlaceholder')}
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('additionalContextDescription')}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard/professor/courses`)}
        >
          {t('cancel')}
        </Button>
        <Button
          type="button"
          onClick={startGeneration}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {t('generateCourse')}
        </Button>
      </CardFooter>
    </Card>
  );

  // Render generating view
  const renderGeneratingView = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('generatingCourse')}
          </CardTitle>
          <CardDescription>
            {generatorState.currentStep}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderProgress()}
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('collaboration')}</CardTitle>
          <CardDescription>
            {t('collaborationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {generatorState.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
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
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={t('typeMessage')}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button type="button" onClick={sendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatorState.status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {generatorState.error || t('errorGeneratingCourse')}
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={restartGeneration}
            className="mt-2"
          >
            {t('tryAgain')}
          </Button>
        </Alert>
      )}
    </div>
  );

  // Render review view
  const renderReviewView = () => {
    if (!generatorState.courseData) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('noCourseDataAvailable')}
          </AlertDescription>
        </Alert>
      );
    }

    const course = generatorState.courseData;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle>{t('courseGeneratedSuccessfully')}</CardTitle>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary px-2 py-1">
                {t('aiGenerated')}
              </Badge>
            </div>
            <CardDescription>
              {t('reviewAndSaveCourse')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{course.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{t(course.educationLevel || formData.educationLevel)}</span>
                  {course.code && (
                    <>
                      <span>•</span>
                      <Badge variant="outline">{course.code}</Badge>
                    </>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground">{course.description}</p>

              <div className="flex flex-wrap gap-1">
                {course.topics?.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="bg-primary/5">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="objectives" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>{t('learningObjectives')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pl-5 list-disc">
                {course.learningObjectives?.map((objective, idx) => (
                  <li key={idx}>{objective}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="prerequisites" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>{t('prerequisites')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {course.prerequisites?.length > 0 ? (
                <ul className="space-y-2 pl-5 list-disc">
                  {course.prerequisites.map((prerequisite, idx) => (
                    <li key={idx}>{prerequisite}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">{t('noPrerequisites')}</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="syllabus" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                <span>{t('syllabus')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {course.syllabus?.map((week, idx) => (
                  <div key={idx} className="pb-3 border-b last:border-0">
                    <h4 className="font-medium">{t('week')} {week.week}: {week.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{week.description}</p>

                    {week.topics?.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">{t('topics')}:</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {week.topics.map((topic, topicIdx) => (
                            <Badge key={topicIdx} variant="outline" className="bg-primary/5 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {week.activities?.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">{t('activities')}:</h5>
                        <ul className="pl-5 list-disc">
                          {week.activities.map((activity, activityIdx) => (
                            <li key={activityIdx} className="text-sm">{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assessments" className="border rounded-lg px-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>{t('assessments')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {course.assessments?.map((assessment, idx) => (
                  <div key={idx} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{assessment.title}</h4>
                      <Badge>
                        {assessment.type}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{assessment.description}</p>
                    {assessment.weight && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <span>{t('weight')}:</span>
                        <span>{assessment.weight}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {course.recommendedMaterials?.length > 0 && (
            <AccordionItem value="materials" className="border rounded-lg px-4">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-purple-500" />
                  <span>{t('recommendedMaterials')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pl-5 list-disc">
                  {course.recommendedMaterials.map((material, idx) => (
                    <li key={idx}>{material}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <div className="flex justify-between">
          <Button variant="outline" onClick={restartGeneration}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('startOver')}
          </Button>

          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setView('generating')}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('refine')}
            </Button>
            <Button onClick={saveCourse}>
              <FilePlus className="h-4 w-4 mr-2" />
              {t('saveCourse')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render different views based on current state
  let content;
  switch (view) {
    case 'form':
      content = renderFormView();
      break;
    case 'generating':
      content = renderGeneratingView();
      break;
    case 'review':
      content = renderReviewView();
      break;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-2">
          {t('aiCourseGenerator')}
        </h1>
        <p className="text-muted-foreground">
          {t('aiCourseGeneratorPageDescription')}
        </p>
      </div>

      {content}
    </div>
  );
};

export default AIGenerateCourse;
