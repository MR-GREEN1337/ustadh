"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Course {
  id: number;
  title: string;
}

interface MultiCourseSelectProps {
  courses: Course[];
  selectedCourseIds: number[];
  onSelectionChange: (courseIds: number[]) => void;
  placeholder?: string;
}

export function MultiCourseSelect({
  courses,
  selectedCourseIds,
  onSelectionChange,
  placeholder,
}: MultiCourseSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggleCourse = (courseId: number) => {
    let newSelection: number[];

    if (selectedCourseIds.includes(courseId)) {
      // Remove course if already selected
      newSelection = selectedCourseIds.filter(id => id !== courseId);
    } else {
      // Add course if not selected
      newSelection = [...selectedCourseIds, courseId];
    }

    onSelectionChange(newSelection);
  };

  // Get course titles for display in the trigger button
  const getSelectedCourseTitles = () => {
    if (selectedCourseIds.length === 0) {
      return placeholder || t("selectCourses");
    }

    if (selectedCourseIds.length === 1) {
      const course = courses.find(c => c.id === selectedCourseIds[0]);
      return course ? course.title : t("oneCourseSelected");
    }
    //@ts-ignore
    return t("multipleCoursesSelected", { count: selectedCourseIds.length });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{getSelectedCourseTitles()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        {selectedCourseIds.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 border-b">
            {selectedCourseIds.map(id => {
              const course = courses.find(c => c.id === id);
              return course ? (
                <Badge
                  key={id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleCourse(id)}
                >
                  {course.title}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ) : null;
            })}
          </div>
        )}
        <Command>
          <CommandInput placeholder={t("searchCourses")} />
          <CommandEmpty>{t("noCourseFound")}</CommandEmpty>
          <ScrollArea className="max-h-60">
            <CommandGroup>
              {courses.map((course) => (
                <CommandItem
                  key={course.id}
                  value={course.title}
                  onSelect={() => {
                    toggleCourse(course.id);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCourseIds.includes(course.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {course.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
