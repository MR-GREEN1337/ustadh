"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { WhiteboardService, WhiteboardSession } from '@/services/WhiteboardService';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Archive,
  Copy,
  Clock,
  Calendar,
  Pencil,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  BookOpen,
  Brain,
  ChevronRight,
  Filter,
  SortDesc,
} from 'lucide-react';

const WhiteboardSessionsList = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isRTL = locale === 'ar';

  // State
  const [sessions, setSessions] = useState<WhiteboardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);

        // Prepare parameters
        const params: any = {};
        if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

        const data = await WhiteboardService.getSessions(params);
        setSessions(data.sessions || []);
      } catch (error) {
        console.error('Error fetching whiteboard sessions:', error);
        setError('Failed to load sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [selectedStatus]);

  // Handle session creation - simplified to create with default values
  const handleCreateSession = async () => {
    try {
      const whiteboardService = new WhiteboardService();
      const newSession = await whiteboardService.createSession({
        title: "Untitled Session",
        description: "My mathematical whiteboard session",
        ai_enabled: true
      });

      // Navigate to the new session
      router.push(`/${locale}/dashboard/tutor/whiteboard/${newSession.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session. Please try again.');
    }
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.description && session.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Function to get status badge based on session status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <PlayCircle className="w-3 h-3 mr-1" />
            {t('active') || 'Active'}
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <PauseCircle className="w-3 h-3 mr-1" />
            {t('paused') || 'Paused'}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('completed') || 'Completed'}
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <Archive className="w-3 h-3 mr-1" />
            {t('archived') || 'Archived'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">{t('whiteboardSessions') || 'Mathematical Canvas'}</h1>
          <p className="text-muted-foreground font-light mt-1">
            {t('whiteboardDescription') || 'Visually solve problems and collaborate with interactive math tools.'}
          </p>
        </div>

        <div>
          <Button
            onClick={handleCreateSession}
            className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white font-serif"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newWhiteboardSession') || 'New Session'}
          </Button>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder={t('searchWhiteboardSessions') || 'Search your sessions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-serif">
                <Filter className="h-4 w-4 mr-2" />
                {selectedStatus === 'all'
                  ? (t('status') || 'Status')
                  : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black/90 border-stone-200 dark:border-stone-700">
              <DropdownMenuLabel className="font-serif">{t('status') || 'Status'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStatus('all')}>
                {t('allStatuses') || 'All Statuses'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                {t('active') || 'Active'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('paused')}>
                {t('paused') || 'Paused'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('completed')}>
                {t('completed') || 'Completed'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus('archived')}>
                {t('archived') || 'Archived'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800 p-0">
          <TabsTrigger value="all" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            {t('all') || 'All'}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            {t('active') || 'Active'}
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            {t('completed') || 'Completed'}
          </TabsTrigger>
          <TabsTrigger value="archived" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            {t('archived') || 'Archived'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderSessionsList(filteredSessions)}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {renderSessionsList(filteredSessions.filter(session => session.status === 'active' || session.status === 'paused'))}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {renderSessionsList(filteredSessions.filter(session => session.status === 'completed'))}
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {renderSessionsList(filteredSessions.filter(session => session.status === 'archived'))}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Function to render sessions list
  function renderSessionsList(sessionsList: WhiteboardSession[]) {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md">
          {error}
        </div>
      );
    }

    if (sessionsList.length === 0) {
      return (
        <div className="text-center py-12 bg-[#f8f5f0] dark:bg-black/10 rounded-lg border border-stone-200 dark:border-stone-800">
          <div className="mb-4">
            <svg width="60" height="60" viewBox="0 0 60 60" className="inline-block text-muted-foreground">
              <rect x="10" y="10" width="40" height="40" stroke="currentColor" strokeWidth="1" fill="none" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="currentColor" strokeWidth="1" />
              <line x1="40" y1="20" x2="20" y2="40" stroke="currentColor" strokeWidth="1" />
              <circle cx="30" cy="30" r="15" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <h3 className="font-serif text-lg mb-2">{t('noWhiteboardSessions') || 'No sessions found'}</h3>
          <p className="text-muted-foreground font-light max-w-md mx-auto mb-6">
            {searchQuery
              ? t('noSearchResults') || 'No sessions match your search criteria'
              : t('noWhiteboardSessionsYet') || 'You haven\'t created any whiteboard sessions yet'}
          </p>
          <Button onClick={handleCreateSession} className="font-serif">
            <Plus className="h-4 w-4 mr-2" />
            {t('createFirstSession') || 'Create your first session'}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessionsList.map((session) => (
          <Card
            key={session.id}
            className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800 hover:border-primary/30 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="font-serif text-lg">{session.title}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-black/90 border-stone-200 dark:border-stone-700">
                    <DropdownMenuLabel>{t('sessionOptions') || 'Session Options'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/tutor/whiteboard/${session.id}`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {session.status === 'active' || session.status === 'paused'
                        ? (t('continueSession') || 'Continue Session')
                        : (t('viewSession') || 'View Session')
                      }
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      {t('duplicate') || 'Duplicate'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          const whiteboardService = new WhiteboardService();
                          await whiteboardService.archiveSession(session.id);
                          // Refresh the sessions list
                          setSessions(prevSessions =>
                            prevSessions.map(s =>
                              s.id === session.id ? { ...s, status: 'archived' } : s
                            )
                          );
                        } catch (error) {
                          console.error('Error archiving session:', error);
                          setError('Failed to archive session. Please try again.');
                        }
                      }}
                      className="text-destructive"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      {t('archive') || 'Archive'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="text-sm mt-1">
                {session.description || (t('noDescription') || 'No description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center justify-between mb-4">
                {getStatusBadge(session.status)}
                {session.ai_enabled && (
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    <Brain className="w-3 h-3 mr-1" />
                    {t('aiEnabled') || 'AI Enabled'}
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-2" />
                  <span>{t('created') || 'Created'}: {formatDate(session.created_at)}</span>
                </div>
                {session.end_time && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-2" />
                    <span>{t('completed') || 'Completed'}: {formatDate(session.end_time)}</span>
                  </div>
                )}
                {session.duration_seconds && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-2" />
                    <span>
                      {t('duration') || 'Duration'}: {Math.floor(session.duration_seconds / 60)} min
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                variant="ghost"
                className="w-full justify-between font-serif"
                onClick={() => router.push(`/${locale}/dashboard/tutor/whiteboard/${session.id}`)}
              >
                <span>
                  {session.status === 'active' || session.status === 'paused'
                    ? (t('continueSession') || 'Continue Session')
                    : (t('viewSession') || 'View Session')
                  }
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
};

export default WhiteboardSessionsList;
