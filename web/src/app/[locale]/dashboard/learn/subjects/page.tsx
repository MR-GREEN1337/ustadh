"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Calculator,
  ChevronRight,
  Globe,
  Star,
  Users,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/config';

interface Subject {
  id: number;
  name: string;
  grade_level: string;
  description: string;
  icon: string | null;
  color_scheme: string | null;
  enrollment_count?: number;
  is_enrolled?: boolean;
}

// Map of subject types to classical art images
const subjectArtworks: Record<string, {img: string, attribution: string}> = {
  'math': {
    img: '/subjects/mathematics/1.jpg',
    attribution: 'The School of Athens by Raphael, depicting Plato and Aristotle among ancient philosophers and mathematicians'
  },
  'algebra': {
    img: '/subjects/mathematics/1.jpg',
    attribution: 'Portrait of Al-Khwarizmi, the father of algebra'
  },
  'geometry': {
    img: '/subjects/geometry.jpg',
    attribution: 'Euclid\'s Elements - Medieval manuscript depicting geometric principles'
  },
  'physics': {
    img: '/subjects/physics.jpg',
    attribution: 'Astronomers Studying an Eclipse by Antoine Caron, 1571'
  },
  'chemistry': {
    img: '/subjects/chemistry.jpg',
    attribution: 'The Alchemist by Joseph Wright, 1771'
  },
  'biology': {
    img: '/subjects/biology.jpg',
    attribution: 'Ernst Haeckel\'s detailed illustrations of natural forms from Kunstformen der Natur, 1904'
  },
  'astronomy': {
    img: '/subjects/astronomy.jpg',
    attribution: 'Celestial Map of the Night Sky from Harmonia Macrocosmica by Andreas Cellarius, 1661'
  },
  'literature': {
    img: '/subjects/literature.jpg',
    attribution: 'The Bookworm by Carl Spitzweg, 1850'
  },
  'poetry': {
    img: '/subjects/poetry.jpg',
    attribution: 'Inspiration of the Poet by Nicolas Poussin, 1630'
  },
  'history': {
    img: '/subjects/history.jpg',
    attribution: 'The Course of Empire - Destruction by Thomas Cole, 1836'
  },
  'art': {
    img: '/subjects/art.jpg',
    attribution: 'The Artist\'s Studio by Gustave Courbet, 1855'
  },
  'music': {
    img: '/subjects/music.jpg',
    attribution: 'The Concert by Johannes Vermeer, 1665'
  },
  'philosophy': {
    img: '/subjects/philosophy.jpg',
    attribution: 'The Death of Socrates by Jacques-Louis David, 1787'
  },
  'language': {
    img: '/subjects/language.jpg',
    attribution: 'The Tower of Babel by Pieter Bruegel the Elder, 1563'
  },
  'computer': {
    img: '/subjects/computer.jpg',
    attribution: 'Ada Lovelace, the first computer programmer, illustrated in Connections to Charles Babbage\'s Analytical Engine'
  },
  'default': {
    img: '/subjects/default.jpg',
    attribution: 'Wanderer above the Sea of Fog by Caspar David Friedrich, 1818'
  },
};

// Function to determine artwork based on subject name
const getSubjectArtwork = (name: string): {img: string, attribution: string} => {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(subjectArtworks)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }
  return subjectArtworks.default;
};

// For demonstration purposes - replace with actual API data
const mockSubjects: Subject[] = [
  {
    id: 1,
    name: "Mathematics",
    grade_level: "10-12",
    description: "Explore algebra, calculus, and geometry with interactive lessons that reveal the hidden patterns governing our universe.",
    icon: null,
    color_scheme: null,
    enrollment_count: 1245,
    is_enrolled: true
  },
  {
    id: 2,
    name: "Physics",
    grade_level: "10-12",
    description: "From quantum mechanics to the dance of galaxies, discover the fundamental laws that govern existence itself.",
    icon: null,
    color_scheme: null,
    enrollment_count: 982,
    is_enrolled: false
  },
  {
    id: 3,
    name: "Literature & Poetry",
    grade_level: "All Grades",
    description: "Journey through the greatest stories ever told and explore how poetry captures the ineffable beauty of human experience.",
    icon: null,
    color_scheme: null,
    enrollment_count: 756,
    is_enrolled: true
  },
  {
    id: 4,
    name: "Computer Science",
    grade_level: "9-12",
    description: "From algorithms to artificial intelligence, learn how computational thinking is reshaping our world and future.",
    icon: null,
    color_scheme: null,
    enrollment_count: 1102,
    is_enrolled: false
  },
  {
    id: 5,
    name: "Biology",
    grade_level: "10-12",
    description: "Explore the intricate tapestry of life from microscopic cells to vast ecosystems and the evolutionary forces that shaped them.",
    icon: null,
    color_scheme: null,
    enrollment_count: 845,
    is_enrolled: false
  },
  {
    id: 6,
    name: "World History",
    grade_level: "All Grades",
    description: "Walk through the corridors of time and witness the rise and fall of civilizations, revolutions, and the human quest for meaning.",
    icon: null,
    color_scheme: null,
    enrollment_count: 721,
    is_enrolled: false
  },
  {
    id: 7,
    name: "Astronomy",
    grade_level: "8-12",
    description: "Gaze into the cosmos and contemplate our place among the stars, planets, galaxies and the mysteries of the universe.",
    icon: null,
    color_scheme: null,
    enrollment_count: 654,
    is_enrolled: false
  },
  {
    id: 8,
    name: "Art History",
    grade_level: "All Grades",
    description: "A visual journey through humanity's creative expression, from ancient cave paintings to contemporary masterpieces.",
    icon: null,
    color_scheme: null,
    enrollment_count: 532,
    is_enrolled: false
  },
  {
    id: 9,
    name: "Philosophy",
    grade_level: "10-12",
    description: "Explore life's deepest questions about knowledge, existence, ethics, and reality with history's greatest thinkers.",
    icon: null,
    color_scheme: null,
    enrollment_count: 489,
    is_enrolled: false
  }
];

export default function SubjectsPage() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(null);
  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [featuredSubject, setFeaturedSubject] = useState<Subject | null>(null);

  // Fetch subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoading(true);

        if (user) {
          // Authenticated - fetch from API
          const token = await getToken();

          if (token) {
            const response = await fetch(`${API_BASE_URL}/subjects`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setSubjects(data.subjects);

              // Select a featured subject
              const enrolledSubjects = data.subjects.filter((s: Subject) => s.is_enrolled);
              if (enrolledSubjects.length > 0) {
                setFeaturedSubject(enrolledSubjects[Math.floor(Math.random() * enrolledSubjects.length)]);
              } else if (data.subjects.length > 0) {
                setFeaturedSubject(data.subjects[Math.floor(Math.random() * data.subjects.length)]);
              }

              // Extract unique grade levels
              const grades = [...new Set(data.subjects.map((s: Subject) => s.grade_level))];
              setGradeLevels(grades);

              // Set user's grade level as default filter if available
              if (user.grade_level) {
                const userGradeStr = `${user.grade_level}`;
                const matchingGrade = grades.find(g => g.includes(userGradeStr));
                if (matchingGrade) {
                  setSelectedGradeLevel(matchingGrade);
                }
              }
            } else {
              console.error('Failed to fetch subjects');
              // Fall back to mock data
              setSubjects(mockSubjects);

              // Select a featured subject
              setFeaturedSubject(mockSubjects[Math.floor(Math.random() * 3)]);

              const grades = [...new Set(mockSubjects.map(s => s.grade_level))];
              setGradeLevels(grades);
            }
          } else {
            // No token - use mock data
            setSubjects(mockSubjects);
            setFeaturedSubject(mockSubjects[Math.floor(Math.random() * 3)]);
            const grades = [...new Set(mockSubjects.map(s => s.grade_level))];
            setGradeLevels(grades);
          }
        } else {
          // Not authenticated - use mock data
          setSubjects(mockSubjects);
          setFeaturedSubject(mockSubjects[Math.floor(Math.random() * 3)]);
          const grades = [...new Set(mockSubjects.map(s => s.grade_level))];
          setGradeLevels(grades);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        // Fall back to mock data
        setSubjects(mockSubjects);
        setFeaturedSubject(mockSubjects[Math.floor(Math.random() * 3)]);
        const grades = [...new Set(mockSubjects.map(s => s.grade_level))];
        setGradeLevels(grades);

        toast({
          title: "Connection Error",
          description: "Failed to load subjects. Using sample data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [user, getToken, toast]);

  // Handle enrollment
  const handleEnroll = async (subjectId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in subjects",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = await getToken();

      if (token) {
        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/enroll`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Update the local state
          setSubjects(subjects.map(subject =>
            subject.id === subjectId
              ? { ...subject, is_enrolled: true, enrollment_count: (subject.enrollment_count || 0) + 1 }
              : subject
          ));

          toast({
            title: "Enrolled Successfully",
            description: "You've been enrolled in this subject",
            variant: "default"
          });

          // Navigate to the subject page
          router.push(`/${locale}/dashboard/learn/subjects/${subjectId}`);
        } else {
          toast({
            title: "Enrollment Failed",
            description: "Failed to enroll in this subject",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error enrolling in subject:', error);
      toast({
        title: "Connection Error",
        description: "Failed to enroll in subject",
        variant: "destructive"
      });
    }
  };

  // Filter subjects by grade level
  const filteredSubjects = selectedGradeLevel
    ? subjects.filter(subject => subject.grade_level === selectedGradeLevel)
    : subjects;

  const isRTL = locale === "ar";

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="flex items-center mb-8">
        <Link href={`/${locale}/dashboard/learn`}>
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("back") || "Back"}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{t("exploreSubjects") || "Explore Subjects"}</h1>
      </div>

      {/* Featured Subject */}
      {!isLoading && featuredSubject && (
        <div className="mb-16 overflow-hidden rounded-xl border shadow-md bg-card">
          <div className="flex flex-col lg:flex-row">
            <div className="relative w-full lg:w-1/2 h-64 lg:h-auto overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-30 z-10 flex items-end p-6">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {featuredSubject.is_enrolled ? "Continue Learning" : "Featured Subject"}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white">{featuredSubject.name}</h2>
                  <p className="text-white text-opacity-90 text-sm mt-1">{getSubjectArtwork(featuredSubject.name).attribution}</p>
                </div>
              </div>
              <div className="relative w-full h-full">
                <Image
                  src={getSubjectArtwork(featuredSubject.name).img} // In production, use getSubjectArtwork(featuredSubject.name).img
                  alt={featuredSubject.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-6 lg:p-8 flex flex-col justify-between lg:w-1/2">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{featuredSubject.grade_level}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {featuredSubject.enrollment_count?.toLocaleString()} enrolled
                  </div>
                </div>
                <p className="text-lg mb-4">{featuredSubject.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Discover mathematical patterns in nature and music</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Examine the foundations of modern scientific thought</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Explore connections to philosophy and the arts</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                {featuredSubject.is_enrolled ? (
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href={`/${locale}/dashboard/learn/subjects/${featuredSubject.id}`}>
                      Continue Learning <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => handleEnroll(featuredSubject.id)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Begin Your Journey
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade level filter */}
      {gradeLevels.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{t("filterByGrade") || "Filter by Grade Level"}</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedGradeLevel === null ? "default" : "outline"}
              onClick={() => setSelectedGradeLevel(null)}
            >
              {t("allGrades") || "All Grades"}
            </Button>
            {gradeLevels.map(grade => (
              <Button
                key={grade}
                variant={selectedGradeLevel === grade ? "default" : "outline"}
                onClick={() => setSelectedGradeLevel(grade)}
              >
                {grade}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Subject grid */}
      <h2 className="text-2xl font-bold mb-6">{t("allSubjects") || "All Subjects"}</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-6">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-6" />
                <Skeleton className="h-10 w-full rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredSubjects.map(subject => (
            <Card key={subject.id} className="overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/50">
              <div className="aspect-[4/3] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 flex items-end p-4">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-black/30 text-white border-white/20">
                      {subject.grade_level}
                    </Badge>
                    <h3 className="text-xl font-bold text-white">{subject.name}</h3>
                  </div>
                </div>
                <div className="relative w-full h-full">
                  <Image
                    src={`/api/placeholder/400/300`} // In production, use getSubjectArtwork(subject.name).img
                    alt={subject.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {subject.enrollment_count?.toLocaleString() || 0} enrolled
                  </div>
                  {subject.is_enrolled && (
                    <Badge variant="secondary">Enrolled</Badge>
                  )}
                </div>
                <p className="mb-6">{subject.description}</p>
                {subject.is_enrolled ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/${locale}/dashboard/learn/subjects/${subject.id}`}>
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleEnroll(subject.id)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("enroll") || "Enroll Now"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-xl border">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">{t("noSubjectsFound") || "No subjects found"}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t("tryChangingFilters") || "Try changing your filters or check back later for new subjects"}
          </p>
          <Button variant="outline" onClick={() => setSelectedGradeLevel(null)}>
            {t("showAllSubjects") || "Show All Subjects"}
          </Button>
        </div>
      )}

      {/* Quote section */}
      <div className="mt-16 mb-8 p-8 bg-black text-white rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black mix-blend-overlay"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-2xl italic mb-4">
            "The art and science of asking questions is the source of all knowledge."
          </p>
          <p className="text-lg">— Thomas Berger</p>
        </div>
      </div>
    </div>
  );
}
