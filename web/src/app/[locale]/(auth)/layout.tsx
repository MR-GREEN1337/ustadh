"use client";

import { useLocale } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/language-switcher";
import Logo from "@/components/global/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only set text direction based on locale
  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  // Get localized content
  const getQuote = () => {
    if (locale === 'ar') return 'التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم.';
    if (locale === 'fr') return 'L\'éducation est l\'arme la plus puissante que vous pouvez utiliser pour changer le monde.';
    return 'Education is the most powerful weapon which you can use to change the world.';
  };

  const getFooterText = () => {
    if (locale === 'ar') return '© أستاذ ٢٠٢٥ - جميع الحقوق محفوظة';
    if (locale === 'fr') return '© Ustadh 2025 - Tous droits réservés';
    return '© Ustadh 2025 - All rights reserved';
  };

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
        <div className="absolute inset-0 bg-black/60" /> {/* Slightly darker overlay for better text readability */}
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        hasScrolled ? 'bg-black/40 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-3">
              <LanguageSwitcher className="text-white"/>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center relative z-10 w-full pt-16 sm:pt-20 pb-8">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Auth Form - LEFT */}
            <div className="w-full lg:w-5/12 order-1">
              <div className="max-w-md mx-auto">
                <div className="backdrop-blur-lg bg-slate-900/40 rounded-2xl border border-white/20 shadow-xl overflow-hidden p-6">
                  {children}
                </div>
              </div>
            </div>

            {/* Hero Content - RIGHT - Updated with elegant typography */}
            <div className="w-full lg:w-7/12 py-6 lg:py-12 flex flex-col justify-center text-center lg:text-left order-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight mb-6 text-white font-serif">
                {locale === 'ar' ? 'تعلم بذكاء مع أستاذ' :
                 locale === 'fr' ? 'Apprenez intelligemment avec Ustadh' :
                 'Learn smarter with Ustadh'}
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-white/90 max-w-xl mx-auto lg:mx-0 font-light tracking-wide">
                {locale === 'ar' ? 'منصة التعلم المدعومة بالذكاء الاصطناعي التي تجعل التعليم شخصيًا وفعالًا ومتاحًا للجميع.' :
                 locale === 'fr' ? 'La plateforme d\'apprentissage propulsée par l\'IA qui rend l\'éducation personnalisée, efficace et accessible à tous.' :
                 'The AI-powered learning platform that makes education personal, effective, and accessible to everyone.'}
              </p>

              <blockquote className="mb-8 border-l-4 border-primary/70 pl-4 py-1 text-white">
                <p className="text-lg sm:text-xl font-serif italic mb-2 leading-relaxed">{getQuote()}</p>
                <footer className="text-sm text-white/70 tracking-wider uppercase">— Nelson Mandela</footer>
              </blockquote>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-2">
                {/* Trust indicators */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white/90 flex items-center font-light tracking-wide">
                    <span className="mr-2">⭐</span> 4.9/5 {locale === 'ar' ? 'تقييم' : locale === 'fr' ? 'évaluation' : 'rating'}
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-white/90 flex items-center font-light tracking-wide">
                    <span className="mr-2">🔒</span> {locale === 'ar' ? 'آمن ومؤمّن' : locale === 'fr' ? 'Sûr et sécurisé' : 'Safe & secure'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Also updated typography for consistency */}
      <footer className="relative z-10 w-full container mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-white/80 font-light tracking-wide">
          <p>{getFooterText()}</p>
          <div className="mt-4 sm:mt-0 flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">
              {locale === 'ar' ? 'الشروط والأحكام' : locale === 'fr' ? 'Conditions d\'utilisation' : 'Terms'}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {locale === 'ar' ? 'سياسة الخصوصية' : locale === 'fr' ? 'Politique de confidentialité' : 'Privacy'}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {locale === 'ar' ? 'المساعدة' : locale === 'fr' ? 'Aide' : 'Help'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
