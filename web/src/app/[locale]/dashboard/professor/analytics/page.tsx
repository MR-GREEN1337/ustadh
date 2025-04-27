"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Braces,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  FileText,
  BarChart2,
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Lightbulb,
  ArrowRight,
  Book,
  Clock,
  Target,
  Layers,
  LucideIcon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Service imports
import { ProfessorAnalyticsService } from '@/services/ProfessorAnalyticsService';

// Types
interface CoursePerformance {
  id: number;
  title: string;
  totalStudents: number;
  averageGrade: number;
  completionRate: number;
  engagementScore: number;
  difficultyRating: number;
  aiGeneratedImprovement: string;
}

interface PerformanceByTopic {
  topic: string;
  score: number;
  difficulty: number;
  engagementLevel: number;
  timeSpent: number;
  improvementSuggestion?: string;
}

interface StudentActivity {
  date: string;
  activeStudents: number;
  submissions: number;
  tutoringSessions: number;
}

interface ProblemArea {
  id: number;
  title: string;
  category: string;
  affectedStudents: number;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
}

interface LearningOutcome {
  id: string;
  name: string;
  achievementRate: number;
  targetRate: number;
}

interface StrengthWeakness {
  strength: boolean;
  topic: string;
  details: string;
  students: number;
  impact: number;
}

interface AnalyticsFilter {
  timeRange: string;
  courseId?: number;
  studentGroups?: string[];
  topics?: string[];
}

const ProfessorAnalyticsPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const isRTL = locale === "ar";

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<AnalyticsFilter>({
    timeRange: 'semester',
  });
  const [courseList, setCourseList] = useState<{ id: number, title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<PerformanceByTopic[]>([]);
  const [studentActivity, setStudentActivity] = useState<StudentActivity[]>([]);
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState<StrengthWeakness[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // COLORS
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const SEVERITY_COLORS = {
    low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch courses
        const coursesResponse = await ProfessorAnalyticsService.getCourses();
        setCourseList(coursesResponse.courses);

        if (coursesResponse.courses.length > 0) {
          const defaultCourseId = coursesResponse.courses[0].id;
          setSelectedCourse(defaultCourseId);

          // Fetch analytics for default course
          await loadCourseAnalytics(defaultCourseId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadCourseAnalytics = async (courseId: number) => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [
        performanceData,
        topicsData,
        activityData,
        problemsData,
        outcomesData,
        strengthsData
      ] = await Promise.all([
        ProfessorAnalyticsService.getCoursePerformance(courseId, filters.timeRange),
        ProfessorAnalyticsService.getTopicPerformance(courseId, filters.timeRange),
        ProfessorAnalyticsService.getStudentActivity(courseId, filters.timeRange),
        ProfessorAnalyticsService.getProblemAreas(courseId, filters.timeRange),
        ProfessorAnalyticsService.getLearningOutcomes(courseId, filters.timeRange),
        ProfessorAnalyticsService.getStrengthsWeaknesses(courseId, filters.timeRange)
      ]);

      setCoursePerformance(performanceData);
      setTopicPerformance(topicsData);
      setStudentActivity(activityData);
      setProblemAreas(problemsData);
      setLearningOutcomes(outcomesData);
      setStrengthsWeaknesses(strengthsData);

      setLoading(false);
    } catch (error) {
      console.error("Error loading course analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load course analytics data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    const numericId = parseInt(courseId, 10);
    setSelectedCourse(numericId);
    loadCourseAnalytics(numericId);
  };

  const handleTimeRangeChange = (range: string) => {
    setFilters({ ...filters, timeRange: range });
    if (selectedCourse) {
      loadCourseAnalytics(selectedCourse);
    }
  };

  const handleRefreshData = () => {
    if (selectedCourse) {
      loadCourseAnalytics(selectedCourse);
      toast({
        title: "Refreshing Data",
        description: "Analytics data is being updated",
      });
    }
  };

  const generateAIInsights = async () => {
    if (!selectedCourse) return;

    try {
      setIsGeneratingInsights(true);
      toast({
        title: "Generating Insights",
        description: "Our AI is analyzing your course data to generate personalized insights",
      });

      const insights = await ProfessorAnalyticsService.generateAIInsights(selectedCourse);

      // Update the data with AI-generated insights
      const updatedProblems = insights.problemAreas || problemAreas;
      setProblemAreas(updatedProblems);

      // Handle other updated data
      if (insights.topicSuggestions) {
        const updatedTopics = topicPerformance.map(topic => {
          const suggestion = insights.topicSuggestions?.find(s => s.topic === topic.topic);
          return suggestion ? { ...topic, improvementSuggestion: suggestion.improvement } : topic;
        });
        setTopicPerformance(updatedTopics);
      }

      setIsGeneratingInsights(false);
      toast({
        title: "Insights Generated",
        description: "AI analysis complete. New insights and recommendations are now available.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      });
      setIsGeneratingInsights(false);
    }
  };

  const exportAnalyticsData = () => {
    toast({
      title: "Exporting Data",
      description: "Your analytics data is being prepared for download",
    });

    // Implementation would call the export endpoint
    ProfessorAnalyticsService.exportAnalytics(selectedCourse!, filters.timeRange)
      .then((url) => {
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `course-analytics-${selectedCourse}-${filters.timeRange}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch((error) => {
        console.error("Error exporting data:", error);
        toast({
          title: "Export Failed",
          description: "Could not export analytics data",
          variant: "destructive",
        });
      });
  };

  // Helper function to determine color based on value
  const getPerformanceColor = (value: number) => {
    if (value < 50) return 'text-red-500';
    if (value < 70) return 'text-orange-500';
    if (value < 85) return 'text-blue-500';
    return 'text-green-500';
  };

  return (
    <div className={`space-y-8 max-w-7xl mx-auto px-4 pb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header with Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('courseAnalytics') || 'Course Analytics'}</h1>
          <p className="text-muted-foreground mt-1">
            {t('analyticsDescription') || 'Gain insights into student performance and course effectiveness'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.timeRange}
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('selectTimeRange') || "Select time range"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('lastWeek') || "Last Week"}</SelectItem>
              <SelectItem value="month">{t('lastMonth') || "Last Month"}</SelectItem>
              <SelectItem value="semester">{t('thisSemester') || "This Semester"}</SelectItem>
              <SelectItem value="year">{t('academicYear') || "Academic Year"}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedCourse?.toString() || ""}
            onValueChange={handleCourseChange}
          >
            <SelectTrigger className="w-[200px]">
              <Book className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('selectCourse') || "Select course"} />
            </SelectTrigger>
            <SelectContent>
              {courseList.map(course => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={exportAnalyticsData}>
            <Download className="h-4 w-4 mr-2" />
            {t('export') || "Export"}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 max-w-4xl">
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            {t('overview') || "Overview"}
          </TabsTrigger>
          <TabsTrigger value="topics">
            <Layers className="h-4 w-4 mr-2" />
            {t('topicAnalysis') || "Topic Analysis"}
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Users className="h-4 w-4 mr-2" />
            {t('studentEngagement') || "Student Engagement"}
          </TabsTrigger>
          <TabsTrigger value="issues">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t('problemAreas') || "Problem Areas"}
          </TabsTrigger>
          <TabsTrigger value="outcomes">
            <Target className="h-4 w-4 mr-2" />
            {t('learningOutcomes') || "Learning Outcomes"}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">{t('loadingAnalytics') || "Loading analytics data..."}</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* AI Insights Button */}
              <div className="flex justify-end mb-4">
                <Button
                  onClick={generateAIInsights}
                  disabled={isGeneratingInsights}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {isGeneratingInsights
                    ? t('generatingInsights') || "Generating Insights..."
                    : t('generateAIInsights') || "Generate AI Insights"}
                </Button>
              </div>

              {/* Course Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedCourse && coursePerformance.map(course => (
                  course.id === selectedCourse && (
                    <React.Fragment key={course.id}>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('averageGrade') || "Average Grade"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            <span className={getPerformanceColor(course.averageGrade)}>
                              {course.averageGrade}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('completionRate') || "Completion Rate"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            <span className={getPerformanceColor(course.completionRate)}>
                              {course.completionRate}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('engagementScore') || "Engagement Score"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            <span className={getPerformanceColor(course.engagementScore)}>
                              {course.engagementScore}/10
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('activeStudents') || "Active Students"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {course.totalStudents}
                          </div>
                        </CardContent>
                      </Card>
                    </React.Fragment>
                  )
                ))}
              </div>

              {/* Chart showing student activity over time */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>{t('studentActivityOverTime') || "Student Activity Over Time"}</CardTitle>
                  <CardDescription>
                    {t('activityDescription') || "Track active students, submissions and tutoring sessions"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={studentActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            const displayName = name === 'activeStudents'
                              ? t('activeStudents') || 'Active Students'
                              : name === 'submissions'
                                ? t('submissions') || 'Submissions'
                                : t('tutoringSessions') || 'Tutoring Sessions';
                            return [value, displayName];
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="activeStudents"
                          name={t('activeStudents') || "Active Students"}
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="submissions"
                          name={t('submissions') || "Submissions"}
                          stroke="#82ca9d"
                        />
                        <Line
                          type="monotone"
                          dataKey="tutoringSessions"
                          name={t('tutoringSessions') || "Tutoring Sessions"}
                          stroke="#ffc658"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* AI Improvement Suggestions Card */}
              {selectedCourse && coursePerformance.find(c => c.id === selectedCourse)?.aiGeneratedImprovement && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-purple-500" />
                      {t('aiGeneratedInsights') || "AI-Generated Insights"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {coursePerformance.find(c => c.id === selectedCourse)?.aiGeneratedImprovement}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {t('implementSuggestions') || "Implement Suggestions"}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      {t('courseStrengths') || "Course Strengths"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {strengthsWeaknesses
                        .filter(item => item.strength)
                        .map((strength, idx) => (
                          <li key={idx} className="flex items-start space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <div className="w-full">
                              <p className="font-medium">{strength.topic}</p>
                              <p className="text-sm text-muted-foreground">{strength.details}</p>
                              <div className="flex justify-between items-center mt-1">
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                  {strength.students} {t('students') || "students"}
                                </Badge>
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  +{strength.impact}% {t('performance') || "performance"}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                      {t('courseWeaknesses') || "Course Weaknesses"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {strengthsWeaknesses
                        .filter(item => !item.strength)
                        .map((weakness, idx) => (
                          <li key={idx} className="flex items-start space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                            <div className="w-full">
                              <p className="font-medium">{weakness.topic}</p>
                              <p className="text-sm text-muted-foreground">{weakness.details}</p>
                              <div className="flex justify-between items-center mt-1">
                                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                                  {weakness.students} {t('students') || "students"}
                                </Badge>
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  -{weakness.impact}% {t('performance') || "performance"}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Topics Analysis Tab */}
            <TabsContent value="topics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('topicPerformanceAnalysis') || "Topic Performance Analysis"}</CardTitle>
                  <CardDescription>
                    {t('topicPerformanceDesc') || "Compare student performance across different course topics"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topicPerformance}
                        margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            const displayName = name === 'score'
                              ? t('averageScore') || 'Average Score'
                              : name === 'difficulty'
                                ? t('difficulty') || 'Difficulty'
                                : name === 'engagementLevel'
                                  ? t('engagement') || 'Engagement'
                                  : t('timeSpent') || 'Time Spent (min)';
                            return [value, displayName];
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="score"
                          name={t('averageScore') || "Average Score"}
                          fill="#8884d8"
                        />
                        <Bar
                          dataKey="difficulty"
                          name={t('difficulty') || "Difficulty"}
                          fill="#82ca9d"
                        />
                        <Bar
                          dataKey="engagementLevel"
                          name={t('engagement') || "Engagement"}
                          fill="#ffc658"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('timeSpentByTopic') || "Time Spent by Topic (minutes)"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topicPerformance}
                            nameKey="topic"
                            dataKey="timeSpent"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({topic, timeSpent}) => `${topic}: ${timeSpent}min`}
                          >
                            {topicPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} min`, t('timeSpent') || 'Time Spent']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('topicDifficultyRanking') || "Topic Difficulty Ranking"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('topic') || "Topic"}</TableHead>
                          <TableHead>{t('difficulty') || "Difficulty"}</TableHead>
                          <TableHead>{t('avgScore') || "Avg. Score"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...topicPerformance]
                          .sort((a, b) => b.difficulty - a.difficulty)
                          .map((topic, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{topic.topic}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Progress
                                    value={topic.difficulty * 10}
                                    className="h-2 w-24 mr-2"
                                  />
                                  <span className="text-sm">
                                    {topic.difficulty}/10
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className={getPerformanceColor(topic.score)}>
                                {topic.score}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Topic Improvement Suggestions */}
              <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-purple-500" />
                    {t('topicImprovementSuggestions') || "Topic Improvement Suggestions"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topicPerformance
                      .filter(topic => topic.improvementSuggestion)
                      .map((topic, idx) => (
                        <div key={idx} className="border-b pb-4 border-purple-100 dark:border-purple-900 last:border-0">
                          <h4 className="font-medium mb-1">{topic.topic}</h4>
                          <p className="text-sm">{topic.improvementSuggestion}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Target className="h-3 w-3 mr-1" />
                              {t('currentScore') || "Current Score"}: {topic.score}%
                            </div>
                            <Button size="sm" variant="ghost" className="text-xs text-purple-600 h-7">
                              {t('applyFeedback') || "Apply Feedback"}
                            </Button>
                          </div>
                        </div>
                      ))}

                    {!topicPerformance.some(topic => topic.improvementSuggestion) && (
                      <div className="flex flex-col items-center justify-center py-6">
                        <HelpCircle className="h-10 w-10 text-purple-300 mb-2" />
                        <p className="text-muted-foreground text-center">
                          {t('noSuggestionsYet') || "No suggestions yet. Generate AI insights to get improvement recommendations."}
                        </p>
                        <Button
                          onClick={generateAIInsights}
                          disabled={isGeneratingInsights}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          {t('generateInsights') || "Generate Insights"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Student Engagement Tab */}
            <TabsContent value="engagement" className="space-y-6">
              {/* Activity heatmap */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('studentActivityTrends') || "Student Activity Trends"}</CardTitle>
                  <CardDescription>
                    {t('activityTrendsDesc') || "Track how student engagement has changed over time"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={studentActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="activeStudents"
                          name={t('activeStudents') || "Active Students"}
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="submissions"
                          name={t('submissions') || "Submissions"}
                          stroke="#82ca9d"
                        />
                        <Line
                          type="monotone"
                          dataKey="tutoringSessions"
                          name={t('tutoringSessions') || "Tutoring Sessions"}
                          stroke="#ffc658"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement by topic metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{t('engagementByTopic') || "Engagement by Topic"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('topic') || "Topic"}</TableHead>
                          <TableHead>{t('engagementScore') || "Engagement Score"}</TableHead>
                          <TableHead>{t('timeSpent') || "Time Spent"}</TableHead>
                          <TableHead>{t('participation') || "Participation"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...topicPerformance]
                          .sort((a, b) => b.engagementLevel - a.engagementLevel)
                          .map((topic, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{topic.topic}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Progress
                                    value={topic.engagementLevel * 10}
                                    className={`h-2 w-24 mr-2 ${
                                      topic.engagementLevel < 5 ? 'bg-red-200' :
                                      topic.engagementLevel < 7 ? 'bg-yellow-200' : 'bg-green-200'
                                    }`}
                                  />
                                  <span className="text-sm">
                                    {topic.engagementLevel}/10
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{topic.timeSpent} min</TableCell>
                              <TableCell>
                                {Math.round(70 + Math.random() * 30)}%
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('engagementDistribution') || "Engagement Distribution"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: t('highEngagement') || 'High Engagement', value: 40 },
                              { name: t('mediumEngagement') || 'Medium Engagement', value: 30 },
                              { name: t('lowEngagement') || 'Low Engagement', value: 20 },
                              { name: t('inactive') || 'Inactive', value: 10 },
                            ]}
                            nameKey="name"
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            <Cell fill="#4CAF50" />
                            <Cell fill="#FFC107" />
                            <Cell fill="#FF9800" />
                            <Cell fill="#F44336" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement improvement recommendations */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-blue-500" />
                    {t('engagementRecommendations') || "Engagement Recommendations"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-950">
                      <h4 className="font-medium flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        {t('interactiveActivities') || "Add More Interactive Activities"}
                      </h4>
                      <p className="text-sm mt-1">
                        {t('interactiveActivitiesDesc') || "Our AI analysis suggests that students are more engaged during interactive sessions. Consider adding more group activities, discussions, and hands-on exercises, especially for topics with low engagement scores."}
                      </p>
                    </div>

                    <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-950">
                      <h4 className="font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-500" />
                        {t('optimalContentTiming') || "Optimize Content Timing"}
                      </h4>
                      <p className="text-sm mt-1">
                        {t('timingDesc') || "Student engagement drops significantly for content longer than 15 minutes. Break down lectures into shorter segments with interactive components between them."}
                      </p>
                    </div>

                    <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-gray-950">
                      <h4 className="font-medium flex items-center">
                        <Braces className="h-4 w-4 mr-2 text-blue-500" />
                        {t('realWorldExamples') || "Incorporate Real-World Examples"}
                      </h4>
                      <p className="text-sm mt-1">
                        {t('examplesDesc') || "Topics with practical, real-world applications show 42% higher engagement. Consider adding more case studies and practical examples to your theoretical content."}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-800">
                    {t('generateCustomStrategies') || "Generate Custom Strategies"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Problem Areas Tab */}
            <TabsContent value="issues" className="space-y-6">
              {/* Problems list */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('identifiedProblemAreas') || "Identified Problem Areas"}</CardTitle>
                  <CardDescription>
                    {t('problemAreasDesc') || "Issues detected in course content and student performance"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {problemAreas.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('issue') || "Issue"}</TableHead>
                          <TableHead>{t('category') || "Category"}</TableHead>
                          <TableHead>{t('severity') || "Severity"}</TableHead>
                          <TableHead>{t('affectedStudents') || "Affected Students"}</TableHead>
                          <TableHead>{t('actions') || "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {problemAreas.map((problem) => (
                          <TableRow key={problem.id}>
                            <TableCell className="font-medium">{problem.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {problem.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={SEVERITY_COLORS[problem.severity]}>
                                {problem.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{problem.affectedStudents}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                {t('viewDetails') || "View Details"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                      <h3 className="text-xl font-medium text-center">
                        {t('noIssuesDetected') || "No significant issues detected"}
                      </h3>
                      <p className="text-muted-foreground text-center mt-2">
                        {t('coursePerformingWell') || "This course is performing well. Continue monitoring for new issues."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed problem analysis */}
              {problemAreas.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Problem distribution chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('problemDistribution') || "Problem Distribution by Category"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                (() => {
                                  const categories: Record<string, number> = {};
                                  problemAreas.forEach(problem => {
                                    categories[problem.category] = (categories[problem.category] || 0) + 1;
                                  });
                                  return Object.entries(categories).map(([name, value]) => ({ name, value }));
                                })()
                              }
                              nameKey="name"
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {Object.keys(
                                (() => {
                                  const categories: Record<string, number> = {};
                                  problemAreas.forEach(problem => {
                                    categories[problem.category] = (categories[problem.category] || 0) + 1;
                                  });
                                  return categories;
                                })()
                              ).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI suggested actions */}
                  <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/10">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2 text-red-500" />
                        {t('suggestedActions') || "Suggested Actions"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {problemAreas
                          .sort((a, b) => {
                            const severityOrder = { high: 0, medium: 1, low: 2 };
                            return severityOrder[a.severity] - severityOrder[b.severity];
                          })
                          .slice(0, 3)
                          .map((problem, idx) => (
                            <div key={idx} className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-gray-950">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{problem.title}</h4>
                                <Badge className={SEVERITY_COLORS[problem.severity]}>
                                  {problem.severity}
                                </Badge>
                              </div>
                              <p className="text-sm mt-2">
                                {problem.suggestedAction}
                              </p>
                              <div className="flex justify-end mt-2">
                                <Button variant="ghost" size="sm" className="text-red-600 h-7 text-xs">
                                  {t('implementFix') || "Implement Fix"}
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="text-red-600 border-red-200 dark:border-red-800 w-full">
                        {t('generateComprehensivePlan') || "Generate Comprehensive Improvement Plan"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Historical problems chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('problemsOverTime') || "Problems Over Time"}</CardTitle>
                  <CardDescription>
                    {t('problemsTrendDesc') || "Track how course issues have evolved over the selected time period"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { date: '2023-09', content: 5, understanding: 3, engagement: 2 },
                          { date: '2023-10', content: 4, understanding: 4, engagement: 3 },
                          { date: '2023-11', content: 3, understanding: 3, engagement: 2 },
                          { date: '2023-12', content: 2, understanding: 2, engagement: 1 },
                          { date: '2024-01', content: 3, understanding: 1, engagement: 2 },
                          { date: '2024-02', content: 1, understanding: 1, engagement: 2 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="content"
                          name={t('contentIssues') || "Content Issues"}
                          stroke="#ff7300"
                        />
                        <Line
                          type="monotone"
                          dataKey="understanding"
                          name={t('understandingIssues') || "Understanding Issues"}
                          stroke="#d84315"
                        />
                        <Line
                          type="monotone"
                          dataKey="engagement"
                          name={t('engagementIssues') || "Engagement Issues"}
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Learning Outcomes Tab */}
            <TabsContent value="outcomes" className="space-y-6">
              {/* Learning outcomes progress */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('learningOutcomesProgress') || "Learning Outcomes Progress"}</CardTitle>
                  <CardDescription>
                    {t('outcomesProgressDesc') || "Track student achievement against defined learning outcomes"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {learningOutcomes.map((outcome) => (
                      <div key={outcome.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{outcome.name}</span>
                          <span className="text-sm">
                            {outcome.achievementRate}% / {outcome.targetRate}%
                          </span>
                        </div>
                        <div className="relative pt-1">
                          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                            <div
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                outcome.achievementRate >= outcome.targetRate
                                  ? 'bg-green-500'
                                  : outcome.achievementRate >= outcome.targetRate * 0.8
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${outcome.achievementRate}%` }}
                            ></div>
                            <div
                              className="absolute h-4 w-px bg-black dark:bg-white top-0 z-10"
                              style={{ left: `${outcome.targetRate}%`, height: '0.5rem' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Outcomes distribution chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('outcomesAchievementDistribution') || "Outcomes Achievement Distribution"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { range: '90-100%', count: learningOutcomes.filter(o => o.achievementRate >= 90).length },
                            { range: '80-89%', count: learningOutcomes.filter(o => o.achievementRate >= 80 && o.achievementRate < 90).length },
                            { range: '70-79%', count: learningOutcomes.filter(o => o.achievementRate >= 70 && o.achievementRate < 80).length },
                            { range: '60-69%', count: learningOutcomes.filter(o => o.achievementRate >= 60 && o.achievementRate < 70).length },
                            { range: '<60%', count: learningOutcomes.filter(o => o.achievementRate < 60).length },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" name={t('outcomes') || "Outcomes"} fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Outcome recommendations */}
                <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-indigo-500" />
                      {t('outcomesRecommendations') || "Learning Outcomes Recommendations"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {learningOutcomes
                        .filter(outcome => outcome.achievementRate < outcome.targetRate * 0.9)
                        .slice(0, 3)
                        .map((outcome, idx) => (
                          <div key={idx} className="p-4 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-gray-950">
                            <h4 className="font-medium">{outcome.name}</h4>
                            <div className="flex justify-between items-center mt-1 text-sm">
                              <span className="text-muted-foreground">
                                {t('currentAchievement') || "Current"}: {outcome.achievementRate}%
                              </span>
                              <span className="text-muted-foreground">
                                {t('target') || "Target"}: {outcome.targetRate}%
                              </span>
                              <span className={outcome.achievementRate < outcome.targetRate * 0.7 ? 'text-red-500' : 'text-yellow-500'}>
                                {t('gap') || "Gap"}: {outcome.targetRate - outcome.achievementRate}%
                              </span>
                            </div>
                            <Separator className="my-2" />
                            <p className="text-sm mt-1">
                              {idx === 0 && (t('improveSuggestion1') || "Consider revising the instructional approach. Implement more practice exercises and real-world scenarios.")}
                              {idx === 1 && (t('improveSuggestion2') || "Try breaking down complex concepts into smaller, more manageable components with visual aids.")}
                              {idx === 2 && (t('improveSuggestion3') || "Add supplementary materials and encourage peer learning through group discussions.")}
                            </p>
                          </div>
                        ))}

                      {learningOutcomes.filter(outcome => outcome.achievementRate < outcome.targetRate * 0.9).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6">
                          <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                          <p className="text-center text-muted-foreground">
                            {t('allOutcomesOnTrack') || "All learning outcomes are on track to meet their targets. Great work!"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="text-indigo-600 border-indigo-200 dark:border-indigo-800 w-full">
                      {t('recalibrateOutcomes') || "Recalibrate Learning Outcomes"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Outcomes mapping to activities */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('outcomesToActivitiesMapping') || "Mapping Outcomes to Course Activities"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('learningOutcome') || "Learning Outcome"}</TableHead>
                        <TableHead>{t('relatedActivities') || "Related Activities"}</TableHead>
                        <TableHead>{t('assessmentMethods') || "Assessment Methods"}</TableHead>
                        <TableHead>{t('achievement') || "Achievement"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learningOutcomes.slice(0, 5).map((outcome, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{outcome.name}</TableCell>
                          <TableCell>
                            {idx === 0 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Lecture 3</Badge>
                                <Badge variant="outline">Lab 2</Badge>
                                <Badge variant="outline">Discussion 1</Badge>
                              </div>
                            )}
                            {idx === 1 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Lecture 5</Badge>
                                <Badge variant="outline">Project 1</Badge>
                              </div>
                            )}
                            {idx === 2 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Lecture 7</Badge>
                                <Badge variant="outline">Exercise 4</Badge>
                                <Badge variant="outline">Lab 5</Badge>
                              </div>
                            )}
                            {idx === 3 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Project 2</Badge>
                                <Badge variant="outline">Discussion 3</Badge>
                              </div>
                            )}
                            {idx === 4 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Lecture 10</Badge>
                                <Badge variant="outline">Final Project</Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {idx === 0 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Quiz 2</Badge>
                                <Badge variant="outline">Homework 3</Badge>
                              </div>
                            )}
                            {idx === 1 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Midterm Exam</Badge>
                              </div>
                            )}
                            {idx === 2 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Lab Report</Badge>
                                <Badge variant="outline">Quiz 5</Badge>
                              </div>
                            )}
                            {idx === 3 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Project Presentation</Badge>
                              </div>
                            )}
                            {idx === 4 && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline">Final Exam</Badge>
                                <Badge variant="outline">Project Report</Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Progress
                                value={outcome.achievementRate}
                                className={`h-2 w-24 mr-2 ${
                                  outcome.achievementRate < 70 ? 'bg-red-200' :
                                  outcome.achievementRate < 85 ? 'bg-yellow-200' : 'bg-green-200'
                                }`}
                              />
                              <span className={`text-sm ${getPerformanceColor(outcome.achievementRate)}`}>
                                {outcome.achievementRate}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default ProfessorAnalyticsPage;
