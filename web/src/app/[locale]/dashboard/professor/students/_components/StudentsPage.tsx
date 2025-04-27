"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  FileDown,
  Send,
  GraduationCap,
  Clock,
  BookOpen,
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  MoreHorizontal,
  FileText,
  UserCog,
  Timer,
  AlertCircle,
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from "sonner";

import { ProfessorStudentService, StudentProfile, FilterParams, StudentNotificationParams, AssignHomeworkParams, StudentScheduleEntryParams } from '@/services/ProfessorStudentService';
import { ProfessorService } from '@/services/ProfessorService';

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();

  // State for students and pagination
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // State for filters
  const [filters, setFilters] = useState<FilterParams>({
    searchTerm: '',
    courseId: undefined,
    educationLevel: undefined,
    academicTrack: undefined,
    isActive: undefined,
  });

  // Modals state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Available options state
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [academicTracks, setAcademicTracks] = useState<string[]>([]);
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([]);

  // Additional form states
  const [notificationForm, setNotificationForm] = useState<StudentNotificationParams>({
    studentIds: [],
    title: '',
    content: '',
    priority: 'normal',
  });

  const [homeworkForm, setHomeworkForm] = useState<AssignHomeworkParams>({
    studentIds: [],
    courseId: 0,
    title: '',
    description: '',
    dueDate: new Date().toISOString(),
    pointsPossible: 10,
  });

  const [scheduleForm, setScheduleForm] = useState<StudentScheduleEntryParams>({
    studentIds: [],
    title: '',
    description: '',
    entryType: 'study',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    isRecurring: false,
    courseId: undefined,
  });

  // Date pickers
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(
    new Date(Date.now() + 3600000)
  );

  // Selection helpers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(student => student.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectStudent = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
      setSelectAll(false);
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
      if (selectedStudentIds.length + 1 === students.length) {
        setSelectAll(true);
      }
    }
  };

  // Data loading
  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await ProfessorStudentService.getStudents({
        ...filters,
        page,
        limit
      });
      setStudents(data.students);
      setTotalStudents(data.total);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error(t('errorLoadingStudents') || 'Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      // Load education levels
      const levels = await ProfessorStudentService.getEducationLevels();
      setEducationLevels(levels);

      // Load academic tracks
      const tracks = await ProfessorStudentService.getAcademicTracks();
      setAcademicTracks(tracks);

      // Load courses
      const coursesData = await ProfessorService.getCourses();
      setCourses(coursesData.courses.map(course => ({
        id: course.id,
        title: course.title
      })));
    } catch (error) {
      console.error('Error loading options:', error);
      toast.error(t('errorLoadingFilters') || 'Error loading filter options');
    }
  };

  // Handle modal actions
  const openNotificationModal = () => {
    if (selectedStudentIds.length === 0) {
      toast.warning(t('selectStudentsFirst') || 'Please select students first');
      return;
    }
    setNotificationForm({
      ...notificationForm,
      studentIds: selectedStudentIds,
    });
    setShowNotificationModal(true);
  };

  const openHomeworkModal = () => {
    if (selectedStudentIds.length === 0) {
      toast.warning(t('selectStudentsFirst') || 'Please select students first');
      return;
    }
    setHomeworkForm({
      ...homeworkForm,
      studentIds: selectedStudentIds,
    });
    setShowHomeworkModal(true);
  };

  const openScheduleModal = () => {
    if (selectedStudentIds.length === 0) {
      toast.warning(t('selectStudentsFirst') || 'Please select students first');
      return;
    }
    setScheduleForm({
      ...scheduleForm,
      studentIds: selectedStudentIds,
    });
    setShowScheduleModal(true);
  };

  const openDetailsModal = (student: StudentProfile) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Handle form submissions
  const handleSendNotification = async () => {
    try {
      const result = await ProfessorStudentService.sendNotification(notificationForm);
      toast.success(
        t('notificationSentSuccess', { count: result.count }) ||
        `Notification sent to ${result.count} students successfully`
      );
      setShowNotificationModal(false);
      // Reset form
      setNotificationForm({
        studentIds: [],
        title: '',
        content: '',
        priority: 'normal',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(t('errorSendingNotification') || 'Error sending notification');
    }
  };

  const handleAssignHomework = async () => {
    try {
      // Ensure due date is set
      homeworkForm.dueDate = selectedDueDate?.toISOString() || new Date().toISOString();

      const result = await ProfessorStudentService.assignHomework(homeworkForm);
      toast.success(
        t('homeworkAssignedSuccess') ||
        'Homework assigned successfully'
      );
      setShowHomeworkModal(false);
      // Reset form
      setHomeworkForm({
        studentIds: [],
        courseId: 0,
        title: '',
        description: '',
        dueDate: new Date().toISOString(),
        pointsPossible: 10,
      });
    } catch (error) {
      console.error('Error assigning homework:', error);
      toast.error(t('errorAssigningHomework') || 'Error assigning homework');
    }
  };

  const handleAddScheduleEntry = async () => {
    try {
      // Ensure dates are set
      scheduleForm.startTime = selectedStartDate?.toISOString() || new Date().toISOString();
      scheduleForm.endTime = selectedEndDate?.toISOString() || new Date(Date.now() + 3600000).toISOString();

      const result = await ProfessorStudentService.addScheduleEntry(scheduleForm);
      toast.success(
        t('scheduleEntryAddedSuccess') ||
        'Schedule entry added successfully'
      );
      setShowScheduleModal(false);
      // Reset form
      setScheduleForm({
        studentIds: [],
        title: '',
        description: '',
        entryType: 'study',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        isRecurring: false,
        courseId: undefined,
      });
    } catch (error) {
      console.error('Error adding schedule entry:', error);
      toast.error(t('errorAddingScheduleEntry') || 'Error adding schedule entry');
    }
  };

  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      const ids = selectedStudentIds.length > 0 ? selectedStudentIds : students.map(s => s.id);
      const exportUrl = await ProfessorStudentService.exportStudentData(ids, format);

      // Create a temporary link and click it to download
      const a = document.createElement('a');
      a.href = exportUrl;
      a.download = `students-export-${new Date().toISOString().slice(0,10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(
        t('dataExportedSuccess', { format: format.toUpperCase() }) ||
        `Data exported as ${format.toUpperCase()} successfully`
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('errorExportingData') || 'Error exporting data');
    }
  };

  // Handle filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      searchTerm: e.target.value
    });
  };

  const applyFilters = () => {
    setPage(1); // Reset to first page when filtering
    loadStudents();
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      courseId: undefined,
      educationLevel: undefined,
      academicTrack: undefined,
      isActive: undefined,
    });
    setPage(1);
  };

  // Initial data loading
  useEffect(() => {
    loadStudents();
    loadOptions();
  }, [page, limit]); // Reload when page or limit changes

  // Performance indicators
  const getPerformanceColor = (value: number | null | undefined) => {
    if (value === undefined || value === null) return 'bg-gray-200';
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getAttendanceLabel = (value: number | null | undefined) => {
    if (value === undefined || value === null) return t('notAvailable') || 'N/A';
    if (value >= 90) return t('excellent') || 'Excellent';
    if (value >= 75) return t('good') || 'Good';
    if (value >= 60) return t('adequate') || 'Adequate';
    return t('poor') || 'Poor';
  };

  // Format education level for display
  const formatEducationLevel = (level: string) => {
    if (!level) return '';

    if (level.startsWith('primary_')) {
      const grade = level.split('_')[1];
      return `${t('primary')} ${grade}`;
    }

    if (level.startsWith('college_')) {
      const grade = level.split('_')[1];
      return `${t('college')} ${grade}`;
    }

    if (level === 'tronc_commun') return t('troncCommun');
    if (level === 'bac_1') return t('bac1');
    if (level === 'bac_2') return t('bac2');
    if (level === 'university') return t('university');

    return level;
  };

  // Format academic track for display
  const formatAcademicTrack = (track: string | undefined) => {
    if (!track) return t('notSpecified') || 'Not specified';

    if (track === 'sciences_math_a') return "Sciences Math A";
    if (track === 'sciences_math_b') return "Sciences Math B";
    if (track === 'sciences_physiques') return "Sciences Physiques";
    if (track === 'svt') return "SVT";
    if (track === 'lettres') return "Lettres";
    if (track === 'economie') return "Économie";
    if (track === 'arts') return "Arts";

    return track;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('studentsManagement') || 'Students Management'}</h1>
          <p className="text-muted-foreground">
            {t('studentsManagementDesc') || 'View, manage, and track your students'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handleExportData('csv')}>
            <FileDown className="w-4 h-4 mr-2" />
            {t('exportCSV') || 'Export CSV'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <UserCog className="w-4 h-4 mr-2" />
                {t('actions') || 'Actions'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('bulkActions') || 'Bulk Actions'}</DropdownMenuLabel>
              <DropdownMenuItem onClick={openNotificationModal}>
                <Bell className="w-4 h-4 mr-2" />
                {t('sendNotification') || 'Send Notification'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openHomeworkModal}>
                <BookOpen className="w-4 h-4 mr-2" />
                {t('assignHomework') || 'Assign Homework'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openScheduleModal}>
                <Calendar className="w-4 h-4 mr-2" />
                {t('scheduleEvent') || 'Schedule Event'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t('export') || 'Export'}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExportData('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                {t('exportCSV') || 'Export as CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                {t('exportPDF') || 'Export as PDF'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            {t('filterStudents') || 'Filter Students'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>{t('search') || 'Search'}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchByNameOrId') || 'Search by name or ID...'}
                  className="pl-8"
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('course') || 'Course'}</Label>
              <Select
                value={filters.courseId?.toString() || ''}
                onValueChange={(value) => setFilters({...filters, courseId: value ? parseInt(value) : undefined})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allCourses') || 'All Courses'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aa">{t('allCourses') || 'All Courses'}</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('educationLevel') || 'Education Level'}</Label>
              <Select
                value={filters.educationLevel || ''}
                onValueChange={(value) => setFilters({...filters, educationLevel: value || undefined})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allLevels') || 'All Levels'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aa">{t('allLevels') || 'All Levels'}</SelectItem>
                  {educationLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {formatEducationLevel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('academicTrack') || 'Academic Track'}</Label>
              <Select
                value={filters.academicTrack || ''}
                onValueChange={(value) => setFilters({...filters, academicTrack: value || undefined})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allTracks') || 'All Tracks'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aa">{t('allTracks') || 'All Tracks'}</SelectItem>
                  {academicTracks.map(track => (
                    <SelectItem key={track} value={track}>
                      {formatAcademicTrack(track)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2">
              <Select
                value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
                onValueChange={(value) => {
                  const isActive = value === '' ? undefined : value === 'true';
                  setFilters({...filters, isActive});
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('studentStatus') || 'Student Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aa">{t('allStudents') || 'All Students'}</SelectItem>
                  <SelectItem value="true">{t('activeStudents') || 'Active Students'}</SelectItem>
                  <SelectItem value="false">{t('inactiveStudents') || 'Inactive Students'}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(parseInt(value))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('rowsPerPage') || 'Rows per page'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 {t('perPage') || 'per page'}</SelectItem>
                  <SelectItem value="20">20 {t('perPage') || 'per page'}</SelectItem>
                  <SelectItem value="50">50 {t('perPage') || 'per page'}</SelectItem>
                  <SelectItem value="100">100 {t('perPage') || 'per page'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={resetFilters}>
                {t('resetFilters') || 'Reset Filters'}
              </Button>
              <Button onClick={applyFilters}>
                {t('applyFilters') || 'Apply Filters'}
              </Button>
            </div>
            </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all students"
                  />
                </TableHead>
                <TableHead>{t('student') || 'Student'}</TableHead>
                <TableHead>{t('educationLevel') || 'Education Level'}</TableHead>
                <TableHead>{t('academicTrack') || 'Academic Track'}</TableHead>
                <TableHead className="text-center">{t('attendance') || 'Attendance'}</TableHead>
                <TableHead className="text-center">{t('performance') || 'Performance'}</TableHead>
                <TableHead className="text-center">{t('enrolledCourses') || 'Enrolled Courses'}</TableHead>
                <TableHead className="text-center">{t('status') || 'Status'}</TableHead>
                <TableHead className="text-right">{t('actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                      <p>{t('loadingStudents') || 'Loading students...'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-muted-foreground mb-4" />
                      <p>{t('noStudentsFound') || 'No students found'}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('tryDifferentFilters') || 'Try different filters or add students to your courses'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className={selectedStudentIds.includes(student.id) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudentIds.includes(student.id)}
                        onCheckedChange={() => toggleSelectStudent(student.id)}
                        aria-label={`Select ${student.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          {student.avatar ? (
                            <AvatarImage src={student.avatar} alt={student.name} />
                          ) : null}
                          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {student.student_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatEducationLevel(student.education_level)}</TableCell>
                    <TableCell>{formatAcademicTrack(student.academic_track)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center">
                        <div className="w-full max-w-[100px] h-2 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full ${getPerformanceColor(student.attendance)}`}
                            style={{ width: `${student.attendance || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{student.attendance?.toFixed(1)}% - {getAttendanceLabel(student.attendance)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center">
                        {student.performance !== null && student.performance !== undefined ? (
                          <>
                            <div className="w-full max-w-[100px] h-2 rounded-full overflow-hidden mb-1">
                              <div
                                className={getPerformanceColor(student.performance)}
                                style={{ width: `${(student.performance / 100) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{student.performance?.toFixed(1)}/100</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('notAvailable') || 'N/A'}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {student.courses?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.is_active ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('active') || 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('inactive') || 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('openMenu') || 'Open menu'}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailsModal(student)}>
                            <UserCog className="w-4 h-4 mr-2" />
                            {t('viewDetails') || 'View Details'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudentIds([student.id]);
                            openNotificationModal();
                          }}>
                            <Bell className="w-4 h-4 mr-2" />
                            {t('sendNotification') || 'Send Notification'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudentIds([student.id]);
                            openHomeworkModal();
                          }}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            {t('assignHomework') || 'Assign Homework'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStudentIds([student.id]);
                            openScheduleModal();
                          }}>
                            <Calendar className="w-4 h-4 mr-2" />
                            {t('scheduleEvent') || 'Schedule Event'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/${locale}/dashboard/professor/students/${student.id}`)}
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            {t('viewProgress') || 'View Progress'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t bg-slate-50 px-6 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {t('showingStudents', {
                from: Math.min((page - 1) * limit + 1, totalStudents),
                to: Math.min(page * limit, totalStudents),
                total: totalStudents
              }) || `Showing ${Math.min((page - 1) * limit + 1, totalStudents)}-${Math.min(page * limit, totalStudents)} of ${totalStudents} students`}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page <= 1}
                >
                  {t('previous') || 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page < Math.ceil(totalStudents / limit) ? page + 1 : page)}
                  disabled={page >= Math.ceil(totalStudents / limit)}
                >
                  {t('next') || 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Send Notification Modal */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                {t('sendNotification') || 'Send Notification'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('sendNotificationDesc', {count: selectedStudentIds.length}) ||
                `Send a notification to ${selectedStudentIds.length} selected student(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title">{t('notificationTitle') || 'Title'}</Label>
              <Input
                id="notification-title"
                placeholder={t('notificationTitlePlaceholder') || 'Enter notification title'}
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-content">{t('notificationContent') || 'Content'}</Label>
              <Textarea
                id="notification-content"
                placeholder={t('notificationContentPlaceholder') || 'Enter notification content'}
                value={notificationForm.content}
                onChange={(e) => setNotificationForm({...notificationForm, content: e.target.value})}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-priority">{t('priority') || 'Priority'}</Label>
              <Select
                value={notificationForm.priority || 'normal'}
                onValueChange={(value) => setNotificationForm({...notificationForm, priority: value as 'low' | 'normal' | 'high' | 'urgent'})}
              >
                <SelectTrigger id="notification-priority">
                  <SelectValue placeholder={t('selectPriority') || 'Select priority'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('low') || 'Low'}</SelectItem>
                  <SelectItem value="normal">{t('normal') || 'Normal'}</SelectItem>
                  <SelectItem value="high">{t('high') || 'High'}</SelectItem>
                  <SelectItem value="urgent">{t('urgent') || 'Urgent'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationModal(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={!notificationForm.title || !notificationForm.content}
            >
              <Send className="w-4 h-4 mr-2" />
              {t('sendNotification') || 'Send Notification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Homework Modal */}
      <Dialog open={showHomeworkModal} onOpenChange={setShowHomeworkModal}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                {t('assignHomework') || 'Assign Homework'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('assignHomeworkDesc', {count: selectedStudentIds.length}) ||
                `Assign homework to ${selectedStudentIds.length} selected student(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homework-course">{t('selectCourse') || 'Select Course'}</Label>
                <Select
                  value={homeworkForm.courseId ? homeworkForm.courseId.toString() : ''}
                  onValueChange={(value) => setHomeworkForm({...homeworkForm, courseId: parseInt(value)})}
                >
                  <SelectTrigger id="homework-course">
                    <SelectValue placeholder={t('selectCourse') || 'Select course'} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="homework-due-date">{t('dueDate') || 'Due Date'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="homework-due-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDueDate ? (
                        format(selectedDueDate, 'PPP', { locale: fr })
                      ) : (
                        <span>{t('selectDate') || 'Select date'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDueDate}
                      onSelect={setSelectedDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-title">{t('homeworkTitle') || 'Title'}</Label>
              <Input
                id="homework-title"
                placeholder={t('homeworkTitlePlaceholder') || 'Enter homework title'}
                value={homeworkForm.title}
                onChange={(e) => setHomeworkForm({...homeworkForm, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-description">{t('description') || 'Description'}</Label>
              <Textarea
                id="homework-description"
                placeholder={t('homeworkDescPlaceholder') || 'Enter homework description and instructions'}
                value={homeworkForm.description}
                onChange={(e) => setHomeworkForm({...homeworkForm, description: e.target.value})}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homework-points">{t('possiblePoints') || 'Possible Points'}</Label>
              <Input
                id="homework-points"
                type="number"
                min="0"
                step="1"
                value={homeworkForm.pointsPossible}
                onChange={(e) => setHomeworkForm({...homeworkForm, pointsPossible: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHomeworkModal(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleAssignHomework}
              disabled={!homeworkForm.title || !homeworkForm.description || !homeworkForm.courseId || !selectedDueDate}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {t('assignHomework') || 'Assign Homework'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Event Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {t('scheduleEvent') || 'Schedule Event'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('scheduleEventDesc', {count: selectedStudentIds.length}) ||
                `Add a schedule entry for ${selectedStudentIds.length} selected student(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-event-type">{t('eventType') || 'Event Type'}</Label>
                <Select
                  value={scheduleForm.entryType}
                  onValueChange={(value) => setScheduleForm({...scheduleForm, entryType: value})}
                >
                  <SelectTrigger id="schedule-event-type">
                    <SelectValue placeholder={t('selectEventType') || 'Select event type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">{t('studySession') || 'Study Session'}</SelectItem>
                    <SelectItem value="homework">{t('homework') || 'Homework'}</SelectItem>
                    <SelectItem value="exam">{t('exam') || 'Exam'}</SelectItem>
                    <SelectItem value="class">{t('class') || 'Class'}</SelectItem>
                    <SelectItem value="tutoring">{t('tutoring') || 'Tutoring'}</SelectItem>
                    <SelectItem value="meeting">{t('meeting') || 'Meeting'}</SelectItem>
                    <SelectItem value="custom">{t('custom') || 'Custom'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-course">{t('relatedCourse') || 'Related Course (Optional)'}</Label>
                <Select
                  value={scheduleForm.courseId?.toString() || ''}
                  onValueChange={(value) => setScheduleForm({...scheduleForm, courseId: value ? parseInt(value) : undefined})}
                >
                  <SelectTrigger id="schedule-course">
                    <SelectValue placeholder={t('selectCourse') || 'Select course'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aa">{t('noCourse') || 'No course'}</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-title">{t('eventTitle') || 'Event Title'}</Label>
              <Input
                id="schedule-title"
                placeholder={t('eventTitlePlaceholder') || 'Enter event title'}
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-description">{t('description') || 'Description (Optional)'}</Label>
              <Textarea
                id="schedule-description"
                placeholder={t('eventDescPlaceholder') || 'Enter event description'}
                value={scheduleForm.description || ''}
                onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-start-date">{t('startDateTime') || 'Start Date & Time'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="schedule-start-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {selectedStartDate ? (
                        format(selectedStartDate, 'PPP HH:mm', { locale: fr })
                      ) : (
                        <span>{t('selectDateTime') || 'Select date & time'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <CalendarComponent
                        mode="single"
                        selected={selectedStartDate}
                        onSelect={setSelectedStartDate}
                        initialFocus
                      />
                      <div className="mt-3">
                        <Label>{t('time') || 'Time'}</Label>
                        <Input
                          type="time"
                          className="mt-1"
                          value={selectedStartDate ? format(selectedStartDate, 'HH:mm') : ''}
                          onChange={(e) => {
                            if (selectedStartDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = new Date(selectedStartDate);
                              newDate.setHours(hours, minutes);
                              setSelectedStartDate(newDate);
                              setScheduleForm({...scheduleForm, startTime: newDate.toISOString()});
                            }
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-end-date">{t('endDateTime') || 'End Date & Time'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="schedule-end-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {selectedEndDate ? (
                        format(selectedEndDate, 'PPP HH:mm', { locale: fr })
                      ) : (
                        <span>{t('selectDateTime') || 'Select date & time'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <CalendarComponent
                        mode="single"
                        selected={selectedEndDate}
                        onSelect={setSelectedEndDate}
                        initialFocus
                      />
                      <div className="mt-3">
                        <Label>{t('time') || 'Time'}</Label>
                        <Input
                          type="time"
                          className="mt-1"
                          value={selectedEndDate ? format(selectedEndDate, 'HH:mm') : ''}
                          onChange={(e) => {
                            if (selectedEndDate && e.target.value) {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = new Date(selectedEndDate);
                              newDate.setHours(hours, minutes);
                              setSelectedEndDate(newDate);
                              setScheduleForm({...scheduleForm, endTime: newDate.toISOString()});
                            }
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-recurring"
                checked={scheduleForm.isRecurring}
                onCheckedChange={(checked) =>
                  setScheduleForm({...scheduleForm, isRecurring: checked as boolean})
                }
              />
              <Label htmlFor="is-recurring">{t('isRecurring') || 'This is a recurring event'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleAddScheduleEntry}
              disabled={!scheduleForm.title || !selectedStartDate || !selectedEndDate}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('scheduleEvent') || 'Schedule Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Details Modal */}
      {selectedStudent && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  {t('studentDetails') || 'Student Details'}
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              {/* Student info */}
              <div className="col-span-1 space-y-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="h-24 w-24">
                    {selectedStudent.avatar ? (
                      <AvatarImage src={selectedStudent.avatar} alt={selectedStudent.name} />
                    ) : null}
                    <AvatarFallback className="text-2xl">{getInitials(selectedStudent.name)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                  <Badge variant={selectedStudent.is_active ? "success" : "destructive"} className="mt-1">
                    {selectedStudent.is_active ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('studentId') || 'Student ID'}</span>
                    <span className="font-medium">{selectedStudent.student_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('educationLevel') || 'Education Level'}</span>
                    <span className="font-medium">{formatEducationLevel(selectedStudent.education_level)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('academicTrack') || 'Academic Track'}</span>
                    <span className="font-medium">{formatAcademicTrack(selectedStudent.academic_track)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('enrollmentDate') || 'Enrollment Date'}</span>
                    <span className="font-medium">
                      {new Date(selectedStudent.enrollment_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {selectedStudent.graduation_year && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('graduationYear') || 'Graduation Year'}</span>
                      <span className="font-medium">{selectedStudent.graduation_year}</span>
                    </div>
                  )}
                  {selectedStudent.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('email') || 'Email'}</span>
                      <span className="font-medium">{selectedStudent.email}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">{t('performance') || 'Performance'}</h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('attendance') || 'Attendance'}</span>
                        <span className="font-medium">{selectedStudent.attendance?.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedStudent.attendance} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('averageGrade') || 'Average Grade'}</span>
                        <span className="font-medium">
                          {selectedStudent.performance !== null && selectedStudent.performance !== undefined
                            ? `${selectedStudent.performance.toFixed(1)}/100`
                            : t('notAvailable') || 'N/A'}
                        </span>
                      </div>
                      {selectedStudent.performance !== null && selectedStudent.performance !== undefined && (
                        <Progress value={selectedStudent.performance} className="h-2" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses and actions */}
              <div className="col-span-2">
                <Tabs defaultValue="courses">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="courses">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t('courses') || 'Courses'}
                    </TabsTrigger>
                    <TabsTrigger value="actions">
                      <Timer className="w-4 h-4 mr-2" />
                      {t('recentActivity') || 'Recent Activity'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="courses" className="space-y-4 mt-4">
                    <h4 className="text-sm font-semibold">{t('enrolledCourses') || 'Enrolled Courses'}</h4>
                    {selectedStudent.courses && selectedStudent.courses.length > 0 ? (
                      <div className="space-y-3">
                        {selectedStudent.courses.map(course => (
                          <Card key={course.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="flex items-center p-4">
                                <div className="flex-1">
                                  <h5 className="font-medium">{course.title}</h5>
                                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <Badge variant="outline" className="mr-2">
                                      {course.status}
                                    </Badge>
                                    {course.grade !== null && course.grade !== undefined && (
                                      <span className="flex items-center mr-2">
                                        <Activity className="w-3 h-3 mr-1" />
                                        {course.grade.toFixed(1)}/100
                                      </span>
                                    )}
                                    {course.attendance_percentage !== null && course.attendance_percentage !== undefined && (
                                      <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {course.attendance_percentage.toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="w-32">
                                  <div className="text-xs text-muted-foreground mb-1 text-right">
                                    {t('progress') || 'Progress'}: {course.progress}%
                                  </div>
                                  <Progress value={course.progress} className="h-2" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-md p-8 text-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <h5 className="font-medium mb-1">{t('noCoursesFound') || 'No courses found'}</h5>
                        <p className="text-sm text-muted-foreground">
                          {t('studentNotEnrolled') || 'This student is not enrolled in any courses.'}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4 mt-4">
                    <h4 className="text-sm font-semibold">{t('recentActivity') || 'Recent Activity'}</h4>
                    <div className="border rounded-md p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Homework Submission</p>
                            <p className="text-xs text-muted-foreground">Physics Assignment #3</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">Yesterday</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Attendance Marked</p>
                            <p className="text-xs text-muted-foreground">Mathematics Class</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-amber-100 p-2 rounded-full">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">Grade Updated</p>
                            <p className="text-xs text-muted-foreground">Chemistry Quiz #2: 85/100</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">3 days ago</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold">{t('quickActions') || 'Quick Actions'}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      setSelectedStudentIds([selectedStudent.id]);
                      setShowDetailsModal(false);
                      setTimeout(() => openNotificationModal(), 100);
                    }}>
                      <Bell className="w-4 h-4 mr-2" />
                      {t('sendNotification') || 'Send Notification'}
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      setSelectedStudentIds([selectedStudent.id]);
                      setShowDetailsModal(false);
                      setTimeout(() => openHomeworkModal(), 100);
                    }}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t('assignHomework') || 'Assign Homework'}
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={() => {
                      setSelectedStudentIds([selectedStudent.id]);
                      setShowDetailsModal(false);
                      setTimeout(() => openScheduleModal(), 100);
                    }}>
                      <Calendar className="w-4 h-4 mr-2" />
                      {t('scheduleEvent') || 'Schedule Event'}
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start" onClick={() =>
                      router.push(`/${locale}/dashboard/professor/students/${selectedStudent.id}`)
                    }>
                      <Activity className="w-4 h-4 mr-2" />
                      {t('viewDetailedProgress') || 'View Detailed Progress'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentsPage;
