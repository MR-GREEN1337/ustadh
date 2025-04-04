"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  Globe,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PenTool,
  MessageCircle,
  Layers,
  BookMarked,
  GraduationCap,
  User,
  Calculator,
  FileText,
  Plus,
  Search
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LearningService } from '@/services/LearningService';

const LearnDashboard = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const isRTL = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [popularTopics, setPopularTopics] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch learning data
  useEffect(() => {
    const fetchLearningData = async () => {
      setIsLoading(true);

      try {
        if (user) {
          // If user is logged in, try to fetch from API
          try {
            // Fetch enrolled subjects
            const subjectsData = await LearningService.getEnrolledSubjects();
            console.log(subjectsData);
            if (subjectsData?.subjects || Array.isArray(subjectsData.subjects)) {
              setEnrolledSubjects(subjectsData.subjects);
            } else {
              setEnrolledSubjects(mockEnrolledSubjects as any);
            }

            // Fetch recommended courses
            const recommendationsData = await LearningService.getRecommendations();
            if (recommendationsData?.recommendations || Array.isArray(recommendationsData.recommendations)) {
              setRecommendedCourses(recommendationsData.recommendations);
            } else {
              setRecommendedCourses(mockRecommendedCourses as any);
            }

            // Fetch schedule
            const scheduleData = await LearningService.getSchedule();
            if (scheduleData?.events) {
              setUpcomingSchedule(scheduleData.events);
            } else {
              setUpcomingSchedule(mockUpcomingSchedule);
            }

          } catch (error) {
            console.error('Failed to fetch learning data from API:', error);
            // Fall back to mock data
            setEnrolledSubjects(mockEnrolledSubjects);
            setRecommendedCourses(mockRecommendedCourses);
            setUpcomingSchedule(mockUpcomingSchedule);
          }
        } else {
          // Not logged in, use mock data
          setEnrolledSubjects(mockEnrolledSubjects);
          setRecommendedCourses(mockRecommendedCourses);
          setUpcomingSchedule(mockUpcomingSchedule);
        }

        // Use mock data for popular topics (no API endpoint implemented)
        setPopularTopics(mockPopularTopics);

      } catch (error) {
        console.error('Failed to fetch learning data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données d'apprentissage",
          variant: "destructive"
        });

        // Fall back to mock data
        setEnrolledSubjects(mockEnrolledSubjects as any);
        setRecommendedCourses(mockRecommendedCourses as any);
        setPopularTopics(mockPopularTopics as any);
        setUpcomingSchedule(mockUpcomingSchedule as any);
      }

      setIsLoading(false);
    };

    fetchLearningData();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/${locale}/dashboard/learn/explore?q=${encodeURIComponent(searchQuery)}`);
  };

  const getSubjectIcon = (subject: any) => {
    const iconMap = {
      'math': <Calculator className="h-5 w-5" />,
      'literature': <BookOpen className="h-5 w-5" />,
      'science': <TrendingUp className="h-5 w-5" />,
      'geography': <Globe className="h-5 w-5" />,
      'history': <BookMarked className="h-5 w-5" />,
      'language': <MessageCircle className="h-5 w-5" />
    };

    return iconMap[subject.icon] || <BookOpen className="h-5 w-5" />;
  };

  const navigateToSubject = (subjectId: number) => {
    router.push(`/${locale}/dashboard/learn/subjects/${subjectId}`);
  };

  const navigateToCourse = (courseId: number) => {
    router.push(`/${locale}/dashboard/learn/courses/${courseId}`);
  };

  const navigateToExplore = () => {
    router.push(`/${locale}/dashboard/learn/explore`);
  };

  const navigateToSchedule = () => {
    router.push(`/${locale}/dashboard/learn/schedule`);
  };

  const getTimeString = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-tight">
            {t("learnDashboard") || "Tableau de bord d'apprentissage"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("learnDashboardDesc") || "Explorez des sujets, suivez des cours et planifiez votre apprentissage"}
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder={t("searchTopics") || "Rechercher des sujets..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            {t("search") || "Rechercher"}
          </Button>
        </form>

        {isLoading ? (
          // Loading state
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main content - 8 columns */}
            <div className="md:col-span-8 space-y-6">
              {/* Enrolled subjects */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">
                    {t("mySubjects") || "Mes matières"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/learn/subjects`)}
                  >
                    {t("viewAll") || "Voir tout"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {enrolledSubjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {enrolledSubjects.map((subject) => (
                      <Card
                        key={subject.id}
                        className="cursor-pointer hover:border-primary/20 transition-all"
                        onClick={() => navigateToSubject(subject.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className={`mr-3 p-2 rounded-md ${subject.colorClass}`}>
                                {getSubjectIcon(subject)}
                              </div>
                              <div>
                                <CardTitle className="text-base">{subject.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">
                                  {subject.level || subject.grade_level || "Tous niveaux"}
                                </p>
                              </div>
                            </div>
                            <Badge variant={subject.progress === 100 ? "success" : "outline"}>
                              {subject.progress}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <Progress value={subject.progress} className="h-2" />
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Layers className="h-3 w-3 mr-1" />
                            {subject.unitsCompleted || 0}/{subject.totalUnits || 0} {t("units") || "unités"}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {subject.timeSpent || "0h"}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="rounded-full p-3 bg-muted mb-4">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">{t("noSubjectsEnrolled") || "Pas encore de matières"}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("enrollSubjectsDesc") || "Inscrivez-vous à des matières pour commencer votre parcours d'apprentissage"}
                      </p>
                      <Button onClick={() => router.push(`/${locale}/dashboard/learn/subjects`)}>
                        {t("browseSubjects") || "Parcourir les matières"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recommended courses */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                    <h2 className="text-xl font-medium">
                      {t("recommendedForYou") || "Recommandé pour vous"}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/${locale}/dashboard/learn/courses`)}
                  >
                    {t("viewAll") || "Voir tout"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="cursor-pointer hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all"
                      onClick={() => navigateToCourse(course.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center ${course.colorClass || 'bg-amber-100 dark:bg-amber-900/40'}`}>
                            {getSubjectIcon(course)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-1 truncate">{course.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground mb-1">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {course.subject || course.category}
                              {course.level && (
                                <>
                                  <span className="mx-1">•</span>
                                  {course.level}
                                </>
                              )}
                              {course.duration && (
                                <>
                                  <span className="mx-1">•</span>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {course.duration}
                                </>
                              )}
                            </div>
                            {course.tags && course.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {course.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center text-xs bg-muted px-1.5 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Popular topics to explore */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-indigo-500" />
                    <h2 className="text-xl font-medium">
                      {t("popularTopics") || "Sujets populaires"}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateToExplore}
                  >
                    {t("exploreMore") || "Explorer plus"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {popularTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      className="cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-all"
                      onClick={() => router.push(`/${locale}/dashboard/learn/explore/${topic.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                              {getSubjectIcon(topic)}
                            </div>
                            <div>
                              <h3 className="font-medium text-base">{topic.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                {topic.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-muted-foreground mr-2">
                              {topic.learners} apprenants
                            </span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar content - 4 columns */}
            <div className="md:col-span-4 space-y-6">
              {/* User overview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {t("myLearning") || "Mon apprentissage"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user?.full_name || "Apprenant"}</h3>
                      <p className="text-xs text-muted-foreground">
                        {user?.grade_level ? `Niveau ${user.grade_level}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("weeklyGoal") || "Objectif hebdomadaire"}</span>
                      <span className="font-medium">3/5 {t("hours") || "heures"}</span>
                    </div>
                    <Progress value={60} className="h-2" />

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="border rounded-md p-2 text-center">
                        <p className="text-2xl font-semibold">8</p>
                        <p className="text-xs text-muted-foreground">{t("activeDays") || "Jours actifs"}</p>
                      </div>
                      <div className="border rounded-md p-2 text-center">
                        <p className="text-2xl font-semibold">5</p>
                        <p className="text-xs text-muted-foreground">{t("completedTopics") || "Sujets terminés"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t("upcomingSchedule") || "Agenda à venir"}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToSchedule}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t("add") || "Ajouter"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingSchedule.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingSchedule.map((event, idx) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-14 bg-muted rounded-md p-1 text-center">
                            <p className="text-xs text-muted-foreground">{event.dayName}</p>
                            <p className="text-lg font-medium">{event.day}</p>
                          </div>
                          <div className="flex-1 border-l pl-3 py-1">
                            <p className="text-sm font-medium">{event.title}</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {getTimeString(event.startTime)} - {getTimeString(event.endTime)}
                            </div>
                            {event.subject && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {event.subject}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("noUpcomingEvents") || "Pas d'événements à venir"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={navigateToSchedule}
                      >
                        {t("createSchedule") || "Créer un horaire"}
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={navigateToSchedule}
                  >
                    {t("viewFullSchedule") || "Voir l'agenda complet"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {t("quickActions") || "Actions rapides"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/${locale}/dashboard/tutor/chat`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("askAITutor") || "Poser une question au tuteur IA"}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/${locale}/dashboard/learn/explore`)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {t("exploreConcepts") || "Explorer des concepts"}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push(`/${locale}/dashboard/progress`)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {t("checkProgress") || "Vérifier ma progression"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for enrolled subjects
const mockEnrolledSubjects = [
  {
    id: 1,
    name: "Mathématiques",
    level: "Niveau 8",
    grade_level: "Collège",
    progress: 65,
    unitsCompleted: 7,
    totalUnits: 12,
    timeSpent: "8h 30m",
    icon: "math",
    colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
  },
  {
    id: 2,
    name: "Littérature française",
    level: "Niveau 9",
    grade_level: "Collège",
    progress: 42,
    unitsCompleted: 5,
    totalUnits: 10,
    timeSpent: "6h 15m",
    icon: "literature",
    colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
  },
  {
    id: 3,
    name: "Sciences",
    level: "Niveau 8",
    grade_level: "Collège",
    progress: 78,
    unitsCompleted: 8,
    totalUnits: 10,
    timeSpent: "12h 45m",
    icon: "science",
    colorClass: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
  },
  {
    id: 4,
    name: "Histoire",
    level: "Niveau 9",
    grade_level: "Collège",
    progress: 30,
    unitsCompleted: 3,
    totalUnits: 8,
    timeSpent: "4h 20m",
    icon: "history",
    colorClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
  }
];

// Mock data for recommended courses
const mockRecommendedCourses = [
  {
    id: 101,
    title: "Algèbre linéaire pour débutants",
    subject: "Mathématiques",
    category: "Mathématiques",
    level: "Intermédiaire",
    duration: "6 heures",
    tags: ["Algèbre", "Matrices", "Vecteurs"],
    icon: "math",
    colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
  },
  {
    id: 102,
    title: "Analyse de textes littéraires classiques",
    subject: "Littérature",
    category: "Littérature",
    level: "Avancé",
    duration: "8 heures",
    tags: ["Analyse", "Classiques", "Critique"],
    icon: "literature",
    colorClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
  },
  {
    id: 103,
    title: "Introduction à la physique quantique",
    subject: "Sciences",
    category: "Physique",
    level: "Avancé",
    duration: "10 heures",
    tags: ["Physique", "Quantique", "Théorie"],
    icon: "science",
    colorClass: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
  },
  {
    id: 104,
    title: "Histoire du Maroc médiéval",
    subject: "Histoire",
    category: "Histoire",
    level: "Intermédiaire",
    duration: "5 heures",
    tags: ["Maroc", "Médiéval", "Histoire"],
    icon: "history",
    colorClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
  }
];

// Mock data for popular topics
const mockPopularTopics = [
  {
    id: 201,
    title: "Géométrie non euclidienne",
    description: "Exploration des géométries alternatives et leur importance",
    learners: 1240,
    icon: "math"
  },
  {
    id: 202,
    title: "La poésie arabe classique",
    description: "Structures, thèmes et figures de style dans la tradition poétique arabe",
    learners: 980,
    icon: "literature"
  },
  {
    id: 203,
    title: "L'astronomie dans la civilisation islamique",
    description: "Contributions des astronomes musulmans à la science moderne",
    learners: 1560,
    icon: "science"
  }
];

// Mock data for upcoming schedule
const mockUpcomingSchedule = [
  {
    id: 301,
    title: "Cours de mathématiques",
    subject: "Mathématiques",
    day: "04",
    dayName: "Lun",
    startTime: "2025-04-04T10:00:00Z",
    endTime: "2025-04-04T11:30:00Z"
  },
  {
    id: 302,
    title: "Révision de littérature",
    subject: "Littérature",
    day: "05",
    dayName: "Mar",
    startTime: "2025-04-05T14:00:00Z",
    endTime: "2025-04-05T15:30:00Z"
  },
  {
    id: 303,
    title: "Examen de sciences",
    subject: "Sciences",
    day: "07",
    dayName: "Jeu",
    startTime: "2025-04-07T09:00:00Z",
    endTime: "2025-04-07T10:30:00Z"
  }
];

export default LearnDashboard;
