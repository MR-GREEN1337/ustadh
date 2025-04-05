"use client";
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Stars,
  Sparkles,
  Lightbulb,
  Globe,
  Brain,
  Moon,
  Sun
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { getDirection } from '@/i18n/config';
import { ModeToggle } from '@/components/global/ThemeModeToggle';
import { useAuth } from '@/providers/AuthProvider';

// Basic translations (same as before)
const translations: any = {
  ar: {
    title: "أُستاذ - المدرس الذكي للطلاب المغاربة",
    description: "دروس خصوصية مخصصة بالذكاء الاصطناعي للطلاب المغاربة",
    hero: {
      title: "أُستاذ",
      subtitle: "المدرس الخاص الذكي للطلاب المغاربة",
      cta: "ابدأ مجانًا",
      watchDemo: "شاهد العرض التوضيحي"
    },
    features: {
      title: "كيف يحول أستاذ طريقة تعلمك"
    },
    cta: {
      title: "ابدأ رحلتك التعليمية اليوم",
      button: "سجل الآن"
    }
  },
  fr: {
    title: "Ustadh - Tuteur IA pour les Étudiants Marocains",
    description: "Tutorat IA personnalisé pour les étudiants marocains",
    hero: {
      title: "Ustadh",
      subtitle: "Votre tuteur IA personnel pour étudiants marocains",
      cta: "Commencer gratuitement",
      watchDemo: "Regarder la démo"
    },
    features: {
      title: "Comment Ustadh transforme votre apprentissage"
    },
    cta: {
      title: "Commencez votre parcours éducatif aujourd'hui",
      button: "Inscrivez-vous maintenant"
    }
  },
  en: {
    title: "Ustadh - AI Tutor for Moroccan Students",
    description: "Personalized AI tutoring for Moroccan students",
    hero: {
      title: "Ustadh",
      subtitle: "Your personal AI tutor for Moroccan students",
      cta: "Get Started Free",
      watchDemo: "Watch Demo"
    },
    features: {
      title: "How Ustadh Transforms Your Learning"
    },
    cta: {
      title: "Start your educational journey today",
      button: "Sign up now"
    }
  }
};
// Cosmic decoration SVGs
const cosmicDecorations = {
  constellations: (
    <svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
      <circle cx="110" cy="110" r="80" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="110" cy="110" r="60" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="110" cy="110" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="110" cy="110" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />

      {/* Stars */}
      <circle cx="110" cy="30" r="2" fill="currentColor" className="animate-pulse" style={{animationDuration: '3s'}} />
      <circle cx="50" cy="70" r="1.5" fill="currentColor" className="animate-pulse" style={{animationDuration: '4s'}} />
      <circle cx="170" cy="90" r="2" fill="currentColor" className="animate-pulse" style={{animationDuration: '5s'}} />
      <circle cx="90" cy="160" r="1.5" fill="currentColor" className="animate-pulse" style={{animationDuration: '3.5s'}} />
      <circle cx="170" cy="160" r="2" fill="currentColor" className="animate-pulse" style={{animationDuration: '4.5s'}} />

      {/* Connections */}
      <line x1="110" y1="30" x2="50" y2="70" stroke="currentColor" strokeWidth="0.3" />
      <line x1="50" y1="70" x2="170" y2="90" stroke="currentColor" strokeWidth="0.3" />
      <line x1="170" y1="90" x2="90" y2="160" stroke="currentColor" strokeWidth="0.3" />
      <line x1="90" y1="160" x2="170" y2="160" stroke="currentColor" strokeWidth="0.3" />
      <line x1="170" y1="160" x2="110" y2="30" stroke="currentColor" strokeWidth="0.3" />
    </svg>
  ),

  neurons: (
    <svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
      {/* Central neuron */}
      <circle cx="100" cy="80" r="8" fill="currentColor" className="opacity-40" />

      {/* Connected neurons */}
      <circle cx="40" cy="40" r="5" fill="currentColor" className="opacity-30" />
      <circle cx="160" cy="60" r="6" fill="currentColor" className="opacity-30" />
      <circle cx="60" cy="120" r="5" fill="currentColor" className="opacity-30" />
      <circle cx="140" cy="120" r="6" fill="currentColor" className="opacity-30" />
      <circle cx="180" cy="100" r="4" fill="currentColor" className="opacity-30" />
      <circle cx="20" cy="90" r="4" fill="currentColor" className="opacity-30" />

      {/* Connections/Dendrites */}
      <path d="M100,80 Q70,60 40,40" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <path d="M100,80 Q130,70 160,60" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <path d="M100,80 Q80,100 60,120" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <path d="M100,80 Q120,100 140,120" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <path d="M100,80 Q140,90 180,100" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <path d="M100,80 Q60,85 20,90" stroke="currentColor" strokeWidth="0.5" fill="none" />

      {/* Small connecting neurons */}
      <circle cx="70" cy="60" r="2" fill="currentColor" className="opacity-60 animate-pulse" style={{animationDuration: '4s'}} />
      <circle cx="130" cy="70" r="2" fill="currentColor" className="opacity-60 animate-pulse" style={{animationDuration: '3s'}} />
      <circle cx="80" cy="100" r="2" fill="currentColor" className="opacity-60 animate-pulse" style={{animationDuration: '5s'}} />
      <circle cx="120" cy="100" r="2" fill="currentColor" className="opacity-60 animate-pulse" style={{animationDuration: '4.5s'}} />
      <circle cx="140" cy="90" r="2" fill="currentColor" className="opacity-60 animate-pulse" style={{animationDuration: '3.5s'}} />
      <circle cx="60" cy="85" r="2" fill="currentColor" className="opacity-60 animate-pulse" style={{animationDuration: '4.2s'}} />
    </svg>
  ),

  moroccanPattern: (
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
      {/* Moroccan Star Pattern - simplified and cosmic-inspired */}
      <path d="M90,10 L110,60 L160,60 L120,90 L140,140 L90,110 L40,140 L60,90 L20,60 L70,60 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />

      <path d="M90,30 L103,65 L140,65 L110,85 L125,120 L90,100 L55,120 L70,85 L40,65 L77,65 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />

      <circle cx="90" cy="90" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="90" cy="90" r="60" fill="none" stroke="currentColor" strokeWidth="0.3" />

      {/* Small stars at points */}
      <circle cx="90" cy="10" r="1" fill="currentColor" className="animate-pulse" style={{animationDuration: '3s'}} />
      <circle cx="160" cy="60" r="1" fill="currentColor" className="animate-pulse" style={{animationDuration: '4s'}} />
      <circle cx="140" cy="140" r="1" fill="currentColor" className="animate-pulse" style={{animationDuration: '5s'}} />
      <circle cx="40" cy="140" r="1" fill="currentColor" className="animate-pulse" style={{animationDuration: '4.5s'}} />
      <circle cx="20" cy="60" r="1" fill="currentColor" className="animate-pulse" style={{animationDuration: '3.5s'}} />
    </svg>
  ),

  arabicCalligraphy: (
    <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
      {/* Stylized Arabic-inspired calligraphy shape that hints at "أستاذ" */}
      <path d="M20,70 C40,30 60,90 80,50 C90,30 100,70 120,50 C140,30 160,90 180,50"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        className="opacity-70"
      />

      {/* Dots - important in Arabic calligraphy */}
      <circle cx="80" cy="40" r="2" fill="currentColor" className="animate-pulse" style={{animationDuration: '3s'}} />
      <circle cx="120" cy="40" r="2" fill="currentColor" className="animate-pulse" style={{animationDuration: '4s'}} />
      <circle cx="160" cy="40" r="2" fill="currentColor" className="animate-pulse" style={{animationDuration: '5s'}} />

      {/* Connecting lines to cosmos */}
      <line x1="80" y1="40" x2="90" y2="20" stroke="currentColor" strokeWidth="0.3" />
      <line x1="120" y1="40" x2="130" y2="15" stroke="currentColor" strokeWidth="0.3" />
      <line x1="160" y1="40" x2="170" y2="25" stroke="currentColor" strokeWidth="0.3" />

      {/* Stars above */}
      <circle cx="90" cy="20" r="1.5" fill="currentColor" />
      <circle cx="130" cy="15" r="1.5" fill="currentColor" />
      <circle cx="170" cy="25" r="1.5" fill="currentColor" />
    </svg>
  )
};

// Enhanced language switcher with cosmic theme
const LanguageSwitcher = () => {
  const router = useRouter();
  const locale = useLocale();

  const handleLanguageChange = (lang: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${lang}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
          locale === 'ar'
            ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 ring-2 ring-emerald-500/50'
            : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-sm'
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => handleLanguageChange('fr')}
        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
          locale === 'fr'
            ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 ring-2 ring-emerald-500/50'
            : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-sm'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
          locale === 'en'
            ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400 ring-2 ring-emerald-500/50'
            : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-sm'
        }`}
      >
        EN
      </button>
    </div>
  );
};

// Enhanced header with improved dark mode and auth awareness
export const Header = () => {
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth(); // Import useAuth hook to check authentication status

  // Track scroll for header transparency
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-sm'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href={`/${locale}`} className="group">
            <div className="flex items-center transition-all">
              <div className="h-9 w-9 bg-emerald-600 text-white dark:bg-emerald-500 rounded-full flex items-center justify-center text-lg font-bold mr-2 group-hover:scale-110 transition-transform">
                U
              </div>
              <h1 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                <span className="mr-1 font-[El_Messiri]">أُستاذ</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-[Poppins]">Ustadh</span>
              </h1>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <LanguageSwitcher />
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-900"
              onClick={() => router.push(user ? `/${locale}/dashboard` : `/${locale}/register`)}
            >
              {user ? (
                locale === 'ar' ? 'لوحة التحكم' :
                locale === 'fr' ? 'Tableau de bord' :
                'Dashboard'
              ) : (
                locale === 'ar' ? 'التسجيل' :
                locale === 'fr' ? 'S\'inscrire' :
                'Sign Up'
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Enhanced hero section with cosmic elements
const HeroSection = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = translations[locale] || translations.en;
  const isRTL = locale === 'ar';

  const [animatedStars, setAnimatedStars] = useState([]);

  // Generate random stars for background
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 30; i++) {
      stars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        animationDuration: Math.random() * 3 + 2
      });
    }
    setAnimatedStars(stars as never[]);
  }, []);

  const directionClasses = {
    textAlign: isRTL ? 'text-right' : 'text-left',
    marginDir: isRTL ? 'ml-2' : 'mr-2',
    arrowDir: isRTL ? 'rotate-180 mr-2' : 'ml-2',
    flexDir: isRTL ? 'flex-row-reverse' : 'flex-row',
  };

  return (
    <section className="relative font-serif overflow-hidden py-24 md:py-32 mt-16">
      {/* Dynamic stars background */}
      <div className="absolute inset-0 bg-amber-50 dark:bg-slate-900">
        {/* Tiled background pattern with reduced opacity */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/tiles.jpg')`,
            backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat',
            opacity: 0.08
          }}
        ></div>

        {/* Animated stars */}
        {animatedStars.map((star: any) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${star.animationDuration}s`
            }}
          ></div>
        ))}

        {/* Cosmic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-100/30 dark:to-indigo-950/30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className={`flex-1 z-10 ${directionClasses.textAlign}`}>
            {/* Main CTA content */}
            <div className={isRTL ? 'rtl' : ''}>
              {/* Decorative cosmic SVG */}
              <div className="absolute top-10 left-0 md:-left-10 opacity-40 dark:opacity-30 pointer-events-none">
                {cosmicDecorations.moroccanPattern}
              </div>

              <h1 className="font-serif text-5xl md:text-7xl font-bold text-emerald-900 dark:text-emerald-200 mb-4 relative">
                <span className="block py-2">{locale === 'ar' ? 'أُستاذ' : t.hero.title}</span>
                {locale !== 'ar' && <span className="text-4xl md:text-5xl text-emerald-700 dark:text-emerald-400 block py-2 font-[El_Messiri]">أُستاذ</span>}

                {/* Decorative sparkle */}
                <span className="absolute -top-8 right-1/4 text-amber-400 dark:text-amber-300 animate-pulse" style={{animationDuration: '3s'}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z" fill="currentColor"/>
                  </svg>
                </span>
              </h1>

              <h2 className="text-xl md:text-2xl mb-6 text-amber-900 dark:text-amber-400 font-medium">
                {t.hero.subtitle}
              </h2>

              <p className="text-lg mb-8 text-slate-700 dark:text-slate-300 max-w-xl">
                {locale === 'ar'
                  ? "مدرس ذكي مدعوم بالذكاء الاصطناعي مخصص للطلاب المغاربة. يساعدك في فهم الدروس، حل الواجبات، والتحضير للامتحانات بلغتك المفضلة."
                  : locale === 'fr'
                    ? "Un tuteur intelligent alimenté par l'IA, conçu pour les étudiants marocains. Il vous aide à comprendre les leçons, résoudre les devoirs et préparer les examens dans votre langue préférée."
                    : "An AI-powered smart tutor designed specifically for Moroccan students. It helps you understand lessons, solve homework, and prepare for exams in your preferred language."}
              </p>

              {/* CTAs */}
              <div className={`flex flex-wrap gap-4 ${directionClasses.flexDir}`}>
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-900 group transition-all"
                  onClick={() => router.push(`${locale}/register`)}
                >
                  {t.hero.cta}
                  <ArrowRight className={`h-4 w-4 ${directionClasses.arrowDir} group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform`} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  {t.hero.watchDemo}
                </Button>
              </div>

              <div className={`mt-6 flex items-center text-sm text-slate-600 dark:text-slate-400 ${directionClasses.flexDir}`}>
                <CheckCircle2 className={`h-4 w-4 text-emerald-500 ${directionClasses.marginDir}`} />
                {locale === 'ar'
                  ? "لا حاجة لبطاقة ائتمان للبدء"
                  : locale === 'fr'
                    ? "Pas besoin de carte de crédit pour commencer"
                    : "No credit card required to start"}
              </div>
            </div>
          </div>

          <div className="flex-1 z-10">
            {/* UI mockup with cosmic elements */}
            <div className="relative w-full max-w-md mx-auto">
              {/* Decorative cosmic SVG */}
              <div className="absolute -top-20 -right-20 opacity-40 dark:opacity-30 pointer-events-none">
                {cosmicDecorations.constellations}
              </div>

              <div className="absolute -bottom-10 -left-10 opacity-30 dark:opacity-20 pointer-events-none rotate-45">
                {cosmicDecorations.neurons}
              </div>

              <div className="relative aspect-[3/2] rounded-lg shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/90 to-blue-500/80 rounded-lg">
                  <div className="absolute inset-0.5 bg-white/95 dark:bg-slate-900/95 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="flex space-x-1">
                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                        <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="mx-auto text-xs font-medium text-slate-500 dark:text-slate-400">Ustadh AI Tutor</div>
                    </div>

                    {/* Chat interface */}
                    <div className="h-48 bg-slate-50 dark:bg-slate-800 rounded p-3 mb-3 overflow-hidden">
                      <div className="flex gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-300 text-xs font-bold">U</div>
                        <div className="bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 p-2 rounded-lg rounded-tl-none text-sm max-w-[80%] shadow-sm">
                          <p className="mb-1">{locale === 'ar' ? 'مرحبا! أنا أستاذك الشخصي. ما الذي يثير فضولك اليوم؟' :
                            locale === 'fr' ? 'Bonjour! Je suis votre tuteur personnel. Qu\'est-ce qui éveille votre curiosité aujourd\'hui?' :
                            'Hello! I\'m your personal tutor. What sparks your curiosity today?'}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 text-right">09:41</p>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end mb-2">
                        <div className="bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-300 p-2 rounded-lg rounded-tr-none text-sm max-w-[80%] shadow-sm">
                          <p className="mb-1">{locale === 'ar' ? 'كيف ترتبط الرياضيات بالفلك والكون؟' :
                            locale === 'fr' ? 'Comment les mathématiques sont-elles liées à l\'astronomie et au cosmos?' :
                            'How is mathematics connected to astronomy and the cosmos?'}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 text-right">09:42</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-bold">S</div>
                      </div>

                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-300 text-xs font-bold">U</div>
                        <div className="bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 p-2 rounded-lg rounded-tl-none text-sm max-w-[80%] animate-pulse">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-emerald-400 dark:bg-emerald-500 rounded-full"></div>
                            <div className="h-2 w-2 bg-emerald-400 dark:bg-emerald-500 rounded-full"></div>
                            <div className="h-2 w-2 bg-emerald-400 dark:bg-emerald-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex gap-2 items-center">
                      <div className="flex space-x-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-slate-900 hover:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer transition-colors shadow-sm">
                          <Stars className="h-5 w-5" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white hover:bg-amber-600 cursor-pointer transition-colors shadow-sm">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 cursor-pointer transition-colors shadow-sm">
                          <Globe className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="flex-1 ml-2">
                        <div className="h-10 flex items-center px-4 bg-slate-100 dark:bg-slate-800 text-sm text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 cursor-text transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
                          {locale === 'ar' ? 'اكتب سؤالاً يثير فضولك هنا...' :
                           locale === 'fr' ? 'Écrivez une question qui éveille votre curiosité...' :
                           'Type a question that sparks your curiosity...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

{/* Floating sparkles */}
<div className="absolute -top-4 -right-4 text-amber-400 dark:text-amber-300 animate-pulse" style={{animationDuration: '4s'}}>
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-2 left-4 text-emerald-400 dark:text-emerald-300 animate-pulse" style={{animationDuration: '3.5s'}}>
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Enhanced Features section with cosmic elements
const FeaturesSection = () => {
  const locale = useLocale();
  const t = translations[locale] || translations.en;

  return (
    <section className="py-16 bg-white dark:bg-slate-900 relative overflow-hidden" id="features">
      {/* Decorative cosmic elements */}
      <div className="absolute top-10 right-10 opacity-20 dark:opacity-30 pointer-events-none">
        {cosmicDecorations.arabicCalligraphy}
      </div>

      <div className="absolute bottom-10 left-10 opacity-20 dark:opacity-30 pointer-events-none rotate-180">
        {cosmicDecorations.moroccanPattern}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">{t.features.title}</h2>

          {/* Decorative sparkle */}
          <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-400 dark:text-amber-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" fill="currentColor" className="animate-spin-slow"/>
            </svg>
          </span>
        </div>

        <Tabs defaultValue="personalized" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-12 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <TabsTrigger
              value="personalized"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/60 dark:data-[state=active]:text-emerald-300 rounded-lg transition-all"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'مخصص' : locale === 'fr' ? 'Personnalisé' : 'Personalized'}
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/60 dark:data-[state=active]:text-emerald-300 rounded-lg transition-all"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'المنهج' : locale === 'fr' ? 'Programme' : 'Curriculum'}
            </TabsTrigger>
            <TabsTrigger
              value="practice"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/60 dark:data-[state=active]:text-emerald-300 rounded-lg transition-all"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'تدريب' : locale === 'fr' ? 'Pratique' : 'Practice'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalized" className="mt-0 relative">
            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group transition-all duration-500">
              {/* Animated decorative background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-transparent dark:from-emerald-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-3">
                    <Brain className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'ذكاء اصطناعي يفهمك' :
                      locale === 'fr' ? 'Une IA qui vous comprend' :
                        'AI that understands you'}
                  </h3>
                </div>

                <p className="text-slate-700 dark:text-slate-300 ml-13">
                  {locale === 'ar'
                    ? 'يتكيف نظامنا مع أسلوب تعلمك ويفهم المفاهيم التي تستكشفها، مما يخلق تجربة تعليمية مخصصة تثير فضولك وتوسع آفاقك.'
                    : locale === 'fr'
                      ? 'Notre système s\'adapte à votre style d\'apprentissage et comprend les concepts que vous explorez, créant une expérience éducative personnalisée qui éveille votre curiosité et élargit vos horizons.'
                      : 'Our system adapts to your learning style and understands the concepts you\'re exploring, creating a personalized educational experience that sparks your curiosity and expands your horizons.'}
                </p>

                {/* Curiosity questions */}
                <div className="mt-6 ml-13">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'يطرح أسئلة تثير الفضول' :
                     locale === 'fr' ? 'Pose des questions stimulantes' :
                     'Asks curiosity-sparking questions'}
                  </p>
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 italic text-slate-600 dark:text-slate-400">
                    "{locale === 'ar' ? 'هل تساءلت يوماً كيف يستخدم علماء الفلك الرياضيات لفهم أبعاد الكون؟' :
                      locale === 'fr' ? 'Vous êtes-vous déjà demandé comment les astronomes utilisent les mathématiques pour comprendre les dimensions du cosmos?' :
                      'Have you ever wondered how astronomers use mathematics to understand the dimensions of the cosmos?'}"
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="mt-0">
            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group transition-all duration-500">
              {/* Animated decorative background */}
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'متوافق مع التعليم المغربي' :
                      locale === 'fr' ? 'Aligné avec l\'éducation marocaine' :
                        'Aligned with Moroccan education'}
                  </h3>
                </div>

                <p className="text-slate-700 dark:text-slate-300 ml-13">
                  {locale === 'ar'
                    ? 'مصمم خصيصًا للمناهج المغربية، يربط أستاذ بين المفاهيم المحلية والآفاق العالمية، مما يمنحك فهمًا أعمق يتجاوز الحدود التقليدية للمناهج الدراسية.'
                    : locale === 'fr'
                      ? 'Spécialement conçu pour les programmes marocains, Ustadh établit des liens entre les concepts locaux et les perspectives mondiales, vous offrant une compréhension plus profonde qui dépasse les frontières traditionnelles du programme scolaire.'
                      : 'Specifically designed for Moroccan curricula, Ustadh connects local concepts with global perspectives, giving you deeper understanding that transcends traditional curriculum boundaries.'}
                </p>

                {/* Example connection */}
                <div className="mt-6 ml-13">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'يربط المعرفة المحلية بالعالمية' :
                     locale === 'fr' ? 'Relie le savoir local au global' :
                     'Connects local knowledge to global context'}
                  </p>
                  <div className="mt-3 space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-3">
                        <span className="text-xs font-bold">MA</span>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded text-sm text-slate-700 dark:text-slate-300">
                        {locale === 'ar' ? 'علم الفلك في تراث ابن البنّاء المراكشي' :
                         locale === 'fr' ? 'L\'astronomie dans l\'héritage d\'Ibn al-Banna al-Marrakushi' :
                         'Astronomy in Ibn al-Banna al-Marrakushi\'s heritage'}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-sm text-slate-700 dark:text-slate-300 mr-3">
                        {locale === 'ar' ? 'امتداد نظريات ابن البنّاء في علم الفلك الحديث' :
                         locale === 'fr' ? 'Extension des théories d\'Ibn al-Banna dans l\'astronomie moderne' :
                         'Extension of Ibn al-Banna\'s theories in modern astronomy'}
                      </div>
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="text-xs font-bold">GL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="mt-0">
            <Card className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group transition-all duration-500">
              {/* Animated decorative background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-50 to-transparent dark:from-amber-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-3">
                    <Stars className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    {locale === 'ar' ? 'التمرين يصنع الإتقان' :
                      locale === 'fr' ? 'La pratique mène à la perfection' :
                        'Practice makes perfect'}
                  </h3>
                </div>

                <p className="text-slate-700 dark:text-slate-300 ml-13">
                  {locale === 'ar'
                    ? 'استكشف المفاهيم من خلال أسئلة تفاعلية وتمارين مخصصة تتحدى فكرك وتعمق فهمك، مما يتيح لك تطبيق ما تتعلمه في سياقات واقعية ومثيرة للاهتمام.'
                    : locale === 'fr'
                      ? 'Explorez les concepts à travers des questions interactives et des exercices personnalisés qui défient votre esprit et approfondissent votre compréhension, vous permettant d\'appliquer ce que vous apprenez dans des contextes réels et fascinants.'
                      : 'Explore concepts through interactive questions and personalized exercises that challenge your mind and deepen your understanding, allowing you to apply what you learn in real-world, fascinating contexts.'}
                </p>

                {/* Interactive example */}
                <div className="mt-6 ml-13">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'يتحدى تفكيرك بأسئلة مثيرة للتفكير' :
                     locale === 'fr' ? 'Défie votre pensée avec des questions stimulantes' :
                     'Challenges your thinking with thought-provoking questions'}
                  </p>
                  <div className="mt-3 p-4 bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                      {locale === 'ar' ? 'ماذا يحدث للأجسام قرب الثقوب السوداء؟ فكر في...' :
                       locale === 'fr' ? 'Que se passe-t-il pour les objets près des trous noirs? Considérez...' :
                       'What happens to objects near black holes? Consider...'}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <div className="py-1 px-3 bg-white dark:bg-slate-800 rounded-full text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        {locale === 'ar' ? 'تمدد الزمن' : locale === 'fr' ? 'Dilatation du temps' : 'Time dilation'}
                      </div>
                      <div className="py-1 px-3 bg-white dark:bg-slate-800 rounded-full text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        {locale === 'ar' ? 'تشوه الضوء' : locale === 'fr' ? 'Distorsion de la lumière' : 'Light distortion'}
                      </div>
                      <div className="py-1 px-3 bg-white dark:bg-slate-800 rounded-full text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                        {locale === 'ar' ? 'المد الثقالي' : locale === 'fr' ? 'Effet de marée' : 'Tidal forces'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

// Enhanced App download section with cosmic design
const AppDownloadSection = () => {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Translation object for app download section
  const appTranslations = {
    ar: {
      title: "حمّل تطبيق أستاذ",
      subtitle: "استكشف الكون المعرفي في أي مكان",
      description: "رحلة المعرفة لا تتوقف أبدًا. مع تطبيق أستاذ، يمكنك استكشاف أعماق الأفكار والمفاهيم أينما كنت، حتى بدون إنترنت.",
      getItOn: "متوفر على",
      forDesktop: "للكمبيوتر",
      desktop: "الكمبيوتر",
      features: {
        offline: "استكشف العلوم بدون إنترنت",
        sync: "مزامنة رحلتك المعرفية عبر جميع أجهزتك",
        notifications: "أسئلة يومية تثير فضولك وتوسّع آفاقك"
      }
    },
    fr: {
      title: "Téléchargez l'application Ustadh",
      subtitle: "Explorez l'univers de la connaissance partout",
      description: "Le voyage de la connaissance ne s'arrête jamais. Avec l'application Ustadh, vous pouvez explorer les profondeurs des idées et des concepts où que vous soyez, même sans internet.",
      getItOn: "Disponible sur",
      forDesktop: "Pour ordinateur",
      desktop: "Ordinateur",
      features: {
        offline: "Explorez les sciences sans internet",
        sync: "Synchronisez votre voyage de connaissance sur tous vos appareils",
        notifications: "Questions quotidiennes qui éveillent votre curiosité et élargissent vos horizons"
      }
    },
    en: {
      title: "Download the Ustadh App",
      subtitle: "Explore the universe of knowledge anywhere",
      description: "The journey of knowledge never stops. With the Ustadh app, you can explore the depths of ideas and concepts wherever you are, even without internet access.",
      getItOn: "GET IT ON",
      forDesktop: "For Desktop",
      desktop: "Desktop",
      features: {
        offline: "Explore sciences without internet",
        sync: "Sync your knowledge journey across all your devices",
        notifications: "Daily questions that spark your curiosity and expand your horizons"
      }
    }
  };

  //@ts-ignore
  const t = appTranslations[locale as any] || appTranslations.en;

  return (
    <section className="py-16 relative overflow-hidden" id="app">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 opacity-5 dark:opacity-10"
          style={{
            backgroundImage: `url('/tiles.jpg')`,
            backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat'
          }}
        ></div>

        {/* Animated floating elements */}
        <div className="absolute top-20 left-10 opacity-30 dark:opacity-40">
          {cosmicDecorations.neurons}
        </div>

        <div className="absolute bottom-20 right-10 opacity-30 dark:opacity-40">
          {cosmicDecorations.constellations}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">{t.title}</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 max-w-6xl mx-auto">
          <div className={`w-full md:w-1/2 ${isRTL ? 'md:order-2' : ''}`}>
            <div className="relative max-w-sm mx-auto">
              {/* Phone mockup with cosmic enhancements */}
              <div className="relative z-10 border-8 border-black rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="aspect-[9/16] bg-white dark:bg-slate-900 relative">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 w-1/2 mx-auto bg-black rounded-b-xl"></div>

                  {/* Screen content */}
                  <div className="bg-emerald-50 dark:bg-slate-800 h-full p-4">
                    <div className="h-12 bg-emerald-600 dark:bg-emerald-500 rounded-t-lg flex items-center px-4">
                      <div className="text-white dark:text-slate-900 font-bold">Ustadh</div>
                      <div className="ml-auto flex items-center gap-1">
                        <Stars className="h-4 w-4 text-white dark:text-slate-900" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 h-[calc(100%-3rem)] rounded-b-lg flex flex-col p-3 shadow-sm">
                      <div className="h-24 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/40 dark:to-blue-900/40 rounded mb-2 flex items-center justify-center relative p-3">
                        <span className="text-emerald-800 dark:text-emerald-300 font-medium text-center">
                          {locale === 'ar' ? 'اكتشف أسرار الكون مع أستاذ' :
                            locale === 'fr' ? 'Découvrez les secrets du cosmos avec Ustadh' :
                              'Discover the secrets of the cosmos with Ustadh'}
                        </span>

                        {/* Decorative star */}
                        <div className="absolute top-2 right-2 text-amber-400 dark:text-amber-300">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z" fill="currentColor"/>
                          </svg>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center px-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-emerald-50 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="h-10 w-10 rounded-full bg-emerald-200 dark:bg-emerald-800 mr-3 flex items-center justify-center z-10">
                              {i === 1 ? (
                                <Stars className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : i === 2 ? (
                                <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                            <div className="flex-1 z-10">
                              <div className="h-3 w-24 bg-slate-300 dark:bg-slate-600 rounded mb-2"></div>
                              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </div>
                            <div className="z-10">
                              <ArrowRight className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                            </div>
                          </div>
                        ))}

                        {/* Daily curiosity question */}
                        <div className="mt-1 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded p-3 relative">
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {locale === 'ar' ? 'سؤال اليوم' : locale === 'fr' ? 'Question du jour' : 'Today\'s Question'}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            {locale === 'ar' ? 'كيف تتشكل المجرات في الكون المبكر؟' :
                             locale === 'fr' ? 'Comment les galaxies se forment-elles dans l\'univers primitif?' :
                             'How do galaxies form in the early universe?'}
                          </p>

                          {/* Decorative elements */}
                          <div className="absolute bottom-2 right-2 opacity-30">
                            <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
                              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
                              <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/4 -left-8 h-32 w-32 bg-emerald-300 dark:bg-emerald-700 rounded-full opacity-30 blur-xl"></div>
              <div className="absolute bottom-1/3 -right-8 h-24 w-24 bg-amber-300 dark:bg-amber-700 rounded-full opacity-30 blur-xl"></div>

{/* Floating stars */}
<div className="absolute -top-4 -right-4 text-amber-400 dark:text-amber-300 animate-pulse" style={{animationDuration: '3s'}}>
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute bottom-10 left-10 text-emerald-400 dark:text-emerald-300 animate-pulse" style={{animationDuration: '4s'}}>
                <Stars className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className={`w-full md:w-1/2 ${isRTL ? 'text-right md:order-1' : ''}`}>
            <div className="max-w-lg">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                {locale === 'ar' ? 'استمر في رحلة الاستكشاف أينما كنت' :
                  locale === 'fr' ? 'Continuez votre voyage d\'exploration où que vous soyez' :
                    'Continue your exploration journey wherever you are'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">{t.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* App Store button with proper language badge */}
                <a href="#" className={`h-14 hover:scale-105 transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={`/app-store/${locale === 'ar' ? 'AR' : locale === 'fr' ? 'FR' : 'US'}/white/SVG/Download_on_the_App_Store_Badge_${locale === 'ar' ? 'AR' : locale === 'fr' ? 'FR' : 'US-UK'}_RGB_wht_${locale === 'ar' ? '102417' : locale === 'fr' ? '100517' : '092917'}.svg`}
                    alt={`Download on the App Store - ${locale}`}
                    className="h-full"
                  />
                </a>

                {/* Google Play button */}
                <a href="#" className={`h-14 hover:scale-105 transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={`/google-play-${locale === 'ar' ? 'arabic' : locale === 'fr' ? 'french' : 'english'}.png`}
                    alt={`Get it on Google Play - ${locale}`}
                    className="h-full"
                  />
                </a>

                {/* Desktop button */}
                <a href="#" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-900 rounded-xl px-4 py-3 transition hover:bg-emerald-700 dark:hover:bg-emerald-600 h-14 hover:scale-105 group`}>
                  <div className={`${isRTL ? 'ml-3' : 'mr-3'}`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs">{t.forDesktop}</div>
                    <div className="text-lg font-semibold">{t.desktop}</div>
                  </div>
                </a>
              </div>

              {/* Features with cosmic icons */}
              <div className="space-y-6">
                {Object.entries(t.features).map(([key, value], index) => (
                  <div key={key} className={`flex items-center group ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${
                      index === 0
                        ? 'from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40'
                        : index === 1
                        ? 'from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40'
                        : 'from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40'
                    } flex items-center justify-center ${isRTL ? 'ml-4' : 'mr-4'} transition-transform group-hover:scale-110`}>
                      {index === 0 ? (
                        <Globe className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      ) : index === 1 ? (
                        <Brain className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      ) : (
                        <Stars className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      )}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      {/* @ts-ignore */}
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Enhanced CTA Section with cosmic elements
const CTASection = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = translations[locale] || translations.en;

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-900 dark:to-slate-900">
        {/* Animated stars */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            ></div>
          ))}
        </div>

        {/* Decorative moroccan pattern */}
        <div className="absolute top-0 left-0 opacity-10">
          {cosmicDecorations.moroccanPattern}
        </div>

        <div className="absolute bottom-0 right-0 opacity-10 rotate-180">
          {cosmicDecorations.moroccanPattern}
        </div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative inline-block">
            {t.cta.title}

            {/* Decorative star */}
            <span className="absolute -top-6 -right-6 text-amber-300 animate-pulse" style={{animationDuration: '3s'}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z" fill="currentColor"/>
              </svg>
            </span>
          </h2>

          <p className="text-white/80 mb-8 text-lg">
            {locale === 'ar'
              ? 'افتح آفاقًا جديدة من المعرفة واستكشف عالمًا من الأفكار المثيرة للفضول'
              : locale === 'fr'
                ? 'Ouvrez de nouveaux horizons de connaissances et explorez un monde d\'idées fascinantes'
                : 'Open new horizons of knowledge and explore a world of curiosity-inspiring ideas'}
          </p>

          <Button
            size="lg"
            className="bg-white text-emerald-700 hover:bg-emerald-50 dark:bg-white dark:text-emerald-700 dark:hover:bg-emerald-50 group transition-all"
            onClick={() => router.push(`${locale}/register`)}
          >
            <span className="group-hover:scale-105 transition-transform inline-block">
              {t.cta.button}
            </span>
            <Sparkles className="ml-2 h-4 w-4 group-hover:animate-ping" />
          </Button>

          <div className="mt-8 text-white/60 flex items-center justify-center gap-1">
            <Stars className="h-4 w-4" />
            <span>
              {locale === 'ar'
                ? 'انضم إلى أكثر من ١٠٬٠٠٠ طالب مغربي في رحلة تعليمية فريدة'
                : locale === 'fr'
                  ? 'Rejoignez plus de 10 000 étudiants marocains dans un voyage éducatif unique'
                  : 'Join over 10,000 Moroccan students on a unique educational journey'}
            </span>
            <Stars className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
};

// Enhanced Footer with cosmic elements and improved dark mode
const Footer = () => {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Footer translations
  const footerTranslations = {
    ar: {
      company: "الشركة",
      about: "عن أستاذ",
      careers: "وظائف",
      press: "أخبار صحفية",
      blog: "المدونة",
      resources: "موارد",
      helpCenter: "مركز المساعدة",
      tutorials: "دروس تعليمية",
      faq: "الأسئلة الشائعة",
      privacyPolicy: "سياسة الخصوصية",
      termsOfService: "شروط الخدمة",
      legal: "قانوني",
      contact: "تواصل معنا",
      social: "تابعنا",
      copyright: "جميع الحقوق محفوظة لأستاذ",
      language: "اللغة",
      newsletter: "النشرة الإخبارية",
      subscribeText: "اشترك للحصول على آخر التحديثات وأسئلة تثير فضولك",
      subscribe: "اشترك",
      email: "البريد الإلكتروني",
      addressTitle: "المكتب الرئيسي",
      address: "شارع الحسن الثاني، الرباط، المغرب",
      subjects: "المواد الدراسية",
      math: "الرياضيات",
      physics: "الفيزياء",
      chemistry: "الكيمياء",
      biology: "علوم الحياة",
      languages: "اللغات",
      humanities: "العلوم الإنسانية"
    },
    fr: {
      company: "Entreprise",
      about: "À propos d'Ustadh",
      careers: "Carrières",
      press: "Presse",
      blog: "Blog",
      resources: "Ressources",
      helpCenter: "Centre d'aide",
      tutorials: "Tutoriels",
      faq: "FAQ",
      privacyPolicy: "Politique de confidentialité",
      termsOfService: "Conditions d'utilisation",
      legal: "Mentions légales",
      contact: "Contactez-nous",
      social: "Suivez-nous",
      copyright: "Tous droits réservés à Ustadh",
      language: "Langue",
      newsletter: "Newsletter",
      subscribeText: "Abonnez-vous pour recevoir des questions qui éveillent votre curiosité",
      subscribe: "S'abonner",
      email: "Email",
      addressTitle: "Bureau Principal",
      address: "Avenue Hassan II, Rabat, Maroc",
      subjects: "Matières",
      math: "Mathématiques",
      physics: "Physique",
      chemistry: "Chimie",
      biology: "Sciences de la Vie",
      languages: "Langues",
      humanities: "Sciences Humaines"
    },
    en: {
      company: "Company",
      about: "About Ustadh",
      careers: "Careers",
      press: "Press",
      blog: "Blog",
      resources: "Resources",
      helpCenter: "Help Center",
      tutorials: "Tutorials",
      faq: "FAQ",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      legal: "Legal",
      contact: "Contact Us",
      social: "Follow Us",
      copyright: "All rights reserved to Ustadh",
      language: "Language",
      newsletter: "Newsletter",
      subscribeText: "Subscribe to get updates and curiosity-sparking questions",
      subscribe: "Subscribe",
      email: "Email",
      addressTitle: "Headquarters",
      address: "Hassan II Avenue, Rabat, Morocco",
      subjects: "Subjects",
      math: "Mathematics",
      physics: "Physics",
      chemistry: "Chemistry",
      biology: "Biology",
      languages: "Languages",
      humanities: "Humanities"
    }
  };

  //@ts-ignore
  const t = footerTranslations[locale] || footerTranslations.en;

  // Get current year
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-slate-900 dark:bg-slate-950 text-slate-300 dark:text-slate-400 pt-12 pb-6 relative overflow-hidden ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>
      {/* Cosmic background elements */}
      <div className="absolute top-0 right-0 opacity-5">
        {cosmicDecorations.constellations}
      </div>

      <div className="absolute bottom-0 left-0 opacity-5">
        {cosmicDecorations.arabicCalligraphy}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Logo and company info */}
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-900 h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold mr-2">
                U
              </div>
              <h2 className="text-white text-xl font-bold">
                <span className="mr-1 font-[El_Messiri]">أُستاذ</span>
                <span className="text-emerald-400">Ustadh</span>
              </h2>
            </div>

            <p className="text-slate-400 mb-4">
              {locale === 'ar'
                ? "منصة تعليمية مدعومة بالذكاء الاصطناعي تثير الفضول وتوسع آفاق المعرفة للطلاب المغاربة"
                : locale === 'fr'
                  ? "Plateforme éducative alimentée par l'IA qui éveille la curiosité et élargit les horizons de connaissance pour les étudiants marocains"
                  : "AI-powered educational platform that sparks curiosity and expands knowledge horizons for Moroccan students"}
            </p>

            <div className="mb-4">
              <h3 className="text-white text-sm font-semibold mb-2">{t.addressTitle}</h3>
              <address className="text-slate-400 text-sm not-italic flex items-center">
                <Globe className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-emerald-400`} />
                {t.address}
              </address>
            </div>

            {/* Language switcher */}
            <LanguageSwitcher />
          </div>

          {/* Column 2: Links */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.company}
                </h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.about}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.careers}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.press}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.blog}</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.resources}
                </h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.helpCenter}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.tutorials}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                    <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                    {t.faq}</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                {t.legal}
              </h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.privacyPolicy}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.termsOfService}</a></li>
              </ul>
            </div>
          </div>

          {/* Column 3: Subjects */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
              {t.subjects}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.math}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.physics}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.chemistry}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.biology}</a>
              </div>
              <div>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.languages}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {t.humanities}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {locale === 'ar' ? 'المعلوميات' : locale === 'fr' ? 'Informatique' : 'Computer Science'}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition group flex items-center">
                  <span className={`h-1 w-0 bg-emerald-400 group-hover:w-2 transition-all rounded-full ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                  {locale === 'ar' ? 'العلوم الإسلامية' : locale === 'fr' ? 'Études Islamiques' : 'Islamic Studies'}</a>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                {t.contact}
              </h3>
              <a href="mailto:contact@ustadh.ma" className="flex items-center hover:text-emerald-400 transition">
                <svg className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-emerald-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@ustadh.ma
              </a>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
              {t.newsletter}
            </h3>
            <p className="text-slate-400 mb-4">{t.subscribeText}</p>

            <form className="mb-6">
              <div className="flex rounded-md overflow-hidden">
                <input
                  type="email"
                  placeholder={t.email}
                  className="flex-1 px-4 py-2 bg-slate-800 dark:bg-slate-900 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-900 px-4 py-2 transition text-sm"
                >
                  {t.subscribe}
                </button>
              </div>
            </form>

            <h3 className="text-white font-semibold mb-4 flex items-center">
              <span className={`h-1 w-3 bg-emerald-400 rounded-full block ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
              {t.social}
            </h3>
            <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 flex items-center justify-center text-white hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 flex items-center justify-center text-white hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.057 10.057 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 flex items-center justify-center text-white hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 flex items-center justify-center text-white hover:text-emerald-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom footer with stars */}
        <div className="pt-6 border-t border-slate-800 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center relative">
          {/* Animated stars in the border */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 rounded-full bg-emerald-400 dark:bg-emerald-500 animate-pulse"
              style={{
                width: '2px',
                height: '2px',
                left: `${10 + (i * 20)}%`,
                transform: 'translateY(-50%)',
                animationDuration: `${2 + (i * 0.5)}s`
              }}
            ></div>
          ))}

          <div className="text-sm text-slate-500 mb-4 sm:mb-0 flex items-center">
            <Stars className="h-3 w-3 mr-2 text-emerald-500 dark:text-emerald-400" />
            &copy; {currentYear} Ustadh. {t.copyright}
          </div>

          <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
            <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">{t.privacyPolicy}</a>
            <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition-colors">{t.termsOfService}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main component
export default function Home() {
  const locale = useLocale();

  // Auto-detect user's language and set direction
  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  // Add custom scrollbar and other global styles
  useEffect(() => {
    // Add global styles
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --font-arabic: 'El Messiri', sans-serif;
        --font-latin: 'Poppins', system-ui, sans-serif;
        scrollbar-color: rgba(15, 118, 110, 0.5) rgba(15, 118, 110, 0.1);
      }

      html[dir="rtl"] h1, html[dir="rtl"] h2, html[dir="rtl"] h3,
      html[dir="rtl"] .font-serif {
        font-family: var(--font-arabic);
      }

      html[dir="ltr"] h1, html[dir="ltr"] h2, html[dir="ltr"] h3,
      html[dir="ltr"] .font-serif {
        font-family: var(--font-latin);
      }

      html {
        scroll-behavior: smooth;
      }

      /* Custom scrollbar for Webkit browsers */
      ::-webkit-scrollbar {
        width: 10px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(15, 118, 110, 0.1);
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(15, 118, 110, 0.5);
        border-radius: 5px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(15, 118, 110, 0.7);
      }

      /* Animation for slow spin */
      @keyframes spin-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .animate-spin-slow {
        animation: spin-slow 12s linear infinite;
      }
    `;
    document.head.appendChild(style);

    // Import fonts
    const linkPoppins = document.createElement('link');
    linkPoppins.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    linkPoppins.rel = 'stylesheet';
    document.head.appendChild(linkPoppins);

    const linkElMessiri = document.createElement('link');
    linkElMessiri.href = 'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap';
    linkElMessiri.rel = 'stylesheet';
    document.head.appendChild(linkElMessiri);

    return () => {
      document.head.removeChild(style);
      if (document.head.contains(linkPoppins)) {
        document.head.removeChild(linkPoppins);
      }
      if (document.head.contains(linkElMessiri)) {
        document.head.removeChild(linkElMessiri);
      }
    };
  }, []);

  // Get translations based on locale
  const t = translations[locale] || translations.en;

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-amber-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 min-h-screen">
        <Header />
        <HeroSection />
        <FeaturesSection />
        <AppDownloadSection />
        <CTASection />
        <Footer />

        {/* Floating action button to scroll to top with stars animation */}
        <button
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-900 flex items-center justify-center shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all z-50 group"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>

          {/* Small sparkles */}
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-300 animate-ping"></span>
          <span className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-amber-300 animate-ping" style={{animationDelay: "0.5s"}}></span>
        </button>
      </main>
    </>
  );
}
