// app/[locale]/dashboard/community/_components/TeacherStudyGroups.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  ArrowRight,
  Lock,
  Settings,
  BookText
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const TeacherStudyGroups = ({ groups, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  if (isLoading) {
    // Same loading state as StudentStudyGroups
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
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
        <h3 className="text-xl font-medium mb-4">{t("yourManagedGroups") || "Groups You Manage"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("physicsAdvanced") || "Advanced Physics Group"}</CardTitle>
                <Badge variant="outline">{t("moderator") || "Moderator"}</Badge>
              </div>
              <CardDescription>{t("physics") || "Physics"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <Users className="h-3 w-3 mr-1" />
                <span>24 {t("members") || "members"}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mr-1" />
                <span>6 {t("newMessages") || "new messages"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/${locale}/dashboard/community/groups/1/manage`)}
              >
                <Settings className="h-3 w-3" />
                {t("manage") || "Manage"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/${locale}/dashboard/community/groups/1/chat`)}
              >
                {t("open") || "Open"} <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("mathOlympiad") || "Math Olympiad Prep"}</CardTitle>
                <Badge variant="default">{t("admin") || "Admin"}</Badge>
              </div>
              <CardDescription>{t("mathematics") || "Mathematics"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <Users className="h-3 w-3 mr-1" />
                <span>18 {t("members") || "members"}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{t("upcomingSession") || "Upcoming session in 2 days"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/${locale}/dashboard/community/groups/2/manage`)}
              >
                <Settings className="h-3 w-3" />
                {t("manage") || "Manage"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/${locale}/dashboard/community/groups/2/chat`)}
              >
                {t("open") || "Open"} <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("otherGroups") || "Other Academic Groups"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {groups && groups.length > 0 ? groups.slice(0, 3).map((group) => (
            <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    {group.name}
                    {group.is_private && (
                      <Lock className="h-3 w-3 ml-2 text-muted-foreground" />
                    )}
                  </CardTitle>
                </div>
                <CardDescription>{group.subject?.name || t("general") || "General"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {group.member_count} {t("members") || "members"}
                </div>
                <Button size="sm" onClick={() => router.push(`/${locale}/dashboard/community/groups/${group.id}`)}>
                  {t("joinGroup") || "Join Group"}
                </Button>
              </CardFooter>
            </Card>
          )) : (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              {t("noGroupsFound") || "No study groups found."}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("teacherResources") || "Teacher Resources & Collaboration"}</h3>
        <Card className="border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-3 bg-primary/10">
                    <BookText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{t("lessonCollaboration") || "Lesson Collaboration"}</h4>
                    <p className="text-sm text-muted-foreground">{t("collaborateDescription") || "Share and develop teaching materials with peers"}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  {t("viewTeacherPortal") || "View Teacher Portal"}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-3 bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{t("academicCalendar") || "Academic Calendar"}</h4>
                    <p className="text-sm text-muted-foreground">{t("academicCalendarDescription") || "Important dates and educational events"}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  {t("viewCalendar") || "View Calendar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherStudyGroups;
