"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { useLocale } from "@/i18n/client";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const locale = useLocale();

  // Determine if the locale is RTL
  const isRTL = locale === "ar";

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 text-center ${isRTL ? "rtl" : "ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-md w-full mx-auto">
        <div className="flex flex-col items-center space-y-6">
          {/* Icon */}
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <FileQuestion className="w-12 h-12" />
          </div>

          {/* Error code */}
          <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-medium">
            {t("errorCode")}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight">{t("notFoundTitle")}</h1>

          {/* Description */}
          <p className="text-gray-500 max-w-sm">
            {t("notFoundDescription")}
          </p>

          <p className="text-gray-400 text-sm">
            {t("searchSuggestion")}
          </p>

          {/* Back button */}
          <Link href={`/${locale}`}>
            <Button className="mt-6">
              {t("backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
