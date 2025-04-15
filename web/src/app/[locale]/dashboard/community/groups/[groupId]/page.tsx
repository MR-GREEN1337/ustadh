"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import { CommunityService } from '@/services/CommunityService';
import { CommunityWebSocketProvider } from '@/providers/CommunityWebSocketProvider';
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

const StudyGroupDetailPage = () => {
  const { t } = useTranslation();
  const { locale, groupId } = useParams();
  const isRTL = locale === "ar";
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('discussion');

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call when implemented
        const mockGroup = {
          id: groupId,
          name: "Mathematics Advanced Concepts",
          description: "A group dedicated to exploring and discussing advanced mathematics concepts, problem-solving strategies, and preparing for competitions.",
          subject: {
            id: 1,
            name: "Mathematics",
            icon: "calculator",
            color: "bg-blue-100 dark:bg-blue-900/20"
          },
          gradeLevel: "bac_2",
          memberCount: 28,
          isMember: true,
          isAdmin: false,
          createdAt: "2024-12-10T14:30:00Z",
          lastActive: "2025-04-10T09:15:00Z",
          members: [
            { id: 1, name: "Mariam Ahmed", avatar: "", role: "admin", joinedAt: "2024-12-10T14:30:00Z" },
            { id: 2, name: "Youssef Hassan", avatar: "", role: "moderator", joinedAt: "2024-12-11T10:20:00Z" },
            { id: 3, name: "Noor El-Din", avatar: "", role: "member", joinedAt: "2024-12-11T16:45:00Z" },
            { id: 4, name: "Sara Mahmoud", avatar: "", role: "member", joinedAt: "2024-12-12T09:30:00Z" },
            { id: 5, name: "Ahmed Khaled", avatar: "", role: "member", joinedAt: "2024-12-14T11:10:00Z" },
          ],
          resources: [
            { id: 1, title: "Calculus Reference Guide", type: "document", addedBy: "Mariam Ahmed", addedAt: "2025-01-05T14:30:00Z" },
            { id: 2, title: "Probability Problem Set", type: "worksheet", addedBy: "Youssef Hassan", addedAt: "2025-01-10T10:20:00Z" },
            { id: 3, title: "Linear Algebra Summary", type: "notes", addedBy: "Sara Mahmoud", addedAt: "2025-01-15T16:45:00Z" },
          ],
          events: [
            { id: 1, title: "Group Study Session", date: "2025-04-20T15:00:00Z", duration: 60, attendees: 12 },
            { id: 2, title: "Math Competition Prep", date: "2025-04-25T16:30:00Z", duration: 90, attendees: 8 },
          ]
        };

        // Mock messages
        const mockMessages = [
          { id: 1, userId: 2, userName: "Youssef Hassan", avatar: "", content: "Has anyone solved the differential equations problem set? I'm stuck on problem #3.", timestamp: "2025-04-14T10:30:00Z" },
          { id: 2, userId: 3, userName: "Noor El-Din", avatar: "", content: "I worked through it yesterday. For #3, you need to use substitution first, then separate variables.", timestamp: "2025-04-14T10:45:00Z" },
          { id: 3, userId: 4, userName: "Sara Mahmoud", avatar: "", content: "I found a helpful video that explains the approach, I'll share the link when I get home.", timestamp: "2025-04-14T11:05:00Z" },
          { id: 4, userId: 5, userName: "Ahmed Khaled", avatar: "", content: "Has anyone started preparing for the upcoming mathematics competition? I'd like to form a small practice group.", timestamp: "2025-04-14T14:20:00Z" },
          { id: 5, userId: 1, userName: "Mariam Ahmed", avatar: "", content: "I'm interested in the practice group! I've participated in two competitions before and could share some strategies.", timestamp: "2025-04-14T15:10:00Z" },
        ];

        setGroup(mockGroup);
        setMessages(mockMessages);
      } catch (error) {
        console.error("Failed to fetch group details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    // In a real app, you'd send this to your API
    const newMsg = {
      id: messages.length + 1,
      userId: 0, // Current user
      userName: "Current User", // Would be fetched from auth context
      avatar: "",
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
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
                  {group.isMember ? (
                    <Button variant="outline" size="sm">
                      {t("memberSettings") || "Member Settings"}
                    </Button>
                  ) : (
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t("joinGroup") || "Join Group"}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.memberCount} {t("members") || "members"}
                  </Badge>
                  {group.subject && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      {group.subject.name}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {t(group.gradeLevel) || group.gradeLevel}
                  </Badge>
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

              <TabsContent value="discussion" className="space-y-6">
                <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto p-2">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-medium text-sm">{message.userName}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {group.isMember && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={t("typeMessage") || "Type your message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{t("groupResources") || "Group Resources"}</h3>
                  {group.isMember && (
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addResource") || "Add Resource"}
                    </Button>
                  )}
                </div>

                {group.resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <DocumentIcon type={resource.type} />
                          <CardTitle className="text-base">{resource.title}</CardTitle>
                        </div>
                        <Badge variant="outline">
                          {t(resource.type) || resource.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="py-3 text-sm text-muted-foreground">
                      {t("addedBy") || "Added by"} {resource.addedBy} • {formatDate(resource.addedAt)}
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{t("upcomingEvents") || "Upcoming Events"}</h3>
                  {group.isMember && (
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("createEvent") || "Create Event"}
                    </Button>
                  )}
                </div>

                {group.events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <div className="bg-primary h-1.5"></div>
                    <CardHeader>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription>
                        {formatDate(event.date)} • {formatTime(event.date)} • {event.duration} {t("minutes") || "minutes"}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        <Users className="h-4 w-4 inline mr-1" />
                        {event.attendees} {t("attending") || "attending"}
                      </span>
                      {group.isMember && (
                        <Button variant="outline" size="sm">
                          {t("joinEvent") || "Join Event"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">{t("groupMembers") || "Group Members"}</h3>

                <div className="space-y-3">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {t("joinedOn") || "Joined"} {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        member.role === "admin"
                          ? "default"
                          : member.role === "moderator"
                            ? "secondary"
                            : "outline"
                      }>
                        {t(member.role) || member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <UserConditionalComponent
                  admin={
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("groupSettings") || "Group Settings"}</CardTitle>
                        <CardDescription>
                          {t("groupSettingsDesc") || "Manage group settings, permissions, and content"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button variant="outline" className="justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            {t("manageMembership") || "Manage Membership"}
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Settings className="h-4 w-4 mr-2" />
                            {t("groupPreferences") || "Group Preferences"}
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Shield className="h-4 w-4 mr-2" />
                            {t("moderationTools") || "Moderation Tools"}
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("deleteGroup") || "Delete Group"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  }
                />
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
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("createdOn") || "Created on"} {formatDate(group.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("lastActive") || "Last active"} {formatDate(group.lastActive)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {group.memberCount} {t("members") || "members"}
                  </span>
                </div>
                {group.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{group.subject.name}</span>
                  </div>
                )}
              </CardContent>
              {!group.isMember && (
                <CardFooter>
                  <Button className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("joinGroup") || "Join Group"}
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("groupAdmins") || "Group Admins & Moderators"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.members
                  .filter(member => member.role === "admin" || member.role === "moderator")
                  .map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{member.name}</h4>
                        <p className="text-xs text-muted-foreground">{t(member.role) || member.role}</p>
                      </div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("relatedGroups") || "Related Groups"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-violet-100 dark:bg-violet-900/20 p-2 rounded">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Physics Study Group</h4>
                    <p className="text-xs text-muted-foreground">32 members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Bac Preparation Group</h4>
                    <p className="text-xs text-muted-foreground">56 members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/20 p-2 rounded">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Science Students Community</h4>
                    <p className="text-xs text-muted-foreground">124 members</p>
                  </div>
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

// Utility component for document icons
const DocumentIcon = ({ type }) => {
  switch (type.toLowerCase()) {
    case 'document':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'worksheet':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'notes':
      return <FileText className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

// Import missing components
import { FileText, File, FileSpreadsheet, Clock, Plus, Shield, Trash2 } from 'lucide-react';

export default StudyGroupDetailPage;
