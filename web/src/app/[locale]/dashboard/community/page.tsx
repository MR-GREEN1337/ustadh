// app/[locale]/dashboard/community/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  MessageSquare,
  BookOpen,
  Search,
  Plus
} from 'lucide-react';
import StudentStudyGroups from './_components/StudentStudyGroups';
import StudentResources from './_components/StudentResources';
import StudentForums from './_components/StudentForums';
import TeacherForums from './_components/TeacherForums';
import TeacherStudyGroups from './_components/TeacherStudyGroups';
import TeacherResources from './_components/TeacherResources';
import AdminStudyGroups from './_components/AdminStudyGroups';
import AdminForums from './_components/AdminForums';
import AdminResources from './_components/AdminResources';

const CommunityPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [activeTab, setActiveTab] = useState("groups");
  const [forumPosts, setForumPosts] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      setIsLoading(true);
      try {
        const [groupsData, postsData] = await Promise.all([
          CommunityService.getStudyGroups(),
          CommunityService.getForumPosts()
        ]);

        setStudyGroups(groupsData);
        setForumPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch community data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  return (
    <CommunityWebSocketProvider>
      <div className={`space-y-8 max-w-5xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="space-y-2">
          <h1 className="text-3xl font-light tracking-tight">{t("community") || "Community"}</h1>
          <p className="text-muted-foreground text-sm">{t("communityDescription") || "Connect with peers, join study groups, and share knowledge."}</p>
        </div>

        <Tabs defaultValue="groups" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="groups">
                <Users className="h-4 w-4 mr-2" />
                {t("studyGroups") || "Study Groups"}
              </TabsTrigger>
              <TabsTrigger value="forums">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("forums") || "Forums"}
              </TabsTrigger>
              <TabsTrigger value="resources">
                <BookOpen className="h-4 w-4 mr-2" />
                {t("resources") || "Resources"}
              </TabsTrigger>
            </TabsList>

            <UserConditionalComponent
              student={
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  {activeTab === "groups"
                    ? (t("createGroup") || "Create Group")
                    : activeTab === "forums"
                      ? (t("newPost") || "New Post")
                      : (t("addResource") || "Add Resource")}
                </Button>
              }
              teacher={
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  {activeTab === "groups"
                    ? (t("createGroup") || "Create Group")
                    : activeTab === "forums"
                      ? (t("newPost") || "New Post")
                      : (t("addResource") || "Add Resource")}
                </Button>
              }
              admin={
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  {t("manage") || "Manage Community"}
                </Button>
              }
            />
          </div>

          <div className="my-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === "groups"
                    ? t("searchGroups") || "Search study groups..."
                    : activeTab === "forums"
                      ? t("searchForums") || "Search forum posts..."
                      : t("searchResources") || "Search resources..."
                }
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="groups" className="space-y-4 mt-4">
            <UserConditionalComponent
              student={<StudentStudyGroups groups={studyGroups} isLoading={isLoading} isRTL={isRTL} />}
              teacher={<TeacherStudyGroups groups={studyGroups} isLoading={isLoading} isRTL={isRTL} />}
              admin={<AdminStudyGroups groups={studyGroups} isLoading={isLoading} isRTL={isRTL} />}
              fallback={<StudentStudyGroups groups={studyGroups} isLoading={isLoading} isRTL={isRTL} />}
            />
          </TabsContent>

          <TabsContent value="forums" className="space-y-4 mt-4">
            <UserConditionalComponent
              student={<StudentForums posts={forumPosts} isLoading={isLoading} isRTL={isRTL} />}
              teacher={<TeacherForums posts={forumPosts} isLoading={isLoading} isRTL={isRTL} />}
              admin={<AdminForums posts={forumPosts} isLoading={isLoading} isRTL={isRTL} />}
              fallback={<StudentForums posts={forumPosts} isLoading={isLoading} isRTL={isRTL} />}
            />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 mt-4">
            <UserConditionalComponent
              student={<StudentResources isRTL={isRTL} />}
              teacher={<TeacherResources isRTL={isRTL} />}
              admin={<AdminResources isRTL={isRTL} />}
              fallback={<StudentResources isRTL={isRTL} />}
            />
          </TabsContent>
        </Tabs>
      </div>
    </CommunityWebSocketProvider>
  );
};

export default CommunityPage;
