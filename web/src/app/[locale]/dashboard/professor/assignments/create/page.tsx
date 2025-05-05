"use client";

import { redirect } from 'next/navigation'
import { useLocale } from '@/i18n/client';

function page() {
  const locale = useLocale();
  return redirect(`/${locale}/dashboard/professor/assignments/`)
}

export default page
