"use client";

import { useLocale } from '@/i18n/client';
import { useRouter } from 'next/navigation'
import { useEffect } from 'react';

function page() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.push(`/${locale}/dashboard/`);
  }, [locale, router]);

  return null; // or a loading indicator if you prefer
}

export default page;
