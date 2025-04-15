"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import StudentForums from '../_components/StudentForums';
import TeacherForums from '../_components/TeacherForums';
import AdminForums from '../_components/AdminForums';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const ForumsPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [forumPosts, setForumPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchForumPosts = async () => {
      setIsLoading(true);
      try {
        const postsData = await CommunityService.getForumPosts();
        setForumPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch forum posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForumPosts();
  }, []);

  const filteredPosts = searchQuery
    ? forumPosts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : forumPosts;

  return (
    <CommunityWebSocketProvider>
      <div className={`max-w-8xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t("forums") || "Forums"}</h1>
            <p className="text-muted-foreground text-sm">
              {t("forumsDescription") || "Discuss topics, ask questions, and share insights with the community"}
            </p>
          </div>

          <UserConditionalComponent
            student={
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                {t("newPost") || "New Post"}
              </Button>
            }
            teacher={
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                {t("newPost") || "New Post"}
              </Button>
            }
            admin={
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                {t("manageForums") || "Manage Forums"}
              </Button>
            }
          />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchForums") || "Search forum posts..."}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <UserConditionalComponent
          student={<StudentForums posts={filteredPosts} isLoading={isLoading} isRTL={isRTL} />}
          teacher={<TeacherForums posts={filteredPosts} isLoading={isLoading} isRTL={isRTL} />}
          admin={<AdminForums posts={filteredPosts} isLoading={isLoading} isRTL={isRTL} />}
          fallback={<StudentForums posts={filteredPosts} isLoading={isLoading} isRTL={isRTL} />}
        />
      </div>
    </CommunityWebSocketProvider>
  );
};

export default ForumsPage;
