"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { useMessaging } from '@/providers/MessagingContext';
import { useAuth } from '@/providers/AuthProvider';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  User,
  UserPlus,
  MoreVertical,
  Trash,
  Archive,
  AlertTriangle,
  Clock,
  FileText,
  Paperclip,
  X,
  Users,
  UserCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import { NewMessageDialog } from './MessagingComponents';

// Component for conversation list
export const ConversationList = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    isLoadingConversations,
    refreshConversations
  } = useMessaging();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation =>
    conversation.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.latest_message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.latest_message.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Refresh conversations on mount
  useEffect(() => {
    refreshConversations();
  }, []);

  // Get locale for date formatting
  const getDateLocale = () => {
    switch(locale) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  // Format date based on how recent it is
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return format(date, 'p', { locale: getDateLocale() }); // Today, show time
    } else if (diffInDays === 1) {
      return t('yesterday');
    } else if (diffInDays < 7) {
      return format(date, 'EEEE', { locale: getDateLocale() }); // Day of week
    } else {
      return format(date, 'PP', { locale: getDateLocale() }); // Full date
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{t('messages')}</CardTitle>
          <NewMessageDialog />
        </div>
        <div className="relative mt-2">
          <Search className="absolute top-1/2 transform -translate-y-1/2 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            className={`pl-8 ${isRTL ? 'text-right' : 'text-left'}`}
            placeholder={t('searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="pt-2">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? t('noConversationsMatch') : t('noConversations')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.user.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversation === conversation.user.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveConversation(conversation.user.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={conversation.user.avatar || undefined} />
                      <AvatarFallback>{conversation.user.full_name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="font-medium truncate">
                          {conversation.user.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatMessageDate(conversation.latest_message.created_at)}
                        </div>
                      </div>
                      {conversation.user.role_info.title && (
                        <div className="text-xs text-muted-foreground">
                          {conversation.user.role_info.title}
                        </div>
                      )}
                      <div className="text-sm truncate">
                        {conversation.latest_message.subject && (
                          <span className="font-medium">
                            {conversation.latest_message.subject}:
                          </span>
                        )}
                        <span className={conversation.latest_message.is_read ? 'text-muted-foreground' : 'font-medium'}>
                          {conversation.latest_message.is_from_me && `${t('you')}: `}
                          {conversation.latest_message.preview}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="rounded-full h-5 px-2 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

// Component for the active conversation messages
export const ConversationView = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMessages,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    conversations
  } = useMessaging();
  const [messageContent, setMessageContent] = useState("");
  const [subject, setSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Find the active conversation details
  const activeConversationData = conversations.find(
    conv => conv.user.id === activeConversation
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingMore]);

  // Mark conversation as read when it becomes active
  useEffect(() => {
    if (activeConversation) {
      markConversationAsRead(activeConversation);
    }
  }, [activeConversation]);

  // Handler for loading more messages
  const handleLoadMore = async () => {
    if (hasMoreMessages && !isLoadingMessages) {
      setIsLoadingMore(true);
      await loadMoreMessages();
      setIsLoadingMore(false);
    }
  };

  // Handler for sending a message
  const handleSendMessage = async () => {
    if (!activeConversation || !messageContent.trim()) return;

    try {
      setIsSending(true);

      // If it's a new conversation with no messages, require a subject
      const needsSubject = messages.length === 0 && !subject.trim();
      if (needsSubject) {
        alert(t('pleaseAddSubject'));
        return;
      }

      // Use the current subject if it exists, or the subject from the input
      const messageSubject = messages.length > 0 ?
        (messages[0].subject || t('noSubject')) :
        (subject || t('noSubject'));

      await sendMessage(activeConversation, messageSubject, messageContent);

      // Clear the input fields
      setMessageContent("");
      setSubject("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handler for deleting a message
  const handleDeleteMessage = async (messageId: number) => {
    if (confirm(t('confirmDeleteMessage'))) {
      await deleteMessage(messageId);
    }
  };

  // Get locale for date formatting
  const getDateLocale = () => {
    switch(locale) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  // Date formatting for messages
  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'p', { locale: getDateLocale() });
  };

  // Group messages by date
  const getGroupedMessages = () => {
    const groups: { date: string; messages: typeof messages }[] = [];

    messages.forEach(message => {
      const messageDate = new Date(message.created_at);
      const dateStr = format(messageDate, 'PP', { locale: getDateLocale() });

      const existingGroup = groups.find(group => group.date === dateStr);
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date: dateStr, messages: [message] });
      }
    });

    return groups;
  };

  // If there's no active conversation, show a placeholder
  if (!activeConversation) {
    return (
      <Card className="h-full flex flex-col justify-center items-center">
        <CardContent className="text-center p-10">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">{t('selectConversation')}</CardTitle>
          <CardDescription>
            {t('selectConversationDescription')}
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        {activeConversationData && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={activeConversationData.user.avatar || undefined} />
                <AvatarFallback>{activeConversationData.user.full_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{activeConversationData.user.full_name}</CardTitle>
                <CardDescription>
                  {activeConversationData.user.role_info.title}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  {t('archiveConversation')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {t('reportUser')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      <Separator />

      {/* Messages container */}
      <ScrollArea className="flex-1 p-4">
        {/* Load more button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMessages}
            >
              {isLoadingMore ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {t('loadOlderMessages')}
            </Button>
          </div>
        )}

        {/* Messages by date */}
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {getGroupedMessages().map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                <div className="relative flex items-center justify-center">
                  <Separator className="absolute w-full" />
                  <span className="relative bg-card px-2 text-xs text-muted-foreground">
                    {group.date}
                  </span>
                </div>
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[75%]">
                      <div className={`flex items-start gap-2 ${message.is_from_me ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!message.is_from_me && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.avatar || undefined} />
                            <AvatarFallback>{message.sender.full_name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg p-3 space-y-1 ${
                            message.is_from_me
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {group.messages[0] === message && (
                            <div className="text-xs font-medium">
                              {message.subject}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                          <div className={`flex items-center text-xs ${
                            message.is_from_me
                              ? 'text-primary-foreground/70 justify-end'
                              : 'text-muted-foreground'
                          }`}>
                            {formatMessageTime(message.created_at)}
                            {message.is_read && message.is_from_me && (
                              <span className="ml-2">• {t('read')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message actions */}
                      {message.is_from_me && (
                        <div className="mt-1 flex justify-end px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message input */}
      <CardFooter className="border-t p-3">
        <div className="flex flex-col w-full space-y-2">
          {/* Show subject input only for new conversations */}
          {messages.length === 0 && (
            <Input
              placeholder={t('subject')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={isRTL ? 'text-right' : ''}
            />
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder={t('typeMessage')}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className={`min-h-[80px] resize-none ${isRTL ? 'text-right' : ''}`}
              />
              <Button
                className="absolute right-2 bottom-2"
                size="icon"
                variant="ghost"
                disabled={isSending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="mb-[2px]"
              disabled={!messageContent.trim() || isSending}
              onClick={handleSendMessage}
            >
              {isSending ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('send')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
