"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { RoleBasedSidebar } from "./RoleBasedSidebar";

export function MobileSidebar() {
  const { locale } = useParams();
  const isRTL = locale === "ar";
  const [open, setOpen] = useState(false);

  const closeSidebar = () => setOpen(false);

  return (
    <div className="block md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-72 max-w-[80vw] flex flex-col h-full">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <Logo hideBadge={false} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Use the role-based sidebar for mobile with isMobile flag */}
          <RoleBasedSidebar isMobile={true} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
