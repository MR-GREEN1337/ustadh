"use client";

import React from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, BookOpen, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserConditionalComponent from '@/components/UserConditionalComponent';

const CommunityPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";

  const communityOptions = [
    {
      title: t("studyGroups") || "Study Groups",
      description: t("studyGroupsDescription") || "Join or create study groups with peers to collaborate on subjects",
      icon: <Users className="h-6 w-6" />,
      href: `/dashboard/community/groups`,
      color: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: t("forums") || "Forums",
      description: t("forumsDescription") || "Discuss topics, ask questions, and share insights with the community",
      icon: <MessageSquare className="h-6 w-6" />,
      href: `/dashboard/community/forums`,
      color: "bg-violet-100 dark:bg-violet-900/20"
    },
    {
      title: t("leaderboard") || "Leaderboard",
      description: t("leaderboardDescription") || "See top contributors and most active community members",
      icon: <Trophy className="h-6 w-6" />,
      href: `/dashboard/community/leaderboard`,
      color: "bg-emerald-100 dark:bg-emerald-900/20"
    }
  ];

  return (
    <CommunityWebSocketProvider>
      <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-tight">{t("community") || "Community"}</h1>
          <p className="text-muted-foreground">
            {t("communityDescription") || "Connect with peers, join study groups, and share knowledge."}
          </p>
        </div>

        <UserConditionalComponent
          admin={
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">{t("adminTools") || "Admin Tools"}</h3>
              <div className="flex gap-3">
                <Button size="sm" variant="outline">
                  {t("manageCommunity") || "Manage Community"}
                </Button>
                <Button size="sm" variant="outline">
                  {t("moderationQueue") || "Moderation Queue"}
                </Button>
                <Button size="sm" variant="outline">
                  {t("communityAnalytics") || "Community Analytics"}
                </Button>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communityOptions.map((option) => (
            <Link href={option.href} key={option.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${option.color}`}>
                    {option.icon}
                  </div>
                  <CardTitle className="mt-3">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <div className="text-sm text-primary">
                    {t("explore") || "Explore"} →
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </CommunityWebSocketProvider>
  );
};

export default CommunityPage;
