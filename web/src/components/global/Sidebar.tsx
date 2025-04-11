"use client";

import { cn } from "@/lib/utils";
import { RoleBasedSidebar } from "./RoleBasedSidebar";

// This is a simple wrapper for the RoleBasedSidebar component for desktop
export function Sidebar({ className }: { className?: string }) {
  return (
    <div className={cn("hidden md:block", className)}>
      <RoleBasedSidebar isMobile={false} />
    </div>
  );
}
