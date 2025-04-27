"use client";

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { ProfessorService } from '@/services/ProfessorService';
import { ProfessorMaterialsService, LessonPlan } from '@/services/ProfessorMaterialsService';
import fileService from '@/services/FileService';
import { toast } from 'sonner';

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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icons
import {
  BookOpen,
  FileText,
  File,
  Plus,
  Edit,
  Trash2,
  Download,
  Sparkles,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckSquare,
  Search,
  Tag,
  Loader2,
  ChevronLeft,
  X,
  Target,
  ArrowLeft
} from 'lucide-react';

// Lesson Plan Item Component
const LessonPlanItem = ({ lessonPlan, onEdit, onDelete, onPreview, onDuplicate }:any) => {
  const { t } = useTranslation();

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-gray-100/50 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-800/50">
            {t("draft")}
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="bg-blue-100/50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/50">
            {t("ready")}
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="outline" className="bg-green-100/50 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800/50">
            {t("delivered")}
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-100/50 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-800/50">
            {t("archived")}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <BookOpen className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-medium">{lessonPlan.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{lessonPlan.description}</p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getStatusBadge(lessonPlan.status)}

                {lessonPlan.planned_date && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-amber-100/50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/50">
                    <Calendar className="h-3 w-3" />
                    {formatDate(lessonPlan.planned_date)}
                  </Badge>
                )}

                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lessonPlan.duration_minutes} {t("minutes")}
                </Badge>

                {lessonPlan.ai_enhanced && (
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {t("aiEnhanced")}
                  </Badge>
                )}
              </div>

              {lessonPlan.objectives && lessonPlan.objectives.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center text-xs text-muted-foreground mb-1">
                    <Target className="h-3 w-3 mr-1" />
                    <span>{t("objectives")}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lessonPlan.objectives.slice(0, 2).map((objective, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {objective}
                      </Badge>
                    ))}
                    {lessonPlan.objectives.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{lessonPlan.objectives.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(lessonPlan)}>
                <Edit className="h-4 w-4 mr-2" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(lessonPlan)}>
                <BookOpen className="h-4 w-4 mr-2" />
                {t("preview")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(lessonPlan)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(lessonPlan)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

// Lesson Plan Dialog Component
const LessonPlanDialog = ({ isOpen, onClose, lessonPlan, onSave, courses }: any) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: 0,
    objectives: [] as string[],
    content: { notes: '', activities: [] },
    resources: { references: [], links: [] },
    planned_date: '',
    duration_minutes: 60,
    status: 'draft' as 'draft' | 'ready' | 'delivered' | 'archived'
  });
  const [newObjective, setNewObjective] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Initialize form data when lesson plan changes
  useEffect(() => {
    if (lessonPlan) {
      setFormData({
        title: lessonPlan.title || '',
        description: lessonPlan.description || '',
        course_id: lessonPlan.course_id || (courses[0]?.id || 0),
        objectives: lessonPlan.objectives || [],
        content: lessonPlan.content || { notes: '', activities: [] },
        resources: lessonPlan.resources || { references: [], links: [] },
        planned_date: lessonPlan.planned_date ? lessonPlan.planned_date.split('T')[0] : '',
        duration_minutes: lessonPlan.duration_minutes || 60,
        status: lessonPlan.status || 'draft'
      });
      setFiles([]);
    } else {
      // Default form values for new lesson plan
      setFormData({
        title: '',
        description: '',
        course_id: courses[0]?.id || 0,
        objectives: [],
        content: { notes: '', activities: [] },
        resources: { references: [], links: [] },
        planned_date: '',
        duration_minutes: 60,
        status: 'draft'
      });
      setFiles([]);
    }
  }, [lessonPlan, courses, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContentChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [name]: value
      }
    });
  };

  const handleAddObjective = () => {
    if (newObjective.trim() && !formData.objectives.includes(newObjective.trim())) {
      setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] });
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index) => {
    const newObjectives = [...formData.objectives];
    newObjectives.splice(index, 1);
    setFormData({ ...formData, objectives: newObjectives });
  };

  const handleFilesChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.course_id === 0) {
      toast.error(t("pleaseSelectCourse"));
      return;
    }
    onSave(formData, files);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lessonPlan ? t("editLessonPlan") : t("createLessonPlan")}</DialogTitle>
          <DialogDescription>
            {lessonPlan ? t("editLessonPlanDescription") : t("createLessonPlanDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">{t("title")}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t("lessonPlanTitlePlaceholder")}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t("lessonPlanDescriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course_id">{t("course")}</Label>
                <Select
                  name="course_id"
                  value={formData.course_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, course_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCourse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">{t("status")}</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'draft' | 'ready' | 'delivered' | 'archived' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("draft")}</SelectItem>
                    <SelectItem value="ready">{t("ready")}</SelectItem>
                    <SelectItem value="delivered">{t("delivered")}</SelectItem>
                    <SelectItem value="archived">{t("archived")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planned_date">{t("plannedDate")}</Label>
                <Input
                  id="planned_date"
                  name="planned_date"
                  type="date"
                  value={formData.planned_date}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="duration_minutes">{t("duration")} ({t("minutes")})</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min="15"
                  step="5"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label>{t("learningObjectives")}</Label>
              <div className="flex mt-1 mb-2">
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder={t("addObjectivePlaceholder")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddObjective();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddObjective} className="ml-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.objectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center">
                    {objective}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveObjective(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {formData.objectives.length === 0 && (
                  <span className="text-sm text-muted-foreground">{t("noObjectivesAdded")}</span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">{t("lessonNotes")}</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.content.notes}
                onChange={handleContentChange}
                placeholder={t("lessonNotesPlaceholder")}
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="files">{t("attachResources")}</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={handleFilesChange}
                className="cursor-pointer"
              />
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">{t("selectedFiles")}</p>
                  <ul className="text-sm text-muted-foreground">
                    {Array.from(files).map((file, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <File className="h-3 w-3" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">{lessonPlan ? t("updateLessonPlan") : t("createLessonPlan")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({ isOpen, onClose, lessonPlan, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("confirmDelete")}</DialogTitle>
          <DialogDescription>
            {t("deleteLessonPlanConfirm")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="font-medium">{lessonPlan?.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{lessonPlan?.description}</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// AI Generation Dialog
const GenerateDialog = ({ isOpen, onClose, onGenerate, courses }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    course_id: 0,
    topic: '',
    duration_minutes: 60,
    difficulty_level: 'medium',
    learning_objectives: [] as string[],
    include_activities: true,
    include_resources: true
  });
  const [newObjective, setNewObjective] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        course_id: courses[0]?.id || 0,
        topic: '',
        duration_minutes: 60,
        difficulty_level: 'medium',
        learning_objectives: [],
        include_activities: true,
        include_resources: true
      });
    }
  }, [isOpen, courses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleAddObjective = () => {
    if (newObjective.trim() && !formData.learning_objectives.includes(newObjective.trim())) {
      setFormData({ ...formData, learning_objectives: [...formData.learning_objectives, newObjective.trim()] });
      setNewObjective('');
    }
  };

  const handleRemoveObjective = (index) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives.splice(index, 1);
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("generateLessonPlan")}</DialogTitle>
          <DialogDescription>
            {t("generateLessonPlanDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="course_id">{t("course")}</Label>
            <Select
              name="course_id"
              value={formData.course_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, course_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectCourse")} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="topic">{t("topic")}</Label>
            <Input
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder={t("topicPlaceholder")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration_minutes">{t("duration")} ({t("minutes")})</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="15"
                step="5"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="difficulty_level">{t("difficultyLevel")}</Label>
              <Select
                name="difficulty_level"
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectDifficulty")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t("beginner")}</SelectItem>
                  <SelectItem value="medium">{t("intermediate")}</SelectItem>
                  <SelectItem value="advanced">{t("advanced")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("suggestedObjectives")}</Label>
            <div className="flex mt-1 mb-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder={t("optionalObjectivePlaceholder")}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddObjective();
                  }
                }}
              />
              <Button type="button" onClick={handleAddObjective} className="ml-2">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {formData.learning_objectives.map((objective, index) => (
                <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center">
                  {objective}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemoveObjective(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {formData.learning_objectives.length === 0 && (
                <span className="text-sm text-muted-foreground">{t("aiWillGenerateObjectives")}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_activities"
                checked={formData.include_activities}
                onCheckedChange={(checked) => handleCheckboxChange('include_activities', checked)}
              />
              <Label htmlFor="include_activities">{t("includeActivities")}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_resources"
                checked={formData.include_resources}
                onCheckedChange={(checked) => handleCheckboxChange('include_resources', checked)}
              />
              <Label htmlFor="include_resources">{t("includeResources")}</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={() => onGenerate(formData)}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Lesson Plans Page Component
const LessonPlansPage = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();

  // State
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPlans, setTotalPlans] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Dialogs
  const [isLessonPlanDialogOpen, setIsLessonPlanDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);

  // Load courses
  const loadCourses = async () => {
    try {
      const response = await ProfessorService.getCourses();
      if (response && response.courses) {
        setCourses(response.courses);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error(t("errorLoadingCourses"));
    }
  };

  // Load lesson plans with filters
  const loadLessonPlans = async () => {
    setLoading(true);
    try {
      const filters: any = {};

      if (searchTerm) {
        filters.search_term = searchTerm;
      }

      if (selectedCourse) {
        filters.course_id = selectedCourse;
      }

      if (selectedStatus) {
        filters.status = selectedStatus;
      }

      const response = await ProfessorMaterialsService.getLessonPlans(filters);
      if (response) {
        setLessonPlans(response.lesson_plans);
        setTotalPlans(response.total);
      }
    } catch (error) {
      console.error("Error loading lesson plans:", error);
      toast.error(t("errorLoadingLessonPlans"));
      setLessonPlans([]);
      setTotalPlans(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating or updating lesson plan
  const handleSaveLessonPlan = async (formData, files) => {
    try {
      if (selectedLessonPlan) {
        // Update existing lesson plan
        await ProfessorMaterialsService.updateLessonPlan(selectedLessonPlan.id, formData, files);
        toast.success(t("lessonPlanUpdated"));
      } else {
        // Create new lesson plan
        await ProfessorMaterialsService.createLessonPlan(formData, files);
        toast.success(t("lessonPlanCreated"));
      }

      setIsLessonPlanDialogOpen(false);
      setSelectedLessonPlan(null);
      loadLessonPlans();
    } catch (error) {
      console.error("Error saving lesson plan:", error);
      toast.error(t("errorSavingLessonPlan"));
    }
  };

  // Handle lesson plan deletion
  const handleDeleteLessonPlan = async () => {
    if (!selectedLessonPlan) return;

    try {
      await ProfessorMaterialsService.deleteLessonPlan(selectedLessonPlan.id);
      toast.success(t("lessonPlanDeleted"));
      setIsDeleteDialogOpen(false);
      setSelectedLessonPlan(null);
      loadLessonPlans();
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      toast.error(t("errorDeletingLessonPlan"));
    }
  };

  // Handle preview lesson plan (redirect to detail page)
  const handlePreviewLessonPlan = (lessonPlan) => {
    // In a real implementation, redirect to a detail view
    toast.info(t("lessonPlanPreviewComingSoon"));
  };

  // Handle duplicate lesson plan
  const handleDuplicateLessonPlan = (lessonPlan) => {
    // Create a duplicate by removing the ID and changing the title
    const duplicateData = {
      ...lessonPlan,
      title: `${lessonPlan.title} (${t("copy")})`,
      status: 'draft'
    };

    // Open the dialog with the duplicated data
    setSelectedLessonPlan({
      ...duplicateData,
      id: -1 // Temporary ID to indicate this is a new item based on existing
    });
    setIsLessonPlanDialogOpen(true);
  };

  // Handle AI generation
  const handleGenerateLessonPlan = async (options) => {
    try {
      toast.promise(
        ProfessorMaterialsService.generateLessonPlan(options.course_id, options),
        {
          loading: t("generatingLessonPlan"),
          success: (lessonPlan) => {
            loadLessonPlans();
            return t("lessonPlanGenerated");
          },
          error: t("errorGeneratingLessonPlan"),
        }
      );

      setIsGenerateDialogOpen(false);
    } catch (error) {
      console.error("Error generating lesson plan:", error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCourse(null);
    setSelectedStatus(null);
  };

  // Load initial data
  useEffect(() => {
    loadCourses();
  }, []);

  // Load lesson plans when filters change
  useEffect(() => {
    loadLessonPlans();
  }, [searchTerm, selectedCourse, selectedStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/dashboard/professor/materials`)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-light tracking-tight">
                {t("lessonPlans")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("manageLessonPlans")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsGenerateDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("generateWithAI")}
          </Button>
          <Button
            onClick={() => {
              setSelectedLessonPlan(null);
              setIsLessonPlanDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("createLessonPlan")}
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("searchLessonPlans")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedCourse?.toString() || ""}
            onValueChange={(value) => setSelectedCourse(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("allCourses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deded">{t("allCourses")}</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus || ""}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dsds">{t("allStatuses")}</SelectItem>
              <SelectItem value="draft">{t("draft")}</SelectItem>
              <SelectItem value="ready">{t("ready")}</SelectItem>
              <SelectItem value="delivered">{t("delivered")}</SelectItem>
              <SelectItem value="archived">{t("archived")}</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || selectedCourse || selectedStatus) && (
            <Button variant="ghost" onClick={resetFilters}>
              {t("clearFilters")}
            </Button>
          )}
        </div>
      </div>

      {/* Lesson Plans list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {lessonPlans.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("showingLessonPlans", { count: lessonPlans.length, total: totalPlans })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessonPlans.map((lessonPlan) => (
                  <LessonPlanItem
                    key={lessonPlan.id}
                    lessonPlan={lessonPlan}
                    onEdit={(lessonPlan) => {
                      setSelectedLessonPlan(lessonPlan);
                      setIsLessonPlanDialogOpen(true);
                    }}
                    onDelete={(lessonPlan) => {
                      setSelectedLessonPlan(lessonPlan);
                      setIsDeleteDialogOpen(true);
                    }}
                    onPreview={handlePreviewLessonPlan}
                    onDuplicate={handleDuplicateLessonPlan}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="border">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCourse || selectedStatus
                    ? t("noLessonPlansMatchingFilters")
                    : t("noLessonPlansYet")}
                </p>
                {!searchTerm && !selectedCourse && !selectedStatus && (
                  <div className="flex flex-col sm:flex-row justify-center gap-2">
                    <Button
                      onClick={() => {
                        setSelectedLessonPlan(null);
                        setIsLessonPlanDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("createFirstLessonPlan")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsGenerateDialogOpen(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("generateWithAI")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogs */}
      <LessonPlanDialog
        isOpen={isLessonPlanDialogOpen}
        onClose={() => {
          setIsLessonPlanDialogOpen(false);
          setSelectedLessonPlan(null);
        }}
        lessonPlan={selectedLessonPlan}
        onSave={handleSaveLessonPlan}
        courses={courses}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedLessonPlan(null);
        }}
        lessonPlan={selectedLessonPlan}
        onConfirm={handleDeleteLessonPlan}
      />

      <GenerateDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        onGenerate={handleGenerateLessonPlan}
        courses={courses}
      />
    </div>
  );
};

export default LessonPlansPage;
