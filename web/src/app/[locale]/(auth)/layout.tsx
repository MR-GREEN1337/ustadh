"use client";

import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import LanguageSwitcher from "@/components/language-switcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

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
        className="absolute inset-0 bg-amber-50 -z-10"
        style={{
          backgroundImage: `url('/tiles.jpg')`,
          backgroundSize: '300px 300px',
          backgroundRepeat: 'repeat',
          opacity: 0.15
        }}
      />

      {/* Header */}
      <header className="w-full border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2"
            >
              <div className="bg-emerald-600 text-white h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold">
                U
              </div>
              <h1 className="text-xl font-bold text-emerald-900">
                <span className="mr-1">أُستاذ</span>
                <span className="text-emerald-700">Ustadh</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <Link href={`/${locale}`}>
              <Button variant="ghost" size="sm" className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                {locale === 'ar' ? 'العودة للرئيسية' :
                  locale === 'fr' ? "Retour à l'accueil" :
                  'Back to home'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          {/* Auth container with glass effect */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-200">
            {children}
          </div>

          {/* Brand footer */}
          <div className="mt-6 text-center text-slate-500 text-sm">
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
