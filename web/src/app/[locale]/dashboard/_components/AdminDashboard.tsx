"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  School,
  UserPlus,
  BookOpen,
  Settings,
  BarChart2,
  Shield,
  Database,
  ArrowUpRight,
  ArrowRight,
  Layers,
  FileText,
  PenTool,
  Loader2,
  GraduationCap,
  Calendar,
  BookMarked,
  Presentation
} from 'lucide-react';

// Import the AdminDashboardService
import AdminDashboardService, { SchoolStats, SchoolUser, SchoolCourse, RecentActivity } from '@/services/AdminDashboardService';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [recentStudents, setRecentStudents] = useState<SchoolUser[]>([]);
  const [recentTeachers, setRecentTeachers] = useState<SchoolUser[]>([]);
  const [recentCourses, setRecentCourses] = useState<SchoolCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch the dashboard summary using the service
        const summary = await AdminDashboardService.getDashboardSummary();

        // Update state with fetched data
        setStats(summary.stats);
        setRecentStudents(summary.recentStudents);
        setRecentTeachers(summary.recentTeachers);
        setRecentCourses(summary.recentCourses);

        setError(null);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");

        // If API fails, try to get at least the stats
        try {
          const fallbackStats = await AdminDashboardService.fetchSchoolStats();
          setStats(fallbackStats);
        } catch (fallbackErr) {
          console.error("Fallback stats also failed:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Helper function to get the appropriate icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="h-4 w-4 text-primary" />;
      case "course":
        return <BookOpen className="h-4 w-4 text-primary" />;
      case "system":
        return <Database className="h-4 w-4 text-primary" />;
      case "security":
        return <Shield className="h-4 w-4 text-primary" />;
      default:
        return <Database className="h-4 w-4 text-primary" />;
    }
  };

  // Define quick actions
  const quickActions = [
    { id: 1, title: t("addUser") || "Add User", icon: <UserPlus className="h-5 w-5" />, path: "/admin/users/add" },
    { id: 2, title: t("schoolSettings") || "School Settings", icon: <School className="h-5 w-5" />, path: "/admin/settings/school" },
    { id: 3, title: t("systemSettings") || "System Settings", icon: <Settings className="h-5 w-5" />, path: "/admin/settings/system" },
    { id: 4, title: t("security") || "Security", icon: <Shield className="h-5 w-5" />, path: "/admin/security" },
    { id: 5, title: t("courses") || "Courses", icon: <Layers className="h-5 w-5" />, path: "/admin/courses" },
    { id: 6, title: t("reports") || "Reports", icon: <FileText className="h-5 w-5" />, path: "/admin/reports" },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t("loading") || "Loading dashboard..."}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">{t("errorOccurred") || "Error Occurred"}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t("tryAgain") || "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Admin greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight">{t("adminGreeting") || "Welcome back"}, {user?.full_name?.split(' ')[0] || t("admin") || 'Admin'}</h1>
        <p className="text-muted-foreground text-sm">{t("adminSubgreeting") || "Manage your school and platform settings"}</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats && [
          { id: 1, title: t("totalStudents") || "Total Students", value: stats.totalStudents, icon: <Users className="h-5 w-5" /> },
          { id: 2, title: t("totalTeachers") || "Total Teachers", value: stats.totalTeachers, icon: <PenTool className="h-5 w-5" /> },
          { id: 3, title: t("activeCourses") || "Active Courses", value: stats.activeCourses, icon: <BookOpen className="h-5 w-5" /> },
          { id: 4, title: t("systemUsage") || "System Usage", value: stats.systemUsage, icon: <BarChart2 className="h-5 w-5" /> },
        ].map(stat => (
          <Card key={stat.id} className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-full p-2 bg-primary/10">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("quickActions") || "Quick Actions"}</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {quickActions.map(action => (
            <Card
              key={action.id}
              className="border hover:border-primary/20 transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard${action.path}`)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="rounded-full p-2 bg-primary/10">
                  {action.icon}
                </div>
                <p className="text-sm font-medium">{action.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Management shortcuts */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("managementPages") || "Management Pages"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Users className="h-5 w-5 mr-2" />
                {t("studentManagement") || "Student Management"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("studentManagementDesc") || "View, add and manage all students, including enrollments, classes and academic data."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/students`)}>
                  {t("allStudents") || "All Students"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/students/add`)}>
                  {t("addStudent") || "Add Student"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/enrollments`)}>
                  {t("enrollments") || "Enrollments"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <PenTool className="h-5 w-5 mr-2" />
                {t("teacherManagement") || "Teacher Management"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("teacherManagementDesc") || "View, add and manage faculty members including qualifications and course assignments."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/teachers`)}>
                  {t("allTeachers") || "All Teachers"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/teachers/add`)}>
                  {t("addTeacher") || "Add Teacher"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/assignments`)}>
                  {t("assignments") || "Assignments"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                {t("courseManagement") || "Course Management"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("courseManagementDesc") || "Manage courses, academic content, and teaching materials across departments."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/courses`)}>
                  {t("allCourses") || "All Courses"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/courses/add`)}>
                  {t("addCourse") || "Add Course"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/materials`)}>
                  {t("materials") || "Materials"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <School className="h-5 w-5 mr-2" />
                {t("academicStructure") || "Academic Structure"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("academicStructureDesc") || "Manage departments, classes, and academic units within your institution."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/departments`)}>
                  {t("departments") || "Departments"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/classes`)}>
                  {t("classes") || "Classes"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/schedules`)}>
                  {t("schedules") || "Schedules"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {t("reportsAnalytics") || "Reports & Analytics"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("reportsAnalyticsDesc") || "Generate reports, view analytics, and export data for academic performance."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/reports`)}>
                  {t("allReports") || "All Reports"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/reports/academic`)}>
                  {t("academicReports") || "Academic"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/reports/attendance`)}>
                  {t("attendanceReports") || "Attendance"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                {t("systemSettings") || "System Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("systemSettingsDesc") || "Configure school information, academic year, integrations and system preferences."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/settings/school`)}>
                  {t("schoolSettings") || "School Settings"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/settings/system`)}>
                  {t("systemPreferences") || "System"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/announcements`)}>
                  {t("announcements") || "Announcements"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* System status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">{t("recentActivity") || "Recent Activity"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && stats.recentActivity.map((activity: RecentActivity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => router.push(`/${locale}/dashboard/admin/activity`)}>
              {t("viewAllActivity") || "View all activity"}
            </Button>
          </CardContent>
        </Card>

        {/* System health */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">{t("systemStatus") || "System Status"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && stats.systemStatus && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Server Status</p>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {stats.systemStatus.serverStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Database</p>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {stats.systemStatus.databaseStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">AI Services</p>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {stats.systemStatus.aiServicesStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Storage</p>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {stats.systemStatus.storageUsage}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Latest Updates</p>
                  <div className="text-xs text-muted-foreground">
                    {stats.systemStatus.latestUpdates.map((update, index) => (
                      <p key={index}>• {update}</p>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push(`/${locale}/dashboard/admin/system`)}>
              {t("viewSystemDashboard") || "View system dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Students and Teachers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t("recentStudents") || "Recent Students"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/students`)}>
              {t("viewAll") || "View all"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.education_level}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/dashboard/admin/students/${student.id}`);
                      }}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("noRecentStudents") || "No recent students"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Teachers */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{t("recentTeachers") || "Recent Teachers"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/admin/teachers`)}>
              {t("viewAll") || "View all"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTeachers.length > 0 ? (
                recentTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center">
                        <PenTool className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{teacher.full_name}</p>
                        <p className="text-xs text-muted-foreground">{teacher.staff_type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/${locale}/dashboard/admin/teachers/${teacher.id}`);
                      }}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("noRecentTeachers") || "No recent teachers"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin tools section */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("advancedTools") || "Advanced Management Tools"}</h2>
        <Card className="border-0 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900/40 dark:to-zinc-900/20">
          <CardContent className="p-6">
            <div className={`flex flex-col md:flex-row gap-6 items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-1">{t("dataManagement") || "School Data Management"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dataManagementDesc") || "Access comprehensive tools for managing student data, academic records, course materials, and system configurations."}
                </p>
                <div className="flex gap-2">
                  <Button variant="default" onClick={() => router.push(`/${locale}/dashboard/admin/data`)}>
                    {t("manageData") || "Manage data"}
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/reports`)}>
                    {t("generateReports") || "Generate reports"}
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 rounded-full p-4 bg-primary/10">
                <Database className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
