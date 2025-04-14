// app/[locale]/dashboard/community/_components/TeacherForums.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  Clock,
  Tag,
  PinIcon,
  Flag,
  Check,
  Edit
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const TeacherForums = ({ posts, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  if (isLoading) {
    // Same loading state as StudentForums
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium mb-4">{t("teacherAnnouncements") || "Teacher Announcements"}</h3>
        <Card className="border border-primary/20 bg-primary/5 mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <PinIcon className="h-4 w-4 text-primary" />
                {t("forumGuidelines") || "Forum Guidelines for Academic Discussions"}
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {t("official") || "Official"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <span className="text-xs">{t("administration") || "Platform Administration"}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {t("forumGuidelinesDescription") || "Guidelines for maintaining a constructive academic environment for knowledge sharing. All teachers and students are expected to follow these community standards."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="ghost" size="sm">
              {t("readGuidelines") || "Read Guidelines"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">{t("discussionsRequiringAttention") || "Discussions Requiring Attention"}</h3>
          <Button size="sm" variant="outline">
            {t("viewModQueue") || "View Moderation Queue"}
          </Button>
        </div>
        <div className="space-y-4">
          <Card className="border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="h-4 w-4 text-amber-600" />
                  {t("helpWithMathProblem") || "Help with difficult calculus problem"}
                </CardTitle>
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                  {t("flagged") || "Flagged"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>ST</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">Student123</span>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm mb-2">
                {t("flaggedPostContent") || "I'm completely stuck on this calculus problem. Can someone please solve it for me? It's due tomorrow..."}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 p-2 rounded">
                <Flag className="h-3 w-3 inline mr-1" />
                {t("flagReason") || "Flagged for: Potential homework completion request"}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                <Check className="h-3 w-3 mr-1" />
                {t("approve") || "Approve"}
              </Button>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                <Edit className="h-3 w-3 mr-1" />
                {t("moderate") || "Moderate"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("teacherDiscussions") || "Teacher Discussions"}</h3>
        <div className="space-y-4">
          <Card className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("teachingStrategies") || "Teaching Strategies for Abstract Concepts"}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>FN</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">Prof. Fatima Nouri</span>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Yesterday</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {t("teachingStrategiesContent") || "I've been experimenting with new methods to teach abstract mathematical concepts. Would love to share insights and hear other teachers' approaches..."}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {t("pedagogy") || "Pedagogy"}
                </Badge>
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {t("mathematics") || "Mathematics"}
                </Badge>
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {t("teachingMethods") || "Teaching Methods"}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  38
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  12
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  7
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/${locale}/dashboard/community/forums/teachers/1`)}
              >
                {t("joinDiscussion") || "Join Discussion"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("evaluationTechniques") || "Evaluation Techniques for Group Projects"}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>HR</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">Hassan Razak</span>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {t("evaluationTechniquesContent") || "How do you handle grading collaborative projects? I'm looking for fair assessment methods that account for individual contributions while encouraging teamwork..."}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {t("assessment") || "Assessment"}
                </Badge>
                <Badge variant="outline" className="text-xs bg-muted/50">
                  {t("groupWork") || "Group Work"}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  42
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  15
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  11
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/${locale}/dashboard/community/forums/teachers/2`)}
              >
                {t("joinDiscussion") || "Join Discussion"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherForums;
