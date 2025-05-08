"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import {
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/i18n/client";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const { t } = useTranslation();

  // Get the current path segments for breadcrumbs
  const getPathSegments = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      return path.split("/").filter(Boolean);
    }
    return [];
  };

  const pathSegments = getPathSegments();

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!loading && user && user.user_type !== "school_admin") {
      // Not an admin, redirect to dashboard
      router.push(`/${locale}/dashboard`);
    } else if (!loading && !user) {
      // Not logged in, redirect to login
      router.push(`/${locale}/auth/login`);
    }
  }, [user, loading, router, locale]);

  // Show loading state
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // If user is not an admin, show unauthorized message
  if (user.user_type !== "school_admin") {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("unauthorizedAccess") || "Unauthorized Access"}</AlertTitle>
          <AlertDescription>
            {t("adminAccessRequired") || "This area requires administrator privileges."}
          </AlertDescription>
        </Alert>
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          {t("backToDashboard") || "Back to Dashboard"}
        </button>
      </div>
    );
  }

  // Admin layout with sidebar and main content area
  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Main content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
