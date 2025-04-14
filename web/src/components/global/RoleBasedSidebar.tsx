// components/global/RoleBasedSidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  BarChart,
  MessageSquare,
  Award,
  Users,
  UserPlus,
  Settings,
  Bell,
  BookMarked,
  ListTodo,
  Target,
  User,
  Pen,
  Brain,
  Video,
  FileText,
  PenTool,
  Bot,
  MessageCircle,
  Share2,
  Layout,
  Rocket,
  Trophy,
  Globe,
  Zap,
  ChevronRight,
  ArrowRight,
  ClipboardList,
  SchoolIcon,
  Briefcase,
  Edit,
  LineChart,
  Activity,
  Files,
  FileCheck,
  User2,
  Building,
  BookmarkCheck,
  Mail,
  Lock,
  AlertTriangle,
  Gauge
} from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleBasedOnboardingCard } from "./RoleBasedOnboardingCard";

interface SidebarState {
  dashboardOpen: boolean;
  learningOpen: boolean;
  aiTutorOpen: boolean;
  studySessionsOpen: boolean;
  progressOpen: boolean;
  communicationOpen: boolean;
  communityOpen: boolean;
  parentControlOpen: boolean;
  teacherToolsOpen: boolean;
  adminControlsOpen: boolean;
  schoolResourcesOpen: boolean;
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
          New
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

// Onboarding Reminder Card Component
const OnboardingReminderCard = ({ locale, isRTL, closeSidebar }: { locale: string, isRTL: boolean, closeSidebar?: () => void }) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          {t("completeYourProfile") || "Complete Your Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription className={`text-xs ${isRTL ? "text-right" : ""}`}>
          {t("onboardingReminder") || "Personalize your learning experience by completing your educational profile."}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary/20 text-primary hover:bg-primary/20 hover:text-primary"
          onClick={() => {
            router.push(`/${locale}/onboarding`);
            if (closeSidebar) closeSidebar();
          }}
        >
          <span>{t("continueSetup") || "Continue Setup"}</span>
          {isRTL ? (
            <ArrowRight className="h-3 w-3 mr-2" />
          ) : (
            <ArrowRight className="h-3 w-3 ml-2" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export function RoleBasedSidebar({ className, isMobile = false }: { className?: string, isMobile?: boolean }) {
  const { t } = useTranslation();
  const { user, needsOnboarding } = useAuth();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const userType = user?.user_type || "student";
  const pathname = usePathname();
  const showOnboardingReminder = needsOnboarding() && user;
  const closeSidebar = isMobile ? () => {} : undefined; // Will be passed from MobileSidebar

  const [sidebarState, setSidebarState] = useState<SidebarState>({
    dashboardOpen: true,
    learningOpen: pathname?.includes('/dashboard/learn'),
    aiTutorOpen: pathname?.includes('/dashboard/tutor'),
    studySessionsOpen: pathname?.includes('/dashboard/sessions'),
    progressOpen: pathname?.includes('/dashboard/progress'),
    communicationOpen: pathname?.includes('/dashboard/messages'),
    communityOpen: pathname?.includes('/dashboard/community'),
    parentControlOpen: pathname?.includes('/dashboard/children'),
    teacherToolsOpen: pathname?.includes('/dashboard/teaching'),
    adminControlsOpen: pathname?.includes('/dashboard/admin'),
    schoolResourcesOpen: pathname?.includes('/dashboard/school')
  });

  // Auto-expand the relevant section based on current path
  useEffect(() => {
    const newState = { ...sidebarState };

    if (pathname?.includes('/dashboard/learn')) {
      newState.learningOpen = true;
    }
    if (pathname?.includes('/dashboard/tutor')) {
      newState.aiTutorOpen = true;
    }
    if (pathname?.includes('/dashboard/sessions')) {
      newState.studySessionsOpen = true;
    }
    if (pathname?.includes('/dashboard/progress')) {
      newState.progressOpen = true;
    }
    if (pathname?.includes('/dashboard/messages')) {
      newState.communicationOpen = true;
    }
    if (pathname?.includes('/dashboard/community')) {
      newState.communityOpen = true;
    }
    if (pathname?.includes('/dashboard/children')) {
      newState.parentControlOpen = true;
    }
    if (pathname?.includes('/dashboard/teaching')) {
      newState.teacherToolsOpen = true;
    }
    if (pathname?.includes('/dashboard/admin')) {
      newState.adminControlsOpen = true;
    }
    if (pathname?.includes('/dashboard/school')) {
      newState.schoolResourcesOpen = true;
    }

    setSidebarState(newState);
  }, [pathname]);

  const updateSidebarState = (key: keyof SidebarState, value: boolean) => {
    setSidebarState(prev => ({ ...prev, [key]: value }));
  };

  // Student-specific navigation items
  const renderStudentNavigation = () => (
    <>
      {/* Learning Section */}
      <SideBarElement
        href={`/${locale}/dashboard/learn`}
        icon={<BookOpen className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.learningOpen}
        setCollapsibleState={(state) => updateSidebarState('learningOpen', state)}
        isParent={true}
      >
        {t("subjects") || "Learning"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.learningOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/learn/subjects`}
          icon={<BookMarked className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("mySubjects")}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/learn/schedule`}
          icon={<Calendar className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("schedule")}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/learn/courses`}
          icon={<Layout className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("courses") || "Courses"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/learn/explore`}
          icon={<Rocket className="w-4 h-4" />}
          exactPath={true}
          isNew={true}
          closeSidebar={closeSidebar}
        >
          {t("exploreTopics") || "Explore Topics"}
        </SideBarElement>
      </NestedMenu>

      {/* AI Tutor Section */}
      <SideBarElement
        href={`/${locale}/dashboard/tutor`}
        icon={<Bot className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.aiTutorOpen}
        setCollapsibleState={(state) => updateSidebarState('aiTutorOpen', state)}
        isParent={true}
        isNew={true}
      >
        {t("aiTutor") || "AI Tutor"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.aiTutorOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/chat`}
          icon={<MessageCircle className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("chatMode") || "Chat Mode"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/whiteboard`}
          icon={<PenTool className="w-4 h-4" />}
          exactPath={true}
          isNew={true}
          closeSidebar={closeSidebar}
        >
          {t("whiteboard") || "Whiteboard"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/video`}
          icon={<Video className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("videoExplain") || "Video Explanations"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/notes`}
          icon={<FileText className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("smartNotes") || "Smart Notes"}
        </SideBarElement>
      </NestedMenu>

      {/* Study Sessions Section */}
      <SideBarElement
        href={`/${locale}/dashboard/sessions`}
        icon={<Clock className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.studySessionsOpen}
        setCollapsibleState={(state) => updateSidebarState('studySessionsOpen', state)}
        isParent={true}
      >
        {t("studySessions") || "Study Sessions"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.studySessionsOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/sessions/new`}
          icon={<Zap className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("startSession") || "Start Session"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/sessions/history`}
          icon={<Clock className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("sessionHistory") || "Session History"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/sessions/practice`}
          icon={<Target className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("practice") || "Practice & Homework"}
        </SideBarElement>
      </NestedMenu>

      {/* Progress Section */}
      <SideBarElement
        href={`/${locale}/dashboard/progress`}
        icon={<BarChart className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.progressOpen}
        setCollapsibleState={(state) => updateSidebarState('progressOpen', state)}
        isParent={true}
      >
        {t("progress")}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.progressOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/progress/analytics`}
          icon={<BarChart className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("analytics") || "Analytics"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/progress/achievements`}
          icon={<Trophy className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("achievements") || "Achievements"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/progress/reports`}
          icon={<ListTodo className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("reports") || "Reports"}
        </SideBarElement>
      </NestedMenu>

      {/* Community Section */}
      <SideBarElement
        href={`/${locale}/dashboard/community`}
        icon={<Globe className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.communityOpen}
        setCollapsibleState={(state) => updateSidebarState('communityOpen', state)}
        isParent={true}
      >
        {t("community") || "Community"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.communityOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/community/forums`}
          icon={<MessageSquare className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("forums") || "Discussion Forums"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/community/groups`}
          icon={<Users className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("studyGroups") || "Study Groups"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/community/leaderboard`}
          icon={<Trophy className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("leaderboard") || "Leaderboard"}
        </SideBarElement>
      </NestedMenu>
    </>
  );

  // Parent-specific navigation items
  const renderParentNavigation = () => (
    <>
      {/* Children section */}
      <SideBarElement
        href={`/${locale}/dashboard/children`}
        icon={<Users className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.parentControlOpen}
        setCollapsibleState={(state) => updateSidebarState('parentControlOpen', state)}
        isParent={true}
      >
        {t("myChildren")}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.parentControlOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/children/manage`}
          icon={<Users className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("manageChildren") || "Manage Children"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/children/add`}
          icon={<UserPlus className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("addChild")}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/children/monitor`}
          icon={<BarChart className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("monitorProgress") || "Monitor Progress"}
        </SideBarElement>
      </NestedMenu>

      {/* Progress section with focus on children */}
      <SideBarElement
        href={`/${locale}/dashboard/progress`}
        icon={<BarChart className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.progressOpen}
        setCollapsibleState={(state) => updateSidebarState('progressOpen', state)}
        isParent={true}
      >
        {t("progress")}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.progressOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/progress/children`}
          icon={<Users className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("childProgress")}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/progress/reports`}
          icon={<ListTodo className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("reports") || "Reports"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/progress/calendar`}
          icon={<Calendar className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("calendar") || "Academic Calendar"}
        </SideBarElement>
      </NestedMenu>

      {/* Resources for parents */}
      <SideBarElement
        href={`/${locale}/dashboard/school`}
        icon={<BookOpen className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.schoolResourcesOpen}
        setCollapsibleState={(state) => updateSidebarState('schoolResourcesOpen', state)}
        isParent={true}
      >
        {t("schoolResources") || "School Resources"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.schoolResourcesOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/school/events`}
          icon={<Calendar className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("schoolEvents") || "School Events"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/school/teachers`}
          icon={<Briefcase className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("teacherContacts") || "Teacher Contacts"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/school/resources`}
          icon={<BookMarked className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("parentResources") || "Parent Resources"}
        </SideBarElement>
      </NestedMenu>
    </>
  );

  // Teacher-specific navigation items
  const renderTeacherNavigation = () => (
    <>
      {/* Teacher tools section */}
      <SideBarElement
        href={`/${locale}/dashboard/teaching`}
        icon={<Briefcase className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.teacherToolsOpen}
        setCollapsibleState={(state) => updateSidebarState('teacherToolsOpen', state)}
        isParent={true}
      >
        {t("teachingTools") || "Teaching Tools"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.teacherToolsOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/teaching/classes`}
          icon={<Users className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("myClasses") || "My Classes"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/teaching/assignments`}
          icon={<ClipboardList className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("assignments") || "Assignments"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/teaching/grading`}
          icon={<Edit className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("grading") || "Grading"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/teaching/materials`}
          icon={<FileText className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("teachingMaterials") || "Teaching Materials"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/teaching/attendance`}
          icon={<UserCheck className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("attendance") || "Attendance"}
        </SideBarElement>
      </NestedMenu>

      {/* Class analytics */}
      <SideBarElement
        href={`/${locale}/dashboard/progress`}
        icon={<LineChart className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.progressOpen}
        setCollapsibleState={(state) => updateSidebarState('progressOpen', state)}
        isParent={true}
      >
        {t("classAnalytics") || "Class Analytics"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.progressOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/progress/class-performance`}
          icon={<Activity className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("classPerformance") || "Class Performance"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/progress/student-progress`}
          icon={<User2 className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("studentProgress") || "Student Progress"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/progress/reports`}
          icon={<FileCheck className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("academicReports") || "Academic Reports"}
        </SideBarElement>
      </NestedMenu>

      {/* AI Tools for teachers */}
      <SideBarElement
        href={`/${locale}/dashboard/tutor`}
        icon={<Bot className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.aiTutorOpen}
        setCollapsibleState={(state) => updateSidebarState('aiTutorOpen', state)}
        isParent={true}
      >
        {t("teacherAITools") || "AI Teaching Tools"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.aiTutorOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/lesson-plans`}
          icon={<Files className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("lessonPlanner") || "Lesson Planner"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/quiz-generator`}
          icon={<ClipboardList className="w-4 h-4" />}
          exactPath={true}
          isNew={true}
          closeSidebar={closeSidebar}
        >
          {t("quizGenerator") || "Quiz Generator"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/tutor/content-creator`}
          icon={<PenTool className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("contentCreator") || "Content Creator"}
        </SideBarElement>
      </NestedMenu>

      {/* Schedule and calendar */}
      <SideBarElement
        href={`/${locale}/dashboard/teaching/schedule`}
        icon={<Calendar className="w-4 h-4" />}
        exactPath={true}
        closeSidebar={closeSidebar}
      >
        {t("teachingSchedule") || "Teaching Schedule"}
      </SideBarElement>
    </>
  );

  // Admin-specific navigation items
  const renderAdminNavigation = () => (
    <>
      {/* Admin controls section */}
      <SideBarElement
        href={`/${locale}/dashboard/admin`}
        icon={<Building className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.adminControlsOpen}
        setCollapsibleState={(state) => updateSidebarState('adminControlsOpen', state)}
        isParent={true}
      >
        {t("schoolAdministration") || "School Administration"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.adminControlsOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/admin/users`}
          icon={<Users className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("userManagement") || "User Management"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/admin/classes`}
          icon={<SchoolIcon className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("classManagement") || "Class Management"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/admin/courses`}
          icon={<BookOpen className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("courseManagement") || "Course Management"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/admin/staff`}
          icon={<Briefcase className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("staffManagement") || "Staff Management"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/admin/departments`}
          icon={<Layout className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("departmentManagement") || "Department Management"}
        </SideBarElement>
      </NestedMenu>

      {/* Analytics and reporting */}
      <SideBarElement
        href={`/${locale}/dashboard/admin/analytics`}
        icon={<LineChart className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.progressOpen}
        setCollapsibleState={(state) => updateSidebarState('progressOpen', state)}
        isParent={true}
      >
        {t("analyticsReporting") || "Analytics & Reporting"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.progressOpen} isRTL={isRTL}>
        <SideBarElement
          href={`/${locale}/dashboard/admin/analytics/school`}
          icon={<BarChart className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("schoolPerformance") || "School Performance"}
        </SideBarElement>
        <SideBarElement
          href={`/${locale}/dashboard/admin/analytics/attendance`}
          icon={<Users className="w-4 h-4" />}
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
          href={`/${locale}/dashboard/admin/analytics/custom`}
          icon={<FileText className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
        >
          {t("customReports") || "Custom Reports"}
        </SideBarElement>
      </NestedMenu>

      {/* System settings */}
      <SideBarElement
        href={`/${locale}/dashboard/admin/settings`}
        icon={<Settings className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.schoolResourcesOpen}
        setCollapsibleState={(state) => updateSidebarState('schoolResourcesOpen', state)}
        isParent={true}
      >
        {t("systemSettings") || "System Settings"}
      </SideBarElement>

      <NestedMenu isOpen={sidebarState.schoolResourcesOpen} isRTL={isRTL}>
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
      </NestedMenu>

      {/* Announcements */}
      <SideBarElement
        href={`/${locale}/dashboard/admin/announcements`}
        icon={<Bell className="w-4 h-4" />}
        exactPath={true}
        closeSidebar={closeSidebar}
      >
        {t("announcements") || "Announcements"}
      </SideBarElement>
    </>
  );

  // Messaging section - common for all user types
  const renderMessagingSection = () => (
    <>
      <SideBarElement
        href={`/${locale}/dashboard/messages`}
        icon={<MessageSquare className="w-4 h-4" />}
        collapsible={true}
        collapsibleState={sidebarState.communicationOpen}
        setCollapsibleState={(state) => updateSidebarState('communicationOpen', state)}
        isParent={true}
        badge={userType === "parent" ? 2 : userType === "admin" ? 5 : 3}
      >
        {t("messages") || "Messages"}
      </SideBarElement>
    </>
  );

  return (
    <div className={cn("w-64 h-full bg-background border-r flex flex-col", className)}>
      {/* Logo and user profile section */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex justify-center mb-2">
          <Logo hideBadge={false} />
        </div>
      </div>

      {/* Navigation menu with scrollable area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3">
          <nav className="space-y-1 mt-4 pb-8">
            {/* Dashboard - common for all users */}
            <SideBarElement
              href={`/${locale}/dashboard`}
              icon={<GraduationCap className="w-4 h-4" />}
              exactPath={true}
              closeSidebar={closeSidebar}
            >
              {t("dashboard")}
            </SideBarElement>

            <Separator className="my-3" />

            {/* Render navigation based on user type */}
            {userType === "student" && renderStudentNavigation()}
            {userType === "parent" && renderParentNavigation()}
            {(userType === "teacher") && renderTeacherNavigation()}
            {userType === "admin" && renderAdminNavigation()}

            {/* Messaging section - common for all users */}
            {renderMessagingSection()}

            {/* Profile section - common for all users */}
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

      {/* Footer section with settings and onboarding reminder */}
      <div className="p-3 border-t flex-shrink-0 space-y-3">
        {/* Role-based onboarding card */}
        <RoleBasedOnboardingCard closeSidebar={closeSidebar} />

        <SideBarElement
          href={`/${locale}/dashboard/settings`}
          icon={<Settings className="w-4 h-4" />}
          exactPath={true}
          closeSidebar={closeSidebar}
  >
    {t("settings") || "Settings"}
  </SideBarElement>
      </div>
    </div>
  );
}
