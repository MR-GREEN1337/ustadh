"use client"

import FuzzyText from '@/components/ui/FuzzyText'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import React from 'react'

function NotFoundPage() {
    const { theme } = useTheme()

    const isDark = theme === 'dark'

    return (
        <div className='flex flex-col items-center justify-center min-h-screen p-4'>
            <div className='text-center'>
                {/* Replace h1 with FuzzyText component */}
                <div className="mb-4 flex justify-center">
                    <FuzzyText
                        fontSize="clamp(3rem, 10vw, 6rem)"
                        fontWeight={700}
                        color={isDark ? '#f3f4f6' : '#111827'}
                        baseIntensity={0.2}
                        hoverIntensity={0.6}
                    >
                        404
                    </FuzzyText>
                </div>
                <h2 className={`text-2xl font-semibold mb-4 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                    Page Not Found
                </h2>
                <p className={`mb-8 max-w-md ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                    Don&apos;t worry, it happens to the best of us. Let&apos;s get you back on track.
                </p>
                <div className='flex flex-col sm:flex-row justify-center gap-4'>
                    <Link
                        href="/dashboard"
                        className={`flex items-center justify-center px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-110 ${
                            isDark
                                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                : 'bg-gray-900 text-gray-100 hover:bg-gray-800'
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Back to dashboard
                    </Link>
                </div>
            </div>
            <div className='mt-12 text-center'>
                <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                    If you believe this is a mistake, please contact support.
                </p>
            </div>
        </div>
    )
}

export default NotFoundPage
