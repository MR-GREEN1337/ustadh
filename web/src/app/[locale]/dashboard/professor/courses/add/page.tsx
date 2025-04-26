// File: app/[locale]/dashboard/professor/courses/add/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { ProfessorService } from '@/services/ProfessorService';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

// Icons
import {
  BookOpen,
  Sparkles,
  Plus,
  PlusCircle,
  X,
  Loader2,
  Calendar,
  Clock,
  Users,
  School
} from 'lucide-react';

const AddCoursePage = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();

  // Form mode: manual or AI-assisted
  const [creationMode, setCreationMode] = useState('manual');
  const [loading, setLoading] = useState(false);

  // Manual course creation form state
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    educationLevel: '',
    status: 'draft',
    topics: [],
    syllabus: '',
    prerequisites: [],
    objectives: []
  });

  // AI-assisted form state
  const [aiFormData, setAiFormData] = useState({
    subjectArea: '',
    educationLevel: '',
    keyTopics: '',
    courseDuration: 'semester',
    difficultyLevel: 'intermediate',
    includeAssessments: true,
    includeProjectIdeas: true,
    teachingMaterials: true
  });

  // Topic management
  const [newTopic, setNewTopic] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');

  // Function to handle manual form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Function to handle AI form input change
  const handleAiInputChange = (e) => {
    const { name, value } = e.target;
    setAiFormData({ ...aiFormData, [name]: value });
  };

  // Function to handle checkbox change in AI form
  const handleAiCheckboxChange = (name, checked) => {
    setAiFormData({ ...aiFormData, [name]: checked });
  };

  // Function to add a topic
  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setFormData({ ...formData, topics: [...formData.topics, newTopic.trim()] });
      setNewTopic('');
    }
  };

  // Function to remove a topic
  const handleRemoveTopic = (index) => {
    const newTopics = [...formData.topics];
    newTopics.splice(index, 1);
    setFormData({ ...formData, topics: newTopics });
  };

  // Function to add a prerequisite
  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData({ ...formData, prerequisites: [...formData.prerequisites, newPrerequisite.trim()] });
      setNewPrerequisite('');
    }
  };

  // Function to remove a prerequisite
  const handleRemovePrerequisite = (index) => {
    const newPrerequisites = [...formData.prerequisites];
    newPrerequisites.splice(index, 1);
    setFormData({ ...formData, prerequisites: newPrerequisites });
  };

  // Function to add a learning objective
  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] });
      setNewObjective('');
    }
  };

  // Function to remove a learning objective
  const handleRemoveObjective = (index) => {
    const newObjectives = [...formData.objectives];
    newObjectives.splice(index, 1);
    setFormData({ ...formData, objectives: newObjectives });
  };

  // Function to handle manual course creation
  const handleManualCourseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await ProfessorService.createCourse({
        ...formData,
        students: 0,
        progress: 0,
        aiGenerated: false
      });

      toast.success(t("courseCreated"));
      router.push(`/${locale}/dashboard/professor/courses/${response.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error(t("errorCreatingCourse"));
    } finally {
      setLoading(false);
    }
  };

  // Function to handle AI-assisted course creation
  const handleAiCourseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await ProfessorService.generateCourse({
        subjectArea: aiFormData.subjectArea,
        educationLevel: aiFormData.educationLevel,
        difficulty: aiFormData.difficultyLevel,
        includeAssessments: aiFormData.includeAssessments,
        includeProjectIdeas: aiFormData.includeProjectIdeas,
        keyTopics: aiFormData.keyTopics,
        courseDuration: aiFormData.courseDuration,
        teachingMaterials: aiFormData.teachingMaterials
      });

      toast.success(t("courseCreatedWithAI"));
      router.push(`/${locale}/dashboard/professor/courses/${response.id}`);
    } catch (error) {
      console.error("Error creating course with AI:", error);
      toast.error(t("errorCreatingCourseWithAI"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-2">
          {t("createNewCourse")}
        </h1>
        <p className="text-muted-foreground">
          {t("courseCreationDescription")}
        </p>
      </div>

      <Tabs value={creationMode} onValueChange={setCreationMode} className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("manualCreation")}
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("aiAssisted")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <form onSubmit={handleManualCourseSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("basicInformation")}</CardTitle>
                <CardDescription>
                  {t("basicInformationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <Label htmlFor="title">{t("courseTitle")} *</Label>
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
                    <Label htmlFor="code">{t("courseCode")} *</Label>
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
                  <Label htmlFor="description">{t("courseDescription")}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t("courseDescriptionPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="educationLevel">{t("educationLevel")}</Label>
                    <Select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectEducationLevel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">{t("primary")}</SelectItem>
                        <SelectItem value="middle">{t("middle")}</SelectItem>
                        <SelectItem value="secondary">{t("secondary")}</SelectItem>
                        <SelectItem value="university">{t("university")}</SelectItem>
                      </SelectContent>
                    </Select>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("courseContent")}</CardTitle>
                <CardDescription>
                  {t("courseContentDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <Separator />

                <div>
                  <Label>{t("prerequisites")}</Label>
                  <div className="flex mt-1 mb-2">
                    <Input
                      value={newPrerequisite}
                      onChange={(e) => setNewPrerequisite(e.target.value)}
                      placeholder={t("addPrerequisitePlaceholder")}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPrerequisite();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddPrerequisite} className="ml-2">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.prerequisites.map((prerequisite, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center">
                        {prerequisite}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleRemovePrerequisite(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {formData.prerequisites.length === 0 && (
                      <span className="text-sm text-muted-foreground">{t("noPrerequisitesAdded")}</span>
                    )}
                  </div>
                </div>

                <Separator />

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
                      <PlusCircle className="h-4 w-4" />
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

                <Separator />

                <div>
                  <Label htmlFor="syllabus">{t("syllabus")}</Label>
                  <Textarea
                    id="syllabus"
                    name="syllabus"
                    value={formData.syllabus}
                    onChange={handleInputChange}
                    placeholder={t("syllabusPlaceholder")}
                    rows={5}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/professor/courses`)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    t("createCourse")
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <form onSubmit={handleAiCourseSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t("aiAssistedCourseCreation")}</CardTitle>
                <CardDescription>
                  {t("aiAssistedCourseCreationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subjectArea">{t("subjectArea")} *</Label>
                    <Input
                      id="subjectArea"
                      name="subjectArea"
                      value={aiFormData.subjectArea}
                      onChange={handleAiInputChange}
                      placeholder={t("subjectAreaPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="aiEducationLevel">{t("educationLevel")} *</Label>
                    <Select
                      name="educationLevel"
                      value={aiFormData.educationLevel}
                      onValueChange={(value) => setAiFormData({ ...aiFormData, educationLevel: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectEducationLevel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">{t("primary")}</SelectItem>
                        <SelectItem value="middle">{t("middle")}</SelectItem>
                        <SelectItem value="secondary">{t("secondary")}</SelectItem>
                        <SelectItem value="university">{t("university")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="keyTopics">{t("keyTopics")}</Label>
                  <Textarea
                    id="keyTopics"
                    name="keyTopics"
                    value={aiFormData.keyTopics}
                    onChange={handleAiInputChange}
                    placeholder={t("keyTopicsPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="courseDuration">{t("courseDuration")}</Label>
                    <Select
                      name="courseDuration"
                      value={aiFormData.courseDuration}
                      onValueChange={(value) => setAiFormData({ ...aiFormData, courseDuration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCourseDuration")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semester">{t("semester")}</SelectItem>
                        <SelectItem value="year">{t("fullYear")}</SelectItem>
                        <SelectItem value="quarter">{t("quarter")}</SelectItem>
                        <SelectItem value="short">{t("shortCourse")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficultyLevel">{t("difficultyLevel")}</Label>
                    <Select
                      name="difficultyLevel"
                      value={aiFormData.difficultyLevel}
                      onValueChange={(value) => setAiFormData({ ...aiFormData, difficultyLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDifficultyLevel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t("beginner")}</SelectItem>
                        <SelectItem value="intermediate">{t("intermediate")}</SelectItem>
                        <SelectItem value="advanced">{t("advanced")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAssessments"
                      checked={aiFormData.includeAssessments}
                      onCheckedChange={(checked) => handleAiCheckboxChange('includeAssessments', checked)}
                    />
                    <Label htmlFor="includeAssessments">{t("includeAssessments")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProjectIdeas"
                      checked={aiFormData.includeProjectIdeas}
                      onCheckedChange={(checked) => handleAiCheckboxChange('includeProjectIdeas', checked)}
                    />
                    <Label htmlFor="includeProjectIdeas">{t("includeProjectIdeas")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teachingMaterials"
                      checked={aiFormData.teachingMaterials}
                      onCheckedChange={(checked) => handleAiCheckboxChange('teachingMaterials', checked)}
                    />
                    <Label htmlFor="teachingMaterials">{t("suggestTeachingMaterials")}</Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard/professor/courses`)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("generatingCourse")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t("generateCourse")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddCoursePage;
