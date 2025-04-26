// File: app/[locale]/dashboard/professor/schedule/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useAuth } from '@/providers/AuthProvider';
import { ProfessorService } from '@/services/ProfessorService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Plus,
  ChevronRight,
  ChevronLeft,
  Edit,
  Trash2,
  Sparkles,
  CalendarDays,
  Repeat,
  School,
  Layers,
  FileText,
  Palette,
  AlertCircle,
  User,
  BookOpen,
  Loader2,
} from 'lucide-react';

import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, getHours, getMinutes, setHours, setMinutes } from 'date-fns';
import { fr, ar, enUS } from 'date-fns/locale';

// Time slot configuration
const START_HOUR = 7; // 7 AM
const END_HOUR = 20; // 8 PM
const SLOT_DURATION = 30; // 30 minutes per slot

// Entry Dialog Component
const ScheduleEntryDialog = ({ isOpen, onClose, entry, onSave, onDelete, t, isRTL }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_type: 'class',
    start_time: '',
    end_time: '',
    location: '',
    color: '#4f46e5',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    days_of_week: []
  });

  useEffect(() => {
    if (entry) {
      // Set form data from existing entry
      const startTime = parseISO(entry.start_time);
      const endTime = parseISO(entry.end_time);

      setFormData({
        title: entry.title || '',
        description: entry.description || '',
        entry_type: entry.entry_type || 'class',
        start_time: format(startTime, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endTime, "yyyy-MM-dd'T'HH:mm"),
        location: entry.location || '',
        color: entry.color || '#4f46e5',
        is_recurring: entry.is_recurring || false,
        recurrence_pattern: entry.recurrence_pattern || 'weekly',
        days_of_week: entry.days_of_week || [startTime.getDay() === 0 ? 6 : startTime.getDay() - 1]
      });
    } else {
      // Default values for new entry
      const now = new Date();
      setFormData({
        title: '',
        description: '',
        entry_type: 'class',
        start_time: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(now.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
        location: '',
        color: '#4f46e5',
        is_recurring: false,
        recurrence_pattern: 'weekly',
        days_of_week: [now.getDay() === 0 ? 6 : now.getDay() - 1] as never[]
      });
    }
  }, [entry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    let newDays = [...formData.days_of_week];

    if (checked && !newDays.includes(day as never)) {
      newDays.push(day as never);
    } else if (!checked && newDays.includes(day as never)) {
      newDays = newDays.filter(d => d !== day);
    }

    setFormData(prev => ({ ...prev, days_of_week: newDays }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {entry ? t('editScheduleEntry') : t('newScheduleEntry')}
          </DialogTitle>
          <DialogDescription>
            {t('scheduleEntryDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">{t('title')}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Entry type */}
            <div>
              <Label htmlFor="entry_type">{t('type')}</Label>
              <Select
                name="entry_type"
                value={formData.entry_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, entry_type: value }))}
              >
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
                  <SelectItem value="office_hours">
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

            {/* Date and time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">{t('startTime')}</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">{t('endTime')}</Label>
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
            <div>
              <Label htmlFor="location">{t('location')}</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={t('locationPlaceholder')}
              />
            </div>

            {/* Color picker */}
            <div>
              <Label htmlFor="color">{t('color')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
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
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Recurring options */}
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => handleCheckboxChange('is_recurring', checked as boolean)}
                />
                <Label htmlFor="is_recurring">{t('makeRecurring')}</Label>
              </div>

              {formData.is_recurring && (
                <div className="pl-6 pt-2 space-y-4">
                  <div>
                    <Label>{t('recurringPattern')}</Label>
                    <Select
                      value={formData.recurrence_pattern}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}
                    >
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
                          <Checkbox
                            id={`day-${i}`}
                            checked={formData.days_of_week.includes(i as never)}
                            onCheckedChange={(checked) => handleDayOfWeekChange(i, checked as boolean)}
                          />
                          <Label htmlFor={`day-${i}`} className="text-sm">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e as any)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {entry && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(entry)}
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
                onClick={onClose}
                className="mr-2"
              >
                {t('cancel')}
              </Button>
              <Button type="submit">
                {entry ? t('update') : t('create')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, entry, t, getLocale }: any) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('confirmDelete')}</DialogTitle>
          <DialogDescription>
            {t('deleteEntryConfirm')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium">{entry?.title}</p>
          {entry && (
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(entry.start_time), "EEEE, MMMM d, yyyy h:mm a", { locale: getLocale() })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Continuing from where we left off:

// Main Schedule Component
const ProfessorSchedulePage = () => {
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
        const response: any = await ProfessorService.getSchedule({
          start_date: startDate,
          end_date: endDate,
          view_mode: viewMode
        });

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

      setSelectedEntry(null);
      setIsEntryDialogOpen(true);
    };

    // Handle edit entry
    const handleEditEntry = (entry: any) => {
      setSelectedEntry(entry);
      setIsEntryDialogOpen(true);
    };

    // Handle save entry
    const handleSaveEntry = async (formData: any) => {
      try {
        if (selectedEntry) {
          // Update existing entry
          await ProfessorService.updateEntry(selectedEntry.id, {
            ...formData
          });
          toast.success(t("entryUpdated"));
        } else {
          // Create new entry
          await ProfessorService.createEntry({
            ...formData
          });
          toast.success(t("entryCreated"));
        }

        setIsEntryDialogOpen(false);
        loadScheduleData();
      } catch (error) {
        console.error("Error saving entry:", error);
        toast.error(t("errorSavingEntry"));
      }
    };

    // Handle delete entry
    const handleDeleteEntry = (entry: any) => {
      setSelectedEntry(entry);
      setIsEntryDialogOpen(false);
      setIsDeleteDialogOpen(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
      if (!selectedEntry) return;

      try {
        await ProfessorService.deleteEntry(selectedEntry.id);
        toast.success(t("entryDeletedSuccess"));
        setIsDeleteDialogOpen(false);
        setSelectedEntry(null);
        loadScheduleData();
      } catch (error) {
        console.error("Error deleting entry:", error);
        toast.error(t("errorDeletingEntry"));
      }
    };

    // Effect to load schedule data when week or view mode changes
    useEffect(() => {
      loadScheduleData();
    }, [weekStartDate, weekEndDate, viewMode]);

    return (
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              {t('schedule')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('manageProfessorSchedule')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEntryDialogOpen(true)}
              className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}
            >
              <Plus className="h-4 w-4" />
              <span>{t('newEntry')}</span>
            </Button>
          </div>
        </div>

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
                      {entries.map((entry: any, entryIndex: number) => {
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

                            return (
                              <div
                                key={entryIndex}
                                className={cn(
                                  "absolute left-0 right-0 m-1 p-1 rounded border text-xs overflow-hidden z-10 cursor-pointer transition-all hover:shadow-sm",
                                  entry.is_cancelled && "opacity-50 line-through",
                                  entry.is_completed && "ring-1 ring-green-500 dark:ring-green-400"
                                )}
                                style={{
                                  backgroundColor: entry.color ? `${entry.color}15` : '#4f46e515',
                                  borderColor: entry.color ? `${entry.color}50` : '#4f46e550',
                                  color: entry.color || '#4f46e5',
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
        </div>

        {/* Entry Dialog */}
        <ScheduleEntryDialog
          isOpen={isEntryDialogOpen}
          onClose={() => setIsEntryDialogOpen(false)}
          entry={selectedEntry}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          t={t}
          isRTL={isRTL}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          entry={selectedEntry}
          t={t}
          getLocale={getLocale}
        />
      </div>
    );
  };

  export default ProfessorSchedulePage;
