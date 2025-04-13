"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import dynamic from 'next/dynamic';

// Import the student schedule component
import SchedulePage from './SchedulePage';

// Dynamically import the professor/admin schedule component to reduce initial bundle size
const ProfessorAndAdminSchedulePage = dynamic(() => import('./ProfessorAndAdminSchedulePage'), {
  loading: () => <SchedulePageSkeleton />,
  ssr: false,
});

// Skeleton loader for when the dynamic component is loading
const SchedulePageSkeleton = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-2"></div>
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6"></div>

      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      </div>

      <div className="border rounded-xl h-[600px] bg-gray-100 dark:bg-gray-900 animate-pulse"></div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        {t('loadingSchedule') || 'Loading schedule...'}
      </div>
    </div>
  );
};

/**
 * Main Schedule wrapper component that conditionally renders the appropriate
 * schedule interface based on the user's role
 */
const ScheduleWrapper: React.FC = () => {
  return (
    <UserConditionalComponent
      student={<SchedulePage />}
      teacher={<ProfessorAndAdminSchedulePage />}
      admin={<ProfessorAndAdminSchedulePage />}
      fallback={<SchedulePage />} // Default to student view for other user types
    />
  );
};

export default ScheduleWrapper;
