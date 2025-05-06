"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  PlusCircle,
  FileDown,
  Send,
  Clock,
  Calendar,
  CheckSquare,
  XSquare,
  ArrowUpDown,
  MoreHorizontal,
  FileText,
  Copy,
  Trash2,
  Edit,
  Eye,
  BookOpen,
  Gauge,
  Layers,
  ListChecks,
  BarChart,
  AlertCircle,
  ExternalLink,
  Layout,
  MessagesSquare
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import { ProfessorService } from '@/services/ProfessorService';
import {
  professorAssignmentService,
  Assignment,
  CreateAssignmentRequest,
  GradingCriteria,
  QuizQuestion,
  CreateQuizRequest,
  FilterAssignmentsParams
} from '@/services/ProfessorAssignmentService';
import fileService from '@/services/FileService';

// Assignment type icons
const AssignmentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'homework':
      return <BookOpen className="w-4 h-4" />;
    case 'quiz':
      return <ListChecks className="w-4 h-4" />;
    case 'exam':
      return <Gauge className="w-4 h-4" />;
    case 'project':
      return <Layout className="w-4 h-4" />;
    case 'lab':
      return <Layers className="w-4 h-4" />;
    case 'discussion':
      return <MessagesSquare className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-700">
          {status}
        </Badge>
      );
    case 'published':
      return (
        <Badge className="bg-green-100 text-green-800">
          {status}
        </Badge>
      );
    case 'closed':
      return (
        <Badge className="bg-amber-100 text-amber-800">
          {status}
        </Badge>
      );
    case 'grading':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          {status}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const ProfessorAssignmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();

  // State for assignments and pagination
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // State for filters
  const [filters, setFilters] = useState<FilterAssignmentsParams>({
    searchTerm: '',
    courseId: undefined,
    assignmentType: undefined,
    status: undefined,
    sortBy: 'dueDate',
    sortOrder: 'desc'
  });

  // State for courses
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string, courseIds: number[] }>>([]);
  const [selectedCourseClasses, setSelectedCourseClasses] = useState<number[]>([]);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form states
  const [assignmentForm, setAssignmentForm] = useState<CreateAssignmentRequest>({
    title: '',
    description: '',
    assignmentType: 'homework',
    courseId: 0,
    dueDate: new Date().toISOString(),
    pointsPossible: 100,
    instructions: '',
    classIds: []
  });

  // Quiz form states
  const [quizForm, setQuizForm] = useState<CreateQuizRequest>({
    title: '',
    description: '',
    courseId: 0,
    dueDate: new Date().toISOString(),
    pointsPossible: 100,
    instructions: '',
    questions: [{ question: '', questionType: 'multiple_choice', options: ['', ''], correctAnswer: '', points: 10 }],
    timeLimit: 30,
    allowMultipleAttempts: false,
    maxAttempts: 1,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    passingScore: 60,
    classIds: []
  });

  // Grading criteria state
  const [gradingCriteria, setGradingCriteria] = useState<Omit<GradingCriteria, 'id'>[]>([
    { name: 'Completion', description: 'Assignment is fully completed', points: 40 },
    { name: 'Accuracy', description: 'Work is accurate and correct', points: 40 },
    { name: 'Presentation', description: 'Work is well-presented and organized', points: 20 }
  ]);

  // Date picker state
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(new Date());

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);

  // AI generation dialog state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingWithAI, setGeneratingWithAI] = useState(false);

  // Load assignments and options
  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await professorAssignmentService.getAssignments({
        ...filters,
        page,
        limit
      });
      setAssignments(data.assignments);
      setTotalAssignments(data.total);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error(t('errorLoadingAssignments') || 'Error loading assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await ProfessorService.getCourses();
      setCourses(response.courses.map(course => ({
        id: course.id,
        title: course.title
      })));
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error(t('errorLoadingCourses') || 'Error loading courses');
    }
  };

  const loadClasses = async () => {
    try {
      const response = await professorAssignmentService.getTeachingClasses();
      console.log(response);
      setClasses(response.classes.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        courseIds: classItem.courseIds || []
      })));
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error(t('errorLoadingClasses') || 'Error loading classes');
    }
  };

  // Handle course select in form
  const handleCourseSelect = (courseId: string) => {
    const parsedId = parseInt(courseId);

    // Update the form
    setAssignmentForm({
      ...assignmentForm,
      courseId: parsedId
    });

    // Find classes associated with this course
    const associatedClasses = classes.filter(
      cls => cls.courseIds.includes(parsedId)
    ).map(cls => cls.id);

    setSelectedCourseClasses(associatedClasses);

    // If auto-select is desired:
    setAssignmentForm(prev => ({
      ...prev,
      courseId: parsedId,
      classIds: associatedClasses
    }));
  };

  // For quiz form
  const handleQuizCourseSelect = (courseId: string) => {
    const parsedId = parseInt(courseId);

    // Update the form
    setQuizForm({
      ...quizForm,
      courseId: parsedId
    });

    // Find classes associated with this course
    const associatedClasses = classes.filter(
      cls => cls.courseIds.includes(parsedId)
    ).map(cls => cls.id);

    setSelectedCourseClasses(associatedClasses);

    // If auto-select is desired:
    setQuizForm(prev => ({
      ...prev,
      courseId: parsedId,
      classIds: associatedClasses
    }));
  };

  // Initial data loading
  useEffect(() => {
    loadAssignments();
  }, [page, limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    loadCourses();
    loadClasses();
  }, []);

  // Form handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      searchTerm: e.target.value
    });
  };

  const applyFilters = () => {
    setPage(1); // Reset to first page when filtering
    loadAssignments();
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      courseId: undefined,
      assignmentType: undefined,
      status: undefined,
      sortBy: 'dueDate',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  // Open create dialog with reset form
  const openCreateDialog = () => {
    setAssignmentForm({
      title: '',
      description: '',
      assignmentType: 'homework',
      courseId: courses.length > 0 ? courses[0].id : 0,
      dueDate: new Date().toISOString(),
      pointsPossible: 100,
      instructions: '',
      classIds: []
    });
    setGradingCriteria([
      { name: 'Completion', description: 'Assignment is fully completed', points: 40 },
      { name: 'Accuracy', description: 'Work is accurate and correct', points: 40 },
      { name: 'Presentation', description: 'Work is well-presented and organized', points: 20 }
    ]);
    setSelectedDueDate(new Date());
    setSelectedFiles([]);
    setUploadedFileIds([]);
    setShowCreateDialog(true);
  };

  // Open quiz dialog with reset form
  const openQuizDialog = () => {
    setQuizForm({
      title: '',
      description: '',
      courseId: courses.length > 0 ? courses[0].id : 0,
      dueDate: new Date().toISOString(),
      pointsPossible: 100,
      instructions: '',
      questions: [{ question: '', questionType: 'multiple_choice', options: ['', ''], correctAnswer: '', points: 10 }],
      timeLimit: 30,
      allowMultipleAttempts: false,
      maxAttempts: 1,
      shuffleQuestions: false,
      showCorrectAnswers: true,
      passingScore: 60,
      classIds: []
    });
    setSelectedDueDate(new Date());
    setShowQuizDialog(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteDialog(true);
  };

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  // Upload selected files
  const uploadFiles = async (): Promise<number[]> => {
    if (selectedFiles.length === 0) return [];

    setUploadingFiles(true);
    try {
      const uploadedFiles = await professorAssignmentService.uploadAssignmentMaterials(selectedFiles);
      const fileIds = uploadedFiles.map(file => file.id);
      setUploadedFileIds(fileIds);
      return fileIds;
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(t('errorUploadingFiles') || 'Error uploading files');
      return [];
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle quiz question updates
  const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuizForm({
      ...quizForm,
      questions: updatedQuestions
    });
  };

  // Add a new question to the quiz
  const addQuizQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [
        ...quizForm.questions,
        { question: '', questionType: 'multiple_choice', options: ['', ''], correctAnswer: '', points: 10 }
      ]
    });
  };

  // Remove a question from the quiz
  const removeQuizQuestion = (index: number) => {
    if (quizForm.questions.length <= 1) {
      toast.error(t('cannotRemoveAllQuestions') || 'Cannot remove all questions');
      return;
    }
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions.splice(index, 1);
    setQuizForm({
      ...quizForm,
      questions: updatedQuestions
    });
  };

  // Add an option to a multiple choice question
  const addQuestionOption = (questionIndex: number) => {
    const updatedQuestions = [...quizForm.questions];
    const currentOptions = updatedQuestions[questionIndex].options || [];
    updatedQuestions[questionIndex].options = [...currentOptions, ''];
    setQuizForm({
      ...quizForm,
      questions: updatedQuestions
    });
  };

  // Update an option for a multiple choice question
  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...quizForm.questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [''];
    }
    updatedQuestions[questionIndex].options![optionIndex] = value;
    setQuizForm({
      ...quizForm,
      questions: updatedQuestions
    });
  };

  // Remove an option from a multiple choice question
  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...quizForm.questions];
    if (!updatedQuestions[questionIndex].options || updatedQuestions[questionIndex].options!.length <= 2) {
      toast.error(t('minimumTwoOptions') || 'Questions must have at least two options');
      return;
    }
    updatedQuestions[questionIndex].options!.splice(optionIndex, 1);
    setQuizForm({
      ...quizForm,
      questions: updatedQuestions
    });
  };

  // Add a grading criterion
  const addGradingCriterion = () => {
    setGradingCriteria([
      ...gradingCriteria,
      { name: '', description: '', points: 10 }
    ]);
  };

  // Update a grading criterion
  const updateGradingCriterion = (index: number, field: keyof Omit<GradingCriteria, 'id'>, value: any) => {
    const updatedCriteria = [...gradingCriteria];
    updatedCriteria[index] = {
      ...updatedCriteria[index],
      [field]: value
    };
    setGradingCriteria(updatedCriteria);
  };

  // Remove a grading criterion
  const removeGradingCriterion = (index: number) => {
    if (gradingCriteria.length <= 1) {
      toast.error(t('cannotRemoveAllCriteria') || 'Cannot remove all criteria');
      return;
    }
    const updatedCriteria = [...gradingCriteria];
    updatedCriteria.splice(index, 1);
    setGradingCriteria(updatedCriteria);
  };

  // Create a new assignment
  const handleCreateAssignment = async () => {
    try {
      // Ensure the due date is set
      assignmentForm.dueDate = selectedDueDate?.toISOString() || new Date().toISOString();

      // Upload files if selected
      let fileIds: number[] = [];
      if (selectedFiles.length > 0) {
        fileIds = await uploadFiles();
      }

      // Create the assignment
      const result = await professorAssignmentService.createAssignment({
        ...assignmentForm,
        gradingCriteria,
        materialIds: fileIds.length > 0 ? fileIds : undefined
      });

      toast.success(t('assignmentCreatedSuccess') || 'Assignment created successfully');
      setShowCreateDialog(false);

      // Refresh assignments list
      loadAssignments();

    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error(t('errorCreatingAssignment') || 'Error creating assignment');
    }
  };

  // Create a new quiz
  const handleCreateQuiz = async () => {
    try {
      // Ensure the due date is set
      quizForm.dueDate = selectedDueDate?.toISOString() || new Date().toISOString();

      // Validate questions
      const invalidQuestions = quizForm.questions.some(q => !q.question || q.points <= 0);
      if (invalidQuestions) {
        toast.error(t('invalidQuizQuestions') || 'All questions must have content and points');
        return;
      }

      // Create the quiz
      const result = await professorAssignmentService.createQuiz(quizForm);

      toast.success(t('quizCreatedSuccess') || 'Quiz created successfully');
      setShowQuizDialog(false);

      // Refresh assignments list
      loadAssignments();

    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error(t('errorCreatingQuiz') || 'Error creating quiz');
    }
  };

  // Delete an assignment
  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      await professorAssignmentService.deleteAssignment(selectedAssignment.id);
      toast.success(t('assignmentDeletedSuccess') || 'Assignment deleted successfully');
      setShowDeleteDialog(false);

      // Refresh assignments list
      loadAssignments();

    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(t('errorDeletingAssignment') || 'Error deleting assignment');
    }
  };

  // Publish an assignment
  const handlePublishAssignment = async (assignmentId: number) => {
    try {
      await professorAssignmentService.publishAssignment(assignmentId);
      toast.success(t('assignmentPublishedSuccess') || 'Assignment published successfully');

      // Refresh assignments list
      loadAssignments();

    } catch (error) {
      console.error('Error publishing assignment:', error);
      toast.error(t('errorPublishingAssignment') || 'Error publishing assignment');
    }
  };

  // Clone an assignment
  const handleCloneAssignment = async (assignmentId: number) => {
    try {
      await professorAssignmentService.cloneAssignment(assignmentId);
      toast.success(t('assignmentClonedSuccess') || 'Assignment cloned successfully');

      // Refresh assignments list
      loadAssignments();

    } catch (error) {
      console.error('Error cloning assignment:', error);
      toast.error(t('errorCloningAssignment') || 'Error cloning assignment');
    }
  };

  // Export an assignment
  const handleExportAssignment = async (assignmentId: number, format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const exportUrl = await professorAssignmentService.exportAssignment(assignmentId, format);

      // Create a temporary link and click it to download
      const a = document.createElement('a');
      a.href = exportUrl;
      a.download = `assignment-${assignmentId}-${new Date().toISOString().slice(0,10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(
        t('assignmentExportedSuccess', { format: format.toUpperCase() }) ||
        `Assignment exported as ${format.toUpperCase()} successfully`
      );
    } catch (error) {
      console.error('Error exporting assignment:', error);
      toast.error(t('errorExportingAssignment') || 'Error exporting assignment');
    }
  };

  // Generate assignment with AI
  const handleGenerateWithAI = async () => {
    if (!aiPrompt || !assignmentForm.courseId || !assignmentForm.assignmentType) {
      toast.error(t('missingAIGenerationParams') || 'Please provide a prompt, course and assignment type');
      return;
    }

    setGeneratingWithAI(true);
    try {
      const generatedContent = await professorAssignmentService.generateAssignmentWithAI(
        aiPrompt,
        assignmentForm.courseId,
        assignmentForm.assignmentType
      );

      // Update the form with generated content
      if (assignmentForm.assignmentType === 'quiz') {
        setQuizForm(prev => ({
          ...prev,
          title: generatedContent.title,
          description: generatedContent.description,
          instructions: generatedContent.instructions,
          questions: generatedContent.questions || []
        }));
        setShowAIDialog(false);
        setShowQuizDialog(true);
      } else {
        setAssignmentForm(prev => ({
          ...prev,
          title: generatedContent.title,
          description: generatedContent.description,
          instructions: generatedContent.instructions
        }));
        setGradingCriteria(generatedContent.gradingCriteria);
        setShowAIDialog(false);
        setShowCreateDialog(true);
      }

      toast.success(t('contentGeneratedSuccess') || 'Assignment content generated successfully');
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error(t('errorGeneratingWithAI') || 'Error generating assignment with AI');
    } finally {
      setGeneratingWithAI(false);
    }
  };

  // Format due date for display
  const formatDueDate = (dueDate: string) => {
    try {
      return format(new Date(dueDate), 'PPP', { locale: fr });
    } catch (e) {
      return dueDate;
    }
  };

  // Calculate how many days until due
  const getDaysUntilDue = (dueDate: string) => {
    try {
      const due = new Date(dueDate);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return t('overdue') || 'Overdue';
      } else if (diffDays === 0) {
        return t('dueToday') || 'Due today';
      } else if (diffDays === 1) {
        return t('dueTomorrow') || 'Due tomorrow';
      } else {
        return t('dueInXDays', { days: diffDays }) || `Due in ${diffDays} days`;
      }
    } catch (e) {
      return t('invalidDate') || 'Invalid date';
    }
  };

  // Get status color for days until due
  const getDueDateColor = (dueDate: string) => {
    try {
      const due = new Date(dueDate);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'text-red-600';
      if (diffDays <= 1) return 'text-amber-600';
      if (diffDays <= 3) return 'text-amber-500';
      return 'text-slate-600';
    } catch (e) {
      return 'text-slate-600';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('assignmentsManagement') || 'Assignments Management'}</h1>
          <p className="text-muted-foreground">
            {t('assignmentsManagementDesc') || 'Create, manage, and track your class assignments'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('createNew') || 'Create New'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openCreateDialog}>
                <BookOpen className="w-4 h-4 mr-2" />
                {t('standardAssignment') || 'Standard Assignment'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openQuizDialog}>
                <ListChecks className="w-4 h-4 mr-2" />
                {t('quizAssignment') || 'Quiz Assignment'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAIDialog(true)}>
                <Gauge className="w-4 h-4 mr-2" />
                {t('generateWithAI') || 'Generate with AI'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => handleExportAssignment(
            selectedAssignment?.id || 0, 'pdf'
          )} disabled={!selectedAssignment}>
            <FileDown className="w-4 h-4 mr-2" />
            {t('export') || 'Export'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            {t('filterAssignments') || 'Filter Assignments'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label>{t('search') || 'Search'}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchByTitle') || 'Search by title...'}
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
                onValueChange={(value) => setFilters({
                  ...filters,
                  courseId: value ? parseInt(value) : undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allCourses') || 'All Courses'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helo">{t('allCourses') || 'All Courses'}</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('assignmentType') || 'Assignment Type'}</Label>
              <Select
                value={filters.assignmentType || ''}
                onValueChange={(value) => setFilters({
                  ...filters,
                  assignmentType: value || undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allTypes') || 'All Types'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helo">{t('allTypes') || 'All Types'}</SelectItem>
                  <SelectItem value="homework">{t('homework') || 'Homework'}</SelectItem>
                  <SelectItem value="quiz">{t('quiz') || 'Quiz'}</SelectItem>
                  <SelectItem value="exam">{t('exam') || 'Exam'}</SelectItem>
                  <SelectItem value="project">{t('project') || 'Project'}</SelectItem>
                  <SelectItem value="lab">{t('lab') || 'Lab'}</SelectItem>
                  <SelectItem value="discussion">{t('discussion') || 'Discussion'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('status') || 'Status'}</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters({
                  ...filters,
                  status: value || undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('allStatuses') || 'All Statuses'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helo">{t('allStatuses') || 'All Statuses'}</SelectItem>
                  <SelectItem value="draft">{t('draft') || 'Draft'}</SelectItem>
                  <SelectItem value="published">{t('published') || 'Published'}</SelectItem>
                  <SelectItem value="closed">{t('closed') || 'Closed'}</SelectItem>
                  <SelectItem value="grading">{t('grading') || 'Grading'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2">
              <Select
                value={`${filters.sortBy || 'dueDate'}-${filters.sortOrder || 'desc'}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-');
                  setFilters({
                    ...filters,
                    sortBy: sortBy as string,
                    sortOrder: sortOrder as 'asc' | 'desc'
                  });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('sortBy') || 'Sort by'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate-desc">{t('dueDateNewest') || 'Due Date (Newest)'}</SelectItem>
                  <SelectItem value="dueDate-asc">{t('dueDateOldest') || 'Due Date (Oldest)'}</SelectItem>
                  <SelectItem value="title-asc">{t('titleAZ') || 'Title (A-Z)'}</SelectItem>
                  <SelectItem value="title-desc">{t('titleZA') || 'Title (Z-A)'}</SelectItem>
                  <SelectItem value="createdAt-desc">{t('createdNewest') || 'Created (Newest)'}</SelectItem>
                  <SelectItem value="createdAt-asc">{t('createdOldest') || 'Created (Oldest)'}</SelectItem>
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

      {/* Assignments Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('title') || 'Title'}</TableHead>
                <TableHead>{t('course') || 'Course'}</TableHead>
                <TableHead>{t('type') || 'Type'}</TableHead>
                <TableHead>{t('dueDate') || 'Due Date'}</TableHead>
                <TableHead className="text-center">{t('points') || 'Points'}</TableHead>
                <TableHead className="text-center">{t('status') || 'Status'}</TableHead>
                <TableHead className="text-center">{t('submissions') || 'Submissions'}</TableHead>
                <TableHead className="text-right">{t('actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                      <p>{t('loadingAssignments') || 'Loading assignments...'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                      <p>{t('noAssignmentsFound') || 'No assignments found'}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('createFirstAssignment') || 'Create your first assignment to get started'}
                      </p>
                      <Button onClick={openCreateDialog} className="mt-4">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {t('createAssignment') || 'Create Assignment'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {assignment.description}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.courseName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="bg-slate-100 p-1 rounded-full mr-2">
                          <AssignmentTypeIcon type={assignment.assignmentType} />
                        </div>
                        {t(assignment.assignmentType) || assignment.assignmentType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDueDate(assignment.dueDate)}</span>
                        <span className={`text-xs ${getDueDateColor(assignment.dueDate)}`}>
                          {getDaysUntilDue(assignment.dueDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{assignment.pointsPossible}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={assignment.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{assignment.submissionCount || 0}</span>
                        {assignment.submissionCount && assignment.gradedCount ? (
                          <span className="text-xs text-muted-foreground">
                            {assignment.gradedCount} {t('graded') || 'graded'}
                          </span>
                        ) : null}
                      </div>
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
                          <DropdownMenuItem
                            onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignment.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t('viewDetails') || 'View Details'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignment.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {t('edit') || 'Edit'}
                          </DropdownMenuItem>
                          {assignment.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handlePublishAssignment(assignment.id)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              {t('publish') || 'Publish'}
                              </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleCloneAssignment(assignment.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            {t('clone') || 'Clone'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignment.id}/submissions`)}
                          >
                            <BarChart className="w-4 h-4 mr-2" />
                            {t('viewSubmissions') || 'View Submissions'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>{t('export') || 'Export'}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleExportAssignment(assignment.id, 'pdf')}>
                            <FileText className="w-4 h-4 mr-2" />
                            {t('exportPDF') || 'Export as PDF'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportAssignment(assignment.id, 'csv')}>
                            <FileText className="w-4 h-4 mr-2" />
                            {t('exportCSV') || 'Export as CSV'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(assignment)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('delete') || 'Delete'}
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
              {t('showingAssignments', {
                from: Math.min((page - 1) * limit + 1, totalAssignments),
                to: Math.min(page * limit, totalAssignments),
                total: totalAssignments
              }) || `Showing ${Math.min((page - 1) * limit + 1, totalAssignments)}-${Math.min(page * limit, totalAssignments)} of ${totalAssignments} assignments`}
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
                  onClick={() => setPage(page < Math.ceil(totalAssignments / limit) ? page + 1 : page)}
                  disabled={page >= Math.ceil(totalAssignments / limit)}
                >
                  {t('next') || 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Create Standard Assignment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                {t('createAssignment') || 'Create Assignment'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('createAssignmentDesc') || 'Create a new assignment for your students.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">{t('details') || 'Details'}</TabsTrigger>
                <TabsTrigger value="instructions">{t('instructions') || 'Instructions'}</TabsTrigger>
                <TabsTrigger value="grading">{t('grading') || 'Grading'}</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('title') || 'Title'} *</Label>
                    <Input
                      id="title"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                      placeholder={t('assignmentTitle') || 'Assignment title'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-type">{t('assignmentType') || 'Assignment Type'} *</Label>
                    <Select
                      value={assignmentForm.assignmentType}
                      onValueChange={(value) => setAssignmentForm({...assignmentForm, assignmentType: value})}
                    >
                      <SelectTrigger id="assignment-type">
                        <SelectValue placeholder={t('selectType') || 'Select type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">{t('homework') || 'Homework'}</SelectItem>
                        <SelectItem value="project">{t('project') || 'Project'}</SelectItem>
                        <SelectItem value="lab">{t('lab') || 'Lab'}</SelectItem>
                        <SelectItem value="discussion">{t('discussion') || 'Discussion'}</SelectItem>
                        <SelectItem value="exam">{t('exam') || 'Exam'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('description') || 'Description'} *</Label>
                  <Textarea
                    id="description"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                    placeholder={t('assignmentDescription') || 'Brief description of this assignment'}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">{t('course') || 'Course'} *</Label>
                    <Select
                      value={assignmentForm.courseId ? assignmentForm.courseId.toString() : ''}
                      onValueChange={handleCourseSelect}
                    >
                      <SelectTrigger id="course">
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
                    <Label htmlFor="due-date">{t('dueDate') || 'Due Date'} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="due-date"
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
                        <div className="p-3">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDueDate}
                            onSelect={setSelectedDueDate}
                            initialFocus
                          />
                          <div className="mt-3">
                            <Label>{t('time') || 'Time'}</Label>
                            <Input
                              type="time"
                              className="mt-1"
                              value={selectedDueDate ? format(selectedDueDate, 'HH:mm') : ''}
                              onChange={(e) => {
                                if (selectedDueDate && e.target.value) {
                                  const [hours, minutes] = e.target.value.split(':').map(Number);
                                  const newDate = new Date(selectedDueDate);
                                  newDate.setHours(hours, minutes);
                                  setSelectedDueDate(newDate);
                                  setAssignmentForm({...assignmentForm, dueDate: newDate.toISOString()});
                                }
                              }}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('assignToClasses') || 'Assign to Classes'} *</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    {selectedCourseClasses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('noClassesForCourse') || 'No classes available for selected course'}
                      </p>
                    ) : (
                      classes
                        .filter(cls => selectedCourseClasses.includes(cls.id))
                        .map(cls => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${cls.id}`}
                              checked={(assignmentForm.classIds || []).includes(cls.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAssignmentForm({
                                    ...assignmentForm,
                                    classIds: [...(assignmentForm.classIds || []), cls.id]
                                  });
                                } else {
                                  setAssignmentForm({
                                    ...assignmentForm,
                                    classIds: (assignmentForm.classIds || []).filter(id => id !== cls.id)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`class-${cls.id}`} className="text-sm font-normal cursor-pointer">
                              {cls.name}
                            </Label>
                          </div>
                        ))
                    )}
                    {selectedCourseClasses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          // Toggle select all/none
                          if ((assignmentForm.classIds || []).length === selectedCourseClasses.length) {
                            setAssignmentForm({...assignmentForm, classIds: []});
                          } else {
                            setAssignmentForm({...assignmentForm, classIds: [...selectedCourseClasses]});
                          }
                        }}
                      >
                        {(assignmentForm.classIds || []).length === selectedCourseClasses.length
                          ? t('deselectAll') || 'Deselect All'
                          : t('selectAll') || 'Select All'
                        }
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">{t('possiblePoints') || 'Possible Points'} *</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    step="1"
                    value={assignmentForm.pointsPossible}
                    onChange={(e) => setAssignmentForm({
                      ...assignmentForm,
                      pointsPossible: parseInt(e.target.value)
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instructions">{t('instructions') || 'Instructions'} *</Label>
                  <Textarea
                    id="instructions"
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({...assignmentForm, instructions: e.target.value})}
                    placeholder={t('instructionsPlaceholder') || 'Detailed instructions for completing this assignment'}
                    rows={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('attachments') || 'Attachments'}</Label>
                  <div className="border rounded-md p-4">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="mb-2"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mt-2">
                        <p className="text-sm font-medium">{t('selectedFiles') || 'Selected Files'}:</p>
                        <ul className="text-sm space-y-1">
                          {selectedFiles.map((file, index) => (
                            <li key={index} className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              {file.name} ({Math.round(file.size / 1024)} KB)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('attachmentsNote') || 'Files will be uploaded when the assignment is created.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="grading" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>{t('gradingCriteria') || 'Grading Criteria'}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addGradingCriterion}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      {t('addCriterion') || 'Add Criterion'}
                    </Button>
                  </div>
                  <div className="border rounded-md p-4 space-y-4">
                    {gradingCriteria.map((criterion, index) => (
                      <div key={index} className="space-y-2 pb-2 border-b last:border-0">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">{t('criterion') || 'Criterion'} {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGradingCriterion(index)}
                            disabled={gradingCriteria.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor={`criterion-name-${index}`} className="text-xs">
                              {t('name') || 'Name'}
                            </Label>
                            <Input
                              id={`criterion-name-${index}`}
                              value={criterion.name}
                              onChange={(e) => updateGradingCriterion(index, 'name', e.target.value)}
                              placeholder={t('criterionName') || 'Criterion name'}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`criterion-points-${index}`} className="text-xs">
                              {t('points') || 'Points'}
                            </Label>
                            <Input
                              id={`criterion-points-${index}`}
                              type="number"
                              min="0"
                              step="1"
                              value={criterion.points}
                              onChange={(e) => updateGradingCriterion(
                                index,
                                'points',
                                parseInt(e.target.value)
                              )}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`criterion-desc-${index}`} className="text-xs">
                            {t('description') || 'Description'}
                          </Label>
                          <Textarea
                            id={`criterion-desc-${index}`}
                            value={criterion.description}
                            onChange={(e) => updateGradingCriterion(index, 'description', e.target.value)}
                            placeholder={t('criterionDesc') || 'Description of this criterion'}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium">
                        {t('totalPoints') || 'Total Points'}:
                      </span>
                      <span className="text-sm font-bold">
                        {gradingCriteria.reduce((sum, criterion) => sum + (criterion.points || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('initialStatus') || 'Initial Status'}</Label>
                  <Select
                    value={assignmentForm.status || 'draft'}
                    onValueChange={(value) => setAssignmentForm({...assignmentForm, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder={t('selectStatus') || 'Select status'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('draft') || 'Draft'}</SelectItem>
                      <SelectItem value="published">{t('publishImmediately') || 'Publish Immediately'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleCreateAssignment}
              disabled={!assignmentForm.title || !assignmentForm.description ||
                !assignmentForm.courseId || !assignmentForm.instructions ||
                !selectedDueDate || (assignmentForm.classIds || []).length === 0}
            >
              {uploadingFiles ? (
                <span className="flex items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></div>
                  {t('creating') || 'Creating...'}
                </span>
              ) : (
                <span>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {t('createAssignment') || 'Create Assignment'}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <ListChecks className="w-5 h-5 mr-2" />
                {t('createQuiz') || 'Create Quiz'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('createQuizDesc') || 'Create a new quiz for your students.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">{t('details') || 'Details'}</TabsTrigger>
                <TabsTrigger value="questions">{t('questions') || 'Questions'}</TabsTrigger>
                <TabsTrigger value="settings">{t('settings') || 'Settings'}</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-title">{t('title') || 'Title'} *</Label>
                    <Input
                      id="quiz-title"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                      placeholder={t('quizTitle') || 'Quiz title'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-points">{t('totalPoints') || 'Total Points'} *</Label>
                    <Input
                      id="quiz-points"
                      type="number"
                      min="0"
                      step="1"
                      value={quizForm.pointsPossible}
                      onChange={(e) => setQuizForm({
                        ...quizForm,
                        pointsPossible: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description">{t('description') || 'Description'} *</Label>
                  <Textarea
                    id="quiz-description"
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                    placeholder={t('quizDescription') || 'Brief description of this quiz'}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-course">{t('course') || 'Course'} *</Label>
                    <Select
                      value={quizForm.courseId ? quizForm.courseId.toString() : ''}
                      onValueChange={handleQuizCourseSelect}
                    >
                      <SelectTrigger id="quiz-course">
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
                    <Label htmlFor="quiz-due-date">{t('dueDate') || 'Due Date'} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="quiz-due-date"
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
                        <div className="p-3">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDueDate}
                            onSelect={setSelectedDueDate}
                            initialFocus
                          />
                          <div className="mt-3">
                            <Label>{t('time') || 'Time'}</Label>
                            <Input
                              type="time"
                              className="mt-1"
                              value={selectedDueDate ? format(selectedDueDate, 'HH:mm') : ''}
                              onChange={(e) => {
                                if (selectedDueDate && e.target.value) {
                                  const [hours, minutes] = e.target.value.split(':').map(Number);
                                  const newDate = new Date(selectedDueDate);
                                  newDate.setHours(hours, minutes);
                                  setSelectedDueDate(newDate);
                                  setQuizForm({...quizForm, dueDate: newDate.toISOString()});
                                }
                              }}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('assignToClasses') || 'Assign to Classes'} *</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    {selectedCourseClasses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('noClassesForCourse') || 'No classes available for selected course'}
                      </p>
                    ) : (
                      classes
                        .filter(cls => selectedCourseClasses.includes(cls.id))
                        .map(cls => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`quiz-class-${cls.id}`}
                              checked={(quizForm.classIds || []).includes(cls.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setQuizForm({
                                    ...quizForm,
                                    classIds: [...(quizForm.classIds || []), cls.id]
                                  });
                                } else {
                                  setQuizForm({
                                    ...quizForm,
                                    classIds: (quizForm.classIds || []).filter(id => id !== cls.id)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`quiz-class-${cls.id}`} className="text-sm font-normal cursor-pointer">
                              {cls.name}
                            </Label>
                          </div>
                        ))
                    )}
                    {selectedCourseClasses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          // Toggle select all/none
                          if ((quizForm.classIds || []).length === selectedCourseClasses.length) {
                            setQuizForm({...quizForm, classIds: []});
                          } else {
                            setQuizForm({...quizForm, classIds: [...selectedCourseClasses]});
                          }
                        }}
                      >
                        {(quizForm.classIds || []).length === selectedCourseClasses.length
                          ? t('deselectAll') || 'Deselect All'
                          : t('selectAll') || 'Select All'
                        }
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-instructions">{t('instructions') || 'Instructions'} *</Label>
                  <Textarea
                    id="quiz-instructions"
                    value={quizForm.instructions}
                    onChange={(e) => setQuizForm({...quizForm, instructions: e.target.value})}
                    placeholder={t('quizInstructions') || 'Instructions for taking this quiz'}
                    rows={4}
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{t('quizQuestions') || 'Quiz Questions'}</h3>
                  <Button type="button" variant="outline" onClick={addQuizQuestion}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {t('addQuestion') || 'Add Question'}
                  </Button>
                </div>

                {quizForm.questions.map((question, qIndex) => (
                  <div key={qIndex} className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold">{t('question') || 'Question'} {qIndex + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuizQuestion(qIndex)}
                        disabled={quizForm.questions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`question-text-${qIndex}`}>
                        {t('questionText') || 'Question Text'} *
                      </Label>
                      <Textarea
                        id={`question-text-${qIndex}`}
                        value={question.question}
                        onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder={t('enterQuestion') || 'Enter your question here'}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`question-type-${qIndex}`}>
                        {t('questionType') || 'Question Type'} *
                      </Label>
                      <Select
                        value={question.questionType}
                        onValueChange={(value) => updateQuizQuestion(
                          qIndex,
                          'questionType',
                          value as QuizQuestion['questionType']
                        )}
                      >
                        <SelectTrigger id={`question-type-${qIndex}`}>
                          <SelectValue placeholder={t('selectQuestionType') || 'Select question type'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">{t('multipleChoice') || 'Multiple Choice'}</SelectItem>
                          <SelectItem value="true_false">{t('trueFalse') || 'True/False'}</SelectItem>
                          <SelectItem value="short_answer">{t('shortAnswer') || 'Short Answer'}</SelectItem>
                          <SelectItem value="essay">{t('essay') || 'Essay'}</SelectItem>
                          <SelectItem value="matching">{t('matching') || 'Matching'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question type specific fields */}
                    {question.questionType === 'multiple_choice' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>{t('options') || 'Options'} *</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestionOption(qIndex)}
                          >
                            <PlusCircle className="w-3 h-3 mr-1" />
                            {t('addOption') || 'Add Option'}
                          </Button>
                        </div>

                        {(question.options || []).map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <RadioGroup
                              value={
                                question.correctAnswer === option ||
                                (Array.isArray(question.correctAnswer) &&
                                question.correctAnswer.includes(option))
                                  ? option
                                  : ''
                              }
                              onValueChange={(value) => updateQuizQuestion(qIndex, 'correctAnswer', value)}
                              className="flex-shrink-0"
                            >
                              <RadioGroupItem value={option} id={`q${qIndex}-option-${oIndex}`} />
                            </RadioGroup>
                            <Input
                              className="flex-grow"
                              value={option}
                              onChange={(e) => updateQuestionOption(qIndex, oIndex, e.target.value)}
                              placeholder={`${t('option') || 'Option'} ${oIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestionOption(qIndex, oIndex)}
                              disabled={(question.options || []).length <= 2}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.questionType === 'true_false' && (
                      <div className="space-y-2">
                        <Label>{t('correctAnswer') || 'Correct Answer'} *</Label>
                        <RadioGroup
                          value={question.correctAnswer as string || ''}
                          onValueChange={(value) => updateQuizQuestion(qIndex, 'correctAnswer', value)}
                          className="flex items-center space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`q${qIndex}-true`} />
                            <Label htmlFor={`q${qIndex}-true`}>{t('true') || 'True'}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`q${qIndex}-false`} />
                            <Label htmlFor={`q${qIndex}-false`}>{t('false') || 'False'}</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {(question.questionType === 'short_answer' || question.questionType === 'essay') && (
                      <div className="space-y-2">
                        <Label htmlFor={`answer-key-${qIndex}`}>
                          {t('answerKey') || 'Answer Key'} {question.questionType === 'short_answer' ? '*' : ''}
                        </Label>
                        <Textarea
                          id={`answer-key-${qIndex}`}
                          value={question.correctAnswer as string || ''}
                          onChange={(e) => updateQuizQuestion(qIndex, 'correctAnswer', e.target.value)}
                          placeholder={
                            question.questionType === 'short_answer'
                              ? t('shortAnswerKey') || 'Expected answer'
                              : t('essayGuidelines') || 'Grading guidelines (optional)'
                          }
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`question-points-${qIndex}`}>
                        {t('points') || 'Points'} *
                      </Label>
                      <Input
                        id={`question-points-${qIndex}`}
                        type="number"
                        min="1"
                        step="1"
                        value={question.points}
                        onChange={(e) => updateQuizQuestion(qIndex, 'points', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}

                <div className="border p-4 rounded-md bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t('totalQuestions') || 'Total Questions'}:</span>
                    <span className="font-bold">{quizForm.questions.length}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">{t('totalPoints') || 'Total Points'}:</span>
                    <span className="font-bold">
                      {quizForm.questions.reduce((sum, q) => sum + (q.points || 0), 0)}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time-limit">{t('timeLimit') || 'Time Limit (minutes)'}</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      min="0"
                      step="1"
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm({
                        ...quizForm,
                        timeLimit: parseInt(e.target.value)
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('timeLimitHint') || 'Set to 0 for no time limit'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passing-score">{t('passingScore') || 'Passing Score (%)'}</Label>
                    <Input
                      id="passing-score"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={quizForm.passingScore}
                      onChange={(e) => setQuizForm({
                        ...quizForm,
                        passingScore: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="attempts">{t('multipleAttempts') || 'Allow Multiple Attempts'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('multipleAttemptsHint') || 'Let students attempt the quiz more than once'}
                      </p>
                    </div>
                    <Switch
                      id="attempts"
                      checked={quizForm.allowMultipleAttempts}
                      onCheckedChange={(checked) => setQuizForm({
                        ...quizForm,
                        allowMultipleAttempts: checked
                      })}
                    />
                  </div>

                  {quizForm.allowMultipleAttempts && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="max-attempts">{t('maxAttempts') || 'Maximum Attempts'}</Label>
                      <Input
                        id="max-attempts"
                        type="number"
                        min="1"
                        step="1"
                        value={quizForm.maxAttempts}
                        onChange={(e) => setQuizForm({
                          ...quizForm,
                          maxAttempts: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="shuffle">{t('shuffleQuestions') || 'Shuffle Questions'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('shuffleQuestionsHint') || 'Randomize question order for each student'}
                      </p>
                    </div>
                    <Switch
                      id="shuffle"
                      checked={quizForm.shuffleQuestions}
                      onCheckedChange={(checked) => setQuizForm({
                        ...quizForm,
                        shuffleQuestions: checked
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-answers">{t('showCorrectAnswers') || 'Show Correct Answers'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('showCorrectAnswersHint') || 'Show students the correct answers after submission'}
                      </p>
                    </div>
                    <Switch
                      id="show-answers"
                      checked={quizForm.showCorrectAnswers}
                      onCheckedChange={(checked) => setQuizForm({
                        ...quizForm,
                        showCorrectAnswers: checked
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label htmlFor="quiz-status">{t('initialStatus') || 'Initial Status'}</Label>
                  <Select
                    value={quizForm.status || 'draft'}
                    onValueChange={(value) => setQuizForm({...quizForm, status: value})}
                  >
                    <SelectTrigger id="quiz-status">
                      <SelectValue placeholder={t('selectStatus') || 'Select status'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('draft') || 'Draft'}</SelectItem>
                      <SelectItem value="published">{t('publishImmediately') || 'Publish Immediately'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleCreateQuiz}
              disabled={!quizForm.title || !quizForm.description ||
                !quizForm.courseId || !quizForm.instructions ||
                !selectedDueDate || (quizForm.classIds || []).length === 0 ||
                quizForm.questions.some(q => !q.question || !q.points)}
            >
              <ListChecks className="w-4 h-4 mr-2" />
              {t('createQuiz') || 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              <AlertCircle className="w-5 h-5 mr-2 inline-block" />
              {t('confirmDelete') || 'Confirm Delete'}
            </DialogTitle>
            <DialogDescription>
              {t('deleteAssignmentWarning') || 'Are you sure you want to delete this assignment? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedAssignment && (
              <div className="border p-3 rounded-md">
                <p className="font-medium">{selectedAssignment.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedAssignment.courseName}</p>
                <div className="flex items-center mt-2 text-sm">
                  <AssignmentTypeIcon type={selectedAssignment.assignmentType} />
                  <span className="ml-1">{t(selectedAssignment.assignmentType) || selectedAssignment.assignmentType}</span>
                  <span className="mx-2">•</span>
                  <span>{formatDueDate(selectedAssignment.dueDate)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('deleteAssignment') || 'Delete Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Gauge className="w-5 h-5 mr-2" />
                {t('generateAssignmentAI') || 'Generate Assignment with AI'}
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('generateAssignmentAIDesc') || 'Describe what kind of assignment you want, and our AI will create it for you.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-assignment-type">{t('assignmentType') || 'Assignment Type'} *</Label>
              <Select
                value={assignmentForm.assignmentType}
                onValueChange={(value) => setAssignmentForm({...assignmentForm, assignmentType: value})}
              >
                <SelectTrigger id="ai-assignment-type">
                  <SelectValue placeholder={t('selectType') || 'Select type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homework">{t('homework') || 'Homework'}</SelectItem>
                  <SelectItem value="quiz">{t('quiz') || 'Quiz'}</SelectItem>
                  <SelectItem value="project">{t('project') || 'Project'}</SelectItem>
                  <SelectItem value="lab">{t('lab') || 'Lab'}</SelectItem>
                  <SelectItem value="discussion">{t('discussion') || 'Discussion'}</SelectItem>
                  <SelectItem value="exam">{t('exam') || 'Exam'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-course">{t('course') || 'Course'} *</Label>
              <Select
                value={assignmentForm.courseId ? assignmentForm.courseId.toString() : ''}
                onValueChange={handleCourseSelect}
              >
                <SelectTrigger id="ai-course">
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
              <Label htmlFor="ai-prompt">{t('prompt') || 'Prompt'} *</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t('aiPromptPlaceholder') || 'Describe the assignment you want to create...'}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                {t('aiPromptHint') || 'Be specific about the topic, difficulty level, objectives, and any specific requirements.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleGenerateWithAI}
              disabled={!aiPrompt || !assignmentForm.courseId || generatingWithAI}
            >
              {generatingWithAI ? (
                <span className="flex items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2"></div>
                  {t('generating') || 'Generating...'}
                </span>
              ) : (
                <span>
                  <Gauge className="w-4 h-4 mr-2" />
                  {t('generate') || 'Generate'}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorAssignmentsPage;
