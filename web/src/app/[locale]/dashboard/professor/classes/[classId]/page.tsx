"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams, useRouter } from "next/navigation";
import { ProfessorService } from "@/services/ProfessorService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast"; // Import toast hook
import {
  Users,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  School,
  BookOpen,
  Pencil,
  ClipboardCheck,
  BarChart,
  MessageCircle,
  UserCheck,
  UserX,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";

// Type definitions for the details we get from the API
interface ClassDetail {
  id: number;
  name: string;
  academicYear: string;
  educationLevel: string;
  academicTrack?: string;
  roomNumber?: string;
  capacity?: number;
  studentCount: number;
  schedule: Array<{
    id: number;
    day: string;
    start_time: string;
    end_time: string;
    room?: string;
    teacher_id: number;
    course_id?: number;
    course_name?: string; // Added this for course name display
    recurring: boolean;
    color?: string;
    is_cancelled: boolean;
  }>;
  homeroom_teacher_id?: number;
  courses?: Array<{
    id: number;
    title: string;
    code: string;
  }>;
  department_id?: number;
}

interface Student {
  id: number;
  student_id: string;
  user_id: number;
  full_name: string;
  enrollment_date: string;
  status: string;
  education_level: string;
  academic_track?: string;
}

interface ClassCourseAssignment {
  id: number;
  class_id: number;
  professor_id: number;
  course_ids: number[];
  academic_year: string;
  term?: string;
  is_primary_instructor: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function ClassDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter(); // Initialize router
  const classId = params.classId as string;

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [courseAssignment, setCourseAssignment] = useState<ClassCourseAssignment | null>(null);
  const [courses, setCourses] = useState<Array<{ id: number, title: string, code: string }>>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
  const [hasError, setHasError] = useState(false); // Track if there was an access error

  useEffect(() => {
    const fetchClassDetail = async () => {
      setLoading(true);
      try {
        const data = await ProfessorService.getClass(classId);
        setClassDetail(data);
      } catch (error) {
        console.error("Error fetching class details:", error);

        // Check if it's a 403 error (access denied)
        if (error instanceof Error && error.message.includes("403")) {
          setHasError(true);
          // Redirect back to classes page with toast notification
          toast({
            title: t("accessDenied"),
            description: t("noAccessToClass"),
            variant: "destructive",
          });

          // Navigate back to the classes page
          router.push("/dashboard/professor/classes");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchStudents = async () => {
      setStudentLoading(true);
      try {
        const data = await ProfessorService.getClassStudents(classId);
        setStudents(data.students);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setStudentLoading(false);
      }
    };

    const fetchClassCourses = async () => {
      setCoursesLoading(true);
      try {
        // Get course assignment for this class
        const assignment = await ProfessorService.getClassCoursesAssignment(classId);
        setCourseAssignment(assignment);

        if (assignment && assignment.course_ids.length > 0) {
          // Fetch details for each course
          const coursesList = await Promise.all(
            assignment.course_ids.map(async (courseId: number) => {
              try {
                const courseDetails = await ProfessorService.getCourse(courseId);
                return {
                  id: courseId,
                  title: courseDetails.title || `Course ${courseId}`,
                  code: courseDetails.code || `C${courseId}`,
                };
              } catch (error) {
                console.error(`Error fetching course ${courseId}:`, error);
                return { id: courseId, title: `Course ${courseId}`, code: `C${courseId}` };
              }
            })
          );
          setCourses(coursesList);
        }
      } catch (error) {
        console.error("Error fetching class courses:", error);
        // If 404, it means no assignments yet, which is fine
        if (!(error instanceof Error && error.message.includes("404"))) {
          toast({
            title: t("errorFetchingCourses"),
            description: t("couldNotLoadCourses"),
            variant: "destructive",
          });
        }
      } finally {
        setCoursesLoading(false);
      }
    };

    if (!hasError) {
      fetchClassDetail();
      fetchStudents();
      fetchClassCourses();
    }
  }, [classId, hasError, router, t]);

  // If we encountered an error, don't render the page content
  if (hasError) {
    return null; // We'll redirect, no need to render anything
  }

  // Group schedule by day for more organized display
  const scheduleByDay = classDetail?.schedule?.reduce((acc, curr) => {
    const day = curr.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(curr);
    return acc;
  }, {} as Record<string, typeof classDetail.schedule>) || {};

  // Day order for sorting
  const dayOrder = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  // Function to get course name by ID
  const getCourseNameById = (courseId?: number) => {
    if (!courseId) return t("noCourse");
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : `${t("course")} ${courseId}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back button and class actions */}
      <div className="flex justify-between items-center">
        <Link href="/dashboard/professor/classes">
          <Button variant="ghost" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            {t("backToClasses")}
          </Button>
        </Link>

        <div className="flex space-x-2">
          <Button variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            {t("messageStudents")}
          </Button>
          <Button variant="default">
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Class overview card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-2xl">{classDetail?.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <School className="h-4 w-4" />
                    {classDetail?.academicYear} | {classDetail?.educationLevel}
                    {classDetail?.academicTrack && ` | ${classDetail.academicTrack}`}
                  </CardDescription>
                </div>
                <div className="mt-2 md:mt-0">
                  <Badge className="ml-0 md:ml-2 text-sm">
                    {classDetail?.studentCount} {t("students")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Room information */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <School className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("room")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classDetail?.roomNumber || t("noRoomAssigned")}
                      {classDetail?.capacity && ` (${t("capacity")}: ${classDetail.capacity})`}
                    </p>
                  </div>
                </div>

                {/* Schedule summary */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("schedule")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classDetail?.schedule?.length
                        ? `${classDetail.schedule.length} ${t("sessionsPerWeek")}`
                        : t("noScheduleSet")}
                    </p>
                  </div>
                </div>

                {/* Courses information */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("linkedCourses")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {coursesLoading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : courses.length > 0 ? (
                        `${courses.length} ${t("coursesAssigned")}`
                      ) : (
                        t("noLinkedCourses")
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Courses Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t("assignedCourses")}</CardTitle>
                  <CardDescription>
                    {t("coursesAssignedToClass")}
                  </CardDescription>
                </div>
                <div className="mt-2 md:mt-0">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("manageCourses")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="border rounded-lg p-4 hover:border-primary transition-colors"
                    >
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <Badge variant="outline">{t("course")}</Badge>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("noCoursesAssigned")}</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {t("noCoursesAssignedDescription")}
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("assignCourses")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main content tabs */}
          <Tabs defaultValue="students">
            <TabsList className="mb-6">
              <TabsTrigger value="students">
                <Users className="mr-2 h-4 w-4" />
                {t("students")}
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <CalendarDays className="mr-2 h-4 w-4" />
                {t("schedule")}
              </TabsTrigger>
              <TabsTrigger value="attendance">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {t("attendance")}
              </TabsTrigger>
              <TabsTrigger value="performance">
                <BarChart className="mr-2 h-4 w-4" />
                {t("performance")}
              </TabsTrigger>
            </TabsList>

            {/* Students tab */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle>{t("studentsList")}</CardTitle>
                    <div className="flex mt-2 md:mt-0 space-x-2">
                      <Button variant="outline" size="sm">
                        <UserCheck className="mr-2 h-4 w-4" />
                        {t("takeAttendance")}
                      </Button>
                      <Button size="sm">
                        {t("groupAction")}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {studentLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-2">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : students.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("name")}</TableHead>
                          <TableHead>{t("studentId")}</TableHead>
                          <TableHead>{t("track")}</TableHead>
                          <TableHead>{t("status")}</TableHead>
                          <TableHead>{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{student.full_name}</span>
                            </TableCell>
                            <TableCell>{student.student_id}</TableCell>
                            <TableCell>{student.academic_track || "-"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={student.status === "active" ? "outline" : "secondary"}
                              >
                                {student.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <BarChart className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{t("noStudentsEnrolled")}</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        {t("noStudentsEnrolledDescription")}
                      </p>
                      <Button>{t("enrollStudents")}</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule tab */}
            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>{t("classSchedule")}</CardTitle>
                  <CardDescription>
                    {t("classScheduleDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!classDetail?.schedule?.length ? (
                    <div className="text-center py-8">
                      <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{t("noScheduleFound")}</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        {t("noScheduleFoundDescription")}
                      </p>
                      <Button>{t("setSchedule")}</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(scheduleByDay)
                        .sort(([dayA], [dayB]) => dayOrder[dayA as keyof typeof dayOrder] - dayOrder[dayB as keyof typeof dayOrder])
                        .map(([day, sessions]) => (
                          <div key={day} className="space-y-2">
                            <h3 className="font-medium">{day}</h3>
                            <div className="space-y-2">
                              {sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="flex items-center justify-between p-3 rounded-md border"
                                  style={{
                                    borderLeftColor: session.color || "#3B82F6",
                                    borderLeftWidth: "4px",
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {session.start_time} - {session.end_time}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {session.room || t("noRoomAssigned")}
                                      </span>
                                      {/* Show course name if available */}
                                      <span className="text-sm text-primary font-medium">
                                        {session.course_name || getCourseNameById(session.course_id)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    {session.recurring && (
                                      <Badge variant="outline" className="mr-2">
                                        {t("weekly")}
                                      </Badge>
                                    )}
                                    {session.is_cancelled && (
                                      <Badge variant="destructive" className="ml-2">
                                        {t("cancelled")}
                                      </Badge>
                                    )}
                                    <Button variant="ghost" size="sm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" className="mr-2">
                    {t("exportSchedule")}
                  </Button>
                  <Button>
                    {t("editSchedule")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Attendance tab */}
            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{t("attendance")}</CardTitle>
                      <CardDescription>
                        {t("attendanceDescription")}
                      </CardDescription>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {format(attendanceDate, "PPP")}
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                          <Calendar
                            mode="single"
                            selected={attendanceDate}
                            onSelect={(date) => date && setAttendanceDate(date)}
                            className="mx-auto"
                          />
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {studentLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-2">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : students.length > 0 ? (
                    <>
                      <div className="mb-4 pb-4 border-b">
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-sm">{t("present")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <span className="text-sm">{t("absent")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                            <span className="text-sm">{t("late")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm">{t("excused")}</span>
                          </div>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("name")}</TableHead>
                            <TableHead>{t("studentId")}</TableHead>
                            {/* Add course selection if multiple courses */}
                            {courses.length > 1 && (
                              <TableHead>{t("course")}</TableHead>
                            )}
                            <TableHead>{t("status")}</TableHead>
                            <TableHead>{t("actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{student.full_name}</span>
                              </TableCell>
                              <TableCell>{student.student_id}</TableCell>
                              {/* Add course selection dropdown if multiple courses */}
                              {courses.length > 1 && (
                                <TableCell>
                                  <select className="border rounded px-2 py-1 text-sm">
                                    {courses.map(course => (
                                      <option key={course.id} value={course.id}>
                                        {course.title}
                                      </option>
                                    ))}
                                  </select>
                                </TableCell>
                              )}
                              <TableCell>
                                {/* Mock attendance status - would come from API */}
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-600 hover:bg-green-50 border-green-200"
                                >
                                  {t("present")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <UserCheck className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <UserX className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{t("noStudentsToTakeAttendance")}</h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        {t("noStudentsToTakeAttendanceDescription")}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" className="mr-2">
                    {t("exportAttendance")}
                  </Button>
                  <Button>
                    {t("saveAttendance")}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

{/* Performance tab */}
<TabsContent value="performance">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{t("classPerformance")}</CardTitle>
                      <CardDescription>
                        {t("classPerformanceDescription")}
                      </CardDescription>
                    </div>
                    {/* Course selector for performance data if multiple courses */}
                    {courses.length > 1 && (
                      <div className="mt-2 md:mt-0">
                        <select className="border rounded px-3 py-2 text-sm">
                          <option value="all">{t("allCourses")}</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-10">
                    <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t("performanceDataAvailableSoon")}</h3>
                    <p className="text-muted-foreground mb-4 max-w-md text-center">
                      {t("performanceDataDescription")}
                    </p>
                    <Button variant="outline">
                      {t("goToAnalytics")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
