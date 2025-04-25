"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/client";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
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

  useEffect(() => {
    if (user?.user_type !== 'school_admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

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

        {/* Main content wrapper */}
        <main className="mt-10 container mx-auto px-4 py-6 flex-1 relative">
          {children}
        </main>
      </div>

    </div>
  );
}
