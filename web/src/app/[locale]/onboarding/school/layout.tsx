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
import { useTheme } from "next-themes";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const locale = useLocale();
  const { theme } = useTheme();
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
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with background that stretches */}
      <div className=" flex-1 relative">
        <Header />
        {/* Background with tiles that covers the entire area */}
        <div className="fixed inset-0 overflow-hidden -z-10">
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-indigo-950" />
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${Math.random() * 5 + 3}s infinite alternate`
              }}
            />
          ))}
          <style jsx>{`
            @keyframes twinkle {
              0% { opacity: 0.2; }
              100% { opacity: 1; }
            }
          `}</style>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-indigo-100" />
      )}
    </div>


        {/* Main content wrapper */}
        <main className="mt-10 container mx-auto px-4 py-6 flex-1 relative">
          {children}
        </main>
      </div>

      <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
    </div>
  );
}
