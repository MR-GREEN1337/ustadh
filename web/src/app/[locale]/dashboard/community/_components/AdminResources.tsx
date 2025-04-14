// app/[locale]/dashboard/community/_components/AdminResources.tsx
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
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Settings,
  FileText,
  FileType,
  FileImage,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  BarChart4,
  Download,
  Plus
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/i18n/client';

const AdminResources = ({ isRTL }) => {
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();

  // Example pending resources
  const pendingResources = [
    {
      id: 1,
      title: "Physics Problem Set Grade 11",
      description: "Collection of practice problems for grade 11 physics",
      type: "pdf",
      submitter: "Sara El Alami (Teacher)",
      submittedOn: "2 hours ago"
    },
    {
      id: 2,
      title: "Arabic Grammar Guide",
      description: "Comprehensive grammar rules and examples",
      type: "doc",
      submitter: "Mohammed Tazi (Teacher)",
      submittedOn: "Yesterday"
    }
  ];

  // Function to get file icon based on type
  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileType className="h-6 w-6 text-red-500" />;
      case 'doc':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-purple-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium">{t("resourceManagement") || "Resource Management"}</h3>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1">
              <Settings className="h-4 w-4" />
              {t("settings") || "Settings"}
            </Button>
            <Button className="gap-1">
              <Upload className="h-4 w-4" />
              {t("uploadResource") || "Upload Resource"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">128</CardTitle>
              <CardDescription>{t("approvedResources") || "Approved Resources"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-primary">+12</span>
                <span className="ml-1">{t("lastMonth") || "last month"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">2,854</CardTitle>
              <CardDescription>{t("totalDownloads") || "Total Downloads"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-600">+423</span>
                <span className="ml-1">{t("lastMonth") || "last month"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{pendingResources.length}</CardTitle>
              <CardDescription>{t("pendingApproval") || "Pending Approval"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-amber-500">
                <Upload className="h-3 w-3 mr-1" />
                <span>{t("needsReview") || "Needs review"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("resourceApprovalQueue") || "Resource Approval Queue"}</h3>
        <div className="space-y-4">
          {pendingResources.map((resource) => (
            <Card key={resource.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(resource.type)}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{resource.submitter}</span>
                      <span className="mx-1">•</span>
                      <span>{resource.submittedOn}</span>
                      <span className="mx-1">•</span>
                      <Badge variant="outline" className="text-xs bg-muted/50">
                        {resource.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                      <Check className="h-3 w-3 mr-1" />
                      {t("approve") || "Approve"}
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                      <X className="h-3 w-3 mr-1" />
                      {t("reject") || "Reject"}
                    </Button>
                    <Button size="sm" variant="outline">
                      {t("preview") || "Preview"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("resourceCategories") || "Manage Resource Categories"}</h3>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t("categories") || "Categories & Organization"}</CardTitle>
            <CardDescription>
              {t("categoriesDescription") || "Manage how educational resources are organized"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{t("studyNotes") || "Study Notes"}</p>
                    <p className="text-xs text-muted-foreground">{t("resourceCount", { count: 42 }) || "42 resources"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    {t("edit") || "Edit"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">{t("examPrep") || "Exam Preparation"}</p>
                    <p className="text-xs text-muted-foreground">{t("resourceCount", { count: 56 }) || "56 resources"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    {t("edit") || "Edit"}
                  </Button>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" />
                  {t("addCategory") || "Add Category"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">{t("resourceAnalytics") || "Resource Analytics"}</h3>
        <Card className="border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t("popularResources") || "Popular Resources"}</CardTitle>
                <CardDescription>
                  {t("popularResourcesDescription") || "Most downloaded and used resources"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <BarChart4 className="h-4 w-4" />
                {t("fullReport") || "Full Report"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileType className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">{t("physicsFormulas") || "Physics Formulas Cheat Sheet"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      <span>{t("downloadCount", { count: 287 }) || "287 downloads"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ChevronUp className="h-4 w-4" />
                  <span>18%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{t("mathSummary") || "Mathematics Summary: Algebra"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      <span>{t("downloadCount", { count: 143 }) || "143 downloads"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ChevronUp className="h-4 w-4" />
                  <span>12%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminResources;
