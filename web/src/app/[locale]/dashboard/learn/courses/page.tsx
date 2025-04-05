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
  Clock,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { CoursesService } from '@/services/CoursesService';

interface Course {
  id: number;
  title: string;
  description: string;
  subject_id: number;
  subject_name: string;
  level: string;
  duration_minutes: number;
  thumbnail_url: string | null;
  enrollment_count?: number;
  is_enrolled?: boolean;
  completion_percentage?: number;
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<{id: number, name: string}[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [featuredCourse, setFeaturedCourse] = useState<Course | null>(null);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);

        // Use CoursesService to fetch all courses
        const response = await CoursesService.fetchAllCourses();

        if (response && response.courses) {
          setCourses(response.courses);

          // Select a featured course
          const enrolledCourses = response.courses.filter((c: Course) => c.is_enrolled);
          if (enrolledCourses.length > 0) {
            setFeaturedCourse(enrolledCourses[Math.floor(Math.random() * enrolledCourses.length)]);
          } else if (response.courses.length > 0) {
            setFeaturedCourse(response.courses[Math.floor(Math.random() * response.courses.length)]);
          }

          // Extract unique subjects
          const uniqueSubjects = [...new Set(response.courses.map((c: Course) => ({
            id: c.subject_id,
            name: c.subject_name
          })))];

          // Remove duplicates (because we're creating objects in the map)
          const subjectMap = new Map();
          response.courses.forEach((c: Course) => {
            if (!subjectMap.has(c.subject_id)) {
              subjectMap.set(c.subject_id, { id: c.subject_id, name: c.subject_name });
            }
          });
          setSubjects(Array.from(subjectMap.values()));

          // Extract unique levels
          const uniqueLevels = [...new Set(response.courses.map((c: Course) => c.level))];
          setLevels(uniqueLevels as string[]);
        } else {
          // Handle case where no courses are returned
          toast({
            title: "No Courses Found",
            description: "No courses are currently available.",
            variant: "destructive"
          });
          setCourses([]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Connection Error",
          description: "Failed to load courses. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user, toast]);

  // Handle enrollment
  const handleEnroll = async (courseId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in courses",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use CoursesService to enroll in course
      const response = await CoursesService.enrollInCourse(courseId);

      if (response) {
        // Update the local state
        setCourses(courses.map(course =>
          course.id === courseId
            ? { ...course, is_enrolled: true, enrollment_count: (course.enrollment_count || 0) + 1 }
            : course
        ));

        toast({
          title: "Enrolled Successfully",
          description: "You've been enrolled in this course",
          variant: "default"
        });

        // Navigate to the course page
        router.push(`/${locale}/dashboard/learn/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in this course. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter courses by selected filters
  const filteredCourses = courses.filter(course => {
    const matchesSubject = selectedSubject === null || course.subject_id === selectedSubject;
    const matchesLevel = selectedLevel === null || course.level === selectedLevel;
    return matchesSubject && matchesLevel;
  });

  const isRTL = locale === "ar";

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} ${t("minutes") || "minutes"}`;
    } else if (mins === 0) {
      return `${hours} ${hours === 1 ? (t("hour") || "hour") : (t("hours") || "hours")}`;
    } else {
      return `${hours} ${hours === 1 ? (t("hour") || "hour") : (t("hours") || "hours")} ${mins} ${t("minutes") || "minutes"}`;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="flex items-center mb-8">
        <Link href={`/${locale}/dashboard/learn`}>
          <Button variant="ghost" size="sm" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("back") || "Back"}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{t("exploreCourses") || "Explore Courses"}</h1>
      </div>

      {/* Featured Course */}
      {!isLoading && featuredCourse && (
        <div className="mb-16 overflow-hidden rounded-xl border shadow-md bg-card">
          <div className="flex flex-col lg:flex-row">
            <div className="relative w-full lg:w-1/2 h-64 lg:h-auto overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-30 z-10 flex items-end p-6">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {featuredCourse.is_enrolled ? "Continue Learning" : "Featured Course"}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white">{featuredCourse.title}</h2>
                  <p className="text-white text-opacity-90 text-sm mt-1">
                    {featuredCourse.subject_name}
                  </p>
                </div>
              </div>
              <div className="relative w-full h-full">
                <Image
                  src={featuredCourse.thumbnail_url || CoursesService.getCourseThumbnail(featuredCourse.title)}
                  alt={featuredCourse.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-6 lg:p-8 flex flex-col justify-between lg:w-1/2">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{featuredCourse.level}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {featuredCourse.enrollment_count?.toLocaleString() || 0} enrolled
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatDuration(featuredCourse.duration_minutes)}
                  </div>
                </div>
                <p className="text-lg mb-4">{featuredCourse.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Interactive lessons with hands-on exercises</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Expert-guided tutorials and real-world examples</span>
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                    <span>Earn a certificate upon completion</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                {featuredCourse.is_enrolled ? (
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href={`/${locale}/dashboard/learn/courses/${featuredCourse.id}`}>
                      Continue Learning {featuredCourse.completion_percentage ? `(${featuredCourse.completion_percentage}%)` : ''}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => handleEnroll(featuredCourse.id)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enroll Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 space-y-6">
        {/* Subject filter */}
        {subjects.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t("filterBySubject") || "Filter by Subject"}</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedSubject === null ? "default" : "outline"}
                onClick={() => setSelectedSubject(null)}
              >
                {t("allSubjects") || "All Subjects"}
              </Button>
              {subjects.map(subject => (
                <Button
                  key={subject.id}
                  variant={selectedSubject === subject.id ? "default" : "outline"}
                  onClick={() => setSelectedSubject(subject.id)}
                >
                  {subject.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Level filter */}
        {levels.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">{t("filterByLevel") || "Filter by Level"}</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedLevel === null ? "default" : "outline"}
                onClick={() => setSelectedLevel(null)}
              >
                {t("allLevels") || "All Levels"}
              </Button>
              {levels.map(level => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "outline"}
                  onClick={() => setSelectedLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Course grid */}
      <h2 className="text-2xl font-bold mb-6">{t("filterByLevel") || "All Courses"}</h2>

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
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <Card key={course.id} className="overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/50">
              <div className="aspect-[4/3] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10 flex items-end p-4">
                  <div>
                    <Badge variant="outline" className="mb-2 bg-black/30 text-white border-white/20">
                      {course.level}
                    </Badge>
                    <h3 className="text-xl font-bold text-white">{course.title}</h3>
                  </div>
                </div>
                {course.is_enrolled && course.completion_percentage && course.completion_percentage > 0 && (
                  <div className="absolute top-2 right-2 z-20">
                    <div className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                      {course.completion_percentage}% Complete
                    </div>
                  </div>
                )}
                <div className="relative w-full h-full">
                  <Image
                    src={course.thumbnail_url || CoursesService.getCourseThumbnail(course.title)}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-primary">
                    {course.subject_name}
                  </div>
                  {course.is_enrolled && (
                    <Badge variant="secondary">Enrolled</Badge>
                  )}
                </div>
                <div className="flex gap-3 items-center text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {course.enrollment_count?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatDuration(course.duration_minutes)}
                  </div>
                </div>
                <p className="mb-6 line-clamp-3">{course.description}</p>
                {course.is_enrolled ? (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/${locale}/dashboard/learn/courses/${course.id}`}>
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleEnroll(course.id)}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
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
          <h3 className="text-xl font-medium mb-2">{t("noCoursesFound") || "No courses found"}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t("tryChangingFilters") || "Try changing your filters or check back later for new courses"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => {
              setSelectedSubject(null);
              setSelectedLevel(null);
            }}>
              {t("resetFilters") || "Reset Filters"}
            </Button>
            <Button variant="default" asChild>
              <Link href={`/${locale}/dashboard/learn/subjects`}>
                {t("browseSubjects") || "Browse Subjects"}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Quote section */}
      <div className="mt-16 mb-8 p-8 bg-black text-white rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black mix-blend-overlay"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-2xl italic mb-4">
            {t("quote_mandela") || "Education is the most powerful weapon which you can use to change the world."}
          </p>
          <p className="text-lg">— {t("Nelson_Mandela") || "Nelson Mandela"}</p>
        </div>
      </div>
    </div>
  );
}
