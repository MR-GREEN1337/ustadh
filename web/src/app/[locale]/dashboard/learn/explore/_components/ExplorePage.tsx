import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { LearningService } from '@/services/LearningService';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  BookOpen,
  Compass,
  ChevronRight,
  Star
} from 'lucide-react';

const ExplorePage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch topics from API
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const data = await LearningService.getExploreTopics(searchQuery);
        setTopics(data.topics || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching explore topics:', error);
        setLoading(false);
      }
    };

    fetchTopics();
  }, [searchQuery]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Example topics for display if no data is available
  const exampleTopics = [
    {
      id: 1,
      title: "The Golden Ratio in Nature and Art",
      description: "Discover how the golden ratio appears in natural phenomena, art, and architecture across cultures.",
      learners: 1452,
      is_featured: true,
      connects_concepts: ["mathematics", "art", "science"],
      related_subjects: ["Mathematics", "Art History", "Biology"],
    },
    {
      id: 2,
      title: "Ibn al-Haytham and the Foundations of Modern Optics",
      description: "Explore how Ibn al-Haytham's work in optics revolutionized our understanding of light and vision.",
      learners: 876,
      is_new: true,
      connects_concepts: ["physics", "history", "light"],
      related_subjects: ["Physics", "History of Science", "Islamic Science"],
    },
    {
      id: 3,
      title: "Poetic Forms Across Arabic and French Traditions",
      description: "Compare the structures, rhythms, and cultural influences in Arabic and French poetry traditions.",
      learners: 723,
      connects_concepts: ["literature", "linguistics", "culture"],
      related_subjects: ["Literature", "Linguistics", "Cultural Studies"],
    },
    {
      id: 4,
      title: "Morocco's Geographic Influence on its History",
      description: "Analyze how Morocco's unique geography has shaped its history, trade, and cultural development.",
      learners: 954,
      connects_concepts: ["geography", "history", "culture"],
      related_subjects: ["Geography", "History", "Cultural Studies"],
    },
    {
      id: 5,
      title: "Quantum Computing: Principles and Potential",
      description: "Understand the basics of quantum computing and its revolutionary potential for solving complex problems.",
      learners: 1087,
      is_new: true,
      connects_concepts: ["computing", "physics", "mathematics"],
      related_subjects: ["Computer Science", "Physics", "Mathematics"],
    },
    {
      id: 6,
      title: "Andalusian Art and Architecture",
      description: "Discover the beauty and innovation of Andalusian art and its lasting influence on Moroccan culture.",
      learners: 643,
      connects_concepts: ["art", "history", "architecture"],
      related_subjects: ["Art History", "Architecture", "Islamic Studies"],
    }
  ];

  // If no topics loaded, use example data
  useEffect(() => {
    if (!loading && topics.length === 0) {
      setTopics(exampleTopics as any);
    }
  }, [loading, topics]);

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Ancient Library Illustration */}
      <div className="relative w-full overflow-hidden bg-[#f8f5f0] dark:bg-black/20 rounded-lg h-64 flex items-center">
        <div className="absolute w-full h-full opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="graph-paper" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-paper)" />
          </svg>
        </div>

        <div className="relative mx-auto text-center z-10 px-6 max-w-3xl">
          <div className="flex justify-center mb-6">
            <svg width="80" height="80" viewBox="0 0 100 100" className="text-primary opacity-90">
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Celestial/Astronomical symbol */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="50" cy="20" r="3" fill="currentColor" filter="url(#glow)" />
              <circle cx="80" cy="50" r="3" fill="currentColor" filter="url(#glow)" />
              <circle cx="20" cy="50" r="3" fill="currentColor" filter="url(#glow)" />
              <circle cx="50" cy="80" r="3" fill="currentColor" filter="url(#glow)" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2,3" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2,3" />
            </svg>
          </div>

          <h1 className="font-serif text-3xl mb-3">{t("exploreTitle") || "Explore Knowledge"}</h1>
          <p className="text-muted-foreground font-light">
            {t("exploreDescription") || "Study the connections between disciplines to develop a deeper understanding of our world."}
          </p>
        </div>
      </div>

      {/* Manuscript-style Search */}
      <div className="bg-[#f8f5f0] dark:bg-black/10 rounded-lg p-6 border border-stone-200 dark:border-stone-800 mx-auto max-w-2xl relative overflow-hidden">
        <div className="absolute h-full w-full top-0 left-0 opacity-5">
          <svg width="100%" height="100%">
            <pattern id="illuminated-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="none" />
              <path d="M0,10 Q5,0 10,10 T20,10" stroke="currentColor" fill="none" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#illuminated-pattern)" />
          </svg>
        </div>

        <div className="relative">
          <p className="font-serif text-lg mb-4">{t("seekKnowledge") || "Seek Knowledge:"}</p>
          <div className="relative border border-stone-300 dark:border-stone-700 rounded-md overflow-hidden">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder={t("searchTopics") || "Enter your inquiry..."}
              className="border-0 pl-10 py-6 focus-visible:ring-0 bg-transparent font-light"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {/* Featured Collections */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-grow bg-stone-200 dark:bg-stone-800"></div>
          <h2 className="font-serif text-xl font-light">{t("featuredCollections") || "Featured Collections"}</h2>
          <div className="h-px flex-grow bg-stone-200 dark:bg-stone-800"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <svg width="40" height="40" viewBox="0 0 100 100" className="text-amber-700 dark:text-amber-500">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M30,70 L70,70 L70,30 L30,30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M30,50 L70,50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                    <path d="M50,30 L50,70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                    <circle cx="50" cy="50" r="5" fill="currentColor" />
                    <circle cx="30" cy="30" r="2" fill="currentColor" />
                    <circle cx="70" cy="30" r="2" fill="currentColor" />
                    <circle cx="30" cy="70" r="2" fill="currentColor" />
                    <circle cx="70" cy="70" r="2" fill="currentColor" />
                  </svg>

                  {topics[0]?.is_featured && (
                    <Badge variant="outline" className="border-amber-200 text-amber-700 dark:text-amber-400 dark:border-amber-900/30">
                      Featured
                    </Badge>
                  )}
                </div>

                <h3 className="font-serif text-lg mb-2">{topics[0]?.title || "The Golden Ratio in Nature and Art"}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow font-light">{topics[0]?.description || "Discover how the golden ratio appears in natural phenomena, art, and architecture across cultures."}</p>

                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(topics[0]?.related_subjects || ["Mathematics", "Art History"]).slice(0, 2).map((subject, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-transparent">
                        {subject}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{topics[0]?.learners || 1452} scholars</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-serif hover:bg-amber-100/50 dark:hover:bg-amber-900/20 -mr-2"
                      onClick={() => router.push(`/${locale}/dashboard/learn/explore/${topics[0]?.id || 1}`)}
                    >
                      {t("study") || "Study"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <svg width="40" height="40" viewBox="0 0 100 100" className="text-indigo-700 dark:text-indigo-500">
                    <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M50,20 L50,80" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M20,50 L80,50" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M50,20 Q30,35 50,50 Q70,65 50,80" stroke="currentColor" strokeWidth="1" fill="none" />
                    <path d="M20,50 Q35,30 50,50 Q65,70 80,50" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>

                  {topics[1]?.is_new && (
                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 dark:text-indigo-400 dark:border-indigo-900/30">
                      New
                    </Badge>
                  )}
                </div>

                <h3 className="font-serif text-lg mb-2">{topics[1]?.title || "Ibn al-Haytham and Modern Optics"}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow font-light">{topics[1]?.description || "Explore how Ibn al-Haytham's work in optics revolutionized our understanding of light and vision."}</p>

                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(topics[1]?.related_subjects || ["Physics", "History of Science"]).slice(0, 2).map((subject, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-transparent">
                        {subject}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{topics[1]?.learners || 876} scholars</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-serif hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 -mr-2"
                      onClick={() => router.push(`/${locale}/dashboard/learn/explore/${topics[1]?.id || 2}`)}
                    >
                      {t("study") || "Study"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Topic Catalogs */}
      <div>
        <div className="mb-6">
          <h2 className="font-serif text-xl font-light mb-1">{t("knowledgeCatalog") || "Knowledge Catalog"}</h2>
          <p className="text-sm text-muted-foreground font-light">{t("exploreTopicsDescription") || "Explore carefully curated topics spanning various disciplines and epochs."}</p>
        </div>

        <div className="space-y-4">
          {(topics.slice(2) || exampleTopics.slice(2)).map((topic, index) => (
            <Card
              key={topic.id || index}
              className="bg-transparent hover:bg-[#f8f5f0] dark:hover:bg-black/10 border-stone-200 dark:border-stone-800 transition-colors"
              onClick={() => router.push(`/${locale}/dashboard/learn/explore/${topic.id || index + 3}`)}
            >
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="hidden sm:block">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <span className="font-serif text-xl font-light text-muted-foreground">{index + 1}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-serif text-lg">{topic.title}</h3>
                      {topic.is_new && <Badge variant="outline" className="bg-transparent">New</Badge>}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 font-light">{topic.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {topic.related_subjects.slice(0, 3).map((subject, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-transparent">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center text-muted-foreground text-sm">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{topic.learners} scholars</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI-Powered Exploration Section */}
      <div className="bg-[#f8f5f0] dark:bg-black/10 rounded-lg p-6 border border-stone-200 dark:border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-5">
          <svg viewBox="0 0 100 200" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <pattern id="neural-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
                <circle cx="5" cy="5" r="0.5" fill="currentColor" />
                <circle cx="15" cy="5" r="0.5" fill="currentColor" />
                <circle cx="5" cy="15" r="0.5" fill="currentColor" />
                <circle cx="15" cy="15" r="0.5" fill="currentColor" />
                <line x1="10" y1="5" x2="10" y2="15" stroke="currentColor" strokeWidth="0.2" />
                <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="0.2" />
                <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth="0.2" />
                <line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-pattern)" />
          </svg>
        </div>

        <div className="relative max-w-3xl">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="md:w-2/3">
              <h2 className="font-serif text-xl mb-3">{t("aiGuidedExploration") || "AI-Guided Exploration"}</h2>
              <p className="text-sm text-muted-foreground mb-4 font-light">
                {t("aiGuidedDescription") || "Our scholarly companion can guide you through complex topics, illuminate hidden connections, and create personalized learning journeys tailored to your interests."}
              </p>
              <Button
                className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white font-light"
                onClick={() => router.push(`/${locale}/dashboard/tutor/chat`)}
              >
                <Compass className="h-4 w-4 mr-2" />
                {t("beginJourney") || "Begin Your Journey"}
              </Button>
            </div>

            <div className="md:w-1/3 flex justify-center">
              <svg width="120" height="120" viewBox="0 0 100 100" className="text-primary opacity-80">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />

                {/* Nodes and connections representing AI network */}
                <circle cx="50" cy="20" r="2" fill="currentColor" />
                <circle cx="80" cy="50" r="2" fill="currentColor" />
                <circle cx="50" cy="80" r="2" fill="currentColor" />
                <circle cx="20" cy="50" r="2" fill="currentColor" />
                <circle cx="35" cy="35" r="1.5" fill="currentColor" />
                <circle cx="65" cy="35" r="1.5" fill="currentColor" />
                <circle cx="35" cy="65" r="1.5" fill="currentColor" />
                <circle cx="65" cy="65" r="1.5" fill="currentColor" />

                <line x1="50" y1="20" x2="35" y2="35" stroke="currentColor" strokeWidth="0.3" />
                <line x1="50" y1="20" x2="65" y2="35" stroke="currentColor" strokeWidth="0.3" />
                <line x1="80" y1="50" x2="65" y2="35" stroke="currentColor" strokeWidth="0.3" />
                <line x1="80" y1="50" x2="65" y2="65" stroke="currentColor" strokeWidth="0.3" />
                <line x1="50" y1="80" x2="35" y2="65" stroke="currentColor" strokeWidth="0.3" />
                <line x1="50" y1="80" x2="65" y2="65" stroke="currentColor" strokeWidth="0.3" />
                <line x1="20" y1="50" x2="35" y2="35" stroke="currentColor" strokeWidth="0.3" />
                <line x1="20" y1="50" x2="35" y2="65" stroke="currentColor" strokeWidth="0.3" />

                <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,1" />
                <line x1="65" y1="35" x2="65" y2="65" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,1" />
                <line x1="65" y1="65" x2="35" y2="65" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,1" />
                <line x1="35" y1="65" x2="35" y2="35" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,1" />

                <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.8" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophical Questions */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-2">
          <div className="h-px flex-grow bg-stone-200 dark:bg-stone-800"></div>
          <h2 className="font-serif text-xl font-light">{t("philosophicalQuestions") || "Philosophical Inquiries"}</h2>
          <div className="h-px flex-grow bg-stone-200 dark:bg-stone-800"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "How did Moroccan architecture influence mathematical thinking?",
            "What connections exist between Fibonacci sequences and natural growth?",
            "How are neural networks inspired by biological cognition?",
            "What role did Morocco play in preserving ancient Greek knowledge?",
          ].map((question, idx) => (
            <Card
              key={idx}
              className="cursor-pointer bg-transparent hover:bg-[#f8f5f0] dark:hover:bg-black/10 border-stone-200 dark:border-stone-800 transition-colors"
              onClick={() => router.push(`/${locale}/dashboard/tutor/chat?prompt=${encodeURIComponent(question)}`)}
            >
              <CardContent className="p-4 flex items-center">
                <div className="flex items-center gap-4 w-full">
                  <div className="font-serif text-xl text-muted-foreground font-light">{idx + 1}</div>
                  <p className="font-light text-sm">{question}</p>
                </div>
                <Star className="h-4 w-4 text-amber-600 dark:text-amber-400 ml-2 flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
