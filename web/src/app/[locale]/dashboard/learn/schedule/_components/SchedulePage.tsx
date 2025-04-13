"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import ScheduleService from '@/services/ScheduleService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Repeat,
  BellRing,
  Check,
  Loader2,
  BookOpen,
  RefreshCw,
  School,
  Layers,
  Palette,
  AlertCircle,
  X
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, isWithinInterval, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { fr, ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Time slot configuration
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM
const SLOT_DURATION = 30; // 30 minutes per slot

type ScheduleEntry = {
  id: string | number;
  title: string;
  description?: string;
  entry_type: string;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  location?: string;
  color?: string;
  school_class_id?: number;
  course_id?: number;
  subject_id?: number;
  is_cancelled?: boolean;
  is_completed?: boolean;
};

const SchedulePage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  // State for current week
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [weekEndDate, setWeekEndDate] = useState(endOfWeek(currentDate, { weekStartsOn: 1 }));

  // State for schedule data
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [classSchedule, setClassSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for entry dialog
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_type: 'study',
    start_time: format(setHours(setMinutes(new Date(), 0), 9), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(setHours(setMinutes(new Date(), 0), 10), "yyyy-MM-dd'T'HH:mm"),
    is_recurring: false,
    recurrence_pattern: 'weekly',
    days_of_week: [] as number[],
    location: '',
    color: '#0EA5E9', // default sky blue
    notification_minutes_before: 15,
  });

  // State for sync dialog
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncOptions, setSyncOptions] = useState({
    overwrite_existing: false,
    include_types: ['class'],
  });
  const [syncResult, setSyncResult] = useState<{ success: boolean; count: number; message: string } | null>(null);

  // Get locale for date-fns
  const getLocale = () => {
    switch (locale) {
      case 'fr':
        return fr;
      case 'ar':
        return ar;
      default:
        return enUS;
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

      // Get personal schedule
      const response = await ScheduleService.getSchedule({
        start_date: startDate,
        end_date: endDate,
      }, locale as string);

      if (response && response.entries) {
        setScheduleEntries(response.entries);
      }

      // If user is a student, also get class schedule
      if (user?.user_type === 'student') {
        const classResponse = await ScheduleService.getClassSchedule({
          start_date: startDate,
          end_date: endDate,
        }, locale as string);

        if (classResponse && classResponse.class_schedule) {
          setClassSchedule(classResponse.class_schedule);
        }
      }
    } catch (err) {
      console.error('Error loading schedule data:', err);
      setError(t('errorLoadingSchedule') || 'Error loading schedule data. Please try again.');
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

    // Combine personal and class schedule
    const allEntries = [...scheduleEntries, ...classSchedule];

    return allEntries.filter(entry => {
      const entryStart = parseISO(entry.start_time);
      const entryEnd = parseISO(entry.end_time);

      // Check if entry is on this day
      if (!isSameDay(entryStart, day)) {
        return false;
      }

      // Check if entry overlaps with this time slot
      return (entryStart <= slotEnd && entryEnd >= slotStart);
    });
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

  // Handle opening the entry dialog for a specific slot
  const openEntryDialogForSlot = (day: Date, timeSlot: Date) => {
    // Set default times for the form
    const startTime = new Date(day);
    startTime.setHours(timeSlot.getHours(), timeSlot.getMinutes());

    const endTime = new Date(day);
    endTime.setHours(timeSlot.getHours(), timeSlot.getMinutes() + SLOT_DURATION);

    setFormData({
      ...formData,
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      days_of_week: [day.getDay() === 0 ? 6 : day.getDay() - 1], // Convert Sunday=0 to Monday=0 format
    });

    setSelectedEntry(null);
    setIsEditMode(false);
    setIsEntryDialogOpen(true);
  };

  // Handle opening the entry dialog for editing an existing entry
  const openEntryDialogForEdit = (entry: ScheduleEntry) => {
    const startTime = parseISO(entry.start_time);
    const endTime = parseISO(entry.end_time);

    setFormData({
      title: entry.title,
      description: entry.description || '',
      entry_type: entry.entry_type,
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      is_recurring: entry.is_recurring || false,
      recurrence_pattern: entry.recurrence_pattern || 'weekly',
      days_of_week: entry.days_of_week || [startTime.getDay() === 0 ? 6 : startTime.getDay() - 1],
      location: entry.location || '',
      color: entry.color || '#0EA5E9',
      notification_minutes_before: 15, // Default value
    });

    setSelectedEntry(entry);
    setIsEditMode(true);
    setIsEntryDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  // Handle day of week selection
  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    let newDays = [...formData.days_of_week];

    if (checked && !newDays.includes(day)) {
      newDays.push(day);
    } else if (!checked && newDays.includes(day)) {
      newDays = newDays.filter(d => d !== day);
    }

    setFormData({ ...formData, days_of_week: newDays });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && selectedEntry) {
        // Update existing entry
        await ScheduleService.updateEntry(
          selectedEntry.id as number,
          {
            title: formData.title,
            description: formData.description,
            entry_type: formData.entry_type,
            start_time: formData.start_time,
            end_time: formData.end_time,
            is_recurring: formData.is_recurring,
            recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
            days_of_week: formData.is_recurring ? formData.days_of_week : [],
            location: formData.location,
            color: formData.color,
            notification_minutes_before: formData.notification_minutes_before,
          },
          locale as string
        );
      } else {
        // Create new entry
        await ScheduleService.createEntry(
          {
            title: formData.title,
            description: formData.description,
            entry_type: formData.entry_type,
            start_time: formData.start_time,
            end_time: formData.end_time,
            is_recurring: formData.is_recurring,
            recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
            days_of_week: formData.is_recurring ? formData.days_of_week : [],
            location: formData.location,
            color: formData.color,
            notification_minutes_before: formData.notification_minutes_before,
          },
          locale as string
        );
      }

      // Close dialog and reload data
      setIsEntryDialogOpen(false);
      loadScheduleData();
    } catch (err) {
      console.error('Error saving schedule entry:', err);
      setError(t('errorSavingEntry') || 'Error saving schedule entry. Please try again.');
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;

    try {
      await ScheduleService.deleteEntry(selectedEntry.id as number, locale as string);
      setIsEntryDialogOpen(false);
      loadScheduleData();
    } catch (err) {
      console.error('Error deleting schedule entry:', err);
      setError(t('errorDeletingEntry') || 'Error deleting schedule entry. Please try again.');
    }
  };

  // Handle school schedule sync
  const handleSyncSchoolSchedule = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await ScheduleService.syncSchoolSchedule(syncOptions, locale as string);
      setSyncResult({
        success: result.success,
        count: result.count,
        message: result.success
          ? t('syncSuccessMessage', { count: result.count }) || `Successfully synced ${result.count} class schedules.`
          : t('syncFailMessage') || 'Failed to sync school schedule.'
      });

      if (result.success && result.count > 0) {
        // Reload data after successful sync
        await loadScheduleData();
      }
    } catch (err) {
      console.error('Error syncing school schedule:', err);
      setSyncResult({
        success: false,
        count: 0,
        message: t('syncErrorMessage') || 'Error syncing school schedule. Please try again.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Get entry type icon
  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'class':
        return <School className="h-4 w-4" />;
      case 'study':
        return <BookOpen className="h-4 w-4" />;
      case 'homework':
        return <Edit className="h-4 w-4" />;
      case 'exam':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  // Get entry type badge style
  const getEntryTypeBadgeStyles = (type: string, color?: string) => {
    if (color) {
      const hexColor = color.startsWith('#') ? color : `#${color}`;
      // Create lighter variant for the background
      return {
        backgroundColor: `${hexColor}20`,
        color: hexColor,
        borderColor: `${hexColor}40`
      };
    }

    // Default colors by type
    switch (type) {
      case 'class':
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
      case 'study':
        return 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800/50';
      case 'homework':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'exam':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50';
      default:
        return 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800/50';
    }
  };

  // Effect to load schedule data when week changes
  useEffect(() => {
    loadScheduleData();
  }, [weekStartDate, weekEndDate]);

  return (
    <div className={`space-y-6 max-w-7xl mx-auto pb-10 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-light tracking-tight">
            {t('schedule') || 'Schedule'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('manageYourTime') || 'Manage your time and organize your activities'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSyncDialogOpen(true)}
            disabled={user?.user_type !== 'student'}
            className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t('syncSchoolSchedule') || 'Sync School Schedule'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedEntry(null);
              setIsEditMode(false);
              setFormData({
                ...formData,
                title: '',
                description: '',
                entry_type: 'study',
                start_time: format(setHours(setMinutes(new Date(), 0), 9), "yyyy-MM-dd'T'HH:mm"),
                end_time: format(setHours(setMinutes(new Date(), 0), 10), "yyyy-MM-dd'T'HH:mm"),
              });
              setIsEntryDialogOpen(true);
            }}
            className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}
          >
            <Plus className="h-4 w-4" />
            <span>{t('newEntry') || 'New Entry'}</span>
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('prevWeek') || 'Previous Week'}
        </Button>

        <div className="flex items-center">
          <button
            onClick={goToCurrentWeek}
            className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">
              {t('week') || 'Week'} {format(weekStartDate, 'w')}:
            </span>
            <span className="ml-1 font-light">
              {format(weekStartDate, "d MMM", { locale: getLocale() })} - {format(weekEndDate, "d MMM", { locale: getLocale() })}
            </span>
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
          {t('nextWeek') || 'Next Week'}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mt-4">
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
            {t('timeSlot') || 'Time'}
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
                  {t('loadingSchedule') || 'Loading schedule...'}
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
                    onClick={() => !hasEntries && openEntryDialogForSlot(day, timeSlot)}
                  >
                    {entries.map((entry, entryIndex) => {
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
                        const heightClass = `h-[${slots * 40}px]`;

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
                              openEntryDialogForEdit(entry);
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

      {/* Legends and helpers */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t('entryTypes') || 'Entry Types'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Badge className={getEntryTypeBadgeStyles('class')}>
                  <School className="h-3 w-3 mr-1" />
                  {t('class') || 'Class'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getEntryTypeBadgeStyles('study')}>
                  <BookOpen className="h-3 w-3 mr-1" />
                  {t('study') || 'Study'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getEntryTypeBadgeStyles('homework')}>
                  <Edit className="h-3 w-3 mr-1" />
                  {t('homework') || 'Homework'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getEntryTypeBadgeStyles('exam')}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('exam') || 'Exam'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t('legendStatus') || 'Status Legend'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 dark:bg-green-400"></div>
                <span className="text-sm">{t('completed') || 'Completed'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="line-through text-sm text-muted-foreground">
                  {t('cancelled') || 'Cancelled'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t('recurring') || 'Recurring'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entry dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? t('editScheduleEntry') || 'Edit Schedule Entry'
                : t('newScheduleEntry') || 'New Schedule Entry'}
            </DialogTitle>
            <DialogDescription>
              {t('scheduleEntryDescription') || 'Add details for your schedule entry'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t('title') || 'Title'} *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder={t('titlePlaceholder') || 'Enter a title for your schedule entry'}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('description') || 'Description'}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t('descriptionPlaceholder') || 'Enter a description (optional)'}
                  rows={2}
                />
              </div>

              {/* Entry type */}
              <div className="space-y-2">
                <Label htmlFor="entry_type">{t('entryType') || 'Entry Type'} *</Label>
                <Select
                  name="entry_type"
                  value={formData.entry_type}
                  onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectEntryType') || 'Select entry type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t('study') || 'Study'}
                      </div>
                    </SelectItem>
                    <SelectItem value="homework">
                      <div className="flex items-center">
                        <Edit className="h-4 w-4 mr-2" />
                        {t('homework') || 'Homework'}
                      </div>
                    </SelectItem>
                    <SelectItem value="exam">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {t('exam') || 'Exam'}
                      </div>
                    </SelectItem>
                    <SelectItem value="class">
                      <div className="flex items-center">
                        <School className="h-4 w-4 mr-2" />
                        {t('class') || 'Class'}
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-2" />
                        {t('custom') || 'Custom'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date and time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">{t('startTime') || 'Start Time'} *</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">{t('endTime') || 'End Time'} *</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t('location') || 'Location'}</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={t('locationPlaceholder') || 'Enter a location (optional)'}
                />
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <Label htmlFor="color">{t('color') || 'Color'}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-12 h-8 p-1"
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                  <span className="text-sm text-muted-foreground">{formData.color}</span>
                </div>
              </div>

              {/* Recurring options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleCheckboxChange('is_recurring', checked as boolean)}
                  />
                  <Label htmlFor="is_recurring">{t('isRecurring') || 'This is a recurring event'}</Label>
                </div>

                {formData.is_recurring && (
                  <div className="pl-6 space-y-4 mt-2">
                    {/* Recurrence pattern */}
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_pattern">{t('recurrencePattern') || 'Recurrence Pattern'}</Label>
                      <Select
                        name="recurrence_pattern"
                        value={formData.recurrence_pattern}
                        onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectRecurrencePattern') || 'Select recurrence pattern'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t('daily') || 'Daily'}</SelectItem>
                          <SelectItem value="weekly">{t('weekly') || 'Weekly'}</SelectItem>
                          <SelectItem value="biweekly">{t('biweekly') || 'Biweekly'}</SelectItem>
                          <SelectItem value="monthly">{t('monthly') || 'Monthly'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Days of week */}
                    {(formData.recurrence_pattern === 'weekly' || formData.recurrence_pattern === 'biweekly') && (
                      <div className="space-y-2">
                        <Label>{t('daysOfWeek') || 'Days of Week'}</Label>
                        <div className="flex flex-wrap gap-2">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              <Checkbox
                                id={`day-${index}`}
                                checked={formData.days_of_week.includes(index)}
                                onCheckedChange={(checked) => handleDayOfWeekChange(index, checked as boolean)}
                              />
                              <Label htmlFor={`day-${index}`} className="text-xs">
                                {t(day) || day.charAt(0).toUpperCase() + day.slice(1)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notification */}
              <div className="space-y-2">
                <Label htmlFor="notification_minutes_before">
                  {t('notificationBefore') || 'Notification Before'}
                </Label>
                <Select
                  name="notification_minutes_before"
                  value={formData.notification_minutes_before.toString()}
                  onValueChange={(value) => setFormData({ ...formData, notification_minutes_before: parseInt(value, 10) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectNotificationTime') || 'Select notification time'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('noNotification') || 'No notification'}</SelectItem>
                    <SelectItem value="5">5 {t('minutesBefore') || 'minutes before'}</SelectItem>
                    <SelectItem value="10">10 {t('minutesBefore') || 'minutes before'}</SelectItem>
                    <SelectItem value="15">15 {t('minutesBefore') || 'minutes before'}</SelectItem>
                    <SelectItem value="30">30 {t('minutesBefore') || 'minutes before'}</SelectItem>
                    <SelectItem value="60">1 {t('hourBefore') || 'hour before'}</SelectItem>
                    <SelectItem value="120">2 {t('hoursBefore') || 'hours before'}</SelectItem>
                    <SelectItem value="1440">1 {t('dayBefore') || 'day before'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteEntry}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('delete') || 'Delete'}
                </Button>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEntryDialogOpen(false)}
                  className="mr-2"
                >
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button type="submit">
                  {isEditMode ? (t('update') || 'Update') : (t('create') || 'Create')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sync dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('syncSchoolSchedule') || 'Sync School Schedule'}
            </DialogTitle>
            <DialogDescription>
              {t('syncSchoolDescription') || 'Import your school class schedule to your personal calendar'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sync options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite_existing"
                  checked={syncOptions.overwrite_existing}
                  onCheckedChange={(checked) =>
                    setSyncOptions({ ...syncOptions, overwrite_existing: checked as boolean })
                  }
                />
                <Label htmlFor="overwrite_existing">
                  {t('overwriteExisting') || 'Overwrite existing entries'}
                </Label>
              </div>

              <div className="space-y-2">
                <Label>{t('includeEntryTypes') || 'Include Entry Types'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include_class"
                      checked={syncOptions.include_types.includes('class')}
                      onCheckedChange={(checked) => {
                        const updatedTypes = checked
                          ? [...syncOptions.include_types, 'class']
                          : syncOptions.include_types.filter(t => t !== 'class');
                        setSyncOptions({ ...syncOptions, include_types: updatedTypes });
                      }}
                    />
                    <Label htmlFor="include_class">{t('classes') || 'Classes'}</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync result */}
            {syncResult && (
              <Alert variant={syncResult.success ? "default" : "destructive"}>
                {syncResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{syncResult.message}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSyncDialogOpen(false)}
                className="mr-2"
              >
                {t('close') || 'Close'}
              </Button>
              <Button
                onClick={handleSyncSchoolSchedule}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('syncing') || 'Syncing...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('sync') || 'Sync'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;
