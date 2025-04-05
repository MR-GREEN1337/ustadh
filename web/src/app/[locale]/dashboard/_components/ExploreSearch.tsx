"use client";

import React, { useState, FormEvent } from 'react';
import { useTranslation } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid @types/uuid

interface ExploreSearchProps {
  className?: string;
}

export function ExploreSearch({ className }: ExploreSearchProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useParams();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRTL = locale === "ar";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    setIsSubmitting(true);

    try {
      // Generate a unique chat ID
      const chatId = uuidv4();

      // In a real implementation, you would store this in your database
      // This is a simplified version
      const newChat = {
        id: chatId,
        title: prompt.length > 30 ? `${prompt.substring(0, 30)}...` : prompt,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: uuidv4(),
            role: 'user',
            content: prompt,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // Store the new chat in localStorage for demo purposes
      // In a real app, you would use an API call to your backend
      const existingChats = JSON.parse(localStorage.getItem('chats') || '[]');
      localStorage.setItem('chats', JSON.stringify([newChat, ...existingChats]));

      // Store the initial prompt in sessionStorage so it can be accessed on the chat page
      sessionStorage.setItem(`chat-${chatId}-initial-prompt`, prompt);

      // Navigate to the chat page with the new chat ID
      router.push(`/${locale}/dashboard/tutor/chat/${chatId}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`rounded-xl border p-1 flex items-center ${className}`}>
      <Search className="h-4 w-4 mx-3 text-muted-foreground" />
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t("searchPlaceholder") || "Explore a concept, question, idea..."}
        className="flex-1 p-3 bg-transparent outline-none text-sm"
      />
      <Button
        type="submit"
        size="sm"
        className={`rounded-lg ${isSubmitting ? 'opacity-70' : ''}`}
        disabled={isSubmitting || !prompt.trim()}
      >
        <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${isSubmitting ? 'animate-pulse' : ''}`} />
        {isSubmitting ? t("exploring") || "Exploring..." : t("explore") || "Explore"}
      </Button>
    </form>
  );
}

// Usage in dashboard.tsx:
// Replace the static search input with <ExploreSearch />
