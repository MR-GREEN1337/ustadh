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
  User
} from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarState {
  learningOpen: boolean;
  progressOpen: boolean;
  communicationOpen: boolean;
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
}: SideBarElementProps) => {
  const pathname = usePathname();
  const { locale } = useParams();
  const isRTL = locale === "ar";

  // Determine if current path is an exact match or a child of this path
  const isExactMatch = pathname === href;
  const isChildPath = pathname.startsWith(href || '') && pathname !== href;

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
    <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse text-right" : "")}>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-sm font-medium">{children}</span>
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
      "space-y-1 my-1 pl-3 border-l transition-all",
      isRTL ? "mr-3 border-l-0 border-r" : "ml-3"
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
  const pathname = usePathname();

  const [sidebarState, setSidebarState] = useState<SidebarState>({
    learningOpen: true,
    progressOpen: true,
    communicationOpen: true,
    parentControlOpen: true
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

    if (pathname.includes('/dashboard/learn')) {
      newState.learningOpen = true;
    }
    if (pathname.includes('/dashboard/progress')) {
      newState.progressOpen = true;
    }
    if (pathname.includes('/dashboard/messages')) {
      newState.communicationOpen = true;
    }
    if (pathname.includes('/dashboard/children')) {
      newState.parentControlOpen = true;
    }

    setSidebarState(newState);
  }, [pathname]);

  const updateSidebarState = (key: keyof SidebarState, value: boolean) => {
    setSidebarState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("w-60 h-full bg-background border-r md:block", className)}>
      <div className="flex flex-col h-full">
        {/* Logo and user profile section */}
        <div className="p-3 border-b">
          <div className="flex justify-center">
            <Logo hideBadge={false} />
          </div>
        </div>

        {/* Navigation menu with scrollable area */}
        <ScrollArea className="flex-1 px-3 py-5">
          <nav className="space-y-1 mt-4">
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
                    href={`/${locale}/dashboard/learn/sessions`}
                    icon={<Clock className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("startSession") || "Study Sessions"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/learn/schedule`}
                    icon={<Calendar className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("schedule")}
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
                    icon={<Target className="w-4 h-4" />}
                    exactPath={true}
                  >
                    {t("analytics") || "Analytics"}
                  </SideBarElement>
                  <SideBarElement
                    href={`/${locale}/dashboard/progress/achievements`}
                    icon={<Award className="w-4 h-4" />}
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
            >
              {t("messages") || "Messages"}
            </SideBarElement>

            <NestedMenu isOpen={sidebarState.communicationOpen} isRTL={isRTL}>
              <SideBarElement
                href={`/${locale}/dashboard/messages/inbox`}
                icon={<MessageSquare className="w-4 h-4" />}
                exactPath={true}
              >
                {t("inbox") || "Inbox"}
              </SideBarElement>
              <SideBarElement
                href={`/${locale}/dashboard/messages/notifications`}
                icon={<Bell className="w-4 h-4" />}
                exactPath={true}
              >
                {t("notifications") || "Notifications"}
              </SideBarElement>
            </NestedMenu>

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

        {/* Footer section with settings */}
        <div className="p-3 mt-auto border-t">
          <SideBarElement
            href={`/${locale}/dashboard/settings`}
            icon={<Settings className="w-4 h-4" />}
            exactPath={true}
          >
            {t("settings") || "Settings"}
          </SideBarElement>
        </div>
      </div>
    </div>
  );
}
