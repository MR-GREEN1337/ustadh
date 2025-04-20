"use client";

import React from 'react';
import { MessagingProvider } from '@/providers/MessagingContext';
import { MessagingPage } from './_components/MessagingComponents';

// Main messaging page
export default function Messages() {
  return (
    <MessagingProvider>
      <MessagingPage />
    </MessagingProvider>
  );
}
