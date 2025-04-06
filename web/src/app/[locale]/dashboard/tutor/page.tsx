"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare,
  PenTool,
  FileText,
  Video,
  History,
  Sparkles,
  Lightbulb,
  Brain,
  Star,
  BookOpen,
  LucideIcon,
  Bookmark,
  Telescope,
  Atom,
  Zap,
  Compass,
  Orbit,
  Rocket
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
interface TutorFeature {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  comingSoon?: boolean;
  path: string;
  image: string;
}

interface InsightQuestion {
  id: number;
  question: string;
  subject: string;
}

interface RecentSession {
  id: string;
  title: string;
  date: string;
  type: string;
  preview: string;
}

const TutorPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const isRTL = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');

  // Tutor Features
  const tutorFeatures: TutorFeature[] = [
    {
      id: 'chat',
      name: t('aiChat') || 'AI Chat Tutor',
      description: t('aiChatDesc') || 'Engage in deep conversations with an AI tutor that adapts to your questions and learning style.',
      icon: MessageSquare,
      color: 'from-indigo-500 to-blue-600',
      path: `/${locale}/dashboard/tutor/chat`,
      image: 'https://images.pexels.com/photos/2676582/pexels-photo-2676582.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: 'whiteboard',
      name: t('interactiveWhiteboard') || 'Interactive Whiteboard',
      description: t('whiteboardDesc') || 'Visual learning with an AI that can draw, annotate, and explain complex concepts graphically.',
      icon: PenTool,
      color: 'from-emerald-500 to-teal-600',
      path: `/${locale}/dashboard/tutor/whiteboard`,
      image: 'https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      id: 'notes',
      name: t('smartNotes') || 'Smart Notes',
      description: t('smartNotesDesc') || 'AI-enhanced note-taking that organizes your thoughts and connects concepts automatically.',
      icon: FileText,
      color: 'from-amber-500 to-orange-600',
      path: `/${locale}/dashboard/tutor/notes`,
      image: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Libro_de_los_juegos.jpg',
    },
    {
      id: 'video',
      name: t('conceptVideos') || 'Concept Videos',
      description: t('videosDesc') || 'Custom AI-generated video explanations that break down complex topics visually.',
      icon: Video,
      color: 'from-purple-500 to-violet-600',
      comingSoon: true,
      path: `/${locale}/dashboard/tutor/video`,
      image: 'https://images.pexels.com/photos/17484975/pexels-photo-17484975/free-photo-of-an-artist-s-illustration-of-artificial-intelligence-ai-this-image-depicts-how-ai-can-help-humans-to-understand-the-complexity-of-biology-it-was-created-by-artist-khyati-trehan-as-part.png?auto=compress&cs=tinysrgb&w=1200',
    },
  ];

  // Insight Questions (to spark curiosity)
  const insightQuestions: InsightQuestion[] = [
    {
      id: 1,
      question: 'How do black holes bend the fabric of spacetime?',
      subject: 'Physics'
    },
    {
      id: 2,
      question: 'Can quantum entanglement help us understand consciousness?',
      subject: 'Philosophy & Science'
    },
    {
      id: 3,
      question: 'How did ancient civilizations predict celestial events without modern tools?',
      subject: 'History & Astronomy'
    },
    {
      id: 4,
      question: 'What makes certain mathematical patterns appear throughout nature?',
      subject: 'Mathematics & Biology'
    }
  ];

  // Recent Sessions
  const recentSessions: RecentSession[] = [
    {
      id: '1',
      title: 'Understanding Quantum Superposition',
      date: '3 hours ago',
      type: 'chat',
      preview: 'We were discussing how particles can exist in multiple states simultaneously...'
    },
    {
      id: '2',
      title: 'Derivation of Einstein Field Equations',
      date: 'Yesterday',
      type: 'whiteboard',
      preview: 'Step-by-step explanation of how matter curves spacetime...'
    },
    {
      id: '3',
      title: 'Analysis of Middle Eastern Literary Themes',
      date: '3 days ago',
      type: 'notes',
      preview: 'Comparison of symbolism and imagery across classical texts...'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/dashboard/tutor/chat?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const startTutorSession = (feature: TutorFeature) => {
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

  return (
    <div className={`space-y-10 max-w-5xl mx-auto px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-900 p-8 md:p-12">
        {/* Background animated stars */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="stars-small"></div>
          <div className="stars-medium"></div>
          <div className="stars-large"></div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
            {t('aiTutoringHub') || 'AI Tutoring Hub'}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl">
            {t('tutoringHubDesc') || 'Your gateway to personalized, interactive learning experiences that adapt to your unique way of understanding the cosmos of knowledge.'}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Input
              type="text"
              placeholder={t('askAnything') || "Ask anything, begin your learning journey..."}
              className="pr-20 py-6 bg-white/10 border-white/20 text-white placeholder:text-blue-200/80 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              className="absolute right-0 top-0 bottom-0 h-full bg-white/20 hover:bg-white/30 text-white"
              type="submit"
            >
              <Rocket className="w-5 h-5 mr-2" />
              {t('explore') || 'Explore'}
            </Button>
          </form>
        </div>

        {/* Decorative cosmic elements */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-purple-600/30 blur-3xl"></div>
        <div className="absolute top-12 -right-16 w-32 h-32 rounded-full bg-blue-500/20 blur-xl"></div>
        <div className="absolute -bottom-8 left-20 w-24 h-24 rounded-full bg-indigo-500/30 blur-xl"></div>
      </div>

      {/* Main Tutor Features */}
      <section className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-2xl font-medium">{t('chooseTutor') || 'Choose your AI tutor experience'}</h2>
          <Orbit className="h-6 w-6 text-primary" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorFeatures.map((feature) => (
            <motion.div
              key={feature.id}
              whileHover={{ y: -5 }}
              whileTap={{ y: 0 }}
            >
              <Card
                className="overflow-hidden border cursor-pointer h-full hover:shadow-lg transition-all duration-300 hover:border-primary/30"
                onClick={() => startTutorSession(feature)}
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
                    src={feature.image} // In production, use feature.image
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
                      : t('startLearning') || 'Start Learning'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Sessions */}
      <section className="space-y-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-2xl font-medium">{t('recentSessions') || 'Continue your journey'}</h2>
          <Button variant="ghost" onClick={() => router.push(`/${locale}/dashboard/tutor/history`)}>
            <History className="h-4 w-4 mr-2" />
            {t('viewAll') || 'View All'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentSessions.map((session) => (
            <Card
              key={session.id}
              className="hover:shadow-md transition-all duration-300 cursor-pointer hover:border-primary/30"
              onClick={() => router.push(`/${locale}/dashboard/tutor/chat/${session.id}`)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="mb-2">
                    {session.type === 'chat' && <MessageSquare className="h-3 w-3 mr-1 inline" />}
                    {session.type === 'whiteboard' && <PenTool className="h-3 w-3 mr-1 inline" />}
                    {session.type === 'notes' && <FileText className="h-3 w-3 mr-1 inline" />}
                    {session.type === 'video' && <Video className="h-3 w-3 mr-1 inline" />}
                    {session.type === 'chat' && (t('chat') || 'Chat')}
                    {session.type === 'whiteboard' && (t('whiteboard') || 'Whiteboard')}
                    {session.type === 'notes' && (t('notes') || 'Notes')}
                    {session.type === 'video' && (t('video') || 'Video')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{session.date}</span>
                </div>
                <h3 className="font-medium line-clamp-1">{session.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{session.preview}</p>
                <div className="text-xs text-primary flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {t('continue') || 'Continue'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Insight Questions */}
      <section className="space-y-6">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Lightbulb className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'} text-amber-500`} />
          <h2 className="text-2xl font-medium">{t('insightfulQuestions') || 'Questions to expand your understanding'}</h2>
        </div>

        <div className="space-y-3">
          {insightQuestions.map((question, idx) => (
            <Card
              key={question.id}
              className="border hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/${locale}/dashboard/tutor/chat?query=${encodeURIComponent(question.question)}`)}
            >
              <CardContent className={`p-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-amber-500 font-light">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{question.question}</p>
                    <p className="text-xs text-muted-foreground">{question.subject}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400">
                  <Telescope className="h-4 w-4 mr-1" />
                  {t('discover') || 'Discover'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cosmic Learning Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-medium">{t('cosmicLearning') || 'Cosmic Learning Experience'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-0">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium">{t('adaptiveLearning') || 'Adaptive Learning'}</h3>
              <p className="text-sm">{t('adaptiveDesc') || 'Our AI tutors adjust to your learning pace and style, focusing more on areas where you need additional support.'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-0">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Atom className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium">{t('conceptMapping') || 'Concept Mapping'}</h3>
              <p className="text-sm">{t('mappingDesc') || 'Visualize connections between different concepts and subjects, helping you build a comprehensive understanding of complex topics.'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-0">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium">{t('instantFeedback') || 'Instant Feedback'}</h3>
              <p className="text-sm">{t('feedbackDesc') || 'Receive immediate guidance and correction as you work through problems, accelerating your learning and mastery.'}</p>
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
              <h3 className="text-2xl font-medium mb-4">{t('unlockCosmos') || 'Unlock the Cosmos of Knowledge'}</h3>
              <p className="text-white/80 mb-6">
                {t('cosmosDesc') || 'Begin a journey that traverses disciplines, connects ideas, and reveals the hidden patterns that unite all fields of knowledge. Your AI tutor is ready to guide you through the stars of understanding.'}
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => router.push(`/${locale}/dashboard/tutor/chat`)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/10"
                >
                  <Compass className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-pulse`} />
                  {t('beginJourney') || 'Begin Your Journey'}
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

export default TutorPage;
