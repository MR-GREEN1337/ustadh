// web/src/app/[locale]/dashboard/school/onboarding/_components/CoursesStep.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Loader2,
  Plus,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  School,
  Trash2
} from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Schema for course creation
const courseSchema = z.object({
  title: z.string().min(2, { message: "Course title must be at least 2 characters" }),
  code: z.string().min(2, { message: "Course code must be at least 2 characters" })
    .max(20, { message: "Course code must be at most 20 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  department_id: z.string().optional(),
  education_level: z.string().min(1, { message: "Education level is required" }),
  academic_year: z.string().min(1, { message: "Academic year is required" }),
  academic_track: z.string().optional(),
  ai_tutoring_enabled: z.boolean().default(true),
});

// Schema for class creation
const classSchema = z.object({
  name: z.string().min(2, { message: "Class name must be at least 2 characters" }),
  academic_year: z.string().min(1, { message: "Academic year is required" }),
  education_level: z.string().min(1, { message: "Education level is required" }),
  academic_track: z.string().optional(),
  room_number: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

// Education levels
const educationLevels = [
  { value: "primary_1", label: "Primary - 1st Year" },
  { value: "primary_2", label: "Primary - 2nd Year" },
  { value: "primary_3", label: "Primary - 3rd Year" },
  { value: "primary_4", label: "Primary - 4th Year" },
  { value: "primary_5", label: "Primary - 5th Year" },
  { value: "primary_6", label: "Primary - 6th Year" },
  { value: "college_7", label: "College - 1st Year (7th)" },
  { value: "college_8", label: "College - 2nd Year (8th)" },
  { value: "college_9", label: "College - 3rd Year (9th)" },
  { value: "tronc_commun", label: "High School - Tronc commun" },
  { value: "bac_1", label: "High School - 1st Year Baccalaureate" },
  { value: "bac_2", label: "High School - 2nd Year Baccalaureate" },
];

// Academic tracks
const academicTracks = [
  { value: "sciences_math_a", label: "Sciences Math A" },
  { value: "sciences_math_b", label: "Sciences Math B" },
  { value: "svt_pc", label: "SVT - PC (Sciences Physiques)" },
  { value: "svt_math", label: "SVT - Mathématiques" },
  { value: "pc_svt", label: "PC - SVT" },
  { value: "pc_math", label: "PC - Mathématiques" },
  { value: "lettres_lang_fr", label: "Literature - French Language" },
  { value: "lettres_lang_angl", label: "Literature - English Language" },
  { value: "lettres_geo_hist", label: "Literature - History/Geography" },
  { value: "lettres_phil", label: "Literature - Philosophy" },
  { value: "eco_gestion", label: "Economics and Management" },
  { value: "eco_comptabilite", label: "Economic Sciences - Accounting" },
];

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Teacher {
  id: number;
  user_id: number;
  full_name: string;
}

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  department_id: number | null;
  department_name?: string;
  education_level: string;
  academic_year: string;
  academic_track: string | null;
  ai_tutoring_enabled: boolean;
}

interface Class {
  id: number;
  name: string;
  academic_year: string;
  education_level: string;
  academic_track: string | null;
  room_number: string | null;
  capacity: number | null;
}

interface CoursesStepProps {
  onCompleted: () => void;
  status: any;
}

export default function CoursesStep({ onCompleted, status }: CoursesStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();

  // State variables
  const [activeTab, setActiveTab] = useState<string>("courses");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);

  // Current academic year
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  // Initialize course form
  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      code: "",
      description: "",
      department_id: "",
      education_level: "",
      academic_year: academicYear,
      academic_track: "",
      ai_tutoring_enabled: true,
    },
  });

  // Initialize class form
  const classForm = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      academic_year: academicYear,
      education_level: "",
      academic_track: "",
      room_number: "",
      capacity: undefined,
    },
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch departments
      const deptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (deptResponse.ok) {
        setDepartments(await deptResponse.json());
      }

      // TODO: Add API endpoints to fetch courses, classes, and teachers
      // For now, we'll just use empty arrays
      setCourses([]);
      setClasses([]);
      setTeachers([]);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: t("fetchError") || "Error",
        description: t("errorFetchingData") || "Could not load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle course form submission
  const onCourseSubmit = async (values: z.infer<typeof courseSchema>) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          department_id: values.department_id ? parseInt(values.department_id) : null,
        })
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: t("courseCreated") || "Course Created",
          description: t("courseCreatedSuccessfully") || "Course was created successfully",
          variant: "success",
        });

        // Close the dialog and refresh the data
        setCourseDialogOpen(false);
        courseForm.reset({
          title: "",
          code: "",
          description: "",
          department_id: "",
          education_level: "",
          academic_year: academicYear,
          academic_track: "",
          ai_tutoring_enabled: true,
        });
        fetchData();

        // If this is the first course, mark this step as completed
        if (courses.length === 0) {
          onCompleted();
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("creationFailed") || "Creation Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating course:", error);

      toast({
        title: t("creationFailed") || "Creation Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle class form submission
  const onClassSubmit = async (values: z.infer<typeof classSchema>) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/setup-classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([values]) // API expects an array of classes
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: t("classCreated") || "Class Created",
          description: t("classCreatedSuccessfully") || "Class was created successfully",
          variant: "success",
        });

        // Close the dialog and refresh the data
        setClassDialogOpen(false);
        classForm.reset({
          name: "",
          academic_year: academicYear,
          education_level: "",
          academic_track: "",
          room_number: "",
          capacity: undefined,
        });
        fetchData();

        // If this is the first class, mark this step as completed
        if (classes.length === 0) {
          onCompleted();
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("creationFailed") || "Creation Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating class:", error);

      toast({
        title: t("creationFailed") || "Creation Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    // If either courses or classes have been created, mark as completed
    if (courses.length > 0 || classes.length > 0) {
      onCompleted();
    } else {
      toast({
        title: t("noCourseOrClass") || "No Course or Class",
        description: t("createCourseOrClassFirst") || "Please create at least one course or class first",
        variant: "destructive",
      });
    }
  };

  const renderEmptyState = () => {
    if (activeTab === 'courses') {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              {t("noCoursesYet") || "No Courses Yet"}
            </CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noCoursesDescription") || "Create courses to organize your curriculum. Courses can be assigned to professors and classes."}
            </CardDescription>
            <Button onClick={() => setCourseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addCourse") || "Add Course"}
            </Button>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              {t("noClassesYet") || "No Classes Yet"}
            </CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noClassesDescription") || "Create classes to organize your students. Classes can be assigned courses and schedules."}
            </CardDescription>
            <Button onClick={() => setClassDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addClass") || "Add Class"}
            </Button>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{t("coursesAndClasses") || "Courses & Classes"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("coursesClassesDescription") || "Set up your curriculum by creating courses and organizing classes"}
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t("courses") || "Courses"}
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("classes") || "Classes"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCourseDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />
              {t("addCourse") || "Add Course"}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            renderEmptyState()
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("title") || "Title"}</TableHead>
                  <TableHead>{t("code") || "Code"}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("educationLevel") || "Education Level"}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("department") || "Department"}</TableHead>
                  <TableHead className="text-center">{t("aiTutoring") || "AI Tutoring"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.code}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t(`level_${course.education_level}`) || course.education_level}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {course.department_name || (course.department_id ?
                        departments.find(d => d.id === course.department_id)?.name :
                        t("noDepartment") || "None")}
                    </TableCell>
                    <TableCell className="text-center">
                      {course.ai_tutoring_enabled ? (
                        <Badge variant="success">{t("enabled") || "Enabled"}</Badge>
                      ) : (
                        <Badge variant="outline">{t("disabled") || "Disabled"}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="classes">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setClassDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addClass") || "Add Class"}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : classes.length === 0 ? (
            renderEmptyState()
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("className") || "Class Name"}</TableHead>
                  <TableHead>{t("academicYear") || "Academic Year"}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("educationLevel") || "Education Level"}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("academicTrack") || "Academic Track"}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("capacity") || "Capacity"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.academic_year}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t(`level_${classItem.education_level}`) || classItem.education_level}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {classItem.academic_track ?
                        (t(`track_${classItem.academic_track}`) || classItem.academic_track) :
                        "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {classItem.capacity || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Course creation dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {t("addNewCourse") || "Add New Course"}
            </DialogTitle>
            <DialogDescription>
              {t("courseFormDescription") || "Fill in the details for the course"}
            </DialogDescription>
          </DialogHeader>

          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courseTitle") || "Course Title"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("courseCode") || "Course Code"}</FormLabel>
                      <FormControl>
                        <Input placeholder="MATH101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description") || "Description"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("courseDescription") || "Introduction to mathematics principles..."}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("department") || "Department"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectDepartment") || "Select department"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t("noDepartment") || "No Department"}</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("optionalField") || "Optional field"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseForm.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicYear") || "Academic Year"}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="education_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("educationLevel") || "Education Level"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectEducationLevel") || "Select level"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {t(`level_${level.value}`) || level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseForm.control}
                  name="academic_track"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicTrack") || "Academic Track"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectTrack") || "Select track"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t("noTrack") || "No Track"}</SelectItem>
                          {academicTracks.map((track) => (
                            <SelectItem key={track.value} value={track.value}>
                              {t(`track_${track.value}`) || track.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("optionalField") || "Optional field"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={courseForm.control}
                name="ai_tutoring_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("aiTutoring") || "AI Tutoring"}
                      </FormLabel>
                      <FormDescription>
                        {t("aiTutoringDescription") || "Enable AI tutoring for this course"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCourseDialogOpen(false)}
                >
                  {t("cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("creating") || "Creating..."}
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t("createCourse") || "Create Course"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Class creation dialog */}
      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {t("addNewClass") || "Add New Class"}
            </DialogTitle>
            <DialogDescription>
              {t("classFormDescription") || "Fill in the details for the class"}
            </DialogDescription>
          </DialogHeader>

          <Form {...classForm}>
            <form onSubmit={classForm.handleSubmit(onClassSubmit)} className="space-y-4">
              <FormField
                control={classForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("className") || "Class Name"}</FormLabel>
                    <FormControl>
                      <Input placeholder="Class 10A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={classForm.control}
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicYear") || "Academic Year"}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="education_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("educationLevel") || "Education Level"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectEducationLevel") || "Select level"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {t(`level_${level.value}`) || level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={classForm.control}
                  name="academic_track"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicTrack") || "Academic Track"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectTrack") || "Select track"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t("noTrack") || "No Track"}</SelectItem>
                          {academicTracks.map((track) => (
                            <SelectItem key={track.value} value={track.value}>
                              {t(`track_${track.value}`) || track.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("optionalField") || "Optional field"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="room_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("roomNumber") || "Room Number"}</FormLabel>
                      <FormControl>
                        <Input placeholder="A101" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("optionalField") || "Optional field"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={classForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("capacity") || "Capacity"}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        min={1}
                        {...field}
                        onChange={e => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                        value={field.value === undefined ? '' : field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("optionalField") || "Optional field"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClassDialogOpen(false)}
                >
                  {t("cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("creating") || "Creating..."}
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      {t("createClass") || "Create Class"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={courses.length === 0 && classes.length === 0}>
          {t("saveAndContinue") || "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
