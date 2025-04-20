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
    <div className="w-full">
      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
          <TabsTrigger value="regular" className="flex items-center gap-2 text-white text-opacity-90 data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md data-[state=active]:text-white rounded-lg py-3">
            <Users className="h-4 w-4" />
            {t("regularLogin") || "Regular Login"}
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-2 text-white text-opacity-90 data-[state=active]:bg-white/10 data-[state=active]:backdrop-blur-md data-[state=active]:text-white rounded-lg py-3">
            <School className="h-4 w-4" />
            {t("schoolLogin") || "School Login"}
          </TabsTrigger>
        </TabsList>

        {/* Regular User Login */}
        <TabsContent value="regular">
          <Card className="w-full border-0 shadow-none bg-transparent text-white">
            <CardHeader className="space-y-1 pt-2">
              <CardTitle className="text-2xl font-bold text-center font-serif">
                {t("login")}
              </CardTitle>
              <CardDescription className="text-center text-white/80 font-light">
                {t("loginAs")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs
                defaultValue="student"
                onValueChange={(value) => setAuthType(value)}
                className="w-full mt-2"
              >
                <TabsList className="grid w-full grid-cols-2 mb-5 bg-white/5 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
                  <TabsTrigger value="student" className="flex items-center gap-2 text-white data-[state=active]:bg-emerald-600/70 data-[state=active]:backdrop-blur-md data-[state=active]:text-white py-2.5">
                    <BookOpen className="h-4 w-4" />
                    {t("student")}
                  </TabsTrigger>
                  <TabsTrigger value="parent" className="flex items-center gap-2 text-white data-[state=active]:bg-amber-600/70 data-[state=active]:backdrop-blur-md data-[state=active]:text-white py-2.5">
                    <Users className="h-4 w-4" />
                    {t("parent")}
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm flex items-center mb-4">
                    <div className="w-1 h-full bg-red-400 mr-2 rounded-full"></div>
                    {error}
                  </div>
                )}

                <TabsContent value="student">
                  <div className="bg-emerald-500/10 backdrop-blur-sm p-3 rounded-xl mb-4 text-sm text-white flex items-start border border-emerald-400/10">
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
                            <FormLabel className="text-white">{t("email")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@example.com"
                                {...field}
                                autoComplete="email"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regularForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-white">{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-emerald-300 hover:text-emerald-200"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 mt-2 bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-500/20 backdrop-blur-md rounded-lg"
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
                  <div className="bg-amber-500/10 backdrop-blur-sm p-3 rounded-xl mb-4 text-sm text-white flex items-start border border-amber-400/10">
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
                            <FormLabel className="text-white">{t("email")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@example.com"
                                {...field}
                                autoComplete="email"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={regularForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-white">{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-amber-300 hover:text-amber-200"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 mt-2 bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-500/20 backdrop-blur-md rounded-lg"
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
              <div className="text-sm text-center text-white/80">
                {t("dontHaveAccount") || "Don't have an account?"}{" "}
                <Link
                  href={`/${locale}/register`}
                  className={`font-medium ${
                    authType === "parent"
                      ? "text-amber-300 hover:text-amber-200"
                      : "text-emerald-300 hover:text-emerald-200"
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
          <Card className="w-full border-0 shadow-none bg-transparent text-white">
            <CardHeader className="space-y-1 pt-2">
              <CardTitle className="text-2xl font-bold text-center font-serif">
                {t("schoolLogin") || "School Login"}
              </CardTitle>
              <CardDescription className="text-center text-white/80 font-light">
                {t("schoolLoginDescription") || "Login with your school credentials"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs
                defaultValue="school_student"
                onValueChange={(value) => setAuthType(value)}
                className="w-full mt-2"
              >
                <TabsList className="grid w-full grid-cols-3 mb-5 bg-white/5 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
                  <TabsTrigger value="school_student" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600/70 data-[state=active]:backdrop-blur-md data-[state=active]:text-white py-2.5">
                    <BookOpen className="h-4 w-4" />
                    {t("student") || "Student"}
                  </TabsTrigger>
                  <TabsTrigger value="school_professor" className="flex items-center gap-2 text-white data-[state=active]:bg-purple-600/70 data-[state=active]:backdrop-blur-md data-[state=active]:text-white py-2.5">
                    <GraduationCap className="h-4 w-4" />
                    {t("professor") || "Professor"}
                  </TabsTrigger>
                  <TabsTrigger value="school_admin" className="flex items-center gap-2 text-white data-[state=active]:bg-indigo-600/70 data-[state=active]:backdrop-blur-md data-[state=active]:text-white py-2.5">
                    <Building className="h-4 w-4" />
                    {t("admin") || "Admin"}
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <div className="p-3 rounded-md bg-red-500/20 text-red-100 text-sm flex items-center mb-4">
                    <div className="w-1 h-full bg-red-400 mr-2 rounded-full"></div>
                    {error}
                  </div>
                )}

                <TabsContent value="school_student">
                  <div className="bg-blue-500/10 backdrop-blur-sm p-3 rounded-xl mb-4 text-sm text-white flex items-start border border-blue-400/10">
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
                            <FormLabel className="text-white">{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SCHOOL123"
                                {...field}
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">{t("studentId") || "Student ID"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123456"
                                {...field}
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-white">{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-blue-300 hover:text-blue-200"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 mt-2 bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/20 backdrop-blur-md rounded-lg"
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
                  <div className="bg-purple-500/10 backdrop-blur-sm p-3 rounded-xl mb-4 text-sm text-white flex items-start border border-purple-400/10">
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
                            <FormLabel className="text-white">{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SCHOOL123"
                                {...field}
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">{t("professorId") || "Professor ID"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="PROF123"
                                {...field}
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-white">{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-purple-300 hover:text-purple-200"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 mt-2 bg-purple-600/80 hover:bg-purple-600 text-white border border-purple-500/20 backdrop-blur-md rounded-lg"
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
                  <div className="bg-indigo-500/10 backdrop-blur-sm p-3 rounded-xl mb-4 text-sm text-white flex items-start border border-indigo-400/10">
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
                            <FormLabel className="text-white">{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="SCHOOL123"
                                {...field}
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">{t("adminId") || "Admin ID"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ADMIN123"
                                {...field}
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={schoolForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-white">{t("password")}</FormLabel>
                              <Link
                                href={`/${locale}/forgot-password`}
                                className="text-xs text-indigo-300 hover:text-indigo-200"
                              >
                                {t("forgotPassword")}
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                {...field}
                                autoComplete="current-password"
                                className="h-11 bg-black/10 border-white/10 text-white placeholder:text-white/40 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 mt-2 bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-500/20 backdrop-blur-md rounded-lg"
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
              <div className="text-sm text-center text-white/80">
                {t("schoolLoginFooter") || "Contact your school administrator if you're having trouble logging in."}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
