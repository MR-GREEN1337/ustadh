"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams, useRouter } from "next/navigation";
import {
  School,
  Building,
  Users,
  BookOpen,
  CheckCircle,
  Settings,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Database,
  GraduationCap
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import schoolOnboardingService, { OnboardingStatus } from "@/services/SchoolOnboardingService";

// Import components for each step
import SchoolProfileStep from "./_components/SchoolProfileStep";
import AcademicUnitsStep from "./_components/AcademicUnitsStep";
import StaffStep from "./_components/StaffStep";
import CoursesStep from "./_components/CoursesStep";
import StudentsStep from "./_components/StudentsStep";
import IntegrationsStep from "./_components/IntegrationsStep";
import AnalyticsStep from "./_components/AnalyticsStep";

// Define the onboarding steps
const onboardingSteps = [
  {
    id: "profile",
    titleKey: "profileStep",
    descriptionKey: "profileStepDescription",
    icon: School,
    component: SchoolProfileStep
  },
  {
    id: "departments",
    titleKey: "academicUnitsStep",
    descriptionKey: "academicUnitsStepDescription",
    icon: Building,
    component: AcademicUnitsStep
  },
  {
    id: "staff",
    titleKey: "staffStep",
    descriptionKey: "staffStepDescription",
    icon: Users,
    component: StaffStep
  },
  {
    id: "courses",
    titleKey: "coursesStep",
    descriptionKey: "coursesStepDescription",
    icon: BookOpen,
    component: CoursesStep
  },
  {
    id: "students",
    titleKey: "studentsStep",
    descriptionKey: "studentsStepDescription",
    icon: GraduationCap,
    component: StudentsStep
  },
  {
    id: "integrations",
    titleKey: "integrationsStep",
    descriptionKey: "integrationsStepDescription",
    icon: Database,
    component: IntegrationsStep
  },
  {
    id: "analytics",
    titleKey: "analyticsStep",
    descriptionKey: "analyticsStepDescription",
    icon: Settings,
    component: AnalyticsStep
  }
];

export default function SchoolOnboarding() {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeStep, setActiveStep] = useState("profile");
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    school_id: 0,
    profile_completed: false,
    departments_created: false,
    admin_staff_invited: false,
    professors_invited: false,
    courses_created: false,
    classes_created: false,
    students_imported: false,
    onboarding_completed: false,
    completion_percentage: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch onboarding status on component mount
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        setLoading(true);

        // Use our service to get the status
        const status = await schoolOnboardingService.getOnboardingStatus();
        setOnboardingStatus(status);

        // If onboarding is already completed, redirect to dashboard
        if (status.onboarding_completed) {
          router.push(`/${locale}/dashboard/school`);
        }
      } catch (error) {
        console.error("Error fetching onboarding status:", error);

        toast({
          title: t("errorLoadingStatus"),
          description: t("pleaseRefresh"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [locale, router, t, toast]);

  // Handle step completion
  const handleStepCompleted = (stepId: string, isCompleted = true) => {
    // Update local state
    const statusKey = {
      profile: "profile_completed",
      departments: "departments_created",
      staff: "admin_staff_invited", // This might also set professors_invited
      courses: "courses_created",
      students: "students_imported",
      // No direct mapping for integrations and analytics as they're optional
    }[stepId] as keyof OnboardingStatus;

    if (statusKey) {
      setOnboardingStatus(prev => ({
        ...prev,
        [statusKey]: isCompleted
      }));
    }

    // Navigate to next step
    const currentIndex = onboardingSteps.findIndex(step => step.id === stepId);
    if (currentIndex < onboardingSteps.length - 1) {
      setActiveStep(onboardingSteps[currentIndex + 1].id);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);

      // Use our service to complete onboarding
      const result = await schoolOnboardingService.completeOnboarding();

      if (result.status === 'success') {
        toast({
          title: t("onboardingComplete"),
          description: t("schoolSetupSuccess"),
          variant: "success",
        });

        // Redirect to main school dashboard
        router.push(`/${locale}/dashboard/school`);
      } else {
        toast({
          title: t("onboardingError"),
          description: result.message || t("tryAgain"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);

      toast({
        title: t("onboardingError"),
        description: error.message || t("unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine if the active step is completed
  const isActiveStepCompleted = () => {
    const statusKey = {
      profile: "profile_completed",
      departments: "departments_created",
      staff: "admin_staff_invited",
      courses: "courses_created",
      students: "students_imported",
      // Integrations and analytics are optional
      integrations: true,
      analytics: true
    }[activeStep];

    return typeof statusKey === 'boolean' ? statusKey : onboardingStatus[statusKey as keyof OnboardingStatus];
  };

  // Determine if we can complete onboarding
  const canCompleteOnboarding = onboardingStatus.profile_completed &&
    (onboardingStatus.admin_staff_invited || onboardingStatus.professors_invited);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">{t("schoolOnboarding")}</h1>
        <p className="text-muted-foreground">
          {t("onboardingInstructions")}
        </p>

        <div className="mt-4">
          <Progress value={onboardingStatus.completion_percentage} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            {t("completionPercentage", { percentage: onboardingStatus.completion_percentage as any })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar with steps */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="space-y-1">
            {onboardingSteps.map((step) => {
              // Determine step status
              const statusKey = {
                profile: "profile_completed",
                departments: "departments_created",
                staff: "admin_staff_invited",
                courses: "courses_created",
                students: "students_imported",
                // No direct mapping for integrations and analytics
              }[step.id] as keyof OnboardingStatus | undefined;

              const isCompleted = statusKey ? onboardingStatus[statusKey] : false;
              const isActive = activeStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center justify-between w-full p-3 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <step.icon className="w-5 h-5" />
                    <span>{t(step.titleKey as any)}</span>
                  </div>

                  {isCompleted && <CheckCircle className="w-4 h-4" />}
                  {isActive && !isCompleted && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          {/* Complete onboarding button */}
          <div className="mt-8">
            <Button
              onClick={handleCompleteOnboarding}
              disabled={!canCompleteOnboarding || loading}
              className="w-full"
              variant={canCompleteOnboarding ? "default" : "outline"}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {t("completeOnboarding")}
            </Button>

            {!canCompleteOnboarding && (
              <p className="mt-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3 inline-block mr-1" />
                {t("completeRequiredSteps")}
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <Card>
            <CardHeader>
              {onboardingSteps.map((step) => {
                if (step.id === activeStep) {
                  return (
                    <div key={step.id}>
                      <CardTitle className="flex items-center space-x-2">
                        <step.icon className="w-5 h-5" />
                        <span>{t(step.titleKey as any)}</span>
                      </CardTitle>
                      <CardDescription>
                        {t(step.descriptionKey as any)}
                      </CardDescription>
                    </div>
                  );
                }
                return null;
              })}
            </CardHeader>

            <CardContent>
              {onboardingSteps.map((step) => {
                if (step.id === activeStep) {
                  const StepComponent = step.component;
                  return (
                    <StepComponent
                      key={step.id}
                      onCompleted={() => handleStepCompleted(step.id)}
                      status={onboardingStatus}
                    />
                  );
                }
                return null;
              })}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = onboardingSteps.findIndex(step => step.id === activeStep);
                  if (currentIndex > 0) {
                    setActiveStep(onboardingSteps[currentIndex - 1].id);
                  }
                }}
                disabled={activeStep === onboardingSteps[0].id}
              >
                {t("previous")}
              </Button>

              <Button
                onClick={() => {
                  const currentIndex = onboardingSteps.findIndex(step => step.id === activeStep);
                  if (currentIndex < onboardingSteps.length - 1) {
                    setActiveStep(onboardingSteps[currentIndex + 1].id);
                  } else {
                    // If we're on the last step, attempt to complete onboarding
                    if (canCompleteOnboarding) {
                      handleCompleteOnboarding();
                    }
                  }
                }}
                disabled={activeStep === onboardingSteps[onboardingSteps.length - 1].id && !canCompleteOnboarding}
              >
                {activeStep === onboardingSteps[onboardingSteps.length - 1].id
                  ? t("finish")
                  : t("next")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
