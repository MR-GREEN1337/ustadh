"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import StudentStudyGroups from '../_components/StudentStudyGroups';
import TeacherStudyGroups from '../_components/TeacherStudyGroups';
import AdminStudyGroups from '../_components/AdminStudyGroups';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GroupsPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [studyGroups, setStudyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchStudyGroups = async () => {
      setIsLoading(true);
      try {
        const groupsData = await CommunityService.getStudyGroups();
        setStudyGroups(groupsData);
      } catch (error) {
        console.error("Failed to fetch study groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyGroups();
  }, []);

  const filteredGroups = searchQuery
    ? studyGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : studyGroups;

  const tabFilteredGroups = activeTab === 'all'
    ? filteredGroups
    : activeTab === 'my'
      ? filteredGroups.filter(group => group.isMember)
      : activeTab === 'subject'
        ? filteredGroups.filter(group => group.subject) // Filter by current subject if needed
        : filteredGroups;

  return (
    <CommunityWebSocketProvider>
      <div className={`space-y-6 max-w-8xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("studyGroups") || "Study Groups"}</h1>
            <p className="text-muted-foreground text-sm">
              {t("studyGroupsDescription") || "Join or create study groups with peers to collaborate on subjects"}
            </p>
          </div>

          <UserConditionalComponent
            student={
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                {t("createGroup") || "Create Group"}
              </Button>
            }
            teacher={
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                {t("createGroup") || "Create Group"}
              </Button>
            }
            admin={
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                {t("manageGroups") || "Manage Groups"}
              </Button>
            }
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchGroups") || "Search study groups..."}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">{t("allGroups") || "All Groups"}</TabsTrigger>
            <TabsTrigger value="my">{t("myGroups") || "My Groups"}</TabsTrigger>
            <TabsTrigger value="subject">{t("subjectGroups") || "Subject Groups"}</TabsTrigger>
          </TabsList>
        </Tabs>

        <UserConditionalComponent
          student={<StudentStudyGroups groups={tabFilteredGroups} isLoading={isLoading} isRTL={isRTL} />}
          teacher={<TeacherStudyGroups groups={tabFilteredGroups} isLoading={isLoading} isRTL={isRTL} />}
          admin={<AdminStudyGroups groups={tabFilteredGroups} isLoading={isLoading} isRTL={isRTL} />}
          fallback={<StudentStudyGroups groups={tabFilteredGroups} isLoading={isLoading} isRTL={isRTL} />}
        />
      </div>
    </CommunityWebSocketProvider>
  );
};

export default GroupsPage;
