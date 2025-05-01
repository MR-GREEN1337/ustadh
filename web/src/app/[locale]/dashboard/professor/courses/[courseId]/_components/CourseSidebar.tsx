"use client";

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  BookOpen,
  Users,
  Sparkles,
  Brain,
  MessageCircle,
  Bot,
  Layers,
  FileQuestion,
  Clock,
  Zap,
  PenTool,
  Lightbulb,
  Settings,
  Award,
  Flame,
  BarChart,
  Plus,
  Edit,
  Eye,
  Pin,
  Activity,
  Target,
  Puzzle,
} from 'lucide-react';

import Logo from "@/components/global/Logo";

const CourseItem = ({ href, icon, children, isActive = false, onClick, isSub = false }) => {
  const { locale } = useParams();
  const isRTL = locale === "ar";

  return (
    <Link href={href || '#'} onClick={onClick} className="w-full block">
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted",
          isSub ? "ml-6" : "",
          isRTL ? "flex-row-reverse" : ""
        )}
      >
        {icon && (
          <span className={cn(
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {icon}
          </span>
        )}
        <span className="text-sm font-medium">{children}</span>
      </div>
    </Link>
  );
}

export default CourseSidebar;;

const AIToolButton = ({ icon, children, onClick, isActive = false }) => {
  const { locale } = useParams();
  const isRTL = locale === "ar";

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-2 text-sm",
        isActive ? "bg-primary/10 text-primary font-medium" : "",
        isRTL ? "flex-row-reverse" : ""
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
};

// Course Content Structure Component
const CourseContentStructure = ({ course }) => {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    syllabus: true,
    materials: false,
    assignments: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Return placeholder if no course
  if (!course) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium">{t("courseStructure")}</h3>
        <p className="text-sm text-muted-foreground">{t("noCourseSelected")}</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <h3 className="text-sm font-medium px-3 py-2">{t("courseStructure")}</h3>

      {/* Overview section */}
      <Collapsible
        open={expandedSections.overview}
        onOpenChange={() => toggleSection('overview')}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-md cursor-pointer">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("overview")}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.overview ? '' : 'transform -rotate-90'}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-8 space-y-1 py-1">
          <div className="text-sm text-muted-foreground py-1 hover:text-foreground cursor-pointer">
            {t("description")}
          </div>
          <div className="text-sm text-muted-foreground py-1 hover:text-foreground cursor-pointer">
            {t("objectives")}
          </div>
          <div className="text-sm text-muted-foreground py-1 hover:text-foreground cursor-pointer">
            {t("prerequisites")}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Syllabus section */}
      <Collapsible
        open={expandedSections.syllabus}
        onOpenChange={() => toggleSection('syllabus')}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-md cursor-pointer">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("syllabus")}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.syllabus ? '' : 'transform -rotate-90'}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-8 space-y-1 py-1">
          {course.syllabus?.map((week, index) => (
            <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground py-1 hover:text-foreground cursor-pointer">
              <ChevronRight className="h-3 w-3" />
              <span>{t("week")} {week.week}: {week.title}</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Materials section */}
      <Collapsible
        open={expandedSections.materials}
        onOpenChange={() => toggleSection('materials')}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-md cursor-pointer">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("materials")}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.materials ? '' : 'transform -rotate-90'}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-8 space-y-1 py-1">
          {course.materials?.map((material, index) => (
            <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground py-1 hover:text-foreground cursor-pointer">
              {material.type === 'document' ? (
                <FileText className="h-3 w-3" />
              ) : (
                <Layers className="h-3 w-3" />
              )}
              <span>{material.title}</span>
            </div>
          ))}
          <div className="text-sm text-primary flex items-center gap-1 py-1 cursor-pointer">
            <Plus className="h-3 w-3" />
            <span>{t("addMaterial")}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Assignments section */}
      <Collapsible
        open={expandedSections.assignments}
        onOpenChange={() => toggleSection('assignments')}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-md cursor-pointer">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("assignments")}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.assignments ? '' : 'transform -rotate-90'}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-8 space-y-1 py-1">
          {course.assignments?.map((assignment, index) => (
            <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground py-1 hover:text-foreground cursor-pointer">
              <FileQuestion className="h-3 w-3" />
              <span>{assignment.title}</span>
            </div>
          ))}
          <div className="text-sm text-primary flex items-center gap-1 py-1 cursor-pointer">
            <Plus className="h-3 w-3" />
            <span>{t("addAssignment")}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// AI Tools List Component
const AIToolsList = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('generators');

  // Tool categories
  const categories = [
    { id: 'generators', name: t('aiGenerators'), icon: <Sparkles className="h-4 w-4" /> },
    { id: 'assistants', name: t('aiAssistants'), icon: <Bot className="h-4 w-4" /> },
    { id: 'insights', name: t('aiInsights'), icon: <Zap className="h-4 w-4" /> },
  ];

  // Tools by category
  const tools = {
    generators: [
      { id: 'syllabus', name: t('syllabusGenerator'), icon: <FileText className="h-4 w-4" /> },
      { id: 'lesson', name: t('lessonPlanner'), icon: <BookOpen className="h-4 w-4" /> },
      { id: 'quiz', name: t('quizGenerator'), icon: <FileQuestion className="h-4 w-4" /> },
      { id: 'assignment', name: t('assignmentCreator'), icon: <Puzzle className="h-4 w-4" /> },
    ],
    assistants: [
      { id: 'courseCoach', name: t('courseCoach'), icon: <MessageCircle className="h-4 w-4" /> },
      { id: 'contentEnhancer', name: t('contentEnhancer'), icon: <Edit className="h-4 w-4" /> },
      { id: 'ideaGenerator', name: t('ideaGenerator'), icon: <Lightbulb className="h-4 w-4" /> },
    ],
    insights: [
      { id: 'studentInsights', name: t('studentInsights'), icon: <Users className="h-4 w-4" /> },
      { id: 'contentAnalysis', name: t('contentAnalysis'), icon: <Eye className="h-4 w-4" /> },
      { id: 'engagementMetrics', name: t('engagementMetrics'), icon: <Activity className="h-4 w-4" /> },
    ],
  };

  return (
    <div className="p-2 space-y-4">
      <h3 className="text-sm font-medium px-3 py-2">{t("aiTools")}</h3>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 px-2">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "secondary" : "ghost"}
            size="sm"
            className={activeCategory === category.id ? "bg-primary/10 text-primary" : ""}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.icon}
            <span className="ml-1">{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Tools */}
      <div className="space-y-1">
        {tools[activeCategory].map(tool => (
          <AIToolButton
            key={tool.id}
            icon={tool.icon}
            onClick={() => console.log(`Tool clicked: ${tool.id}`)}
          >
            {tool.name}
          </AIToolButton>
        ))}
      </div>

      <Separator />

      {/* Pinned Tools */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground px-3">{t("pinnedTools")}</h4>
        <AIToolButton
          icon={<Pin className="h-4 w-4 text-blue-500" />}
          onClick={() => console.log('Pinned tool clicked')}
        >
          {t("courseAnalyzer")}
        </AIToolButton>
        <AIToolButton
          icon={<Pin className="h-4 w-4 text-green-500" />}
          onClick={() => console.log('Pinned tool clicked')}
        >
          {t("learningObjectivesHelper")}
        </AIToolButton>
      </div>
    </div>
  );
};

// Main Course Sidebar Component
export function CourseSidebar({ className, course, isMobile = false }) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [view, setView] = useState('content'); // 'content' or 'ai'

  // Check if we're on a course detail page
  const isCourseDetail = pathname?.includes('/dashboard/professor/courses/') && !pathname?.endsWith('/courses');

  return (
    <div className={cn("w-64 h-full bg-background border-r flex flex-col", className)}>
      {/* Logo section */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex justify-center mb-2">
          <Logo hideBadge={false} url={`/${locale}/dashboard`} />
        </div>
      </div>

      {/* Tabs for Content / AI Tools */}
      {isCourseDetail && (
        <div className="flex border-b">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-none",
              view === 'content' ? "border-b-2 border-primary" : ""
            )}
            onClick={() => setView('content')}
          >
            <Layers className="h-4 w-4 mr-2" />
            {t("content")}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-none",
              view === 'ai' ? "border-b-2 border-primary" : ""
            )}
            onClick={() => setView('ai')}
          >
            <Brain className="h-4 w-4 mr-2" />
            {t("aiTools")}
          </Button>
        </div>
      )}

      {/* Navigation menu with scrollable area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isCourseDetail ? (
            <>
              {view === 'content' ? (
                <CourseContentStructure course={course} />
              ) : (
                <AIToolsList />
              )}
            </>
          ) : (
            <nav className="space-y-1 p-2">
              {/* Dashboard link */}
              <CourseItem
                href={`/${locale}/dashboard/professor`}
                icon={<BarChart className="h-4 w-4" />}
                isActive={pathname === `/${locale}/dashboard/professor`}
              >
                {t("dashboard")}
              </CourseItem>

              {/* Courses link */}
              <CourseItem
                href={`/${locale}/dashboard/professor/courses`}
                icon={<BookOpen className="h-4 w-4" />}
                isActive={pathname?.includes('/courses')}
              >
                {t("courses")}
              </CourseItem>

              {/* Students link */}
              <CourseItem
                href={`/${locale}/dashboard/professor/students`}
                icon={<Users className="h-4 w-4" />}
                isActive={pathname?.includes('/students')}
              >
                {t("students")}
              </CourseItem>

              {/* Assignments link */}
              <CourseItem
                href={`/${locale}/dashboard/professor/assignments`}
                icon={<FileQuestion className="h-4 w-4" />}
                isActive={pathname?.includes('/assignments')}
              >
                {t("assignments")}
              </CourseItem>

              {/* Materials link */}
              <CourseItem
                href={`/${locale}/dashboard/professor/materials`}
                icon={<FileText className="h-4 w-4" />}
                isActive={pathname?.includes('/materials')}
              >
                {t("materials")}
              </CourseItem>

              {/* Analytics link */}
              <CourseItem
                href={`/${locale}/dashboard/professor/analytics`}
                icon={<Activity className="h-4 w-4" />}
                isActive={pathname?.includes('/analytics')}
              >
                {t("analytics")}
              </CourseItem>

              <Separator className="my-2" />

              {/* AI section */}
              <div className="px-3 py-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  {t("aiTools")}
                </h3>
              </div>

              {/* AI tools */}
              <CourseItem
                href={`/${locale}/dashboard/professor/ai/course-generator`}
                icon={<Sparkles className="h-4 w-4" />}
                isActive={pathname?.includes('/ai/course-generator')}
              >
                {t("courseGenerator")}
              </CourseItem>

              <CourseItem
                href={`/${locale}/dashboard/professor/ai/assignment-generator`}
                icon={<Target className="h-4 w-4" />}
                isActive={pathname?.includes('/ai/assignment-generator')}
              >
                {t("assignmentGenerator")}
              </CourseItem>

              <CourseItem
                href={`/${locale}/dashboard/professor/ai/assistant`}
                icon={<Bot className="h-4 w-4" />}
                isActive={pathname?.includes('/ai/assistant')}
              >
                {t("teachingAssistant")}
              </CourseItem>

              <CourseItem
                href={`/${locale}/dashboard/professor/ai/student-insights`}
                icon={<Zap className="h-4 w-4" />}
                isActive={pathname?.includes('/ai/student-insights')}
              >
                {t("studentInsights")}
              </CourseItem>
            </nav>
          )}
        </ScrollArea>
      </div>

      {/* Footer section */}
      <div className="p-3 border-t flex-shrink-0">
        <TooltipProvider>
          <div className="flex justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("settings")}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Bot className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("askAssistant")}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Flame className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("newFeatures")}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Award className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("achievements")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};
