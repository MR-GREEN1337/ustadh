"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  LucideIcon,
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
} from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthProvider";

interface SidebarState {
  learningOpen: boolean;
  progressOpen: boolean;
  communicationOpen: boolean;
  parentControlOpen: boolean;
  settingsOpen: boolean;
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

const SideBarElement = ({
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
      {icon}
      <span className="text-sm">{children}</span>
    </div>
  );

  if (collapsible) {
    const buttonClass = cn(
      "flex items-center py-2 px-3 w-full rounded-md justify-between",
      isActive ? "bg-secondary text-sm font-medium" : "text-sm",
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
                  className="h-6 w-6 p-0"
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
            </Link>
          ) : (
            <div className={buttonClass} onClick={() => setCollapsibleState?.(!collapsibleState)}>
              {contentContainer}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
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
        "flex justify-start items-center bg-secondary rounded-md text-sm font-medium py-2 px-3",
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
            "w-full justify-start py-2 px-3 hover:bg-secondary/80",
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
        "w-full justify-start py-2 px-3",
        isRTL ? "flex-row-reverse text-right" : ""
      )}
      onClick={onClick}
    >
      {contentContainer}
    </Button>
  );
};

function WhiteSpaceSeparator() {
  return <div className="h-3" />;
}

export function Sidebar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const isParent = user?.user_type === "parent";
  const pathname = usePathname();

  const [sidebarState, setSidebarState] = useState<SidebarState>({
    learningOpen: true,
    progressOpen: false,
    communicationOpen: false,
    parentControlOpen: false,
    settingsOpen: false
  });

  // Auto-expand the relevant section based on current path
  useEffect(() => {
    const newState = {...sidebarState};

    if (pathname.includes('/dashboard/learn')) {
      newState.learningOpen = true;
    } else if (pathname.includes('/dashboard/progress')) {
      newState.progressOpen = true;
    } else if (pathname.includes('/dashboard/messages')) {
      newState.communicationOpen = true;
    } else if (pathname.includes('/dashboard/children')) {
      newState.parentControlOpen = true;
    } else if (pathname.includes('/dashboard/settings')) {
      newState.settingsOpen = true;
    }

    setSidebarState(newState);
  }, [pathname]);

  return (
    <div className={cn("w-60 overflow-y-auto border-r bg-background hidden md:block", className)}>
      <div className="flex flex-col h-full py-3">
        <div className="flex justify-center px-4 mb-2">
          <Logo hideBadge={false} />
        </div>
        <Separator className="mb-3 mt-1" />

        <ScrollArea className="flex-1 px-3">
          <SideBarElement
            href={`/${locale}/dashboard`}
            icon={<GraduationCap className="w-4 h-4" />}
            exactPath={true}
          >
            {t("dashboard")}
          </SideBarElement>

          <WhiteSpaceSeparator />

          {!isParent && (
            <>
              <SideBarElement
                href={`/${locale}/dashboard/learn`}
                icon={<BookOpen className="w-4 h-4" />}
                collapsible={true}
                collapsibleState={sidebarState.learningOpen}
                setCollapsibleState={(state) =>
                  setSidebarState({ ...sidebarState, learningOpen: state })
                }
                isParent={true}
              >
                {t("subjects") || "Learning"}
              </SideBarElement>
              {sidebarState.learningOpen && (
                <div className={cn("space-y-1 mt-1 mb-2", isRTL ? "mr-3" : "ml-3")}>
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
                </div>
              )}
            </>
          )}

          <SideBarElement
            href={`/${locale}/dashboard/progress`}
            icon={<BarChart className="w-4 h-4" />}
            collapsible={true}
            collapsibleState={sidebarState.progressOpen}
            setCollapsibleState={(state) =>
              setSidebarState({ ...sidebarState, progressOpen: state })
            }
            isParent={true}
          >
            {t("progress")}
          </SideBarElement>
          {sidebarState.progressOpen && (
            <div className={cn("space-y-1 mt-1 mb-2", isRTL ? "mr-3" : "ml-3")}>
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
            </div>
          )}

          <SideBarElement
            href={`/${locale}/dashboard/messages`}
            icon={<MessageSquare className="w-4 h-4" />}
            collapsible={true}
            collapsibleState={sidebarState.communicationOpen}
            setCollapsibleState={(state) =>
              setSidebarState({ ...sidebarState, communicationOpen: state })
            }
            isParent={true}
          >
            {t("messages") || "Messages"}
          </SideBarElement>
          {sidebarState.communicationOpen && (
            <div className={cn("space-y-1 mt-1 mb-2", isRTL ? "mr-3" : "ml-3")}>
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
            </div>
          )}

          {isParent && (
            <>
              <SideBarElement
                href={`/${locale}/dashboard/children`}
                icon={<Users className="w-4 h-4" />}
                collapsible={true}
                collapsibleState={sidebarState.parentControlOpen}
                setCollapsibleState={(state) =>
                  setSidebarState({ ...sidebarState, parentControlOpen: state })
                }
                isParent={true}
              >
                {t("myChildren")}
              </SideBarElement>
              {sidebarState.parentControlOpen && (
                <div className={cn("space-y-1 mt-1 mb-2", isRTL ? "mr-3" : "ml-3")}>
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
                </div>
              )}
            </>
          )}

          <WhiteSpaceSeparator />
        </ScrollArea>

        <div className="px-3 mt-auto pt-2 border-t">
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
