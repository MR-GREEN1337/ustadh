"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { MessagingService } from '@/services/MessagingService';

// Import the messaging service
const messagingService = new MessagingService();

// Define types
type Message = {
  id: number;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  is_from_me: boolean;
  sender: {
    id: number;
    full_name: string;
    avatar: string | null;
  };
  has_attachments: boolean;
  attachments?: any;
};

type Conversation = {
  user: {
    id: number;
    full_name: string;
    avatar: string | null;
    user_type: string;
    role_info: {
      title: string;
      [key: string]: any;
    };
  };
  latest_message: {
    id: number;
    subject: string;
    preview: string;
    created_at: string;
    is_read: boolean;
    is_from_me: boolean;
  };
  unread_count: number;
};

type Contact = {
  id: number;
  full_name: string;
  avatar: string | null;
  user_type: string;
  role: string;
  role_title: string;
  is_teacher?: boolean;
  education_level?: string;
};

// Create context type
type MessagingContextType = {
  conversations: Conversation[];
  unreadCount: number;
  activeConversation: number | null;
  setActiveConversation: (userId: number | null) => void;
  messages: Message[];
  loadMoreMessages: () => Promise<boolean>;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  sendMessage: (recipientId: number, subject: string, content: string, attachments?: any) => Promise<void>;
  markConversationAsRead: (userId: number) => void;
  contacts: Contact[];
  isLoadingContacts: boolean;
  refreshConversations: () => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
};

// Create context with default values
const MessagingContext = createContext<MessagingContextType>({
  conversations: [],
  unreadCount: 0,
  activeConversation: null,
  setActiveConversation: () => {},
  messages: [],
  loadMoreMessages: async () => false,
  hasMoreMessages: false,
  isLoadingMessages: false,
  isLoadingConversations: false,
  sendMessage: async () => {},
  markConversationAsRead: () => {},
  contacts: [],
  isLoadingContacts: false,
  refreshConversations: async () => {},
  deleteMessage: async () => {},
});

// Provider component
export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State variables
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(false);

  // Load conversations on initial render
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchContacts();

      // Initialize the messaging service
      messagingService.init();

      // Subscribe to new messages
      const unsubscribeNewMessage = messagingService.onNewMessage(handleNewMessage);
      const unsubscribeUnreadCount = messagingService.onUnreadCountChange(setUnreadCount);

      return () => {
        // Cleanup
        unsubscribeNewMessage();
        unsubscribeUnreadCount();
        messagingService.disconnect();
      };
    }
  }, [user]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const data = await messagingService.getConversations();
      setConversations(data);

      // Calculate total unread count
      const totalUnread = data.reduce((total, conv) => total + conv.unread_count, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    if (!user) return;

    setIsLoadingContacts(true);
    try {
      const data = await messagingService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Load messages for a conversation
  useEffect(() => {
    if (activeConversation) {
      loadConversationMessages(activeConversation);
    } else {
      // Clear messages when no active conversation
      setMessages([]);
      setOldestMessageId(null);
      setHasMoreMessages(false);
    }
  }, [activeConversation]);

  // Load conversation messages
  const loadConversationMessages = async (userId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await messagingService.getConversationMessages(userId, 20);
      setMessages(response.messages);

      // Set hasMoreMessages based on whether we got a full page
      setHasMoreMessages(response.messages.length >= 20);

      // Track oldest message for pagination
      if (response.messages.length > 0) {
        setOldestMessageId(response.messages[0].id);
      } else {
        setOldestMessageId(null);
      }

      // Mark the conversation as read
      messagingService.markConversationAsRead(userId);

      // Update the unread count in the conversations list
      updateConversationReadStatus(userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load more (older) messages
  const loadMoreMessages = async (): Promise<boolean> => {
    if (!activeConversation || !oldestMessageId || !hasMoreMessages || isLoadingMessages) {
      return false;
    }

    setIsLoadingMessages(true);
    try {
      const response = await messagingService.getConversationMessages(
        activeConversation,
        20,
        oldestMessageId
      );

      if (response.messages.length > 0) {
        // Prepend older messages to the current messages
        setMessages(prevMessages => [...response.messages, ...prevMessages]);

        // Update oldest message ID
        setOldestMessageId(response.messages[0].id);

        // Check if there might be more messages
        setHasMoreMessages(response.messages.length >= 20);

        return true;
      } else {
        setHasMoreMessages(false);
        return false;
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more messages',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle new message from WebSocket
  const handleNewMessage = (message: Message) => {
    // If this is for the active conversation, add it to messages
    if (activeConversation === message.sender.id) {
      setMessages(prevMessages => [...prevMessages, message]);

      // Mark as read immediately
      messagingService.markMessageAsRead(message.id);
    }

    // Update the conversations list
    updateConversationsWithNewMessage(message);
  };

  // Update conversations list with a new message
  const updateConversationsWithNewMessage = (message: Message) => {
    const otherUserId = message.is_from_me ? message.recipient_id : message.sender.id;

    setConversations(prevConversations => {
      // Check if conversation exists
      const existingIndex = prevConversations.findIndex(
        conv => conv.user.id === otherUserId
      );

      // Create a new array to trigger re-render
      const updatedConversations = [...prevConversations];

      if (existingIndex >= 0) {
        // Update existing conversation
        const conversation = {...updatedConversations[existingIndex]};

        // Update latest message
        conversation.latest_message = {
          id: message.id,
          subject: message.subject,
          preview: message.content.length > 100
            ? message.content.substring(0, 100) + '...'
            : message.content,
          created_at: message.created_at,
          is_read: message.is_read,
          is_from_me: message.is_from_me
        };

        // Update unread count if the message is to current user and not read
        if (!message.is_from_me && !message.is_read) {
          conversation.unread_count += 1;
          // Also update total unread count
          setUnreadCount(prev => prev + 1);
        }

        // Replace the conversation and move to top
        updatedConversations.splice(existingIndex, 1);
        updatedConversations.unshift(conversation);
      } else if (!message.is_from_me) {
        // New conversation with message from someone else
        // We would need the user info, which we don't have completely
        // Refresh conversations to get the full data
        fetchConversations();
      }

      return updatedConversations;
    });
  };

  // Update a conversation's read status
  const updateConversationReadStatus = (userId: number) => {
    setConversations(prevConversations => {
      const index = prevConversations.findIndex(conv => conv.user.id === userId);
      if (index >= 0) {
        const updatedConversations = [...prevConversations];
        const oldUnreadCount = updatedConversations[index].unread_count;

        // Update the unread count
        updatedConversations[index] = {
          ...updatedConversations[index],
          unread_count: 0,
          latest_message: {
            ...updatedConversations[index].latest_message,
            is_read: true
          }
        };

        // Also update the total unread count
        setUnreadCount(prev => Math.max(0, prev - oldUnreadCount));

        return updatedConversations;
      }
      return prevConversations;
    });
  };

  // Send a message
  const sendMessage = async (recipientId: number, subject: string, content: string, attachments?: any) => {
    try {
      const message = await messagingService.sendMessage(recipientId, subject, content, attachments);

      // Add to messages if this is the active conversation
      if (activeConversation === recipientId) {
        setMessages(prevMessages => [...prevMessages, message]);
      }

      // Update conversations list
      updateConversationsWithNewMessage({
        ...message,
        is_from_me: true,
        recipient_id: recipientId
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a message
  const deleteMessage = async (messageId: number) => {
    try {
      await messagingService.deleteMessage(messageId);

      // Remove from messages list
      setMessages(prevMessages =>
        prevMessages.filter(message => message.id !== messageId)
      );

      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        unreadCount,
        activeConversation,
        setActiveConversation,
        messages,
        loadMoreMessages,
        hasMoreMessages,
        isLoadingMessages,
        isLoadingConversations,
        sendMessage,
        markConversationAsRead: userId => messagingService.markConversationAsRead(userId),
        contacts,
        isLoadingContacts,
        refreshConversations: fetchConversations,
        deleteMessage,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

// Hook to use the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export default MessagingContext;
