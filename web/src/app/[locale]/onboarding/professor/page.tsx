"use client";

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/global/Sidebar';
import { MobileSidebar } from '@/components/global/MobileSidebar';
import { ProfessorService, ScheduleEntry } from '@/services/ProfessorService';

// UI Components
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ModeToggle } from '@/components/global/ThemeModeToggle';

// Icons
import {
  MessageSquare,
  Calendar,
  Users,
  BookOpen,
  Settings,
  Plus,
  PlusCircle,
  ChevronRight,
  Edit,
  Trash2,
  Sparkles,
  BrainCircuit,
  Clock,
  Zap,
  MoreHorizontal,
  CircleCheck,
  GraduationCap,
  Lightbulb,
  MessagesSquare,
  RefreshCw,
  Send,
  BrainCog,
  UserCircle,
  Bell,
  LogOut,
  Menu,
  CalendarDays,
  BookOpenCheck,
  School
} from 'lucide-react';
import { toast } from 'sonner';

// Day Schedule component
const DaySchedule = ({ day, scheduleItems, t }: { day: string; scheduleItems: any[]; t: (key: string) => string }) => {
  return (
    <div>
      <h3 className="font-medium text-lg mb-3">{t(day.toLowerCase())}</h3>
      {scheduleItems.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          {t("noScheduledEvents")}
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleItems.map((event) => (
            <div key={event.id} className="rounded-md border p-3 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="text-sm text-muted-foreground mt-1">
                    {event.startTime} - {event.endTime}
                  </div>
                  <div className="text-sm mt-1">{event.location}</div>
                </div>
                <Badge variant={
                  event.type === "Lecture" ? "default" :
                  event.type === "Office Hours" ? "secondary" :
                  "outline"
                }>
                  {t(event.type.toLowerCase().replace(' ', '_'))}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Onboarding Course component
const OnboardingCourse = ({ course, onSave, onGenerate, t }: any) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');

  const handleSave = () => {
    onSave({ ...course, title, description });
    setEditing(false);
  };

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow overflow-hidden",
      course.aiGenerated && "relative"
    )}>
      {course.aiGenerated && (
        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs px-2 py-1 rounded-bl-md flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          {t("aiEnhanced")}
        </div>
      )}

      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("courseTitle")}
              className="font-medium"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("courseDescription")}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                {t("cancel")}
              </Button>
              <Button size="sm" onClick={handleSave}>
                {t("save")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{course.code}</span>
                  {course.students && (
                    <>
                      <span className="text-xs">•</span>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {course.students} {t("students")}
                      </div>
                    </>
                  )}
                </div>
                {description && (
                  <p className="text-sm mt-2">{description}</p>
                )}
              </div>

              <Badge variant={course.status === 'active' ? "default" : "outline"}>
                {t(course.status)}
              </Badge>
            </div>

            {course.topics && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {course.topics.map((topic: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-primary/5">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {t("edit")}
                </Button>
                <Button
                  variant={course.aiGenerated ? "default" : "outline"}
                  size="sm"
                  onClick={() => onGenerate(course)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {course.aiGenerated ? t("regenerate") : t("generateContent")}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Week Schedule component
const WeekSchedule = ({ scheduleData, t }: { scheduleData: ScheduleEntry[]; t: (key: string) => string }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getScheduleForDay = (day: any) => {
    return scheduleData
      .filter((item: any) => item.day === day)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {days.map((day) => (
        <div key={day} className="card border rounded-lg p-4">
          <DaySchedule day={day} scheduleItems={getScheduleForDay(day)} t={t} />
        </div>
      ))}
    </div>
  );
};

// Profile Header component
const ProfileHeader = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocale();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push(`/${locale}/login`);
    } catch (error) {
      toast.error(t("logoutFailed"));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative rounded-full h-9 w-9 p-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar || "/avatars/default.png"} alt={user?.full_name} />
              <AvatarFallback>{user?.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-background"></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/profile`)}>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>{t("profile")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/settings`)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button size="icon" variant="ghost">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// Main Onboarding Component
const ProfessorOnboarding = () => {
  const locale = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState('courses');
  const [aiActive, setAiActive] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messageEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Professor profile data
  const [professorProfile, setProfessorProfile] = useState(null);

  // Sample courses data - would be fetched from API in real implementation
  const [courses, setCourses] = useState([]);

  // Sample schedule data - would be fetched from API in real implementation
  const [scheduleData, setScheduleData] = useState([]);

  // AI conversation
  const [conversation, setConversation] = useState([
    {
      sender: 'ai',
      content: t("aiWelcomeMessage", { name: user?.full_name as any}),
      timestamp: new Date()
    }
  ]);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState([
    {
      id: 1,
      title: t("completeTeachingSchedule"),
      description: t("completeTeachingScheduleDesc"),
      type: 'schedule'
    },
    {
      id: 2,
      title: t("generateEthicsCourse"),
      description: t("generateEthicsCourseDesc"),
      type: 'course'
    },
    {
      id: 3,
      title: t("setupOfficeHours"),
      description: t("setupOfficeHoursDesc"),
      type: 'availability'
    }
  ]);

  // Load professor data on mount
  useEffect(() => {
    const loadProfessorData = async () => {
      setLoading(true);
      try {
        // In a real implementation, these would be actual API calls
        // For now, we're simulating the data

        // Load professor profile
        const profileResponse = await fetchProfessorProfile();
        setProfessorProfile(profileResponse as any);

        // Load courses
        const coursesResponse = await fetchProfessorCourses();
        setCourses(coursesResponse as any);

        // Load schedule
        const scheduleResponse = await fetchProfessorSchedule();
        setScheduleData(scheduleResponse as any);
      } catch (error) {
        console.error("Error loading professor data:", error);
        toast.error(t("errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

    // Only load data if user is logged in
    if (user) {
      loadProfessorData();
    }
  }, [user, t]);

  // Mock API functions - would be replaced with real API calls
  const fetchProfessorProfile = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      title: "Associate Professor",
      department: user?.user_type === "school_professor" as any ? "Computer Science" : "",
      specialization: "Machine Learning & AI",
      expertise: ["Machine Learning", "Artificial Intelligence", "Databases"],
      languages: ["Arabic", "English", user?.locale === "fr" ? "French" : ""],
      office: "Building A, Room 305"
    };
  };

  const fetchProfessorCourses = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        id: 1,
        title: t("introToMachineLearning"),
        code: 'CS301',
        description: t("introToMachineLearningDesc"),
        students: 35,
        nextClass: '2025-04-24T10:30:00',
        topics: [t("supervisedLearning"), t("neuralNetworks"), t("evaluationMetrics")],
        aiGenerated: true,
        status: 'active'
      },
      {
        id: 2,
        title: t("advancedDatabases"),
        code: 'CS404',
        description: t("advancedDatabasesDesc"),
        students: 28,
        nextClass: '2025-04-23T13:15:00',
        topics: [t("queryOptimization"), t("distributedDatabases"), t("transactionProcessing")],
        aiGenerated: true,
        status: 'active'
      },
      {
        id: 3,
        title: t("aiEthics"),
        code: 'CS450',
        description: t("aiEthicsDesc"),
        students: 42,
        nextClass: '2025-04-25T15:00:00',
        topics: [t("biasInAI"), t("privacyConcerns"), t("ethicalFrameworks")],
        aiGenerated: false,
        status: 'draft'
      }
    ];
  };

  const fetchProfessorSchedule = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        id: 1,
        title: t("introToMachineLearning"),
        type: "Lecture",
        day: "Monday",
        startTime: "10:30",
        endTime: "12:00",
        location: t("buildingARoom201"),
        recurring: true
      },
      {
        id: 2,
        title: t("databaseOfficeHours"),
        type: "Office Hours",
        day: "Monday",
        startTime: "14:00",
        endTime: "16:00",
        location: t("facultyOffice305"),
        recurring: true
      },
      {
        id: 3,
        title: t("aiEthics"),
        type: "Lecture",
        day: "Tuesday",
        startTime: "13:00",
        endTime: "14:30",
        location: t("buildingBRoom102"),
        recurring: true
      },
      {
        id: 4,
        title: t("departmentMeeting"),
        type: "Meeting",
        day: "Wednesday",
        startTime: "09:00",
        endTime: "10:30",
        location: t("conferenceRoom3"),
        recurring: true
      },
      {
        id: 5,
        title: t("advancedDatabases"),
        type: "Lecture",
        day: "Thursday",
        startTime: "11:00",
        endTime: "12:30",
        location: t("buildingARoom105"),
        recurring: true
      },
      {
        id: 6,
        title: t("studentConsultation"),
        type: "Office Hours",
        day: "Friday",
        startTime: "13:00",
        endTime: "15:00",
        location: t("facultyOffice305"),
        recurring: true
      }
    ];
  };

  // Save course
  const handleSaveCourse = (updatedCourse: any) => {
    setCourses(courses.map((course: any) =>
      course.id === updatedCourse.id ? updatedCourse : course
    ) as any) ;

    toast.success(t("courseUpdated"));

    // Add AI message about the update
    setConversation([
      ...conversation,
      {
        sender: 'ai',
        content: t("courseUpdatedMessage", { title: updatedCourse.title }),
        timestamp: new Date()
      }
    ]);
  };

  // Generate course content
  const handleGenerateCourse = (course: any) => {
    // Simulate AI typing
    setAiTyping(true);

    // Add user message
    setConversation([
      ...conversation,
      {
        sender: 'user',
        content: t("generateContentFor", { title: course.title }),
        timestamp: new Date()
      }
    ]);

    // Simulate AI response
    setTimeout(() => {
      setConversation(prev => [
        ...prev,
        {
          sender: 'ai',
          content: t("generateContentMessage", { title: course.title }),
          timestamp: new Date()
        }
      ]);

      setAiTyping(false);

      // Update course to show AI generated flag
      setCourses(courses.map(c =>
        c.id === course.id ? {...c, aiGenerated: true} : c
      ));
    }, 1500);
  };

  // Handle sending message to AI
  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // Add user message to conversation
    setConversation([
      ...conversation,
      {
        sender: 'user',
        content: userInput,
        timestamp: new Date()
      }
    ]);

    // Clear input
    setUserInput('');

    // Simulate AI typing
    setAiTyping(true);

    // Simulate AI response based on user input
    setTimeout(() => {
      let response;

      if (userInput.toLowerCase().includes(t("newCourse").toLowerCase()) ||
          userInput.toLowerCase().includes(t("createCourse").toLowerCase())) {
        response = t("newCourseResponse");

        // Add a new course
        const newCourse = {
          id: courses.length + 1,
          title: t("advancedNLP"),
          code: 'CS480',
          description: t("advancedNLPDesc"),
          topics: [t("transformers"), "BERT", t("textGeneration"), t("embeddings")],
          aiGenerated: true,
          status: 'draft'
        };

        setCourses([...courses, newCourse]);
      } else if (userInput.toLowerCase().includes(t("schedule").toLowerCase()) ||
                userInput.toLowerCase().includes(t("time").toLowerCase())) {
        response = t("scheduleResponse");

        // Switch to schedule tab
        setActiveTab('schedule');
      } else if (userInput.toLowerCase().includes(t("profile").toLowerCase()) ||
                userInput.toLowerCase().includes(t("information").toLowerCase())) {
        response = t("profileResponse");

        // Switch to profile tab
        setActiveTab('profile');
      } else {
        response = t("generalResponse", { query: userInput });
      }

      setConversation(prev => [
        ...prev,
        {
          sender: 'ai',
          content: response,
          timestamp: new Date()
        }
      ]);

      setAiTyping(false);
    }, 1500);
  };

  // Handle AI suggestion click
  const handleAiSuggestion = (suggestion) => {
    // Add AI suggestion to conversation
    setConversation([
      ...conversation,
      {
        sender: 'user',
        content: t("tellMeMoreAbout", { title: suggestion.title }),
        timestamp: new Date()
      }
    ]);

    // Simulate AI typing
    setAiTyping(true);

    // Simulate AI response for the suggestion
    setTimeout(() => {
      let response;

      if (suggestion.type === 'schedule') {
        response = t("scheduleResponseDetailed");

        // Switch to schedule tab
        setActiveTab('schedule');
      } else if (suggestion.type === 'course') {
        response = t("courseResponseDetailed");

        // Update the AI Ethics course to be AI generated
        setCourses(courses.map(course =>
          course.title === t("aiEthics") ? {...course, aiGenerated: true} : course
        ));
      } else if (suggestion.type === 'availability') {
        response = t("availabilityResponseDetailed");
      }

      setConversation(prev => [
        ...prev,
        {
          sender: 'ai',
          content: response,
          timestamp: new Date()
        }
      ]);

      // Remove the used suggestion
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

      setAiTyping(false);
    }, 1500);
  };

  // Complete onboarding
  const handleCompleteOnboarding = () => {
    toast.success(t("onboardingCompleted"), {
      description: t("onboardingCompletedDesc"),
    });

    // In a real app, this would redirect to the main dashboard
    router.push(`/${locale}/dashboard`);
  };

  // Scroll to bottom of conversation when new messages are added
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block fixed top-0 left-0 h-full z-30">
          <Sidebar className="w-60 border-r h-full" />
        </div>

        {/* Main content with left margin for desktop */}
        <div className="flex flex-col flex-1 min-h-screen md:ml-60">
          {/* Fixed header that aligns with the main content, not overlapping the sidebar */}
          <header className="sticky top-0 z-20 bg-background border-b w-full">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 h-14">
              {/* Left section with mobile menu - only visible on mobile */}
              <div className="flex items-center gap-3">
                <div className="md:hidden mr-2">
                  <MobileSidebar />
                </div>

                <div className="flex items-center">
                  <School className="h-6 w-6 text-primary mr-2" />
                  <h1 className="text-xl font-medium">Ustadh</h1>
                </div>
              </div>

              {/* Right section with profile and tools */}
              <ProfileHeader />
            </div>
            <Separator />
          </header>

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Content panel - Course/Profile/Schedule management */}
            <div className="flex-1 overflow-auto border-r">
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-light mb-2">{t("welcomeProfessor", { name: user?.full_name })}</h1>
                  <p className="text-muted-foreground">
                    {t("completeProfilePrompt")}
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                  <TabsList>
                    <TabsTrigger value="courses" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{t("courses")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t("schedule")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span>{t("profile")}</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="courses" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium">{t("yourCourses")}</h2>
                      <Button
                        onClick={() => {
                          setUserInput(t("createDataVisualizationCourse"));
                          handleSendMessage();
                        }}
                        className="gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>{t("newCourse")}</span>
                      </Button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {courses.map(course => (
                        <OnboardingCourse
                          key={course.id}
                          course={course}
                          onSave={handleSaveCourse}
                          onGenerate={handleGenerateCourse}
                          t={t}
                        />
                      ))}
                    </div>

                    <Card className="mt-6 bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium flex items-center">
                          <Sparkles className="h-5 w-5 mr-2 text-primary" />
                          {t("aiCourseGeneration")}
                        </CardTitle>
                        <CardDescription>
                          {t("aiCourseGenerationDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            className="gap-2"
                            onClick={() => {
                              setUserInput(t("createDataScienceCourse"));
                              handleSendMessage();
                            }}
                          >
                            <Zap className="h-4 w-4" />
                            <span>{t("generateNewCourse")}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              setUserInput(t("createAssessmentMaterials"));
                              handleSendMessage();
                            }}
                          >
                            <BookOpenCheck className="h-4 w-4" />
                            <span>{t("generateAssessments")}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schedule" className="mt-6">
                    <div className="mb-6">
                      <h2 className="text-lg font-medium mb-2">{t("weeklyTeachingSchedule")}</h2>
                      <p className="text-muted-foreground mb-4">
                        {t("scheduleDescription")}
                      </p>

                      <WeekSchedule scheduleData={scheduleData} t={t} />
                      <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Button
                          className="gap-2"
                          onClick={() => {
                            setUserInput(t("optimizeSchedule"));
                            handleSendMessage();
                          }}
                        >
                          <Zap className="h-4 w-4" />
                          <span>{t("optimizeSchedule")}</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setUserInput(t("addOfficeHours"));
                            handleSendMessage();
                          }}
                        >
                          <CalendarDays className="h-4 w-4" />
                          <span>{t("setOfficeHours")}</span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="profile" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">{t("professorProfile")}</CardTitle>
                        <CardDescription>
                          {t("professorProfileDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {professorProfile && (
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-shrink-0">
                              <Avatar className="h-24 w-24 border-2 border-background">
                                <AvatarImage src={user?.avatar || "/avatars/default.png"} alt={user?.full_name} />
                                <AvatarFallback>{user?.full_name?.charAt(0) || "P"}</AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="space-y-4 flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">{t("name")}</p>
                                  <p className="font-medium">{user?.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">{t("title")}</p>
                                  <p className="font-medium">{professorProfile.title}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">{t("department")}</p>
                                  <p className="font-medium">{professorProfile.department || t("notSpecified")}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">{t("specialization")}</p>
                                  <p className="font-medium">{professorProfile.specialization}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">{t("office")}</p>
                                  <p className="font-medium">{professorProfile.office}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                                  <p className="font-medium">{user?.email}</p>
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <p className="text-sm text-muted-foreground mb-2">{t("expertiseAreas")}</p>
                                <div className="flex flex-wrap gap-2">
                                  {professorProfile.expertise.map((area, idx) => (
                                    <Badge key={idx} variant="outline">{area}</Badge>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => {
                                      setUserInput(t("addExpertiseAreas"));
                                      handleSendMessage();
                                    }}
                                  >
                                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                    <span>{t("add")}</span>
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-muted-foreground mb-2">{t("teachingLanguages")}</p>
                                <div className="flex flex-wrap gap-2">
                                  {professorProfile.languages.filter(Boolean).map((lang, idx) => (
                                    <Badge key={idx} variant="secondary">{lang}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end border-t pt-4">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setUserInput(t("updateProfile"));
                            handleSendMessage();
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span>{t("editProfile")}</span>
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="mt-6 bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium flex items-center">
                          <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                          {t("aiProfileEnhancement")}
                        </CardTitle>
                        <CardDescription>
                          {t("aiProfileEnhancementDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            className="gap-2"
                            onClick={() => {
                              setUserInput(t("enhanceProfile"));
                              handleSendMessage();
                            }}
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>{t("enhanceProfile")}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              setUserInput(t("suggestResearchInterests"));
                              handleSendMessage();
                            }}
                          >
                            <BrainCircuit className="h-4 w-4" />
                            <span>{t("addResearchInterests")}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="mt-8 pt-4 border-t">
                  <Button
                    onClick={handleCompleteOnboarding}
                    className="gap-2"
                  >
                    <CircleCheck className="h-4 w-4" />
                    <span>{t("completeOnboarding")}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Assistant panel */}
            <div className="hidden md:flex flex-col w-96 border-l">
              {/* AI conversation header */}
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                    <BrainCog className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("aiAssistant")}</h3>
                    <p className="text-xs text-muted-foreground">{t("aiAssistantDesc")}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setConversation([
                    {
                      sender: 'ai',
                      content: t("aiWelcomeMessage", { name: user?.full_name }),
                      timestamp: new Date()
                    }
                  ])}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* AI conversation area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {conversation.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-3 max-w-[90%]",
                        message.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}
                    >
                      {message.sender === 'ai' ? (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                      ) : (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={user?.avatar || "/avatars/default.png"} alt={user?.full_name} />
                          <AvatarFallback>{user?.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "rounded-lg p-3 text-sm",
                          message.sender === 'ai'
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {aiTyping && (
                    <div className="flex items-start gap-3 max-w-[90%]">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-sm flex items-center">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>

              {/* AI input area */}
              <div className="p-4 border-t">
                {/* AI suggestions */}
                {aiSuggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">{t("aiSuggestions")}:</p>
                    <div className="space-y-2">
                      {aiSuggestions.map(suggestion => (
                        <button
                          key={suggestion.id}
                          className="w-full text-left bg-primary/5 hover:bg-primary/10 text-xs rounded-md p-2 transition-colors"
                          onClick={() => handleAiSuggestion(suggestion)}
                        >
                          <div className="flex items-center gap-1 text-primary mb-1">
                            {suggestion.type === 'schedule' && <Calendar className="h-3 w-3" />}
                            {suggestion.type === 'course' && <BookOpen className="h-3 w-3" />}
                            {suggestion.type === 'availability' && <Clock className="h-3 w-3" />}
                            <span className="font-medium">{suggestion.title}</span>
                          </div>
                          <p className="line-clamp-2">{suggestion.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message input */}
                <div className="flex items-center gap-2">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t("askAboutCourses")}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />

                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!userInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick commands */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setUserInput(t("createNewCourse"))}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t("createCourse")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setUserInput(t("setupWeeklySchedule"))}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {t("setupSchedule")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setUserInput(t("completeProfileInfo"))}
                  >
                    <UserCircle className="h-3 w-3 mr-1" />
                    {t("updateProfile")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile AI Assistant toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  className="md:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
                  size="icon"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90%] py-0 px-0">
                <SheetHeader className="px-4 py-3 border-b">
                  <SheetTitle className="flex items-center">
                    <BrainCog className="h-5 w-5 mr-2 text-primary" />
                    {t("aiAssistant")}
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-4 h-[calc(100%-9rem)]">
                  <div className="space-y-4">
                    {conversation.map((message, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-3 max-w-[90%]",
                          message.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        {message.sender === 'ai' ? (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="h-5 w-5" />
                          </div>
                        ) : (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={user?.avatar || "/avatars/default.png"} alt={user?.full_name} />
                            <AvatarFallback>{user?.full_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            "rounded-lg p-3 text-sm",
                            message.sender === 'ai'
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}

                    {aiTyping && (
                      <div className="flex items-start gap-3 max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-sm flex items-center">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={t("askAiAssistant")}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />

                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!userInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

    </>
  );
};

export default ProfessorOnboarding;
