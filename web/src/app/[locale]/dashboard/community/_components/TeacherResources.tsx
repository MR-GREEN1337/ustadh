// app/[locale]/dashboard/community/_components/TeacherResources.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Upload,
  Download,
  FileText,
  ThumbsUp,
  Star,
  FileSpreadsheet,
  FileImage,
  FileType,
  Share,
  FileSymlink,
  GraduationCap
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const TeacherResources = ({ isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  // Same resources as StudentResources for now
  const resources = [
    {
      id: 1,
      title: "Mathematics Summary: Algebra",
      description: "Complete summary of algebraic concepts with examples and practice problems",
      type: "pdf",
      creator: { name: "Ahmed Hassan", avatar: null },
      downloads: 143,
      likes: 37,
      rating: 4.7
    },
    {
      id: 2,
      title: "Physics Formulas Cheat Sheet",
      description: "All important physics formulas in one organized sheet",
      type: "pdf",
      creator: { name: "Sara El Alami", avatar: null },
      downloads: 287,
      likes: 92,
      rating: 4.9
    },
    {
      id: 3,
      title: "Arabic Literature: Poetry Analysis Guide",
      description: "Methodology for analyzing classical and modern Arabic poetry",
      type: "doc",
      creator: { name: "Mohammed Tazi", avatar: null },
      downloads: 76,
      likes: 23,
      rating: 4.5
    }
  ];

  // Function to get file icon based on type
  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileType className="h-10 w-10 text-red-500" />;
      case 'doc':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
      case 'image':
        return <FileImage className="h-10 w-10 text-purple-500" />;
      default:
        return <FileText className="h-10 w-10 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">{t("teachingResources") || "Teaching Resources"}</h3>
          <Button className="gap-1">
            <Upload className="h-4 w-4" />
            {t("uploadResource") || "Upload Resource"}
          </Button>
        </div>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-2">{t("contributeToCommunity") || "Contribute to Our Learning Community"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("contributeToCommunityDescription") || "Share your teaching materials, lesson plans, and resources with other educators to enhance the learning experience for all students."}
                </p>
                <div className="flex gap-3">
                  <Button variant="default" className="gap-1">
                    <Upload className="h-4 w-4" />
                    {t("shareResources") || "Share Resources"}
                  </Button>
                  <Button variant="outline" className="gap-1">
                    {t("learnMore") || "Learn More"}
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 hidden md:flex p-4 bg-white dark:bg-black/20 rounded-full">
                <GraduationCap className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="border hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(resource.type)}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback>{resource.creator.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{resource.creator.name}</span>
                      <span className="mx-1">•</span>
                      <Badge variant="outline" className="text-xs bg-muted/50">
                        {resource.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Download className="h-3 w-3 mr-1" />
                        {resource.downloads}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {resource.likes}
                      </div>
                      <div className="flex items-center text-xs text-amber-500">
                        <Star className="h-3 w-3 mr-1 text-amber-500" />
                        {resource.rating}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <Button size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      {t("download") || "Download"}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Share className="h-3 w-3" />
                      {t("share") || "Share"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("lessonPlans") || "Lesson Plans"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border hover:border-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("algebraicEquations") || "Algebraic Equations"}</CardTitle>
              <CardDescription>{t("grade10Mathematics") || "Grade 10 Mathematics"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <FileSymlink className="h-3 w-3 mr-1" />
                <span>{t("includedWorksheets", { count: 3 }) || "Includes 3 worksheets"}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3 mr-1" />
                <span>{t("minutesLessonTime", { count: 45 }) || "45 minutes lesson time"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                {t("preview") || "Preview"}
              </Button>
              <Button size="sm">
                {t("usePlan") || "Use Plan"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border hover:border-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("literaryFigures") || "Literary Figures"}</CardTitle>
              <CardDescription>{t("grade11Arabic") || "Grade 11 Arabic Literature"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <FileSymlink className="h-3 w-3 mr-1" />
                <span>{t("includedWorksheets", { count: 2 }) || "Includes 2 worksheets"}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3 mr-1" />
                <span>{t("minutesLessonTime", { count: 60 }) || "60 minutes lesson time"}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                {t("preview") || "Preview"}
              </Button>
              <Button size="sm">
                {t("usePlan") || "Use Plan"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherResources;
