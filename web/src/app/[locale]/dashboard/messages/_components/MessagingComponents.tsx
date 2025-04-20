"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { useMessaging } from '@/providers/MessagingContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Users, UserCircle, MessageSquare, Search, Send } from 'lucide-react';
import { ConversationList, ConversationView } from './ConversationList';

// New Message Dialog component
export const NewMessageDialog = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const { contacts, isLoadingContacts, sendMessage } = useMessaging();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedTab, setSelectedTab] = useState("recent");
  const [isSending, setIsSending] = useState(false);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(filter.toLowerCase()) ||
    contact.role_title.toLowerCase().includes(filter.toLowerCase())
  );

  // Group contacts by role
  const groupedContacts = {
    teachers: filteredContacts.filter(c => c.user_type === "teacher" || c.role === "teacher"),
    admins: filteredContacts.filter(c => c.role === "admin" || c.role === "principal"),
    students: filteredContacts.filter(c => c.user_type === "student")
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!selectedContact || !subject.trim() || !message.trim()) {
      return;
    }

    try {
      setIsSending(true);
      await sendMessage(selectedContact, subject, message);
      // Reset form and close dialog
      setSelectedContact(null);
      setSubject("");
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('newMessage')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact selection */}
          <div className="space-y-2">
            <div className="font-medium text-sm">{t('to')}:</div>

            {selectedContact ? (
              <div className="flex items-center justify-between border rounded-md p-2">
                {contacts.find(c => c.id === selectedContact) && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback>
                        {contacts.find(c => c.id === selectedContact)?.full_name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {contacts.find(c => c.id === selectedContact)?.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {contacts.find(c => c.id === selectedContact)?.role_title}
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedContact(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="recent" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('recent')}
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    {t('contacts')}
                  </TabsTrigger>
                </TabsList>

                <div className="relative mt-2">
                  <Search className="absolute top-1/2 transform -translate-y-1/2 left-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className={`pl-8 ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={t('searchContacts')}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>

                <TabsContent value="recent" className="mt-2">
                  <Card>
                    <CardContent className="p-2">
                      <CardDescription className="text-center py-8">
                        {t('recentContactsComingSoon')}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-2">
                  {isLoadingContacts ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      {Object.entries(groupedContacts).map(([groupKey, groupContacts]) =>
                        groupContacts.length > 0 && (
                          <div key={groupKey} className="mb-4">
                            <div className="text-xs font-semibold uppercase text-muted-foreground mb-1 px-1">
                              {t(groupKey)}
                            </div>
                            {groupContacts.map(contact => (
                              <div
                                key={contact.id}
                                className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => setSelectedContact(contact.id)}
                              >
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={contact.avatar || undefined} />
                                  <AvatarFallback>{contact.full_name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">{contact.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{contact.role_title}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                      {Object.values(groupedContacts).every(group => group.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          {filter ? t('noContactsMatch') : t('noContacts')}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Subject and message */}
          <div className="space-y-2">
            <Input
              placeholder={t('subject')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={isRTL ? 'text-right' : ''}
            />
            <Textarea
              placeholder={t('messageContent')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`min-h-[100px] ${isRTL ? 'text-right' : ''}`}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!selectedContact || !subject.trim() || !message.trim() || isSending}
          >
            {isSending ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t('send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main messaging page component
export const MessagingPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const { activeConversation } = useMessaging();

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-4">
        <div className="md:col-span-1 h-full">
          <ConversationList />
        </div>
        <div className="md:col-span-2 h-full">
          <ConversationView />
        </div>
      </div>
    </div>
  );
};

// Unread badge component for the sidebar
export const UnreadMessagesBadge = () => {
  const { unreadCount } = useMessaging();

  if (unreadCount === 0) return null;

  return (
    <div className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

// Add this component to your sidebar
export const MessageSidebarItem = () => {
  const { t } = useTranslation();
  const { locale } = useParams();

  return (
    <Button variant="ghost" className="w-full justify-start relative">
      <MessageSquare className="mr-2 h-5 w-5" />
      {t('messages')}
      <UnreadMessagesBadge />
    </Button>
  );
};
