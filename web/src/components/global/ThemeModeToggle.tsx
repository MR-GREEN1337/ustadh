"use client";

import * as React from "react";
import { MoonIcon, SunIcon, GlobeIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation, useLocale } from "@/i18n/client";
import { Locale } from "@/i18n/config";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const currentLocale = useLocale();

  const handleLocaleChange = (locale: Locale) => {
    // Replace the current locale in the URL with the new one
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${currentLocale}`, `/${locale}`);
    router.push(newPath);
  };

  // Add RTL support for Arabic
  React.useEffect(() => {
    document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="bg-transparent text-slate-200 dark:text-slate-300">
          <Button variant="outline" size="icon">
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t("theme")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("theme")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("light")}>
            {t("light")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            {t("dark")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            {t("system")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
