"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { ProfessorService } from '@/services/ProfessorService';
import { ProfessorMaterialsService, CourseMaterial, MaterialType } from '@/services/ProfessorMaterialsService';
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
    FileImage,
    File,
    Search,
    Edit,
    Trash2,
    Download,
    Sparkles,
    MoreHorizontal,
    Eye,
    EyeOff,
    Tag,
    Loader2,
    Upload
} from 'lucide-react';

// Material Item Component
const MaterialItem = ({ material, onEdit, onDelete, onDownload, onEnhance }: any) => {
    const { t } = useTranslation();
    const locale = useLocale();

    // Helper to get material type icon
    const getMaterialIcon = (type: MaterialType) => {
        switch (type) {
            case 'presentation':
                return <FileImage className="h-5 w-5 text-orange-500" />;
            case 'lecture_notes':
                return <FileText className="h-5 w-5 text-blue-500" />;
            case 'worksheet':
                return <FileText className="h-5 w-5 text-green-500" />;
            case 'example':
                return <File className="h-5 w-5 text-purple-500" />;
            case 'reference':
                return <BookOpen className="h-5 w-5 text-indigo-500" />;
            case 'assignment':
                return <FileText className="h-5 w-5 text-red-500" />;
            case 'exam':
                return <FileText className="h-5 w-5 text-yellow-500" />;
            case 'syllabus':
                return <FileText className="h-5 w-5 text-teal-500" />;
            default:
                return <File className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            {getMaterialIcon(material.material_type)}
                        </div>
                        <div>
                            <h3 className="font-medium">{material.title}</h3>
                            <p className="text-sm text-muted-foreground">{material.description}</p>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline">
                                    {t(material.material_type)}
                                </Badge>
                                {material.ai_enhanced && (
                                    <Badge variant="outline" className="bg-primary/10 text-primary">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {t("aiEnhanced")}
                                    </Badge>
                                )}
                                {material.tags && material.tags.length > 0 && (
                                    material.tags.slice(0, 2).map((tag: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))
                                )}
                                {material.tags && material.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{material.tags.length - 2}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(material)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDownload(material)}>
                                <Download className="h-4 w-4 mr-2" />
                                {t("download")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEnhance(material)}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                {t("enhance")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(material)} className="text-destructive focus:text-destructive">
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

// Material Dialog Component
const MaterialDialog = ({ isOpen, onClose, material, onSave, courses }:any) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        material_type: 'lecture_notes' as MaterialType,
        course_id: 0,
        unit: '',
        tags: [] as string[],
        visibility: 'students' as 'students' | 'professors' | 'public',
        requires_completion: false
    });
    const [newTag, setNewTag] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Initialize form data when material changes
    useEffect(() => {
        if (material) {
            setFormData({
                title: material.title || '',
                description: material.description || '',
                material_type: material.material_type || 'lecture_notes',
                course_id: material.course_id || (courses[0]?.id || 0),
                unit: material.unit || '',
                tags: material.tags || [],
                visibility: material.visibility || 'students',
                requires_completion: material.requires_completion || false
            });
            setFile(null); // Reset file on edit
        } else {
            // Default form values for new material
            setFormData({
                title: '',
                description: '',
                material_type: 'lecture_notes',
                course_id: courses[0]?.id || 0,
                unit: '',
                tags: [],
                visibility: 'students',
                requires_completion: false
            });
            setFile(null);
        }
    }, [material, courses, isOpen]);

    const handleInputChange = (e: any) => {
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

    const handleFileChange = (e: any) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (formData.course_id === 0) {
            toast.error(t("pleaseSelectCourse"));
            return;
        }
        onSave(formData, file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{material ? t("editMaterial") : t("uploadNewMaterial")}</DialogTitle>
                    <DialogDescription>
                        {material ? t("editMaterialDescription") : t("uploadMaterialDescription")}
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
                                placeholder={t("materialTitlePlaceholder")}
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
                                placeholder={t("materialDescriptionPlaceholder")}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="material_type">{t("materialType")}</Label>
                                <Select
                                    name="material_type"
                                    value={formData.material_type}
                                    onValueChange={(value) => setFormData({ ...formData, material_type: value as MaterialType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("selectMaterialType")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lecture_notes">{t("lecture_notes")}</SelectItem>
                                        <SelectItem value="presentation">{t("presentation")}</SelectItem>
                                        <SelectItem value="worksheet">{t("worksheet")}</SelectItem>
                                        <SelectItem value="example">{t("example")}</SelectItem>
                                        <SelectItem value="reference">{t("reference")}</SelectItem>
                                        <SelectItem value="assignment">{t("assignment")}</SelectItem>
                                        <SelectItem value="exam">{t("exam")}</SelectItem>
                                        <SelectItem value="syllabus">{t("syllabus")}</SelectItem>
                                        <SelectItem value="other">{t("other")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

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
                                        {courses.map((course: any) => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                {course.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="unit">{t("unit")}</Label>
                            <Input
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleInputChange}
                                placeholder={t("unitPlaceholder")}
                            />
                        </div>

                        <div>
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

                        <div>
                            <Label htmlFor="file">{t("file")}</Label>
                            <div className="mt-1">
                                <Input
                                    id="file"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                    required={!material}
                                />
                                {material && material.file_name && !file && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t("currentFile")}: {material.file_name}
                                    </p>
                                )}
                                {file && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t("selectedFile")}: {file.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
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
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                                {formData.tags.length === 0 && (
                                    <span className="text-sm text-muted-foreground">{t("noTagsAdded")}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
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
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t("cancel")}
                        </Button>
                        <Button type="submit">{material ? t("updateMaterial") : t("uploadMaterial")}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({ isOpen, onClose, material, onConfirm }: any) => {
    const { t } = useTranslation();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("confirmDelete")}</DialogTitle>
                    <DialogDescription>
                        {t("deleteMaterialConfirm")}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="font-medium">{material?.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{material?.description}</p>
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

// AI Enhancement Dialog
const EnhanceDialog = ({ isOpen, onClose, material, onConfirm }: any) => {
    const { t } = useTranslation();
    const [options, setOptions] = useState({
        improve_content: true,
        generate_questions: false,
        create_summary: false
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("enhanceMaterial")}</DialogTitle>
                    <DialogDescription>
                        {t("enhanceMaterialDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="improve_content"
                            checked={options.improve_content}
                            onCheckedChange={(checked) =>
                                setOptions({ ...options, improve_content: checked as boolean })
                            }
                        />
                        <Label htmlFor="improve_content">
                            {t("improveContent")}
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="generate_questions"
                            checked={options.generate_questions}
                            onCheckedChange={(checked) =>
                                setOptions({ ...options, generate_questions: checked as boolean })
                            }
                        />
                        <Label htmlFor="generate_questions">
                            {t("generateQuestions")}
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="create_summary"
                            checked={options.create_summary}
                            onCheckedChange={(checked) =>
                                setOptions({ ...options, create_summary: checked as boolean })
                            }
                        />
                        <Label htmlFor="create_summary">
                            {t("createSummary")}
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("cancel")}
                    </Button>
                    <Button type="button" onClick={() => onConfirm(options)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t("enhance")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Main Materials Page Component
const MaterialsPage = () => {
    const { t } = useTranslation();
    const locale = useLocale();
    const router = useRouter();

    // State
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalMaterials, setTotalMaterials] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState('all');

    // Dialogs
    const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);

    // Load courses
    const loadCourses = async () => {
        try {
            const response = await ProfessorService.getCourses();
            if (response && response.courses) {
                setCourses(response.courses as any);
            }
        } catch (error) {
            console.error("Error loading courses:", error);
            toast.error(t("errorLoadingCourses"));
        }
    };

    // Load materials with filters
    const loadMaterials = async () => {
        setLoading(true);
        try {
            const filters: any = {};

            if (searchTerm) {
                filters.search_term = searchTerm;
            }

            if (selectedCourse) {
                filters.course_id = selectedCourse;
            }

            if (selectedType) {
                filters.material_type = selectedType;
            }

            if (currentView === 'ai_enhanced') {
                filters.ai_enhanced = true;
            }

            const response = await ProfessorMaterialsService.getMaterials(filters);
            if (response) {
                setMaterials(response.materials);
                setTotalMaterials(response.total);
            }
        } catch (error) {
            console.error("Error loading materials:", error);
            toast.error(t("errorLoadingMaterials"));
            setMaterials([]);
            setTotalMaterials(0);
        } finally {
            setLoading(false);
        }
    };

    // Handle creating or updating material
    const handleSaveMaterial = async (formData: any, file: any) => {
        try {
            if (selectedMaterial) {
                // Update existing material
                await ProfessorMaterialsService.updateMaterial(selectedMaterial.id, formData, file);
                toast.success(t("materialUpdated"));
            } else {
                // Create new material
                await ProfessorMaterialsService.createMaterial(formData, file);
                toast.success(t("materialCreated"));
            }

            setIsMaterialDialogOpen(false);
            setSelectedMaterial(null);
            loadMaterials();
        } catch (error) {
            console.error("Error saving material:", error);
            toast.error(t("errorSavingMaterial"));
        }
    };

    // Handle material deletion
    const handleDeleteMaterial = async () => {
        if (!selectedMaterial) return;

        try {
            await ProfessorMaterialsService.deleteMaterial(selectedMaterial.id);
            toast.success(t("materialDeleted"));
            setIsDeleteDialogOpen(false);
            setSelectedMaterial(null);
            loadMaterials();
        } catch (error) {
            console.error("Error deleting material:", error);
            toast.error(t("errorDeletingMaterial"));
        }
    };

    // Handle material download
    const handleDownloadMaterial = async (material: any) => {
        if (!material.file_url) {
            toast.error(t("noFileToDownload"));
            return;
        }

        // Direct link to download
        window.open(material.file_url, '_blank');
    };

    // Handle AI enhancement
    const handleEnhanceMaterial = async (options: any) => {
        if (!selectedMaterial) return;

        try {
            toast.promise(
                ProfessorMaterialsService.enhanceMaterial(selectedMaterial.id, options),
                {
                    loading: t("enhancingMaterial"),
                    success: () => {
                        loadMaterials();
                        return t("materialEnhanced");
                    },
                    error: t("errorEnhancingMaterial"),
                }
            );

            setIsEnhanceDialogOpen(false);
        } catch (error) {
            console.error("Error enhancing material:", error);
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCourse(null);
        setSelectedType(null);
        setCurrentView('all');
    };

    // Load initial data
    useEffect(() => {
        loadCourses();
    }, []);

    // Load materials when filters change
    useEffect(() => {
        loadMaterials();
    }, [searchTerm, selectedCourse, selectedType, currentView]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <div>
                    <h1 className="text-3xl font-light tracking-tight">
                        {t("teachingMaterials")}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t("manageYourMaterials")}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/${locale}/dashboard/professor/materials/lesson-plans`)}
                    >
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t("lessonPlans")}
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedMaterial(null);
                            setIsMaterialDialogOpen(true);
                        }}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {t("uploadMaterial")}
                    </Button>
                </div>
            </div>

            {/* Tabs for different views */}
            <Tabs value={currentView} onValueChange={setCurrentView}>
                <TabsList>
                    <TabsTrigger value="all">{t("allMaterials")}</TabsTrigger>
                    <TabsTrigger value="recent">{t("recentlyAdded")}</TabsTrigger>
                    <TabsTrigger value="ai_enhanced">{t("aiEnhanced")}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder={t("searchMaterials")}
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
                            <SelectItem value="">{t("allCourses")}</SelectItem>
                            {courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.title || "jj"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedType || ""}
                        onValueChange={setSelectedType}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t("allTypes")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">{t("allTypes")}</SelectItem>
                            <SelectItem value="lecture_notes">{t("lecture_notes")}</SelectItem>
                            <SelectItem value="presentation">{t("presentation")}</SelectItem>
                            <SelectItem value="worksheet">{t("worksheet")}</SelectItem>
                            <SelectItem value="example">{t("example")}</SelectItem>
                            <SelectItem value="reference">{t("reference")}</SelectItem>
                            <SelectItem value="assignment">{t("assignment")}</SelectItem>
                            <SelectItem value="exam">{t("exam")}</SelectItem>
                            <SelectItem value="syllabus">{t("syllabus")}</SelectItem>
                        </SelectContent>
                    </Select>

                    {(searchTerm || selectedCourse || selectedType) && (
                        <Button variant="ghost" onClick={resetFilters}>
                            {t("clearFilters")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Materials list */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-4">
                    {materials.length > 0 ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {t("showingMaterials", { count: materials.length.toString(), total: totalMaterials.toString() })}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {materials.map((material:any) => (
                                    <MaterialItem
                                        key={material.id}
                                        material={material}
                                        onEdit={(material:any) => {
                                            setSelectedMaterial(material);
                                            setIsMaterialDialogOpen(true);
                                        }}
                                        onDelete={(material:any) => {
                                            setSelectedMaterial(material);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                        onDownload={handleDownloadMaterial}
                                        onEnhance={(material:any) => {
                                            setSelectedMaterial(material);
                                            setIsEnhanceDialogOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card className="border">
                            <CardContent className="p-6 text-center">
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || selectedCourse || selectedType
                                        ? t("noMaterialsMatchingFilters")
                                        : t("noMaterialsYet")}
                                </p>
                                {!searchTerm && !selectedCourse && !selectedType && (
                                    <Button
                                        onClick={() => {
                                            setSelectedMaterial(null);
                                            setIsMaterialDialogOpen(true);
                                        }}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {t("uploadFirstMaterial")}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* AI suggestion card */}
            <Card className="mt-6 bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-primary" />
                        {t("aiSuggestions")}
                    </CardTitle>
                    <CardDescription>
                        {t("aiSuggestionsDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            className="gap-2"
                            onClick={() => router.push(`/${locale}/dashboard/professor/ai/assistant?query=${encodeURIComponent(t("createTeachingMaterial"))}`)}
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>{t("generateMaterial")}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => router.push(`/${locale}/dashboard/professor/materials/lesson-plans`)}
                        >
                            <BookOpen className="h-4 w-4" />
                            <span>{t("createLessonPlan")}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <MaterialDialog
                isOpen={isMaterialDialogOpen}
                onClose={() => {
                    setIsMaterialDialogOpen(false);
                    setSelectedMaterial(null);
                }}
                material={selectedMaterial}
                onSave={handleSaveMaterial}
                courses={courses}
            />

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedMaterial(null);
                }}
                material={selectedMaterial}
                onConfirm={handleDeleteMaterial}
            />

            <EnhanceDialog
                isOpen={isEnhanceDialogOpen}
                onClose={() => {
                    setIsEnhanceDialogOpen(false);
                    setSelectedMaterial(null);
                }}
                material={selectedMaterial}
                onConfirm={handleEnhanceMaterial}
            />
        </div>
    );
};

export default MaterialsPage;
