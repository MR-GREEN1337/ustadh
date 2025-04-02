"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "@/i18n/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, loading, error, setError } = useAuth();
  const [userType, setUserType] = useState<string>("student");
  const { locale } = useParams();

  // Form validation schema
  const studentFormSchema = z
    .object({
      email: z.string().email(t("invalidEmail")),
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(8, t("passwordLength")),
      confirmPassword: z.string().min(8, t("passwordLength")),
      full_name: z.string().min(1, t("required")),
      grade_level: z.string().min(1, t("required")),
      school_type: z.string().min(1, t("required")),
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
      grade_level: "",
      school_type: "",
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
    },
  });

  // Student form submission handler
  const onStudentSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    const { confirmPassword, ...userData } = values;
    const success = await register({
      ...userData,
      user_type: "student",
    });

    if (!success) {
      toast.error(t("registrationFailed"));
    }
  };

  // Parent form submission handler
  const onParentSubmit = async (values: z.infer<typeof parentFormSchema>) => {
    const { confirmPassword, ...userData } = values;
    const success = await register({
      ...userData,
      user_type: "parent",
    });

    if (!success) {
      toast.error(t("registrationFailed"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent dark:bg-transparent">
      <Card className="w-full max-w-md shadow-lg">
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">{t("student")}</TabsTrigger>
              <TabsTrigger value="parent">{t("parent")}</TabsTrigger>
            </TabsList>

            {error && (
              <div className="p-3 mt-2 rounded-md bg-red-50 text-red-500 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}

            <TabsContent value="student">
              <Form {...studentForm}>
                <form
                  onSubmit={studentForm.handleSubmit(onStudentSubmit)}
                  className="space-y-4 mt-4"
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={studentForm.control}
                      name="school_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("schoolType")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("schoolType")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="primary">
                                {t("primary")}
                              </SelectItem>
                              <SelectItem value="middle">
                                {t("middle")}
                              </SelectItem>
                              <SelectItem value="high_school">
                                {t("highSchool")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={studentForm.control}
                      name="grade_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("gradeLevel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Grade 9"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                  <Button type="submit" className="w-full" disabled={loading}>
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
              <Form {...parentForm}>
                <form
                  onSubmit={parentForm.handleSubmit(onParentSubmit)}
                  className="space-y-4 mt-4"
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
                  <Button type="submit" className="w-full" disabled={loading}>
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
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={`/${locale}/login`}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
            >
              {t("login")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
