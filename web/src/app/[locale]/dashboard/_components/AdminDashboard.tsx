// app/[locale]/dashboard/_components/AdminDashboard.tsx
"use client";

import React from 'react';
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
  PenTool
} from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  // Sample data for admin dashboard
  const stats = [
    { id: 1, title: "Total Students", value: 1247, change: "+5.3%", icon: <Users className="h-5 w-5" /> },
    { id: 2, title: "Total Teachers", value: 84, change: "+2.1%", icon: <PenTool className="h-5 w-5" /> },
    { id: 3, title: "Active Courses", value: 156, change: "+8.4%", icon: <BookOpen className="h-5 w-5" /> },
    { id: 4, title: "System Usage", value: "92%", change: "+3.7%", icon: <BarChart2 className="h-5 w-5" /> },
  ];

  const quickActions = [
    { id: 1, title: "Add User", icon: <UserPlus className="h-5 w-5" />, path: "/admin/users/add" },
    { id: 2, title: "School Settings", icon: <School className="h-5 w-5" />, path: "/admin/settings/school" },
    { id: 3, title: "System Settings", icon: <Settings className="h-5 w-5" />, path: "/admin/settings/system" },
    { id: 4, title: "Security", icon: <Shield className="h-5 w-5" />, path: "/admin/security" },
    { id: 5, title: "Courses", icon: <Layers className="h-5 w-5" />, path: "/admin/courses" },
    { id: 6, title: "Reports", icon: <FileText className="h-5 w-5" />, path: "/admin/reports" },
  ];

  const recentActivity = [
    { id: 1, type: "user", description: "New teacher account created", time: "10 minutes ago" },
    { id: 2, type: "course", description: "New course 'Advanced Physics' added", time: "2 hours ago" },
    { id: 3, type: "system", description: "System backup completed", time: "Yesterday" },
    { id: 4, type: "security", description: "Security audit completed", time: "2 days ago" },
  ];

  return (
    <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Admin greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight">{t("adminGreeting") || "Welcome back"}, {user?.full_name?.split(' ')[0] || t("admin") || 'Admin'}</h1>
        <p className="text-muted-foreground text-sm">{t("adminSubgreeting") || "Manage your school and platform settings"}</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.id} className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-full p-2 bg-primary/10">
                  {stat.icon}
                </div>
                <div className="flex items-center text-xs text-green-600">
                  {stat.change}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
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

      <Separator />

      {/* System status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">{t("recentActivity") || "Recent Activity"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                  {activity.type === "user" ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : activity.type === "course" ? (
                    <BookOpen className="h-4 w-4 text-primary" />
                  ) : activity.type === "system" ? (
                    <Database className="h-4 w-4 text-primary" />
                  ) : (
                    <Shield className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2">
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
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm">Server Status</p>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm">Database</p>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm">AI Services</p>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm">Storage</p>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  72% Used
                </span>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Latest Updates</p>
              <div className="text-xs text-muted-foreground">
                <p>• Platform v2.4.0 deployed (3 days ago)</p>
                <p>• Security patches applied (1 week ago)</p>
                <p>• Database optimization completed (1 week ago)</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              {t("viewSystemDashboard") || "View system dashboard"}
            </Button>
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
