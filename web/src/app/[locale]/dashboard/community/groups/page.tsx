// app/[locale]/dashboard/community/groups/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import StudentStudyGroups from '../_components/StudentStudyGroups';
import TeacherStudyGroups from '../_components/TeacherStudyGroups';
import AdminStudyGroups from '../_components/AdminStudyGroups';

const StudyGroupsPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [studyGroups, setStudyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleCreateGroup = () => {
    router.push(`/${locale}/dashboard/community/groups/create`);
  };

  return (
    <CommunityWebSocketProvider>
      <div className={`max-w-6xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("studyGroups") || "Study Groups"}</h1>
            <p className="text-muted-foreground text-sm">
              {t("studyGroupsDescription") || "Join or create study groups with peers to collaborate on subjects"}
            </p>
          </div>

          <UserConditionalComponent
            student={
              <Button size="sm" className="gap-1" onClick={handleCreateGroup}>
                <Plus className="h-4 w-4" />
                {t("createGroup") || "Create Group"}
              </Button>
            }
            teacher={
              <Button size="sm" className="gap-1" onClick={handleCreateGroup}>
                <Plus className="h-4 w-4" />
                {t("createGroup") || "Create Group"}
              </Button>
            }
            admin={
              <Button size="sm" className="gap-1" onClick={handleCreateGroup}>
                <Plus className="h-4 w-4" />
                {t("createGroup") || "Create Group"}
              </Button>
            }
          />
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchGroups") || "Search study groups..."}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <UserConditionalComponent
          student={<StudentStudyGroups groups={filteredGroups} isLoading={isLoading} isRTL={isRTL} />}
          teacher={<TeacherStudyGroups groups={filteredGroups} isLoading={isLoading} isRTL={isRTL} />}
          admin={<AdminStudyGroups groups={filteredGroups} isLoading={isLoading} isRTL={isRTL} />}
          fallback={<StudentStudyGroups groups={filteredGroups} isLoading={isLoading} isRTL={isRTL} />}
        />
      </div>
    </CommunityWebSocketProvider>
  );
};

export default StudyGroupsPage;
