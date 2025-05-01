"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart, LineChart, ResponsiveContainer, XAxis, YAxis,
  Tooltip, Legend, Bar, Line
} from "recharts";
import { ProfessorAIService } from "@/services/ProfessorClassInsightsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Users, User, BrainCircuit, BarChart3,
  CalendarDays, Clock, Download
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the 3D visualization component
const InsightsVisualization = dynamic(
  () => import("./_components/InsightsVisualization"),
  { ssr: false, loading: () => <Skeleton className="w-full h-[400px] rounded-lg" /> }
);

// Types
type Student = {
  id: number;
  name: string;
  education_level: string;
  academic_track: string;
  activity_score: number;
  last_active: string;
};

type Class = {
  id: number;
  name: string;
  education_level: string;
  academic_track: string;
  student_count: number;
};

type InsightData = {
  id: string;
  title: string;
  description: string;
  recommendationType: "strength" | "improvement" | "classroom";
  subjects: string[];
  relevance: number;
};

type ActivityData = {
  date: string;
  total: number;
  questions: number;
  practice: number;
};

type SubjectActivity = {
  subject: string;
  activity: number;
  improvement: number;
  strength: number;
};

type TopicCluster = {
  id: string;
  name: string;
  count: number;
  difficulty: number;
  color: string;
};

export default function StudentInsightsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30days");
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectActivity[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([]);
  const [visualizationData, setVisualizationData] = useState(null);

  const { toast } = useToast();

  // Constants
  const graphColors = [
    "#4f46e5", "#0891b2", "#7c3aed", "#db2777",
    "#14b8a6", "#f59e0b", "#6366f1", "#10b981"
  ];

  // Effects
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const professorClasses = await ProfessorAIService.getProfessorClasses();
        setClasses(professorClasses as any);

        alert(professorClasses.length)
        if (professorClasses.length > 0) {
          const defaultClass = professorClasses[0].id.toString();
          setSelectedClass(defaultClass);

          // Load students for the selected class
          const classStudents = await ProfessorAIService.getClassStudents(defaultClass);
          setStudents(classStudents as any);

          // Load analytics for all students in class
          await loadAnalytics(defaultClass, "all", dateRange);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load insights data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass) {
      loadAnalytics(selectedClass, selectedStudent, dateRange);
    }
  }, [selectedClass, selectedStudent, dateRange]);

  // Data loading functions
  const loadStudentsForClass = async (classId: string) => {
    try {
      setLoading(true);
      const classStudents = await ProfessorAIService.getClassStudents(classId);
      setStudents(classStudents as any);
      setSelectedStudent("all"); // Reset to all students when class changes
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (classId: string, studentId: string, timeRange: string) => {
    try {
      setLoading(true);

      // Load activity data
      const activity = await ProfessorAIService.getActivityData(classId, studentId, timeRange);
      setActivityData(activity);

      // Load subject activity
      const subjects = await ProfessorAIService.getSubjectActivity(classId, studentId, timeRange);
      setSubjectData(subjects);

      // Load AI insights
      const aiInsights = await ProfessorAIService.getAIInsights(classId, studentId, timeRange);
      setInsights(aiInsights);

      // Load topic clusters
      const clusters = await ProfessorAIService.getTopicClusters(classId, studentId, timeRange);
      setTopicClusters(clusters);

      // Load visualization data
      const vizData = await ProfessorAIService.getVisualizationData(classId, studentId, timeRange);
      setVisualizationData(vizData as any);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load insights analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportInsightsReport = async () => {
    try {
      setLoading(true);
      await ProfessorAIService.exportInsightsReport(
        selectedClass,
        selectedStudent,
        dateRange
      );

      toast({
        title: "Success",
        description: "Report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Computed values
  const selectedClassName = useMemo(() => {
    if (!selectedClass || !classes.length) return "";
    const classObj = classes.find(c => c.id.toString() === selectedClass);
    return classObj ? classObj.name : "";
  }, [selectedClass, classes]);

  const selectedStudentName = useMemo(() => {
    if (selectedStudent === "all") return "All Students";
    if (!selectedStudent || !students.length) return "";
    const studentObj = students.find(s => s.id.toString() === selectedStudent);
    return studentObj ? studentObj.name : "";
  }, [selectedStudent, students]);

  // Filter insights by type
  const strengthInsights = useMemo(() =>
    insights.filter(i => i.recommendationType === "strength"),
    [insights]
  );

  const improvementInsights = useMemo(() =>
    insights.filter(i => i.recommendationType === "improvement"),
    [insights]
  );

  const classroomInsights = useMemo(() =>
    insights.filter(i => i.recommendationType === "classroom"),
    [insights]
  );

  // Render components
  const renderFilters = () => (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 mb-6">
      <div className="w-full md:w-1/4">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger>
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((classItem) => (
              <SelectItem key={classItem.id} value={classItem.id.toString()}>
                {classItem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-1/4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger>
            <SelectValue placeholder="Select Student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id.toString()}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-1/4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="semester">This Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-1/4">
        <Button onClick={exportInsightsReport} className="w-full" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );

  const renderActivitySection = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Tutoring Activity</CardTitle>
            <CardDescription>
              Usage patterns over time for {selectedStudentName}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {dateRange === "7days" ? "Last 7 Days" :
               dateRange === "30days" ? "Last 30 Days" :
               dateRange === "90days" ? "Last 90 Days" : "This Semester"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px] rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke={graphColors[0]}
                name="Total Activity"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="questions"
                stroke={graphColors[1]}
                name="Questions Asked"
              />
              <Line
                type="monotone"
                dataKey="practice"
                stroke={graphColors[2]}
                name="Practice Sessions"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderSubjectActivitySection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Subject Activity</CardTitle>
        <CardDescription>
          AI tutoring usage by subject for {selectedStudentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[300px] rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="activity"
                fill={graphColors[0]}
                name="Activity Level"
              />
              <Bar
                dataKey="improvement"
                fill={graphColors[1]}
                name="Areas for Improvement"
              />
              <Bar
                dataKey="strength"
                fill={graphColors[2]}
                name="Strengths"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderInsightTabs = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>AI-Generated Insights</CardTitle>
        <CardDescription>
          Personalized recommendations based on AI tutoring data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classroom" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classroom" className="flex items-center justify-center">
              <BrainCircuit className="mr-2 h-4 w-4" />
              <span>Classroom Activities</span>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {classroomInsights.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="strengths" className="flex items-center justify-center">
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Areas of Strength</span>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {strengthInsights.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="improvements" className="flex items-center justify-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Areas for Improvement</span>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {improvementInsights.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classroom" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-16 rounded-lg" />
              </div>
            ) : classroomInsights.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">No classroom recommendations yet</h3>
                <p className="mt-2">
                  As students continue to use the AI tutoring platform, recommendations
                  for classroom activities will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {classroomInsights.map((insight) => (
                  <Card key={insight.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="rounded-full p-2 bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {insight.subjects.map((subject) => (
                              <span
                                key={subject}
                                className="text-xs rounded-full bg-secondary px-2.5 py-0.5"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="strengths" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-16 rounded-lg" />
              </div>
            ) : strengthInsights.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">No strengths identified yet</h3>
                <p className="mt-2">
                  As students continue to use the AI tutoring platform, their areas
                  of strength will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {strengthInsights.map((insight) => (
                  <Card key={insight.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="rounded-full p-2 bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {insight.subjects.map((subject) => (
                              <span
                                key={subject}
                                className="text-xs rounded-full bg-secondary px-2.5 py-0.5"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="improvements" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-16 rounded-lg" />
                <Skeleton className="w-full h-16 rounded-lg" />
              </div>
            ) : improvementInsights.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">No improvement areas identified yet</h3>
                <p className="mt-2">
                  As students continue to use the AI tutoring platform, areas
                  for improvement will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {improvementInsights.map((insight) => (
                  <Card key={insight.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="rounded-full p-2 bg-primary/10">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {insight.subjects.map((subject) => (
                              <span
                                key={subject}
                                className="text-xs rounded-full bg-secondary px-2.5 py-0.5"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderTopicVisualizations = () => (
    <Card>
      <CardHeader>
        <CardTitle>Topic Distribution and Embeddings</CardTitle>
        <CardDescription>
          3D visualization of AI tutoring session topics and clustering
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full h-[400px] rounded-lg" />
        ) : (
          <InsightsVisualization
            visualizationData={visualizationData}
            topicClusters={topicClusters}
            selectedStudent={selectedStudent}
            selectedClass={selectedClass}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Student AI Insights</h1>
        <p className="text-muted-foreground mt-1">
          Analyze AI tutoring patterns and generate insights for classroom integration
        </p>
      </div>

      {renderFilters()}

      {renderActivitySection()}

      {renderSubjectActivitySection()}

      {renderInsightTabs()}

      {renderTopicVisualizations()}
    </div>
  );
}
