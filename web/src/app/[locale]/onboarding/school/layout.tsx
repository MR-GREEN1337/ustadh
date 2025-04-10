"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { Sidebar } from "@/components/global/Sidebar";
import { MobileSidebar } from "@/components/global/MobileSidebar";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { ChatToolsProvider } from "@/providers/ChatToolsContext";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/global/ThemeModeToggle";
import LanguageSwitcher from "@/components/language-switcher";
import { Header } from "../../page";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isRTL = locale === "ar";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // Check if current route is onboarding
  const isOnboarding = pathname.includes("/onboarding");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with background that stretches */}
      <div className=" flex-1 relative">
        <Header />
        {/* Background with tiles that covers the entire area */}
        <div
          className="absolute inset-0 bg-amber-50 dark:bg-gray-950 -z-10"
          style={{
            backgroundImage: `url('/tiles.jpg')`,
            backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat',
            backgroundAttachment: 'fixed', // This ensures the background stays fixed during scroll
            opacity: 0.15
          }}
        />

        {/* Main content wrapper */}
        <main className="mt-10 container mx-auto px-4 py-6 flex-1 relative">
          {children}
        </main>
      </div>

      <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
    </div>
  );
}
