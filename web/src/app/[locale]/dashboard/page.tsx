"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Sparkles,
  Star,
  Brain,
  Globe,
  ArrowRight,
  PenTool,
  MessageCircle,
  MousePointer,
  TrendingUp,
  FileText,
  BookMarked,
  Eye,
  Lightbulb
} from 'lucide-react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/AuthProvider';
import { ExploreSearch } from './_components/ExploreSearch';

// Static data for different languages
const localizedData = {
  en: {
    quotes: [
      {
        text: "Learning leads to knowledge, and knowledge leads to understanding",
        translation: "",
        source: "Ibn Khaldun"
      },
      {
        text: "Knowledge comes only through learning, and wisdom through practice",
        translation: "",
        source: "Arabic wisdom"
      },
      {
        text: "The universe is too vast to be contained in books",
        translation: "",
        source: "Modern Arabic saying"
      }
    ],
    recentExplorations: [
      {
        id: 1,
        topic: "Thales' Theorem and its applications",
        description: "An exploration of projective geometry",
        category: "Mathematics",
        lastViewed: "Today"
      },
      {
        id: 2,
        topic: "Al-Mutanabbi's poem 'على قَدْرِ أهْلِ العَزْمِ'",
        description: "Analysis of meanings and rhetoric",
        category: "Arabic Literature",
        lastViewed: "Yesterday"
      },
      {
        id: 3,
        topic: "Ordinary differential equations",
        description: "Applications in physics",
        category: "Physics",
        lastViewed: "3 days ago"
      }
    ],
    thoughtProvokingQuestions: [
      "How did the Marinid dynasty influence Moroccan architecture?",
      "Why does the Fibonacci sequence appear so frequently in nature?",
      "Do Andalusian poetry and modern Moroccan poetry share common themes?",
      "How do the principles of organic chemistry apply to traditional Moroccan medicine?"
    ],
    horizons: [
      {
        title: "Complex numbers",
        description: "Understanding practical applications of imaginary numbers in engineering and quantum physics.",
        connects: ["mathematics", "physics"]
      },
      {
        title: "The Andalusian Golden Age",
        description: "The influence of the Andalusian period on Moroccan culture, science, and architecture.",
        connects: ["history", "literature"]
      }
    ],
    tools: [
      {
        title: "AI Assistant",
        description: "Ask questions, explore ideas"
      },
      {
        title: "Whiteboard",
        description: "Write, draw and receive feedback",
        isNew: true
      },
      {
        title: "Augmented Notes",
        description: "AI-enhanced note taking"
      }
    ],
    deepDive: {
      title: "Dive into deep exploration",
      description: "Our AI can guide you through a complex topic of your choice, creating a personalized and interconnected learning journey."
    }
  },
  fr: {
    quotes: [
      {
        text: "L'apprentissage mène à la connaissance, et la connaissance mène à la compréhension",
        translation: "",
        source: "Ibn Khaldun"
      },
      {
        text: "La connaissance ne vient que par l'apprentissage, et la sagesse par la pratique",
        translation: "",
        source: "Sagesse arabe"
      },
      {
        text: "L'univers est trop vaste pour être contenu dans des livres",
        translation: "",
        source: "Dicton arabe moderne"
      }
    ],
    recentExplorations: [
      {
        id: 1,
        topic: "Théorème de Thalès et ses applications",
        description: "Une exploration de la géométrie projective",
        category: "Mathématiques",
        lastViewed: "Aujourd'hui"
      },
      {
        id: 2,
        topic: "Poème d'Al-Mutanabbi 'على قَدْرِ أهْلِ العَزْمِ'",
        description: "Analyse des significations et de la rhétorique",
        category: "Littérature Arabe",
        lastViewed: "Hier"
      },
      {
        id: 3,
        topic: "Les équations différentielles ordinaires",
        description: "Applications dans les sciences physiques",
        category: "Physique",
        lastViewed: "Il y a 3 jours"
      }
    ],
    thoughtProvokingQuestions: [
      "Comment la dynastie mérinide a-t-elle influencé l'architecture marocaine?",
      "Pourquoi la séquence de Fibonacci apparaît-elle si souvent dans la nature?",
      "Est-ce que la poésie andalouse et la poésie moderne marocaine partagent des thèmes communs?",
      "Comment les principes de la chimie organique s'appliquent-ils à la médecine traditionnelle marocaine?"
    ],
    horizons: [
      {
        title: "Les nombres complexes",
        description: "Comprendre les applications concrètes des nombres imaginaires dans l'ingénierie et la physique quantique.",
        connects: ["mathématiques", "physique"]
      },
      {
        title: "L'âge d'or andalou",
        description: "L'influence de la période andalouse sur la culture, la science et l'architecture marocaines.",
        connects: ["histoire", "littérature"]
      }
    ],
    tools: [
      {
        title: "Assistant IA",
        description: "Posez des questions, explorez des idées"
      },
      {
        title: "Tableau Blanc",
        description: "Écrivez, dessinez et recevez du feedback",
        isNew: true
      },
      {
        title: "Notes Augmentées",
        description: "Notes enrichies par l'IA"
      }
    ],
    deepDive: {
      title: "Plongez dans une exploration profonde",
      description: "Notre IA peut vous guider à travers un sujet complexe de votre choix, créant un parcours d'apprentissage personnalisé et interconnecté."
    }
  },
  ar: {
    quotes: [
      {
        text: "العلم يهدي إلى المعرفة، والمعرفة تقود إلى الفهم",
        translation: "",
        source: "ابن خلدون"
      },
      {
        text: "إنما العلم بالتعلم، وإنما الحلم بالتحلم",
        translation: "",
        source: "حكمة عربية"
      },
      {
        text: "الكون أوسع من أن تحده كتب",
        translation: "",
        source: "مقولة عربية حديثة"
      }
    ],
    recentExplorations: [
      {
        id: 1,
        topic: "نظرية طاليس وتطبيقاتها",
        description: "استكشاف الهندسة الإسقاطية",
        category: "الرياضيات",
        lastViewed: "اليوم"
      },
      {
        id: 2,
        topic: "قصيدة المتنبي «على قَدْرِ أهْلِ العَزْمِ»",
        description: "تحليل للمعاني والبلاغة",
        category: "الأدب العربي",
        lastViewed: "أمس"
      },
      {
        id: 3,
        topic: "المعادلات التفاضلية العادية",
        description: "تطبيقات في علوم الفيزياء",
        category: "الفيزياء",
        lastViewed: "منذ 3 أيام"
      }
    ],
    thoughtProvokingQuestions: [
      "كيف أثرت سلالة المرينيين على العمارة المغربية؟",
      "لماذا تظهر متوالية فيبوناتشي بشكل متكرر في الطبيعة؟",
      "هل تتشارك قصائد الأندلس والشعر المغربي الحديث موضوعات مشتركة؟",
      "كيف تطبق مبادئ الكيمياء العضوية في الطب التقليدي المغربي؟"
    ],
    horizons: [
      {
        title: "الأعداد المركبة",
        description: "فهم التطبيقات العملية للأعداد التخيلية في الهندسة والفيزياء الكمية.",
        connects: ["الرياضيات", "الفيزياء"]
      },
      {
        title: "العصر الذهبي الأندلسي",
        description: "تأثير الفترة الأندلسية على الثقافة والعلوم والعمارة المغربية.",
        connects: ["التاريخ", "الأدب"]
      }
    ],
    tools: [
      {
        title: "مساعد الذكاء الاصطناعي",
        description: "اطرح الأسئلة واستكشف الأفكار"
      },
      {
        title: "السبورة التفاعلية",
        description: "اكتب وارسم واحصل على ملاحظات",
        isNew: true
      },
      {
        title: "الملاحظات المعززة",
        description: "ملاحظات معززة بالذكاء الاصطناعي"
      }
    ],
    deepDive: {
      title: "خوض رحلة استكشاف عميقة",
      description: "يمكن لذكائنا الاصطناعي أن يرشدك عبر موضوع معقد من اختيارك، مع إنشاء مسار تعليمي شخصي ومترابط."
    }
  }
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const isRTL = locale === "ar";
  const router = useRouter();

  // Get the localized data based on the current locale
  const localeKey = (locale as string) in localizedData ? (locale as string) : 'en';
  const data = localizedData[localeKey as keyof typeof localizedData];

  // Current quote
  const quote = data.quotes[Math.floor(Math.random() * data.quotes.length)];

  return (
    <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Minimalist greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight">{t("hello") || "Hello"}, {user?.full_name?.split(' ')[0] || t("explorer") || 'Explorer'}</h1>
        <p className="text-muted-foreground text-sm">{t("whatDiscover") || "What would you like to discover today?"}</p>
      </div>

      {/* Inspirational quote */}
      <Card className="bg-black/5 border-0 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-xl font-light italic">{quote.text}</p>
            {quote.translation && <p className="text-sm text-muted-foreground">{quote.translation}</p>}
            <p className="text-xs text-muted-foreground">— {quote.source}</p>
          </div>
        </CardContent>
      </Card>

      {/* Search and explore section */}
      <ExploreSearch />

      {/* Continue your journey section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light">{t("continueJourney") || "Continue your journey"}</h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => {router.push(`/${locale}/dashboard/learn/subjects`)}}>
            {t("viewAll") || "View all"} {!isRTL && <ArrowRight className="h-3 w-3 ml-1" />}
            {isRTL && <ArrowRight className="h-3 w-3 mr-1" />}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.recentExplorations.map(item => (
            <Card key={item.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300 cursor-pointer">
              <CardContent className="p-5 space-y-3">
                <div className="text-xs text-muted-foreground">{item.category} • {item.lastViewed}</div>
                <h3 className="font-medium">{item.topic}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className={`flex items-center text-xs text-primary ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Eye className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {t("continue") || "Continue"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Expand your horizons section */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("expandHorizons") || "Expand your horizons"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6 space-y-3">
              <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="rounded-full p-2 bg-white/80 dark:bg-black/20">
                  <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => {router.push(`/${locale}/dashboard/learn/explore`)}}>
                  {t("explore") || "Explore"} {!isRTL && <ArrowRight className="h-3 w-3 ml-1" />}
                  {isRTL && <ArrowRight className="h-3 w-3 mr-1" />}
                </Button>
              </div>
              <h3 className="text-lg font-medium">{data.horizons[0].title}</h3>
              <p className="text-sm">{data.horizons[0].description}</p>
              <div className="text-xs text-muted-foreground">
                {t("connectsConcepts") || "Connects concepts of"}
                <span className="text-indigo-600 dark:text-indigo-400"> {data.horizons[0].connects[0]}</span> {t("and") || "and"}
                <span className="text-indigo-600 dark:text-indigo-400"> {data.horizons[0].connects[1]}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-6 space-y-3">
              <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="rounded-full p-2 bg-white/80 dark:bg-black/20">
                  <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => {router.push(`/${locale}/dashboard/learn/explore`)}}>
                  {t("explore") || "Explore"} {!isRTL && <ArrowRight className="h-3 w-3 ml-1" />}
                  {isRTL && <ArrowRight className="h-3 w-3 mr-1" />}
                </Button>
              </div>
              <h3 className="text-lg font-medium">{data.horizons[1].title}</h3>
              <p className="text-sm">{data.horizons[1].description}</p>
              <div className="text-xs text-muted-foreground">
                {t("connectsConcepts") || "Connects concepts of"}
                <span className="text-emerald-600 dark:text-emerald-400"> {data.horizons[1].connects[0]}</span> {t("and") || "and"}
                <span className="text-emerald-600 dark:text-emerald-400"> {data.horizons[1].connects[1]}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Questions that spark curiosity */}
      <div className="space-y-4">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Lightbulb className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-amber-500`} />
          <h2 className="text-xl font-light">{t("curiosityQuestions") || "Questions to spark your curiosity"}</h2>
        </div>
        <div className="space-y-3">
          {data.thoughtProvokingQuestions.map((question, idx) => (
            <Card key={idx} className="border hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all duration-300 cursor-pointer">
              <CardContent className={`p-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-amber-500 font-light">{idx + 1}</span>
                  <p className="text-sm">{question}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400">
                  {t("explore") || "Explore"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Interactive learning tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-light">{t("interactiveTools") || "Interactive learning tools"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.tools.map((tool, idx) => (
            <Card key={idx} className="border hover:border-primary/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              {tool.isNew && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-xs py-1 px-2 rounded-bl-lg">
                    {t("new") || "New"}
                  </div>
                </div>
              )}
              <CardContent className="p-5 flex flex-col items-center text-center space-y-4">
                <div className="rounded-full p-3 bg-primary/5">
                  {idx === 0 ? (
                    <MessageCircle className="h-6 w-6 text-primary" />
                  ) : idx === 1 ? (
                    <PenTool className="h-6 w-6 text-primary" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                </div>
                <Button variant="ghost" size="sm" className="mt-auto" onClick={() => {router.push(`/${locale}/dashboard/tutor/${idx === 0 ? 'chat' : idx === 1 ? 'whiteboard' : 'notes'}`)}}>
                  {idx === 0 ? (
                    t("chat") || "Chat"
                  ) : idx === 1 ? (
                    t("create") || "Create"
                  ) : (
                    t("open") || "Open"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deep dive prompt */}
      <Card className="border-0 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900/40 dark:to-zinc-900/20 overflow-hidden">
        <CardContent className="p-6">
          <div className={`flex flex-col md:flex-row gap-6 items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">{data.deepDive.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {data.deepDive.description}
              </p>
              <div className="flex gap-2">
                <Button className="group" onClick={() => {router.push(`/${locale}/dashboard/tutor/chat`)}}>
                  <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} group-hover:animate-pulse`} />
                  {t("startExploration") || "Start exploration"}
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0 hidden md:block opacity-80">
              <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="20" r="2" fill="currentColor" />
                <circle cx="35" cy="30" r="2" fill="currentColor" />
                <circle cx="65" cy="40" r="2" fill="currentColor" />
                <circle cx="40" cy="60" r="2" fill="currentColor" />
                <circle cx="70" cy="70" r="2" fill="currentColor" />
                <line x1="50" y1="20" x2="35" y2="30" stroke="currentColor" strokeWidth="0.5" />
                <line x1="35" y1="30" x2="65" y2="40" stroke="currentColor" strokeWidth="0.5" />
                <line x1="65" y1="40" x2="40" y2="60" stroke="currentColor" strokeWidth="0.5" />
                <line x1="40" y1="60" x2="70" y2="70" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
