// app/[locale]/dashboard/page.tsx
"use client";

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';

// Import role-specific dashboards
import StudentDashboard from './_components/StudentDashboard';
import TeacherDashboard from './_components/TeacherDashboard';
import ParentDashboard from './_components/ParentDashboard';
import AdminDashboard from './_components/AdminDashboard';

// Loading state for when authentication is in progress
import { Skeleton } from "@/components/ui/skeleton";

const LoadingDashboard = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div className="space-y-2">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-80 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, loading } = useAuth();

  // Show loading state while authentication is being checked
  if (loading) {
    return <LoadingDashboard />;
  }

  // Render the appropriate dashboard based on user type
  return (
    <UserConditionalComponent
      student={<StudentDashboard />}
      teacher={<TeacherDashboard />}
      parent={<ParentDashboard />}
      admin={<AdminDashboard />}
      fallback={<StudentDashboard />} // Default to student dashboard as fallback
    />
  );
};

export default Dashboard;
