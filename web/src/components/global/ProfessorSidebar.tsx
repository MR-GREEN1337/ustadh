// components/global/ProfessorSidebar.tsx
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
  BookOpen,
  Calendar,
  FileText,
  Settings,
  Users,
  School,
  PenTool,
  Layers,
  Clock,
  Building,
  GraduationCap,
  MessageSquare,
  Bell,
  ClipboardList,
  UserCheck,
  Briefcase,
  Share2,
  Brain,
  Gauge,
  Sparkles,
  User,
  Bot,
  Plus,
  Bug,
  BrainCircuitIcon
} from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClassItem, ProfessorService } from "@/services/ProfessorService";
import { Skeleton } from "../ui/skeleton";
import { BugReportDialog } from "./BugReportDialog";
import { RoleBasedOnboardingCard } from "./RoleBasedOnboardingCard";
import { AddClassDialog } from "@/app/[locale]/dashboard/professor/classes/_components/AddClassDialog";
import ProfessorAssignmentService from "@/services/ProfessorAssignmentService";

interface SidebarState {
  dashboardOpen: boolean;
  coursesOpen: boolean;
  studentsOpen: boolean;
  materialsOpen: boolean;
  assessmentsOpen: boolean;
  analyticsOpen: boolean;
  aiToolsOpen: boolean;
  myClassesOpen: boolean; // New state for My Classes section
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

// Recent courses component
const RecentCourses = ({ locale, closeSidebar }: { locale: string; closeSidebar: () => void }) => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = locale === "ar";

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await ProfessorService.getCourses();
        if (response && response.courses) {
          setCourses(response.courses.slice(0, 3) as any);
        } else {
          // Fallback for development - would be removed in production
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleClassCreated = () => {
    // Refresh the recent classes section
    const fetchClasses = async () => {
      try {
        const response = await ProfessorService.getCourses();
        if (response && response.courses) {
          setCourses(response.courses.slice(0, 3) as any);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      }
    };

    fetchClasses();
  };

  // Format the date to display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        <h3 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t("activeCourses")}</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t("activeCourses")}</h3>
      <div className="space-y-1">
        {courses.map((course: any) => (
          <SideBarElement
            key={course.id}
            href={`/${locale}/dashboard/professor/courses/${course.id}`}
            icon={<BookOpen className="h-3.5 w-3.5" />}
            exactPath={true}
            closeSidebar={closeSidebar}
          >
            <div className="flex justify-between w-full">
              <span className="truncate">{course.title}</span>
              {course.nextClass && (
                <span className="text-xs text-muted-foreground ml-1 shrink-0">{formatDate(course.nextClass)}</span>
              )}
            </div>
          </SideBarElement>
        ))}

        <SideBarElement
          href={`/${locale}/dashboard/professor/courses`}
          icon={<Plus className="h-3.5 w-3.5" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("allCourses")}
        </SideBarElement>
      </div>
    </div>
  );
};

// Classes I Teach component
const MyClassesSection = ({ locale, closeSidebar }: { locale: string; closeSidebar: () => void }) => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isRTL = locale === "ar";

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        // Using ProfessorService to get the classes the professor teaches
        const response = await ProfessorAssignmentService.getTeachingClasses();
        if (response && response.classes) {
          setClasses(response.classes.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            academicYear: cls.academicYear,
            educationLevel: cls.educationLevel,
            academicTrack: cls.academicTrack,
            roomNumber: cls.roomNumber,
            studentCount: cls.studentCount,
            nextSession: cls.nextSession
          })));
        } else {
          // Fallback for development - would be removed in production
          setClasses([]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Format the next session time
  const formatNextSession = (nextSession: string | undefined) => {
    if (!nextSession) return '';

    // If it's just a day and time like "Monday, 09:00", return as is
    if (nextSession.includes(':')) return nextSession;

    // Otherwise try to parse as date
    try {
      const date = new Date(nextSession);
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return nextSession; // Return original if parsing fails
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className={`text-sm text-muted-foreground mb-2 px-2 ${isRTL ? 'text-right' : ''}`}>{t("myClasses")}</div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="mt-2">
        <div className={`text-sm text-muted-foreground mb-2 px-2 ${isRTL ? 'text-right' : ''}`}>{t("myClasses")}</div>
        <div className="text-sm text-muted-foreground px-3 py-1">
          {t("noClassesAssigned")}
        </div>
      </div>
    );
  }
}


// Recent assignments component
const PendingAssignments = ({ locale, closeSidebar }: { locale: string; closeSidebar: () => void }) => {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRTL = locale === "ar";

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        // This would be a real API call in production
        const pendingItems = await ProfessorService.getPendingItems();

        // Extract assignments to grade from pending items
        if (pendingItems && pendingItems.items) {
          const assignmentItem = pendingItems.items.find(item => item.type === "assignments");
          if (assignmentItem && assignmentItem.count > 0) {
            setAssignments([{
              id: 'pending',
              count: assignmentItem.count,
              label: t('pendingGrading')
            }] as any);
          } else {
            setAssignments([]);
          }
        } else {
          setAssignments([]);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        <h3 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t("pendingAssignments")}</h3>
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className={`text-sm font-medium mb-2 ${isRTL ? 'text-right' : ''}`}>{t("pendingAssignments")}</h3>
      <div className="space-y-1">
        {assignments.map((assignment: any) => (
          <SideBarElement
            key={assignment.id}
            href={`/${locale}/dashboard/professor/assignments/pending`}
            icon={<ClipboardList className="h-3.5 w-3.5" />}
            badge={assignment.count}
            badgeVariant="destructive"
            exactPath={true}
            closeSidebar={closeSidebar}
          >
            {assignment.label}
          </SideBarElement>
        ))}
      </div>
    </div>
  );
};

export function ProfessorSidebar({ className, isMobile = false }: { className?: string, isMobile?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const pathname = usePathname();
  const router = useRouter();
  const closeSidebar = isMobile ? () => { } : undefined; // Will be passed from MobileSidebar
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  const [sidebarState, setSidebarState] = useState<SidebarState>({
    dashboardOpen: pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/professor`,
    coursesOpen: pathname?.includes('/dashboard/professor/courses'),
    studentsOpen: pathname?.includes('/dashboard/professor/students'),
    materialsOpen: pathname?.includes('/dashboard/professor/materials'),
    assessmentsOpen: pathname?.includes('/dashboard/professor/assignments'),
    analyticsOpen: pathname?.includes('/dashboard/professor/analytics'),
    aiToolsOpen: pathname?.includes('/dashboard/professor/ai'),
    myClassesOpen: pathname?.includes('/dashboard/professor/classes') // New state for My Classes
  });

  // Auto-expand the relevant section based on current path
  useEffect(() => {
    const newState = { ...sidebarState };

    if (pathname === `/${locale}/dashboard` || pathname === `/${locale}/dashboard/professor`) {
      newState.dashboardOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/courses')) {
      newState.coursesOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/students')) {
      newState.studentsOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/materials')) {
      newState.materialsOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/assignments')) {
      newState.assessmentsOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/analytics')) {
      newState.analyticsOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/ai')) {
      newState.aiToolsOpen = true;
    }
    if (pathname?.includes('/dashboard/professor/classes')) {
      newState.myClassesOpen = true;
    }

    setSidebarState(newState);
  }, [pathname]);

  const updateSidebarState = (key: keyof SidebarState, value: boolean) => {
    setSidebarState(prev => ({ ...prev, [key]: value }));
  };


  return (
    <div className={cn("w-64 h-full bg-background border-r flex flex-col", className)}>
      {/* Logo and branding section */}
      <div className="p-2 border-b flex-shrink-0">
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
              href={`/${locale}/dashboard/professor`}
              icon={<BarChart2 className="w-4 h-4" />}
              exactPath={true}
              closeSidebar={closeSidebar}
            >
              {t("dashboard")}
            </SideBarElement>

            <Separator className="my-3" />

            {/* My Classes Section - NEW */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/classes`}
              icon={<Users className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.myClassesOpen}
              setCollapsibleState={(state) => updateSidebarState('myClassesOpen', state)}
              isParent={true}
            >
              {t("myClasses")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.myClassesOpen} isRTL={isRTL}>
              <MyClassesSection locale={locale as any} closeSidebar={closeSidebar as any} />

              {/* Add a quick action to create a new class */}
              <div className="mt-2 px-3">
                <AddClassDialog
                  trigger={
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      {t("quickAddClass")}
                    </Button>
                  }
                />
              </div>
            </NestedMenu>

            {/* Courses Section */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/courses`}
              icon={<BookOpen className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.coursesOpen}
              setCollapsibleState={(state) => updateSidebarState('coursesOpen', state)}
              isParent={true}
            >
              {t("courses")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.coursesOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/professor/courses`}
                icon={<Layers className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("allCourses")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/courses/add`}
                icon={<Plus className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("addCourse")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/courses/schedule`}
                icon={<Calendar className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("courseSchedule")}
              </SideBarElement>
            </NestedMenu>

            {/* Schedule */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/schedule`}
              icon={<Calendar className="w-4 h-4" />}
              closeSidebar={closeSidebar}
            >
              {t("schedule")}
            </SideBarElement>

            {/* Assignments Section */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/assignments`}
              icon={<FileText className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.assessmentsOpen}
              setCollapsibleState={(state) => updateSidebarState('assessmentsOpen', state)}
              isParent={true}
            >
              {t("assignments")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.assessmentsOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/professor/assignments`}
                icon={<ClipboardList className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("allAssignments")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/assignments/pending`}
                icon={<Clock className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("toGrade")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/assignments/create`}
                icon={<Plus className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("createAssignment")}
              </SideBarElement>
            </NestedMenu>

            {/* Students Section */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/students`}
              icon={<Users className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.studentsOpen}
              setCollapsibleState={(state) => updateSidebarState('studentsOpen', state)}
              isParent={true}
            >
              {t("students")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.studentsOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/professor/students`}
                icon={<Users className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("allStudents")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/students/attendance`}
                icon={<UserCheck className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("attendance")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/students/performance`}
                icon={<BarChart2 className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("performance")}
              </SideBarElement>
            </NestedMenu>

            {/* Materials Section */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/materials`}
              icon={<Briefcase className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.materialsOpen}
              setCollapsibleState={(state) => updateSidebarState('materialsOpen', state)}
              isParent={true}
            >
              {t("teachingMaterials")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.materialsOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/professor/materials`}
                icon={<FileText className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("allMaterials")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/materials/upload`}
                icon={<Plus className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("uploadMaterial")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/materials/lesson-plans`}
                icon={<PenTool className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("lessonPlans")}
              </SideBarElement>
            </NestedMenu>

            {/* Analytics Section */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/analytics`}
              icon={<BarChart2 className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.analyticsOpen}
              setCollapsibleState={(state) => updateSidebarState('analyticsOpen', state)}
              isParent={true}
            >
              {t("analytics")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.analyticsOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/professor/analytics/performance`}
                icon={<Gauge className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("classPerformance")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/analytics/attendance`}
                icon={<UserCheck className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("attendanceAnalytics")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/analytics/reports`}
                icon={<FileText className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("generateReports")}
              </SideBarElement>
            </NestedMenu>

            {/* AI Tools Section */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/ai`}
              icon={<Bot className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.aiToolsOpen}
              setCollapsibleState={(state) => updateSidebarState('aiToolsOpen', state)}
              isParent={true}
              isNew={true}
            >
              {t("aiTools")}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.aiToolsOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/professor/ai/course-generator`}
                icon={<Sparkles className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("courseGenerator")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/ai/assignment-generator`}
                icon={<Brain className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("assignmentGenerator")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/ai/assistant`}
                icon={<Bot className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("teachingAssistant")}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/professor/ai/student-insights`}
                icon={<BrainCircuitIcon className="w-4 h-4" />}
                exactPath={true}
                closeSidebar={closeSidebar}
              >
                {t("studentInsights")}
              </SideBarElement>
            </NestedMenu>

            {/* School */}
            <SideBarElement
              href={`/${locale}/dashboard/professor/school`}
              icon={<School className="w-4 h-4" />}
              closeSidebar={closeSidebar}
            >
              {t("school")}
            </SideBarElement>

            {/* Messages */}
            <SideBarElement
              href={`/${locale}/dashboard/messages`}
              icon={<MessageSquare className="w-4 h-4" />}
              closeSidebar={closeSidebar}
            >
              {t("messages")}
            </SideBarElement>

            {/* Recent Courses section */}
            <RecentCourses locale={locale as any} closeSidebar={closeSidebar as any} />

            {/* Pending Assignments section */}
            <PendingAssignments locale={locale as any} closeSidebar={closeSidebar as any} />

            {/* Profile section */}
            <Separator className="my-3" />

            <SideBarElement
              href={`/${locale}/dashboard/profile`}
              icon={<User className="w-4 h-4" />}
              exactPath={true}
              closeSidebar={closeSidebar}
            >
              {t("profile")}
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
          {t("settings")}
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
