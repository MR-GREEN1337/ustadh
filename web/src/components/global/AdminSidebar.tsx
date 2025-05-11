// components/global/AdminSidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import { useAuth } from "@/providers/AuthProvider";
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  Settings,
  Users,
  School,
  Building,
  GraduationCap,
  MessageSquare,
  Bell,
  ClipboardList,
  Briefcase,
  User,
  FileCog,
  FileText,
  Calendar,
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Lock,
  ShieldAlert,
  Database,
  Share2,
  BarChart,
  UserCheck,
  Plus,
  Bug,
  Gauge,
  Activity,
  Mail
} from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";
import { BugReportDialog } from "./BugReportDialog";
import { RoleBasedOnboardingCard } from "./RoleBasedOnboardingCard";

interface SidebarState {
  dashboardOpen: boolean;
  userManagementOpen: boolean;
  schoolManagementOpen: boolean;
  academicManagementOpen: boolean;
  reportingOpen: boolean;
  systemSettingsOpen: boolean;
  communicationOpen: boolean;
}

interface SideBarElementProps {
  children: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  collapsibleState?: boolean;
  setCollapsibleState?: (state: boolean) => void;
  onClick?: () => void;
  exactPath?: boolean;
  isParent?: boolean;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  isNew?: boolean;
  closeSidebar?: () => void;
}

// Memoize the sidebar element to prevent unnecessary re-renders
const SideBarElement = memo(({
  children,
  href,
  icon,
  collapsible = false,
  collapsibleState,
  setCollapsibleState,
  onClick,
  exactPath = false,
  isParent = false,
  badge,
  badgeVariant = "secondary",
  isNew = false,
  closeSidebar,
}: SideBarElementProps) => {
  const pathname = usePathname();
  const { locale } = useParams();
  const isRTL = locale === "ar";

  // Determine if current path is an exact match or a child of this path
  const isExactMatch = pathname === href;
  const isChildPath = pathname?.startsWith(href || '') && pathname !== href;

  let isActive;

  if (isParent) {
    isActive = isExactMatch || isChildPath;
  } else if (exactPath) {
    isActive = isExactMatch;
  } else {
    isActive = isExactMatch || (isChildPath && href !== `/${locale}/dashboard`);
  }

  // Icon and text container with RTL support
  const contentContainer = (
    <div className={cn("flex items-center gap-2 flex-1", isRTL ? "flex-row-reverse text-right" : "")}>
      {icon && (
        <span className={cn("text-muted-foreground", isActive ? "text-primary" : "")}>
          {icon}
        </span>
      )}
      <span className="text-sm font-medium">{children}</span>
      {isNew && (
        <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
          {isRTL ? "جديد" : "New"}
        </Badge>
      )}
      {badge && (
        <Badge variant={badgeVariant} className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
    </div>
  );

  if (collapsible) {
    const buttonClass = cn(
      "flex items-center py-2 px-3 w-full rounded-md justify-between transition-colors",
      isActive ? "bg-secondary text-sm font-medium" : "text-sm hover:bg-muted",
      isRTL ? "flex-row-reverse" : ""
    );

    return (
      <div className={cn("flex w-full items-center", isRTL ? "flex-row-reverse" : "")}>
        <div className={cn("flex-grow", isRTL ? "text-right" : "")}>
          {href ? (
            <Link href={href} className="w-full block" onClick={closeSidebar}>
              <div className={buttonClass}>
                {contentContainer}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCollapsibleState?.(!collapsibleState);
                  }}
                >
                  {collapsibleState ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </Link>
          ) : (
            <div
              className={buttonClass}
              onClick={() => setCollapsibleState?.(!collapsibleState)}
              role="button"
              tabIndex={0}
            >
              {contentContainer}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsibleState?.(!collapsibleState);
                }}
              >
                {collapsibleState ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (href && isActive) {
    return (
      <div className={cn(
        "flex justify-start items-center bg-secondary rounded-md text-sm font-medium py-2 px-3 transition-colors",
        isRTL ? "flex-row-reverse text-right" : ""
      )}>
        {contentContainer}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className="w-full block" onClick={closeSidebar}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start py-2 px-3 hover:bg-muted transition-colors",
            isRTL ? "flex-row-reverse text-right" : ""
          )}
        >
          {contentContainer}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start py-2 px-3 transition-colors",
        isRTL ? "flex-row-reverse text-right" : ""
      )}
      onClick={() => {
        if (onClick) onClick();
        if (closeSidebar) closeSidebar();
      }}
    >
      {contentContainer}
    </Button>
  );
});

SideBarElement.displayName = "SideBarElement";

// Extract nested menu for better organization
const NestedMenu = memo(({
  isOpen,
  children,
  isRTL = false
}: {
  isOpen: boolean,
  children: React.ReactNode,
  isRTL?: boolean
}) => {
  if (!isOpen) return null;

  return (
    <div className={cn(
      "space-y-1 my-1 pl-4 border-l transition-all max-h-96 overflow-y-auto",
      isRTL ? "mr-4 border-l-0 border-r" : "ml-4"
    )}>
      {children}
    </div>
  );
});

NestedMenu.displayName = "NestedMenu";

// Recent notifications component
const PendingActions = ({ locale, closeSidebar }: { locale: string; closeSidebar?: () => void }) => {
  const { t } = useTranslation();
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = locale === "ar";

  useEffect(() => {
    const fetchPendingItems = async () => {
      setLoading(true);
      try {
        // This would be a real API call in production
        // Simulate fetching data with a timeout
        setTimeout(() => {
          setPendingItems([
            {
              id: 'pending-approvals',
              count: 3,
              label: t('pendingApprovals') || 'Pending Approvals'
            },
            {
              id: 'security-alerts',
              count: 1,
              label: t('securityAlerts') || 'Security Alerts',
              variant: 'destructive'
            }
          ] as any);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching pending items:", error);
        setPendingItems([]);
        setLoading(false);
      }
    };

    fetchPendingItems();
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        <h3 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t("pendingActions") || "Pending Actions"}</h3>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t("pendingActions") || "Pending Actions"}</h3>
      <div className="space-y-1">
        {pendingItems.map((item: any) => (
          <SideBarElement
            key={item.id}
            href={`/${locale}/dashboard/admin/${item.id.replace('-', '/')}`}
            icon={item.id === 'security-alerts' ? <ShieldAlert className="h-3.5 w-3.5" /> : <FileCheck className="h-3.5 w-3.5" />}
            badge={item.count}
            badgeVariant={item.variant || "secondary"}
            exactPath={true}
            closeSidebar={closeSidebar}
          >
            {item.label}
          </SideBarElement>
        ))}
      </div>
    </div>
  );
};

export function AdminSidebar({ className, isMobile = false }: { className?: string, isMobile?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const pathname = usePathname();
  const router = useRouter();
  const closeSidebar = isMobile ? () => { } : undefined; // Will be passed from MobileSidebar
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  const [sidebarState, setSidebarState] = useState<SidebarState>({
    dashboardOpen: pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/admin`,
    userManagementOpen: pathname?.includes('/dashboard/admin/users'),
    schoolManagementOpen: pathname?.includes('/dashboard/admin/school'),
    academicManagementOpen: pathname?.includes('/dashboard/admin/academic'),
    reportingOpen: pathname?.includes('/dashboard/admin/reports') || pathname?.includes('/dashboard/admin/analytics'),
    systemSettingsOpen: pathname?.includes('/dashboard/admin/settings'),
    communicationOpen: pathname?.includes('/dashboard/admin/communication'),
  });

  // Auto-expand the relevant section based on current path
  useEffect(() => {
    const newState = { ...sidebarState };

    if (pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/admin`) {
      newState.dashboardOpen = true;
    }
    if (pathname?.includes('/dashboard/admin/users')) {
      newState.userManagementOpen = true;
    }
    if (pathname?.includes('/dashboard/admin/school')) {
      newState.schoolManagementOpen = true;
    }
    if (pathname?.includes('/dashboard/admin/academic')) {
      newState.academicManagementOpen = true;
    }
    if (pathname?.includes('/dashboard/admin/reports') || pathname?.includes('/dashboard/admin/analytics')) {
      newState.reportingOpen = true;
    }
    if (pathname?.includes('/dashboard/admin/settings')) {
      newState.systemSettingsOpen = true;
    }
    if (pathname?.includes('/dashboard/admin/communication')) {
      newState.communicationOpen = true;
    }

    setSidebarState(newState);
  }, [pathname]);

  const updateSidebarState = (key: keyof SidebarState, value: boolean) => {
    setSidebarState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("w-64 h-full bg-background border-r flex flex-col", className)}>
      {/* Logo and branding section */}
      <div className="pt-2 border-b flex-shrink-0">
        <div className="flex justify-center">
          <Logo hideBadge={false} url={`/${locale}/dashboard`} />
        </div>
      </div>

      {/* Navigation menu with scrollable area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3">
          <nav className="space-y-1 mt-4 pb-8">
            {/* Dashboard */}
            <SideBarElement
              href={`/${locale}/dashboard/admin`}
              icon={<LayoutDashboard className="w-4 h-4" />}
              exactPath={true}
              closeSidebar={closeSidebar}
            >
              {t("dashboard") || "Dashboard"}
            </SideBarElement>

            <Separator className="my-3" />

            {/* User Management Section */}
            <SideBarElement
              href={`/${locale}/dashboard/admin/users`}
              icon={<Users className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.userManagementOpen}
              setCollapsibleState={(state) => updateSidebarState('userManagementOpen', state)}
              isParent={true}
            >
              {t("userManagement") || "User Management"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.userManagementOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/admin/users`}
                icon={<Users className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("allUsers") || "All Users"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/users/students`}
                icon={<GraduationCap className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("students") || "Students"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/users/teachers`}
                icon={<Briefcase className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("teachers") || "Teachers"}
              </SideBarElement>
              {/*
              <SideBarElement
                href={`/${locale}/dashboard/admin/users/parents`}
                icon={<UserCheck className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("parents") || "Parents"}
              </SideBarElement>
              */}
              <SideBarElement
                href={`/${locale}/dashboard/admin/users/add`}
                icon={<Plus className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("addUser") || "Add User"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/users/roles`}
                icon={<Lock className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("rolesPermissions") || "Roles & Permissions"}
              </SideBarElement>
            </NestedMenu>

            {/* School Management Section */}
            <SideBarElement
              href={`/${locale}/dashboard/admin/school`}
              icon={<School className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.schoolManagementOpen}
              setCollapsibleState={(state) => updateSidebarState('schoolManagementOpen', state)}
              isParent={true}
            >
              {t("schoolManagement") || "School Management"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.schoolManagementOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/admin/school/profile`}
                icon={<Building className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("schoolProfile") || "School Profile"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/school/departments`}
                icon={<Briefcase className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("departments") || "Departments"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/school/classes`}
                icon={<Users className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("classes") || "Classes"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/school/staff`}
                icon={<UserCheck className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("staffDirectory") || "Staff Directory"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/school/calendar`}
                icon={<Calendar className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("academicCalendar") || "Academic Calendar"}
              </SideBarElement>
            </NestedMenu>

            {/* Academic Management Section */}
            <SideBarElement
              href={`/${locale}/dashboard/admin/academic`}
              icon={<BookOpen className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.academicManagementOpen}
              setCollapsibleState={(state) => updateSidebarState('academicManagementOpen', state)}
              isParent={true}
            >
              {t("academicManagement") || "Academic Management"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.academicManagementOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/admin/academic/courses`}
                icon={<BookOpen className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("courses") || "Courses"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/academic/assignments`}
                icon={<ClipboardList className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("assignments") || "Assignments"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/academic/materials`}
                icon={<FileText className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("learningMaterials") || "Learning Materials"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/academic/curriculum`}
                icon={<FileCog className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("curriculum") || "Curriculum Management"}
              </SideBarElement>
            </NestedMenu>

            {/* Analytics & Reporting Section */}
            <SideBarElement
              href={`/${locale}/dashboard/admin/analytics`}
              icon={<BarChart className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.reportingOpen}
              setCollapsibleState={(state) => updateSidebarState('reportingOpen', state)}
              isParent={true}
            >
              {t("analyticsReporting") || "Analytics & Reporting"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.reportingOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/admin/analytics/school`}
                icon={<BarChart2 className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("schoolPerformance") || "School Performance"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/analytics/attendance`}
                icon={<UserCheck className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("attendanceReports") || "Attendance Reports"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/analytics/academic`}
                icon={<Gauge className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("academicMetrics") || "Academic Metrics"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/analytics/usage`}
                icon={<Activity className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("platformUsage") || "Platform Usage"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/analytics/custom`}
                icon={<FileCog className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("customReports") || "Custom Reports"}
              </SideBarElement>
            </NestedMenu>

            {/* System Settings */}
            <SideBarElement
              href={`/${locale}/dashboard/admin/settings`}
              icon={<Settings className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.systemSettingsOpen}
              setCollapsibleState={(state) => updateSidebarState('systemSettingsOpen', state)}
              isParent={true}
            >
              {t("systemSettings") || "System Settings"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.systemSettingsOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/admin/settings/school`}
                icon={<Building className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("schoolSettings") || "School Settings"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/settings/security`}
                icon={<Lock className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("securitySettings") || "Security Settings"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/settings/integrations`}
                icon={<Share2 className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("integrations") || "Integrations"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/settings/ai`}
                icon={<Database className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
                isNew={true}
              >
                {t("aiSettings") || "AI Settings"}
              </SideBarElement>
            </NestedMenu>

            {/* Communication */}
            <SideBarElement
              href={`/${locale}/dashboard/admin/communication`}
              icon={<MessageSquare className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.communicationOpen}
              setCollapsibleState={(state) => updateSidebarState('communicationOpen', state)}
              isParent={true}
            >
              {t("communication") || "Communication"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.communicationOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/admin/communication/announcements`}
                icon={<Bell className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("announcements") || "Announcements"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/communication/messages`}
                icon={<Mail className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("messages") || "Messages"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/admin/communication/notifications`}
                icon={<Bell className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("notificationSettings") || "Notification Settings"}
              </SideBarElement>
            </NestedMenu>

            {/* Pending Actions section */}
            <PendingActions locale={locale as any} closeSidebar={closeSidebar} />

            {/* Profile section */}
            <Separator className="my-3" />

            <SideBarElement
              href={`/${locale}/dashboard/profile`}
              icon={<User className="w-4 h-4" />}
              exactPath={true}
              closeSidebar={closeSidebar}
            >
              {t("profile") || "Profile"}
            </SideBarElement>
          </nav>
        </ScrollArea>
      </div>

      {/* Footer section with settings */}
      <div className="p-3 border-t flex-shrink-0 space-y-1">
        {!user?.has_onboarded && (
          <RoleBasedOnboardingCard closeSidebar={closeSidebar} />
        )}
        <SideBarElement
          icon={<Bug className="w-4 h-4" />}
          onClick={() => setIsBugReportOpen(true)}
          closeSidebar={closeSidebar}
        >
          {t("reportBug") || "Report Bug"}
        </SideBarElement>

        <SideBarElement
          href={`/${locale}/dashboard/settings`}
          icon={<Settings className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("settings") || "Settings"}
        </SideBarElement>
      </div>

      {/* Bug Report Dialog */}
      <BugReportDialog
        isOpen={isBugReportOpen}
        setIsOpen={setIsBugReportOpen}
      />
    </div>
  );
};
