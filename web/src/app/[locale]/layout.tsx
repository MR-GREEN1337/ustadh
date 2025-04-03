import { ReactNode } from "react";
import { Locale, getDirection } from "@/i18n/config";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import LanguageSwitcher from "@/components/language-switcher";

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Validate that the locale from the URL is supported
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get text direction based on locale
  const dir = getDirection(locale as Locale);

  return (
    <div dir={dir} className="min-h-screen">
      {children}
    </div>
  );
}
