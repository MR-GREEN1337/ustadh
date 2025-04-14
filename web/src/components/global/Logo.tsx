"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  hideBadge?: boolean;
  url?: string;
}

export default function Logo({ className, hideBadge = false, url = `/dashboard` }: LogoProps) {
  const { locale } = useParams();

  return (
    <Link href={`${url}`} className={cn("flex items-center", className)}>
      <div className="flex items-center gap-2">
        <div className="bg-emerald-600 text-white h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold">
          U
        </div>
        <h1 className="text-xl font-bold text-emerald-900">
          <span className="mr-1">أُستاذ</span>
          <span className="text-emerald-700">Ustadh</span>
        </h1>

        {!hideBadge && (
          <div className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-md font-medium ml-1">
            Beta
          </div>
        )}
      </div>
    </Link>
  );
}
