// app/[locale]/dashboard/community/_components/AdminForums.tsx
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
  MessageSquare,
  Eye,
  ThumbsUp,
  Clock,
  Tag,
  PinIcon,
  Flag,
  Check,
  Edit,
  X,
  Trash2,
  Settings,
  Plus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const AdminForums = ({ posts, isLoading, isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  if (isLoading) {
    // Same loading state as before
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">{t("forumManagement") || "Forum Management"}</h3>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1">
              <Settings className="h-4 w-4" />
              {t("settings") || "Settings"}
            </Button>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              {t("createCategory") || "Create Category"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{posts?.length || 28}</CardTitle>
              <CardDescription>{t("activePosts") || "Active Forum Posts"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-primary">+5</span>
                <span className="ml-1">{t("lastWeek") || "last week"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">215</CardTitle>
              <CardDescription>{t("totalComments") || "Total Comments"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-600">+24</span>
                <span className="ml-1">{t("lastWeek") || "last week"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">3</CardTitle>
              <CardDescription>{t("flaggedPosts") || "Flagged Posts"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-amber-500">
                <Flag className="h-3 w-3 mr-1" />
                <span>{t("needsReview") || "Needs review"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("moderationQueue") || "Moderation Queue"}</h3>
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
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <Edit className="h-3 w-3 mr-1" />
                {t("edit") || "Edit"}
              </Button>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                <Trash2 className="h-3 w-3 mr-1" />
                {t("delete") || "Delete"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-600" />
                  {t("inappropriateThread") || "Off-topic discussion"}
                </CardTitle>
                <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-400">
                  {t("urgent") || "Urgent"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>AN</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">Anonymous123</span>
                <span className="text-xs text-muted-foreground mx-1">•</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Yesterday</span>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm mb-2">
                {t("inappropriateThreadContent") || "This content has been flagged as inappropriate by multiple users..."}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 p-2 rounded">
                <Flag className="h-3 w-3 inline mr-1" />
                {t("reportCount") || "Reported 4 times: Inappropriate content/spam"}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                <Check className="h-3 w-3 mr-1" />
                {t("approve") || "Approve"}
              </Button>
              <Button variant="destructive" size="sm">
                <X className="h-3 w-3 mr-1" />
                {t("remove") || "Remove"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("pinnedAnnouncements") || "Pinned Announcements"}</h3>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("managePinned") || "Manage Pinned Content"}</CardTitle>
            <CardDescription>
              {t("pinnedDescription") || "Control which posts appear at the top of forums"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <PinIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{t("forumGuidelines") || "Forum Guidelines for Academic Discussions"}</p>
                    <p className="text-xs text-muted-foreground">{t("pinDate") || "Pinned since"}: 01/03/2025</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  {t("unpin") || "Unpin"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <PinIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{t("academicIntegrity") || "Academic Integrity Policy"}</p>
                    <p className="text-xs text-muted-foreground">{t("pinDate") || "Pinned since"}: 12/02/2025</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  {t("unpin") || "Unpin"}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto">
              {t("managePinnedPosts") || "Manage Pinned Posts"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminForums;
