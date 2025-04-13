"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, Users, LogIn, School, GraduationCap, Building } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loginSchool, loading, error, setError, user } = useAuth();
  const [authType, setAuthType] = useState<string>("student");
  const { locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === "ar";

  // Get returnUrl from query parameters
  const returnUrl = searchParams.get('returnUrl');

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const redirectTo = returnUrl || `/${locale}/dashboard`;
      router.push(redirectTo);
    }
  }, [user, router, locale, returnUrl]);

  // Regular user login form validation schema
  const regularFormSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("required")),
  });

  // School login form validation schema
  const schoolFormSchema = z.object({
    schoolCode: z.string().min(1, t("required")),
    identifier: z.string().min(1, t("required")),
    password: z.string().min(1, t("required")),
  });

  // Initialize regular user form
  const regularForm = useForm<z.infer<typeof regularFormSchema>>({
    resolver: zodResolver(regularFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Initialize school form
  const schoolForm = useForm<z.infer<typeof schoolFormSchema>>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      schoolCode: "",
      identifier: "",
      password: "",
    },
  });

  // Form submission handler for regular users
  const onRegularSubmit = async (values: z.infer<typeof regularFormSchema>) => {
    // Clear any previous errors
    setError(null);

    const success = await login(values.email, values.password, authType);
    if (success) {
      // If login is successful, redirect to returnUrl or dashboard
      const redirectTo = returnUrl || `/${locale}/dashboard`;
      router.push(redirectTo);
    } else {
      toast.error(t("loginFailed"));
    }
  };

  // Form submission handler for school users
  const onSchoolSubmit = async (values: z.infer<typeof schoolFormSchema>) => {
    // Clear any previous errors
    setError(null);

    // Determine the user type based on the selected tab
    let userType = "school_student";
    if (authType === "school_professor") {
      userType = "school_professor";
    } else if (authType === "school_admin") {
      userType = "school_admin";
    }

    const success = await loginSchool(
      values.schoolCode,
      values.identifier,
      values.password,
      userType
    );

    if (success) {
      // If login is successful, redirect to returnUrl or dashboard
      const redirectTo = returnUrl || `/${locale}/dashboard`;
      router.push(redirectTo);
    } else {
      toast.error(t("schoolLoginFailed") || "School login failed");
    }
  };

  // Helper to get color scheme based on user type
  const getColorScheme = () => {
    switch (authType) {
      case "parent":
        return "amber";
      case "school_student":
        return "blue";
      case "school_professor":
        return "purple";
      case "school_admin":
        return "indigo";
      default:
        return "emerald"; // student
    }
  };

  const color = getColorScheme();

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="regular" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("regularLogin") || "Regular Login"}
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            {t("schoolLogin") || "School Login"}
          </TabsTrigger>
        </TabsList>

        {/* Regular User Login */}
        <TabsContent value="regular">
          <Card className={`w-full border shadow-sm bg-card ${authType === "parent" ? "parent-theme" : "student-theme"}`}>
            <CardHeader className="space-y-1 pt-6">
              <CardTitle className="text-2xl font-bold text-center">
                {t("login")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("loginAs")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs
                defaultValue="student"
                onValueChange={(value) => setAuthType(value)}
                className="w-full mt-3"
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
                  <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm dark:bg-red-900/20 dark:text-red-400 flex items-center mb-4">
                    <div className="w-1 h-full bg-red-500 mr-2 rounded-full"></div>
                    {error}
                  </div>
                )}

                <TabsContent value="student">
                  <div className={`bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg mb-4 text-sm text-emerald-700 dark:text-emerald-300 flex items-start`}>
                    <BookOpen className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("studentLoginInfo") || "Login to access your personalized learning dashboard and study materials."}
                    </span>
                  </div>

                  <Form {...regularForm}>
                    <form onSubmit={regularForm.handleSubmit(onRegularSubmit)} className="space-y-4">
                      <FormField
                        control={regularForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("email")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@example.com"
                                {...field}
                                autoComplete="email"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regularForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className={`text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300`}
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className={`w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white`}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t("loading")}
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            {t("login")}
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="parent">
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg mb-4 text-sm text-amber-700 dark:text-amber-300 flex items-start">
                    <Users className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("parentLoginInfo") || "Login to monitor your children's progress and communicate with teachers."}
                    </span>
                  </div>

                  <Form {...regularForm}>
                    <form onSubmit={regularForm.handleSubmit(onRegularSubmit)} className="space-y-4">
                      <FormField
                        control={regularForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("email")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@example.com"
                                {...field}
                                autoComplete="email"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regularForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-10 mt-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 dark:text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t("loading")}
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            {t("login")}
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-center pt-4 mb-4">
              <div className="text-sm text-center">
                {t("dontHaveAccount") || "Don't have an account?"}{" "}
                <Link
                  href={`/${locale}/register`}
                  className={`font-medium ${
                    authType === "parent"
                      ? "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  }`}
                >
                  {t("register")}
                </Link>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* School Login */}
        <TabsContent value="school">
          <Card className="w-full border shadow-sm bg-card">
            <CardHeader className="space-y-1 pt-6">
              <CardTitle className="text-2xl font-bold text-center">
                {t("schoolLogin") || "School Login"}
              </CardTitle>
              <CardDescription className="text-center">
                {t("schoolLoginDescription") || "Login with your school credentials"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs
                defaultValue="school_student"
                onValueChange={(value) => setAuthType(value)}
                className="w-full mt-3"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="school_student" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t("student") || "Student"}
                  </TabsTrigger>
                  <TabsTrigger value="school_professor" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    {t("professor") || "Professor"}
                  </TabsTrigger>
                  <TabsTrigger value="school_admin" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {t("admin") || "Admin"}
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm dark:bg-red-900/20 dark:text-red-400 flex items-center mb-4">
                    <div className="w-1 h-full bg-red-500 mr-2 rounded-full"></div>
                    {error}
                  </div>
                )}

                <TabsContent value="school_student">
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg mb-4 text-sm text-blue-700 dark:text-blue-300 flex items-start">
                    <School className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("schoolStudentLoginInfo") || "Login with your school-provided student ID and password."}
                    </span>
                  </div>

                  <Form {...schoolForm}>
                    <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-4">
                      <FormField
                        control={schoolForm.control}
                        name="schoolCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SCHOOL123"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("studentId") || "Student ID"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123456"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-10 mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t("loading")}
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            {t("login")}
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="school_professor">
                  <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-lg mb-4 text-sm text-purple-700 dark:text-purple-300 flex items-start">
                    <GraduationCap className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("schoolProfessorLoginInfo") || "Login with your school-provided professor credentials."}
                    </span>
                  </div>

                  <Form {...schoolForm}>
                    <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-4">
                      <FormField
                        control={schoolForm.control}
                        name="schoolCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SCHOOL123"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("professorId") || "Professor ID"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="PROF123"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-10 mt-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t("loading")}
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            {t("login")}
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="school_admin">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg mb-4 text-sm text-indigo-700 dark:text-indigo-300 flex items-start">
                    <Building className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("schoolAdminLoginInfo") || "Login with your school administrator credentials."}
                    </span>
                  </div>

                  <Form {...schoolForm}>
                    <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-4">
                      <FormField
                        control={schoolForm.control}
                        name="schoolCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SCHOOL123"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("adminId") || "Admin ID"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ADMIN123"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-10 mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t("loading")}
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            {t("login")}
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-center pt-4 mb-4">
              <div className="text-sm text-center text-gray-500">
                {t("schoolLoginFooter") || "Contact your school administrator if you're having trouble logging in."}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
