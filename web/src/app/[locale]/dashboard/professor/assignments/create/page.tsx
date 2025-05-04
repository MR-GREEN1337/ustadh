"use client";

import { redirect } from 'next/navigation'
import { useLocale } from '@/i18n/client';

function page() {
  const locale = useLocale();
  return redirect(`/${locale}/dashboard/professor/ai/assignment-generator`)
}

export default page
