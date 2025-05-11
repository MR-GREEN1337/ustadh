"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Bot,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  FileText,
  PenTool,
  Compass,
  Rocket,
  Layers,
  Beaker,
  UsersRound,
  GraduationCap,
  Sigma,
  LucideIcon,
  Star,
  Wand2,
  Orbit,
  Telescope,
  Zap,
  WandSparklesIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

// Types
interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  comingSoon?: boolean;
  path: string;
  image: string;
}

interface SuggestionPrompt {
  id: number;
  prompt: string;
  category: string;
}

interface RecentAIInteraction {
  id: string;
  title: string;
  date: string;
  type: string;
  preview: string;
}

const ProfessorAIPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const isRTL = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  // AI Features
  const aiFeatures: AIFeature[] = [
    {
      id: 'assistant',
      name: t('aiAssistant') || 'AI Teaching Assistant',
      description: t('aiAssistantDesc') || 'Your personal AI assistant to help with course planning, student questions, and pedagogical techniques.',
      icon: Bot,
      color: 'from-purple-500 to-indigo-600',
      path: `/${locale}/dashboard/professor/ai/assistant`,
      image: 'https://images.pexels.com/photos/7092613/pexels-photo-7092613.jpeg',
    },
    {
      id: 'student-insights',
      name: t('studentInsights') || 'Student Insights',
      description: t('studentInsightsDesc') || 'AI-powered analytics to understand student performance patterns and personalize your teaching approach.',
      icon: BrainCircuit,
      color: 'from-blue-500 to-cyan-600',
      path: `/${locale}/dashboard/professor/ai/student-insights`,
      image: 'https://images.pexels.com/photos/17483910/pexels-photo-17483910/free-photo-of-an-artist-s-illustration-of-artificial-intelligence-ai-this-image-represents-the-concept-of-artificial-general-intelligence-agi-it-was-created-by-artist-domhnall-malone-as-part-of-th.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
  ];

  // Teaching Prompts
  const teachingPrompts: SuggestionPrompt[] = [
    {
      id: 1,
      prompt: 'Help me create a lesson plan for teaching the Pythagorean theorem to 9th graders',
      category: 'Mathematics'
    },
    {
      id: 2,
      prompt: 'Generate a rubric for evaluating student essays on comparative literature',
      category: 'Language Arts'
    },
    {
      id: 3,
      prompt: 'How can I incorporate more active learning strategies in my physics classes?',
      category: 'Pedagogy'
    },
    {
      id: 4,
      prompt: 'Create a differentiated learning activity for teaching cell biology to mixed-ability students',
      category: 'Biology'
    }
  ];

  // Recent AI Interactions
  const recentAIInteractions: RecentAIInteraction[] = [
    {
      id: '1',
      title: 'History Final Exam Creation',
      date: '2 hours ago',
      type: 'assignment',
      preview: 'Generated a comprehensive final exam with short answer, essay and multiple choice sections...'
    },
    {
      id: '2',
      title: 'Advanced Chemistry Course Structure',
      date: 'Yesterday',
      type: 'course',
      preview: 'Complete 16-week course plan with lab activities and assessment structure...'
    },
    {
      id: '3',
      title: 'Teaching Strategies for Linguistic Concepts',
      date: '3 days ago',
      type: 'assistant',
      preview: 'Discussed methods for teaching complex grammatical structures to second language learners...'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/dashboard/professor/ai/assistant?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const startAIFeature = (feature: AIFeature) => {
    if (feature.comingSoon) {
      toast({
        title: "Coming Soon",
        description: `${feature.name} will be available in the near future.`,
        variant: "default"
      });
    } else {
      router.push(feature.path);
    }
  };

  const handlePromptClick = (prompt: SuggestionPrompt) => {
    router.push(`/${locale}/dashboard/professor/ai/assistant?query=${encodeURIComponent(prompt.prompt)}`);
  };

  return (
    <div className={`space-y-10 max-w-5xl mx-auto px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-900 p-8 md:p-12">
        {/* Background animated stars */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="stars-small"></div>
          <div className="stars-medium"></div>
          <div className="stars-large"></div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
            {t('aiTeachingHub') || 'AI Teaching Hub'}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl">
            {t('aiTeachingHubDesc') || 'Harness the power of artificial intelligence to transform your teaching, create compelling content, and deliver personalized education at scale.'}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Input
              type="text"
              placeholder={t('askAnything') || "Ask anything about teaching, courses, or pedagogical strategies..."}
              className="pr-20 py-6 bg-white/10 border-white/20 text-white placeholder:text-blue-200/80 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              className="absolute right-0 top-0 bottom-0 h-full bg-white/20 hover:bg-white/30 text-white"
              type="submit"
            >
              <BrainCircuit className="w-5 h-5 mr-2" />
              {t('ask') || 'Ask'}
            </Button>
          </form>
        </div>

        {/* Decorative cosmic elements */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-violet-600/30 blur-3xl"></div>
        <div className="absolute top-12 -right-16 w-32 h-32 rounded-full bg-indigo-500/20 blur-xl"></div>
        <div className="absolute -bottom-8 left-20 w-24 h-24 rounded-full bg-purple-500/30 blur-xl"></div>
      </div>

      {/* Main AI Features */}
      <section className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-2xl font-medium">{t('chooseAITool') || 'Choose your AI teaching tool'}</h2>
          <Wand2 className="h-6 w-6 text-primary" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiFeatures.map((feature) => (
            <motion.div
              key={feature.id}
              whileHover={{ y: -5 }}
              whileTap={{ y: 0 }}
            >
              <Card
                className="overflow-hidden border cursor-pointer h-full hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                onClick={() => startAIFeature(feature)}
              >
                <div className="aspect-[5/2] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                  <div className="absolute bottom-3 left-3 z-20">
                    <Badge
                      variant={feature.comingSoon ? "outline" : "default"}
                      className={`${feature.comingSoon ? 'bg-black/50 text-white' : ''}`}
                    >
                      {feature.comingSoon ? t('comingSoon') || 'Coming Soon' : t('available') || 'Available Now'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 z-20">
                    <div className={`rounded-full p-2 bg-gradient-to-br ${feature.color}`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <Image
                    src={feature.image}
                    alt={feature.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Button
                    variant={feature.comingSoon ? "outline" : "default"}
                    disabled={feature.comingSoon}
                    className="w-full"
                  >
                    {feature.comingSoon ? (
                      <Star className="mr-2 h-4 w-4" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {feature.comingSoon
                      ? t('notifyMe') || 'Notify Me When Available'
                      : t('startUsing') || 'Start Using'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent AI Interactions */}
      <section className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-2xl font-medium">{t('recentInteractions') || 'Continue your work'}</h2>
          <Link href={`/${locale}/dashboard/professor/ai/history`}>
            <Button variant="ghost">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('viewAll') || 'View All'}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentAIInteractions.map((interaction) => (
            <Card
              key={interaction.id}
              className="hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/30"
              onClick={() => {
                if (interaction.type === 'assignment') {
                  router.push(`/${locale}/dashboard/professor/ai/assignment-generator?id=${interaction.id}`);
                } else if (interaction.type === 'course') {
                  router.push(`/${locale}/dashboard/professor/ai/course-generator?id=${interaction.id}`);
                } else {
                  router.push(`/${locale}/dashboard/professor/ai/assistant?id=${interaction.id}`);
                }
              }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">
                    {interaction.type === 'assistant' && <Bot className="h-3 w-3 mr-1 inline" />}
                    {interaction.type === 'course' && <GraduationCap className="h-3 w-3 mr-1 inline" />}
                    {interaction.type === 'assignment' && <FileText className="h-3 w-3 mr-1 inline" />}
                    {interaction.type === 'assistant' && (t('assistant') || 'Assistant')}
                    {interaction.type === 'course' && (t('course') || 'Course')}
                    {interaction.type === 'assignment' && (t('assignment') || 'Assignment')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{interaction.date}</span>
                </div>
                <h3 className="font-medium line-clamp-1">{interaction.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{interaction.preview}</p>
                <div className="text-xs text-primary flex items-center">
                  <PenTool className="h-3 w-3 mr-1" />
                  {t('continue') || 'Continue'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Teaching Prompt Suggestions */}
      <section className="space-y-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Lightbulb className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-amber-500`} />
          <h2 className="text-2xl font-medium">{t('teachingPrompts') || 'Teaching prompts to try'}</h2>
        </div>

        <div className="space-y-3">
          {teachingPrompts.map((prompt, idx) => (
            <Card
              key={prompt.id}
              className="border hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all duration-300 cursor-pointer"
              onClick={() => handlePromptClick(prompt)}
            >
              <CardContent className={`p-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-amber-500 font-light">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{prompt.prompt}</p>
                    <p className="text-xs text-muted-foreground">{prompt.category}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400">
                  <Telescope className="h-4 w-4 mr-1" />
                  {t('try') || 'Try This'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Educational AI Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">{t('aiTeachingFeatures') || 'AI-Powered Teaching Features'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-0">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <UsersRound className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium">{t('personalizedLearning') || 'Personalized Learning'}</h3>
              <p className="text-sm">{t('personalizedDesc') || 'Create adaptive learning pathways for each student based on their progress, learning style, and academic goals.'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-0">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium">{t('contentGeneration') || 'Content Generation'}</h3>
              <p className="text-sm">{t('contentDesc') || 'Quickly create engaging educational materials, from lecture notes to interactive quizzes and multimedia resources.'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-0">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sigma className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium">{t('automatedAssessment') || 'Automated Assessment'}</h3>
              <p className="text-sm">{t('assessmentDesc') || 'Save time with AI-powered grading, feedback generation, and performance analytics to identify learning gaps.'}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Discovery Prompt */}
      <Card className="border-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
        <CardContent className="p-8 relative">
          {/* Animated stars in background */}
          <div className="absolute inset-0 overflow-hidden opacity-30">
            <div className="stars-small"></div>
            <div className="stars-medium"></div>
          </div>

          <div className={`relative z-10 flex flex-col md:flex-row gap-8 items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <h3 className="text-2xl font-medium mb-4">{t('transformTeaching') || 'Transform Your Teaching with AI'}</h3>
              <p className="text-white/80 mb-6">
                {t('transformDesc') || 'Join thousands of educators who are revolutionizing their teaching methods and saving countless hours of prep time with our AI-powered platform.'}
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => router.push(`/${locale}/dashboard/professor/ai/assistant`)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/10"
                >
                  <Compass className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-pulse`} />
                  {t('startCreating') || 'Start Creating'}
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0 relative w-32 h-32 md:w-48 md:h-48 opacity-80">
              <div className="cosmic-sphere"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS for cosmic effects */}
      <style jsx global>{`
        .stars-small {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(4px 4px at 400px 400px, white, rgba(0,0,0,0)),
                            radial-gradient(3px 3px at 500px 500px, white, rgba(0,0,0,0)),
                            radial-gradient(3px 3px at 600px 800px, white, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 1000px 1000px;
          animation: twinkle 6s ease-in-out 2s infinite;
        }

        @keyframes twinkle {
          0% { opacity: 0.7; }
          50% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }

        .cosmic-sphere {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 40%,
            rgba(255, 255, 255, 0.8),
            rgba(113, 88, 255, 0.8) 30%,
            rgba(45, 58, 196, 0.6) 60%,
            rgba(9, 15, 71, 0.4) 80%);
          box-shadow: 0 0 30px rgba(145, 125, 255, 0.5);
          animation: rotate 30s linear infinite, pulse 10s ease-in-out infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 30px rgba(145, 125, 255, 0.5); }
          50% { box-shadow: 0 0 50px rgba(145, 125, 255, 0.8); }
          100% { box-shadow: 0 0 30px rgba(145, 125, 255, 0.5); }
        }
      `}</style>
    </div>
  );
};

export default ProfessorAIPage;
