"use client";

import { useLocale } from '@/i18n/client';
import { redirect } from 'next/navigation';

function page() {
    const locale = useLocale();
  return redirect(`/${locale}/dashboard`);
}

export default page
