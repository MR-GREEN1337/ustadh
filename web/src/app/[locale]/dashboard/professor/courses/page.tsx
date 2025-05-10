"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProfessorService } from '@/services/ProfessorService';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowUpDown,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Library,
  LineChart,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  PencilRuler,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  department?: string;
  educationLevel?: string;
  academicTrack?: string;
  status: 'draft' | 'active' | 'archived';
  topics: string[];
  students?: number;
  progress?: number;
  aiGenerated?: boolean;
  lastUpdated?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  materials?: number;
}

interface Department {
  id: number;
  name: string;
}

interface CourseFormData {
  title: string;
  code: string;
  description: string;
  status: string;
  topics: string[];
  department?: number;
  educationLevel?: string;
  academicTrack?: string;
}

const educationLevels = [
  { value: 'primary_1', label: 'Primary 1' },
  { value: 'primary_2', label: 'Primary 2' },
  { value: 'primary_3', label: 'Primary 3' },
  { value: 'primary_4', label: 'Primary 4' },
  { value: 'primary_5', label: 'Primary 5' },
  { value: 'primary_6', label: 'Primary 6' },
  { value: 'college_7', label: 'College 7' },
  { value: 'college_8', label: 'College 8' },
  { value: 'college_9', label: 'College 9' },
  { value: 'tronc_commun', label: 'Tronc Commun' },
  { value: 'bac_1', label: 'Bac 1' },
  { value: 'bac_2', label: 'Bac 2' },
  { value: 'university', label: 'University' },
];

const academicTracks = [
  { value: 'sciences_math_a', label: 'Sciences Math A' },
  { value: 'sciences_math_b', label: 'Sciences Math B' },
  { value: 'svt_pc', label: 'SVT/PC' },
  { value: 'lettres_phil', label: 'Lettres & Philosophy' },
  { value: 'eco_gestion', label: 'Economics & Management' },
  { value: 'uni_fst', label: 'University FST' },
  { value: 'uni_medicine', label: 'University Medicine' },
];

// Course Card Component
const CourseCard = ({ course, onEdit, onGenerate, onDelete, onView }: {
  course: Course,
  onEdit: (course: Course) => void,
  onGenerate: (course: Course) => void,
  onDelete: (course: Course) => void,
  onView: (course: Course) => void
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocale();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-amber-100 text-amber-800';
      case 'archived': return 'bg-slate-100 text-slate-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
        {course.coverImage ? (
          <div className="absolute inset-0">
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        ) : (
          <BookOpen className="h-14 w-14 text-primary/40" />
        )}
        <Badge className={`absolute top-3 right-3 ${getStatusColor(course.status)}`}>
          {t(course.status)}
        </Badge>
        {course.aiGenerated && (
          <Badge className="absolute top-3 left-3 bg-violet-100 text-violet-800 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {t("aiEnhanced")}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium truncate">{course.title}</CardTitle>
            <CardDescription className="text-sm font-mono">{course.code}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(course)}>
                <Eye className="h-4 w-4 mr-2" />
                {t("viewCourse")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Edit className="h-4 w-4 mr-2" />
                {t("editCourse")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerate(course)}>
                <Sparkles className="h-4 w-4 mr-2" />
                {t("enhanceWithAI")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/professor/courses/${course.id}`)}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {t("dashboard")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/professor/courses/${course.id}/materials`)}>
                <FileText className="h-4 w-4 mr-2" />
                {t("materials")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/professor/courses/${course.id}/students`)}>
                <Users className="h-4 w-4 mr-2" />
                {t("students")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(course)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                {t("deleteCourse")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-sm line-clamp-2 min-h-[40px]">{course.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {course.topics.slice(0, 3).map((topic, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
          {course.topics.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{course.topics.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2 pb-3 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1" />
          <span>{course.students || 0} {t("students")}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatDate(course.lastUpdated || new Date().toISOString())}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

// Course Form Dialog
const CourseFormDialog = ({
  isOpen,
  onClose,
  course,
  onSave,
  departments = []
}: {
  isOpen: boolean,
  onClose: () => void,
  course: Course | null,
  onSave: (formData: CourseFormData) => void,
  departments: Department[]
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    code: '',
    description: '',
    status: 'draft',
    topics: [],
    department: undefined,
    educationLevel: undefined,
    academicTrack: undefined
  });

  const [newTopic, setNewTopic] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize form data when course changes
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        code: course.code || '',
        description: course.description || '',
        status: course.status || 'draft',
        topics: course.topics || [],
        department: course.department ? Number(course.department) : undefined,
        educationLevel: course.educationLevel,
        academicTrack: course.academicTrack
      });
    } else {
      // Reset form for new course
      setFormData({
        title: '',
        code: '',
        description: '',
        status: 'draft',
        topics: [],
        department: departments.length > 0 ? departments[0].id : undefined,
        educationLevel: undefined,
        academicTrack: undefined
      });
    }
    setErrors({});
  }, [course, isOpen, departments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error if field is filled
    if (errors[name] && value.trim()) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = t("titleRequired");
    }

    if (!formData.code.trim()) {
      newErrors.code = t("codeRequired");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("descriptionRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center text-xl">
              {course ? (
                <>
                  <Edit className="h-5 w-5 mr-2" />
                  {t("editCourse")}
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  {t("createNewCourse")}
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {t("courseDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="details">{t("basicDetails")}</TabsTrigger>
              <TabsTrigger value="academic">{t("academic")}</TabsTrigger>
              <TabsTrigger value="content">{t("content")}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <Label htmlFor="title" className="text-sm font-medium">
                    {t("courseTitle")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t("courseTitlePlaceholder")}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="code" className="text-sm font-medium">
                    {t("courseCode")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="CS101"
                    className={errors.code ? "border-red-500" : ""}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  {t("description")} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t("courseDescriptionPlaceholder")}
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  {t("status")}
                </Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("draft")}</SelectItem>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="archived">{t("archived")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.status === 'draft' && t("draftDescription")}
                  {formData.status === 'active' && t("activeDescription")}
                  {formData.status === 'archived' && t("archivedDescription")}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="academic" className="space-y-4">
              <div>
                <Label htmlFor="department" className="text-sm font-medium">
                  {t("department")}
                </Label>
                <Select
                  value={formData.department?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, department: Number(value) })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder={t("selectDepartment")} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="educationLevel" className="text-sm font-medium">
                  {t("educationLevel")}
                </Label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                >
                  <SelectTrigger id="educationLevel">
                    <SelectValue placeholder={t("selectEducationLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicTrack" className="text-sm font-medium">
                  {t("academicTrack")}
                </Label>
                <Select
                  value={formData.academicTrack}
                  onValueChange={(value) => setFormData({ ...formData, academicTrack: value })}
                >
                  <SelectTrigger id="academicTrack">
                    <SelectValue placeholder={t("selectAcademicTrack")} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicTracks.map((track) => (
                      <SelectItem key={track.value} value={track.value}>
                        {track.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t("topics")}</Label>
                <div className="flex mt-1 mb-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder={t("addTopicPlaceholder")}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTopic} className="ml-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-md p-4 min-h-[120px]">
                  {formData.topics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[72px] text-muted-foreground">
                      <PencilRuler className="h-5 w-5 mb-2" />
                      <span className="text-sm">{t("noTopicsAdded")}</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.topics.map((topic, index) => (
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
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("topicsHelper")}
                </p>
              </div>

              <div className="my-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">{t("aiSuggestions")}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="justify-start text-xs h-8"
                    onClick={() => {
                      const suggestions = ["Fundamentals", "Advanced Concepts", "Practical Applications"];
                      setFormData({
                        ...formData,
                        topics: [...new Set([...formData.topics, ...suggestions])]
                      });
                    }}
                  >
                    {t("suggestBasicTopics")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="justify-start text-xs h-8"
                    onClick={() => {
                      // This would call an API in a real implementation
                      toast.success(t("generatingTopics"));
                    }}
                  >
                    {t("generateTopicsFromDescription")}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">
              {course ? t("updateCourse") : t("createCourse")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog
const DeleteCourseDialog = ({
  isOpen,
  onClose,
  course,
  onConfirm
}: {
  isOpen: boolean,
  onClose: () => void,
  course: Course | null,
  onConfirm: () => void
}) => {
  const { t } = useTranslation();

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {t("deleteCourse")}
          </DialogTitle>
          <DialogDescription>
            {t("deleteCourseConfirmation")}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 border rounded-md bg-muted/50">
          <h3 className="font-medium">{course.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{course.code}</p>
          {course.students !== undefined && course.students > 0 && (
            <div className="mt-3 flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{t("courseHasStudents", { count: course.students })}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Course Stats Card Component
const CourseStatsCard = ({
  stats = { courses: 0, students: 0, materials: 0, completionRate: 0 },
  loading = false
}: {
  stats?: { courses: number, students: number, materials: number, completionRate: number },
  loading?: boolean
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-4 divide-x">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="p-4 flex flex-col items-center justify-center">
                <div className="h-6 w-16 bg-muted/60 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-12 bg-muted/40 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    { label: t("totalCourses"), value: stats.courses, icon: BookOpen },
    { label: t("totalStudents"), value: stats.students, icon: Users },
    { label: t("totalMaterials"), value: stats.materials, icon: FileText },
    { label: t("completionRate"), value: `${stats.completionRate}%`, icon: LineChart },
  ];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0">
          {statItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="p-4 flex flex-col items-center justify-center">
                <div className="flex items-center mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground mr-1" />
                  <span className="text-sm font-normal text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-2xl font-semibold">{item.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Courses Page Component
const CoursesPage = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();

  // State for courses and UI states
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState('updated');
  const [statsLoading, setStatsLoading] = useState(true);
  const [courseStats, setCourseStats] = useState({
    courses: 0,
    students: 0,
    materials: 0,
    completionRate: 0
  });

  // Mock departments (would be fetched from API)
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Sciences' },
    { id: 3, name: 'Languages' },
    { id: 4, name: 'Social Studies' },
    { id: 5, name: 'Computer Science' }
  ]);

  // Load courses
  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await ProfessorService.getCourses();
      if (response && response.courses) {
        setCourses(response.courses);

        // Update stats
        const totalStudents = response.courses.reduce((sum: number, course: Course) => sum + (course.students || 0), 0);
        const totalMaterials = response.courses.reduce((sum: number, course: Course) => sum + (course.materials || 0), 0);
        const avgCompletionRate = response.courses.length > 0
          ? Math.round(response.courses.reduce((sum: number, course: Course) => sum + (course.progress || 0), 0) / response.courses.length)
          : 0;

        setCourseStats({
          courses: response.courses.length,
          students: totalStudents,
          materials: totalMaterials,
          completionRate: avgCompletionRate
        });
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error(t("errorLoadingCourses"));
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // Load departments (would be implemented to fetch from API)
  const loadDepartments = async () => {
    try {
      // const response = await ProfessorService.getDepartments();
      // setDepartments(response.departments);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  // Handle course editing
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsCourseDialogOpen(true);
  };

  // Handle course viewing
  const handleViewCourse = (course: Course) => {
    router.push(`/${locale}/dashboard/professor/courses/${course.id}`);
  };

  // Handle course deletion
  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Handle course deletion confirmation
  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;

    try {
      // API call would go here
      // await ProfessorService.deleteCourse(selectedCourse.id);

      // Update local state
      setCourses(courses.filter(c => c.id !== selectedCourse.id));
      toast.success(t("courseDeleted"));
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error(t("errorDeletingCourse"));
    }
  };

  // Handle course generation/enhancement
  const handleGenerateCourse = (course: Course) => {
    // Simulate AI processing with toast notification
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Update the course with AI-generated content
          const updatedCourses = courses.map(c =>
            c.id === course.id ? { ...c, aiGenerated: true } : c
          );
          setCourses(updatedCourses);
          resolve(void 0);
        }, 2000);
      }),
      {
        loading: t("enhancingCourse"),
        success: t("courseEnhanced"),
        error: t("errorEnhancingCourse"),
      }
    );
  };

  // Handle course save (create/update)
  const handleSaveCourse = async (courseData: CourseFormData) => {
    try {
      if (selectedCourse) {
        // Update existing course
        // await ProfessorService.updateCourse(selectedCourse.id, courseData);

        // Update local state (In a real app this would use the API response)
        const updatedCourses = courses.map(c =>
          c.id === selectedCourse.id ? {
            ...c,
            ...courseData,
            department: courseData.department?.toString(),
            lastUpdated: new Date().toISOString()
          } : c
        );
        setCourses(updatedCourses);
        toast.success(t("courseUpdated"));
      } else {
        // Create new course (would use API in real app)
        const newCourse: Course = {
          id: Date.now(), // Temporary ID generation for demo
          ...courseData,
          department: courseData.department?.toString(),
          status: courseData.status as 'draft' | 'active' | 'archived',
          students: 0,
          progress: 0,
          materials: 0,
          aiGenerated: false,
          lastUpdated: new Date().toISOString()
        };

        setCourses([...courses, newCourse]);

        // Update stats
        setCourseStats({
          ...courseStats,
          courses: courseStats.courses + 1
        });

        toast.success(t("courseCreated"));
      }

      setIsCourseDialogOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(t("errorSavingCourse"));
    }
  };

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    // First filter
    let result = courses.filter(course => {
      const matchesSearch = !searchTerm ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;

      const matchesDepartment = departmentFilter === 'all' ||
        course.department?.toString() === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });

    // Then sort
    return result.sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'students':
          return (b.students || 0) - (a.students || 0);
        case 'updated':
        default:
          return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
      }
    });
  }, [courses, searchTerm, statusFilter, departmentFilter, sortOption]);

  // Initial data loading
  useEffect(() => {
    loadCourses();
    loadDepartments();
  }, []);

  // Reset selected course when dialog closes
  useEffect(() => {
    if (!isCourseDialogOpen) {
      setSelectedCourse(null);
    }
  }, [isCourseDialogOpen]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">
              {t("courses")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("manageYourCourses")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="gap-1 hidden sm:flex"
              onClick={() => router.push(`/${locale}/dashboard/professor/materials`)}
            >
              <FileText className="h-4 w-4" />
              <span>{t("materials")}</span>
            </Button>
            <Button
              onClick={() => {
                setSelectedCourse(null);
                setIsCourseDialogOpen(true);
              }}
              className="gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t("newCourse")}</span>
            </Button>
          </div>
        </div>

        {/* Stats card */}
        <CourseStatsCard stats={courseStats} loading={statsLoading} />
      </div>

      {/* Filters and search */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchCourses")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-2 items-center">
            <div className="w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center">
                    <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span>{t("status")}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="draft">{t("draft")}</SelectItem>
                  <SelectItem value="archived">{t("archived")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <div className="flex items-center">
                    <Library className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span>{t("department")}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allDepartments")}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Select
                value={sortOption}
                onValueChange={setSortOption}
              >
                <SelectTrigger className="w-[150px]">
                  <div className="flex items-center">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <span>{t("sortBy")}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">{t("lastUpdated")}</SelectItem>
                  <SelectItem value="title">{t("title")}</SelectItem>
                  <SelectItem value="code">{t("code")}</SelectItem>
                  <SelectItem value="students">{t("mostStudents")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'subtle' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewMode('grid')}
              >
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="h-2 w-2 rounded-sm bg-current"></div>
                  <div className="h-2 w-2 rounded-sm bg-current"></div>
                  <div className="h-2 w-2 rounded-sm bg-current"></div>
                  <div className="h-2 w-2 rounded-sm bg-current"></div>
                </div>
              </Button>
              <Separator orientation="vertical" className="h-5" />
              <Button
                variant={viewMode === 'list' ? 'subtle' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewMode('list')}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="h-1 w-6 rounded-sm bg-current"></div>
                  <div className="h-1 w-6 rounded-sm bg-current"></div>
                  <div className="h-1 w-6 rounded-sm bg-current"></div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedCourses.length} {filteredAndSortedCourses.length === 1 ? t("course") : t("courses")}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-8"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
                setSortOption('updated');
              }}
            >
              {t("clearFilters")}
            </Button>
          </div>
        </div>
      </div>

      {/* Course list */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h3 className="font-medium">{t("loadingCourses")}</h3>
            <p className="text-sm text-muted-foreground">{t("loadingCoursesDescription")}</p>
          </div>
        </div>
      ) : (
        <>
          {filteredAndSortedCourses.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAndSortedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteCourse}
                    onGenerate={handleGenerateCourse}
                    onView={handleViewCourse}
                  />
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-6 py-3 grid grid-cols-8 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="col-span-3">{t("course")}</div>
                  <div className="col-span-1 text-center">{t("status")}</div>
                  <div className="col-span-1 text-center">{t("students")}</div>
                  <div className="col-span-2 text-center">{t("lastUpdated")}</div>
                  <div className="col-span-1 text-right">{t("actions")}</div>
                </div>
                <div className="divide-y">
                  {filteredAndSortedCourses.map((course) => {
                    const statusColors = {
                      active: "bg-green-100 text-green-800",
                      draft: "bg-amber-100 text-amber-800",
                      archived: "bg-slate-100 text-slate-800"
                    };

                    const formatDate = (dateString?: string) => {
                      if (!dateString) return '';
                      const date = new Date(dateString);
                      return new Intl.DateTimeFormat(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }).format(date);
                    };

                    return (
                      <div key={course.id} className="px-6 py-4 grid grid-cols-8 gap-2 items-center">
                        <div className="col-span-3">
                          <div className="flex items-start">
                            <div className="h-10 w-10 flex-shrink-0 rounded bg-primary/10 flex items-center justify-center mr-3">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium leading-tight">{course.title}</h3>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs text-muted-foreground font-mono">{course.code}</span>
                                {course.aiGenerated && (
                                  <Badge variant="outline" className="bg-violet-50 text-violet-800 text-xs px-1 py-0 h-5 flex items-center">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {t("ai")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-1 text-center">
                          <Badge className={statusColors[course.status]}>
                            {t(course.status)}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-center">
                          <div className="flex items-center justify-center">
                            <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span>{course.students || 0}</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-center text-sm text-muted-foreground">
                          {formatDate(course.lastUpdated)}
                        </div>
                        <div className="col-span-1 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCourse(course)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("view")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateCourse(course)}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                {t("enhance")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteCourse(course)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="border rounded-lg py-16">
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">
                  {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                    ? t("noCoursesMatchingFilters")
                    : t("noCoursesYet")}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                    ? t("tryAdjustingFilters")
                    : t("createYourFirstCourse")}
                </p>

                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDepartmentFilter('all');
                    }}
                  >
                    {t("clearFilters")}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedCourse(null);
                      setIsCourseDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("createFirstCourse")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Course Generation Card */}
      <div className="grid md:grid-cols-2 gap-5 mt-8">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              {t("aiCourseGenerator")}
            </CardTitle>
            <CardDescription>
              {t("aiCourseGeneratorDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="gap-2 w-full sm:w-auto"
              onClick={() => router.push(`/${locale}/dashboard/professor/ai/course-generator`)}
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("generateCourse")}</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-700/30">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <GraduationCap className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
              {t("publishedCourses")}
            </CardTitle>
            <CardDescription>
              {t("publishedCoursesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="text-sm font-medium mb-1 flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-600 dark:text-green-400" />
                  {t("activeCourses")}
                </div>
                <Progress
                  value={
                    courses.length > 0
                      ? (courses.filter(c => c.status === 'active').length / courses.length) * 100
                      : 0
                  }
                  className="h-2 bg-amber-100 dark:bg-amber-950/50"
                />
              </div>
              <Button variant="outline" className="bg-white dark:bg-background border-amber-200 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                {t("publishCourse")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Dialog */}
      <CourseFormDialog
        isOpen={isCourseDialogOpen}
        onClose={() => setIsCourseDialogOpen(false)}
        course={selectedCourse}
        onSave={handleSaveCourse}
        departments={departments}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCourseDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        course={selectedCourse}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};


export default CoursesPage;
