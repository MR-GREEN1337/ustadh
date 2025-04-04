"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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
  // New icons for enhanced features
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
  ChevronRight
} from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SidebarState {
  dashboardOpen: boolean;
  learningOpen: boolean;
  aiTutorOpen: boolean;
  studySessionsOpen: boolean;
  progressOpen: boolean;
  communicationOpen: boolean;
  communityOpen: boolean;
  parentControlOpen: boolean;
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
            <Link href={href} className="w-full block">
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
      <Link href={href} className="w-full block">
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
      onClick={onClick}
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

export function Sidebar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const isParent = user?.user_type === "parent";
  const isTeacher = user?.user_type === "supervisor";
  const pathname = usePathname();

  const [sidebarState, setSidebarState] = useState<SidebarState>({
    dashboardOpen: true,
    learningOpen: true,
    aiTutorOpen: true,
    studySessionsOpen: false,
    progressOpen: false,
    communicationOpen: false,
    communityOpen: false,
    parentControlOpen: false
  });

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return "U";

    const names = user.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

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

    setSidebarState(newState);
  }, [pathname]);

  const updateSidebarState = (key: keyof SidebarState, value: boolean) => {
    setSidebarState(prev => ({ ...prev, [key]: value }));
  };

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
            {/* Dashboard */}
            <SideBarElement
              href={`/${locale}/dashboard`}
              icon={<GraduationCap className="w-4 h-4" />}
              exactPath={true}
            >
              {t("dashboard")}
            </SideBarElement>

            <Separator className="my-3" />

            {/* Learning Section - for non-parent users */}
            {!isParent && (
              <>
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
                  >
                    {t("mySubjects")}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/learn/schedule`}
                    icon={<Calendar className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("schedule")}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/learn/courses`}
                    icon={<Layout className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("courses") || "Courses"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/learn/explore`}
                    icon={<Rocket className="w-4 h-4" />}
                    exactPath={true}
                    isNew={true}
                  >
                    {t("exploreTopics") || "Explore Topics"}
                  </SideBarElement>
                </NestedMenu>
              </>
            )}

            {/* AI Tutor Section - new section for AI interaction */}
            {!isParent && (
              <>
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
                  >
                    {t("chatMode") || "Chat Mode"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/tutor/whiteboard`}
                    icon={<PenTool className="w-4 h-4" />}
                    exactPath={true}
                    isNew={true}
                  >
                    {t("whiteboard") || "Whiteboard"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/tutor/video`}
                    icon={<Video className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("videoExplain") || "Video Explanations"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/tutor/notes`}
                    icon={<FileText className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("smartNotes") || "Smart Notes"}
                  </SideBarElement>
                </NestedMenu>
              </>
            )}

            {/* Study Sessions Section */}
            {!isParent && (
              <>
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
                  >
                    {t("startSession") || "Start Session"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/sessions/history`}
                    icon={<Clock className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("sessionHistory") || "Session History"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/sessions/practice`}
                    icon={<Target className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("practice") || "Practice & Homework"}
                  </SideBarElement>
                </NestedMenu>
              </>
            )}

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
              {isParent ? (
                <SideBarElement
                  href={`/${locale}/dashboard/progress/children`}
                  icon={<Users className="w-4 h-4" />}
                  exactPath={true}
                >
                  {t("childProgress")}
                </SideBarElement>
              ) : (
                <>
                  <SideBarElement
                    href={`/${locale}/dashboard/progress/analytics`}
                    icon={<BarChart className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("analytics") || "Analytics"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/progress/achievements`}
                    icon={<Trophy className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("achievements") || "Achievements"}
                  </SideBarElement>
                </>
              )}
              <SideBarElement
                href={`/${locale}/dashboard/progress/reports`}
                icon={<ListTodo className="w-4 h-4" />}
                exactPath={true}
              >
                {t("reports") || "Reports"}
              </SideBarElement>
            </NestedMenu>

            {/* Messages Section */}
            <SideBarElement
              href={`/${locale}/dashboard/messages`}
              icon={<MessageSquare className="w-4 h-4" />}
              collapsible={true}
              collapsibleState={sidebarState.communicationOpen}
              setCollapsibleState={(state) => updateSidebarState('communicationOpen', state)}
              isParent={true}
              badge={3}
            >
              {t("messages") || "Messages"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.communicationOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/messages/inbox`}
                icon={<MessageSquare className="w-4 h-4" />}
                exactPath={true}
                badge={2}
              >
                {t("inbox") || "Inbox"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/messages/notifications`}
                icon={<Bell className="w-4 h-4" />}
                exactPath={true}
                badge={1}
              >
                {t("notifications") || "Notifications"}
              </SideBarElement>
            </NestedMenu>

            {/* Community Section - new section for social learning */}
            {!isParent && (
              <>
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
                  >
                    {t("forums") || "Discussion Forums"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/community/groups`}
                    icon={<Users className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("studyGroups") || "Study Groups"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/community/leaderboard`}
                    icon={<Trophy className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("leaderboard") || "Leaderboard"}
                  </SideBarElement>
                </NestedMenu>
              </>
            )}

            {/* Parent-specific controls */}
            {isParent && (
              <>
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
                  >
                    {t("manageChildren") || "Manage Children"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/children/add`}
                    icon={<UserPlus className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("addChild")}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/children/monitor`}
                    icon={<BarChart className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("monitorProgress") || "Monitor Progress"}
                  </SideBarElement>
                </NestedMenu>
              </>
            )}

            {/* Profile section */}
            <Separator className="my-3" />

            <SideBarElement
              href={`/${locale}/dashboard/profile`}
              icon={<User className="w-4 h-4" />}
              exactPath={true}
            >
              {t("profile") || "Profile"}
            </SideBarElement>
                      </nav>
          </ScrollArea>
        </div>

        {/* Footer section with settings */}
        <div className="p-3 border-t flex-shrink-0">

          <SideBarElement
            href={`/${locale}/dashboard/settings`}
            icon={<Settings className="w-4 h-4" />}
            exactPath={true}
          >
            {t("settings") || "Settings"}
          </SideBarElement>
        </div>
      </div>
  );
}
