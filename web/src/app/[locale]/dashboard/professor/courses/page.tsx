"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { ProfessorService } from '@/services/ProfessorService';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Sparkles, X } from 'lucide-react';

// Import CourseCard component
import CourseCard from './_components/CourseCard';

// Continuing from where we left off

const CourseDialog = ({ isOpen, onClose, course, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
      title: '',
      code: '',
      description: '',
      status: 'draft',
      topics: []
    });

    const [newTopic, setNewTopic] = useState('');

    // Initialize form data when course changes
    useEffect(() => {
      if (course) {
        setFormData({
          title: course.title || '',
          code: course.code || '',
          description: course.description || '',
          status: course.status || 'draft',
          topics: course.topics || []
        });
      } else {
        // Reset form for new course
        setFormData({
          title: '',
          code: '',
          description: '',
          status: 'draft',
          topics: []
        });
      }
    }, [course, isOpen]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

    const handleAddTopic = () => {
      if (newTopic.trim()) {
        setFormData({ ...formData, topics: [...formData.topics, newTopic.trim()] });
        setNewTopic('');
      }
    };

    const handleRemoveTopic = (index) => {
      const newTopics = [...formData.topics];
      newTopics.splice(index, 1);
      setFormData({ ...formData, topics: newTopics });
    };

    const handleSubmit = (e) => {
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTopic} className="ml-2">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
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

  // Main Courses Page Component
  const CoursesPage = () => {
    const { t } = useTranslation();
    const locale = useLocale();
    const router = useRouter();

    // State for courses and UI states
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Load courses
    const loadCourses = async () => {
      setLoading(true);
      try {
        const response = await ProfessorService.getCourses();
        if (response && response.courses) {
          setCourses(response.courses);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
        toast.error(t("errorLoadingCourses"));
      } finally {
        setLoading(false);
      }
    };

    // Handle course editing
    const handleEditCourse = (course) => {
      setSelectedCourse(course);
      setIsCourseDialogOpen(true);
    };

    // Handle course generation/enhancement
    const handleGenerateCourse = (course) => {
      // Simulate AI processing with toast notification
      toast.promise(
        new Promise((resolve) => {
          setTimeout(() => {
            // Update the course with AI-generated content
            const updatedCourses = courses.map((c) =>
              c.id === course.id ? { ...c, aiGenerated: true } : c
            );
            setCourses(updatedCourses);
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

    // Handle course save (create/update)
    const handleSaveCourse = async (courseData) => {
      try {
        if (selectedCourse) {
          // Update existing course
          await ProfessorService.updateCourse(selectedCourse.id, courseData);
          // Update local state
          const updatedCourses = courses.map((c) =>
            c.id === selectedCourse.id ? { ...c, ...courseData } : c
          );
          setCourses(updatedCourses);
          toast.success(t("courseUpdated"));
        } else {
          // Create new course
          const newCourse = await ProfessorService.createCourse({
            ...courseData,
            students: 0,
            progress: 0,
            aiGenerated: false
          });
          setCourses([...courses, newCourse]);
          toast.success(t("courseCreated"));
        }

        setIsCourseDialogOpen(false);
        setSelectedCourse(null);
      } catch (error) {
        console.error("Error saving course:", error);
        toast.error(t("errorSavingCourse"));
      }
    };

    // Filter courses based on search term and status
    const filteredCourses = useMemo(() => {
      return courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             course.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    }, [courses, searchTerm, statusFilter]);

    // Load courses on mount
    useEffect(() => {
      loadCourses();
    }, []);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              {t("courses")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("manageYourCourses")}
            </p>
          </div>

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

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t("searchCourses")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="draft">{t("draft")}</SelectItem>
              <SelectItem value="archived">{t("archived")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEditCourse}
                    onGenerate={handleGenerateCourse}
                  />
                ))}
              </div>
            ) : (
              <Card className="border">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? t("noCoursesMatchingFilters")
                      : t("noCoursesYet")}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
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
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* AI Course Generation Card */}
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
                onClick={() => router.push(`/${locale}/dashboard/professor/ai/course-generator`)}
              >
                <Sparkles className="h-4 w-4" />
                <span>{t("generateNewCourse")}</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (courses.length > 0) {
                    // Open dialog with the first course to enhance
                    handleGenerateCourse(courses[0]);
                  } else {
                    toast.info(t("createCourseFirst"));
                  }
                }}
              >
                <Sparkles className="h-4 w-4" />
                <span>{t("enhanceExistingCourse")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Course Dialog */}
        <CourseDialog
          isOpen={isCourseDialogOpen}
          onClose={() => {
            setIsCourseDialogOpen(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          onSave={handleSaveCourse}
        />
      </div>
    );
  };

  export default CoursesPage;
