"use client";

import { useLocale } from "@/i18n/client";
import { locales } from "@/i18n/config";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeIcon } from "lucide-react";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  ar: "🇪🇬",
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();
  const pathname = usePathname();

  const handleLanguageChange = (locale: string) => {
    // Replace the locale in the current path
    // Example: /en/login -> /fr/login
    const newPathname = pathname.replace(`/${currentLocale}`, `/${locale}`);
    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <GlobeIcon className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={currentLocale === locale ? "bg-muted" : ""}
          >
            <span className="mr-2">{LANGUAGE_FLAGS[locale]}</span>
            {LANGUAGE_NAMES[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
