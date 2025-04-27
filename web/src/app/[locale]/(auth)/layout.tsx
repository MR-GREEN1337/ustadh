"use client";

import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../page";
import { ModeToggle } from "@/components/global/ThemeModeToggle";
import LanguageSwitcher from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import Logo from "@/components/global/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const pathname = usePathname();
  const router = useRouter();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 10) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  // Determine if current page is login or register
  const isLoginPage = pathname.includes("/login");

  // Set text direction based on locale
  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background image */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: 'url("/man-standing.png")',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/*   */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      hasScrolled ? 'bg-transparent backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <div className="flex items-center gap-3">
            <ModeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>

      {/* Main content with split layout */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 pt-24 md:pt-0 relative z-10 mt-7">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 items-center">
          {/* Auth Form Container with glassmorphism effect */}
          <div className="w-full md:w-7/12 md:order-1 order-2 mt-12">
            <div className="backdrop-blur-lg bg-white/5 dark:bg-slate-900/10 rounded-3xl border border-white/10 shadow-xl overflow-hidden p-4">
              {children}
            </div>
          </div>

          {/* Right-side content with app info */}
          <div className="w-full md:w-7/12 md:order-2 order-1 text-center md:text-left text-white !text-sm ml-40">
              <blockquote className="mb-8">
                <p className="text-2xl md:text-3xl font-serif italic mb-4 leading-relaxed">
                  {locale === 'ar'
                    ? 'التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم.'
                    : locale === 'fr'
                    ? 'L\'éducation est l\'arme la plus puissante que vous pouvez utiliser pour changer le monde.'
                    : 'Education is the most powerful weapon which you can use to change the world.'}
                </p>
                <footer className="text-lg text-white/80 font-light">
                  — Nelson Mandela
                </footer>
              </blockquote>
            </div>
        </div>
      </main>

      {/* Footer with minimal branding */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="w-full max-w-md mx-auto text-center text-sm text-white/80">
          <p>
            {locale === 'ar'
              ? '© أستاذ ٢٠٢٥ - جميع الحقوق محفوظة'
              : locale === 'fr'
              ? '© Ustadh 2025 - Tous droits réservés'
              : '© Ustadh 2025 - All rights reserved'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}
