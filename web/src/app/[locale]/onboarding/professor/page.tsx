"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslation } from '@/i18n/client';
import { useAuth } from '@/providers/AuthProvider';

// Import core components
import { ProfessorService } from '@/services/ProfessorService';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

// Icons
import {
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  BookOpen,
  FileText,
  Users,
  Sparkles,
  AlertCircle,
  User,
  Building,
  GraduationCap,
  Languages,
  Briefcase,
  MessageSquare,
  BrainCog,
  ArrowRight,
  HelpCircle,
  Info,
  ExternalLink,
  X
} from 'lucide-react';
import { ModeToggle } from '@/components/global/ThemeModeToggle';

// Define onboarding steps
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with your professor dashboard'
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Set up your professional profile'
  },
  {
    id: 'expertise',
    title: 'Expertise',
    description: 'Define your teaching expertise'
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Configure your teaching schedule'
  },
  {
    id: 'courses',
    title: 'Courses',
    description: 'Add or select your courses'
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Get to know your dashboard'
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Your onboarding is complete'
  }
];

// Define initial values for forms
const INITIAL_PROFILE = {
  title: '',
  academic_rank: '',
  tenure_status: '',
  department_id: null
};

const INITIAL_EXPERTISE = {
  specializations: [],
  preferred_subjects: [],
  education_levels: [],
  teaching_languages: []
};

const INITIAL_AVAILABILITY = {
  office_location: '',
  office_hours: {
    monday: { start: '09:00', end: '11:00' },
    wednesday: { start: '13:00', end: '15:00' }
  },
  contact_preferences: {
    email_contact: true,
    sms_notifications: false,
    app_notifications: true,
    preferred_contact_method: 'email',
    response_time_hours: 24
  },
  tutoring_availability: true,
  max_students: 5
};

const INITIAL_COURSES = {
  course_ids: [],
  new_courses: []
};

// Main onboarding component
const ProfessorOnboardingFlow = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const locale = useLocale();
  const { user } = useAuth();
  const isRTL = locale === 'ar';

  // State for active step
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // State for form data
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [expertise, setExpertise] = useState(INITIAL_EXPERTISE);
  const [availability, setAvailability] = useState(INITIAL_AVAILABILITY);
  const [courses, setCourses] = useState(INITIAL_COURSES);

  // State for dashboard tour
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // State for existing data
  const [availableCourses, setAvailableCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjectAreas, setSubjectAreas] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Get onboarding status and initialize data
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        setInitializing(true);

        // Get onboarding status
        const onboardingStatus = await ProfessorService.getOnboardingStatus();

        // If already completed, redirect to dashboard
        if (onboardingStatus.has_completed_onboarding) {
          router.push(`/${locale}/dashboard`);
          return;
        }

        // Set current step based on onboarding_step
        const stepIndex = ONBOARDING_STEPS.findIndex(step =>
          step.id === onboardingStatus.onboarding_step);

        if (stepIndex > 0) {
          setCurrentStep(stepIndex);
        }

        // Load reference data for forms
        await Promise.all([
          loadAvailableCourses(),
          loadDepartmentsData(),
          loadSubjectAreas(),
          loadEducationLevels(),
          loadLanguages()
        ]);

      } catch (error) {
        console.error("Failed to initialize onboarding:", error);
        toast.error(t("errorLoadingOnboarding"));
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    };

    if (user) {
      initializeOnboarding();
    }
  }, [user, locale, router, t]);

  // Load available courses
  const loadAvailableCourses = async () => {
    try {
      // In a real implementation, you would fetch from an API
      const courses = [
        { id: 1, title: 'Introduction to Computer Science', code: 'CS101' },
        { id: 2, title: 'Data Structures and Algorithms', code: 'CS201' },
        { id: 3, title: 'Database Systems', code: 'CS301' },
        { id: 4, title: 'Artificial Intelligence', code: 'CS401' },
        { id: 5, title: 'Machine Learning', code: 'CS402' }
      ];
      setAvailableCourses(courses);
    } catch (error) {
      console.error("Failed to load available courses:", error);
    }
  };

  // Load departments data
  const loadDepartmentsData = async () => {
    try {
      // In a real implementation, you would fetch from an API
      const depts = [
        { id: 1, name: 'Computer Science' },
        { id: 2, name: 'Mathematics' },
        { id: 3, name: 'Physics' },
        { id: 4, name: 'Chemistry' },
        { id: 5, name: 'Biology' }
      ];
      setDepartments(depts);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  // Load subject areas
  const loadSubjectAreas = async () => {
    try {
      // In a real implementation, you would fetch from an API
      const subjects = [
        'Algorithms', 'Data Structures', 'Database Systems',
        'Artificial Intelligence', 'Machine Learning', 'Computer Networks',
        'Web Development', 'Mobile Development', 'Operating Systems',
        'Computer Architecture', 'Theory of Computation', 'Software Engineering'
      ];
      setSubjectAreas(subjects);
    } catch (error) {
      console.error("Failed to load subject areas:", error);
    }
  };

  // Load education levels
  const loadEducationLevels = async () => {
    try {
      // In a real implementation, you would fetch from an API
      const levels = [
        'Primary', 'Secondary', 'College', 'Undergraduate', 'Graduate', 'Doctoral'
      ];
      setEducationLevels(levels);
    } catch (error) {
      console.error("Failed to load education levels:", error);
    }
  };

  // Load languages
  const loadLanguages = async () => {
    try {
      // In a real implementation, you would fetch from an API
      const langs = [
        'Arabic', 'English', 'French', 'Spanish', 'German', 'Chinese', 'Japanese'
      ];
      setLanguages(langs);
    } catch (error) {
      console.error("Failed to load languages:", error);
    }
  };

  // Handle form submission for each step
  const handleSubmitStep = async () => {
    try {
      setSubmitting(true);

      const currentStepId = ONBOARDING_STEPS[currentStep].id;

      switch (currentStepId) {
        case 'profile':
          await ProfessorService.updateProfile(profile);
          break;
        case 'expertise':
          await ProfessorService.updateExpertise(expertise);
          break;
        case 'availability':
          await ProfessorService.updateAvailability(availability);
          break;
        case 'courses':
          await ProfessorService.updateCourses(courses);
          break;
        case 'complete':
          await ProfessorService.completeOnboarding();
          toast.success(t("onboardingCompleted"));
          router.push(`/${locale}/dashboard`);
          return;
      }

      // Move to next step
      setCurrentStep(prevStep => prevStep + 1);

    } catch (error) {
      console.error(`Failed to submit ${ONBOARDING_STEPS[currentStep].id} step:`, error);
      toast.error(t("errorSavingData"));
    } finally {
      setSubmitting(false);
    }
  };

  // Skip onboarding
  const skipOnboarding = async () => {
    try {
      setSubmitting(true);
      await ProfessorService.completeOnboarding();
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      toast.error(t("errorSkippingOnboarding"));
    } finally {
      setSubmitting(false);
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  // Check if current step can be submitted
  const canSubmitCurrentStep = () => {
    const currentStepId = ONBOARDING_STEPS[currentStep].id;

    switch (currentStepId) {
      case 'welcome':
        return true;
      case 'profile':
        return profile.title && profile.academic_rank;
      case 'expertise':
        return expertise.specializations.length > 0 && expertise.teaching_languages.length > 0;
      case 'availability':
        return availability.office_hours &&
          Object.keys(availability.office_hours).length > 0 &&
          availability.contact_preferences.preferred_contact_method;
      case 'courses':
        return courses.course_ids.length > 0 || courses.new_courses.length > 0;
      case 'dashboard':
        return true;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep) / (ONBOARDING_STEPS.length - 1)) * 100;

  // If initializing, show loading screen
  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">{t("loadingOnboarding")}</p>
        </div>
      </div>
    );
  }

  // Render current step content
  const renderStepContent = () => {
    const currentStepId = ONBOARDING_STEPS[currentStep].id;

    switch (currentStepId) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return <ProfileStep
          profile={profile}
          setProfile={setProfile}
          departments={departments}
        />;
      case 'expertise':
        return <ExpertiseStep
          expertise={expertise}
          setExpertise={setExpertise}
          subjectAreas={subjectAreas}
          educationLevels={educationLevels}
          languages={languages}
        />;
      case 'availability':
        return <AvailabilityStep
          availability={availability}
          setAvailability={setAvailability}
        />;
      case 'courses':
        return <CoursesStep
          courses={courses}
          setCourses={setCourses}
          availableCourses={availableCourses}
        />;
      case 'dashboard':
        return <DashboardStep
          showTour={showDashboardTour}
          setShowTour={setShowDashboardTour}
          tourStep={tourStep}
          setTourStep={setTourStep}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />;
      case 'complete':
        return <CompleteStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-medium">{t("professorOnboarding")}</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="mr-2">
                <ModeToggle />
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Progress value={progressPercentage} className="w-24 h-2" />
                <span className="text-sm text-muted-foreground">
                  {t("stepProgress", { current: currentStep + 1, total: ONBOARDING_STEPS.length })}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipOnboarding}
                disabled={submitting}
              >
                {t("skipOnboarding")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step title */}
          <div className="mb-6">
            <h2 className="text-2xl font-medium mb-2">
              {t(ONBOARDING_STEPS[currentStep].id + 'Title')}
            </h2>
            <p className="text-muted-foreground">
              {t(ONBOARDING_STEPS[currentStep].id + 'Description')}
            </p>
          </div>

          {/* Step content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0 || submitting}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("previous")}
            </Button>

            <Button
              onClick={handleSubmitStep}
              disabled={!canSubmitCurrentStep() || submitting}
              className="gap-2"
            >
              {submitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
              ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
                <Check className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {currentStep === ONBOARDING_STEPS.length - 1 ?
                t("finishOnboarding") : t("continue")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Welcome step component
const WelcomeStep = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {t("welcomeTitle", { name: user?.full_name })}
        </CardTitle>
        <CardDescription>
          {t("welcomeDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("completeProfile")}</h3>
                <p className="text-sm text-muted-foreground">{t("completeProfileDesc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("addCourses")}</h3>
                <p className="text-sm text-muted-foreground">{t("addCoursesDesc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("setupSchedule")}</h3>
                <p className="text-sm text-muted-foreground">{t("setupScheduleDesc")}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("manageAssignments")}</h3>
                <p className="text-sm text-muted-foreground">{t("manageAssignmentsDesc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("trackStudents")}</h3>
                <p className="text-sm text-muted-foreground">{t("trackStudentsDesc")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("aiAssistant")}</h3>
                <p className="text-sm text-muted-foreground">{t("aiAssistantDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("timeEstimate")}</AlertTitle>
          <AlertDescription>
            {t("onboardingTimeEstimate")}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Profile step component
const ProfileStep = ({ profile, setProfile, departments }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("professorProfile")}</CardTitle>
        <CardDescription>
          {t("professorProfileDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("academicTitle")}</Label>
            <Input
              id="title"
              placeholder={t("academicTitlePlaceholder")}
              value={profile.title}
              onChange={(e) => setProfile({...profile, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_rank">{t("academicRank")}</Label>
            <Select
              value={profile.academic_rank}
              onValueChange={(value) => setProfile({...profile, academic_rank: value})}
            >
              <SelectTrigger id="academic_rank">
                <SelectValue placeholder={t("selectAcademicRank")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant_professor">{t("assistantProfessor")}</SelectItem>
                <SelectItem value="associate_professor">{t("associateProfessor")}</SelectItem>
                <SelectItem value="professor">{t("professor")}</SelectItem>
                <SelectItem value="lecturer">{t("lecturer")}</SelectItem>
                <SelectItem value="lecturer">{t("lecturer")}</SelectItem>
                <SelectItem value="adjunct_professor">{t("adjunctProfessor")}</SelectItem>
                <SelectItem value="visiting_professor">{t("visitingProfessor")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenure_status">{t("tenureStatus")}</Label>
            <Select
              value={profile.tenure_status || ""}
              onValueChange={(value) => setProfile({...profile, tenure_status: value})}
            >
              <SelectTrigger id="tenure_status">
                <SelectValue placeholder={t("selectTenureStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenured">{t("tenured")}</SelectItem>
                <SelectItem value="tenure_track">{t("tenureTrack")}</SelectItem>
                <SelectItem value="non_tenure_track">{t("nonTenureTrack")}</SelectItem>
                <SelectItem value="not_applicable">{t("notApplicable")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">{t("department")}</Label>
            <Select
              value={profile.department_id ? String(profile.department_id) : ""}
              onValueChange={(value) => setProfile({...profile, department_id: parseInt(value)})}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder={t("selectDepartment")} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Expertise step component
const ExpertiseStep = ({ expertise, setExpertise, subjectAreas, educationLevels, languages }) => {
  const { t } = useTranslation();
  const [specialization, setSpecialization] = useState("");
  const [subject, setSubject] = useState("");

  // Add specialization
  const addSpecialization = () => {
    if (specialization && !expertise.specializations.includes(specialization)) {
      setExpertise({
        ...expertise,
        specializations: [...expertise.specializations, specialization]
      });
      setSpecialization("");
    }
  };

  // Add subject
  const addSubject = () => {
    if (subject && !expertise.preferred_subjects.includes(subject)) {
      setExpertise({
        ...expertise,
        preferred_subjects: [...expertise.preferred_subjects, subject]
      });
      setSubject("");
    }
  };

  // Remove item from array
  const removeItem = (array, item) => {
    return array.filter(i => i !== item);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("teachingExpertise")}</CardTitle>
        <CardDescription>
          {t("teachingExpertiseDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Specializations */}
        <div className="space-y-2">
          <Label>{t("specializations")}</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t("addSpecialization")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("searchSpecializations")} />
                  <CommandList>
                    <CommandEmpty>{t("noSpecializationFound")}</CommandEmpty>
                    <CommandGroup>
                      {subjectAreas.map((area) => (
                        <CommandItem
                          key={area}
                          onSelect={() => {
                            setSpecialization(area);
                            addSpecialization();
                          }}
                        >
                          {area}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Input
              placeholder={t("customSpecialization")}
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSpecialization()}
            />
            <Button onClick={addSpecialization}>
              {t("add")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {expertise.specializations.map((spec) => (
              <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                {spec}
                <button
                  className="ml-1 rounded-full hover:bg-muted"
                  onClick={() => setExpertise({
                    ...expertise,
                    specializations: removeItem(expertise.specializations, spec)
                  })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Preferred Subjects */}
        <div className="space-y-2">
          <Label>{t("preferredSubjects")}</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t("addSubject")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput placeholder={t("searchSubjects")} />
                  <CommandList>
                    <CommandEmpty>{t("noSubjectFound")}</CommandEmpty>
                    <CommandGroup>
                      {subjectAreas.map((area) => (
                        <CommandItem
                          key={area}
                          onSelect={() => {
                            setSubject(area);
                            addSubject();
                          }}
                        >
                          {area}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Input
              placeholder={t("customSubject")}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
            />
            <Button onClick={addSubject}>
              {t("add")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {expertise.preferred_subjects.map((subj) => (
              <Badge key={subj} variant="secondary" className="flex items-center gap-1">
                {subj}
                <button
                  className="ml-1 rounded-full hover:bg-muted"
                  onClick={() => setExpertise({
                    ...expertise,
                    preferred_subjects: removeItem(expertise.preferred_subjects, subj)
                  })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Education Levels */}
        <div className="space-y-2">
          <Label>{t("educationLevels")}</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {educationLevels.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`level-${level}`}
                  checked={expertise.education_levels.includes(level)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setExpertise({
                        ...expertise,
                        education_levels: [...expertise.education_levels, level]
                      });
                    } else {
                      setExpertise({
                        ...expertise,
                        education_levels: removeItem(expertise.education_levels, level)
                      });
                    }
                  }}
                />
                <Label htmlFor={`level-${level}`}>{level}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching Languages */}
        <div className="space-y-2">
          <Label>{t("teachingLanguages")}</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {languages.map((language) => (
              <div key={language} className="flex items-center space-x-2">
                <Checkbox
                  id={`lang-${language}`}
                  checked={expertise.teaching_languages.includes(language)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setExpertise({
                        ...expertise,
                        teaching_languages: [...expertise.teaching_languages, language]
                      });
                    } else {
                      setExpertise({
                        ...expertise,
                        teaching_languages: removeItem(expertise.teaching_languages, language)
                      });
                    }
                  }}
                />
                <Label htmlFor={`lang-${language}`}>{language}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Availability step component
const AvailabilityStep = ({ availability, setAvailability }) => {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState("");

  // Days of the week
  const daysOfWeek = [
    { id: "monday", label: t("monday") },
    { id: "tuesday", label: t("tuesday") },
    { id: "wednesday", label: t("wednesday") },
    { id: "thursday", label: t("thursday") },
    { id: "friday", label: t("friday") },
    { id: "saturday", label: t("saturday") },
    { id: "sunday", label: t("sunday") }
  ];

  // Add office hours for a day
  const addOfficeHours = () => {
    if (selectedDay && !availability.office_hours[selectedDay]) {
      setAvailability({
        ...availability,
        office_hours: {
          ...availability.office_hours,
          [selectedDay]: { start: "09:00", end: "11:00" }
        }
      });
    }
  };

  // Update office hours for a day
  const updateOfficeHours = (day: string, field: string, value: string) => {
    setAvailability({
      ...availability,
      office_hours: {
        ...availability.office_hours,
        [day]: {
          ...availability.office_hours[day],
          [field]: value
        }
      }
    });
  };

  // Remove office hours for a day
  const removeOfficeHours = (day: string) => {
    const updatedOfficeHours = { ...availability.office_hours };
    delete updatedOfficeHours[day];

    setAvailability({
      ...availability,
      office_hours: updatedOfficeHours
    });
  };

  // Update contact preferences
  const updateContactPreferences = (field: string, value: string) => {
    setAvailability({
      ...availability,
      contact_preferences: {
        ...availability.contact_preferences,
        [field]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("availability")}</CardTitle>
        <CardDescription>
          {t("availabilityDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Office Location */}
        <div className="space-y-2">
          <Label htmlFor="office_location">{t("officeLocation")}</Label>
          <Input
            id="office_location"
            placeholder={t("officeLocationPlaceholder")}
            value={availability.office_location || ""}
            onChange={(e) => setAvailability({
              ...availability,
              office_location: e.target.value
            })}
          />
        </div>

        {/* Office Hours */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>{t("officeHours")}</Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedDay}
                onValueChange={setSelectedDay}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t("selectDay")} />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem
                      key={day.id}
                      value={day.id}
                      disabled={availability.office_hours[day.id]}
                    >
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={addOfficeHours}
                disabled={!selectedDay || availability.office_hours[selectedDay]}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("add")}
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {Object.keys(availability.office_hours).length > 0 ? (
              Object.entries(availability.office_hours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-2 p-2 border rounded-md">
                  <div className="font-medium min-w-24">
                    {t(day)}:
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={hours.start}
                      onChange={(e) => updateOfficeHours(day, "start", e.target.value)}
                      className="w-28"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={hours.end}
                      onChange={(e) => updateOfficeHours(day, "end", e.target.value)}
                      className="w-28"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOfficeHours(day)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t("noOfficeHoursSet")}
              </div>
            )}
          </div>
        </div>

        {/* Contact Preferences */}
        <div className="space-y-2">
          <Label>{t("contactPreferences")}</Label>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email_contact"
                  checked={availability.contact_preferences.email_contact}
                  onCheckedChange={(checked) => updateContactPreferences("email_contact", checked)}
                />
                <Label htmlFor="email_contact">{t("emailContact")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms_notifications"
                  checked={availability.contact_preferences.sms_notifications}
                  onCheckedChange={(checked) => updateContactPreferences("sms_notifications", checked)}
                />
                <Label htmlFor="sms_notifications">{t("smsNotifications")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="app_notifications"
                  checked={availability.contact_preferences.app_notifications}
                  onCheckedChange={(checked) => updateContactPreferences("app_notifications", checked)}
                />
                <Label htmlFor="app_notifications">{t("appNotifications")}</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_contact">{t("preferredContactMethod")}</Label>
              <Select
                value={availability.contact_preferences.preferred_contact_method}
                onValueChange={(value) => updateContactPreferences("preferred_contact_method", value)}
              >
                <SelectTrigger id="preferred_contact">
                  <SelectValue placeholder={t("selectContactMethod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">{t("email")}</SelectItem>
                  <SelectItem value="phone">{t("phone")}</SelectItem>
                  <SelectItem value="app">{t("appMessaging")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response_time">
                {t("responseTimeHours")}
              </Label>
              <Input
                id="response_time"
                type="number"
                min="1"
                max="72"
                value={availability.contact_preferences.response_time_hours}
                onChange={(e) => updateContactPreferences(
                  "response_time_hours",
                  parseInt(e.target.value)
                )}
              />
            </div>
          </div>
        </div>

        {/* Tutoring Availability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tutoring_availability">{t("tutoringAvailability")}</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="tutoring_availability" className="text-sm">
                {availability.tutoring_availability ? t("available") : t("unavailable")}
              </Label>
              <Checkbox
                id="tutoring_availability"
                checked={availability.tutoring_availability}
                onCheckedChange={(checked) => setAvailability({
                  ...availability,
                  tutoring_availability: checked
                })}
              />
            </div>
          </div>

          {availability.tutoring_availability && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="max_students">
                {t("maxSimultaneousStudents")}
              </Label>
              <Input
                id="max_students"
                type="number"
                min="1"
                max="20"
                value={availability.max_students || ""}
                onChange={(e) => setAvailability({
                  ...availability,
                  max_students: parseInt(e.target.value)
                })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Courses step component
const CoursesStep = ({ courses, setCourses, availableCourses }) => {
  const { t } = useTranslation();
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    code: "",
    description: ""
  });

  // Add existing course
  const addExistingCourse = (courseId) => {
    if (!courses.course_ids.includes(courseId)) {
      setCourses({
        ...courses,
        course_ids: [...courses.course_ids, courseId]
      });
    }
  };

  // Remove existing course
  const removeExistingCourse = (courseId) => {
    setCourses({
      ...courses,
      course_ids: courses.course_ids.filter(id => id !== courseId)
    });
  };

  // Add new course
  const addNewCourse = () => {
    if (newCourse.title && newCourse.code) {
      setCourses({
        ...courses,
        new_courses: [...courses.new_courses, {...newCourse}]
      });
      setNewCourse({
        title: "",
        code: "",
        description: ""
      });
      setShowAddCourse(false);
    }
  };

  // Remove new course
  const removeNewCourse = (index) => {
    setCourses({
      ...courses,
      new_courses: courses.new_courses.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("coursesSetup")}</CardTitle>
        <CardDescription>
          {t("coursesSetupDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Courses */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>{t("existingCourses")}</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t("selectExistingCourses")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("selectCourses")}</DialogTitle>
                  <DialogDescription>
                    {t("selectCoursesDesc")}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-72">
                  <div className="space-y-2 p-1">
                    {availableCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center space-x-2 p-2 border rounded-md"
                      >
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={courses.course_ids.includes(course.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addExistingCourse(course.id);
                            } else {
                              removeExistingCourse(course.id);
                            }
                          }}
                        />
                        <div>
                          <Label htmlFor={`course-${course.id}`} className="font-medium">
                            {course.title}
                          </Label>
                          <p className="text-xs text-muted-foreground">{course.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    {t("done")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2 mt-2">
            {courses.course_ids.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.course_ids.map((courseId) => {
                  const course = availableCourses.find(c => c.id === courseId);
                  if (!course) return null;

                  return (
                    <div key={course.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-xs text-muted-foreground">{course.code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingCourse(course.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t("noExistingCoursesSelected")}
              </div>
            )}
          </div>
        </div>

        {/* New Courses */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>{t("newCourses")}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCourse(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("addNewCourse")}
            </Button>
          </div>

          {showAddCourse && (
            <Card className="mt-2 border-primary/50">
              <CardHeader className="py-2">
                <CardTitle className="text-base">{t("addNewCourse")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="course_title">{t("courseTitle")}</Label>
                  <Input
                    id="course_title"
                    placeholder={t("courseTitlePlaceholder")}
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course_code">{t("courseCode")}</Label>
                  <Input
                    id="course_code"
                    placeholder={t("courseCodePlaceholder")}
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course_description">{t("courseDescription")}</Label>
                  <Textarea
                    id="course_description"
                    placeholder={t("courseDescriptionPlaceholder")}
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddCourse(false);
                    setNewCourse({
                      title: "",
                      code: "",
                      description: ""
                    });
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={addNewCourse}
                  disabled={!newCourse.title || !newCourse.code}
                >
                  {t("addCourse")}
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="space-y-2 mt-2">
            {courses.new_courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.new_courses.map((course, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-xs text-muted-foreground">{course.code}</p>
                      {course.description && (
                        <p className="text-xs mt-1 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewCourse(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t("noNewCoursesAdded")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {t("generateCoursesWithAI")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("aiCourseGeneration")}</DialogTitle>
                <DialogDescription>
                  {t("aiCourseGenerationDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="generate_cs" />
                  <Label htmlFor="generate_cs">{t("generateCSCourses")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="generate_math" />
                  <Label htmlFor="generate_math">{t("generateMathCourses")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="generate_science" />
                  <Label htmlFor="generate_science">{t("generateScienceCourses")}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t("generateCourses")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard step component
const DashboardStep = ({ showTour, setShowTour, tourStep, setTourStep, activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  // Tour steps
  const tourSteps = [
    {
      id: 'welcome',
      title: t('welcomeToDashboard'),
      description: t('dashboardTourWelcomeDesc'),
      target: null,
    },
    {
      id: 'overview',
      title: t('dashboardOverview'),
      description: t('dashboardTourOverviewDesc'),
      target: '#overview-tab',
    },
    {
      id: 'courses',
      title: t('yourCourses'),
      description: t('dashboardTourCoursesDesc'),
      target: '#courses-tab',
    },
    {
      id: 'schedule',
      title: t('classSchedule'),
      description: t('dashboardTourScheduleDesc'),
      target: '#schedule-tab',
    },
    {
      id: 'assignments',
      title: t('assignmentsAndGrading'),
      description: t('dashboardTourAssignmentsDesc'),
      target: '#assignments-tab',
    },
    {
      id: 'ai-assistant',
      title: t('aiAssistant'),
      description: t('dashboardTourAIDesc'),
      target: '#ai-assistant-panel',
    },
  ];

  // Handle next tour step
  const nextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);

      // If the step references a tab, activate that tab
      const nextStep = tourSteps[tourStep + 1];
      if (nextStep.id === 'overview' || nextStep.id === 'courses' ||
          nextStep.id === 'schedule' || nextStep.id === 'assignments') {
        setActiveTab(nextStep.id);
      }
    } else {
      setShowTour(false);
      setTourStep(0);
    }
  };

  // Start tour
  const startTour = () => {
    setShowTour(true);
    setTourStep(0);
    setActiveTab('overview');
  };

  return (
    <div className="space-y-6">
      {/* Dashboard preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboardPreview')}</CardTitle>
          <CardDescription>
            {t('dashboardPreviewDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger
                value="overview"
                id="overview-tab"
                className="flex items-center gap-2"
              >
                <BarChart2 className="h-4 w-4" />
                <span>{t('overview')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                id="courses-tab"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>{t('courses')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                id="schedule-tab"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span>{t('schedule')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                id="assignments-tab"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>{t('assignments')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium">0</p>
                      <p className="text-sm text-muted-foreground">{t('pendingAssignments')}</p>
                    </div>
                    <div className="rounded-full p-2 bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium">0</p>
                      <p className="text-sm text-muted-foreground">{t('unreadMessages')}</p>
                    </div>
                    <div className="rounded-full p-2 bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium">
                        {courses.course_ids.length + courses.new_courses.length}
                      </p>
                      <p className="text-sm text-muted-foreground">{t('activeCourses')}</p>
                    </div>
                    <div className="rounded-full p-2 bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{t('upcomingClasses')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>{t('noUpcomingClasses')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(courses.course_ids.length > 0 || courses.new_courses.length > 0) ? (
                  [...courses.course_ids.map(id => {
                    const course = availableCourses.find(c => c.id === id);
                    return course ? (
                      <Card key={`existing-${id}`}>
                        <CardContent className="p-4">
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-xs text-muted-foreground">{course.code}</p>
                        </CardContent>
                      </Card>
                    ) : null;
                  }), ...courses.new_courses.map((course, index) => (
                    <Card key={`new-${index}`}>
                      <CardContent className="p-4">
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-xs text-muted-foreground">{course.code}</p>
                      </CardContent>
                    </Card>
                  ))].filter(Boolean)
                ) : (
                  <div className="col-span-2 text-center py-6 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>{t('noCourses')}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>{t('emptySchedule')}</p>
                    <p className="text-sm">{t('scheduleWillBeAvailable')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>{t('noAssignments')}</p>
                    <p className="text-sm">{t('createAssignmentsAfterOnboarding')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* AI Assistant */}
          <Card id="ai-assistant-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCog className="h-5 w-5 text-primary" />
                {t('aiAssistant')}
              </CardTitle>
              <CardDescription>
                {t('aiAssistantDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-3 text-sm">
                <p>{t('aiAssistantWelcomeMessage')}</p>
              </div>
              <div className="flex mt-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {t('setupSchedule')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('generateContent')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Button
            onClick={startTour}
            variant="outline"
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            {t('startGuidedTour')}
          </Button>
        </CardFooter>
      </Card>

      {/* More info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('nextSteps')}</CardTitle>
          <CardDescription>
            {t('afterOnboardingDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t('createAssignments')}</h3>
                <p className="text-sm text-muted-foreground">{t('createAssignmentsDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t('manageStudents')}</h3>
                <p className="text-sm text-muted-foreground">{t('manageStudentsDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t('scheduleLessons')}</h3>
                <p className="text-sm text-muted-foreground">{t('scheduleLessonsDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t('useAITools')}</h3>
                <p className="text-sm text-muted-foreground">{t('useAIToolsDesc')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tour overlay */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{tourSteps[tourStep].title}</CardTitle>
              <CardDescription>
                {`${tourStep + 1}/${tourSteps.length}: ${tourSteps[tourStep].description}`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTour(false);
                  setTourStep(0);
                }}
              >
                {t('skipTour')}
              </Button>
              <Button onClick={nextTourStep}>
                {tourStep < tourSteps.length - 1 ? t('nextStep') : t('finishTour')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

// Complete step component
const CompleteStep = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {t('congratulations', { name: user?.full_name })}
        </CardTitle>
        <CardDescription className="text-center">
          {t('onboardingCompleteDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center my-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-lg">{t('whatYouCanDoNow')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">{t('manageCourses')}</h3>
                <p className="text-sm text-muted-foreground">{t('manageCoursesDesc')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">{t('manageSchedule')}</h3>
                <p className="text-sm text-muted-foreground">{t('manageScheduleDesc')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium">{t('createAssignments')}</h3>
                <p className="text-sm text-muted-foreground">{t('createAssignmentsShortDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p>{t('needHelpQuestion')}</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <a href="#" target="_blank" rel="noopener noreferrer">
                <HelpCircle className="h-4 w-4" />
                {t('viewDocumentation')}
              </a>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t('watchVideo')}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessorOnboardingFlow;
