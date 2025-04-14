// app/[locale]/dashboard/community/groups/[groupId]/chat.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useCommunityWebSocket } from '@/providers/CommunityWebSocketProvider';
import { CommunityService } from '@/services/CommunityService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, ArrowLeft, Users } from 'lucide-react';

const GroupChatPage = () => {
  const { groupId, locale } = useParams();
  const { user } = useAuth();
  const { connect, disconnect, sendMessage, messages, isConnected } = useCommunityWebSocket();
  const [messageText, setMessageText] = useState("");
  const [groupInfo, setGroupInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef(null);
  const isRTL = locale === "ar";

  // Connect to WebSocket on component mount
  useEffect(() => {
    // Get the WebSocket URL from service
    const wsUrl = CommunityService.getWebSocketURL('chat', Number(groupId));
    connect(wsUrl);

    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [groupId, connect, disconnect]);

  // Fetch group info
  useEffect(() => {
    const fetchGroupInfo = async () => {
      setIsLoading(true);
      try {
        // This would be replaced with an actual API call
        const response = await CommunityService.getStudyGroups();
        const group = response.find(g => g.id === Number(groupId));
        setGroupInfo(group);
      } catch (error) {
        console.error("Failed to fetch group info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupInfo();
  }, [groupId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    sendMessage({
      type: 'chat_message',
      group_id: Number(groupId),
      content: messageText
    });

    setMessageText("");
  };

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col">
      <Card className="flex flex-col h-full border-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl font-medium">
                {isLoading ? 'Loading...' : groupInfo?.name || 'Study Group Chat'}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              <Users className="h-4 w-4" />
              Members
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
          <ScrollArea className="h-full p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.data.user_id === user.id ? 'justify-end' : 'justify-start'} mb-4`}
              >
                {msg.data.user_id !== user.id && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={msg.data.user_avatar} />
                    <AvatarFallback>{msg.data.user_name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.data.user_id === user.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.data.user_id !== user.id && (
                    <div className="text-xs text-muted-foreground mb-1">{msg.data.user_name}</div>
                  )}
                  <p>{msg.data.content}</p>
                  <div className="text-xs opacity-70 text-right mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.data.user_id === user.id && (
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.full_name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-3">
          <div className="flex w-full items-center gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!isConnected || !messageText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GroupChatPage;
