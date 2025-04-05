"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, Users, Rocket } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, loading, error, setError } = useAuth();
  const [userType, setUserType] = useState<string>("student");
  const { locale } = useParams();
  const router = useRouter();

  // Simplified form validation schema
  const studentFormSchema = z
    .object({
      email: z.string().email(t("invalidEmail")),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(8, t("passwordLength")),
      confirmPassword: z.string().min(8, t("passwordLength")),
      full_name: z.string().min(1, t("required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });

  const parentFormSchema = z
    .object({
      email: z.string().email(t("invalidEmail")),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(8, t("passwordLength")),
      confirmPassword: z.string().min(8, t("passwordLength")),
      full_name: z.string().min(1, t("required")),
      children_count: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });

  // Initialize student form
  const studentForm = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      full_name: "",
    },
  });

  // Initialize parent form
  const parentForm = useForm<z.infer<typeof parentFormSchema>>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      full_name: "",
      children_count: "",
    },
  });

  // Student form submission handler
  const onStudentSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    const { confirmPassword, ...userData } = values;

    const success = await register({
      ...userData,
      user_type: "student",
      // Set has_onboarded to false - will redirect to onboarding
      has_onboarded: false,
    });

    if (success) {
      // Redirect to onboarding instead of dashboard
      router.push(`/${locale}/onboarding`);
    } else {
      toast.error(t("registrationFailed"));
    }
  };

  // Parent form submission handler
  const onParentSubmit = async (values: z.infer<typeof parentFormSchema>) => {
    const { confirmPassword, children_count, ...userData } = values;

    const success = await register({
      ...userData,
      user_type: "parent",
      has_onboarded: false,
    });

    if (success) {
      // Parents also go through an onboarding
      router.push(`/${locale}/onboarding`);
    } else {
      toast.error(t("registrationFailed"));
    }
  };

  const isRTL = locale === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-emerald-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("register")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("createAccount")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            defaultValue="student"
            onValueChange={(value) => setUserType(value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("student")}
              </TabsTrigger>
              <TabsTrigger value="parent" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("parent")}
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="p-3 mt-2 rounded-md bg-red-50 text-red-500 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}

            <TabsContent value="student">
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-700 flex items-start">
                <BookOpen className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  {t("studentAccountInfo") || "Register as a student to access learning resources and track your progress."}
                </span>
              </div>

              <Form {...studentForm}>
                <form
                  onSubmit={studentForm.handleSubmit(onStudentSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={studentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("username")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="username"
                            {...field}
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fullName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mohamed Ben Ali"
                            {...field}
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("password")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Information about onboarding process */}
                  <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-700 flex items-start">
                    <Rocket className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("onboardingNote") || "After registration, you'll personalize your learning experience by selecting subjects, education level, and academic track."}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      t("register")
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="parent">
              <div className="bg-amber-50 p-3 rounded-lg mb-4 text-sm text-amber-700 flex items-start">
                <Users className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  {t("parentAccountInfo") || "Create a parent account to monitor your children's progress and receive updates."}
                </span>
              </div>

              <Form {...parentForm}>
                <form
                  onSubmit={parentForm.handleSubmit(onParentSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={parentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("email")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("username")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="username"
                            {...field}
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fullName")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mohamed Ben Ali"
                            {...field}
                            autoComplete="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="children_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("childrenCount") || "Number of Children"}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("optionalField") || "Optional field"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("password")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parentForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("confirmPassword")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Information about onboarding process */}
                  <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-700 flex items-start">
                    <Rocket className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("parentOnboardingNote") || "After registration, you'll complete an onboarding process to customize your experience and set up your children's profiles."}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t("loading")}
                      </>
                    ) : (
                      t("register")
                    )}
                  </Button>

                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs text-slate-700">
                    <p className="font-medium mb-1">{t("parentFeatures") || "Parent account features"}:</p>
                    <ul className={`space-y-1 ${isRTL ? 'pr-4' : 'pl-4'}`} style={{ listStyleType: 'disc' }}>
                      <li>{t("trackProgress") || "Track children's academic progress"}</li>
                      <li>{t("receiveReports") || "Receive regular performance reports"}</li>
                      <li>{t("communicateTeachers") || "Communicate with teachers"}</li>
                      <li>{t("manageAccounts") || "Manage children's accounts"}</li>
                    </ul>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <div className="text-sm text-center">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={`/${locale}/login`}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {t("login")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
