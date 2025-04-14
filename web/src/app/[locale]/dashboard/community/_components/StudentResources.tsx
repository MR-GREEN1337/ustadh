// app/[locale]/dashboard/community/_components/StudentResources.tsx
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
  Download,
  FileText,
  ThumbsUp,
  Star,
  FileSpreadsheet,
  FileImage,
  FileType
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const StudentResources = ({ isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  // Example resources data
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
    },
    {
      id: 4,
      title: "Study Schedule Template",
      description: "Customizable study schedule for exam preparation",
      type: "xlsx",
      creator: { name: "Leila Benjelloun", avatar: null },
      downloads: 205,
      likes: 51,
      rating: 4.6
    },
    {
      id: 5,
      title: "Chemistry Periodic Table with Notes",
      description: "Enhanced periodic table with properties and examples",
      type: "image",
      creator: { name: "Karim Berrada", avatar: null },
      downloads: 128,
      likes: 45,
      rating: 4.8
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
        <h3 className="text-xl font-medium mb-4">{t("topResources") || "Top Learning Resources"}</h3>
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
                  <div className="flex-shrink-0">
                    <Button size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      {t("download") || "Download"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("resourceCategories") || "Resource Categories"}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Study Notes", count: 124, icon: <FileText className="h-4 w-4" /> },
            { name: "Practice Tests", count: 67, icon: <FileText className="h-4 w-4" /> },
            { name: "Cheat Sheets", count: 42, icon: <FileText className="h-4 w-4" /> },
            { name: "Study Guides", count: 89, icon: <BookOpen className="h-4 w-4" /> },
          ].map((category, idx) => (
            <Card key={idx} className="border cursor-pointer hover:border-primary/20 hover:bg-black/[0.01] transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="rounded-full p-2 bg-primary/10">
                  {category.icon}
                </div>
                <p className="font-medium">{t(category.name.toLowerCase().replace(' ', '')) || category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {category.count} {t("items") || "items"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentResources;
