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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  BookOpen,
  MessageCircle,
  Bookmark,
  ChevronRight,
  ArrowLeft,
  Star
} from 'lucide-react';

const TopicDetailPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { locale, topicId } = params;
  const isRTL = locale === "ar";

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  // In a real application, you would fetch the topic details from the API
  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        setLoading(true);
        // This would be a real API call in production
        // const data = await LearningService.getTopicDetails(topicId);

        // Simulated data for the example
        const exampleTopic = {
          id: topicId,
          title: "The Golden Ratio in Nature and Art",
          description: "Discover how the golden ratio appears in natural phenomena, art, and architecture across cultures.",
          learners: 1452,
          is_featured: true,
          is_new: false,
          connects_concepts: ["mathematics", "art", "science", "architecture", "biology"],
          related_subjects: ["Mathematics", "Art History", "Biology"],
          content: {
            introduction: "The golden ratio, approximately 1.618, has fascinated mathematicians, artists, and scientists for centuries. This mathematical proportion appears in unexpected places throughout nature and has been deliberately used by artists and architects to create aesthetically pleasing works.",
            sections: [
              {
                title: "Mathematical Properties",
                content: "The golden ratio, denoted by the Greek letter φ (phi), is an irrational number approximately equal to 1.618. It occurs when a line is divided into two parts such that the ratio of the whole line to the longer part equals the ratio of the longer part to the shorter part. Algebraically, this can be expressed as (a+b)/a = a/b = φ. This ratio produces what is known as the golden rectangle, which has been considered visually harmonious throughout history."
              },
              {
                title: "Appearances in Nature",
                content: "The golden ratio manifests in nature in surprising ways. The spirals of galaxies, the arrangement of leaves on plants (phyllotaxis), the branching of trees, and the spiral patterns of shells all frequently exhibit this proportion. The Fibonacci sequence, where each number is the sum of the two preceding ones (1, 1, 2, 3, 5, 8, 13, 21, etc.), is closely related to the golden ratio, as the ratio of consecutive Fibonacci numbers approaches φ as the sequence progresses."
              },
              {
                title: "Applications in Art and Architecture",
                content: "Throughout history, from ancient Egyptian pyramids and Greek temples to Renaissance paintings and modern design, the golden ratio has been incorporated as a guiding principle. The Parthenon in Athens, Leonardo da Vinci's paintings, and Le Corbusier's Modulor system all demonstrate conscious application of these proportions. Islamic geometric art often incorporates patterns based on these harmonious ratios."
              },
              {
                title: "Cultural Significance",
                content: "The golden ratio has been called 'divine proportion' and has held mystical or spiritual significance in various cultures. Its perceived aesthetic appeal crosses cultural boundaries and time periods, suggesting a potentially universal human response to these proportions. From Morocco's traditional architecture to modern design principles, these mathematical relationships continue to influence our sense of beauty and harmony."
              }
            ],
            conclusion: "The ubiquity of the golden ratio across disciplines makes it a fascinating subject for interdisciplinary study. Whether occurring naturally or applied deliberately by human creators, this mathematical relationship continues to bridge science, art, and culture."
          },
          related_topics: [
            "Fibonacci Sequence in Natural Patterns",
            "Sacred Geometry Across Cultures",
            "Mathematical Principles in Islamic Art"
          ]
        };

        setTopic(exampleTopic);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching topic details:', error);
        setLoading(false);
      }
    };

    fetchTopicDetails();
  }, [topicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground font-serif">Loading manuscript...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground font-serif">This tome appears to be missing from our library.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/${locale}/dashboard/learn/explore`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Navigation */}
      <div>
        <Button
          variant="ghost"
          className="p-0 text-muted-foreground hover:bg-transparent hover:text-foreground font-serif"
          onClick={() => router.push(`/${locale}/dashboard/learn/explore`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToLibrary") || "Back to Library"}
        </Button>
      </div>

      {/* Topic Header */}
      <div className="bg-[#f8f5f0] dark:bg-black/10 p-8 rounded-lg border border-stone-200 dark:border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
              <pattern id="manuscript-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="0.2" />
                <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#manuscript-pattern)" />
          </svg>
        </div>

        <div className="relative">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/3">
              {/* Illuminated first letter */}
              <div className="mb-6">
                <div className="relative inline-block">
                  <div className="text-6xl font-serif text-primary float-left pr-2 pt-1">
                    {topic.title.charAt(0)}
                  </div>
                  <h1 className="text-3xl font-serif pt-3 pl-10">
                    {topic.title.substring(1)}
                  </h1>
                </div>
              </div>

              <p className="text-muted-foreground font-light mb-6">
                {topic.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {topic.related_subjects.map((subject, idx) => (
                  <Badge key={idx} variant="outline" className="bg-transparent">
                    {subject}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>{topic.learners} scholars</span>
                </div>

                {topic.is_featured && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-400" />
                    <span>Featured manuscript</span>
                  </div>
                )}
              </div>
            </div>

            <div className="md:w-1/3 mt-6 md:mt-0 flex justify-center items-center">
              <div className="relative">
                <svg width="150" height="150" viewBox="0 0 100 100" className="text-primary">
                  {/* A geometric diagram related to the golden ratio */}
                  <rect x="38" y="38" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <rect x="38" y="62" width="24" height="14.83" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <rect x="62" y="38" width="14.83" height="24" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <rect x="62" y="62" width="14.83" height="14.83" fill="none" stroke="currentColor" strokeWidth="0.5" />

                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,1" />
                  <path d="M38,38 Q 50,25 62,38 Q 75,50 62,62 Q 50,75 38,62 Q 25,50 38,38 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />

                  <line x1="38" y1="38" x2="76.83" y2="76.83" stroke="currentColor" strokeWidth="0.3" />
                  <line x1="62" y1="38" x2="38" y2="62" stroke="currentColor" strokeWidth="0.3" />

                  <circle cx="38" cy="38" r="1" fill="currentColor" />
                  <circle cx="62" cy="38" r="1" fill="currentColor" />
                  <circle cx="38" cy="62" r="1" fill="currentColor" />
                  <circle cx="62" cy="62" r="1" fill="currentColor" />
                  <circle cx="76.83" cy="76.83" r="1" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex mt-8 gap-3">
            <Button
              className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white"
              onClick={() => router.push(`/${locale}/dashboard/tutor/chat?topic=${topic.id}`)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t("beginStudy") || "Begin Study"}
            </Button>

            <Button variant="outline">
              <Bookmark className="h-4 w-4 mr-2" />
              {t("saveForLater") || "Save for Later"}
            </Button>
          </div>
        </div>
      </div>

      {/* Topic Content */}
      <div className="space-y-8">
        {/* Section Navigation */}
        <div className="bg-[#f8f5f0] dark:bg-black/10 p-4 rounded-lg border border-stone-200 dark:border-stone-800">
          <div className="flex flex-wrap gap-4 font-serif">
            <Button
              variant={activeSection === 'overview' ? "default" : "ghost"}
              className={`hover:bg-stone-200/50 dark:hover:bg-black/20 ${activeSection === 'overview' ? 'bg-stone-200 dark:bg-black/20 hover:bg-stone-200 dark:hover:bg-black/20' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              Overview
            </Button>

            {topic.content.sections.map((section, idx) => (
              <Button
                key={idx}
                variant={activeSection === `section-${idx}` ? "default" : "ghost"}
                className={`hover:bg-stone-200/50 dark:hover:bg-black/20 ${activeSection === `section-${idx}` ? 'bg-stone-200 dark:bg-black/20 hover:bg-stone-200 dark:hover:bg-black/20' : ''}`}
                onClick={() => setActiveSection(`section-${idx}`)}
              >
                {section.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-[#f8f5f0] dark:bg-black/10 p-8 rounded-lg border border-stone-200 dark:border-stone-800">
          {activeSection === 'overview' ? (
            <div className="space-y-6">
              <div className="prose prose-stone dark:prose-invert max-w-none">
                <h2 className="font-serif text-2xl font-light mb-6">Introduction</h2>
                <p className="font-light leading-7">{topic.content.introduction}</p>

                <div className="my-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {topic.content.sections.map((section, idx) => (
                      <Card key={idx} className="bg-white/50 dark:bg-black/20 border-stone-200 dark:border-stone-700">
                        <CardContent className="p-6">
                          <h3 className="font-serif text-lg mb-2">{section.title}</h3>
                          <p className="text-sm text-muted-foreground font-light">
                            {section.content.substring(0, 120)}...
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 text-primary hover:bg-primary/10"
                            onClick={() => setActiveSection(`section-${idx}`)}
                          >
                            Continue reading
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <h2 className="font-serif text-2xl font-light mb-4">Conclusion</h2>
                <p className="font-light leading-7">{topic.content.conclusion}</p>
              </div>

              <Separator className="my-6 bg-stone-200 dark:bg-stone-700" />

              <div className="space-y-4">
                <h3 className="font-serif text-xl font-light">Related Topics</h3>
                <div className="space-y-2">
                  {topic.related_topics.map((relatedTopic, idx) => (
                    <Card key={idx} className="bg-transparent hover:bg-white/50 dark:hover:bg-black/20 cursor-pointer border-stone-200 dark:border-stone-700">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-light font-serif">{idx + 1}.</span>
                          <p className="font-light">{relatedTopic}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-stone dark:prose-invert max-w-none">
              {topic.content.sections.map((section, idx) => {
                if (activeSection === `section-${idx}`) {
                  return (
                    <div key={idx} className="space-y-4">
                      <h2 className="font-serif text-2xl font-light mb-6">{section.title}</h2>
                      <p className="font-light leading-7">{section.content}</p>

                      <div className="flex mt-8 justify-between">
                        <Button
                          variant="ghost"
                          onClick={() => setActiveSection(idx === 0 ? 'overview' : `section-${idx-1}`)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {idx === 0 ? 'Overview' : topic.content.sections[idx-1].title}
                        </Button>

                        {idx < topic.content.sections.length - 1 && (
                          <Button
                            variant="ghost"
                            onClick={() => setActiveSection(`section-${idx+1}`)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {topic.content.sections[idx+1].title}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}

                        {idx === topic.content.sections.length - 1 && (
                          <Button
                            variant="ghost"
                            onClick={() => setActiveSection('overview')}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Back to Overview
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Study with AI */}
        <div className="bg-[#f8f5f0] dark:bg-black/10 p-6 rounded-lg border border-stone-200 dark:border-stone-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-5">
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <pattern id="neural-pattern-detail" width="20" height="20" patternUnits="userSpaceOnUse">
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
              <rect width="100%" height="100%" fill="url(#neural-pattern-detail)" />
            </svg>
          </div>

          <div className="relative">
            <h2 className="font-serif text-xl mb-2">{t("aiGuidedStudy") || "Study with AI Guidance"}</h2>
            <p className="text-sm text-muted-foreground mb-4 font-light">
              {t("aiGuidedStudyDescription") || "Engage with our AI tutor to explore this topic in depth, ask questions, and make connections to other areas of knowledge."}
            </p>
            <div className="flex gap-3">
              <Button
                className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white"
                onClick={() => router.push(`/${locale}/dashboard/tutor/chat?topic=${topic.id}`)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("startDiscussion") || "Start Discussion"}
              </Button>

              <Button variant="outline">
                {t("viewRelatedQuestions") || "View Related Questions"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicDetailPage;
