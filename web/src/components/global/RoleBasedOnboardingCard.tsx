"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/i18n/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
  Building,
  Briefcase,
  Brain,
  Bot,
  UserCheck,
  ChevronRight,
  School,
  BookOpenCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

// Define setup steps for each user type
const setupSteps = {
  teacher: [
    { id: "profile", title: "Complete Profile", description: "Add your teaching background and expertise" },
    { id: "courses", title: "Setup Courses", description: "Create and customize your course materials" },
    { id: "aiTools", title: "Explore AI Tools", description: "Discover how AI can assist your teaching" },
    { id: "students", title: "Manage Students", description: "Set up your class roster and groups" }
  ],
  professor: [
    { id: "profile", title: "Academic Profile", description: "Set up your academic information and title" },
    { id: "expertise", title: "Teaching Expertise", description: "Specify your academic specializations" },
    { id: "availability", title: "Availability", description: "Configure office hours and contact preferences" },
    { id: "courses", title: "Courses", description: "Set up courses you'll be teaching" },
    { id: "materials", title: "Teaching Materials", description: "Prepare your teaching resources" }
  ],
  parent: [
    { id: "profile", title: "Complete Profile", description: "Add your contact information" },
    { id: "children", title: "Connect Children", description: "Link to your children's accounts" },
    { id: "notifications", title: "Setup Notifications", description: "Customize alerts and updates" },
    { id: "progress", title: "View Progress", description: "Learn how to monitor academic performance" }
  ],
  admin: [
    { id: "schoolProfile", title: "School Profile", description: "Complete your school's information" },
    { id: "departments", title: "Setup Departments", description: "Create academic departments" },
    { id: "staff", title: "Add Staff", description: "Invite teachers and administrators" },
    { id: "classes", title: "Configure Classes", description: "Set up class structure and schedules" }
  ],
  student: [
    { id: "profile", title: "Complete Profile", description: "Add your academic interests" },
    { id: "subjects", title: "Select Subjects", description: "Choose your area of study" },
    { id: "aiTutor", title: "Meet Your AI Tutor", description: "Learn how to use AI for studies" },
    { id: "goals", title: "Set Goals", description: "Define your learning objectives" }
  ]
};

export const RoleBasedOnboardingCard = ({ closeSidebar }: { closeSidebar?: () => void }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { locale } = useParams();
  const { t } = useTranslation();
  const isRTL = locale === "ar";

  // Mock progress state - in a real app, this would come from the backend
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Map user types for consistency
  const getUserType = () => {
    if (!user?.user_type) return "student";

    switch (user.user_type) {
      case "school_admin":
        return "admin";
      case "school_staff":
        return "teacher";
        //@ts-ignore
      case "school_professor":
        return "professor";
      default:
        return user.user_type;
    }
  };

  const normalizedUserType = getUserType();

  // Get the appropriate steps based on user type
  const userSteps = setupSteps[normalizedUserType as keyof typeof setupSteps] || setupSteps.student;

  // Mock effect to simulate loading progress from API
  useEffect(() => {
    // Simulate API call to get user's onboarding progress
    const mockCompletedSteps = normalizedUserType === "admin"
      ? ["schoolProfile"]
      : normalizedUserType === "teacher"
      ? ["profile"]
      : normalizedUserType === "professor"
      ? ["profile"]
      : normalizedUserType === "parent"
      ? ["profile", "children"]
      : ["profile"];

    setCompletedSteps(mockCompletedSteps);
    setProgress((mockCompletedSteps.length / userSteps.length) * 100);
  }, [normalizedUserType, userSteps.length]);

  // Get next incomplete step
  const getNextStep = () => {
    const nextStep = userSteps.find(step => !completedSteps.includes(step.id));
    return nextStep || userSteps[0];
  };

  // Navigate to appropriate setup page based on user type and next step
  const handleContinueSetup = () => {
    const nextStep = getNextStep();
    let path = `/${locale}/onboarding`;

    if (normalizedUserType === "admin") {
      path = `/${locale}/onboarding/school`;
    } else if (normalizedUserType === "teacher") {
      if (nextStep.id === "profile") {
        path = `/${locale}/dashboard/profile`;
      } else if (nextStep.id === "courses") {
        path = `/${locale}/dashboard/teaching/courses`;
      } else if (nextStep.id === "aiTools") {
        path = `/${locale}/dashboard/tutor/lesson-plans`;
      } else {
        path = `/${locale}/dashboard/teaching/classes`;
      }
    } else if (normalizedUserType === "professor") {
      path = `/${locale}/onboarding/professor`;
    } else if (normalizedUserType === "parent") {
      path = `/${locale}/onboarding/parent`;
    } else {
      // Student paths based on next step
      if (nextStep.id === "profile") {
        path = `/${locale}/onboarding`;
      }
    }

    router.push(path);
    if (closeSidebar) closeSidebar();
  };

  // Get appropriate icon for the card based on user type
  const getUserIcon = () => {
    switch (normalizedUserType) {
      case "teacher":
        return <Briefcase className="h-5 w-5 text-primary" />;
      case "professor":
        return <BookOpenCheck className="h-5 w-5 text-primary" />;
      case "parent":
        return <Users className="h-5 w-5 text-primary" />;
      case "admin":
        return <Building className="h-5 w-5 text-primary" />;
      default:
        return <GraduationCap className="h-5 w-5 text-primary" />;
    }
  };

  // Get appropriate title for the card based on user type
  const getCardTitle = () => {
    switch (normalizedUserType) {
      case "teacher":
        return t("setupTeachingEnvironment") || "Setup Your Teaching Environment";
      case "professor":
        return t("setupProfessorProfile") || "Setup Your Professor Profile";
      case "parent":
        return t("setupParentDashboard") || "Setup Parent Dashboard";
      case "admin":
        return t("setupSchoolStructure") || "Setup School Structure";
      default:
        return t("completeYourProfile") || "Complete Your Profile";
    }
  };

  // Get appropriate description for the card based on user type
  const getCardDescription = () => {
    switch (normalizedUserType) {
      case "teacher":
        return t("teacherOnboardingDesc") || "Configure your courses and discover AI teaching tools";
      case "professor":
        return t("professorOnboardingDesc") || "Configure your academic profile, courses, and teaching materials";
      case "parent":
        return t("parentOnboardingDesc") || "Connect with your children and set up monitoring preferences";
      case "admin":
        return t("adminOnboardingDesc") || "Set up your school structure, departments, and classes";
      default:
        return t("studentOnboardingDesc") || "Personalize your learning experience";
    }
  };

  // Get button text based on user type
  const getButtonText = () => {
    if (completedSteps.length === 0) {
      return t("getStarted") || "Get Started";
    }
    if (completedSteps.length === userSteps.length) {
      return t("viewSetup") || "View Setup";
    }
    return t("continueSetup") || "Continue Setup";
  };

  // Only show next step details if there are incomplete steps
  const showNextStep = completedSteps.length < userSteps.length;
  const nextStep = getNextStep();

  // Return null if all steps are completed and it's not an admin
  // Admins always see the card as they have ongoing setup responsibilities
  if (completedSteps.length === userSteps.length && normalizedUserType !== "admin") {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getUserIcon()}
          {getCardTitle()}
        </CardTitle>
        <CardDescription className={`text-xs ${isRTL ? "text-right" : ""}`}>
          {getCardDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2 space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{t("setupProgress") || "Setup Progress"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Next step block - only show if there are incomplete steps */}
        {showNextStep && (
          <div className="bg-background/80 rounded-md p-2 text-xs">
            <p className="font-medium mb-1 flex items-center">
              <ChevronRight className="h-3 w-3 mr-1 text-primary" />
              {/*@ts-ignore */}
              {t("nextStep") || "Next Step"}: {t(nextStep.id) || nextStep.title}
            </p>
              {/*@ts-ignore */}
            <p className="text-muted-foreground">{t(`${nextStep.id}Desc`) || nextStep.description}</p>
          </div>
        )}

        {/* Special feature highlights based on role */}
        {normalizedUserType === "teacher" || normalizedUserType === "school_staff" ? (
          <div className="flex items-center text-xs text-primary">
            <Bot className="h-3 w-3 mr-1" />
            <span>{t("aiTeachingAssistant") || "AI Teaching Assistant Available"}</span>
          </div>
        ) : normalizedUserType === "professor" ? (
          <div className="flex items-center text-xs text-primary">
            <BookOpenCheck className="h-3 w-3 mr-1" />
            <span>{t("aiCourseMaterials") || "AI Course Materials Generation Available"}</span>
          </div>
        ) : normalizedUserType === "admin" ? (
          <div className="flex items-center text-xs text-primary">
            <School className="h-3 w-3 mr-1" />
            <span>{t("schoolSetupWizard") || "School Setup Wizard Available"}</span>
          </div>
        ) : normalizedUserType === "parent" ? (
          <div className="flex items-center text-xs text-primary">
            <UserCheck className="h-3 w-3 mr-1" />
            <span>{t("childConnectionPending") || "Child Connection Pending"}</span>
          </div>
        ) : (
          <div className="flex items-center text-xs text-primary">
            <Brain className="h-3 w-3 mr-1" />
            <span>{t("personalizedLearning") || "Personalized Learning Available"}</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary/20 text-primary hover:bg-primary/20 hover:text-primary"
          onClick={handleContinueSetup}
        >
          <span>{getButtonText()}</span>
          {isRTL ? (
            <ArrowRight className="h-3 w-3 mr-2" />
          ) : (
            <ArrowRight className="h-3 w-3 ml-2" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
