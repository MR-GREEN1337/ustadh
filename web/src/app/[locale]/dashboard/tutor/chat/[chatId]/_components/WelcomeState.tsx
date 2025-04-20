import React, { useState } from 'react';
import { SquareFunction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'tldraw';
import { useLocale } from '@/i18n/client';

// Topic suggestion objects for different languages
const topics = {
  en: [
    {
      id: "math",
      icon: <SquareFunction className="h-4 w-4" />,
      iconClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      text: "How to solve the quadratic equation x² - 7x + 12 = 0"
    },
    {
      id: "physics",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="4"></circle>
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
        <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
      </svg>,
      iconClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      text: "The principles of quantum mechanics and the Bohr model"
    },
    {
      id: "history",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>
        <polyline points="3 7 12 3 21 7"></polyline>
        <rect x="8" y="12" width="8" height="8"></rect>
        <path d="M7 12v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"></path>
      </svg>,
      iconClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      text: "The influence of the Marinid dynasty on Moroccan architecture"
    },
    {
      id: "literature",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h3"></path>
        <path d="M15 18h6"></path>
        <path d="M15 14h6"></path>
        <path d="M15 10h6"></path>
        <path d="M9 18h1"></path>
      </svg>,
      iconClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      text: "How to analyze meter in classical Arabic poetry"
    }
  ],
  fr: [
    {
      id: "math",
      icon: <SquareFunction className="h-4 w-4" />,
      iconClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      text: "Comment résoudre l'équation quadratique x² - 7x + 12 = 0"
    },
    {
      id: "physics",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="4"></circle>
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
        <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
      </svg>,
      iconClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      text: "Les principes de la mécanique quantique et le modèle de Bohr"
    },
    {
      id: "history",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>
        <polyline points="3 7 12 3 21 7"></polyline>
        <rect x="8" y="12" width="8" height="8"></rect>
        <path d="M7 12v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"></path>
      </svg>,
      iconClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      text: "L'influence de la dynastie mérinide sur l'architecture marocaine"
    },
    {
      id: "literature",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h3"></path>
        <path d="M15 18h6"></path>
        <path d="M15 14h6"></path>
        <path d="M15 10h6"></path>
        <path d="M9 18h1"></path>
      </svg>,
      iconClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      text: "Comment analyser la métrique dans la poésie arabe classique"
    }
  ],
  ar: [
    {
      id: "math",
      icon: <SquareFunction className="h-4 w-4" />,
      iconClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      text: "كيفية حل المعادلة التربيعية x² - 7x + 12 = 0"
    },
    {
      id: "physics",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="4"></circle>
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
        <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
      </svg>,
      iconClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      text: "مبادئ ميكانيكا الكم ونموذج بور"
    },
    {
      id: "history",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"></path>
        <polyline points="3 7 12 3 21 7"></polyline>
        <rect x="8" y="12" width="8" height="8"></rect>
        <path d="M7 12v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"></path>
      </svg>,
      iconClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      text: "تأثير السلالة المرينية على العمارة المغربية"
    },
    {
      id: "literature",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h3"></path>
        <path d="M15 18h6"></path>
        <path d="M15 14h6"></path>
        <path d="M15 10h6"></path>
        <path d="M9 18h1"></path>
      </svg>,
      iconClass: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      text: "كيفية تحليل الوزن في الشعر العربي الكلاسيكي"
    }
  ]
};

// Text content for different languages
const content = {
  en: {
    title: "Start a new learning journey",
    description: "Ask any question or explore a new topic. Your AI tutor will guide you through a connected exploration of knowledge."
  },
  fr: {
    title: "Commencez un nouveau voyage d'apprentissage",
    description: "Posez n'importe quelle question ou explorez un nouveau sujet. Votre tuteur IA vous guidera à travers une exploration connectée de la connaissance."
  },
  ar: {
    title: "ابدأ رحلة تعليمية جديدة",
    description: "اطرح أي سؤال أو استكشف موضوعًا جديدًا. سيرشدك معلمك الذكاء الاصطناعي خلال استكشاف مترابط للمعرفة."
  }
};

const WelcomeState = ({ onSelectTopic }: { onSelectTopic: (topic: string) => void }) => {
  // Default to English if the locale is not supported
  const locale = useLocale();
  const currentLocale = topics[locale as keyof typeof topics] ? locale : "en";
  const currentTopics = topics[currentLocale as keyof typeof topics];
  const currentContent = content[currentLocale as keyof typeof content];

  // Check if we're using Arabic (RTL)
  const isRTL = currentLocale === "ar";

  return (
    <div className={`h-full flex flex-col items-center justify-center text-center p-6 mb-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="mb-8 opacity-80">
        <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />

          {/* Knowledge nodes */}
          <circle cx="100" cy="20" r="5" fill="currentColor" opacity="0.8" />
          <circle cx="30" cy="70" r="5" fill="currentColor" opacity="0.8" />
          <circle cx="140" cy="50" r="5" fill="currentColor" opacity="0.8" />
          <circle cx="70" cy="150" r="5" fill="currentColor" opacity="0.8" />
          <circle cx="170" cy="130" r="5" fill="currentColor" opacity="0.8" />
          <circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.3" />

          {/* Connections */}
          <line x1="100" y1="20" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
          <line x1="30" y1="70" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
          <line x1="140" y1="50" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
          <line x1="70" y1="150" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
          <line x1="170" y1="130" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />

          {/* Additional connections */}
          <line x1="100" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
          <line x1="30" y1="70" x2="70" y2="150" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
          <line x1="140" y1="50" x2="170" y2="130" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />

          {/* Animated pulse */}
          <circle cx="100" cy="100" r="15" fill="none" stroke="currentColor" opacity="0.5">
            <animate attributeName="r" from="15" to="85" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <h3 className="text-xl font-medium mb-2">
        {currentContent.title}
      </h3>
      <p className="text-muted-foreground max-w-md mb-8">
        {currentContent.description}
      </p>

      {/* Topics with subject-specific icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
        {currentTopics.map((topic: { id: string; icon: React.ReactNode; iconClass: string; text: string }) => (
          <Button
            key={topic.id}
            variant="outline"
            className="justify-start text-left whitespace-normal h-auto py-3 bg-background border border-input hover:bg-accent hover:text-accent-foreground"
            onClick={() => onSelectTopic && onSelectTopic(topic.text)}
          >
            <div className={`h-8 w-8 rounded-full ${topic.iconClass} flex items-center justify-center mr-2 flex-shrink-0`}>
              {topic.icon}
            </div>
            <span className="text-sm">{topic.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeState;
