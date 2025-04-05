"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { Sidebar } from "@/components/global/Sidebar";
import { MobileSidebar } from "@/components/global/MobileSidebar";
import DashboardHeader from "@/components/global/DashboardHeader";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isRTL = locale === "ar";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block fixed top-0 left-0 h-full z-10">
        <Sidebar className="w-60 border-r h-full" />
      </div>

      {/* Main content with left margin for desktop */}
      <div className="flex flex-col flex-1 min-h-screen md:ml-60">
        {/* Sticky header with mobile sidebar */}
        <header className="sticky top-0 z-20 bg-background border-b">
          <div className="flex items-center px-4 md:px-6 py-4 h-14">
            {/* Left section with mobile menu */}
            <div className="md:hidden mr-2">
              <MobileSidebar />
            </div>

            {/* Center/Right section with dashboard header */}
            <div className="flex-1">
              <DashboardHeader />
            </div>
          </div>
          <Separator />
        </header>

        {/* Main content area with scrolling */}
        <main className="flex-1 overflow-auto">
          <div className="py-4 md:py-6 px-4 md:px-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-3 px-4 md:px-6">
          <div className="text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Ustadh. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
    </div>
  );
}
