"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./AuthProvider";
import { useLocale } from "@/i18n/client";

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <Toaster richColors dir={locale === 'ar' ? 'rtl' : 'ltr'} position="bottom-right" />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
