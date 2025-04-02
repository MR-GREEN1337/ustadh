"use client";
import { useEffect } from 'react';
import Head from 'next/head';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { getDirection } from '@/i18n/config';

// Basic translations
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

// Language switcher component
const LanguageSwitcher = () => {
  const router = useRouter();
  const locale = useLocale();

  const handleLanguageChange = (lang: any) => {
    // Replace the locale in the current path
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${locale}`, `/${lang}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`h-8 w-8 rounded-full flex items-center justify-center ${locale === 'ar' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm'}`}
      >
        العربية
      </button>
      <button
        onClick={() => handleLanguageChange('fr')}
        className={`h-8 w-8 rounded-full flex items-center justify-center ${locale === 'fr' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm'}`}
      >
        FR
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`h-8 w-8 rounded-full flex items-center justify-center ${locale === 'en' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm'}`}
      >
        EN
      </button>
    </div>
  );
};

// Header component
const Header = () => {
  const router = useRouter();
  const locale = useLocale();
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-emerald-900">
              <span className="mr-1">أُستاذ</span>
              <span className="text-emerald-700">Ustadh</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push(`${locale}/register`)}>
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero section
const HeroSection = () => {
  const router = useRouter();
  const locale = useLocale();

  // Use the translation data based on locale
  const t = translations[locale] || translations.en;

  // Direction-aware classes and styles
  const isRTL = locale === 'ar';
  const directionClasses = {
    textAlign: isRTL ? 'text-right' : 'text-left',
    marginDir: isRTL ? 'ml-2' : 'mr-2',
    arrowDir: isRTL ? 'rotate-180 mr-2' : 'ml-2',
    flexDir: isRTL ? 'flex-row-reverse' : 'flex-row',
  };

  return (
    <section className="relative font-serif overflow-hidden py-24 md:py-32 mt-16">
      {/* Background using PNG tile pattern */}
      <div className="absolute inset-0 bg-amber-50" style={{
        backgroundImage: `url('/tiles.jpg')`,
        backgroundSize: '300px 300px',
        backgroundRepeat: 'repeat',
        opacity: 0.15
      }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className={`flex-1 z-10 ${directionClasses.textAlign}`}>
            {/* Main CTA content */}
            <div className={isRTL ? 'rtl' : ''}>
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-emerald-900 mb-4">
                <span className="block py-2">{locale === 'ar' ? 'أُستاذ' : t.hero.title}</span>
                {locale !== 'ar' && <span className="text-4xl md:text-5xl text-emerald-700 block py-2">أُستاذ</span>}
              </h1>

              <h2 className="text-xl md:text-2xl mb-6 text-amber-900 font-medium">
                {t.hero.subtitle}
              </h2>

              <p className="text-lg mb-8 text-slate-700 max-w-xl">
                {locale === 'ar'
                  ? "مدرس ذكي مدعوم بالذكاء الاصطناعي مخصص للطلاب المغاربة. يساعدك في فهم الدروس، حل الواجبات، والتحضير للامتحانات بلغتك المفضلة."
                  : locale === 'fr'
                    ? "Un tuteur intelligent alimenté par l'IA, conçu pour les étudiants marocains. Il vous aide à comprendre les leçons, résoudre les devoirs et préparer les examens dans votre langue préférée."
                    : "An AI-powered smart tutor designed specifically for Moroccan students. It helps you understand lessons, solve homework, and prepare for exams in your preferred language."}
              </p>

              {/* CTAs */}
              <div className={`flex flex-wrap gap-4 ${directionClasses.flexDir}`}>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push(`${locale}/register`)}>
                  {t.hero.cta} <ArrowRight className={`h-4 w-4 ${directionClasses.arrowDir}`} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  {t.hero.watchDemo}
                </Button>
              </div>

              <div className={`mt-6 flex items-center text-sm text-slate-600 ${directionClasses.flexDir}`}>
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
            {/* UI mockup */}
            <div className="relative w-full max-w-md mx-auto aspect-[3/2] rounded-lg shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/90 to-blue-500/80 rounded-lg">
                <div className="absolute inset-0.5 bg-white/95 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="flex space-x-1">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto text-xs font-medium text-slate-500">Ustadh AI Tutor</div>
                  </div>

                  {/* Chat interface */}
                  <div className="h-48 bg-slate-50 rounded p-3 mb-3 overflow-hidden">
                    <div className="flex gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">U</div>
                      <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg rounded-tl-none text-sm max-w-[80%] shadow-sm">
                        <p className="mb-1">{locale === 'ar' ? 'مرحبا! أنا أستاذك الشخصي. كيف يمكنني مساعدتك اليوم؟' :
                          locale === 'fr' ? 'Bonjour! Je suis votre tuteur personnel. Comment puis-je vous aider aujourd\'hui?' :
                          'Hello! I\'m your personal tutor. How can I help you today?'}</p>
                        <p className="text-xs text-emerald-600 text-right">09:41</p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mb-2">
                      <div className="bg-blue-100 text-blue-800 p-2 rounded-lg rounded-tr-none text-sm max-w-[80%] shadow-sm">
                        <p className="mb-1">{locale === 'ar' ? 'أحتاج مساعدة في حل مسألة رياضية عن المعادلات التفاضلية' :
                          locale === 'fr' ? 'J\'ai besoin d\'aide pour résoudre un problème de mathématiques sur les équations différentielles' :
                          'I need help solving a math problem about differential equations'}</p>
                        <p className="text-xs text-blue-600 text-right">09:42</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">S</div>
                    </div>

                    <div className="flex gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">U</div>
                      <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg rounded-tl-none text-sm max-w-[80%] animate-pulse">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                          <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                          <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex gap-2 items-center">
                    <div className="flex space-x-2">
                      <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 cursor-pointer transition-colors shadow-sm">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white hover:bg-amber-600 cursor-pointer transition-colors shadow-sm">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 cursor-pointer transition-colors shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 ml-2">
                      <div className="h-10 flex items-center px-4 bg-slate-100 text-sm text-slate-400 rounded-full hover:bg-slate-200 cursor-text transition-colors border border-transparent hover:border-slate-300">
                        {locale === 'ar' ? 'اكتب سؤالك هنا...' :
                         locale === 'fr' ? 'Écrivez votre question ici...' :
                         'Type your question here...'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features section
const FeaturesSection = () => {
  const locale = useLocale();
  const t = translations[locale] || translations.en;

  return (
    <section className="py-16 bg-white" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t.features.title}</h2>
        </div>

        <Tabs defaultValue="personalized" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-12">
            <TabsTrigger value="personalized" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
              <BookOpen className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'مخصص' : locale === 'fr' ? 'Personnalisé' : 'Personalized'}
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
              <GraduationCap className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'المنهج' : locale === 'fr' ? 'Programme' : 'Curriculum'}
            </TabsTrigger>
            <TabsTrigger value="practice" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {locale === 'ar' ? 'تدريب' : locale === 'fr' ? 'Pratique' : 'Practice'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalized" className="mt-0">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {locale === 'ar' ? 'ذكاء اصطناعي يفهمك' :
                  locale === 'fr' ? 'Une IA qui vous comprend' :
                    'AI that understands you'}
              </h3>
              <p>Content goes here based on language</p>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="mt-0">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {locale === 'ar' ? 'متوافق مع التعليم المغربي' :
                  locale === 'fr' ? 'Aligné avec l\'éducation marocaine' :
                    'Aligned with Moroccan education'}
              </h3>
              <p>Content goes here based on language</p>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="mt-0">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {locale === 'ar' ? 'التمرين يصنع الإتقان' :
                  locale === 'fr' ? 'La pratique mène à la perfection' :
                    'Practice makes perfect'}
              </h3>
              <p>Content goes here based on language</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

// App download section with language-specific app store badges
const AppDownloadSection = () => {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Translation object for app download section
  const appTranslations = {
    ar: {
      title: "حمّل تطبيق أستاذ",
      subtitle: "متوفر على الهاتف المحمول وأجهزة الكمبيوتر",
      description: "لا تفوّت فرصة الدراسة أينما كنت. قم بتنزيل تطبيق أستاذ على أي جهاز واستمتع بتجربة تعليمية كاملة بدون إنترنت.",
      getItOn: "متوفر على",
      forDesktop: "للكمبيوتر",
      desktop: "الكمبيوتر",
      features: {
        offline: "استخدم بدون إنترنت",
        sync: "مزامنة عبر جميع أجهزتك",
        notifications: "تذكيرات وإشعارات مخصصة"
      }
    },
    fr: {
      title: "Téléchargez l'application Ustadh",
      subtitle: "Disponible sur mobile et ordinateur",
      description: "Ne manquez pas l'occasion d'étudier où que vous soyez. Téléchargez l'application Ustadh sur n'importe quel appareil et profitez d'une expérience d'apprentissage complète, même hors ligne.",
      getItOn: "Disponible sur",
      forDesktop: "Pour ordinateur",
      desktop: "Ordinateur",
      features: {
        offline: "Utilisez sans internet",
        sync: "Synchronisez sur tous vos appareils",
        notifications: "Rappels et notifications personnalisés"
      }
    },
    en: {
      title: "Download the Ustadh App",
      subtitle: "Available on mobile and desktop",
      description: "Don't miss the opportunity to study wherever you are. Download the Ustadh app on any device and enjoy a complete learning experience even offline.",
      getItOn: "GET IT ON",
      forDesktop: "For Desktop",
      desktop: "Desktop",
      features: {
        offline: "Use without internet",
        sync: "Sync across all your devices",
        notifications: "Custom reminders and notifications"
      }
    }
  };

  //@ts-ignore
  const t = appTranslations[locale as any] || appTranslations.en;

  // Get appropriate app store badge paths based on language
  const getAppStoreBadgePath = () => {
    switch (locale) {
      case 'ar':
        return `/app-store/AR/white/SVG/Download_on_the_App_Store_Badge_AR_RGB_wht_102417.svg`;
      case 'fr':
        return `/app-store/FR/black/SVG/Download_on_the_App_Store_Badge_FR_RGB_blk_100517.svg`;
      default: // English
        return `/app-store/US/white/SVG/Download_on_the_App_Store_Badge_US-UK_RGB_wht_092917.svg`;
    }
  };

  // Get Google Play badge path (ideally would also have localized versions)
  const getGooglePlayBadgePath = () => {
    switch (locale) {
      case 'ar':
        return `/google-play-arabic.png`;
      case 'fr':
        return `/google-play-french.png`;
      default: // English
        return `/google-play-english.png`;
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-amber-50 to-amber-100" id="app">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t.title}</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8 max-w-6xl mx-auto">
          <div className={`w-full md:w-1/2 ${isRTL ? 'md:order-2' : ''}`}>
            <div className="relative max-w-sm mx-auto">
              {/* Phone mockup */}
              <div className="relative z-10 border-8 border-black rounded-[3rem] overflow-hidden shadow-xl">
                <div className="aspect-[9/16] bg-white relative">
                  {/* Notch */}
                  <div className="absolute top-0 inset-x-0 h-6 w-1/2 mx-auto bg-black rounded-b-xl"></div>

                  {/* Screen content - would be replaced with actual app screenshot */}
                  <div className="bg-emerald-50 h-full p-4">
                    <div className="h-12 bg-emerald-600 rounded-t-lg flex items-center px-4">
                      <div className="text-white font-bold">Ustadh</div>
                    </div>
                    <div className="bg-white h-[calc(100%-3rem)] rounded-b-lg flex flex-col p-3 shadow-sm">
                      <div className="h-20 bg-emerald-100 rounded mb-2 flex items-center justify-center">
                        <span className="text-emerald-800 font-medium">
                          {locale === 'ar' ? 'أستاذ - مدرسك الشخصي' :
                            locale === 'fr' ? 'Ustadh - Votre tuteur personnel' :
                              'Ustadh - Your personal tutor'}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-16 bg-slate-100 rounded flex items-center px-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-200 mr-3"></div>
                            <div className="flex-1">
                              <div className="h-3 w-24 bg-slate-300 rounded mb-2"></div>
                              <div className="h-3 w-32 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-1/4 -left-8 h-32 w-32 bg-emerald-300 rounded-full opacity-30 blur-xl"></div>
              <div className="absolute bottom-1/3 -right-8 h-24 w-24 bg-amber-300 rounded-full opacity-30 blur-xl"></div>
            </div>
          </div>

          <div className={`w-full md:w-1/2 ${isRTL ? 'text-right md:order-1' : ''}`}>
            <div className="max-w-lg">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {locale === 'ar' ? 'استمر في التعلم أينما كنت' :
                  locale === 'fr' ? 'Continuez à apprendre où que vous soyez' :
                    'Continue learning wherever you are'}
              </h3>
              <p className="text-slate-600 mb-8">{t.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* App Store button with proper language badge */}
                <a href="#" className={`h-14 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={getAppStoreBadgePath()}
                    alt={`Download on the App Store - ${locale}`}
                    className="h-full"
                  />
                </a>

                {/* Google Play button */}
                <a href="#" className={`h-14 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={getGooglePlayBadgePath()}
                    alt={`Get it on Google Play - ${locale}`}
                    className="h-full"
                  />
                </a>

                {/* Desktop button */}
                <a href="#" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} bg-emerald-600 text-white rounded-xl px-4 py-3 transition hover:bg-emerald-700 h-14`}>
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

              {/* Features */}
              <div className="space-y-4">
                {Object.entries(t.features).map(([key, value]): any => (
                  <div key={key} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <svg className={`h-5 w-5 text-emerald-500 ${isRTL ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {/* @ts-ignore */}
                    <span className="text-slate-700">{value}</span>
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

// Payment methods section optimized for Moroccan users
const PaymentSection = () => {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Translation object for payment section
  const paymentTranslations = {
    ar: {
      title: "طرق دفع متعددة",
      subtitle: "نقدم طرق دفع متنوعة لتناسب احتياجاتك",
      primaryMethods: "طرق الدفع الأساسية",
      secondaryMethods: "طرق دفع أخرى",
      secure: "دفع آمن ومضمون 100%",
      subscription: "إلغاء الاشتراك في أي وقت",
      support: "دعم على مدار الساعة",
      methods: {
        cmi: "البطاقة البنكية",
        cashPlus: "كاش بلوس",
        wafacash: "وفاكاش",
        chaabi: "شعبي كاش",
        barid: "بريد كاش",
        orange: "أورانج موني",
        inwi: "إنوي موني",
        iam: "اتصالات المغرب",
        bank: "تحويل بنكي",
        paypal: "باي بال"
      }
    },
    fr: {
      title: "Méthodes de Paiement",
      subtitle: "Nous offrons des méthodes de paiement variées pour répondre à vos besoins",
      primaryMethods: "Méthodes principales",
      secondaryMethods: "Autres méthodes",
      secure: "Paiement 100% sécurisé",
      subscription: "Annulez votre abonnement à tout moment",
      support: "Support 24/7",
      methods: {
        cmi: "Carte Bancaire",
        cashPlus: "Cash Plus",
        wafacash: "Wafacash",
        chaabi: "Chaabi Cash",
        barid: "Barid Cash",
        orange: "Orange Money",
        inwi: "Inwi Money",
        iam: "IAM Money",
        bank: "Virement Bancaire",
        paypal: "PayPal"
      }
    },
    en: {
      title: "Payment Methods",
      subtitle: "We offer diverse payment methods to suit your needs",
      primaryMethods: "Primary Methods",
      secondaryMethods: "Other Methods",
      secure: "100% Secure Payments",
      subscription: "Cancel subscription anytime",
      support: "24/7 Support",
      methods: {
        cmi: "Credit Card",
        cashPlus: "Cash Plus",
        wafacash: "Wafacash",
        chaabi: "Chaabi Cash",
        barid: "Barid Cash",
        orange: "Orange Money",
        inwi: "Inwi Money",
        iam: "IAM Money",
        bank: "Bank Transfer",
        paypal: "PayPal"
      }
    }
  };

  //@ts-ignore
  const t = paymentTranslations[locale] || paymentTranslations.en;

  // Primary payment methods available in Morocco
  const primaryMethods = [
    {
      id: 'cmi',
      name: t.methods.cmi,
      logo: '/cmi-logo.png',
      placeholder: <div className="h-10 w-16 bg-gradient-to-r from-blue-500 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">CMI</div>
    },
    {
      id: 'cashplus',
      name: t.methods.cashPlus,
      logo: '/cashplus-logo.svg',
      placeholder: <div className="h-10 w-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded flex items-center justify-center text-white text-xs font-bold">CASH+</div>
    },
    {
      id: 'wafacash',
      name: t.methods.wafacash,
      logo: '/wafacash-logo.png',
      placeholder: <div className="h-10 w-16 bg-gradient-to-r from-red-500 to-red-600 rounded flex items-center justify-center text-white text-xs font-bold">WAFA</div>
    },
    {
      id: 'chaabi',
      name: t.methods.chaabi,
      logo: '/chaabi-logo.svg',
      placeholder: <div className="h-10 w-16 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center text-white text-xs font-bold">CHAABI</div>
    }
  ];

  // Secondary payment methods
  const secondaryMethods = [
    {
      id: 'barid',
      name: t.methods.barid,
      logo: '/albarid-logo.png',
      placeholder: <div className="h-8 w-14 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">BARID</div>
    },
    {
      id: 'orange',
      name: t.methods.orange,
      logo: '/orange-logo.png',
      placeholder: <div className="h-8 w-14 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">ORANGE</div>
    },
    {
      id: 'inwi',
      name: t.methods.inwi,
      logo: '/inwi-logo.png',
      placeholder: <div className="h-8 w-14 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">INWI</div>
    },
    {
      id: 'iam',
      name: t.methods.iam,
      logo: '/maroc-telecom-logo.png',
      placeholder: <div className="h-8 w-14 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">IAM</div>
    },
    {
      id: 'bank',
      name: t.methods.bank,
      logo: '/bank-transfer-logo.svg',
      placeholder: <div className="h-8 w-14 bg-slate-600 rounded flex items-center justify-center text-white text-xs font-bold">BANK</div>
    },
    {
      id: 'paypal',
      name: t.methods.paypal,
      logo: '/paypal-logo.png',
      placeholder: <div className="h-8 w-14 bg-indigo-500 rounded flex items-center justify-center text-white text-xs font-bold">PAYPAL</div>
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100" id="payment">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{t.title}</h2>
          <p className="text-lg text-slate-600">{t.subtitle}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Primary payment methods */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className={`text-xl font-semibold mb-6 ${isRTL ? 'text-right' : ''}`}>{t.primaryMethods}</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {primaryMethods.map((method) => (
                <div key={method.id} className="flex flex-col items-center p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition">
                  {/* Use actual logo or placeholder */}
                  {method.logo ? (
                    <img
                      src={method.logo}
                      alt={method.name}
                      className="h-10 w-auto object-contain"
                    />
                  ) : method.placeholder}
                  <p className="mt-3 text-center text-sm font-medium">{method.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary payment methods */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className={`text-xl font-semibold mb-6 ${isRTL ? 'text-right' : ''}`}>{t.secondaryMethods}</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {secondaryMethods.map((method) => (
                <div key={method.id} className="flex flex-col items-center p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition">
                  {method.logo ? (
                    <img
                      src={method.logo}
                      alt={method.name}
                      className="h-10 w-auto object-contain"
                    />
                  ) : method.placeholder}
                  <p className="mt-3 text-center text-sm font-medium">{method.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="bg-emerald-50 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{t.secure}</span>
              </div>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{t.subscription}</span>
              </div>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{t.support}</span>
              </div>
            </div>
          </div>

          {/* Payment step visualization */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col items-center mb-4 md:mb-0 px-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold mb-2">1</div>
                <p className="text-center text-sm">
                  {locale === 'ar' ? 'اختر خطة' :
                    locale === 'fr' ? 'Choisissez un plan' :
                      'Choose a plan'}
                </p>
              </div>

              <div className="hidden md:block h-0.5 w-12 bg-emerald-200"></div>

              <div className="flex flex-col items-center mb-4 md:mb-0 px-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold mb-2">2</div>
                <p className="text-center text-sm">
                  {locale === 'ar' ? 'اختر طريقة الدفع' :
                    locale === 'fr' ? 'Sélectionnez le paiement' :
                      'Select payment'}
                </p>
              </div>

              <div className="hidden md:block h-0.5 w-12 bg-emerald-200"></div>

              <div className="flex flex-col items-center mb-4 md:mb-0 px-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold mb-2">3</div>
                <p className="text-center text-sm">
                  {locale === 'ar' ? 'أكمل الدفع' :
                    locale === 'fr' ? 'Complétez le paiement' :
                      'Complete payment'}
                </p>
              </div>

              <div className="hidden md:block h-0.5 w-12 bg-emerald-200"></div>

              <div className="flex flex-col items-center px-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold mb-2">4</div>
                <p className="text-center text-sm">
                  {locale === 'ar' ? 'استمتع بالخدمة' :
                    locale === 'fr' ? 'Profitez du service' :
                      'Enjoy the service'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = translations[locale] || translations.en;

  return (
    <section className="py-12 bg-emerald-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          {t.cta.title}
        </h2>
        <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50" onClick={() => router.push(`${locale}/register`)}>
          {t.cta.button}
        </Button>
      </div>
    </section>
  );
};

// Footer component with language support
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
      subscribeText: "اشترك للحصول على آخر التحديثات والموارد التعليمية",
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
      subscribeText: "Abonnez-vous pour recevoir les dernières mises à jour et ressources éducatives",
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
      subscribeText: "Subscribe to get the latest updates and educational resources",
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
    <footer className={`bg-slate-900 text-slate-300 pt-12 pb-6 ${isRTL ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="container mx-auto px-4">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Logo and company info */}
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-emerald-600 text-white h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold mr-2">
                U
              </div>
              <h2 className="text-white text-xl font-bold">
                <span className="mr-1">أُستاذ</span>
                <span className="text-emerald-400">Ustadh</span>
              </h2>
            </div>

            <p className="text-slate-400 mb-4">
              {locale === 'ar'
                ? "منصة تعليمية مدعومة بالذكاء الاصطناعي مصممة خصيصًا للطلاب المغاربة"
                : locale === 'fr'
                  ? "Plateforme éducative alimentée par l'IA, conçue spécifiquement pour les étudiants marocains"
                  : "AI-powered educational platform designed specifically for Moroccan students"}
            </p>

            <div className="mb-4">
              <h3 className="text-white text-sm font-semibold mb-2">{t.addressTitle}</h3>
              <address className="text-slate-400 text-sm not-italic">
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
                <h3 className="text-white font-semibold mb-4">{t.company}</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.about}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.careers}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.press}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.blog}</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4">{t.resources}</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.helpCenter}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.tutorials}</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition">{t.faq}</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-white font-semibold mb-4">{t.legal}</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition">{t.privacyPolicy}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">{t.termsOfService}</a></li>
              </ul>
            </div>
          </div>

          {/* Column 3: Subjects */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.subjects}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">{t.math}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">{t.physics}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">{t.chemistry}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">{t.biology}</a>
              </div>
              <div>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">{t.languages}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">{t.humanities}</a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">
                  {locale === 'ar' ? 'المعلوميات' : locale === 'fr' ? 'Informatique' : 'Computer Science'}
                </a>
                <a href="#" className="block mb-2 hover:text-emerald-400 transition">
                  {locale === 'ar' ? 'العلوم الإسلامية' : locale === 'fr' ? 'Études Islamiques' : 'Islamic Studies'}
                </a>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-white font-semibold mb-4">{t.contact}</h3>
              <a href="mailto:contact@ustadh.ma" className="flex items-center hover:text-emerald-400 transition">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@ustadh.ma
              </a>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t.newsletter}</h3>
            <p className="text-slate-400 mb-4">{t.subscribeText}</p>

            <form className="mb-6">
              <div className="flex rounded-md overflow-hidden">
                <input
                  type="email"
                  placeholder={t.email}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white focus:outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-2 transition text-sm"
                >
                  {t.subscribe}
                </button>
              </div>
            </form>

            <h3 className="text-white font-semibold mb-4">{t.social}</h3>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.057 10.057 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-slate-500 mb-4 sm:mb-0">
            &copy; {currentYear} Ustadh. {t.copyright}
          </div>

          <div className="flex space-x-4 rtl:space-x-reverse">
            <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition">{t.privacyPolicy}</a>
            <a href="#" className="text-sm text-slate-500 hover:text-emerald-400 transition">{t.termsOfService}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main component
export default function Home() {
  const locale = useLocale();

  // Auto-detect user's language
  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  // Font setup
  useEffect(() => {
    // Add global styles for fonts
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --font-arabic: 'El Messiri', sans-serif;
        --font-latin: 'Poppins', system-ui, sans-serif;
      }

      html[dir="rtl"] h1, html[dir="rtl"] h2, html[dir="rtl"] h3,
      html[dir="rtl"] .font-serif {
        font-family: var(--font-arabic);
      }

      html[dir="ltr"] h1, html[dir="ltr"] h2, html[dir="ltr"] h3,
      html[dir="ltr"] .font-serif {
        font-family: var(--font-latin);
      }
    `;
    document.head.appendChild(style);

    // Also import Poppins for Latin text
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(style);
      if (document.head.contains(link)) {
        document.head.removeChild(link);
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
        <link href="https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main>
        <Header />
        <HeroSection />
        <FeaturesSection />
        <PaymentSection />
        <AppDownloadSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
