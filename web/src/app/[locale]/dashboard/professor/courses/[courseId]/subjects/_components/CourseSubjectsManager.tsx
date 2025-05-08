"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import SubjectsService from '@/services/SubjectsService';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2,
  BookOpen,
  BookPlus,
  Search,
  Users,
  Plus,
  X,
  ChevronRight
} from 'lucide-react';

const CourseSubjectsPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const courseId = params.courseId;

  const [loading, setLoading] = useState(true);
  const [courseSubjects, setCourseSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [educationLevelFilter, setEducationLevelFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('assigned');
  const [course, setCourse] = useState(null);

  // Load data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get course details
        const courseData = await fetch(`/api/v1/courses/${courseId}`).then(res => res.json());
        setCourse(courseData);

        // Get course subjects
        const subjectsData = await SubjectsService.getCourseSubjects(courseId);
        setCourseSubjects(subjectsData);

        // Get available subjects
        const educationLevel = courseData?.education_level;
        const allSubjectsData = await SubjectsService.getAvailableSubjects(educationLevel);
        setAvailableSubjects(allSubjectsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error(t("errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, t]);

  // Handle assigning a subject to the course
  const handleAssignSubject = async (subjectId) => {
    try {
      setLoading(true);
      await SubjectsService.assignSubjectToCourse(courseId, subjectId);

      // Refresh course subjects after assigning
      const subjectsData = await SubjectsService.getCourseSubjects(courseId);
      setCourseSubjects(subjectsData);

      toast.success(t("subjectAssignedSuccess"));
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error assigning subject:", error);
      toast.error(t("errorAssigningSubject"));
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a subject from the course
  const handleRemoveSubject = async (subjectId) => {
    try {
      setLoading(true);
      await SubjectsService.removeSubjectFromCourse(courseId, subjectId);

      // Remove subject from state
      setCourseSubjects(courseSubjects.filter(cs => cs.subject_id !== subjectId));

      toast.success(t("subjectRemovedSuccess"));
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error(t("errorRemovingSubject"));
    } finally {
      setLoading(false);
    }
  };

  // Handle setting a subject as primary
  const handleSetPrimary = async (subjectId) => {
    try {
      setLoading(true);
      await SubjectsService.setPrimarySubject(courseId, subjectId);

      // Update primary status in state
      setCourseSubjects(
        courseSubjects.map(cs => ({
          ...cs,
          is_primary: cs.subject_id === subjectId
        }))
      );

      toast.success(t("primarySubjectUpdated"));
    } catch (error) {
      console.error("Error setting primary subject:", error);
      toast.error(t("errorSettingPrimarySubject"));
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing subject details
  const handleViewSubject = async (subject) => {
    try {
      // If we don't have the subject's topics, fetch them
      if (!subject.topics) {
        const topics = await SubjectsService.getSubjectTopics(subject.id);

        // For each topic, fetch its lessons
        for (const topic of topics) {
          const lessons = await SubjectsService.getTopicLessons(topic.id);
          topic.lessons = lessons;
        }

        subject.topics = topics;
      }

      setSelectedSubject(subject);
    } catch (error) {
      console.error(`Error fetching details for subject ${subject.id}:`, error);
      toast.error(t("errorFetchingSubjectDetails"));
    }
  };

  // Get artwork for subject
  const getSubjectArtwork = (subjectName) => {
    if (!subjectName) return null;
    return SubjectsService.getSubjectArtwork(subjectName);
  };

  // Filter subjects based on search term and education level
  const filteredSubjects = availableSubjects.filter(subject => {
    const matchesSearch =
      searchTerm === '' ||
      (subject.name && subject.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subject.code && subject.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLevel =
      educationLevelFilter === 'all' ||
      subject.education_level === educationLevelFilter;

    return matchesSearch && matchesLevel;
  });

  // Check if subject is already assigned to the course
  const isSubjectAssigned = (subjectId) => {
    return courseSubjects.some(cs => cs.subject_id === subjectId);
  };

  // Loading state
  if (loading && !course) {
    return (
        <div className="flex justify-center items-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("subjectsForCourse")}</h1>
            <p className="text-muted-foreground mt-1">{t("manageSubjectsDescription")}</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <BookPlus className="mr-2 h-4 w-4" />
                {t("assignNewSubject")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>{t("assignSubjectToCourse")}</DialogTitle>
                <DialogDescription>
                  {t("assignSubjectDescription")}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("searchSubjects")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={educationLevelFilter}
                    onValueChange={setEducationLevelFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("educationLevel")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allLevels")}</SelectItem>
                      <SelectItem value="primary_1">{t("primary1")}</SelectItem>
                      <SelectItem value="primary_2">{t("primary2")}</SelectItem>
                      <SelectItem value="college_7">{t("college1")}</SelectItem>
                      <SelectItem value="college_8">{t("college2")}</SelectItem>
                      <SelectItem value="bac_1">{t("bac1")}</SelectItem>
                      <SelectItem value="bac_2">{t("bac2")}</SelectItem>
                      <SelectItem value="university">{t("university")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("code")}</TableHead>
                      <TableHead>{t("educationLevel")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          {t("noSubjectsFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>{subject.code}</TableCell>
                          <TableCell>{t(subject.education_level)}</TableCell>
                          <TableCell>
                            {isSubjectAssigned(subject.id) ? (
                              <Badge variant="outline">{t("alreadyAssigned")}</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAssignSubject(subject.id)}
                              >
                                {t("assign")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="assigned">
              <BookOpen className="mr-2 h-4 w-4" />
              {t("assignedSubjects")}
            </TabsTrigger>
            <TabsTrigger value="browse">
              <Search className="mr-2 h-4 w-4" />
              {t("browseSubjects")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {courseSubjects.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("noSubjectsAssigned")}</h3>
                <p className="text-muted-foreground mb-4">{t("noSubjectsAssignedDesc")}</p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("assignSubject")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseSubjects.map((courseSubject) => (
                  <Card key={courseSubject.subject_id} className={courseSubject.is_primary ? 'border-primary' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center">
                            {courseSubject.subject.icon && (
                              <span className="mr-2">{courseSubject.subject.icon}</span>
                            )}
                            {courseSubject.subject.name}
                          </CardTitle>
                          <CardDescription>
                            {courseSubject.subject.code} • {t(courseSubject.subject.education_level)}
                          </CardDescription>
                        </div>
                        {courseSubject.is_primary && (
                          <Badge variant="default" className="ml-2">
                            {t("primary")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-2">{courseSubject.subject.description}</p>

                      <div className="flex items-center mt-4 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{courseSubject.subject.students_count || 0} {t("students")}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSubject(courseSubject.subject)}
                      >
                        {t("viewDetails")}
                      </Button>
                      <div className="flex gap-2">
                        {!courseSubject.is_primary && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSetPrimary(courseSubject.subject_id)}
                          >
                            {t("setPrimary")}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveSubject(courseSubject.subject_id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t("remove")}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchSubjects")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={educationLevelFilter}
                onValueChange={setEducationLevelFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("educationLevel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allLevels")}</SelectItem>
                  <SelectItem value="primary_1">{t("primary1")}</SelectItem>
                  <SelectItem value="primary_2">{t("primary2")}</SelectItem>
                  <SelectItem value="college_7">{t("college1")}</SelectItem>
                  <SelectItem value="college_8">{t("college2")}</SelectItem>
                  <SelectItem value="bac_1">{t("bac1")}</SelectItem>
                  <SelectItem value="bac_2">{t("bac2")}</SelectItem>
                  <SelectItem value="university">{t("university")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle>
                          {subject.name}
                        </CardTitle>
                        <CardDescription>
                          {subject.code} • {t(subject.education_level)}
                        </CardDescription>
                      </div>
                      {isSubjectAssigned(subject.id) && (
                        <Badge variant="outline">{t("assigned")}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2">{subject.description}</p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewSubject(subject)}
                      >
                        {t("viewDetails")}
                      </Button>
                      {!isSubjectAssigned(subject.id) && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAssignSubject(subject.id)}
                        >
                          {t("assign")}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Subject detail dialog */}
        {selectedSubject && (
          <Dialog open={!!selectedSubject} onOpenChange={(open) => !open && setSelectedSubject(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedSubject.icon && <span>{selectedSubject.icon}</span>}
                  {selectedSubject.name}
                  <Badge className="ml-2" variant="outline">{selectedSubject.code}</Badge>
                </DialogTitle>
                <DialogDescription>
                  {t(selectedSubject.education_level)}
                  {selectedSubject.academic_track && ` • ${selectedSubject.academic_track}`}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                {/* Subject artwork */}
                {selectedSubject.name && getSubjectArtwork(selectedSubject.name) && (
                  <div className="relative h-48 rounded-md overflow-hidden">
                    <img
                      src={getSubjectArtwork(selectedSubject.name).img}
                      alt={getSubjectArtwork(selectedSubject.name).attribution}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-xs bg-black/60 text-white">
                      {getSubjectArtwork(selectedSubject.name).attribution}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium mb-2">{t("description")}</h3>
                  <p>{selectedSubject.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">{t("topics")}</h3>
                  {selectedSubject.topics && selectedSubject.topics.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSubject.topics.map((topic) => (
                        <div key={topic.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-medium">{topic.name}</h4>
                            <Badge variant="secondary">{t("difficulty")}: {topic.difficulty}/5</Badge>
                          </div>
                          <p className="text-sm mb-3">{topic.description}</p>

                          {topic.lessons && topic.lessons.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium mb-2">{t("lessons")}</h5>
                              <ul className="text-sm space-y-1">
                                {topic.lessons.map((lesson) => (
                                  <li key={lesson.id} className="flex items-center">
                                    <ChevronRight className="h-4 w-4 mr-1 flex-shrink-0" />
                                    <span>{lesson.title}</span>
                                    {lesson.duration_minutes && (
                                      <Badge variant="outline" className="ml-2">
                                        {lesson.duration_minutes} {t("minutes")}
                                      </Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t("noTopicsAvailable")}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setSelectedSubject(null)}>
                    {t("close")}
                  </Button>

                  {!isSubjectAssigned(selectedSubject.id) ? (
                    <Button onClick={() => {
                      handleAssignSubject(selectedSubject.id);
                      setSelectedSubject(null);
                    }}>
                      {t("assignToCourse")}
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={() => {
                      handleRemoveSubject(selectedSubject.id);
                      setSelectedSubject(null);
                    }}>
                      {t("removeFromCourse")}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
  );
};

export default CourseSubjectsPage;
