"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  ChevronRight,
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
import { SubjectsService } from '@/services/SubjectsService';

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

        // Use SubjectsService to fetch all subjects
        const response = await SubjectsService.fetchAllSubjects();

        if (response && response.subjects) {
          setSubjects(response.subjects);

          // Select a featured subject
          const enrolledSubjects = response.subjects.filter((s: Subject) => s.is_enrolled);
          if (enrolledSubjects.length > 0) {
            setFeaturedSubject(enrolledSubjects[Math.floor(Math.random() * enrolledSubjects.length)]);
          } else if (response.subjects.length > 0) {
            setFeaturedSubject(response.subjects[Math.floor(Math.random() * response.subjects.length)]);
          }

          // Extract unique grade levels
          const grades = [...new Set(response.subjects.map((s: Subject) => s.grade_level))];
          setGradeLevels(grades as string[]);

          // Set user's grade level as default filter if available
          if (user && user.grade_level) {
            const userGradeStr = `${user.grade_level}`;
            const matchingGrade = grades.find((g: any) => g.includes(userGradeStr));
            if (matchingGrade) {
              setSelectedGradeLevel(matchingGrade as string);
            }
          }
        } else {
          // Handle case where no subjects are returned
          toast({
            title: "No Subjects Found",
            description: "No subjects are currently available.",
            variant: "destructive"
          });
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: "Connection Error",
          description: "Failed to load subjects. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [user, toast]);

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
      // Use SubjectsService to enroll in subject
      const response = await SubjectsService.enrollInSubject(subjectId);

      if (response) {
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
      }
    } catch (error) {
      console.error('Error enrolling in subject:', error);
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in this subject. Please try again.",
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
                  <p className="text-white text-opacity-90 text-sm mt-1">
                    {SubjectsService.getSubjectArtwork(featuredSubject.name).attribution}
                  </p>
                </div>
              </div>
              <div className="relative w-full h-full">
                <Image
                  src={SubjectsService.getSubjectArtwork('algebra').img}
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
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Discover mathematical patterns in nature and music</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Examine the foundations of modern scientific thought</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
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
                    src={SubjectsService.getSubjectArtwork(subject.name).img}
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
            {t("quote_Thomas_Berger") || "The art and science of asking questions is the source of all knowledge."}
          </p>
          <p className="text-lg">— {t("Thomas_Berger") || "Thomas Berger"}</p>
        </div>
      </div>
    </div>
  );
}
