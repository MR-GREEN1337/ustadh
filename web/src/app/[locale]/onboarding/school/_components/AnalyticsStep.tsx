// web/src/app/[locale]/dashboard/school/onboarding/_components/AnalyticsStep.tsx
"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Loader2,
  BarChart4,
  LineChart,
  AreaChart,
  PieChart,
  Share2,
  Bell,
  Mail,
  Calendar
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Analytics preferences schema
const analyticsSchema = z.object({
  track_student_progress: z.boolean().default(true),
  track_attendance: z.boolean().default(true),
  generate_weekly_reports: z.boolean().default(true),
  share_anonymized_data: z.boolean().default(false),
  ai_personalization: z.boolean().default(true),
});

// Email notifications schema
const emailSchema = z.object({
  daily_summary: z.boolean().default(false),
  weekly_report: z.boolean().default(true),
  student_alerts: z.boolean().default(true),
  staff_notifications: z.boolean().default(true),
  admin_alerts: z.boolean().default(true),
});

interface AnalyticsStepProps {
  onCompleted: () => void;
  status: any;
}

export default function AnalyticsStep({ onCompleted, status }: AnalyticsStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("analytics");

  // This is an optional step, so we can complete it immediately
  const handleContinue = () => {
    onCompleted();
  };

  // Initialize analytics form
  const analyticsForm = useForm<z.infer<typeof analyticsSchema>>({
    resolver: zodResolver(analyticsSchema),
    defaultValues: {
      track_student_progress: true,
      track_attendance: true,
      generate_weekly_reports: true,
      share_anonymized_data: false,
      ai_personalization: true,
    },
  });

  // Initialize email form
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      daily_summary: false,
      weekly_report: true,
      student_alerts: true,
      staff_notifications: true,
      admin_alerts: true,
    },
  });

  // Handle analytics form submission
  const onAnalyticsSubmit = async (values: z.infer<typeof analyticsSchema>) => {
    setSubmitting(true);

    try {
      // In a real implementation, we'd make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: t("analyticsSettingsSaved") || "Analytics Settings Saved",
        description: t("analyticsSettingsSuccess") || "Your analytics preferences have been saved successfully",
        variant: "success",
      });

      // Mark as completed
      onCompleted();

    } catch (error) {
      console.error("Error saving analytics settings:", error);

      toast({
        title: t("saveFailed") || "Save Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle email form submission
  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setSubmitting(true);

    try {
      // In a real implementation, we'd make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: t("notificationSettingsSaved") || "Notification Settings Saved",
        description: t("notificationSettingsSuccess") || "Your notification preferences have been saved successfully",
        variant: "success",
      });

      // Mark as completed
      onCompleted();

    } catch (error) {
      console.error("Error saving notification settings:", error);

      toast({
        title: t("saveFailed") || "Save Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">{t("analyticsAndReporting") || "Analytics & Reporting"}</h3>
        <p className="text-sm text-muted-foreground">
          {t("analyticsDescription") || "Configure your analytics preferences and reporting settings"}
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            {t("analytics") || "Analytics"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t("notifications") || "Notifications"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t("analyticsPreferences") || "Analytics Preferences"}</CardTitle>
                <CardDescription>
                  {t("analyticsPreferencesDesc") || "Configure how data is collected and analyzed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...analyticsForm}>
                  <form onSubmit={analyticsForm.handleSubmit(onAnalyticsSubmit)} className="space-y-6">
                    <FormField
                      control={analyticsForm.control}
                      name="track_student_progress"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base">
                              {t("trackStudentProgress") || "Track Student Progress"}
                            </FormLabel>
                            <FormDescription>
                              {t("trackStudentProgressDesc") || "Collect data on student learning progress and performance"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={analyticsForm.control}
                      name="track_attendance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base">
                              {t("trackAttendance") || "Track Attendance"}
                            </FormLabel>
                            <FormDescription>
                              {t("trackAttendanceDesc") || "Monitor and report on student attendance patterns"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={analyticsForm.control}
                      name="generate_weekly_reports"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base">
                              {t("generateWeeklyReports") || "Generate Weekly Reports"}
                            </FormLabel>
                            <FormDescription>
                              {t("generateWeeklyReportsDesc") || "Automatically generate and send weekly performance reports"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={analyticsForm.control}
                      name="ai_personalization"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base">
                              {t("aiPersonalization") || "AI Personalization"}
                            </FormLabel>
                            <FormDescription>
                              {t("aiPersonalizationDesc") || "Use AI to personalize learning experiences based on student data"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={analyticsForm.control}
                      name="share_anonymized_data"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base">
                              {t("shareAnonymizedData") || "Share Anonymized Data"}
                            </FormLabel>
                            <FormDescription>
                              {t("shareAnonymizedDataDesc") || "Contribute anonymized data to improve platform performance and research (no personally identifiable information is shared)"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("saving") || "Saving..."}
                        </>
                      ) : (
                        <>
                          <BarChart4 className="w-4 h-4 mr-2" />
                          {t("saveAnalyticsPreferences") || "Save Analytics Preferences"}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("availableReports") || "Available Reports"}</CardTitle>
                <CardDescription>
                  {t("reportTypes") || "Types of reports you can access"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <BarChart4 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t("studentProgress") || "Student Progress"}</h4>
                    <p className="text-sm text-muted-foreground">{t("studentProgressDesc") || "Track individual student progress across courses"}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <LineChart className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t("classPerformance") || "Class Performance"}</h4>
                    <p className="text-sm text-muted-foreground">{t("classPerformanceDesc") || "Compare performance across different classes and subjects"}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AreaChart className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t("attendanceTrends") || "Attendance Trends"}</h4>
                    <p className="text-sm text-muted-foreground">{t("attendanceTrendsDesc") || "Monitor attendance patterns over time"}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <PieChart className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{t("engagementMetrics") || "Engagement Metrics"}</h4>
                    <p className="text-sm text-muted-foreground">{t("engagementMetricsDesc") || "Measure student engagement with platform features"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("notificationPreferences") || "Notification Preferences"}</CardTitle>
              <CardDescription>
                {t("notificationPreferencesDesc") || "Configure how and when you receive reports and alerts"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="daily_summary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {t("dailySummary") || "Daily Summary"}
                            </FormLabel>
                            <FormDescription>
                              {t("dailySummaryDesc") || "Receive a daily summary of platform activity"}
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

                    <FormField
                      control={emailForm.control}
                      name="weekly_report"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {t("weeklyReport") || "Weekly Report"}
                            </FormLabel>
                            <FormDescription>
                              {t("weeklyReportDesc") || "Receive detailed weekly performance reports"}
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

                    <FormField
                      control={emailForm.control}
                      name="student_alerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center">
                              <Bell className="w-4 h-4 mr-2" />
                              {t("studentAlerts") || "Student Alerts"}
                            </FormLabel>
                            <FormDescription>
                              {t("studentAlertsDesc") || "Notifications about significant student events"}
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

                    <FormField
                      control={emailForm.control}
                      name="staff_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center">
                              <Share2 className="w-4 h-4 mr-2" />
                              {t("staffNotifications") || "Staff Notifications"}
                            </FormLabel>
                            <FormDescription>
                              {t("staffNotificationsDesc") || "Updates related to staff activities"}
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
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="admin_alerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4 bg-amber-50 dark:bg-amber-950/20">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center">
                            <Bell className="w-4 h-4 mr-2" />
                            {t("adminAlerts") || "Administrative Alerts"}
                          </FormLabel>
                          <FormDescription>
                            {t("adminAlertsDesc") || "Important system and administrative notifications (recommended to keep enabled)"}
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

                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving") || "Saving..."}
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        {t("saveNotificationPreferences") || "Save Notification Preferences"}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {t("notificationsNote") || "You can change these notification settings at any time from your dashboard."}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
      <Button onClick={handleContinue}>
          {t("finishOnboarding") || "Finish Onboarding"}
        </Button>
      </div>
    </div>
  );
}
