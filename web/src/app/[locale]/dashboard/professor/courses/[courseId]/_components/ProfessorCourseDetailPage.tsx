"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { ProfessorService } from '@/services/ProfessorService';
import { fileService } from '@/services/FileService';
import { toast } from 'sonner';
import { AIMaterialGeneration } from '@/services/ProfessorService';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ChevronRight,
  Calendar,
  Sparkles,
  FileText,
  Pencil,
  Save,
  X,
  Plus,
  Upload,
  BookOpen,
  ListChecks,
  Lightbulb,
  Brain,
  MessageSquareMore,
  FileUp,
  Download,
  Users,
  PlayCircle,
  BookOpen as BookFill,
  BarChart,
  Shield,
  Clock,
  GraduationCap
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// AI-related components
const AIAssistantPanel = ({ course, onSuggestionApply }) => {
  const { t } = useTranslation();
  const [aiMode, setAiMode] = useState('suggestions');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Generate initial suggestions based on course data
    if (course) {
      generateSuggestions();
    }
  }, [course]);

  const generateSuggestions = async () => {
    try {
      setIsLoading(true);
      // In a real app, we would call the AI service
      // For demo purposes, generate some suggestions based on course data
      const demoSuggestions = [
        {
          id: 1,
          title: t("improveObjectives"),
          description: t("aiCanRefineYourObjectives"),
          preview: t("refinedObjectivesPreview"),
          type: 'objectives'
        },
        {
          id: 2,
          title: t("syllabusSuggestion"),
          description: t("aiCanOptimizeSyllabus"),
          preview: t("optimizedSyllabusPreview"),
          type: 'syllabus'
        },
        {
          id: 3,
          title: t("prerequisitesSuggestion"),
          description: t("aiCanSuggestPrerequisites"),
          preview: t("suggestedPrerequisitesPreview"),
          type: 'prerequisites'
        }
      ];

      setTimeout(() => {
        setSuggestions(demoSuggestions);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Error generating suggestions:", error);
      setIsLoading(false);
      toast.error(t("errorGeneratingSuggestions"));
    }
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      setResponse('');

      // In a real app, we would call the AI service
      // For demo purposes, simulate a response
      setTimeout(() => {
        setResponse(t("aiResponseDemo", { prompt }));
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error("Error getting AI response:", error);
      setIsLoading(false);
      toast.error(t("errorGettingAiResponse"));
    }
  };

  const applySuggestion = (suggestion) => {
    onSuggestionApply(suggestion);
    toast.success(t("suggestionApplied"));
  };

  return (
    <Card className="relative border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-primary" />
            <CardTitle className="text-lg">{t("courseAssistant")}</CardTitle>
          </div>
          <div className="space-x-1">
            <Button
              size="sm"
              variant={aiMode === 'suggestions' ? "default" : "outline"}
              onClick={() => setAiMode('suggestions')}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {t("suggestions")}
            </Button>
            <Button
              size="sm"
              variant={aiMode === 'chat' ? "default" : "outline"}
              onClick={() => setAiMode('chat')}
            >
              <MessageSquareMore className="h-4 w-4 mr-1" />
              {t("chat")}
            </Button>
          </div>
        </div>
        <CardDescription>
          {aiMode === 'suggestions'
            ? t("aiSuggestionsDescription")
            : t("aiChatDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {aiMode === 'suggestions' ? (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="bg-background/70 cursor-pointer hover:bg-background transition-colors">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm font-medium">{suggestion.title}</CardTitle>
                      <CardDescription className="text-xs">{suggestion.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <p className="text-xs italic text-muted-foreground">{suggestion.preview}</p>
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => applySuggestion(suggestion)}>
                        {t("apply")}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full border border-dashed border-primary/40 hover:border-primary"
                  onClick={generateSuggestions}
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  {t("refreshSuggestions")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-background/70 p-4 max-h-[300px] overflow-y-auto">
              {response ? (
                <div className="text-sm">{response}</div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  {t("aiChatPlaceholder")}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Textarea
                placeholder={t("askAboutCourse")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[60px] resize-none bg-background/70"
              />
              <Button
                size="icon"
                className="h-[60px]"
                disabled={isLoading || !prompt.trim()}
                onClick={handlePromptSubmit}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Sparkles decoration */}
      <div className="absolute -bottom-3 -right-3 w-20 h-20 opacity-10">
        <Sparkles className="w-full h-full text-primary" />
      </div>
    </Card>
  );
};

// Course materials section
const MaterialsSection = ({ course, editing, materials, setMaterials, onAddMaterial }: any) => {
  const { t } = useTranslation();
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    type: 'lecture_notes',
  });


  // Fetch materials for this course
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!course?.id) return;

      setLoading(true);
      try {
        // Get materials using the ProfessorService
        const response = await ProfessorService.getMaterials({ course_id: course.id });
        setMaterials(response.materials || []);
      } catch (error) {
        console.error("Error fetching course materials:", error);
        toast.error(t("errorFetchingMaterials"));
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [course?.id, t]);

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim()) {
      toast.error(t("materialTitleRequired"));
      return;
    }

    try {
      setLoading(true);
      // Create a new material through the ProfessorService
      const createdMaterial = await ProfessorService.createMaterial({
        ...newMaterial,
        course_id: course.id,
      });

      // Update the local state with the new material
      setMaterials([...materials, createdMaterial]);
      toast.success(t("materialAdded"));

      // Reset form and close dialog
      setNewMaterial({
        title: '',
        description: '',
        type: 'lecture_notes',
      });
      setIsAddingMaterial(false);

      // Call the parent handler if provided
      if (onAddMaterial) {
        onAddMaterial(createdMaterial);
      }
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error(t("errorAddingMaterial"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm(t("confirmDeleteMaterial"))) return;

    try {
      setLoading(true);
      // Delete the material through the ProfessorService
      await ProfessorService.deleteMaterial(materialId);

      // Update the local state by removing the deleted material
      setMaterials(materials.filter(m => m.id !== materialId));
      toast.success(t("materialDeleted"));
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error(t("errorDeletingMaterial"));
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'lecture_notes':
        return <FileText className="h-4 w-4" />;
      case 'presentation':
        return <PlayCircle className="h-4 w-4" />;
      case 'worksheet':
        return <ListChecks className="h-4 w-4" />;
      case 'example':
        return <BookOpen className="h-4 w-4" />;
      case 'reference':
        return <BookFill className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMaterialTypeName = (type) => {
    switch (type) {
      case 'lecture_notes':
        return t("lectureNotes");
      case 'presentation':
        return t("presentation");
      case 'worksheet':
        return t("worksheet");
      case 'example':
        return t("example");
      case 'reference':
        return t("reference");
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">{t("courseMaterials")}</h3>
        {editing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingMaterial(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("addMaterial")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            {editing ? t("noMaterialsYet") : t("noMaterialsAvailable")}
          </p>
          {editing && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddingMaterial(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("addFirstMaterial")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((material) => (
            <Card key={material.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="mr-2 mt-1 text-primary">
                      {getMaterialIcon(material.material_type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{material.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {getMaterialTypeName(material.material_type)}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {material.file_url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={material.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("downloadMaterial")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {editing && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteMaterial(material.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("deleteMaterial")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">{material.description}</p>
                {material.file_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {material.file_name}
                    {material.file_size && (
                      <span className="ml-1">
                        ({Math.round(material.file_size / 1024)} KB)
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                {material.ai_enhanced && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    {t("aiEnhanced")}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/dashboard/professor/materials/${material.id}`, '_blank')}
                >
                  {t("viewDetails")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCourseMaterial")}</DialogTitle>
            <DialogDescription>
              {t("addMaterialDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("materialTitle")}</label>
              <Input
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                placeholder={t("materialTitlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("materialType")}</label>
              <Select
                value={newMaterial.type}
                onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectMaterialType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture_notes">{t("lectureNotes")}</SelectItem>
                  <SelectItem value="presentation">{t("presentation")}</SelectItem>
                  <SelectItem value="worksheet">{t("worksheet")}</SelectItem>
                  <SelectItem value="example">{t("example")}</SelectItem>
                  <SelectItem value="reference">{t("reference")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("materialDescription")}</label>
              <Textarea
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder={t("materialDescriptionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("uploadFile")}</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{t("dragAndDropFile")}</p>
                <Button size="sm" variant="outline" className="mt-2">
                  {t("browseFiles")}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMaterial(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAddMaterial}>
              {t("addMaterial")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Students section
const StudentsSection = ({ courseId }: { courseId: string }) => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        // In a real app, fetch students enrolled in this course
        const response = await ProfessorService.getCourseStudents(courseId);
        setStudents(response.students || []);
      } catch (error) {
        console.error("Error loading students:", error);
        toast.error(t("errorLoadingStudents"));
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      loadStudents();
    }
  }, [courseId, t]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">{t("enrolledStudents")}</h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Users className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            {t("noStudentsEnrolled")}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {students.map((student: any) => (
            <div key={student.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("enrolledOn", { date: student.enrollment_date })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {student.grade && (
                  <Badge variant={student.grade >= 70 ? "default" : "secondary"}>
                    {student.grade}/100
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {student.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Full-width CourseDetailPage that handles all functionality
export default function CourseDetailPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const params = useParams();
  const courseId = params.courseId;
  const router = useRouter();

  // State for course data
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedCourse, setEditedCourse] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');

  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!courseId) return;

      try {
        // Get materials using the ProfessorService
        const response = await ProfessorService.getMaterials({ course_id: courseId });
        setMaterials(response.materials || []);
      } catch (error) {
        console.error("Error fetching course materials:", error);
        toast.error(t("errorFetchingMaterials"));
        setMaterials([]);
      }
    };

    fetchMaterials();
  }, [courseId, t]);

  // Fetch course data
  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      try {
        const courseData = await ProfessorService.getCourse(courseId);
        setCourse(courseData);
        setEditedCourse(JSON.parse(JSON.stringify(courseData))); // Deep copy for editing
      } catch (error) {
        console.error("Error loading course:", error);
        toast.error(t("errorLoadingCourse"));
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
  }, [courseId, t]);

  // Handle content changes in edit mode
  const handleContentChange = (field, value) => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };

      // Handle nested fields with dot notation
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        updatedCourse[parent] = {
          ...updatedCourse[parent],
          [child]: value
        };
      } else {
        updatedCourse[field] = value;
      }

      setEditedCourse(updatedCourse);
    }
  };

  // Handle changes to array items
  const handleArrayItemChange = (field, index, value) => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };
      updatedCourse[field][index] = value;
      setEditedCourse(updatedCourse);
    }
  };

  // Add new item to array
  const handleAddArrayItem = (field, defaultValue = "") => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };
      if (!updatedCourse[field]) {
        updatedCourse[field] = [];
      }
      updatedCourse[field].push(defaultValue);
      setEditedCourse(updatedCourse);
    }
  };

  // Remove item from array
  const handleRemoveArrayItem = (field, index) => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };
      updatedCourse[field].splice(index, 1);
      setEditedCourse(updatedCourse);
    }
  };

  // Add week to syllabus
  const handleAddWeek = () => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };

      if (!updatedCourse.syllabus) {
        updatedCourse.syllabus = {};
      }

      if (!updatedCourse.syllabus.weeks) {
        updatedCourse.syllabus.weeks = [];
      }

      const newWeekNumber = updatedCourse.syllabus.weeks.length + 1;

      updatedCourse.syllabus.weeks.push({
        week: newWeekNumber,
        title: `${t("week")} ${newWeekNumber}`,
        topics: []
      });

      setEditedCourse(updatedCourse);
    }
  };

  // Add topic to week
  const handleAddTopicToWeek = (weekIndex) => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };

      if (!updatedCourse.syllabus.weeks[weekIndex].topics) {
        updatedCourse.syllabus.weeks[weekIndex].topics = [];
      }

      updatedCourse.syllabus.weeks[weekIndex].topics.push(t("newTopic"));
      setEditedCourse(updatedCourse);
    }
  };

  // Handle topic change in a week
  const handleWeekTopicChange = (weekIndex, topicIndex, value) => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };
      updatedCourse.syllabus.weeks[weekIndex].topics[topicIndex] = value;
      setEditedCourse(updatedCourse);
    }
  };

  // Handle week title change
  const handleWeekTitleChange = (weekIndex, value) => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse };
      updatedCourse.syllabus.weeks[weekIndex].title = value;
      setEditedCourse(updatedCourse);
    }
  };

  // Handle AI suggestions
  const handleApplySuggestion = (suggestion) => {
    if (!editing) {
      setEditing(true);
    }

    setUnsavedChanges(true);
    const updatedCourse = { ...editedCourse };

    // Apply suggestion based on type
    switch (suggestion.type) {
      case 'objectives':
        // For demo purposes, add an improved objective
        if (!updatedCourse.learning_objectives) {
          updatedCourse.learning_objectives = [];
        }
        updatedCourse.learning_objectives.push(
          t("aiSuggestedObjective")
        );
        break;

      case 'syllabus':
        // For demo purposes, add a new week with topics
        if (!updatedCourse.syllabus) {
          updatedCourse.syllabus = { weeks: [] };
        }
        if (!updatedCourse.syllabus.weeks) {
          updatedCourse.syllabus.weeks = [];
        }

        const weekNum = updatedCourse.syllabus.weeks.length + 1;
        updatedCourse.syllabus.weeks.push({
          week: weekNum,
          title: `${t("week")} ${weekNum}: ${t("aiSuggestedWeekTitle")}`,
          topics: [
            t("aiSuggestedTopic1"),
            t("aiSuggestedTopic2"),
            t("aiSuggestedTopic3")
          ]
        });
        break;

      case 'prerequisites':
        // For demo purposes, add suggested prerequisites
        if (!updatedCourse.prerequisites) {
          updatedCourse.prerequisites = [];
        }
        updatedCourse.prerequisites.push(
          t("aiSuggestedPrerequisite")
        );
        break;

      default:
        break;
    }

    setEditedCourse(updatedCourse);
  };

  // Handle adding a new material
  const handleAddMaterial = (newMaterial) => {
    // In a real app, this would be sent to the backend
    const materialWithId = {
      ...newMaterial,
      id: Date.now(), // temporary ID
      aiEnhanced: false
    };

    setMaterials([...materials, materialWithId]);
    toast.success(t("materialAdded"));
  };

  // Save changes
  const handleSave = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would update the course via API
      await ProfessorService.updateCourse(courseId, editedCourse);
      setCourse(editedCourse);
      setEditing(false);
      setUnsavedChanges(false);
      toast.success(t("changesSaved"));
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(t("errorSavingChanges"));
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing and discard changes
  const handleCancel = () => {
    setEditedCourse(JSON.parse(JSON.stringify(course))); // Reset to original
    setEditing(false);
    setUnsavedChanges(false);
  };

  // Handle editable content with contentEditable
  const EditableContent = ({
    value,
    onChange,
    className = "",
    isTextArea = false
  }) => {
    const handleInput = (e) => {
      onChange(e.target.innerText || e.target.textContent);
    };

    return React.createElement(
      isTextArea ? 'div' : 'span',
      {
        className: `outline-none ${editing ? 'border-b border-dashed border-gray-300 focus:border-primary' : ''} ${className}`,
        contentEditable: editing,
        suppressContentEditableWarning: true,
        onInput: handleInput,
        dangerouslySetInnerHTML: { __html: value || '' }
      }
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Error state - course not found
  if (!course) {
    return (
      <div className="flex justify-center items-center h-full py-12 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-medium mb-4">{t("courseNotFound")}</h2>
          <p className="text-muted-foreground mb-6">{t("courseNotFoundDesc")}</p>
          <Button
            onClick={() => router.push(`/${locale}/dashboard/professor/courses`)}
          >
            {t("backToCourses")}
          </Button>
        </div>
      </div>
    );
  }

  const activeData: any = editing ? editedCourse : course;

  return (
    <div className="w-full mx-auto px-4 pb-16">
      {/* Floating editing toolbar when in edit mode */}
      {editing && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-3 flex justify-between items-center">
          <div className="text-sm font-medium flex items-center">
            <Pencil className="h-4 w-4 mr-2 text-primary" />
            {t("editingMode")}
            {unsavedChanges && <span className="ml-2 text-orange-500">• {t("unsavedChanges")}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              {t("cancel")}
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              {t("saveChanges")}
            </Button>
          </div>
        </div>
      )}

      {/* Document header with status badges and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm font-normal">
            <EditableContent
              value={activeData.code}
              onChange={(value) => handleContentChange('code', value)}
            />
          </Badge>
          <span className="text-muted-foreground text-sm">
            <EditableContent
              value={activeData.academic_year}
              onChange={(value) => handleContentChange('academic_year', value)}
            />
          </span>
          <Badge
            variant={activeData.status === 'active' ? 'default' :
              activeData.status === 'draft' ? 'secondary' :
                'outline'}
            className="capitalize"
          >
            {activeData.status || 'unknown'}
          </Badge>

          {activeData.ai_tutoring_enabled && (
            <Badge variant="outline" className="bg-primary/10 gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{t("aiEnabled")}</span>
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              {t("edit")}
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4 mr-1" />
                {t("actions")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <div className="flex flex-col py-1">
                <Button variant="ghost" size="sm" className="justify-start h-9 px-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {t("exportCourse")}
                </Button>
                <Button variant="ghost" size="sm" className="justify-start h-9 px-2">
                  <Users className="h-4 w-4 mr-2" />
                  {t("manageStudents")}
                </Button>
                <Button variant="ghost" size="sm" className="justify-start h-9 px-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("generateMaterials")}
                </Button>
                <Separator className="my-1" />
                <Button variant="ghost" size="sm" className="justify-start h-9 px-2 text-destructive">
                  <Shield className="h-4 w-4 mr-2" />
                  {t("archiveCourse")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-normal mb-4">
        <EditableContent
          value={activeData.title}
          className="w-full"
          onChange={(value) => handleContentChange('title', value)}
        />
      </h1>

      {/* Main content with tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {t("overview")}
              </TabsTrigger>
              <TabsTrigger value="syllabus" className="flex items-center gap-1">
                <ListChecks className="h-4 w-4" />
                {t("syllabus")}
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {t("materials")}
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t("students")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Description section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{t("courseDescription")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableContent
                    value={activeData.description}
                    className="w-full block"
                    isTextArea={true}
                    onChange={(value) => handleContentChange('description', value)}
                  />
                </CardContent>
              </Card>

              {/* Course time details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{t("courseDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    {activeData.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t("duration")}:</span>
                        <span>
                          {new Date(activeData.start_date).toLocaleDateString()} -
                          {activeData.end_date ? new Date(activeData.end_date).toLocaleDateString() : t("ongoing")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t("credits")}:</span>
                      <EditableContent
                        value={activeData.credits?.toString() || "N/A"}
                        onChange={(value) => handleContentChange('credits', parseFloat(value) || null)}
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t("educationLevel")}:</span>
                      <EditableContent
                        value={activeData.education_level || "N/A"}
                        onChange={(value) => handleContentChange('education_level', value)}
                      />
                    </div>

                    {activeData.academic_track && (
                      <div className="flex items-center gap-1">
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t("track")}:</span>
                        <EditableContent
                          value={activeData.academic_track}
                          onChange={(value) => handleContentChange('academic_track', value)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Learning objectives */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{t("learningObjectives")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {activeData.learning_objectives && activeData.learning_objectives.map((objective, i) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0 mr-2 mt-1 w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div className="flex-grow">
                          <EditableContent
                            value={objective}
                            onChange={(value) => handleArrayItemChange('learning_objectives', i, value)}
                          />
                          {editing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 ml-2 text-destructive hover:text-destructive/80"
                              onClick={() => handleRemoveArrayItem('learning_objectives', i)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}

                    {editing && (
                      <li className="text-primary italic cursor-pointer flex items-center" onClick={() => handleAddArrayItem('learning_objectives', t("newObjective"))}>
                        <Plus className="h-4 w-4 mr-1" /> {t("addObjective")}
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Prerequisites */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{t("prerequisites")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeData.prerequisites && activeData.prerequisites.length > 0 ? (
                    <ul className="space-y-2">
                      {activeData.prerequisites.map((prerequisite, i) => (
                        <li key={i} className="flex items-start">
                          <div className="flex-shrink-0 mr-2 mt-1">•</div>
                          <div className="flex-grow">
                            <EditableContent
                              value={prerequisite}
                              onChange={(value) => handleArrayItemChange('prerequisites', i, value)}
                            />
                            {editing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 ml-2 text-destructive hover:text-destructive/80"
                                onClick={() => handleRemoveArrayItem('prerequisites', i)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}

                      {editing && (
                        <li className="text-primary italic cursor-pointer flex items-center" onClick={() => handleAddArrayItem('prerequisites', t("newPrerequisite"))}>
                          <Plus className="h-4 w-4 mr-1" /> {t("addPrerequisite")}
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground italic">
                      {editing ? (
                        <div className="cursor-pointer" onClick={() => handleAddArrayItem('prerequisites', t("newPrerequisite"))}>
                          <Plus className="h-4 w-4 inline-block mr-1" />
                          {t("addFirstPrerequisite")}
                        </div>
                      ) : (
                        t("noPrerequisites")
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Suggested topics */}
              {activeData.suggested_topics && activeData.suggested_topics.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{t("suggestedTopics")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {activeData.suggested_topics.map((topic, i) => (
                        <Badge key={i} variant="outline" className="text-sm">
                          {editing ? (
                            <>
                              <EditableContent
                                value={topic}
                                onChange={(value) => handleArrayItemChange('suggested_topics', i, value)}
                                className="max-w-[120px]"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 ml-1 p-0 text-destructive hover:text-destructive/80"
                                onClick={() => handleRemoveArrayItem('suggested_topics', i)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <span>{topic}</span>
                          )}
                        </Badge>
                      ))}

                      {editing && (
                        <Badge
                          variant="outline"
                          className="text-xs text-primary cursor-pointer"
                          onClick={() => handleAddArrayItem('suggested_topics', t("newTopic"))}
                        >
                          <Plus className="h-3 w-3 mr-1" /> {t("addTopic")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="syllabus" className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{t("courseSyllabus")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeData.syllabus?.weeks ? (
                    <div className="space-y-6">
                      {activeData.syllabus.weeks.map((week, weekIndex) => (
                        <Card key={weekIndex} className="bg-secondary/10 overflow-hidden">
                          <CardHeader className="py-2 px-4 bg-secondary/20">
                            <h3 className="font-medium text-lg">
                              <EditableContent
                                value={week.title || `${t("week")} ${week.week}`}
                                onChange={(value) => handleWeekTitleChange(weekIndex, value)}
                              />
                            </h3>
                          </CardHeader>
                          <CardContent className="p-4">
                            {week.topics && week.topics.length > 0 ? (
                              <ul className="space-y-2">
                                {week.topics.map((topic, topicIndex) => (
                                  <li key={topicIndex} className="flex items-start">
                                    <div className="flex-shrink-0 mr-2">•</div>
                                    <EditableContent
                                      value={topic}
                                      onChange={(value) => handleWeekTopicChange(weekIndex, topicIndex, value)}
                                    />
                                  </li>
                                ))}

                                {editing && (
                                  <li
                                    className="text-primary italic cursor-pointer flex items-center"
                                    onClick={() => handleAddTopicToWeek(weekIndex)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> {t("addTopic")}
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <div className="text-muted-foreground italic text-center py-2">
                                {editing ? (
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => handleAddTopicToWeek(weekIndex)}
                                  >
                                    <Plus className="h-4 w-4 inline-block mr-1" />
                                    {t("addFirstTopic")}
                                  </div>
                                ) : (
                                  t("noTopicsForWeek")
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {editing && (
                        <Button
                          variant="outline"
                          className="w-full border-dashed"
                          onClick={handleAddWeek}
                        >
                          <Plus className="h-4 w-4 mr-1" /> {t("addWeek")}
                        </Button>
                      )}
                    </div>
                  ) : activeData.syllabus?.topics ? (
                    <div className="space-y-2">
                      {activeData.syllabus.topics.map((topic, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <p>
                            <EditableContent
                              value={topic}
                              onChange={(value) => {
                                const updatedCourse = { ...editedCourse };
                                updatedCourse.syllabus.topics[i] = value;
                                setEditedCourse(updatedCourse);
                                setUnsavedChanges(true);
                              }}
                            />
                          </p>
                        </div>
                      ))}

                      {editing && (
                        <div
                          className="text-primary italic cursor-pointer flex items-center gap-1 ml-7"
                          onClick={() => {
                            const updatedCourse = { ...editedCourse };
                            if (!updatedCourse.syllabus.topics) {
                              updatedCourse.syllabus.topics = [];
                            }
                            updatedCourse.syllabus.topics.push(t("newTopic"));
                            setEditedCourse(updatedCourse);
                            setUnsavedChanges(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> {t("addTopic")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <EditableContent
                        value={typeof activeData.syllabus === 'string' ? activeData.syllabus : t("syllabusNotStructured")}
                        onChange={(value) => handleContentChange('syllabus', value)}
                        isTextArea={true}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add AI syllabus generator card when in edit mode */}
              {editing && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-primary" />
                      <CardTitle>{t("aiSyllabusGenerator")}</CardTitle>
                    </div>
                    <CardDescription>
                      {t("aiSyllabusGeneratorDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("syllabusType")}
                        </label>
                        <Select defaultValue="weekly">
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectSyllabusType")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">{t("weeklySchedule")}</SelectItem>
                            <SelectItem value="topics">{t("topicBased")}</SelectItem>
                            <SelectItem value="modules">{t("moduleBased")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("courseIntensity")}
                        </label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectIntensity")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">{t("light")}</SelectItem>
                            <SelectItem value="medium">{t("medium")}</SelectItem>
                            <SelectItem value="intensive">{t("intensive")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t("specificTopics")}
                        </label>
                        <Textarea
                          placeholder={t("enterSpecificTopics")}
                          className="resize-none"
                        />
                      </div>

                      <Button className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t("generateSyllabus")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              <MaterialsSection
                course={activeData}
                editing={editing}
                materials={materials}
                setMaterials={setMaterials}
                onAddMaterial={(material) => {
                  // Update the materials state when a new material is added
                  setMaterials([...materials, material]);
                  toast.success(t("materialAdded"));
                  setCurrentTab('materials');
                }}
              />
            </TabsContent>

            <TabsContent value="students" className="space-y-6">
              <StudentsSection courseId={courseId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar with AI assistant */}
        <div className="space-y-6">
          <AIAssistantPanel
            course={activeData}
            onSuggestionApply={handleApplySuggestion}
          />

          {/* AI Material Generation for courses */}
          {editing && (
            <AIMaterialGeneration
              courseId={courseId}
              onGenerationComplete={(result) => {
                // Handle generation results
                if (result.materials) {
                  // Refresh materials tab
                  toast.success(t("materialsGeneratedSuccessfully"));
                  setCurrentTab('materials');
                } else if (result.syllabus) {
                  // Update syllabus in edited course data
                  const updatedCourse = { ...editedCourse };
                  updatedCourse.syllabus = result.syllabus;
                  setEditedCourse(updatedCourse);
                  setUnsavedChanges(true);
                  toast.success(t("syllabusGeneratedSuccessfully"));
                  setCurrentTab('syllabus');
                } else if (result.assessment) {
                  // Handle assessment creation
                  toast.success(t("assessmentGeneratedSuccessfully"));
                }
              }}
            />
          )}

          {/* Quick metrics card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("courseMetrics")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">{t("students")}</p>
                  <p className="text-2xl font-medium">
                    {activeData.course_enrollments?.length || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">{t("materials")}</p>
                  <p className="text-2xl font-medium">{materials.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">{t("assignments")}</p>
                  <p className="text-2xl font-medium">
                    {activeData.assignments?.length || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">{t("avgGrade")}</p>
                  <p className="text-2xl font-medium">--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ScrollArea className="h-[240px] pr-4">
                <div className="relative pl-6 border-l">
                  {/* Activity items */}
                  <div className="mb-4 relative">
                    <div className="absolute -left-[13px] top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm font-medium">{t("materialAdded")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("today")} • 10:45 AM
                    </p>
                  </div>

                  <div className="mb-4 relative">
                    <div className="absolute -left-[13px] top-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm font-medium">{t("newStudentEnrolled")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("yesterday")} • 2:30 PM
                    </p>
                  </div>

                  <div className="mb-4 relative">
                    <div className="absolute -left-[13px] top-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Pencil className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm font-medium">{t("courseEdited")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("daysAgo", { days: 2 })} • 11:20 AM
                    </p>
                  </div>

                  <div className="mb-4 relative">
                    <div className="absolute -left-[13px] top-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <BookFill className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm font-medium">{t("syllabusUpdated")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("daysAgo", { days: 3 })} • 9:15 AM
                    </p>
                  </div>

                  <div className="mb-4 relative">
                    <div className="absolute -left-[13px] top-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <PlayCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm font-medium">{t("newVideoAdded")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("daysAgo", { days: 5 })} • 3:45 PM
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Publishing options card when in draft mode */}
          {activeData.status === 'draft' && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 dark:text-green-400">
                  {t("readyToPublish")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                  {t("publishCourseDesc")}
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  {t("publishCourse")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
