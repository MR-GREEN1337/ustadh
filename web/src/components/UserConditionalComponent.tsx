// components/UserConditionalComponent.tsx
"use client";

import React from 'react';
import { useAuth } from '@/providers/AuthProvider';

type UserConditionalComponentProps = {
  student?: React.ReactNode;
  teacher?: React.ReactNode;
  parent?: React.ReactNode;
  admin?: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Component that conditionally renders different content based on user type
 */
const UserConditionalComponent: React.FC<UserConditionalComponentProps> = ({
  student,
  teacher,
  parent,
  admin,
  fallback
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  console.log(user);
  switch (user.user_type) {
    case 'student':
      return student ? <>{student}</> : fallback ? <>{fallback}</> : null;
    case 'teacher':
      return teacher ? <>{teacher}</> : fallback ? <>{fallback}</> : null;
    case 'parent':
      return parent ? <>{parent}</> : fallback ? <>{fallback}</> : null;
    case 'school_admin':
      return admin ? <>{admin}</> : fallback ? <>{fallback}</> : null;
    default:
      return fallback ? <>{fallback}</> : null;
  }
};

export default UserConditionalComponent;
