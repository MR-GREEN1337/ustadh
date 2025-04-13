"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import { useAuth } from "@/providers/AuthProvider";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Sparkles,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Copy,
  Plus,
  Brain,
  MessageSquare,
  Zap,
  ArrowLeft,
  ArrowRight,
  Users,
  BookMarked,
  ClipboardList,
  PenTool,
  PlusCircle,
  Layers,
  BookCheck,
  Briefcase,
  FileCheck,
  UserCheck,
  School
} from "lucide-react";

// Mock components that would be more robust in a real implementation
const Steps = ({ currentStep, steps, onChange }: {
  currentStep: number;
  steps: Array<{ title: string; description: string; icon: React.ReactNode }>;
  onChange: (step: number) => void;
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center cursor-pointer ${
              index <= currentStep ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => onChange(index)}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
              index < currentStep ? "bg-primary text-primary-foreground" :
              index === currentStep ? "border-2 border-primary" : "border border-muted"
            }`}>
              {index < currentStep ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                step.icon
              )}
            </div>
            <p className="text-sm font-medium text-center hidden sm:block">{step.title}</p>
          </div>
        ))}
      </div>
      <Progress
        value={((currentStep + 1) / steps.length) * 100}
        className="h-2 mb-8"
      />
    </div>
  );
};

export default function ProfessorOnboardingPage() {
  const { locale } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";

  // Onboarding state
  const [currentStep, setCurrentStep] = useState(0);
  const [professionalInfo, setProfessionalInfo] = useState({
    title: "",
    department: "",
    specialization: [],
    academicRank: "",
    tenureStatus: "",
    teachingLanguages: [],
    officeLocation: "",
    officeHours: []
  });
  const [classes, setClasses] = useState([
    { id: 1, name: "", gradeLevel: "", subject: "", schedule: { days: [], startTime: "", endTime: "" } }
  ]);
  const [courses, setCourses] = useState([
    { id: 1, title: "", description: "", subject: "", gradeLevel: "" }
  ]);
  const [aiPreferences, setAiPreferences] = useState({
    enableAiAssistant: true,
    lessonPlanningAssistance: true,
    gradingAssistance: true,
    studentProgressAnalysis: true,
    contentGeneration: true,
    questionBankGeneration: true
  });

  // Steps configuration
  const steps = [
    {
      title: t("professionalProfile") || "Professional Profile",
      description: t("professionalProfileDesc") || "Set up your professional teaching profile",
      icon: <Briefcase className="h-5 w-5" />
    },
    {
      title: t("classes") || "Classes",
      description: t("classesDesc") || "Create and manage your classes",
      icon: <Users className="h-5 w-5" />
    },
    {
      title: t("courses") || "Courses",
      description: t("coursesDesc") || "Set up your course curriculum",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      title: t("assignments") || "Assignments",
      description: t("assignmentsDesc") || "Create assignments and assessments",
      icon: <ClipboardList className="h-5 w-5" />
    },
    {
      title: t("aiSettings") || "AI Settings",
      description: t("aiSettingsDesc") || "Configure AI teaching assistance",
      icon: <Bot className="h-5 w-5" />
    }
  ];

  // Available academic departments
  const departments = [
    { value: "mathematics", label: "Mathematics" },
    { value: "sciences", label: "Sciences" },
    { value: "languages", label: "Languages" },
    { value: "humanities", label: "Humanities" },
    { value: "social_sciences", label: "Social Sciences" },
    { value: "computer_science", label: "Computer Science" },
    { value: "arts", label: "Arts" }
  ];

  // Available specializations
  const specializations = [
    { value: "algebra", label: "Algebra" },
    { value: "calculus", label: "Calculus" },
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "biology", label: "Biology" },
    { value: "arabic", label: "Arabic Language" },
    { value: "french", label: "French Language" },
    { value: "english", label: "English Language" },
    { value: "history", label: "History" },
    { value: "geography", label: "Geography" },
    { value: "philosophy", label: "Philosophy" },
    { value: "programming", label: "Programming" }
  ];

  // Academic ranks
  const academicRanks = [
    { value: "assistant_professor", label: "Assistant Professor" },
    { value: "associate_professor", label: "Associate Professor" },
    { value: "professor", label: "Professor" },
    { value: "lecturer", label: "Lecturer" },
    { value: "instructor", label: "Instructor" }
  ];

  // Education levels
  const educationLevels = [
    { value: "primary_1", label: "Primary 1" },
    { value: "primary_2", label: "Primary 2" },
    { value: "primary_3", label: "Primary 3" },
    { value: "primary_4", label: "Primary 4" },
    { value: "primary_5", label: "Primary 5" },
    { value: "primary_6", label: "Primary 6" },
    { value: "college_7", label: "College 7" },
    { value: "college_8", label: "College 8" },
    { value: "college_9", label: "College 9" },
    { value: "tronc_commun", label: "Tronc Commun" },
    { value: "bac_1", label: "BAC 1" },
    { value: "bac_2", label: "BAC 2" }
  ];

  // Subjects for courses
  const subjects = [
    { value: "mathematics", label: "Mathematics" },
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "biology", label: "Biology" },
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "english", label: "English" },
    { value: "history", label: "History" },
    { value: "geography", label: "Geography" },
    { value: "philosophy", label: "Philosophy" },
    { value: "computer_science", label: "Computer Science" }
  ];

  // Days of the week
  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" }
  ];

  // Teaching languages
  const languages = [
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "english", label: "English" },
    { value: "amazigh", label: "Amazigh" }
  ];

  // Add a new class
  const addClass = () => {
    const newId = classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 1;
    setClasses([...classes, {
      id: newId,
      name: "",
      gradeLevel: "",
      subject: "",
      schedule: { days: [], startTime: "", endTime: "" }
    }]);
  };

  // Remove a class
  const removeClass = (id: number) => {
    if (classes.length > 1) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  // Add a new course
  const addCourse = () => {
    const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    setCourses([...courses, { id: newId, title: "", description: "", subject: "", gradeLevel: "" }]);
  };

  // Remove a course
  const removeCourse = (id: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Complete onboarding
      router.push(`/${locale}/dashboard/teaching`);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="gap-2 mb-4"
          onClick={() => router.push(`/${locale}/dashboard/teaching`)}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("skipOnboarding") || "Skip Onboarding"}
        </Button>

        <h1 className="text-3xl font-bold mb-2">
          {t("professorSetup") || "Professor Setup"}
        </h1>
        <p className="text-muted-foreground">
          {t("professorSetupDesc") || "Complete your teaching profile and set up your classes and courses"}
        </p>
      </div>

      {/* Steps navigation */}
      <Steps
        currentStep={currentStep}
        steps={steps}
        onChange={setCurrentStep}
      />

      {/* Step content */}
      <div className="mt-8">
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("professionalProfile") || "Professional Profile"}</CardTitle>
              <CardDescription>
                {t("professionalProfileDesc") || "Set up your professional teaching information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="space-y-2">
                  <FormLabel>{t("academicTitle") || "Academic Title"}</FormLabel>
                  <Input
                    placeholder={t("enterTitle") || "Dr., Prof., etc."}
                    value={professionalInfo.title}
                    onChange={(e) => setProfessionalInfo({...professionalInfo, title: e.target.value})}
                  />
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <FormLabel>{t("department") || "Department"}</FormLabel>
                  <Select
                    value={professionalInfo.department}
                    onValueChange={(value) => setProfessionalInfo({...professionalInfo, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectDepartment") || "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {t(dept.value) || dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <FormLabel>{t("specializations") || "Specializations"}</FormLabel>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {specializations.map((spec) => (
                      <div key={spec.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={spec.value}
                          checked={professionalInfo.specialization.includes(spec.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setProfessionalInfo({
                                ...professionalInfo,
                                specialization: [...professionalInfo.specialization, spec.value]
                              });
                            } else {
                              setProfessionalInfo({
                                ...professionalInfo,
                                specialization: professionalInfo.specialization.filter(s => s !== spec.value)
                              });
                            }
                          }}
                        />
                        <label htmlFor={spec.value} className="text-sm">
                          {t(spec.value) || spec.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Rank */}
                <div className="space-y-2">
                  <FormLabel>{t("academicRank") || "Academic Rank"}</FormLabel>
                  <Select
                    value={professionalInfo.academicRank}
                    onValueChange={(value) => setProfessionalInfo({...professionalInfo, academicRank: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectRank") || "Select rank"} />
                    </SelectTrigger>
                    <SelectContent>
                      {academicRanks.map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {t(rank.value) || rank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Teaching Languages */}
                <div className="space-y-2">
                  <FormLabel>{t("teachingLanguages") || "Teaching Languages"}</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge
                        key={lang.value}
                        variant={professionalInfo.teachingLanguages.includes(lang.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (professionalInfo.teachingLanguages.includes(lang.value)) {
                            setProfessionalInfo({
                              ...professionalInfo,
                              teachingLanguages: professionalInfo.teachingLanguages.filter(l => l !== lang.value)
                            });
                          } else {
                            setProfessionalInfo({
                              ...professionalInfo,
                              teachingLanguages: [...professionalInfo.teachingLanguages, lang.value]
                            });
                          }
                        }}
                      >
                        {t(lang.value) || lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Office Information */}
              <div className="space-y-2">
                <FormLabel>{t("officeLocation") || "Office Location"}</FormLabel>
                <Input
                  placeholder={t("enterOfficeLocation") || "Building and room number"}
                  value={professionalInfo.officeLocation}
                  onChange={(e) => setProfessionalInfo({...professionalInfo, officeLocation: e.target.value})}
                />
              </div>

              {/* Office Hours */}
              <div className="space-y-2">
                <FormLabel>{t("officeHours") || "Office Hours"}</FormLabel>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {daysOfWeek.slice(0, 5).map((day) => (
                      <div key={day.value} className="flex items-center gap-3">
                        <div className="w-24">
                          <span className="text-sm">{t(day.value) || day.label}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input placeholder={t("startTime") || "Start time"} type="time" />
                          <Input placeholder={t("endTime") || "End time"} type="time" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("classes") || "Classes"}</CardTitle>
              <CardDescription>
                {t("classesDesc") || "Set up the classes you'll be teaching"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {classes.map((classItem, index) => (
                <div key={classItem.id} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">
                      {classItem.name || t("class") || "Class"} {index + 1}
                    </h3>
                    {classes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClass(classItem.id)}
                      >
                        {t("remove") || "Remove"}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Class Name */}
                    <div className="space-y-2">
                      <FormLabel>{t("className") || "Class Name"}</FormLabel>
                      <Input
                        placeholder={t("enterClassName") || "e.g. Mathematics 10A"}
                        value={classItem.name}
                        onChange={(e) => {
                          const updatedClasses = [...classes];
                          updatedClasses[index].name = e.target.value;
                          setClasses(updatedClasses);
                        }}
                      />
                    </div>

                    {/* Grade Level */}
                    <div className="space-y-2">
                      <FormLabel>{t("gradeLevel") || "Grade Level"}</FormLabel>
                      <Select
                        value={classItem.gradeLevel}
                        onValueChange={(value) => {
                          const updatedClasses = [...classes];
                          updatedClasses[index].gradeLevel = value;
                          setClasses(updatedClasses);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectGradeLevel") || "Select grade level"} />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {t(level.value) || level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <FormLabel>{t("subject") || "Subject"}</FormLabel>
                    <Select
                      value={classItem.subject}
                      onValueChange={(value) => {
                        const updatedClasses = [...classes];
                        updatedClasses[index].subject = value;
                        setClasses(updatedClasses);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectSubject") || "Select subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.value} value={subject.value}>
                            {t(subject.value) || subject.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <FormLabel>{t("schedule") || "Schedule"}</FormLabel>
                    <div className="border rounded-md p-4">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Days of Week */}
                        <div className="space-y-2">
                          <FormLabel>{t("daysOfWeek") || "Days of Week"}</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <Badge
                                key={day.value}
                                variant={classItem.schedule.days.includes(day.value) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  const updatedClasses = [...classes];
                                  if (updatedClasses[index].schedule.days.includes(day.value)) {
                                    updatedClasses[index].schedule.days = updatedClasses[index].schedule.days.filter(d => d !== day.value);
                                  } else {
                                    updatedClasses[index].schedule.days.push(day.value);
                                  }
                                  setClasses(updatedClasses);
                                }}
                              >
                                {t(day.value) || day.label}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormLabel>{t("startTime") || "Start Time"}</FormLabel>
                            <Input
                              type="time"
                              value={classItem.schedule.startTime}
                              onChange={(e) => {
                                const updatedClasses = [...classes];
                                updatedClasses[index].schedule.startTime = e.target.value;
                                setClasses(updatedClasses);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>{t("endTime") || "End Time"}</FormLabel>
                            <Input
                              type="time"
                              value={classItem.schedule.endTime}
                              onChange={(e) => {
                                const updatedClasses = [...classes];
                                updatedClasses[index].schedule.endTime = e.target.value;
                                setClasses(updatedClasses);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addClass} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t("addClass") || "Add Another Class"}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("courses") || "Courses"}</CardTitle>
              <CardDescription>
                {t("coursesDesc") || "Set up the courses you'll be teaching"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {courses.map((course, index) => (
                <div key={course.id} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">
                      {course.title || t("course") || "Course"} {index + 1}
                    </h3>
                    {courses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse(course.id)}
                      >
                        {t("remove") || "Remove"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FormLabel>{t("courseTitle") || "Course Title"}</FormLabel>
                    <Input
                      placeholder={t("enterCourseTitle") || "e.g. Introduction to Algebra"}
                      value={course.title}
                      onChange={(e) => {
                        const updatedCourses = [...courses];
                        updatedCourses[index].title = e.target.value;
                        setCourses(updatedCourses);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>{t("courseDescription") || "Course Description"}</FormLabel>
                    <Textarea
                      placeholder={t("enterCourseDescription") || "Provide a brief description of this course"}
                      value={course.description}
                      onChange={(e) => {
                        const updatedCourses = [...courses];
                        updatedCourses[index].description = e.target.value;
                        setCourses(updatedCourses);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <FormLabel>{t("subject") || "Subject"}</FormLabel>
                      <Select
                        value={course.subject}
                        onValueChange={(value) => {
                          const updatedCourses = [...courses];
                          updatedCourses[index].subject = value;
                          setCourses(updatedCourses);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectSubject") || "Select subject"} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {t(subject.value) || subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <FormLabel>{t("gradeLevel") || "Grade Level"}</FormLabel>
                      <Select
                        value={course.gradeLevel}
                        onValueChange={(value) => {
                          const updatedCourses = [...courses];
                          updatedCourses[index].gradeLevel = value;
                          setCourses(updatedCourses);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectGradeLevel") || "Select grade level"} />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {t(level.value) || level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <FileCheck className="h-4 w-4 mr-2" />
                      {t("setupDetailed") || "Set Up Full Course Details"}
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addCourse} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t("addCourse") || "Add Another Course"}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("assignments") || "Assignments"}</CardTitle>
              <CardDescription>
                {t("assignmentsDesc") || "Set up templates for assignments and assessments"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assignment Types */}
              <div className="space-y-2">
                <FormLabel>{t("assignmentTypes") || "Assignment Types"}</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Homework */}
                  <Card className="border-2 border-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <BookCheck className="h-4 w-4 mr-2" />
                        {t("homework") || "Homework"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">
                        {t("homeworkDesc") || "Regular practice assignments completed outside class"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span>{t("frequency") || "Frequency"}</span>
                        <Select defaultValue="weekly">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">{t("daily") || "Daily"}</SelectItem>
                            <SelectItem value="weekly">{t("weekly") || "Weekly"}</SelectItem>
                            <SelectItem value="biweekly">{t("biweekly") || "Biweekly"}</SelectItem>
                            <SelectItem value="monthly">{t("monthly") || "Monthly"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center w-full justify-between">
                        <FormLabel className="text-sm">{t("enableAiGrading") || "Enable AI Grading"}</FormLabel>
                        <Switch defaultChecked />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Quizzes */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        {t("quizzes") || "Quizzes"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">
                        {t("quizzesDesc") || "Short assessments to check understanding"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span>{t("frequency") || "Frequency"}</span>
                        <Select defaultValue="biweekly">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">{t("weekly") || "Weekly"}</SelectItem>
                            <SelectItem value="biweekly">{t("biweekly") || "Biweekly"}</SelectItem>
                            <SelectItem value="monthly">{t("monthly") || "Monthly"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center w-full justify-between">
                        <FormLabel className="text-sm">{t("enableAiGrading") || "Enable AI Grading"}</FormLabel>
                        <Switch defaultChecked />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Exams */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        {t("exams") || "Exams"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">
                        {t("examsDesc") || "Comprehensive evaluation of knowledge"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span>{t("frequency") || "Frequency"}</span>
                        <Select defaultValue="quarterly">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">{t("monthly") || "Monthly"}</SelectItem>
                            <SelectItem value="quarterly">{t("quarterly") || "Quarterly"}</SelectItem>
                            <SelectItem value="semesterly">{t("semesterly") || "Semesterly"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center w-full justify-between">
                        <FormLabel className="text-sm">{t("enableAiGrading") || "Enable AI Grading"}</FormLabel>
                        <Switch defaultChecked />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Projects */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Layers className="h-4 w-4 mr-2" />
                        {t("projects") || "Projects"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">
                        {t("projectsDesc") || "Longer term assignments requiring research and creativity"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span>{t("frequency") || "Frequency"}</span>
                        <Select defaultValue="quarterly">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">{t("monthly") || "Monthly"}</SelectItem>
                            <SelectItem value="quarterly">{t("quarterly") || "Quarterly"}</SelectItem>
                            <SelectItem value="semesterly">{t("semesterly") || "Semesterly"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex items-center w-full justify-between">
                        <FormLabel className="text-sm">{t("enableAiGrading") || "Enable AI Grading"}</FormLabel>
                        <Switch defaultChecked />
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addAssignmentType") || "Add Custom Assignment Type"}
                </Button>
              </div>

              {/* Grading Scale */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t("gradingScale") || "Grading Scale"}</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-6 gap-4">
                        <FormLabel className="col-span-2">{t("gradeA") || "A (Excellent)"}</FormLabel>
                        <div className="col-span-4 flex items-center gap-2">
                          <Input type="number" defaultValue="90" className="w-20" />
                          <span className="text-sm">-</span>
                          <Input type="number" defaultValue="100" className="w-20" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        <FormLabel className="col-span-2">{t("gradeB") || "B (Good)"}</FormLabel>
                        <div className="col-span-4 flex items-center gap-2">
                          <Input type="number" defaultValue="80" className="w-20" />
                          <span className="text-sm">-</span>
                          <Input type="number" defaultValue="89" className="w-20" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        <FormLabel className="col-span-2">{t("gradeC") || "C (Average)"}</FormLabel>
                        <div className="col-span-4 flex items-center gap-2">
                          <Input type="number" defaultValue="70" className="w-20" />
                          <span className="text-sm">-</span>
                          <Input type="number" defaultValue="79" className="w-20" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        <FormLabel className="col-span-2">{t("gradeD") || "D (Poor)"}</FormLabel>
                        <div className="col-span-4 flex items-center gap-2">
                          <Input type="number" defaultValue="60" className="w-20" />
                          <span className="text-sm">-</span>
                          <Input type="number" defaultValue="69" className="w-20" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        <FormLabel className="col-span-2">{t("gradeF") || "F (Failing)"}</FormLabel>
                        <div className="col-span-4 flex items-center gap-2">
                          <Input type="number" defaultValue="0" className="w-20" />
                          <span className="text-sm">-</span>
                          <Input type="number" defaultValue="59" className="w-20" />
                          <span className="text-sm">%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Question Generation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>{t("aiQuestionGeneration") || "AI Question Generation"}</FormLabel>
                  <Switch defaultChecked />
                </div>
                <div className="border rounded-md p-4 bg-primary/5">
                  <div className="flex items-start gap-2 text-sm">
                    <Bot className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">
                        {t("aiQuestionGenerationInfo") || "AI can help generate assessment questions"}
                      </p>
                      <p className="text-muted-foreground">
                        {t("aiQuestionGenerationDesc") || "The AI will create questions based on your course content, learning objectives, and difficulty preferences. You can edit and refine all generated questions before using them."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("aiSettings") || "AI Settings"}</CardTitle>
              <CardDescription>
                {t("aiSettingsDesc") || "Configure how AI assists with your teaching"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main AI toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-lg font-medium">{t("enableAiAssistant") || "Enable AI Teaching Assistant"}</FormLabel>
                  <p className="text-sm text-muted-foreground">{t("aiAssistantDesc") || "Get AI support for your teaching workflow"}</p>
                </div>
                <Switch
                  checked={aiPreferences.enableAiAssistant}
                  onCheckedChange={(checked) => setAiPreferences({...aiPreferences, enableAiAssistant: checked})}
                />
              </div>

              <Separator />

              {/* AI Features */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t("aiFeatures") || "AI Features"}</h3>

                <div className="space-y-4">
                  {/* Lesson planning */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <FormLabel className="font-medium">{t("lessonPlanning") || "Lesson Planning"}</FormLabel>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{t("lessonPlanningDesc") || "Get AI suggestions for creating engaging lesson plans"}</p>
                    </div>
                    <Switch
                      checked={aiPreferences.lessonPlanningAssistance}
                      onCheckedChange={(checked) => setAiPreferences({...aiPreferences, lessonPlanningAssistance: checked})}
                    />
                  </div>

                  {/* Grading assistance */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <FormLabel className="font-medium">{t("gradingAssistance") || "Grading Assistance"}</FormLabel>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{t("gradingAssistanceDesc") || "Let AI help evaluate student work based on your criteria"}</p>
                    </div>
                    <Switch
                      checked={aiPreferences.gradingAssistance}
                      onCheckedChange={(checked) => setAiPreferences({...aiPreferences, gradingAssistance: checked})}
                    />
                  </div>

                  {/* Progress analysis */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-primary" />
                        <FormLabel className="font-medium">{t("progressAnalysis") || "Student Progress Analysis"}</FormLabel>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{t("progressAnalysisDesc") || "Identify learning trends and gaps using AI-powered insights"}</p>
                    </div>
                    <Switch
                      checked={aiPreferences.studentProgressAnalysis}
                      onCheckedChange={(checked) => setAiPreferences({...aiPreferences, studentProgressAnalysis: checked})}
                    />
                  </div>

                  {/* Content generation */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <FormLabel className="font-medium">{t("contentGeneration") || "Content Generation"}</FormLabel>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{t("contentGenerationDesc") || "Create explanations, examples, and supplementary materials"}</p>
                    </div>
                    <Switch
                      checked={aiPreferences.contentGeneration}
                      onCheckedChange={(checked) => setAiPreferences({...aiPreferences, contentGeneration: checked})}
                    />
                  </div>

                  {/* Question bank */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-primary" />
                        <FormLabel className="font-medium">{t("questionBank") || "Question Bank Generation"}</FormLabel>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{t("questionBankDesc") || "Build a diverse collection of quality assessment questions"}</p>
                    </div>
                    <Switch
                      checked={aiPreferences.questionBankGeneration}
                      onCheckedChange={(checked) => setAiPreferences({...aiPreferences, questionBankGeneration: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* AI Language Model Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t("aiModelSettings") || "AI Model Settings"}</h3>

                <div className="space-y-2">
                  <FormLabel>{t("aiModelPreset") || "AI Model Preset"}</FormLabel>
                  <Select defaultValue="balanced">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{t("basic") || "Basic - Simple assistance"}</SelectItem>
                      <SelectItem value="balanced">{t("balanced") || "Balanced - Recommended"}</SelectItem>
                      <SelectItem value="advanced">{t("advanced") || "Advanced - Complex reasoning"}</SelectItem>
                      <SelectItem value="creative">{t("creative") || "Creative - Innovative ideas"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("aiModelDesc") || "Choose how the AI model responds to your requests and generates content"}
                  </p>
                </div>

                <div className="space-y-2">
                  <FormLabel>{t("aiLanguage") || "AI Response Language"}</FormLabel>
                  <Select defaultValue="arabic">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arabic">{t("arabic") || "Arabic"}</SelectItem>
                      <SelectItem value="french">{t("french") || "French"}</SelectItem>
                      <SelectItem value="english">{t("english") || "English"}</SelectItem>
                      <SelectItem value="auto">{t("autoDetect") || "Auto-detect (Match your input)"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* AI Chat Integration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>{t("aiChatPlugin") || "Enable AI Chat in Student Portal"}</FormLabel>
                  <Switch defaultChecked />
                </div>
                <div className="border rounded-md p-4 bg-primary/5">
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">
                        {t("studentAiChat") || "Students can ask questions about your course content"}
                      </p>
                      <p className="text-muted-foreground">
                        {t("studentAiChatDesc") || "When enabled, students can use AI to ask questions about your materials. You'll receive insights about common questions and areas where students need additional help."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("previous") || "Previous"}
        </Button>
        <Button
          onClick={goToNextStep}
        >
          {currentStep === steps.length - 1
            ? t("complete") || "Complete Setup"
            : t("next") || "Next"}
          {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
