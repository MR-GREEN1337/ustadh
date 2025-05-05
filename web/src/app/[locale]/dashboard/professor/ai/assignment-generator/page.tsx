"use client";

import { useLocale } from '@/i18n/client';
import { redirect } from 'next/navigation'
import React from 'react'

function page() {
  const locale = useLocale();
  return redirect(`/${locale}/dashboard/professor/assignments/`)
}

export default page
