"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  HelpCircle,
  ListChecks,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Sparkles,
  Users,
  Wand2,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { professorAssignmentService } from '@/services/ProfessorAssignmentService';

// Helper components
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-700">
          <div className="flex items-center gap-1">
            <Pencil className="w-3 h-3" />
            <span>Draft</span>
          </div>
        </Badge>
      );
    case 'published':
      return (
        <Badge className="bg-green-100 text-green-800">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Published</span>
          </div>
        </Badge>
      );
    case 'closed':
      return (
        <Badge className="bg-amber-100 text-amber-800">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Closed</span>
          </div>
        </Badge>
      );
    case 'grading':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            <span>Grading</span>
          </div>
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

// Assignment detail page component
const AssignmentDetailPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { locale, assignmentId } = params;

  // State
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiImprovements, setAiImprovements] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAiPromptDialog, setShowAiPromptDialog] = useState(false);
  const [aiPromptResult, setAiPromptResult] = useState('');
  const [processingAiPrompt, setProcessingAiPrompt] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // Load assignment details
  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    try {
      const result = await professorAssignmentService.getAssignment(Number(assignmentId));
      setAssignment(result);
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast.error(t('errorLoadingAssignment') || 'Error loading assignment details');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, t]);

  // Initialize data
  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  // Handle AI analysis
  const handleAnalyzeWithAI = async () => {
    if (!assignment) return;

    setAnalyzingWithAI(true);
    try {
      const insights = await professorAssignmentService.analyzeAssignmentWithAI(Number(assignmentId));
      setAiInsights(insights);

      if (insights.improvements && Array.isArray(insights.improvements)) {
        setAiImprovements(insights.improvements);
      }

      toast.success(t('aiAnalysisComplete') || 'AI analysis completed successfully');
      setActiveTab('ai-insights');
    } catch (error) {
      console.error('Error during AI analysis:', error);
      toast.error(t('errorAiAnalysis') || 'Error analyzing assignment with AI');
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  // Handle custom AI prompt
  const handleCustomAiPrompt = async () => {
    if (!customPrompt || !assignment) return;

    setProcessingAiPrompt(true);
    try {
      const result = await professorAssignmentService.customAiPrompt(Number(assignmentId), customPrompt);
      setAiPromptResult(result.response);
    } catch (error) {
      console.error('Error processing AI prompt:', error);
      toast.error(t('errorProcessingAiPrompt') || 'Error processing AI prompt');
    } finally {
      setProcessingAiPrompt(false);
    }
  };

  // Handle apply AI improvement
  const applyImprovement = async (improvementIndex: number) => {
    if (!assignment || !aiImprovements[improvementIndex]) return;

    try {
      const updatedAssignment = await professorAssignmentService.applyAiImprovement(
        Number(assignmentId),
        aiImprovements[improvementIndex]
      );

      setAssignment(updatedAssignment);

      // Remove the applied improvement from the list
      const newImprovements = [...aiImprovements];
      newImprovements.splice(improvementIndex, 1);
      setAiImprovements(newImprovements);

      toast.success(t('improvementApplied') || 'Improvement applied successfully');
    } catch (error) {
      console.error('Error applying improvement:', error);
      toast.error(t('errorApplyingImprovement') || 'Error applying improvement');
    }
  };

  // Handle publish assignment
  const handlePublishAssignment = async () => {
    if (!assignment) return;

    setPublishLoading(true);
    try {
      await professorAssignmentService.publishAssignment(Number(assignmentId));
      toast.success(t('assignmentPublished') || 'Assignment published successfully');
      loadAssignment(); // Reload to get updated status
    } catch (error) {
      console.error('Error publishing assignment:', error);
      toast.error(t('errorPublishingAssignment') || 'Error publishing assignment');
    } finally {
      setPublishLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>

        <Skeleton className="h-[200px] w-full rounded-lg" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Render 404 if assignment not found
  if (!assignment) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-red-100 rounded-full p-6 mb-4">
          <XCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('assignmentNotFound') || 'Assignment Not Found'}</h1>
        <p className="text-muted-foreground mb-6">
          {t('assignmentNotFoundDesc') || "The assignment you're looking for doesn't exist or you don't have access to it."}
        </p>
        <Button onClick={() => router.push(`/${locale}/dashboard/professor/assignments`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToAssignments') || 'Back to Assignments'}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard/professor/assignments`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('back') || 'Back'}
            </Button>
            <StatusBadge status={assignment.status} />
          </div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">
            {assignment.courseName} • {t(assignment.assignmentType) || assignment.assignmentType}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {assignment.status === 'draft' && (
            <Button onClick={handlePublishAssignment} disabled={publishLoading}>
              {publishLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('publishing') || 'Publishing...'}
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('publish') || 'Publish'}
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignmentId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            {t('edit') || 'Edit'}
          </Button>

          <Button
            variant={analyzingWithAI ? "secondary" : "default"}
            onClick={handleAnalyzeWithAI}
            disabled={analyzingWithAI}
          >
            {analyzingWithAI ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                {t('analyzing') || 'Analyzing...'}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {t('analyzeWithAI') || 'Analyze with AI'}
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions') || 'Actions'}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignmentId}/submissions`)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('viewSubmissions') || 'View Submissions'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => professorAssignmentService.cloneAssignment(Number(assignmentId))}>
                <Plus className="mr-2 h-4 w-4" />
                {t('createCopy') || 'Create Copy'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => professorAssignmentService.exportAssignment(Number(assignmentId), 'pdf')}>
                <Download className="mr-2 h-4 w-4" />
                {t('exportAsPDF') || 'Export as PDF'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('dueDate') || 'Due Date'}</p>
                <p className="text-2xl font-bold">{formatDate(assignment.dueDate)}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalPoints') || 'Total Points'}</p>
                <p className="text-2xl font-bold">{assignment.pointsPossible}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('submissions') || 'Submissions'}</p>
                <p className="text-2xl font-bold">{assignment.submissionCount || 0}</p>
                <p className="text-xs text-muted-foreground">{assignment.gradedCount || 0} {t('graded') || 'graded'}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('avgGrade') || 'Avg Grade'}</p>
                <p className="text-2xl font-bold">
                  {assignment.averageGrade ? `${Math.round(assignment.averageGrade)}%` : '-'}
                </p>
              </div>
              <ListChecks className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-8">
          <TabsTrigger value="overview">{t('overview') || 'Overview'}</TabsTrigger>
          <TabsTrigger value="instructions">{t('instructions') || 'Instructions'}</TabsTrigger>
          <TabsTrigger value="materials">{t('materials') || 'Materials'}</TabsTrigger>
          <TabsTrigger value="classes">{t('classes') || 'Classes'}</TabsTrigger>
          <TabsTrigger value="ai-insights">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('aiInsights') || 'AI Insights'}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('assignmentDetails') || 'Assignment Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">{t('description') || 'Description'}</h3>
                <p className="text-muted-foreground">{assignment.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">{t('course') || 'Course'}</h3>
                  <p className="text-muted-foreground">{assignment.courseName}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">{t('type') || 'Type'}</h3>
                  <p className="text-muted-foreground">
                    {t(assignment.assignmentType) || assignment.assignmentType}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">{t('created') || 'Created'}</h3>
                  <p className="text-muted-foreground">{formatDate(assignment.createdAt)}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">{t('lastUpdated') || 'Last Updated'}</h3>
                  <p className="text-muted-foreground">
                    {assignment.updatedAt ? formatDate(assignment.updatedAt) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {assignment.gradingCriteria && assignment.gradingCriteria.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('gradingCriteria') || 'Grading Criteria'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignment.gradingCriteria.map((criterion: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{criterion.name}</h3>
                        <span className="font-medium">{criterion.points} pts</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                      <Progress value={(criterion.points / assignment.pointsPossible) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Instructions Tab */}
        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle>{t('assignmentInstructions') || 'Assignment Instructions'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {assignment.instructions}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>{t('assignmentMaterials') || 'Assignment Materials'}</CardTitle>
              <CardDescription>
                {t('materialsDescription') || 'Files and resources provided with this assignment'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignment.materials && assignment.materials.length > 0 ? (
                <div className="space-y-2">
                  {assignment.materials.map((material: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium">{material.fileName || material.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {material.fileType || material.type} • {Math.round((material.size || 0) / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" />
                          {t('download') || 'Download'}
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-slate-100 inline-flex rounded-full p-3 mb-4">
                    <FileText className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-muted-foreground">
                    {t('noMaterials') || 'No materials have been attached to this assignment'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignmentId}/edit`)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addMaterials') || 'Add Materials'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>{t('assignedClasses') || 'Assigned Classes'}</CardTitle>
              <CardDescription>
                {t('classesDescription') || 'Classes that have been assigned this assignment'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignment.classIds && assignment.classIds.length > 0 ? (
                <div className="space-y-2">
                  {assignment.classIds.map((classId: number, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Class {classId}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('studentsEnrolled', { count: 0 }) || '0 students enrolled'}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/${locale}/dashboard/professor/classes/${classId}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t('viewClass') || 'View Class'}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-slate-100 inline-flex rounded-full p-3 mb-4">
                    <Users className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-muted-foreground">
                    {t('noClassesAssigned') || 'No classes have been assigned to this assignment'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/${locale}/dashboard/professor/assignments/${assignmentId}/edit`)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('assignToClasses') || 'Assign to Classes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          {!aiInsights ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary-50 p-8 flex flex-col items-center justify-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Wand2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-center">
                    {t('aiInsightsTitle') || 'AI-Powered Assignment Analysis'}
                  </h3>
                  <p className="text-center text-muted-foreground mb-6 max-w-lg">
                    {t('aiInsightsDescription') || 'Analyze this assignment with AI to get insights, suggestions for improvement, and identify potential issues.'}
                  </p>
                  <Button
                    onClick={handleAnalyzeWithAI}
                    disabled={analyzingWithAI}
                    size="lg"
                  >
                    {analyzingWithAI ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        {t('analyzing') || 'Analyzing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('analyzeNow') || 'Analyze Now'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('aiAnalysisOverview') || 'AI Analysis Overview'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {t('overallQuality') || 'Overall Quality'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Progress value={aiInsights.qualityScore} className="h-2.5" />
                      <span className="font-medium text-sm">{aiInsights.qualityScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">{t('clarity') || 'Clarity'}</h4>
                      <div className="flex items-center justify-between">
                        <Progress value={aiInsights.clarityScore} className="h-1.5 w-4/5" />
                        <span className="text-sm font-medium">{aiInsights.clarityScore}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">{t('difficulty') || 'Difficulty'}</h4>
                      <div className="flex items-center justify-between">
                        <Progress value={aiInsights.difficultyScore} className="h-1.5 w-4/5" />
                        <span className="text-sm font-medium">{aiInsights.difficultyScore}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-1">{t('alignment') || 'Learning Alignment'}</h4>
                      <div className="flex items-center justify-between">
                        <Progress value={aiInsights.alignmentScore} className="h-1.5 w-4/5" />
                        <span className="text-sm font-medium">{aiInsights.alignmentScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('aiSummary') || 'AI Summary'}</h3>
                    <div className="bg-primary-50 p-4 rounded-lg">
                      <p className="text-sm">{aiInsights.summary}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('keyStrengths') || 'Key Strengths'}</h3>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                      {aiInsights.strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('suggestedImprovements') || 'Suggested Improvements'}</CardTitle>
                  <CardDescription>
                    {t('suggestedImprovementsDesc') || 'AI-generated suggestions to enhance this assignment'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiImprovements.length > 0 ? (
                    <div className="space-y-4">
                      {aiImprovements.map((improvement, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm">{improvement}</p>
                          </div>
                          <Button size="sm" onClick={() => applyImprovement(index)}>
                            <Save className="h-4 w-4 mr-1" />
                            {t('apply') || 'Apply'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        {t('noSuggestedImprovements') || 'No suggested improvements at this time'}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50 flex justify-center">
                  <Button variant="outline" onClick={() => setShowAiPromptDialog(true)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {t('askCustomQuestion') || 'Ask Custom Question'}
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Custom AI Prompt Dialog */}
      <Dialog open={showAiPromptDialog} onOpenChange={setShowAiPromptDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('askAIAboutAssignment') || 'Ask AI About Assignment'}
            </DialogTitle>
            <DialogDescription>
              {t('askAIDescription') || 'Get AI assistance with any aspect of this assignment'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Label htmlFor="ai-prompt">{t('yourQuestion') || 'Your Question'}</Label>
            <Textarea
              id="ai-prompt"
              placeholder={t('promptPlaceholder') || "E.g., How can I improve the grading criteria?"}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
            />

            {aiPromptResult && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg space-y-2">
                <h3 className="font-medium flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('aiResponse') || 'AI Response'}
                </h3>
                <div className="text-sm">
                  {aiPromptResult}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiPromptDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleCustomAiPrompt}
              disabled={!customPrompt || processingAiPrompt}
            >
              {processingAiPrompt ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('processing') || 'Processing...'}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {t('getAIResponse') || 'Get AI Response'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentDetailPage;
