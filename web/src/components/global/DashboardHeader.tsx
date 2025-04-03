"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import { useAuth } from "@/providers/AuthProvider";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/global/ThemeModeToggle";
import LanguageSwitcher from "@/components/language-switcher";

export default function DashboardHeader() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const { user, logout } = useAuth();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);

    // Remove the locale segment
    if (paths[0] === locale) {
      paths.shift();
    }

    const breadcrumbs = paths.map((path, index) => {
      // Create the url up to this point
      const url = `/${locale}/${paths.slice(0, index + 1).join('/')}`;

      // Translate path segments or make them more readable
      let label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

      // Try to translate common path segments
      const translationKey = path.toLowerCase();
      if (t(translationKey as any) !== translationKey) {
        label = t(translationKey as any);
      }

      return { label, url };
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return "U";

    const names = user.full_name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex w-full items-center justify-between">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium">
        <Link
          href={`/${locale}/dashboard`}
          className={`text-foreground hover:text-foreground/80 flex items-center ${isRTL ? 'ml-1' : 'mr-1'}`}
        >
          <Home className="h-4 w-4 mr-1" />
          {t("dashboard")}
        </Link>

        {breadcrumbs.length > 1 && breadcrumbs.slice(1).map((crumb, index) => (
          <div key={index} className="flex items-center">
            <div className="mx-1 text-muted-foreground">
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <Link
              href={crumb.url}
              className={index === breadcrumbs.length - 2 ? "font-semibold" : "text-muted-foreground hover:text-foreground"}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Actions group */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <ModeToggle />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Profile dropdown */}
        <ProfileDropdown user={user} logout={logout} getUserInitials={getUserInitials} />
      </div>
    </div>
  );
}

// Profile dropdown component
function ProfileDropdown({ user, logout, getUserInitials }: { user: any; logout: () => void; getUserInitials: () => string }) {
  const { t } = useTranslation();
  const { locale } = useParams();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 rounded-full flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-800">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-flex text-sm font-medium">
            {user?.full_name?.split(' ')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-xs bg-muted text-muted-foreground px-2 py-1 mt-1 rounded inline-block capitalize">
              {user?.user_type || "user"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard/profile`}>
            {t("profile") || "Profile"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard/settings`}>
            {t("settings") || "Settings"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper component for RTL support
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
