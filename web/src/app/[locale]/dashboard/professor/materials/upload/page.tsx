// File: app/[locale]/dashboard/professor/materials/upload/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { ProfessorService } from '@/services/ProfessorService';
import { ProfessorMaterialsService, MaterialType, CourseMaterial } from '@/services/ProfessorMaterialsService';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Icons
import {
  BookOpen,
  FileText,
  FileImage,
  FileVideo,
  File,
  Plus,
  Upload,
  Tag,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  ArrowLeft,
  X,
  Loader2
} from 'lucide-react';

// File upload component with drag and drop
const FileUploadArea = ({ onFileSelected, file, accept }: { onFileSelected: (file: File) => void, file: File | null, accept: string }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const clearFile = () => {
    // @ts-ignore
    onFileSelected(null);
    if (fileInputRef.current) {
      (fileInputRef.current as any).value = '';
    }
  };

  // Helper to get file icon
  const getFileIcon = (file: File | null) => {
    if (!file) return <Upload className="h-16 w-16 text-muted-foreground" />;

    const fileType = file.type;
    if (fileType.includes('image')) {
      return <FileImage className="h-16 w-16 text-blue-500" />;
    } else if (fileType.includes('video')) {
      return <FileVideo className="h-16 w-16 text-red-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-16 w-16 text-orange-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-16 w-16 text-indigo-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileText className="h-16 w-16 text-green-500" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileText className="h-16 w-16 text-yellow-500" />;
    } else {
      return <File className="h-16 w-16 text-gray-500" />;
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => (fileInputRef.current as any).click()}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
      />

      <div className="flex flex-col items-center gap-2">
        {file ? (
          <>
            <div className="mb-2">{getFileIcon(file)}</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {file.type || 'Unknown type'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
            <p className="font-medium text-sm mt-2">{file.name}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="mt-2"
            >
              <X className="h-4 w-4 mr-1" />
              {t("removeFile")}
            </Button>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground/70 mb-2" />
            <p className="text-lg font-medium">{t("dragAndDropFile")}</p>
            <p className="text-sm text-muted-foreground">{t("orClickToUpload")}</p>
            {accept && (
              <p className="text-xs text-muted-foreground mt-4">
                {t("acceptedFormats")}: {accept}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Main Upload Material Page Component
const UploadMaterialPage = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();

  // State
  const [courses, setCourses] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [materialType, setMaterialType] = useState<MaterialType>('lecture_notes');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: 0,
    unit: '',
    tags: [] as string[],
    visibility: 'students' as 'students' | 'professors' | 'public',
    requires_completion: false
  });
  const [newTag, setNewTag] = useState('');

  // Load courses
  const loadCourses = async () => {
    try {
      const response = await ProfessorService.getCourses();
      if (response && response.courses) {
        setCourses(response.courses as any);
        if (response.courses.length > 0) {
          setFormData(prev => ({ ...prev, course_id: response.courses[0].id }));
        }
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast.error(t("errorLoadingCourses"));
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = [...formData.tags];
    newTags.splice(index, 1);
    setFormData({ ...formData, tags: newTags });
  };

  // Handle material type selection
  const handleMaterialTypeChange = (type: MaterialType) => {
    setMaterialType(type);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error(t("pleaseSelectFile"));
      return;
    }

    if (formData.course_id === 0) {
      toast.error(t("pleaseSelectCourse"));
      return;
    }

    setUploading(true);

    try {
      // Create the material with the selected file
      await ProfessorMaterialsService.createMaterial(
        {
          ...formData,
          material_type: materialType
        } as CourseMaterial,
        selectedFile
      );

      toast.success(t("materialUploaded"));

      // Navigate back to materials page
      router.push(`/${locale}/dashboard/professor/materials`);
    } catch (error) {
      console.error("Error uploading material:", error);
      toast.error(t("errorUploadingMaterial"));
    } finally {
      setUploading(false);
    }
  };

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            {t("uploadMaterial")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("uploadMaterialDescription")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("fileUpload")}</CardTitle>
            <CardDescription>
              {t("fileUploadDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadArea
              onFileSelected={setSelectedFile as any}
              file={selectedFile}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.jpg,.jpeg,.png,.mp4,.avi"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("materialDetails")}</CardTitle>
            <CardDescription>
              {t("materialDetailsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("title")}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t("materialTitlePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange as any}
                placeholder={t("materialDescriptionPlaceholder")}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{t("unit")}</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder={t("unitPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("materialType")}</Label>
              <Tabs
                defaultValue="lecture_notes"
                value={materialType}
                onValueChange={(value) => handleMaterialTypeChange(value as MaterialType)}
                className="w-full mt-2"
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
                  <TabsTrigger value="lecture_notes">{t("lecture_notes")}</TabsTrigger>
                  <TabsTrigger value="presentation">{t("presentation")}</TabsTrigger>
                  <TabsTrigger value="worksheet">{t("worksheet")}</TabsTrigger>
                  <TabsTrigger value="assignment">{t("assignment")}</TabsTrigger>
                  <TabsTrigger value="reference">{t("reference")}</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 md:grid-cols-4">
                  <TabsTrigger value="example">{t("example")}</TabsTrigger>
                  <TabsTrigger value="syllabus">{t("syllabus")}</TabsTrigger>
                  <TabsTrigger value="exam">{t("exam")}</TabsTrigger>
                  <TabsTrigger value="other">{t("other")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">{t("visibility")}</Label>
              <Select
                name="visibility"
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value as 'students' | 'professors' | 'public' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectVisibility")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="students">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      {t("visibleToStudents")}
                    </div>
                  </SelectItem>
                  <SelectItem value="professors">
                    <div className="flex items-center">
                      <EyeOff className="h-4 w-4 mr-2" />
                      {t("visibleToProfessors")}
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      {t("visibleToPublic")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("tags")}</Label>
              <div className="flex mt-1 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t("addTagPlaceholder")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} className="ml-2">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveTag(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {formData.tags.length === 0 && (
                  <span className="text-sm text-muted-foreground">{t("noTagsAdded")}</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="requires_completion"
                checked={formData.requires_completion}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requires_completion: checked as boolean })
                }
              />
              <Label htmlFor="requires_completion">
                {t("requiresCompletion")}
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/dashboard/professor/materials`)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={uploading} className="min-w-[120px]">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("uploading")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t("uploadMaterial")}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* AI enhancement option */}
      <Card className="mt-6 bg-muted/30 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            {t("aiEnhancement")}
          </CardTitle>
          <CardDescription>
            {t("aiEnhancementDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center">
              <Check className="text-primary h-5 w-5 mr-2" />
              <span>{t("automaticContentAnalysis")}</span>
            </div>
            <div className="flex items-center">
              <Check className="text-primary h-5 w-5 mr-2" />
              <span>{t("questionGeneration")}</span>
            </div>
            <div className="flex items-center">
              <Check className="text-primary h-5 w-5 mr-2" />
              <span>{t("summaryCreation")}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t("aiEnhancementNote")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadMaterialPage;
