"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import { useAuth } from "@/providers/AuthProvider";
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Settings,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/global/ThemeModeToggle";
import LanguageSwitcher from "@/components/language-switcher";
import { ChatToolsContainer } from "@/providers/ChatToolsContext";
import { BugReportDialog } from "@/components/global/BugReportDialog";
import { ChatService } from "@/services/ChatService";
import { useToast } from "@/hooks/use-toast";

interface IntegratedHeaderProps {
  chatTitle: string;
  setChatTitle: (title: string) => void;
  isNewChat: boolean;
  updateChatTitle: (newTitle: string) => void;
}

const IntegratedHeader: React.FC<IntegratedHeaderProps> = ({
  chatTitle,
  setChatTitle,
  isNewChat,
  updateChatTitle,
}) => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Bug report dialog state
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  // State to track if title is being edited
  const [isEditingTitle, setIsEditingTitle] = useState(isNewChat);
  // Local state for title being edited
  const [editableTitle, setEditableTitle] = useState(chatTitle);
  // State to track if a title update is in progress
  const [updatingTitle, setUpdatingTitle] = useState(false);

  // Check if current path is a chat route
  const isChatRoute = pathname.includes(`/${locale}/dashboard/tutor/chat/`);

  // Update editable title when chatTitle changes
  useEffect(() => {
    setEditableTitle(chatTitle);
  }, [chatTitle]);

  // Extract chat ID from the URL
  const getChatId = () => {
    const pathParts = pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  // Function to handle title update
  const handleTitleUpdate = async () => {
    // Don't proceed if empty or unchanged
    if (!editableTitle.trim() || editableTitle === chatTitle) {
      setEditableTitle(chatTitle);
      setIsEditingTitle(false);
      return;
    }

    try {
      setUpdatingTitle(true);

      // Get chat ID from the URL
      const chatId = getChatId();

      // Update title in parent component (UI update)
      updateChatTitle(editableTitle);

      // Only send to API if we have a user and a valid chatId
      if (user && chatId) {
        // Update title in database
        await ChatService.updateSessionTitle(chatId, editableTitle);

        // Also update in localStorage for offline access
        try {
          const chats = JSON.parse(localStorage.getItem('chats') || '[]');
          const updatedChats = chats.map((c: any) =>
            c.id === chatId ? { ...c, title: editableTitle } : c
          );
          localStorage.setItem('chats', JSON.stringify(updatedChats));
        } catch (storageError) {
          console.error("Error updating title in localStorage:", storageError);
        }
      }
    } catch (error) {
      console.error('Failed to update chat title:', error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive"
      });

      // Revert to previous title
      setEditableTitle(chatTitle);
    } finally {
      setUpdatingTitle(false);
      setIsEditingTitle(false);
    }
  };

  // Handle title input changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTitle(e.target.value);
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);

    // Remove the locale segment
    if (paths[0] === locale) {
      paths.shift();
    }

    const breadcrumbs = paths.map((path, index) => {
      // Create the url up to this point
      const url = `/${locale}/${paths.slice(0, index + 1).join('/')}`;

      // Translate path segments or make them more readable
      let label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

      // Try to translate common path segments
      const translationKey = path.toLowerCase();
      if (t(translationKey as any) !== translationKey) {
        label = t(translationKey as any);
      }

      return { label, url };
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return "U";

    const names = user.full_name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left section: Chat back button + title + tools OR Dashboard breadcrumbs */}
      {isChatRoute ? (
        <div className="flex items-center flex-grow gap-2">
          <Link href={`/${locale}/dashboard/tutor/chat`}>
            <Button variant="ghost" size="icon" aria-label="Back to chats">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <Input
                value={editableTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleUpdate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setEditableTitle(chatTitle);
                    setIsEditingTitle(false);
                  }
                }}
                placeholder={t("nameYourChat") || "Name your conversation..."}
                className="max-w-md"
                autoFocus
                disabled={updatingTitle}
              />
              {updatingTitle && (
                <div className="ml-2 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              )}
            </div>
          ) : (
            <div
              className="flex items-center gap-1 group cursor-pointer"
              onClick={() => setIsEditingTitle(true)}
            >
              <h1 className="text-lg font-medium truncate max-w-[180px] md:max-w-[240px] lg:max-w-[300px]">
                {chatTitle}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Divider between title and tools */}
          <div className="h-6 w-px bg-border mx-1"></div>

          {/* Chat tools - Moved from right to left */}
          <div className="flex items-center gap-2">
            {/* Offline indicator */}
            {!user && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md whitespace-nowrap">
                {t("offlineMode") || "Offline Mode"}
              </span>
            )}

            {/* Chat tools container */}
            <ChatToolsContainer />
          </div>
        </div>
      ) : (
        /* Breadcrumbs for non-chat routes */
        <nav className="flex items-center text-sm font-medium">
          <Link
            href={`/${locale}/dashboard`}
            className={`text-foreground hover:text-foreground/80 flex items-center ${isRTL ? 'ml-1' : 'mr-1'}`}
          >
            <Home className="h-4 w-4 mr-1" />
            {t("dashboard")}
          </Link>

          {breadcrumbs.length > 1 && breadcrumbs.slice(1).map((crumb, index) => (
            <div key={index} className="flex items-center">
              <div className="mx-1 text-muted-foreground">
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
              <Link
                href={crumb.url}
                className={index === breadcrumbs.length - 2 ? "font-semibold" : "text-muted-foreground hover:text-foreground"}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>
      )}

      {/* Right section with profile and settings */}
      <div className="flex items-center gap-2">
        {/* Settings dropdown (new) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("settings.title") || "Settings"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/dashboard/settings`}>
                {t("settings.preferences") || "Preferences"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/privacy-policy`}>
                {t("settings.privacyPolicy") || "Privacy Policy"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/terms-of-service`}>
                {t("settings.terms") || "Terms of Service"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsBugReportOpen(true)}>
              {t("settings.reportBug") || "Report a Bug"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/help-center`}>
                {t("settings.helpCenter") || "Help Center"}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />
        <LanguageSwitcher />

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 rounded-full flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-800">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-flex text-sm font-medium">
                {user?.full_name?.split(' ')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs bg-muted text-muted-foreground px-2 py-1 mt-1 rounded inline-block capitalize">
                  {user?.user_type || "user"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/dashboard/profile`}>
                {t("profile") || "Profile"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/dashboard/settings`}>
                {t("settings") || "Settings"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bug Report Dialog */}
      <BugReportDialog isOpen={isBugReportOpen} setIsOpen={setIsBugReportOpen} />
    </div>
  );
};

// Helper component for RTL support
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export default IntegratedHeader;
