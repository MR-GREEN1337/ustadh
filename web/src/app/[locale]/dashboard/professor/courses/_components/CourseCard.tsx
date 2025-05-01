"use client";

import React from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { cn } from '@/lib/utils';

// UI Components
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Icons
import { Clock, Edit, Sparkles, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
interface CourseCardProps {
  course: {
    id: number;
    title: string;
    code: string;
    students: number;
    nextClass?: string;
    progress: number;
    topics?: string[];
    aiGenerated?: boolean;
    status: string;
  };
  onEdit: (course: any) => void;
  onGenerate: (course: any) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocale();

  return (
    <Card className={cn("border hover:border-primary/20 transition-all duration-300",
      course.aiGenerated && "relative")}>
      {course.aiGenerated && (
        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs px-2 py-1 rounded-bl-md flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          {t("aiEnhanced")}
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{course.title}</h3>
          <Badge variant={course.status === 'active' ? "default" : "outline"}>
            {t(course.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-xs">{course.code}</span>
          <span className="text-xs">•</span>
          <Users className="h-4 w-4" />
          <span>{course.students} {t("students")}</span>
        </div>

        {course.nextClass && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{course.nextClass}</span>
          </div>
        )}

        {course.topics && course.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {course.topics.slice(0, 3).map((topic, idx) => (
              <Badge key={idx} variant="outline" className="bg-primary/5 text-xs">
                {topic}
              </Badge>
            ))}
            {course.topics.length > 3 && (
              <Badge variant="outline" className="bg-muted/50 text-xs">
                +{course.topics.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="pt-1">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs">
            <span className="text-muted-foreground">{t("progress")}: {course.progress}%</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(course)}>
                <Edit className="h-3 w-3 mr-1" />
                {t("edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/professor/courses/${course.id}`)}>
                <Sparkles className="h-3 w-3 mr-1" />
                {t("enhance")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
