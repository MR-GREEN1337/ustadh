"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Course, ProfessorService, ScheduleEntry } from '@/services/ProfessorService';
import { cn } from '@/lib/utils';

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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  User,
  HelpCircle,
  Info,
  Bookmark,
  X,
  ArrowRight,
  FileImage,
  CheckCircle2,
  Menu,
  Palette
} from 'lucide-react';

import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { fr, ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

// Time slot configuration for schedule
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM
const SLOT_DURATION = 30; // 30 minutes per slot

// Course Card component
const CourseCard = ({ course, onEdit, onGenerate }: { course: any, onEdit: any, onGenerate: any }) => {
  const {t} = useTranslation();
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
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{course.title}</h3>
          <Badge variant={course.status === 'active' ? "default" : "outline"}>
            {t(course.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-xs">{course.code}</span>
          <span className="text-xs">•</span>
          <Users className="h-4 w-4" />
          <span>{course.students} {t("students")}</span>
        </div>

        {course.nextClass && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{course.nextClass}</span>
          </div>
        )}

        {course.topics && course.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {course.topics.slice(0, 3).map((topic: any, idx: any) => (
              <Badge key={idx} variant="outline" className="bg-primary/5 text-xs">
                {topic}
              </Badge>
            ))}
            {course.topics.length > 3 && (
              <Badge variant="outline" className="bg-muted/50 text-xs">
                +{course.topics.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="pt-1">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs">
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
        </div>
      </CardContent>
    </Card>
  );
};

// Course Dialog Component
const CourseDialog = ({ isOpen, onClose, course, onSave }: any) => {
  const {t} = useTranslation();
  const [formData, setFormData] = useState({
    title: course?.title || '',
    code: course?.code || '',
    description: course?.description || '',
    status: course?.status || 'draft',
    topics: course?.topics || []
  });

  const [newTopic, setNewTopic] = useState('');

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setFormData({ ...formData, topics: [...formData.topics, newTopic.trim()] });
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    const newTopics = [...formData.topics];
    newTopics.splice(index, 1);
    setFormData({ ...formData, topics: newTopics });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{course ? t("editCourse") : t("createNewCourse")}</DialogTitle>
          <DialogDescription>
            {t("courseDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <Label htmlFor="title">{t("courseTitle")}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t("courseTitlePlaceholder")}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">{t("courseCode")}</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="CS101"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t("courseDescriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              name="status"
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("draft")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="archived">{t("archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("topics")}</Label>
            <div className="flex mt-1 mb-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder={t("addTopicPlaceholder")}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTopic} className="ml-2">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.topics.map((topic: string, index: number) => (
                <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center">
                  {topic}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemoveTopic(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {formData.topics.length === 0 && (
                <span className="text-sm text-muted-foreground">{t("noTopicsAdded")}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">{course ? t("updateCourse") : t("createCourse")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Schedule component
const ScheduleView = ({ onAddEntry }: { onAddEntry: (date: Date) => void }) => {
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

  // State for entry dialogs
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      });

      if (response && response.entries) {
        setScheduleEntries(response.entries as any);
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
      setError(t('errorLoadingSchedule') as any);

      // For development - sample data
      const sampleEntries = [
        {
          id: 1,
          title: "Machine Learning Lecture",
          entry_type: "class",
          start_time: format(setHours(setMinutes(addDays(weekStartDate, 1), 30), 10), "yyyy-MM-dd'T'HH:mm:ss"),
          end_time: format(setHours(setMinutes(addDays(weekStartDate, 1), 0), 12), "yyyy-MM-dd'T'HH:mm:ss"),
          location: "Building A, Room 201",
          color: "#4f46e5",
          is_recurring: true
        },
        {
          id: 2,
          title: "Office Hours",
          entry_type: "custom",
          start_time: format(setHours(setMinutes(addDays(weekStartDate, 1), 0), 14), "yyyy-MM-dd'T'HH:mm:ss"),
          end_time: format(setHours(setMinutes(addDays(weekStartDate, 1), 0), 16), "yyyy-MM-dd'T'HH:mm:ss"),
          location: "Faculty Office 305",
          color: "#0ea5e9",
          is_recurring: true
        },
        {
          id: 3,
          title: "Database Systems",
          entry_type: "class",
          start_time: format(setHours(setMinutes(addDays(weekStartDate, 3), 0), 13), "yyyy-MM-dd'T'HH:mm:ss"),
          end_time: format(setHours(setMinutes(addDays(weekStartDate, 3), 30), 14), "yyyy-MM-dd'T'HH:mm:ss"),
          location: "Building B, Room 102",
          color: "#4f46e5",
          is_recurring: true
        },
        {
          id: 4,
          title: "Department Meeting",
          entry_type: "custom",
          start_time: format(setHours(setMinutes(addDays(weekStartDate, 4), 0), 9), "yyyy-MM-dd'T'HH:mm:ss"),
          end_time: format(setHours(setMinutes(addDays(weekStartDate, 4), 0), 10), "yyyy-MM-dd'T'HH:mm:ss"),
          location: "Conference Room",
          color: "#ef4444",
          is_recurring: false
        }
      ];
      setScheduleEntries(sampleEntries as any);
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

  // Handle edit entry
  const handleEditEntry = (entry: ScheduleEntry) => {
    setSelectedEntry(entry as any);
    setIsEntryDialogOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (!selectedEntry) return;

    // API call to delete entry
    try {
      // await ProfessorService.deleteEntry(selectedEntry.id);
      toast.success(t("entryDeletedSuccess"));
      loadScheduleData(); // Reload data
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error(t("errorDeletingEntry"));
    }

    setIsDeleteDialogOpen(false);
    setSelectedEntry(null);
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
      try {
        const entryStart = parseISO(entry.start_time);
        const entryEnd = parseISO(entry.end_time);

        // Check if entry is on this day and overlaps with this time slot
        return isSameDay(entryStart, day) && entryStart <= slotEnd && entryEnd >= slotStart;
      } catch (e) {
        console.error("Error parsing date:", e);
        return false;
      }
    });
  };

  // Add a new entry for a specific slot
  const handleAddEntryForSlot = (day: Date, timeSlot: Date) => {
    const startTime = new Date(day);
    startTime.setHours(timeSlot.getHours(), timeSlot.getMinutes());

    const endTime = new Date(day);
    endTime.setHours(timeSlot.getHours() + 1, timeSlot.getMinutes());

    const newEntry = {
      title: "",
      entry_type: "class",
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm:ss"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm:ss"),
      location: "",
      color: "#4f46e5",
      is_recurring: false
    };

    setSelectedEntry(newEntry as any);
    setIsEntryDialogOpen(true);
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
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
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
          // @ts-ignore
          onClick={onAddEntry}
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
                timeSlot.getMinutes() === 0 ? "border-b-muted" : "border-b-muted/30",
                timeSlot.getHours() >= 12 && timeSlot.getHours() < 13 ? "bg-muted/10" : ""
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
                    onClick={() => !hasEntries && handleAddEntryForSlot(day, timeSlot)}
                  >
                    {entries.map((entry: any, entryIndex) => {
                      try {
                        const entryStart = parseISO(entry.start_time);
                        const entryEnd = parseISO(entry.end_time);

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

                          // Entry type styles
                          let bgColor = entry.color ? `${entry.color}15` : '#4f46e515';
                          let borderColor = entry.color ? `${entry.color}50` : '#4f46e550';

                          if (entry.entry_type === 'class') {
                            bgColor = entry.color ? `${entry.color}20` : '#4f46e520';
                            borderColor = entry.color ? `${entry.color}60` : '#4f46e560';
                          }

                          return (
                            <div
                              key={entryIndex}
                              className={cn(
                                "absolute left-0 right-0 m-1 p-1 rounded border text-xs overflow-hidden z-10 cursor-pointer transition-all hover:shadow-sm",
                                entry.is_cancelled && "opacity-50 line-through",
                                entry.is_completed && "ring-1 ring-green-500 dark:ring-green-400"
                              )}
                              style={{
                                backgroundColor: bgColor,
                                borderColor: borderColor,
                                color: entry.color,
                                height: `${Math.max(slots * 30, 30)}px`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEntry(entry);
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
                      } catch (e) {
                        console.error("Error rendering entry:", e);
                        return null;
                      }
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-between gap-4">
        <Card className="flex-1">
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">{t('entryTypes')}</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-indigo-100/50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50">
                <School className="h-3 w-3 mr-1" />
                {t('class')}
              </Badge>

              <Badge variant="outline" className="bg-sky-100/50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/50">
                <Clock className="h-3 w-3 mr-1" />
                {t('officeHours')}
              </Badge>

              <Badge variant="outline" className="bg-rose-100/50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/50">
                <Users className="h-3 w-3 mr-1" />
                {t('meeting')}
              </Badge>

              <Badge variant="outline" className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                <Layers className="h-3 w-3 mr-1" />
                {t('custom')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Repeat className="h-3 w-3 mr-1" />
                {t('syncWithSchool')}
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <FileImage className="h-3 w-3 mr-1" />
                {t('export')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry Form Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry && selectedEntry.id ? t('editScheduleEntry') : t('newScheduleEntry')}
            </DialogTitle>
            <DialogDescription>
              {t('scheduleEntryDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">{t('title')}</Label>
                <Input
                  id="title"
                  value={selectedEntry?.title || ''}
                  onChange={() => {}}
                  placeholder={t('entryTitlePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entry_type">{t('type')}</Label>
                  <Select defaultValue={selectedEntry?.entry_type || 'class'}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">
                        <div className="flex items-center">
                          <School className="h-4 w-4 mr-2" />
                          {t('class')}
                        </div>
                      </SelectItem>
                      <SelectItem value="office-hours">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {t('officeHours')}
                        </div>
                      </SelectItem>
                      <SelectItem value="meeting">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {t('meeting')}
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center">
                          <Layers className="h-4 w-4 mr-2" />
                          {t('custom')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">{t('color')}</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={selectedEntry?.color || '#4f46e5'}
                      className="w-12 h-8 p-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Palette className="h-4 w-4 mr-1" />
                          {t('colorPresets')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        <div className="grid grid-cols-5 gap-2">
                          {['#4f46e5', '#0ea5e9', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'].map((color) => (
                            <Button
                              key={color}
                              variant="ghost"
                              className="w-10 h-10 p-0"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">{t('startTime')}</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={selectedEntry ? selectedEntry.start_time.slice(0, 16) : ''}
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">{t('endTime')}</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={selectedEntry ? selectedEntry.end_time.slice(0, 16) : ''}
                    onChange={() => {}}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">{t('location')}</Label>
                <Input
                  id="location"
                  value={selectedEntry?.location || ''}
                  onChange={() => {}}
                  placeholder={t('locationPlaceholder')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="is_recurring" checked={selectedEntry?.is_recurring || false} />
                <Label htmlFor="is_recurring">{t('makeRecurring')}</Label>
              </div>

              {selectedEntry?.is_recurring && (
                <div className="pl-6 pt-2 space-y-4">
                  <div>
                    <Label>{t('recurringPattern')}</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t('weekly')}</SelectItem>
                        <SelectItem value="biweekly">{t('biweekly')}</SelectItem>
                        <SelectItem value="monthly">{t('monthly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('daysOfWeek')}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={day} className="flex items-center space-x-1">
                          <Checkbox id={`day-${i}`} />
                          <Label htmlFor={`day-${i}`} className="text-sm">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {selectedEntry && selectedEntry.id && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setIsEntryDialogOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('delete')}
              </Button>
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEntryDialogOpen(false)}
                className="mr-2"
              >
                {t('cancel')}
              </Button>
              <Button type="button" onClick={() => {
                toast.success(selectedEntry && selectedEntry.id ? t('entryUpdated') : t('entryCreated'));
                setIsEntryDialogOpen(false);
              }}>
                {selectedEntry && selectedEntry.id ? t('update') : t('create')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('deleteEntryConfirm')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm font-medium">{selectedEntry?.title}</p>
            {selectedEntry && (
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(selectedEntry.start_time), "EEEE, MMMM d, yyyy h:mm a", { locale: getLocale() })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Assignments Tab
const AssignmentsTab = ({ t }: { t: (key: string) => string }) => {
  const [loading, setLoading] = useState(false);

  const assignmentTypes = [
    {
      icon: <FileText className="h-10 w-10 text-indigo-500" />,
      title: t("quizzes"),
      count: 12,
      pending: 3
    },
    {
      icon: <CheckSquare className="h-10 w-10 text-emerald-500" />,
      title: t("exams"),
      count: 4,
      pending: 1
    },
    {
      icon: <BookMarked className="h-10 w-10 text-amber-500" />,
      title: t("projects"),
      count: 6,
      pending: 2
    },
    {
      icon: <Edit className="h-10 w-10 text-violet-500" />,
      title: t("homework"),
      count: 8,
      pending: 5
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">{t("assignmentsAndGrading")}</h2>
        <Button
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {assignmentTypes.map((type, index) => (
              <Card key={index} className="border hover:shadow-sm transition-shadow">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="mb-2">{type.icon}</div>
                  <h3 className="font-medium text-lg">{type.title}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-3xl font-semibold">{type.count}</p>
                      <p className="text-sm text-muted-foreground">{t("total")}</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="text-center">
                      <p className="text-3xl font-semibold text-primary">{type.pending}</p>
                      <p className="text-sm text-muted-foreground">{t("pending")}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-3 bg-muted/10">
                  <Button variant="ghost" size="sm" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    {t("viewAll")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium">{t("recentSubmissions")}</h3>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t("pendingGrading")}</CardTitle>
                  <Badge variant="secondary">{t("newToday")}: 5</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>S{i}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">Fatima Ahmed</p>
                            <p className="text-xs text-muted-foreground">Machine Learning - Quiz 3</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-4">
                          Submitted 3 hours ago
                        </span>
                        <Button size="sm" variant="outline">
                          {t("grade")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t p-3 bg-muted/5">
                <Button variant="ghost" size="sm" className="w-full">
                  {t("viewAllSubmissions")}
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">{t("generateWithAI")}</CardTitle>
                <CardDescription>
                  {t("aiAssignmentDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <Sparkles className="h-6 w-6 text-primary mb-2" />
                      <h3 className="font-medium">{t("createQuiz")}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("createQuizDesc")}
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <FileText className="h-6 w-6 text-primary mb-2" />
                      <h3 className="font-medium">{t("createAssignment")}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("createAssignmentDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// OnboardingTour component
const OnboardingTour = ({ activeStep, setActiveStep, onComplete }: { activeStep: number; setActiveStep: (step: number) => void; onComplete: () => void }) => {
  const {t} = useTranslation();

  const steps = [
    {
      target: '.dashboard-welcome',
      title: t('welcomeToUstadh'),
      content: t('dashboardOverviewDesc'),
      placement: 'bottom',
    },
    {
      target: '.dashboard-courses',
      title: t('coursesManagement'),
      content: t('coursesManagementDesc'),
      placement: 'bottom',
    },
    {
      target: '.dashboard-schedule',
      title: t('scheduleManagement'),
      content: t('scheduleManagementDesc'),
      placement: 'bottom',
    },
    {
      target: '.dashboard-ai',
      title: t('aiAssistant'),
      content: t('aiAssistantDesc'),
      placement: 'left',
    },
    {
      target: '.dashboard-actions',
      title: t('quickActions'),
      content: t('quickActionsDesc'),
      placement: 'top',
    }
  ];

  const currentStep = steps[activeStep];

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/50">
      <div
        className="absolute p-4 bg-background rounded-lg shadow-xl max-w-sm border z-50"
        style={{
          top: `${currentStep.placement === 'top' ? '-80px' : currentStep.placement === 'bottom' ? '80px' : '50%'}`,
          left: `${currentStep.placement === 'left' ? '-220px' : currentStep.placement === 'right' ? '220px' : '50%'}`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">{currentStep.title}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onComplete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{currentStep.content}</p>
        <div className="flex justify-between">
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full ${idx === activeStep ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {activeStep > 0 && (
              //@ts-ignore
              <Button variant="outline" size="sm" onClick={() => setActiveStep(prev => prev - 1)}>
                {t('previous')}
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              //@ts-ignore
              <Button size="sm" onClick={() => setActiveStep(prev => prev + 1)}>
                {t('next')}
              </Button>
            ) : (
              <Button size="sm" onClick={onComplete}>
                {t('finish')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
// Main Dashboard Component
const ProfessorDashboard = () => {
  const locale = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiActive, setAiActive] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messageEndRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showFeatureHighlight, setShowFeatureHighlight] = useState(null);

  // State for courses and stats
  const [courses, setCourses] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // State for dialogs
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

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
        setCourses(coursesResponse.courses as any);
      } else {
        // Sample data for development
        setCourses([]);
      }

      // Load pending items
      const pendingResponse = await ProfessorService.getPendingItems();
      if (pendingResponse && pendingResponse.items) {
        setPendingItems(pendingResponse.items as any);
      } else {
        // Sample data for development
        setPendingItems([]);
      }

      // Load recent activities
      const activitiesResponse = await ProfessorService.getRecentActivities();
      if (activitiesResponse && activitiesResponse.activities) {
        setRecentActivities(activitiesResponse.activities as any);
      } else {
        // Sample data for development
        setRecentActivities([]);
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

        // Open course dialog
        setSelectedCourse(null);
        setIsCourseDialogOpen(true);

        // Switch to courses tab
        setActiveTab('courses');
      } else if (message.toLowerCase().includes(t("schedule").toLowerCase())) {
        response = t("scheduleResponse");

        // Switch to schedule tab
        setActiveTab('schedule');
      } else if (message.toLowerCase().includes(t("assessment").toLowerCase()) ||
                message.toLowerCase().includes(t("assignment").toLowerCase())) {
        response = t("assessmentResponse");

        // Switch to assignments tab
        setActiveTab('assignments');
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
  const handleAiSuggestion = (suggestion: { id: number; title: string }) => {
    aiSendMessage(suggestion.title);

    // Remove the used suggestion
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // Handle course edit
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course as any);
    setIsCourseDialogOpen(true);
  };

  // Handle course save (create/update)
  const handleSaveCourse = (courseData: Course) => {
    if (selectedCourse as any) {
      // Update existing course
      const updatedCourses = courses.map((c: any) =>
        c.id === (selectedCourse as any).id ? { ...c, ...courseData } : c
      );
      setCourses(updatedCourses as any);
      toast.success(t("courseUpdated"));
    } else {
      // Create new course
      const newCourse = {
        // @ts-ignore
        id: courses.length + 1,
        ...courseData,
        students: 0,
        progress: 0,
        aiGenerated: false
      };
      // @ts-ignore
      setCourses([...courses, newCourse]);
      toast.success(t("courseCreated"));
    }

    setIsCourseDialogOpen(false);
  };

  // Handle course generation/enhancement
  const handleGenerateCourse = (course: Course) => {
    // Simulate AI processing
    toast.promise(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          // Update the course with AI-generated content
          const updatedCourses = courses.map((c: any) =>
            c.id === course.id ? { ...c, aiGenerated: true } : c
          );
          setCourses(updatedCourses as any);
          resolve();
        }, 2000);
      }),
      {
        loading: t("enhancingCourse"),
        success: t("courseEnhanced"),
        error: t("errorEnhancingCourse"),
      }
    );
  };

  // Scroll to bottom of conversation when new messages are added
  useEffect(() => {
    // @ts-ignore
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Load dashboard data on mount
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Automatic feature highlighting
  useEffect(() => {
    if (!showOnboarding && !showFeatureHighlight) {
      // Show feature highlights one by one after onboarding is complete
      const highlights = [
        'dashboard-ai',
        'dashboard-courses',
        'dashboard-schedule'
      ];

      const highlightTimer = setTimeout(() => {
        const nextHighlight = highlights[Math.floor(Math.random() * highlights.length)];
        setShowFeatureHighlight(nextHighlight as any);

        // Auto-dismiss highlight after 5 seconds
        setTimeout(() => {
          setShowFeatureHighlight(null);
        }, 5000);
      }, 10000); // Show highlight after 10 seconds of inactivity

      return () => clearTimeout(highlightTimer);
    }
  }, [showOnboarding, showFeatureHighlight]);

  // Header with User Profile
  const ProfileHeader = () => {
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
            <DropdownMenuItem onClick={() => {
              toast.success(t("loggedOut"));
              router.push(`/${locale}/login`);
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
<div className="flex min-h-screen">
  {/* Main content */}
  <div className="flex flex-col flex-1 min-h-screen">
    {/* Main content area */}
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        {/* Dashboard greeting */}
        <div className="mb-4 dashboard-welcome">
          <h1 className="text-2xl font-light mb-2">{t("welcomeBack", { name: user?.full_name || 'Professor' })}</h1>
          <p className="text-muted-foreground">
            {t("dashboardDescription")}
          </p>
        </div>

              {/* Mobile tabs */}
              <div className="md:hidden mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="dashboard">
                      <BarChart2 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="courses">
                      <BookOpen className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="schedule">
                      <Calendar className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="assignments">
                      <FileText className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Quick stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 dashboard-stats">
                        {pendingItems.map((item: any) => (
                          <Card key={item.id} className="border shadow-sm">
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
                      <div className="space-y-4 dashboard-upcoming">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-light">{t("upcomingClasses")}</h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setActiveTab('schedule')}
                          >
                            {t("viewAll")} {!isRTL && <ChevronRight className="h-3 w-3 ml-1" />}
                            {isRTL && <ChevronLeft className="h-3 w-3 mr-1" />}
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
                      <div className="space-y-4 dashboard-actions">
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
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">{t("yourCourses")}</h2>
                    <Button
                      onClick={() => {
                        setSelectedCourse(null);
                        setIsCourseDialogOpen(true);
                      }}
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
                      {courses.map((course: any) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onEdit={handleEditCourse}
                          onGenerate={handleGenerateCourse}
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
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <ScheduleView
                  onAddEntry={() => {
                    setSelectedCourse(null);
                  }}
                />
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <AssignmentsTab t={t as any} />
              )}
            </div>

            {/* AI Assistant panel */}
            <div className="hidden lg:flex flex-col w-[350px] border-l dashboard-ai">
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
                  className="lg:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50"
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

      {/* Course Dialog */}
      <CourseDialog
        isOpen={isCourseDialogOpen}
        onClose={() => setIsCourseDialogOpen(false)}
        course={selectedCourse}
        onSave={handleSaveCourse}
        t={t}
      />

      {/* Onboarding Tour */}
      {false && (
        <OnboardingTour
          activeStep={onboardingStep}
          setActiveStep={setOnboardingStep}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* Feature Highlights */}
      {showFeatureHighlight && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div
            className={`absolute p-3 bg-primary text-primary-foreground rounded shadow-xl max-w-xs animate-pulse ${
              showFeatureHighlight === 'dashboard-ai' ? 'right-64 top-32' :
              showFeatureHighlight === 'dashboard-courses' ? 'left-64 top-16' :
              'left-1/2 top-1/2'
            }`}
          >
            {showFeatureHighlight === 'dashboard-ai' && (
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t("aiAssistantTip")}</p>
                  <p className="text-sm">{t("aiAssistantTipDesc")}</p>
                </div>
              </div>
            )}

            {showFeatureHighlight === 'dashboard-courses' && (
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t("coursesTip")}</p>
                  <p className="text-sm">{t("coursesTipDesc")}</p>
                </div>
              </div>
            )}

            {showFeatureHighlight === 'dashboard-schedule' && (
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">{t("scheduleTip")}</p>
                  <p className="text-sm">{t("scheduleTipDesc")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProfessorDashboard;
