// app/[locale]/dashboard/community/_components/AdminStudyGroups.tsx
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
  Shield,
  AlertCircle,
  Settings,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const AdminStudyGroups = ({ groups, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  if (isLoading) {
    // Same loading state as before
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">{t("communityOverview") || "Community Overview"}</h3>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1">
              <Settings className="h-4 w-4" />
              {t("settings") || "Settings"}
            </Button>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              {t("createGroup") || "Create Group"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{groups?.length || 12}</CardTitle>
              <CardDescription>{t("activeGroups") || "Active Groups"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-primary">+2</span>
                <span className="ml-1">{t("lastWeek") || "last week"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">342</CardTitle>
              <CardDescription>{t("activeParticipants") || "Active Participants"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-600">+28</span>
                <span className="ml-1">{t("lastWeek") || "last week"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">4</CardTitle>
              <CardDescription>{t("reportedIssues") || "Reported Issues"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-amber-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>{t("requiresAttention") || "Requires attention"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("managedGroups") || "All Study Groups"}</h3>
        <div className="space-y-4">
          {groups && groups.length > 0 ? groups.map((group) => (
            <Card key={group.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-lg">{group.name}</h4>
                      <Badge variant={group.is_private ? "outline" : "secondary"}>
                        {group.is_private ? (t("private") || "Private") : (t("public") || "Public")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.member_count} {t("members") || "members"}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {Math.floor(Math.random() * 100)} {t("messages") || "messages"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t("createdOn") || "Created on"} {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => router.push(`/${locale}/dashboard/community/admin/groups/${group.id}`)}
                    >
                      <Shield className="h-3 w-3" />
                      {t("manage") || "Manage"}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => router.push(`/${locale}/dashboard/community/groups/${group.id}`)}
                    >
                      {t("view") || "View"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("noGroupsFound") || "No study groups found."}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("communityReports") || "Community Reports"}</h3>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("recentReports") || "Recent Reports & Moderation"}</CardTitle>
            <CardDescription>
              {t("reportsDescription") || "Manage reported content and community issues"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">{t("inappropriateContent") || "Inappropriate Content in Physics Group"}</p>
                    <p className="text-xs text-muted-foreground">{t("reportedBy") || "Reported by"}: Teacher123</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive">
                  {t("review") || "Review"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-md">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">{t("spamReports") || "Spam Reports in Arabic Literature Forum"}</p>
                    <p className="text-xs text-muted-foreground">{t("multipleReports") || "Multiple reports"}: 3</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  {t("review") || "Review"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto">
              {t("viewAllReports") || "View All Reports"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminStudyGroups;
