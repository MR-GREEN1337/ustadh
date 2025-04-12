"use client";

import Onboarding from './_components/Onboarding';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is loaded
    if (user === undefined) {
      // User data is still loading
      return;
    }

    //alert(user?.user_type)
    // Redirect non-school-admin users
    if (user?.user_type !== 'student') {
      if (user?.user_type === 'teacher') {
        router.push('/dashboard/teachers');
        return;
      }
      if (user?.user_type === 'school_admin') {
        router.push('/onboarding/school')
        return;
      }
      router.push('/dashboard');
      return;
    }

    // User is a school admin and auth check is complete
    setIsAuthorized(true);
  }, [user, router]);

  // Don't render anything until authorization check is complete
  if (!isAuthorized) {
    return null; // Or a loading spinner if you prefer
  }

  // Only render the onboarding component when user is confirmed to be a school admin
  return <Onboarding />;
}
