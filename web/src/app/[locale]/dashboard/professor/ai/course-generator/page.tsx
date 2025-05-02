"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  BookOpen,
  Sparkles,
  MessageSquare,
  FileText,
  Send,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Save,
  Lightbulb,
  ClipboardList,
  HelpCircle,
} from 'lucide-react';

// WebSocket connection class
class CourseGeneratorWebSocket {
  socket = null;
  handlers = {};
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectDelay = 2000;

  connect(userId, sessionId) {
    // Close existing connection
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

  on(type, handler) {
    this.handlers[type] = handler;
  }

  send(data) {
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

// Type definitions
const GENERATION_STATES = {
  IDLE: 'idle',
  BRAINSTORMING: 'brainstorming',
  STRUCTURING: 'structuring',
  DETAILING: 'detailing',
  FINALIZING: 'finalizing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

// Modern Course Generator Component
const ModernCourseGenerator = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // UI state
  const [activeTab, setActiveTab] = useState('chat'); // 'form', 'chat', 'preview'
  const [chatMessage, setChatMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Form state - minimized to essentials
  const [formData, setFormData] = useState({
    subjectArea: '',
    educationLevel: 'university',
    keyTopics: '',
    courseDuration: 'semester'
  });

  // Generation state
  const [generatorState, setGeneratorState] = useState({
    status: GENERATION_STATES.IDLE,
    progress: 0,
    currentStep: '',
    messages: [],
    courseData: null,
    error: null
  });

  // Initialize session and user
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await fetch('/api/v1/auth/session');
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatorState.messages]);

  // Event handlers for WebSocket
  const handleStatusUpdate = (data) => {
    setGeneratorState(prev => ({
      ...prev,
      status: data.status,
      progress: data.progress,
      currentStep: data.step
    }));
  };

  const handleMessage = (data) => {
    const newMessage = {
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

  const handleCourseData = (data) => {
    setGeneratorState(prev => ({
      ...prev,
      courseData: data.courseData,
      status: GENERATION_STATES.COMPLETE
    }));

    // Switch to preview tab if course generation is complete
    setActiveTab('preview');
  };

  const handleError = (data) => {
    setGeneratorState(prev => ({
      ...prev,
      error: data.message,
      status: GENERATION_STATES.ERROR
    }));

    toast.error(data.message || t('errorGeneratingCourse'));
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // File upload handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Start course generation
  const startGeneration = () => {
    if (!formData.subjectArea.trim()) {
      toast.error(t('subjectAreaRequired'));
      return;
    }

    // Reset generator state
    setGeneratorState({
      status: GENERATION_STATES.BRAINSTORMING,
      progress: 0,
      currentStep: t('brainstormingIdeas'),
      messages: [],
      courseData: null,
      error: null
    });

    // Add system message
    const systemMessage = {
      id: `system-${Date.now()}`,
      role: 'system',
      content: t('courseGenerationStarted'),
      timestamp: new Date()
    };

    setGeneratorState(prev => ({
      ...prev,
      messages: [systemMessage]
    }));

    // Switch to chat tab
    setActiveTab('chat');

    // Send generation request via WebSocket
    if (socketRef.current) {
      socketRef.current.send({
        type: 'start_generation',
        data: {
          ...formData,
          userId: user?.id,
          sessionId: sessionId,
          locale: locale,
          files: uploadedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
          }))
        }
      });
    } else {
      setGeneratorState(prev => ({
        ...prev,
        error: t('websocketNotConnected'),
        status: GENERATION_STATES.ERROR
      }));
      toast.error(t('websocketNotConnected'));
    }
  };

  // Send a message during generation
  const sendMessage = () => {
    if (!chatMessage.trim() || !socketRef.current) return;

    // Add user message to state
    const userMessage = {
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

  // Restart the generation process
  const restartGeneration = () => {
    setGeneratorState({
      status: GENERATION_STATES.IDLE,
      progress: 0,
      currentStep: '',
      messages: [],
      courseData: null,
      error: null
    });
    setActiveTab('form');
  };

  // Render chat messages
  const renderMessages = () => {
    return (
      <ScrollArea className="flex-1 p-4">
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
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
    );
  };

  // Render course preview
  const renderCoursePreview = () => {
    if (!generatorState.courseData) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <HelpCircle className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{t('noCourseDataYet')}</p>
        </div>
      );
    }

    const course = generatorState.courseData;

    return (
      <ScrollArea className="h-full p-4">
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
              <span>{t(course.educationLevel || formData.educationLevel)}</span>
              <span>•</span>
              <span>{t(course.courseDuration || formData.courseDuration)}</span>
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
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {t('learningObjectives')}
            </h3>
            <ul className="space-y-1 pl-5 list-disc">
              {course.learningObjectives?.map((objective, idx) => (
                <li key={idx}>{objective}</li>
              ))}
            </ul>
          </div>

          {/* Syllabus */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              {t('syllabus')}
            </h3>
            <div className="space-y-4">
              {course.syllabus?.map((week, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <h4 className="font-medium">{t('week')} {week.week}: {week.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{week.description}</p>

                  {week.topics?.length > 0 && (
                    <div className="mt-2">
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
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                {t('assessments')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {course.assessments?.map((assessment, idx) => (
                  <div key={idx} className="border rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{assessment.title}</h4>
                      <Badge>{assessment.type}</Badge>
                    </div>
                    <p className="text-sm mt-1">{assessment.description}</p>
                    {assessment.weight && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('weight')}: {assessment.weight}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t('aiCourseGenerator')}
        </h1>
        <p className="text-muted-foreground">
          {t('aiCourseGeneratorDescription')}
        </p>
      </div>

      {/* Progress indicator for active generation */}
      {generatorState.status !== GENERATION_STATES.IDLE && generatorState.status !== GENERATION_STATES.COMPLETE && (
        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{generatorState.currentStep}</span>
            <span className="text-sm text-muted-foreground">{generatorState.progress}%</span>
          </div>
          <Progress value={generatorState.progress} className="h-2" />
        </div>
      )}

      {/* Main interface container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Left panel - form/chat */}
        <div className="lg:col-span-1 flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="form" disabled={generatorState.status !== GENERATION_STATES.IDLE && generatorState.status !== GENERATION_STATES.COMPLETE}>
                <FileText className="h-4 w-4 mr-2" />
                {t('form')}
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('chat')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <Label htmlFor="subjectArea" className="text-base">
                        {t('subjectArea')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="subjectArea"
                        name="subjectArea"
                        value={formData.subjectArea}
                        onChange={handleInputChange}
                        placeholder={t('subjectAreaPlaceholder')}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="educationLevel" className="text-base">
                          {t('educationLevel')}
                        </Label>
                        <Select
                          value={formData.educationLevel}
                          onValueChange={(value) => handleSelectChange('educationLevel', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t('selectEducationLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">{t('primary')}</SelectItem>
                            <SelectItem value="middle">{t('middle')}</SelectItem>
                            <SelectItem value="secondary">{t('secondary')}</SelectItem>
                            <SelectItem value="university">{t('university')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="courseDuration" className="text-base">
                          {t('duration')}
                        </Label>
                        <Select
                          value={formData.courseDuration}
                          onValueChange={(value) => handleSelectChange('courseDuration', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t('selectDuration')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semester">{t('semester')}</SelectItem>
                            <SelectItem value="year">{t('fullYear')}</SelectItem>
                            <SelectItem value="quarter">{t('quarter')}</SelectItem>
                            <SelectItem value="short">{t('shortCourse')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="keyTopics" className="text-base">
                        {t('keyTopics')}
                      </Label>
                      <Textarea
                        id="keyTopics"
                        name="keyTopics"
                        value={formData.keyTopics}
                        onChange={handleInputChange}
                        placeholder={t('keyTopicsPlaceholder')}
                        className="mt-1 resize-none"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label className="text-base mb-2 block">
                        {t('uploadResources')}
                      </Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          {t('dragDropFiles')}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mx-auto"
                        >
                          {t('selectFiles')}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>

                      {/* File list */}
                      {uploadedFiles.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">{t('uploadedFiles')}</p>
                          <div className="space-y-1">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-background border">
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-destructive hover:text-destructive/80"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={startGeneration}
                      className="w-full"
                      disabled={generatorState.status === GENERATION_STATES.BRAINSTORMING}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('generateCourse')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 p-0 flex flex-col">
                  {/* Chat container */}
                  <div className="flex-1 flex flex-col">
                    {generatorState.messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">{t('startCourseGeneration')}</h3>
                        <p className="text-muted-foreground mb-4 max-w-xs">
                          {t('startCourseGenerationDescription')}
                        </p>
                        {generatorState.status === GENERATION_STATES.IDLE && (
                          <Button onClick={startGeneration}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {t('generateCourse')}
                          </Button>
                        )}
                      </div>
                    ) : (
                      renderMessages()
                    )}
                  </div>

                  {/* Chat input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder={generatorState.status === GENERATION_STATES.IDLE ?
                          t('startGenerationFirst') :
                          t('typeMessage')}
                        disabled={generatorState.status === GENERATION_STATES.IDLE}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={generatorState.status === GENERATION_STATES.IDLE}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - course preview */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">{t('coursePreview')}</h2>
              </div>

              <div className="flex gap-2">
                {generatorState.status === GENERATION_STATES.COMPLETE && (
                  <Button onClick={saveCourse} size="sm" className="h-8">
                    <Save className="h-4 w-4 mr-2" />
                    {t('saveCourse')}
                  </Button>
                )}

                {generatorState.status !== GENERATION_STATES.IDLE && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={restartGeneration}
                    className="h-8"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('restart')}
                  </Button>
                )}
              </div>
            </div>

            {/* Course preview content */}
            <div className="flex-1 overflow-hidden">
              {renderCoursePreview()}
            </div>

            {/* Error message */}
            {generatorState.status === GENERATION_STATES.ERROR && (
              <div className="p-4 border-t bg-destructive/10 text-destructive flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-sm">{generatorState.error || t('errorGeneratingCourse')}</p>
              </div>
            )}

            {/* Success message */}
            {generatorState.status === GENERATION_STATES.COMPLETE && (
              <div className="p-4 border-t bg-green-500/10 text-green-700 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-sm">{t('courseGeneratedSuccessfully')}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernCourseGenerator;
