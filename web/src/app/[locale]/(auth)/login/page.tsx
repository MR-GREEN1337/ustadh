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
import { Loader2, BookOpen, Users, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loading, error, setError, user } = useAuth();
  const [userType, setUserType] = useState<string>("student");
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

  // Form validation schema
  const formSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("required")),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const success = await login(values.email, values.password, userType);
    if (success) {
      // If login is successful, redirect to returnUrl or dashboard
      const redirectTo = returnUrl || `/${locale}/dashboard`;
      router.push(redirectTo);
    } else {
      toast.error(t("loginFailed"));
    }
  };

  // Add styles to completely override any border
  return (
    <div className="border-0">
      <Card className={`w-full max-w-md border-0 shadow-none bg-transparent dark:bg-transparent ${userType === "parent" ? "parent-theme" : "student-theme"}`} style={{ border: "none" }}>
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
            onValueChange={(value) => setUserType(value)}
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
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg mb-4 text-sm text-blue-700 dark:text-blue-300 flex items-start">
                <BookOpen className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  {t("studentLoginInfo") || "Login to access your personalized learning dashboard and study materials."}
                </span>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{t("password")}</FormLabel>
                          <Link
                            href={`/${locale}/forgot-password`}
                            className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
                    className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white"
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

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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

        <CardFooter className={`flex justify-center pt-4 mb-4`}>
          <div className="text-sm text-center">
            {t("dontHaveAccount") || "Don't have an account?"}{" "}
            <Link
              href={`/${locale}/register`}
              className={`font-medium ${
                userType === "parent"
                  ? "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                  : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              }`}
            >
              {t("register")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
