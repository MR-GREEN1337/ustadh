"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider, useCommunityWebSocket } from '@/providers/CommunityWebSocketProvider';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Users, BookOpen, Calendar, MessageSquare, Settings, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import { useAuth } from '@/providers/AuthProvider';

const StudyGroupChatContent = ({ groupId }) => {
  const { t } = useTranslation();
  const { connect, disconnect, sendMessage, messages, isConnected } = useCommunityWebSocket();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket for this group chat
    const wsUrl = CommunityService.getWebSocketURL('chat', groupId);
    connect(wsUrl);

    // Cleanup on component unmount
    return () => {
      disconnect();
    };
  }, [groupId, connect, disconnect]);

  useEffect(() => {
    // Update local chat messages when WebSocket messages arrive
    if (messages.length > 0) {
      // Filter for chat message types
      const newChatMessages = messages
        .filter(msg => msg.type === 'chat_message')
        .map(msg => ({
          id: Date.now(), // Temporary ID if not provided
          userId: msg.data.user_id,
          userName: msg.data.user_name,
          avatar: msg.data.user_avatar,
          content: msg.data.content,
          timestamp: msg.timestamp
        }));

      if (newChatMessages.length > 0) {
        setChatMessages(prev => [...prev, ...newChatMessages]);
      }
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    sendMessage({
      type: 'chat_message',
      content: newMessage
    });

    setNewMessage('');
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto p-2">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("noMessagesYet") || "No messages yet. Start the conversation!"}
          </div>
        ) : (
          chatMessages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={message.avatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(message.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h4 className="font-medium text-sm">
                    {message.userId === user?.id ? `${message.userName} (${t("you")})` : message.userName}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm mt-1">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder={t("typeMessage") || "Type your message..."}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const StudyGroupDetailPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale, groupId } = useParams();
  const isRTL = locale === "ar";
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch the specific group details
        const groups = await CommunityService.getStudyGroups();
        const foundGroup = groups.find(g => g.id.toString() === groupId.toString());

        if (foundGroup) {
          setGroup({
            ...foundGroup,
            // Add additional info that would come from a detailed API endpoint
            resources: [],
            events: [],
            members: []
          });

          // Check if user is a member - in a real app this would be part of the API response
          setIsMember(Math.random() > 0.5);
        }
      } catch (error) {
        console.error("Failed to fetch group details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleJoinGroup = async () => {
    if (isJoining) return;

    setIsJoining(true);
    try {
      await CommunityService.joinStudyGroup(groupId);
      setIsMember(true);
    } catch (error) {
      console.error("Failed to join group:", error);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">{t("groupNotFound") || "Study group not found"}</h2>
        <p className="mt-2 text-muted-foreground">{t("groupNotFoundDesc") || "The study group you're looking for doesn't exist or you don't have access to it."}</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/community/groups">
            {t("backToGroups") || "Back to Study Groups"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <CommunityWebSocketProvider>
      <div className={`space-y-6 max-w-6xl mx-auto ${isRTL ? 'text-right' : 'text-left'}`}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/dashboard">
                {t("dashboard") || "Dashboard"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/dashboard/community">
                {t("community") || "Community"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} href="/dashboard/community/groups">
                {t("studyGroups") || "Study Groups"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                {group.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{group.name}</CardTitle>
                    <CardDescription className="mt-2">{group.description}</CardDescription>
                  </div>
                  {isMember ? (
                    <Button variant="outline" size="sm">
                      {t("memberSettings") || "Member Settings"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleJoinGroup}
                      disabled={isJoining}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isJoining ?
                        (t("joining") || "Joining...") :
                        (t("joinGroup") || "Join Group")}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.member_count} {t("members") || "members"}
                  </Badge>
                  {group.subject && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      {group.subject.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="discussion" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="discussion">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("discussion") || "Discussion"}
                </TabsTrigger>
                <TabsTrigger value="resources">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t("resources") || "Resources"}
                </TabsTrigger>
                <TabsTrigger value="events">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("events") || "Events"}
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4 mr-2" />
                  {t("members") || "Members"}
                </TabsTrigger>
                <UserConditionalComponent
                  admin={
                    <TabsTrigger value="settings">
                      <Settings className="h-4 w-4 mr-2" />
                      {t("settings") || "Settings"}
                    </TabsTrigger>
                  }
                />
              </TabsList>

              <TabsContent value="discussion">
                {isMember ? (
                  <StudyGroupChatContent groupId={groupId} />
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <div className="mb-4">
                        <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">
                        {t("joinToParticipate") || "Join this group to participate in discussions"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("joinGroupDesc") || "Members can send messages, share resources, and participate in events"}
                      </p>
                      <Button onClick={handleJoinGroup} disabled={isJoining}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isJoining ?
                          (t("joining") || "Joining...") :
                          (t("joinGroup") || "Join Group")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resources">
                <Card>
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium mt-4">
                      {t("noResources") || "No resources yet"}
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      {t("noResourcesDesc") || "This group doesn't have any shared resources yet"}
                    </p>
                    {isMember && (
                      <Button className="mt-4">
                        {t("addResource") || "Add Resource"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events">
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium mt-4">
                      {t("noEvents") || "No upcoming events"}
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      {t("noEventsDesc") || "This group doesn't have any scheduled events yet"}
                    </p>
                    {isMember && (
                      <Button className="mt-4">
                        {t("createEvent") || "Create Event"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members">
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium mt-4">
                      {group.member_count} {t("members") || "members"}
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      {t("membersDesc") || "Join the group to see all members"}
                    </p>
                    {!isMember && (
                      <Button className="mt-4" onClick={handleJoinGroup} disabled={isJoining}>
                        {isJoining ?
                          (t("joining") || "Joining...") :
                          (t("joinGroup") || "Join Group")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("aboutGroup") || "About Group"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {group.member_count} {t("members") || "members"}
                  </span>
                </div>
                {group.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{group.subject.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("activeDiscussions") || "Active discussions"}
                  </span>
                </div>
              </CardContent>
{!isMember && (
                <CardFooter>
                  <Button className="w-full" onClick={handleJoinGroup} disabled={isJoining}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isJoining ?
                      (t("joining") || "Joining...") :
                      (t("joinGroup") || "Join Group")}
                  </Button>
                </CardFooter>
              )}
            </Card>

            {group.created_by && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("groupAdmin") || "Group Admin"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {group.created_by.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-medium">{group.created_by.full_name}</h4>
                      <p className="text-xs text-muted-foreground">{t("admin") || "Admin"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("relatedGroups") || "Related Groups"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-center py-2 text-muted-foreground">
                  {t("loadingRelatedGroups") || "Loading related groups..."}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full text-sm" asChild>
                  <Link href="/dashboard/community/groups">
                    {t("exploreMoreGroups") || "Explore more groups"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CommunityWebSocketProvider>
  );
};

export default StudyGroupDetailPage;
