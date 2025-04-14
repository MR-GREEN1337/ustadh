"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslation } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { Sidebar } from "@/components/global/Sidebar";
import { MobileSidebar } from "@/components/global/MobileSidebar";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { ChatToolsProvider } from "@/providers/ChatToolsContext";
import IntegratedHeader from "./tutor/chat/[chatId]/_components/ChatHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isRTL = locale === "ar";
  const [chatTitle, setChatTitle] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const { t } = useTranslation();
  // Check if current path is a chat route
  const isChatRoute = pathname.includes(`/${locale}/dashboard/tutor/chat/`);

  // Listen for chat title updates from child components
  useEffect(() => {
    const handleChatTitleUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.title) {
        setChatTitle(event.detail.title);
        setIsNewChat(event.detail.isNewChat || false);
      }
    };

    // Add event listener
    window.addEventListener('chat-title-update', handleChatTitleUpdate as EventListener);

    return () => {
      window.removeEventListener('chat-title-update', handleChatTitleUpdate as EventListener);
    };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, router, locale]);

  // Set text direction based on locale
  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  // Function to update chat title
  const updateChatTitle = (newTitle: string) => {
    setChatTitle(newTitle);

    // Dispatch an event to notify the chat component
    window.dispatchEvent(new CustomEvent('update-chat-title', {
      detail: { title: newTitle }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ChatToolsProvider>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block fixed top-0 left-0 h-full z-30">
          <Sidebar className="w-60 border-r h-full" />
        </div>

        {/* Main content with left margin for desktop */}
        <div className="flex flex-col flex-1 min-h-screen md:ml-60">
          {/* Single integrated header */}
          <header className="sticky top-0 z-30 bg-background border-b">
            <div className="flex items-center px-4 md:px-6 py-3 h-14">
              {/* Left section with mobile menu */}
              <div className="md:hidden mr-2">
                <MobileSidebar />
              </div>

              {/* Integrated header component */}
              <div className="flex-1">
                <IntegratedHeader
                  chatTitle={chatTitle}
                  setChatTitle={setChatTitle}
                  isNewChat={isNewChat}
                  updateChatTitle={updateChatTitle}
                />
              </div>
            </div>
            <Separator />
          </header>

          {/* Main content area with scrolling - no extra padding now for chat routes */}
          <main className={`flex-1 overflow-auto relative ${isChatRoute ? 'p-0' : ''}`}>
            <div className={isChatRoute ? '' : 'py-4 md:py-6 px-4 md:px-6'}>
              {children}
            </div>
          </main>

          {/* Footer - Hide on chat routes */}
          {!isChatRoute && (
            <footer className="border-t py-3 px-4 md:px-6">
              <div className="text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} {t("copyright")}.</p>
              </div>
            </footer>
          )}
        </div>

        <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
      </div>
    </ChatToolsProvider>
  );
}
