// app/[locale]/dashboard/_components/ParentDashboard.tsx
"use client";

import React from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Bell,
  MessageCircle,
  Bookmark,
  ArrowRight,
  Clock,
  User,
  FileText,
  Award
} from 'lucide-react';
import { ExploreSearch } from './ExploreSearch';

const ParentDashboard = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  // Sample data for a parent dashboard
  const children = [
    {
      id: 1,
      name: "Amina",
      grade: "10th Grade",
      school: "International Academy",
      upcomingAssignments: 3,
      lastActivity: "1 hour ago",
      progress: 78,
      subjects: [
        { name: "Mathematics", grade: "A-", progress: 85 },
        { name: "Physics", grade: "B+", progress: 72 },
        { name: "Arabic Literature", grade: "A", progress: 92 }
      ]
    },
    {
      id: 2,
      name: "Karim",
      grade: "7th Grade",
      school: "International Academy",
      upcomingAssignments: 5,
      lastActivity: "Yesterday",
      progress: 65,
      subjects: [
        { name: "Science", grade: "B", progress: 70 },
        { name: "History", grade: "B+", progress: 75 },
        { name: "English", grade: "A-", progress: 88 }
      ]
    }
  ];

  const notifications = [
    { id: 1, type: "assignment", child: "Amina", description: "Has a mathematics test tomorrow", time: "1 day" },
    { id: 2, type: "grade", child: "Karim", description: "Received a B+ on history project", time: "2 days" },
    { id: 3, type: "message", child: "Amina", description: "Teacher requested a parent-teacher meeting", time: "3 days" },
  ];

  return (
    <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Parent greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight">{t("parentGreeting") || "Welcome"}, {user?.full_name?.split(' ')[0] || t("parent") || 'Parent'}</h1>
        <p className="text-muted-foreground text-sm">{t("parentSubgreeting") || "Track your child's progress and stay involved in their education"}</p>
      </div>

      {/* Children overview */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("childrenOverview") || "Children Overview"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map(child => (
            <Card key={child.id} className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{child.name}</h3>
                      <p className="text-xs text-muted-foreground">{child.grade} • {child.school}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/children/${child.id}`)}>
                    {t("view") || "View"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("overallProgress") || "Overall Progress"}</span>
                    <span className="font-medium">{child.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${child.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-background rounded-lg border">
                    <FileText className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <p>{child.upcomingAssignments}</p>
                    <p className="text-muted-foreground">{t("assignments") || "Assignments"}</p>
                  </div>
                  <div className="p-2 bg-background rounded-lg border">
                    <Award className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                    <p>{child.subjects[0].grade}</p>
                    <p className="text-muted-foreground">{t("bestGrade") || "Best Grade"}</p>
                  </div>
                  <div className="p-2 bg-background rounded-lg border">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p>{child.lastActivity}</p>
                    <p className="text-muted-foreground">{t("activity") || "Activity"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Recent notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light">{t("recentNotifications") || "Recent Notifications"}</h2>
          <Button variant="ghost" size="sm" className="text-xs">
            {t("viewAll") || "View all"} {!isRTL && <ArrowRight className="h-3 w-3 ml-1" />}
            {isRTL && <ArrowRight className="h-3 w-3 mr-1" />}
          </Button>
        </div>
        <div className="space-y-2">
          {notifications.map(notification => (
            <Card key={notification.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                    {notification.type === "assignment" ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : notification.type === "grade" ? (
                      <Award className="h-4 w-4 text-primary" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-medium">{notification.child}</span> {notification.description}</p>
                    <p className="text-xs text-muted-foreground">{notification.time} {t("ago") || "ago"}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    {t("details") || "Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Parent tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("parentTools") || "Parent Tools"}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("schedule") || "Schedule"}</p>
            </CardContent>
          </Card>
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("progress") || "Progress"}</p>
            </CardContent>
          </Card>
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("messages") || "Messages"}</p>
            </CardContent>
          </Card>
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("teachers") || "Teachers"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resources for parents */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className={`flex flex-col md:flex-row gap-6 items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">{t("parentResources") || "Resources for Parents"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("parentResourcesDesc") || "Discover guides, tips, and strategies to help support your child's learning journey at home and at school."}
              </p>
              <Button variant="outline">{t("exploreResources") || "Explore resources"}</Button>
            </div>
            <div className="flex-shrink-0 rounded-full p-4 bg-white/80 dark:bg-black/20">
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboard;
