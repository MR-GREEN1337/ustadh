"use client";

import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { useEffect } from "react";
import { Header } from "../page";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Set text direction based on locale
  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background with tiles */}
      <div
        className="absolute inset-0 bg-amber-50 dark:bg-gray-950 -z-10"
        style={{
          backgroundImage: `url('/tiles.jpg')`,
          backgroundSize: '300px 300px',
          backgroundRepeat: 'repeat',
          opacity: 0.15
        }}
      />

      {/* Header */}
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Header />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          {/* Auth container with glass effect - no borders */}
          <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden dark:shadow-none">
            {children}
          </div>

          {/* Brand footer */}
          <div className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            <p>
              {locale === 'ar' ? 'أستاذ - مدرسك الذكي' :
                locale === 'fr' ? 'Ustadh - Votre tuteur intelligent' :
                'Ustadh - Your intelligent tutor'}
            </p>
          </div>
        </div>
      </main>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 h-64 w-64 bg-emerald-300 rounded-full opacity-20 blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-10 h-64 w-64 bg-amber-300 rounded-full opacity-20 blur-3xl -z-10"></div>
    </div>
  );
}
