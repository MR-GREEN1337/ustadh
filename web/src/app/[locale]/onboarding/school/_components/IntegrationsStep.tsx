// web/src/app/[locale]/dashboard/school/onboarding/_components/IntegrationsStep.tsx
"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Loader2,
  Database,
  Globe,
  LinkIcon,
  Lock,
  ExternalLink,
  Check,
  ChevronRight
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

// Integration form schema
const integrationSchema = z.object({
  integration_type: z.string().min(1, { message: "Integration type is required" }),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  base_url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  enabled: z.boolean().default(true),
});

// Available integration types
const integrationTypes = [
  { value: "google_classroom", label: "Google Classroom", icon: Globe },
  { value: "moodle", label: "Moodle", icon: Database },
  { value: "canvas", label: "Canvas LMS", icon: Database },
  { value: "custom", label: "Custom Integration", icon: LinkIcon },
];

interface IntegrationsStepProps {
  onCompleted: () => void;
  status: any;
}

export default function IntegrationsStep({ onCompleted, status }: IntegrationsStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // This is an optional step, so we can complete it immediately
  // but we'll still provide the functionality to configure integrations
  const handleContinue = () => {
    onCompleted();
  };

  // Initialize form
  const form = useForm<z.infer<typeof integrationSchema>>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      integration_type: "",
      api_key: "",
      api_secret: "",
      base_url: "",
      enabled: true,
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof integrationSchema>) => {
    setSubmitting(true);

    try {
      // In a real implementation, we'd make an API call here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: t("integrationConfigured") || "Integration Configured",
        description: t("integrationConfiguredSuccess") || "Integration settings have been saved successfully",
        variant: "success",
      });

      // Reset the form
      form.reset();

      // Mark as completed
      onCompleted();

    } catch (error) {
      console.error("Error configuring integration:", error);

      toast({
        title: t("configurationFailed") || "Configuration Failed",
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
        <h3 className="text-lg font-medium">{t("configureIntegrations") || "Configure Integrations"}</h3>
        <p className="text-sm text-muted-foreground">
          {t("integrationsDescription") || "Connect your existing systems with our platform"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("availableIntegrations") || "Available Integrations"}</CardTitle>
              <CardDescription>
                {t("integrationsInfoDesc") || "Connect with your existing Learning Management Systems (LMS) and Student Information Systems (SIS)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="google-classroom">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>Google Classroom</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("googleClassroomDesc") || "Integrate with Google Classroom to sync courses, assignments, and student data."}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("syncCourses") || "Sync courses and class rosters"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("assignmentImport") || "Import assignments"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("gradeExport") || "Export grades"}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          form.reset({
                            integration_type: "google_classroom",
                            api_key: "",
                            api_secret: "",
                            base_url: "",
                            enabled: true,
                          });
                        }}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {t("configureThisIntegration") || "Configure this integration"}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="moodle">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      <span>Moodle</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("moodleDesc") || "Connect with your Moodle instance for seamless data integration."}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("syncUsers") || "Sync users and enrollments"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("courseSync") || "Course content synchronization"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("ssoSupport") || "Single sign-on (SSO) support"}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          form.reset({
                            integration_type: "moodle",
                            api_key: "",
                            api_secret: "",
                            base_url: "",
                            enabled: true,
                          });
                        }}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {t("configureThisIntegration") || "Configure this integration"}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="canvas">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      <span>Canvas LMS</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("canvasDesc") || "Integrate with Canvas LMS for complete learning management integration."}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("accountProvisioning") || "Account provisioning"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("assignmentIntegration") || "Assignment integration"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("gradesSync") || "Grades synchronization"}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          form.reset({
                            integration_type: "canvas",
                            api_key: "",
                            api_secret: "",
                            base_url: "",
                            enabled: true,
                          });
                        }}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {t("configureThisIntegration") || "Configure this integration"}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="custom">
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      <span>{t("customIntegration") || "Custom Integration"}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("customIntegrationDesc") || "Set up a custom integration with your school's proprietary systems."}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("apiAccess") || "API-based data exchange"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("customFields") || "Custom field mapping"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          <span>{t("webhookSupport") || "Webhook support"}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          form.reset({
                            integration_type: "custom",
                            api_key: "",
                            api_secret: "",
                            base_url: "",
                            enabled: true,
                          });
                        }}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {t("configureThisIntegration") || "Configure this integration"}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-200 rounded-md text-sm">
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{t("documentationAvailable") || "Documentation Available"}</p>
                    <p className="mt-1">{t("readIntegrationDocs") || "For detailed integration steps, please refer to our comprehensive documentation."}</p>
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-amber-700 dark:text-amber-200 hover:underline font-medium"
                    >
                      {t("viewDocumentation") || "View Integration Documentation"}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("configureIntegration") || "Configure Integration"}</CardTitle>
              <CardDescription>
                {t("enterIntegrationDetails") || "Enter the details for your selected integration"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="integration_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("integrationType") || "Integration Type"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectIntegrationType") || "Select integration type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {integrationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center">
                                  <type.icon className="w-4 h-4 mr-2" />
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("integrationTypeDesc") || "Select the system you want to integrate with"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('integration_type') && (
                    <>
                      <FormField
                        control={form.control}
                        name="base_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("baseUrl") || "Base URL"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/api"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("baseUrlDesc") || "The base URL of your integration endpoint (if applicable)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="api_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("apiKey") || "API Key"}</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  placeholder="sk_live_xxxxxxxxxxxx"
                                  {...field}
                                  type="password"
                                  className="font-mono"
                                />
                                <Lock className="w-4 h-4 text-muted-foreground -ml-8" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              {t("apiKeyDesc") || "Your API key or client ID for authentication"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="api_secret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("apiSecret") || "API Secret"}</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Input
                                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                  {...field}
                                  type="password"
                                  className="font-mono"
                                />
                                <Lock className="w-4 h-4 text-muted-foreground -ml-8" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              {t("apiSecretDesc") || "Your API secret or client secret for authentication"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("saving") || "Saving..."}
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4 mr-2" />
                              {t("saveIntegrationSettings") || "Save Integration Settings"}
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </Form>

              {!form.watch('integration_type') && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t("selectIntegrationPrompt") || "Select an integration type from the list to configure"}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {t("optionalStep") || "This step is optional. You can come back and configure integrations later."}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          {t("skipAndContinue") || "Skip & Continue"}
        </Button>
      </div>
    </div>
  );
}
