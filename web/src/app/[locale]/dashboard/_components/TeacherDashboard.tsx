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
  FileText,
  CheckSquare,
  BarChart2,
  MessageCircle,
  PlusCircle,
  ArrowRight,
  BookMarked,
  Clock
} from 'lucide-react';
import { ExploreSearch } from './ExploreSearch';

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  const classes = [
    { id: 1, name: "Mathematics 10A", students: 32, nextClass: "Today, 10:30 AM", progress: 68 },
    { id: 2, name: "Physics 11B", students: 28, nextClass: "Tomorrow, 2:00 PM", progress: 72 },
    { id: 3, name: "Chemistry Advanced", students: 24, nextClass: "Wednesday, 9:15 AM", progress: 85 },
  ];

  const pendingItems = [
    { id: 1, type: "Assignments", count: 12, label: "to grade" },
    { id: 2, type: "Messages", count: 5, label: "unread" },
    { id: 3, type: "Requests", count: 3, label: "pending" },
  ];

  const recentActivities = [
    { id: 1, type: "assignment", description: "Posted new assignment: 'Quadratic Equations Practice'", time: "2 hours ago" },
    { id: 2, type: "material", description: "Uploaded study material: 'Periodic Table Overview'", time: "Yesterday" },
    { id: 3, type: "grading", description: "Graded 28 assignments for Physics 11B", time: "2 days ago" },
  ];

  return (
    <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Teacher greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight">{t("teacherGreeting") || "Welcome back"}, {user?.full_name?.split(' ')[0] || t("teacher") || 'Teacher'}</h1>
        <p className="text-muted-foreground text-sm">{t("teacherSubgreeting") || "Manage your classes and support your students"}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendingItems.map(item => (
          <Card key={item.id} className="border">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">{item.count}</p>
                <p className="text-sm text-muted-foreground">{item.type} {item.label}</p>
              </div>
              <div className="rounded-full p-2 bg-primary/10">
                {item.type === "Assignments" ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : item.type === "Messages" ? (
                  <MessageCircle className="h-5 w-5 text-primary" />
                ) : (
                  <Users className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and explore section */}
      <ExploreSearch />

      {/* Your classes section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light">{t("yourClasses") || "Your Classes"}</h2>
          <Button variant="ghost" size="sm" className="text-xs">
            {t("viewAll") || "View all"} {!isRTL && <ArrowRight className="h-3 w-3 ml-1" />}
            {isRTL && <ArrowRight className="h-3 w-3 mr-1" />}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map(cls => (
            <Card key={cls.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300 cursor-pointer">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-medium">{cls.name}</h3>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{cls.students} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{cls.nextClass}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${cls.progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("progress") || "Progress"}: {cls.progress}%</span>
                  <Button variant="ghost" size="sm" className="text-primary">
                    {t("manage") || "Manage"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Teacher tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("teachingTools") || "Teaching Tools"}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("schedule") || "Schedule"}</p>
            </CardContent>
          </Card>
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("assignments") || "Assignments"}</p>
            </CardContent>
          </Card>
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("analytics") || "Analytics"}</p>
            </CardContent>
          </Card>
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <BookMarked className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t("resources") || "Resources"}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("recentActivity") || "Recent Activity"}</h2>
        <div className="space-y-2">
          {recentActivities.map(activity => (
            <Card key={activity.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    {t("view") || "View"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center pt-2">
          <Button variant="outline" size="sm">
            {t("viewMoreActivity") || "View more activity"}
          </Button>
        </div>
      </div>

      {/* Create new content button */}
      <div className="fixed bottom-8 right-8">
        <Button className="rounded-full w-12 h-12 p-0" onClick={() => router.push(`/${locale}/dashboard/create`)}>
          <PlusCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default TeacherDashboard;
