"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { Sidebar } from "@/components/global/Sidebar";
import DashboardHeader from "@/components/global/DashboardHeader";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

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
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <Toaster position={isRTL ? "bottom-left" : "bottom-right"} />
    </div>
  );
}
