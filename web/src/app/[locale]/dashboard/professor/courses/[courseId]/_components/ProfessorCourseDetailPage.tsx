"use client";

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { ProfessorService } from '@/services/ProfessorService';
import { toast } from 'sonner';

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
  X
} from 'lucide-react';

// Google Docs-style CourseDetailPage that works within the dashboard layout
const CourseDetailPage = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const params = useParams();
  const courseId = params.courseId;
  const router = useRouter();

  // State for course data
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Fetch course data
  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      try {
        const courseData = await ProfessorService.getCourse(courseId);
        setCourse(courseData);
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

  const handleSave = () => {
    toast.success(t("changesSaved"));
    setEditing(false);
    setUnsavedChanges(false);
  };

  const handleCancel = () => {
    // Reload the course data to discard changes
    setLoading(true);
    ProfessorService.getCourse(courseId)
      .then(courseData => {
        setCourse(courseData);
        setEditing(false);
        setUnsavedChanges(false);
      })
      .catch(error => {
        console.error("Error reloading course:", error);
        toast.error(t("errorReloadingCourse"));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Track changes in edit mode
  const handleContentChange = () => {
    if (editing) {
      setUnsavedChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{t("courseNotFound")}</h2>
          <p className="text-muted-foreground">{t("courseNotFoundDesc")}</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/${locale}/dashboard/professor/courses`)}
          >
            {t("backToCourses")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Floating editing toolbar when in edit mode */}
      {editing && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-2 flex justify-between items-center">
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

      {/* Document header - Full width with more space for longer titles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm font-normal">{course.code}</Badge>
          <span className="text-muted-foreground text-sm">{course.academic_year}</span>
          <Badge
            variant={course.status === 'active' ? 'success' :
                  course.status === 'draft' ? 'secondary' :
                  'outline'}
            className="capitalize"
          >
            {course.status || 'unknown'}
          </Badge>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            {t("edit")}
          </Button>
        )}
      </div>

      {/* Title - Large and Google Docs-like, with more space for longer titles */}
      <div
        className={`text-4xl font-normal mb-8 outline-none w-full ${editing ? 'border-b border-dashed border-gray-300 pb-1 focus:border-primary' : ''}`}
        contentEditable={editing}
        suppressContentEditableWarning={true}
        onInput={handleContentChange}
      >
        {course.title}
      </div>

      {/* Google Docs-style content area - wider layout */}
      <div className="leading-relaxed text-base space-y-8 w-full">
        {/* Description section */}
        <div className="w-full">
          <div
            className={`outline-none w-full ${editing ? 'focus:border-primary' : ''}`}
            contentEditable={editing}
            suppressContentEditableWarning={true}
            onInput={handleContentChange}
          >
            {course.description}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Course time details in a wider format */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {course.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(course.start_date).toLocaleDateString()} - {course.end_date ? new Date(course.end_date).toLocaleDateString() : t("ongoing")}</span>
            </div>
          )}

          {course.ai_tutoring_enabled && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{t("aiEnabled")}</span>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Learning objectives */}
        {course.learning_objectives && course.learning_objectives.length > 0 && (
          <div>
            <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
              {t("learningObjectives")}
              {editing && (
                <Button size="sm" variant="outline" className="h-6 px-2 rounded-full">
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              {course.learning_objectives.map((objective, i) => (
                <li key={i}
                  className={`outline-none ${editing ? 'focus:border-b focus:border-primary' : ''}`}
                  contentEditable={editing}
                  suppressContentEditableWarning={true}
                  onInput={handleContentChange}
                >
                  {objective}
                </li>
              ))}
              {editing && (
                <li className="text-primary italic cursor-pointer">
                  + {t("addObjective")}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Syllabus */}
        {course.syllabus && (
          <>
            <Separator className="my-8" />

            <div>
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                {t("syllabus")}
                {editing && (
                  <Button size="sm" variant="outline" className="h-6 px-2 rounded-full">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </h2>

              {course.syllabus.weeks ? (
                <div className="space-y-6">
                  {course.syllabus.weeks.map((week, i) => (
                    <div key={i}>
                      <h3
                        className={`font-medium text-lg mb-2 outline-none ${editing ? 'border-b border-dashed border-gray-300 focus:border-primary' : ''}`}
                        contentEditable={editing}
                        suppressContentEditableWarning={true}
                        onInput={handleContentChange}
                      >
                        {t("week")} {week.week}: {week.title}
                      </h3>
                      {week.topics && week.topics.length > 0 && (
                        <ul className="list-disc pl-6 space-y-1">
                          {week.topics.map((topic, j) => (
                            <li key={j}
                              className={`outline-none ${editing ? 'focus:border-b focus:border-primary' : ''}`}
                              contentEditable={editing}
                              suppressContentEditableWarning={true}
                              onInput={handleContentChange}
                            >
                              {topic}
                            </li>
                          ))}
                          {editing && (
                            <li className="text-primary italic cursor-pointer">
                              + {t("addTopic")}
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                  {editing && (
                    <div className="text-primary italic cursor-pointer flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      + {t("addWeek")}
                    </div>
                  )}
                </div>
              ) : course.syllabus.topics ? (
                <div className="space-y-2">
                  {course.syllabus.topics.map((topic, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <p
                        className={`outline-none ${editing ? 'focus:border-b focus:border-primary' : ''}`}
                        contentEditable={editing}
                        suppressContentEditableWarning={true}
                        onInput={handleContentChange}
                      >
                        {topic}
                      </p>
                    </div>
                  ))}
                  {editing && (
                    <div className="text-primary italic cursor-pointer flex items-center gap-1 ml-7">
                      + {t("addTopic")}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`text-muted-foreground outline-none ${editing ? 'focus:border-b focus:border-primary' : ''}`}
                  contentEditable={editing}
                  suppressContentEditableWarning={true}
                  onInput={handleContentChange}
                >
                  {typeof course.syllabus === 'string'
                    ? course.syllabus
                    : t("syllabusNotStructured")}
                </div>
              )}
            </div>
          </>
        )}

        {/* Prerequisites */}
        {course.prerequisites && course.prerequisites.length > 0 && (
          <>
            <Separator className="my-8" />

            <div>
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                {t("prerequisites")}
                {editing && (
                  <Button size="sm" variant="outline" className="h-6 px-2 rounded-full">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                {course.prerequisites.map((prerequisite, i) => (
                  <li key={i}
                    className={`outline-none ${editing ? 'focus:border-b focus:border-primary' : ''}`}
                    contentEditable={editing}
                    suppressContentEditableWarning={true}
                    onInput={handleContentChange}
                  >
                    {prerequisite}
                  </li>
                ))}
                {editing && (
                  <li className="text-primary italic cursor-pointer">
                    + {t("addPrerequisite")}
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Additional info - Improved layout */}
        <Separator className="my-8" />

        <div className="text-sm space-y-4 mb-16 w-full">
          <h2 className="text-xl font-medium mb-4">{t("additionalInfo")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-8">
            <div>
              <span className="font-medium">{t("educationLevel")}:</span> {course.education_level}
            </div>

            {course.academic_track && (
              <div>
                <span className="font-medium">{t("track")}:</span> {course.academic_track}
              </div>
            )}

            {course.credits && (
              <div>
                <span className="font-medium">{t("credits")}:</span> {course.credits}
              </div>
            )}

            {course.suggested_topics && course.suggested_topics.length > 0 && (
              <div className="col-span-1 md:col-span-3 mt-2">
                <span className="font-medium">{t("suggestedTopics")}:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {course.suggested_topics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CoursePage() {
  return (
      <CourseDetailPage />
  );
}
