"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { useAuth } from '@/providers/AuthProvider';
import { ProfessorService } from '@/services/ProfessorService';

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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  BarChart2, BookOpen, Calendar, Clock, FileText,
  ChevronRight, ChevronLeft, Plus, Users,
  Sparkles, Loader2, Lightbulb
} from 'lucide-react';

// Helper component for feature highlights
const FeatureHighlight = ({ type, isRTL }) => {
  const { t } = useTranslation();

  const getPositionClass = () => {
    switch(type) {
      case 'schedule': return 'left-1/4 bottom-1/4';
      case 'courses': return 'right-1/4 top-1/3';
      default: return 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className={`absolute p-3 bg-primary text-primary-foreground rounded shadow-xl max-w-xs animate-pulse ${getPositionClass()}`}>
        <div className="flex items-start">
          <Lightbulb className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">{t(`${type}Tip`)}</p>
            <p className="text-sm">{t(`${type}TipDesc`)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ item, t }) => {
  const getIcon = () => {
    switch(item.type) {
      case "assignments": return <FileText className="h-5 w-5 text-primary" />;
      case "messages": return <Users className="h-5 w-5 text-primary" />;
      default: return <Users className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-lg font-medium">{item.count}</p>
          <p className="text-sm text-muted-foreground">{t(item.type)} {t(item.label)}</p>
        </div>
        <div className="rounded-full p-2 bg-primary/10">
          {getIcon()}
        </div>
      </CardContent>
    </Card>
  );
};

// Course Card Component
const CourseCard = ({ course, onClick, t, isRTL }) => {
  return (
    <Card
      className="border hover:border-primary/20 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{course.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{course.nextClass}</span>
            </div>
          </div>
          <Badge variant="outline">
            {course.students} {t("students")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Activity Card Component
const ActivityCard = ({ activity, onViewClick, t }) => {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm">{activity.description}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewClick}>
            {t("view")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Tool Card Component
const ToolCard = ({ icon, title, onClick }) => {
  return (
    <Card
      className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
        {icon}
        <p className="text-sm font-medium">{title}</p>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const ProfessorDashboard = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const isRTL = locale === "ar";

  // State
  const [courses, setCourses] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featureHighlight, setFeatureHighlight] = useState(null);

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load courses
      const coursesResponse = await ProfessorService.getCourses();
      if (coursesResponse && coursesResponse.courses) {
        setCourses(coursesResponse.courses);
      }

      // Load pending items
      const pendingResponse = await ProfessorService.getPendingItems();
      if (pendingResponse && pendingResponse.items) {
        setPendingItems(pendingResponse.items);
      }

      // Load recent activities
      const activitiesResponse = await ProfessorService.getRecentActivities();
      if (activitiesResponse && activitiesResponse.activities) {
        setRecentActivities(activitiesResponse.activities);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to AI assistant with preset query
  const navigateToAIWithQuery = (query) => {
    router.push(`/${locale}/dashboard/professor/ai/assistant?query=${encodeURIComponent(query)}`);
  };

  // Feature highlight effect
  useEffect(() => {
    if (!featureHighlight) {
      const highlights = ['schedule', 'courses', 'assistants'];
      const highlightTimer = setTimeout(() => {
        const nextHighlight = highlights[Math.floor(Math.random() * highlights.length)];
        setFeatureHighlight(nextHighlight);

        setTimeout(() => {
          setFeatureHighlight(null);
        }, 5000);
      }, 10000);

      return () => clearTimeout(highlightTimer);
    }
  }, [featureHighlight]);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard greeting */}
      <div className="mb-4">
        <h1 className="text-2xl font-light mb-2">
          {t("welcomeBack", { name: user?.full_name || 'Professor' })}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboardDescription")}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendingItems.map((item) => (
          <StatCard key={item.id} item={item} t={t} />
        ))}
      </div>

      {/* Upcoming classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light">{t("upcomingClasses")}</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => router.push(`/${locale}/dashboard/professor/schedule`)}
          >
            {t("viewAll")} {!isRTL && <ChevronRight className="h-3 w-3 ml-1" />}
            {isRTL && <ChevronLeft className="h-3 w-3 mr-1" />}
          </Button>
        </div>

        <div className="space-y-3">
          {courses.length > 0 ? (
            courses.slice(0, 3).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => router.push(`/${locale}/dashboard/professor/courses/${course.id}`)}
                t={t}
                isRTL={isRTL}
              />
            ))
          ) : (
            <Card className="border">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">{t("noCourses")}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push(`/${locale}/dashboard/professor/courses/add`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addCourse")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("recentActivity")}</h2>
        <div className="space-y-2">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onViewClick={() => navigateToAIWithQuery(t("tellMeAbout", { activity: activity.description }))}
                t={t}
              />
            ))
          ) : (
            <Card className="border">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">{t("noRecentActivity")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Teaching tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("teachingTools")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ToolCard
            icon={<Calendar className="h-6 w-6 text-primary" />}
            title={t("schedule")}
            onClick={() => router.push(`/${locale}/dashboard/professor/schedule`)}
          />
          <ToolCard
            icon={<FileText className="h-6 w-6 text-primary" />}
            title={t("assignments")}
            onClick={() => router.push(`/${locale}/dashboard/professor/assignments`)}
          />
          <ToolCard
            icon={<BarChart2 className="h-6 w-6 text-primary" />}
            title={t("analytics")}
            onClick={() => router.push(`/${locale}/dashboard/professor/analytics/performance`)}
          />
          <ToolCard
            icon={<BookOpen className="h-6 w-6 text-primary" />}
            title={t("resources")}
            onClick={() => router.push(`/${locale}/dashboard/professor/materials`)}
          />
        </div>
      </div>

      {/* AI Assistant Promotion */}
      <Card className="mt-6 bg-muted/30 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            {t("aiAssistant")}
          </CardTitle>
          <CardDescription>
            {t("aiAssistantDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="gap-2"
              onClick={() => router.push(`/${locale}/dashboard/professor/ai/course-generator`)}
            >
              <BookOpen className="h-4 w-4" />
              <span>{t("generateNewCourse")}</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push(`/${locale}/dashboard/professor/ai/assignment-generator`)}
            >
              <FileText className="h-4 w-4" />
              <span>{t("createAssignment")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      {featureHighlight && <FeatureHighlight type={featureHighlight} isRTL={isRTL} />}
    </div>
  );
};

export default ProfessorDashboard;
