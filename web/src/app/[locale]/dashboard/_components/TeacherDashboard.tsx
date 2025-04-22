"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { ProfessorService } from '@/services/ProfessorService';

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ModeToggle } from '@/components/global/ThemeModeToggle';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import {
  MessageSquare,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Settings,
  Plus,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
  Edit,
  Trash2,
  Sparkles,
  BrainCircuit,
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
  CalendarDays,
  BookOpenCheck,
  School,
  FileText,
  CheckSquare,
  BarChart2,
  BookMarked,
  AlertCircle,
  Loader2,
  Repeat,
  Layers,
  Briefcase,
  UserPlus,
  User
} from 'lucide-react';

import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { fr, ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

// Time slot configuration for schedule
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM
const SLOT_DURATION = 30; // 30 minutes per slot

// Course Card component
const CourseCard = ({ course, onEdit, onGenerate, t }: any) => {
  return (
    <Card className={cn("border hover:border-primary/20 transition-all duration-300",
      course.aiGenerated && "relative")}>
      {course.aiGenerated && (
        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs px-2 py-1 rounded-bl-md flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          {t("aiEnhanced")}
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <h3 className="font-medium">{course.title}</h3>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{course.students} {t("students")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{course.nextClass}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{t("progress")}: {course.progress}%</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(course)}>
              <Edit className="h-3 w-3 mr-1" />
              {t("edit")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onGenerate(course)}>
              <Sparkles className="h-3 w-3 mr-1" />
              {t("enhance")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Schedule component
const ScheduleView = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const { user } = useAuth();
  const isRTL = locale === "ar";

  // State for current week
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [weekEndDate, setWeekEndDate] = useState(endOfWeek(currentDate, { weekStartsOn: 1 }));

  // State for schedule data
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('personal');

  // Get locale for date-fns
  const getLocale = () => {
    switch (locale) {
      case 'fr': return fr;
      case 'ar': return ar;
      default: return enUS;
    }
  };

  // Generate days of week array
  const daysOfWeek = useMemo(() => {
    const days = [];
    const start = weekStartDate;
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [weekStartDate]);

  // Generate time slots array
  const timeSlots = useMemo(() => {
    const slots = [];
    const slotsPerHour = 60 / SLOT_DURATION;
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      for (let slot = 0; slot < slotsPerHour; slot++) {
        const minutes = slot * SLOT_DURATION;
        const date = new Date();
        date.setHours(hour);
        date.setMinutes(minutes);
        slots.push(date);
      }
    }
    return slots;
  }, []);

  // Load schedule data
  const loadScheduleData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Format dates for API
      const startDate = format(weekStartDate, "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(addDays(weekEndDate, 1), "yyyy-MM-dd'T'HH:mm:ss");

      // Load schedule entries
      const response = await ProfessorService.getSchedule({
        start_date: startDate,
        end_date: endDate,
        view_mode: viewMode
      }, locale);

      if (response && response.entries) {
        setScheduleEntries(response.entries);
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
      setError(t('errorLoadingSchedule') as any);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation between weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? subWeeks(currentDate, 1)
      : addWeeks(currentDate, 1);

    setCurrentDate(newDate);
    setWeekStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
    setWeekEndDate(endOfWeek(newDate, { weekStartsOn: 1 }));
  };

  // Reset to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    setCurrentDate(today);
    setWeekStartDate(startOfWeek(today, { weekStartsOn: 1 }));
    setWeekEndDate(endOfWeek(today, { weekStartsOn: 1 }));
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return format(date, isRTL ? 'h:mm a' : 'HH:mm', { locale: getLocale() });
  };

  // Format day for display
  const formatDay = (date: Date) => {
    return format(date, "EEEE", { locale: getLocale() });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "d MMM", { locale: getLocale() });
  };

  // Get entries for a specific day and time slot
  const getEntriesForSlot = (day: Date, timeSlot: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const slotStart = new Date(day);
    slotStart.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);

    const slotEnd = new Date(day);
    slotEnd.setHours(timeSlot.getHours(), timeSlot.getMinutes() + SLOT_DURATION, 0, 0);

    return scheduleEntries.filter((entry: any) => {
      const entryStart = parseISO(entry.start_time);
      const entryEnd = parseISO(entry.end_time);

      // Check if entry is on this day and overlaps with this time slot
      return isSameDay(entryStart, day) && entryStart <= slotEnd && entryEnd >= slotStart;
    });
  };

  useEffect(() => {
    loadScheduleData();
  }, [weekStartDate, weekEndDate, viewMode]);

  return (
    <div className="space-y-6">
      {/* View selector */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:items-center justify-between">
        <Tabs
          value={viewMode}
          onValueChange={setViewMode}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              {t('personal')}
            </TabsTrigger>
            <TabsTrigger value="office-hours">
              <Clock className="h-4 w-4 mr-2" />
              {t('officeHours')}
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('courses')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            // Open entry creation dialog
            aiSendMessage(t("createNewScheduleEntry"));
          }}
          className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}
        >
          <Plus className="h-4 w-4" />
          <span>{t('newEntry')}</span>
        </Button>
      </div>

      {/* Week navigation */}
      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-2">
        <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('prevWeek')}
        </Button>

        <div className="flex items-center">
          <button
            onClick={goToCurrentWeek}
            className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">
              {t('week')} {format(weekStartDate, 'w')}:
            </span>
            <span className="ml-1 font-light">
              {format(weekStartDate, "d MMM", { locale: getLocale() })} - {format(weekEndDate, "d MMM", { locale: getLocale() })}
            </span>
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
          {t('nextWeek')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main schedule grid */}
      <div className="bg-card border rounded-xl overflow-auto">
        {/* Day headers */}
        <div className="grid grid-cols-8 divide-x border-b">
          {/* Empty cell for time column */}
          <div className="p-2 text-center text-xs text-muted-foreground">
            {t('timeSlot')}
          </div>

          {/* Day columns */}
          {daysOfWeek.map((day, index) => (
            <div
              key={index}
              className={cn(
                "p-2 text-center",
                isSameDay(day, new Date()) && "bg-primary/5"
              )}
            >
              <div className="font-medium text-sm">
                {formatDay(day)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(day)}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {t('loadingSchedule')}
                </span>
              </div>
            </div>
          )}

          {timeSlots.map((timeSlot, timeIndex) => (
            <div
              key={timeIndex}
              className={cn(
                "grid grid-cols-8 divide-x border-b",
                timeSlot.getMinutes() === 0 ? "border-b-muted" : "border-b-muted/30"
              )}
            >
              {/* Time label */}
              <div className={cn(
                "p-1 text-center text-xs text-muted-foreground",
                timeSlot.getMinutes() === 0 ? "font-medium" : "font-light"
              )}>
                {timeSlot.getMinutes() === 0 && formatTime(timeSlot)}
              </div>

              {/* Day cells */}
              {daysOfWeek.map((day, dayIndex) => {
                const entries = getEntriesForSlot(day, timeSlot);
                const hasEntries = entries.length > 0;

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "min-h-[40px] p-1 relative",
                      isSameDay(day, new Date()) && "bg-primary/5",
                      !hasEntries && "hover:bg-muted/20 cursor-pointer",
                      hasEntries && "overflow-visible"
                    )}
                    onClick={() => !hasEntries && aiSendMessage(t("createScheduleEntryFor", {
                      day: formatDay(day),
                      time: formatTime(timeSlot)
                    }))}
                  >
                    {entries.map((entry: any, entryIndex) => {
                      const entryStart = parseISO((entry as any).start_time);
                      const entryEnd = parseISO((entry as any).end_time);

                      // Only render the entry at its start time
                      if (
                        getHours(entryStart) === timeSlot.getHours() &&
                        getMinutes(entryStart) <= timeSlot.getMinutes() &&
                        getMinutes(entryStart) > timeSlot.getMinutes() - SLOT_DURATION
                      ) {
                        // Calculate duration in slots
                        const durationMinutes =
                          (getHours(entryEnd) - getHours(entryStart)) * 60 +
                          (getMinutes(entryEnd) - getMinutes(entryStart));

                        const slots = Math.ceil(durationMinutes / SLOT_DURATION);

                        return (
                          <div
                            key={entryIndex}
                            className={cn(
                              "absolute left-0 right-0 m-1 p-1 rounded border text-xs overflow-hidden z-10 cursor-pointer transition-all",
                              entry.is_cancelled && "opacity-50 line-through",
                              entry.is_completed && "ring-1 ring-green-500 dark:ring-green-400"
                            )}
                            style={{
                              backgroundColor: entry.color ? `${entry.color}15` : undefined,
                              borderColor: entry.color ? `${entry.color}50` : undefined,
                              color: entry.color || undefined,
                              height: `${Math.max(slots * 30, 30)}px`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              aiSendMessage(t("editEntry", { title: entry.title }));
                            }}
                          >
                            <div className="flex justify-between">
                              <span className="font-medium truncate">{entry.title}</span>
                              {entry.is_recurring && (
                                <Repeat className="h-3 w-3 flex-shrink-0" />
                              )}
                            </div>

                            {slots > 1 && (
                              <div className="flex items-center mt-0.5 space-x-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {format(entryStart, "HH:mm")} - {format(entryEnd, "HH:mm")}
                                </span>
                              </div>
                            )}

                            {slots > 2 && entry.location && (
                              <div className="text-xs opacity-75 truncate mt-0.5">
                                {entry.location}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// AI Dashboard Component
const ProfessorDashboard = () => {
  const locale = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiActive, setAiActive] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messageEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // State for courses and stats
  const [courses, setCourses] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // AI conversation
  const [conversation, setConversation] = useState([
    {
      sender: 'ai',
      content: t("aiDashboardWelcome"),
      timestamp: new Date()
    }
  ]);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState([
    {
      id: 1,
      title: t("scheduleNextWeekClasses"),
      description: t("scheduleNextWeekClassesDesc"),
      type: 'schedule'
    },
    {
      id: 2,
      title: t("createNewAssessment"),
      description: t("createNewAssessmentDesc"),
      type: 'assessment'
    },
    {
      id: 3,
      title: t("analyzeCourseProgress"),
      description: t("analyzeCourseProgressDesc"),
      type: 'analytics'
    }
  ]);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load courses
      const coursesResponse = await ProfessorService.getCourses();
      if (coursesResponse && coursesResponse.courses) {
        setCourses(coursesResponse.courses);
      }

      // Load pending items
      const pendingResponse = await ProfessorService.getPendingItems();
      if (pendingResponse && pendingResponse.items) {
        setPendingItems(pendingResponse.items);
      }

      // Load recent activities
      const activitiesResponse = await ProfessorService.getRecentActivities();
      if (activitiesResponse && activitiesResponse.activities) {
        setRecentActivities(activitiesResponse.activities);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error(t("errorLoadingDashboard"));
    } finally {
      setLoading(false);
    }
  };

  // Send message to AI
  const aiSendMessage = (message: string) => {
    if (!message.trim()) return;

    // Add user message to conversation
    setConversation([
      ...conversation,
      {
        sender: 'user',
        content: message,
        timestamp: new Date()
      }
    ]);

    // Clear input if it's from the input field
    if (message === userInput) {
      setUserInput('');
    }

    // Simulate AI typing
    setAiTyping(true);

    // Simulate AI response based on message content
    setTimeout(() => {
      let response;

      if (message.toLowerCase().includes(t("createCourse").toLowerCase()) ||
          message.toLowerCase().includes(t("newCourse").toLowerCase())) {
        response = t("newCourseResponse");

        // Switch to courses tab
        setActiveTab('courses');
      } else if (message.toLowerCase().includes(t("schedule").toLowerCase())) {
        response = t("scheduleResponse");

        // Switch to schedule tab
        setActiveTab('schedule');
      } else if (message.toLowerCase().includes(t("assessment").toLowerCase()) ||
                message.toLowerCase().includes(t("assignment").toLowerCase())) {
        response = t("assessmentResponse");
      } else {
        response = t("generalResponse", { query: message });
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

  // Handle sending message from input
  const handleSendMessage = () => {
    aiSendMessage(userInput);
  };

  // Handle AI suggestion click
  const handleAiSuggestion = (suggestion: any) => {
    aiSendMessage(suggestion.title);

    // Remove the used suggestion
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // Handle course edit
  const handleEditCourse = (course: any) => {
    aiSendMessage(t("editCourse", { title: course.title }));
  };

  // Handle course generation/enhancement
  const handleGenerateCourse = (course: any) => {
    aiSendMessage(t("enhanceCourse", { title: course.title }));
  };

  // Scroll to bottom of conversation when new messages are added
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Load dashboard data on mount
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  return (
    <>
      <div className="flex min-h-screen">
        {/* Main content with left margin for desktop */}
        <div className="flex flex-col flex-1 min-h-screen">

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Content panel - Dashboard/Courses/Schedule */}
            <div className="flex-1 overflow-auto border-r">
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-light mb-2">{t("welcomeBack", { name: user?.full_name as any })}</h1>
                  <p className="text-muted-foreground">
                    {t("dashboardDescription")}
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                  <TabsList>
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4" />
                      <span>{t("dashboard")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{t("courses")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{t("schedule")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{t("assignments")}</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Dashboard Tab */}
                  <TabsContent value="dashboard" className="mt-6 space-y-6">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        {/* Quick stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {pendingItems.map((item: any) => (
                            <Card key={item.id} className="border">
                              <CardContent className="p-6 flex justify-between items-center">
                                <div>
                                  <p className="text-lg font-medium">{item.count}</p>
                                  <p className="text-sm text-muted-foreground">{t(item.type)} {t(item.label)}</p>
                                </div>
                                <div className="rounded-full p-2 bg-primary/10">
                                  {item.type === "assignments" ? (
                                    <CheckSquare className="h-5 w-5 text-primary" />
                                  ) : item.type === "messages" ? (
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Users className="h-5 w-5 text-primary" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Upcoming classes */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-xl font-light">{t("upcomingClasses")}</h2>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => setActiveTab('schedule')}
                            >
                              {t("viewAll")} {!isRTL && <ChevronRight className="h-3 w-3 ml-1" />}
                              {isRTL && <ChevronRight className="h-3 w-3 mr-1" />}
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {courses.slice(0, 3).map((course: any) => (
                              <Card
                                key={course.id}
                                className="border hover:border-primary/20 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all duration-300 cursor-pointer"
                                onClick={() => handleEditCourse(course)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h3 className="font-medium">{course.title}</h3>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{course.nextClass}</span>
                                      </div>
                                    </div>
                                    <Badge variant="outline">
                                      {course.students} {t("students")}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Recent activity */}
                        <div className="space-y-4">
                          <h2 className="text-xl font-light">{t("recentActivity")}</h2>
                          <div className="space-y-2">
                            {recentActivities.map((activity: any) => (
                              <Card key={activity.id} className="border">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                      <p className="text-sm">{activity.description}</p>
                                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => aiSendMessage(t("tellMeAbout", { activity: activity.description }))}
                                    >
                                      {t("view")}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Teaching tools */}
                        <div className="space-y-4">
                          <h2 className="text-xl font-light">{t("teachingTools")}</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card
                              className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
                              onClick={() => setActiveTab('schedule')}
                            >
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                <Calendar className="h-6 w-6 text-primary" />
                                <p className="text-sm font-medium">{t("schedule")}</p>
                              </CardContent>
                            </Card>
                            <Card
                              className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
                              onClick={() => setActiveTab('assignments')}
                            >
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                <p className="text-sm font-medium">{t("assignments")}</p>
                              </CardContent>
                            </Card>
                            <Card
                              className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
                              onClick={() => aiSendMessage(t("analyzeStudentPerformance"))}
                            >
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                <BarChart2 className="h-6 w-6 text-primary" />
                                <p className="text-sm font-medium">{t("analytics")}</p>
                              </CardContent>
                            </Card>
                            <Card
                              className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
                              onClick={() => aiSendMessage(t("createLearningResources"))}
                            >
                              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                <BookMarked className="h-6 w-6 text-primary" />
                                <p className="text-sm font-medium">{t("resources")}</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Courses Tab */}
                  <TabsContent value="courses" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium">{t("yourCourses")}</h2>
                      <Button
                        onClick={() => aiSendMessage(t("createNewCourse"))}
                        className="gap-2"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>{t("newCourse")}</span>
                      </Button>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map(course => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            onEdit={handleEditCourse}
                            onGenerate={handleGenerateCourse}
                            t={t}
                          />
                        ))}
                      </div>
                    )}

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
                            onClick={() => aiSendMessage(t("createNewCourse"))}
                          >
                            <Zap className="h-4 w-4" />
                            <span>{t("generateNewCourse")}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => aiSendMessage(t("enhanceExistingCourse"))}
                          >
                            <BookOpenCheck className="h-4 w-4" />
                            <span>{t("enhanceExistingCourse")}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Schedule Tab */}
                  <TabsContent value="schedule" className="mt-6">
                    <ScheduleView />
                  </TabsContent>

                  {/* Assignments Tab */}
                  <TabsContent value="assignments" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium">{t("assignmentsAndGrading")}</h2>
                      <Button
                        onClick={() => aiSendMessage(t("createNewAssignment"))}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{t("newAssignment")}</span>
                      </Button>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg font-medium">{t("pendingAssignments")}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-center text-muted-foreground py-8">
                              {t("askAIToCreateAssignment")}
                            </p>
                          </CardContent>
                          <CardFooter className="flex justify-center border-t pt-4">
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => aiSendMessage(t("createAssignmentPrompt"))}
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>{t("generateWithAI")}</span>
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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
                      content: t("aiDashboardWelcome"),
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
                            {suggestion.type === 'assessment' && <FileText className="h-3 w-3" />}
                            {suggestion.type === 'analytics' && <BarChart2 className="h-3 w-3" />}
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
                    onClick={() => setUserInput(t("analyzeStudentPerformance"))}
                  >
                    <BarChart2 className="h-3 w-3 mr-1" />
                    {t("analyzePerformance")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setUserInput(t("generateAssessment"))}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {t("createAssessment")}
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

      <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
    </>
  );
};

export default ProfessorDashboard;
