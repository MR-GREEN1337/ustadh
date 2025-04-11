"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useParams } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  School as SchoolIcon,
  BookOpen,
  Briefcase,
  Layout,
  BarChart2,
  Settings,
  Bell,
  LineChart,
  Calendar,
  Shield,
  FileText,
  Gauge,
  Building,
  ArrowRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { locale } = useParams();
  const { t } = useTranslation();
  const isRTL = locale === "ar";

  // Mock data for stats
  const stats = [
    { id: 1, title: "Total Students", value: "1,247", change: "+5.3%", icon: <Users className="h-5 w-5" /> },
    { id: 2, title: "Total Teachers", value: "84", change: "+2.1%", icon: <Briefcase className="h-5 w-5" /> },
    { id: 3, title: "Active Courses", value: "156", change: "+8.4%", icon: <BookOpen className="h-5 w-5" /> },
    { id: 4, title: "System Usage", value: "92%", change: "+3.7%", icon: <BarChart2 className="h-5 w-5" /> },
  ];

  // Admin quick links
  const adminLinks = [
    {
      id: "users",
      title: "User Management",
      description: "Manage student, teacher, and parent accounts",
      icon: <Users className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/users`
    },
    {
      id: "classes",
      title: "Class Management",
      description: "Configure classes, sections, and enrollment",
      icon: <SchoolIcon className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/classes`
    },
    {
      id: "courses",
      title: "Course Management",
      description: "Set up academic courses and curriculum",
      icon: <BookOpen className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/courses`
    },
    {
      id: "staff",
      title: "Staff Management",
      description: "Manage teachers and administrative staff",
      icon: <Briefcase className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/staff`
    },
    {
      id: "departments",
      title: "Department Management",
      description: "Organize school academic departments",
      icon: <Layout className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/departments`
    },
    {
      id: "analytics",
      title: "Analytics & Reporting",
      description: "View school performance metrics and reports",
      icon: <LineChart className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/analytics`
    },
    {
      id: "settings",
      title: "School Settings",
      description: "Configure school profile and system settings",
      icon: <Settings className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/settings`
    },
    {
      id: "announcements",
      title: "Announcements",
      description: "Publish school-wide announcements and notices",
      icon: <Bell className="h-10 w-10 text-primary/60" />,
      link: `/${locale}/dashboard/admin/announcements`
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-full p-2 bg-primary/10">
                  {stat.icon}
                </div>
                <div className="text-xs text-green-600">
                  {stat.change}
                  <ArrowRight className="inline-block h-3 w-3 ml-1" />
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

      <div>
        <h2 className="text-2xl font-semibold mb-6">{t("adminTools") || "Administration Tools"}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminLinks.map((item) => (
            <Link href={item.link} key={item.id}>
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {item.icon}
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">{t(item.id) || item.title}</CardTitle>
                  <CardDescription>{t(`${item.id}Desc`) || item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* System status section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">{t("systemStatus") || "System Status"}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* System health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t("systemHealth") || "System Health"}
              </CardTitle>
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
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                {t("viewSystemDashboard") || "View system dashboard"}
              </Button>
            </CardFooter>
          </Card>

          {/* Recent activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {t("recentActivity") || "Recent Activity"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New teacher account created</p>
                    <p className="text-xs text-muted-foreground">10 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New course 'Advanced Physics' added</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">System backup completed</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-primary/10 flex-shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Security audit completed</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                {t("viewAllActivity") || "View all activity"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
