"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/providers/AuthProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export default function ChatPage() {
  const { chatId } = useParams();
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [chat, setChat] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch chat data on mount
  useEffect(() => {
    // In a real app this would be an API call
    const fetchChat = () => {
      try {
        // Get from localStorage for demo purposes
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        const foundChat = chats.find((c) => c.id === chatId);

        if (foundChat) {
          setChat(foundChat);
        } else {
          // If chat not found, create a new one
          const initialPrompt = sessionStorage.getItem(`chat-${chatId}-initial-prompt`) || t("defaultPrompt") || "I want to learn something new";

          const newChat = {
            id: chatId,
            title: initialPrompt.length > 30 ? `${initialPrompt.substring(0, 30)}...` : initialPrompt,
            createdAt: new Date().toISOString(),
            messages: [
              {
                id: `msg-${Date.now()}`,
                role: 'user',
                content: initialPrompt,
                timestamp: new Date().toISOString()
              }
            ]
          };

          // Save the new chat
          const updatedChats = [newChat, ...chats];
          localStorage.setItem('chats', JSON.stringify(updatedChats));
          setChat(newChat);

          // Simulate AI response for the demo
          simulateAIResponse(newChat, initialPrompt);
        }
      } catch (error) {
        console.error('Failed to fetch chat:', error);
      }
    };

    fetchChat();
  }, [chatId, t]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  // Simulate AI response generation
  const simulateAIResponse = (currentChat, prompt) => {
    setIsLoading(true);

    // This would be your actual AI API call in production
    setTimeout(() => {
      let aiResponse = "";

      // Simple demo responses based on prompt keywords
      if (prompt.toLowerCase().includes("math") || prompt.toLowerCase().includes("equation")) {
        aiResponse = "Mathematics is the language in which the universe is written. From the elegant patterns of the Fibonacci sequence appearing in nature to the complex differential equations that describe physical phenomena, mathematics provides us with the tools to understand and model reality.\n\nWhat specific aspect would you like to explore further?";
      } else if (prompt.toLowerCase().includes("literature") || prompt.toLowerCase().includes("poetry")) {
        aiResponse = "Literature and poetry give us windows into the human experience across cultures and time. They help us explore emotions, ideas, and perspectives we might never encounter otherwise.\n\nWhat literary traditions or forms are you most curious about?";
      } else if (prompt.toLowerCase().includes("physics") || prompt.toLowerCase().includes("science")) {
        aiResponse = "Physics reveals the fundamental rules that govern our universe, from the smallest particles to the largest cosmic structures. Each discovery leads to new questions and possibilities.\n\nIs there a specific phenomenon or concept you're wondering about?";
      } else {
        aiResponse = "That's a fascinating area to explore! The most exciting thing about learning is how each question opens doors to new ones we hadn't even thought to ask.\n\nWhat aspect of this topic makes you most curious?";
      }

      const updatedChat = {
        ...currentChat,
        messages: [
          ...currentChat.messages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Update state and save to storage
      setChat(updatedChat);
      const chats = JSON.parse(localStorage.getItem('chats') || '[]');
      const updatedChats = chats.map((c) =>
        c.id === updatedChat.id ? updatedChat : c
      );
      localStorage.setItem('chats', JSON.stringify(updatedChats));

      setIsLoading(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !chat) return;

    // Add user message
    const updatedMessages = [
      ...chat.messages,
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
      }
    ];

    const updatedChat = { ...chat, messages: updatedMessages };
    setChat(updatedChat);

    // Save to storage
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const updatedChats = chats.map((c) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    localStorage.setItem('chats', JSON.stringify(updatedChats));

    // Reset input
    setInput('');

    // Simulate AI response
    simulateAIResponse(updatedChat, input);
  };

  // Handle textarea auto-resize and submit on Enter (unless Shift is pressed)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Simple header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center p-3">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium ml-3">{chat.title}</h1>
        </div>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-28">
          {chat.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {message.role === 'user' ? (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-secondary">
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary">
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-4 bg-muted">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area - fixed at bottom */}
      <div className="fixed bottom-0 left-60 right-0 bg-background/95 backdrop-blur-sm border-t z-10 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("whatAreYouCuriousAbout") || "What are you curious about?"}
              className="min-h-12 py-3 resize-none border-primary/20 focus-visible:ring-primary/30 pr-10 rounded-xl"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2 rounded-full h-8 w-8"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
