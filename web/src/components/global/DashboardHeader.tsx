"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/i18n/client";
import { useAuth } from "@/providers/AuthProvider";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Settings
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import LanguageSwitcher from "@/components/language-switcher";

interface HeaderProps {
  toggleSidebar?: () => void;
}

export default function DashboardHeader({ toggleSidebar }: HeaderProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const { user, logout } = useAuth();
  const [notificationCount, setNotificationCount] = useState(3);

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
      if (t(translationKey) !== translationKey) {
        label = t(translationKey);
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
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="md:hidden mr-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="pr-0">
              <Sidebar className="w-full border-none" />
            </SheetContent>
          </Sheet>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center">
          <nav className="flex items-center text-sm font-medium">
            <Link
              href={`/${locale}/dashboard`}
              className={`text-foreground hover:text-foreground/80 ${isRTL ? 'ml-1' : 'mr-1'}`}
            >
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
        </div>

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="hidden md:flex relative w-40 lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("search") || "Search..."}
              className="pl-8 rounded-full bg-muted h-9"
            />
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center text-[10px] px-1">
                {notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Profile Dropdown */}
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
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/dashboard/profile`} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {t("profile") || "Profile"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/dashboard/settings`} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("settings") || "Settings"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

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
