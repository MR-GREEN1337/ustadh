"use client";

import { useLocale, useTranslation } from '@/i18n/client';
import { useAuth } from '@/providers/AuthProvider';
import { redirect } from 'next/navigation';
import React from 'react'

interface ProfessorLayoutProps {
    children: React.ReactNode;
}

export default function ProfessorLayout({ children }: ProfessorLayoutProps) {
    const locale = useLocale();
    const { t } = useTranslation();
    const { user } = useAuth();

    if (!user || user?.user_type !== 'professor') {
        return redirect(`/${locale}/dashboard`);
    }

    return (
        <div>{children}</div>
    )
}
