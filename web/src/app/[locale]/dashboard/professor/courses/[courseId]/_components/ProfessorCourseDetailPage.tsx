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
  X,
  Plus
} from 'lucide-react';

// Full-width CourseDetailPage that handles all functionality
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
  const [editedCourse, setEditedCourse] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

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
  const handleAddArrayItem = (field: string, defaultValue = "") => {
    if (editing) {
      setUnsavedChanges(true);
      const updatedCourse = { ...editedCourse as any };
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

  // Save changes
  const handleSave = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would update the course via API
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

  const activeData = editing ? editedCourse : course;

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

      {/* Document header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 mt-4">
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
            variant={activeData.status === 'active' ? 'success' :
                  activeData.status === 'draft' ? 'secondary' :
                  'outline'}
            className="capitalize"
          >
            {activeData.status || 'unknown'}
          </Badge>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            {t("edit")}
          </Button>
        )}
      </div>

      {/* Title */}
      <h1 className="text-4xl font-normal mb-8">
        <EditableContent
          value={activeData.title}
          className="w-full"
          onChange={(value) => handleContentChange('title', value)}
        />
      </h1>

      {/* Content area */}
      <div className="leading-relaxed text-base space-y-8 w-full">
        {/* Description section */}
        <div className="w-full">
          <EditableContent
            value={activeData.description}
            className="w-full block"
            isTextArea={true}
            onChange={(value) => handleContentChange('description', value)}
          />
        </div>

        <Separator className="my-8" />

        {/* Course time details */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {activeData.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(activeData.start_date).toLocaleDateString()} -
                {activeData.end_date ? new Date(activeData.end_date).toLocaleDateString() : t("ongoing")}
              </span>
            </div>
          )}

          {activeData.ai_tutoring_enabled && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{t("aiEnabled")}</span>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Learning objectives */}
        <div>
          <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
            {t("learningObjectives")}
          </h2>

          <ul className="list-disc pl-6 space-y-2">
            {activeData.learning_objectives && activeData.learning_objectives.map((objective, i) => (
              <li key={i}>
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
              </li>
            ))}

            {editing && (
              <li className="text-primary italic cursor-pointer flex items-center" onClick={() => handleAddArrayItem('learning_objectives', t("newObjective"))}>
                <Plus className="h-4 w-4 mr-1" /> {t("addObjective")}
              </li>
            )}
          </ul>
        </div>

        {/* Syllabus */}
        <Separator className="my-8" />

        <div>
          <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
            {t("syllabus")}
          </h2>

          {activeData.syllabus?.weeks ? (
            <div className="space-y-6">
              {activeData.syllabus.weeks.map((week, weekIndex) => (
                <div key={weekIndex}>
                  <h3 className="font-medium text-lg mb-2">
                    <EditableContent
                      value={week.title || `${t("week")} ${week.week}`}
                      onChange={(value) => handleWeekTitleChange(weekIndex, value)}
                    />
                  </h3>

                  {week.topics && week.topics.length > 0 && (
                    <ul className="list-disc pl-6 space-y-1">
                      {week.topics.map((topic, topicIndex) => (
                        <li key={topicIndex}>
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
                  )}
                </div>
              ))}

              {editing && (
                <div
                  className="text-primary italic cursor-pointer flex items-center gap-1"
                  onClick={handleAddWeek}
                >
                  <FileText className="h-4 w-4" />
                  <Plus className="h-4 w-4 mr-1" /> {t("addWeek")}
                </div>
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
        </div>

        {/* Prerequisites */}
        {activeData.prerequisites && activeData.prerequisites.length > 0 && (
          <>
            <Separator className="my-8" />

            <div>
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                {t("prerequisites")}
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                {activeData.prerequisites.map((prerequisite, i) => (
                  <li key={i}>
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
                  </li>
                ))}

                {editing && (
                  <li
                    className="text-primary italic cursor-pointer flex items-center"
                    onClick={() => handleAddArrayItem('prerequisites', t("newPrerequisite"))}
                  >
                    <Plus className="h-4 w-4 mr-1" /> {t("addPrerequisite")}
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Additional info */}
        <Separator className="my-8" />

        <div className="text-sm space-y-4 mb-16 w-full">
          <h2 className="text-xl font-medium mb-4">{t("additionalInfo")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-8">
            <div>
              <span className="font-medium">{t("educationLevel")}:</span>{' '}
              <EditableContent
                value={activeData.education_level}
                onChange={(value) => handleContentChange('education_level', value)}
              />
            </div>

            {activeData.academic_track && (
              <div>
                <span className="font-medium">{t("track")}:</span>{' '}
                <EditableContent
                  value={activeData.academic_track}
                  onChange={(value) => handleContentChange('academic_track', value)}
                />
              </div>
            )}

            {activeData.credits && (
              <div>
                <span className="font-medium">{t("credits")}:</span>{' '}
                <EditableContent
                  value={activeData.credits.toString()}
                  onChange={(value) => handleContentChange('credits', parseFloat(value) || null)}
                />
              </div>
            )}

            {activeData.suggested_topics && activeData.suggested_topics.length > 0 && (
              <div className="col-span-1 md:col-span-3 mt-2">
                <span className="font-medium">{t("suggestedTopics")}:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeData.suggested_topics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
