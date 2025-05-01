"use client";

import { useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import CourseSidebar from './CourseSidebar';
import { Loader2 } from 'lucide-react';

// Simplified course page layout with specialized sidebar
export default function CoursePageLayout({ children }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Course-specific sidebar with content structure and AI tools */}
      <CourseSidebar />

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
