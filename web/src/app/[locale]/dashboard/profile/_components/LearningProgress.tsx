"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Award,
  BarChart,
  Check,
  Clock,
  AlertCircle,
  Star,
  ChevronRight,
  BarChart2,
  Calendar
} from "lucide-react";
import { ProfileService } from "@/services/ProfileService";
import { useToast } from "@/hooks/use-toast";

// Types
interface Subject {
  id: number;
  name: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
  last_activity: string;
}

interface Assignment {
  id: number;
  title: string;
  subject: string;
  due_date: string;
  status: "completed" | "pending" | "overdue";
  score?: number;
}

interface Activity {
  id: number;
  type: "lesson" | "quiz" | "practice" | "tutoring";
  title: string;
  subject: string;
  date: string;
  duration: number;
  score?: number;
  status: "completed" | "in_progress";
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  date_earned: string;
  icon: string;
}

interface ProgressData {
  subjects: Subject[];
  assignments: Assignment[];
  recent_activities: Activity[];
  achievements: Achievement[];
  streak_days: number;
  study_time_week: number;
  average_score: number;
}

interface LearningProgressProps {
  studentId?: number; // Optional for guardian view
  studentName?: string; // Optional for guardian view
  studentUsername?: string; // Optional for guardian view
}

export default function LearningProgress({
  studentId,
  studentName,
  studentUsername
}: LearningProgressProps) {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const { toast } = useToast();
  const isGuardianView = !!studentId;

  // Fetch progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      setLoading(true);
      try {
        const data = await ProfileService.getStudentProgress(studentId);
        setProgressData(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load progress data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [studentId, toast]);

  // For demo purposes, create sample data if none is returned from API
  useEffect(() => {
    if (!loading && !progressData) {
      // Sample data for demonstration
      const sampleData: ProgressData = {
        subjects: [
          {
            id: 1,
            name: "Mathematics",
            progress: 78,
            total_lessons: 32,
            completed_lessons: 25,
            last_activity: "2025-04-01"
          },
          {
            id: 2,
            name: "Physics",
            progress: 62,
            total_lessons: 28,
            completed_lessons: 17,
            last_activity: "2025-04-02"
          },
          {
            id: 3,
            name: "English Literature",
            progress: 45,
            total_lessons: 24,
            completed_lessons: 11,
            last_activity: "2025-03-30"
          },
          {
            id: 4,
            name: "Chemistry",
            progress: 30,
            total_lessons: 30,
            completed_lessons: 9,
            last_activity: "2025-03-25"
          }
        ],
        assignments: [
          {
            id: 1,
            title: "Quadratic Equations",
            subject: "Mathematics",
            due_date: "2025-04-05",
            status: "completed",
            score: 92
          },
          {
            id: 2,
            title: "Analysis of Sonnet 18",
            subject: "English Literature",
            due_date: "2025-04-06",
            status: "pending"
          },
          {
            id: 3,
            title: "Balancing Chemical Equations",
            subject: "Chemistry",
            due_date: "2025-04-01",
            status: "overdue"
          }
        ],
        recent_activities: [
          {
            id: 1,
            type: "lesson",
            title: "Introduction to Newton's Laws",
            subject: "Physics",
            date: "2025-04-02",
            duration: 45,
            status: "completed"
          },
          {
            id: 2,
            type: "quiz",
            title: "Algebra Quiz 3",
            subject: "Mathematics",
            date: "2025-04-01",
            duration: 20,
            score: 85,
            status: "completed"
          },
          {
            id: 3,
            type: "tutoring",
            title: "AI Tutoring Session on Metaphors",
            subject: "English Literature",
            date: "2025-03-30",
            duration: 30,
            status: "completed"
          }
        ],
        achievements: [
          {
            id: 1,
            title: "Math Whiz",
            description: "Complete 25 math lessons",
            date_earned: "2025-03-28",
            icon: "award"
          },
          {
            id: 2,
            title: "One Week Streak",
            description: "Study for 7 consecutive days",
            date_earned: "2025-03-25",
            icon: "flame"
          }
        ],
        streak_days: 7,
        study_time_week: 8.5,
        average_score: 84
      };

      setProgressData(sampleData);
    }
  }, [loading, progressData]);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "overdue":
        return "bg-red-500";
      case "in_progress":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="h-4 w-4" />;
      case "quiz":
        return <BarChart className="h-4 w-4" />;
      case "practice":
        return <Check className="h-4 w-4" />;
      case "tutoring":
        return <Award className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>
            {isGuardianView
              ? `Viewing ${studentName}'s learning progress`
              : "View your learning progress and activities"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading progress data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>
            {isGuardianView
              ? `Viewing ${studentName}'s learning progress`
              : "View your learning progress and activities"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground max-w-md">
            No learning progress data available at this time. Start learning to see your progress tracked here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // StudentInfo component for guardian view
  const StudentInfo = () => {
    if (!isGuardianView) return null;

    return (
      <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentUsername}`} />
          <AvatarFallback>{studentName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{studentName}</h2>
          <p className="text-muted-foreground">@{studentUsername}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Award className="h-3 w-3" />
              <span>{progressData.streak_days} day streak</span>
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <BarChart className="h-3 w-3" />
              <span>{progressData.average_score}% avg. score</span>
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <StudentInfo />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">{progressData.streak_days}</h3>
              <p className="text-sm text-muted-foreground">day study streak</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">{progressData.study_time_week}</h3>
              <p className="text-sm text-muted-foreground">hours this week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">{progressData.average_score}%</h3>
              <p className="text-sm text-muted-foreground">average score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2">
            <BarChart className="h-4 w-4" />
            <span>Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Check className="h-4 w-4" />
            <span>Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2">
            <Clock className="h-4 w-4" />
            <span>Activities</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest learning sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-6">
                    {progressData.recent_activities.map((activity) => (
                      <div key={activity.id} className="flex items-start">
                        <div className="mr-4 mt-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                            <Badge variant={activity.status === "completed" ? "outline" : "secondary"}>
                              {activity.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{activity.title}</h4>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{activity.subject}</span>
                            <span className="text-muted-foreground">{activity.duration} min</span>
                          </div>
                          {activity.score !== undefined && (
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>Score: {activity.score}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <span>View All Activity</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Assignments */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Upcoming and recent assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {progressData.assignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{assignment.subject}</Badge>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getStatusColor(assignment.status)}`}></div>
                            <span className="text-xs font-medium capitalize">{assignment.status}</span>
                          </div>
                        </div>
                        <h4 className="font-medium mb-1">{assignment.title}</h4>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Due: {formatDate(assignment.due_date)}</span>
                          {assignment.score !== undefined && (
                            <span className="font-medium">Score: {assignment.score}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <span>View All Assignments</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
              <CardDescription>Track progress across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progressData.subjects.map((subject) => (
                  <div key={subject.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{subject.name}</h4>
                      <span className="text-sm font-medium">{subject.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${subject.progress}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{subject.completed_lessons}/{subject.total_lessons} lessons</span>
                      <span>Last activity: {formatDate(subject.last_activity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>Manage all assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.assignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{assignment.subject}</Badge>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(assignment.status)}`}></div>
                        <span className="text-xs font-medium capitalize">{assignment.status}</span>
                      </div>
                    </div>
                    <h4 className="font-medium mb-1">{assignment.title}</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due: {formatDate(assignment.due_date)}</span>
                      {assignment.score !== undefined && (
                        <span className="font-medium">Score: {assignment.score}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>All learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progressData.recent_activities.map((activity) => (
                  <div key={activity.id} className="flex items-start p-4 border rounded-lg">
                    <div className="mr-4 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                        <Badge variant={activity.status === "completed" ? "outline" : "secondary"}>
                          {activity.status === "completed" ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <h4 className="font-medium">{activity.title}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{activity.subject}</span>
                        <span className="text-muted-foreground">{activity.duration} min</span>
                      </div>
                      {activity.score !== undefined && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>Score: {activity.score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Badges and milestones earned</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {progressData.achievements.map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                <p className="text-xs mt-2">Earned: {formatDate(achievement.date_earned)}</p>
              </div>
            ))}

            {/* Placeholder for locked achievements */}
            <div className="flex flex-col items-center text-center p-4 border rounded-lg border-dashed opacity-50">
              <div className="bg-muted p-3 rounded-full mb-3">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="font-medium">Reading Master</h4>
              <p className="text-xs text-muted-foreground mt-1">Complete 10 literature lessons</p>
              <p className="text-xs mt-2">Locked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
