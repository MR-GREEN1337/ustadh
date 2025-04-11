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
import {
  Loader2,
  BookOpen,
  Users,
  Rocket,
  School,
  GraduationCap,
  Building,
  Info
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/config";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, error, setError } = useAuth();
  const [authType, setAuthType] = useState<string>("regular");
  const [userType, setUserType] = useState<string>("student");
  const [loading, setLoading] = useState<boolean>(false);
  const { locale } = useParams();
  const router = useRouter();
  const isRTL = locale === "ar";

  // Regular user registration schemas
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

  // School registration schema
  const schoolFormSchema = z.object({
    school_name: z.string().min(1, t("required")),
    school_code: z.string().min(3, "School code must be at least 3 characters"),
    school_type: z.string().min(1, t("required")),
    region: z.string().min(1, t("required")),
    admin_email: z.string().email(t("invalidEmail")),
    admin_name: z.string().min(1, t("required")),
    admin_password: z.string().min(8, t("passwordLength")),
    admin_confirmPassword: z.string().min(8, t("passwordLength")),
    admin_phone: z.string().optional(),
  })
    .refine((data) => data.admin_password === data.admin_confirmPassword, {
      message: t("passwordMismatch"),
      path: ["admin_confirmPassword"],
    });

  // Initialize forms
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

  const schoolForm = useForm<z.infer<typeof schoolFormSchema>>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      school_name: "",
      school_code: "",
      school_type: "public",
      region: "",
      admin_email: "",
      admin_name: "",
      admin_password: "",
      admin_confirmPassword: "",
      admin_phone: "",
    },
  });

  // Form submission handlers
  const onStudentSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    setLoading(true);

    const { confirmPassword, ...userData } = values;

    try {
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
    } catch (error) {
      console.error("Error registering student:", error);
      toast.error(t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onParentSubmit = async (values: z.infer<typeof parentFormSchema>) => {
    setLoading(true);

    const { confirmPassword, children_count, ...userData } = values;

    try {
      const success = await register({
        ...userData,
        user_type: "parent",
        has_onboarded: false,
      });

      if (success) {
        // Parents also go through an onboarding
        router.push(`/${locale}/dashboard`);
      } else {
        toast.error(t("registrationFailed"));
      }
    } catch (error) {
      console.error("Error registering parent:", error);
      toast.error(t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onSchoolSubmit = async (values: z.infer<typeof schoolFormSchema>) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Starting school registration process");

      // Create school data object
      const schoolData = {
        name: values.school_name,
        code: values.school_code,
        school_type: values.school_type,
        region: values.region,
        contact_email: values.admin_email,
        contact_phone: values.admin_phone || "",
        address: "",  // Required field
        city: "",     // Required field
        education_levels: ["lycee"], // Default to high school
        website: "",  // Optional field
      };

      // Step 1: Register the school first
      console.log("Step 1: Registering school");
      const schoolResponse = await fetch(`${API_BASE_URL}/api/v1/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData)
      });

      if (!schoolResponse.ok) {
        const errorData = await schoolResponse.json();
        throw new Error(errorData.detail || "Failed to register school");
      }

      const school = await schoolResponse.json();
      console.log("School registered successfully with ID:", school.id);

      // Step 2: Register the admin user
      console.log("Step 2: Registering administrator account");
      const adminResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.admin_email,
          username: values.school_code + "_admin",
          password: values.admin_password,
          full_name: values.admin_name,
          user_type: "school_admin",
          has_onboarded: true,
        }),
        credentials: "include",
      });

      if (!adminResponse.ok) {
        const registerError = await adminResponse.json();
        throw new Error(registerError.detail || "Failed to register administrator account");
      }

      const adminData = await adminResponse.json();
      console.log("Admin registered successfully with ID:", adminData.id);

      // Step 3: Link the admin to the school
      console.log("Step 3: Linking admin to school");
      const linkResponse = await fetch(`${API_BASE_URL}/api/v1/schools/${school.id}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminData.id })
      });

      if (!linkResponse.ok) {
        const linkError = await linkResponse.json();
        console.error("Link response error:", await linkResponse.text());
        throw new Error(linkError.detail || "Failed to link administrator to school");
      }

      const linkResult = await linkResponse.json();
      console.log("Admin linked to school successfully:", linkResult);

      // Step 4: Log in with the admin credentials
      console.log("Step 4: Logging in with administrator credentials");
      const loginSuccess = await login(values.admin_email, values.admin_password, "school_admin");

      if (loginSuccess) {
        toast.success(t("schoolRegistrationSuccess") || "School registered successfully");
        router.push(`/${locale}/onboarding/school`);
      } else {
        // Even if login fails, registration succeeded
        toast.success(t("schoolRegistrationSuccess") || "School registered successfully");
        toast.info(t("pleaseLogin") || "Please log in with your administrator credentials");
        router.push(`/${locale}/login`);
      }
    } catch (error: any) {
      console.error("School registration error:", error);
      setError(error.message || "An unexpected error occurred during school registration");
      toast.error(error.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to login after registration
  const login = async (email: string, password: string, userType: string) => {
    try {
      console.log("Logging in with administrator credentials");
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, user_type: userType }),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Login failed:", await response.text());
        return false;
      }

      const data = await response.json();
      console.log("Login successful, saving tokens");

      // Store tokens and user data
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      return true;
    } catch (error) {
      console.error("Login error after registration:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full shadow-none bg-transparent dark:bg-transparent">
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
            defaultValue="regular"
            onValueChange={(value) => setAuthType(value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="regular" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("individualRegistration") || "Individual Registration"}
              </TabsTrigger>
              <TabsTrigger value="school" className="flex items-center gap-2">
                <School className="h-4 w-4" />
                {t("schoolRegistration") || "School Registration"}
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="p-3 mt-2 rounded-md bg-red-50 text-red-500 text-sm dark:bg-red-900/20">
                {error}
              </div>
            )}

            {/* Regular Registration */}
            <TabsContent value="regular">
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
            </TabsContent>

            {/* School Registration */}
            <TabsContent value="school">
              <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-sm text-indigo-700 flex items-start">
                <School className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-base mb-1">{t("schoolRegistrationInfo") || "School Registration"}</h3>
                  <p>{t("schoolRegistrationDescription") || "Register your school to gain access to our comprehensive education platform. This registration is for school administrators only."}</p>
                  <ul className="mt-2 space-y-1 pl-4" style={{ listStyleType: 'disc' }}>
                    <li>{t("schoolFeature1") || "Manage all your students and teachers"}</li>
                    <li>{t("schoolFeature2") || "Create custom classes and courses"}</li>
                    <li>{t("schoolFeature3") || "Track academic performance and analytics"}</li>
                    <li>{t("schoolFeature4") || "Integrate with your existing school systems"}</li>
                  </ul>
                </div>
              </div>

              <Form {...schoolForm}>
                <form
                  onSubmit={schoolForm.handleSubmit(onSchoolSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">{t("schoolInformation") || "School Information"}</h3>

                      <FormField
                        control={schoolForm.control}
                        name="school_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("schoolName") || "School Name"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Escola Ibn Sina"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="school_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("schoolCode") || "School Code"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="IBNSINA2024"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("schoolCodeDescription") || "This unique code will be used for login by your students and staff"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="school_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("schoolType") || "School Type"}</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectSchoolType") || "Select school type"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="public">{t("public") || "Public"}</SelectItem>
                                <SelectItem value="private">{t("private") || "Private"}</SelectItem>
                                <SelectItem value="mission">{t("mission") || "Mission"}</SelectItem>
                                <SelectItem value="international">{t("international") || "International"}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("region") || "Region"}</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("selectRegion") || "Select region"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="casablanca-settat">{t("casablancaSettat") || "Casablanca-Settat"}</SelectItem>
                                <SelectItem value="rabat-sale-kenitra">{t("rabatSaleKenitra") || "Rabat-Salé-Kénitra"}</SelectItem>
                                <SelectItem value="marrakech-safi">{t("marrakechSafi") || "Marrakech-Safi"}</SelectItem>
                                <SelectItem value="fes-meknes">{t("fesMeknes") || "Fès-Meknès"}</SelectItem>
                                <SelectItem value="tanger-tetouan-alhoceima">{t("tangerTetouan") || "Tanger-Tétouan-Al Hoceïma"}</SelectItem>
                                <SelectItem value="oriental">{t("oriental") || "Oriental"}</SelectItem>
                                <SelectItem value="souss-massa">{t("soussMassa") || "Souss-Massa"}</SelectItem>
                                <SelectItem value="beni-mellal-khenifra">{t("beniMellal") || "Béni Mellal-Khénifra"}</SelectItem>
                                <SelectItem value="draa-tafilalet">{t("draaTafilalet") || "Drâa-Tafilalet"}</SelectItem>
                                <SelectItem value="guelmim-oued-noun">{t("guelmimOuedNoun") || "Guelmim-Oued Noun"}</SelectItem>
                                <SelectItem value="laayoune-sakia-el-hamra">{t("laayouneSakia") || "Laâyoune-Sakia El Hamra"}</SelectItem>
                                <SelectItem value="dakhla-oued-ed-dahab">{t("dakhlaOued") || "Dakhla-Oued Ed-Dahab"}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2">{t("administratorInformation") || "Administrator Information"}</h3>

                      <FormField
                        control={schoolForm.control}
                        name="admin_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("adminEmail") || "Administrator Email"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="admin@ibnsina.edu"
                                {...field}
                                type="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="admin_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("adminName") || "Administrator Name"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Mohammed El Fassi"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={schoolForm.control}
                        name="admin_phone"
                        render={({ field }) => (
                          <FormItem>
<FormLabel>{t("adminPhone") || "Administrator Phone"}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+212612345678"
                                {...field}
                                type="tel"
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
                        control={schoolForm.control}
                        name="admin_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("adminPassword") || "Administrator Password"}</FormLabel>
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
                        control={schoolForm.control}
                        name="admin_confirmPassword"
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
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700 flex items-start mt-4">
                    <Info className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>
                      {t("schoolVerificationNote") || "After registration, we'll verify your school information before your account is fully activated. This typically takes 1-2 business days."}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t("loading")}
                      </>
                    ) : (
                      t("registerSchool") || "Register School"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-sm text-slate-700">
                    <h4 className="font-medium mb-2">{t("registeringASchool") || "What to expect when registering a school"}:</h4>
                    <ul className="space-y-1 pl-4" style={{ listStyleType: 'disc' }}>
                      <li>{t("schoolExpectation1") || "School administrators get a full dashboard to manage users"}</li>
                      <li>{t("schoolExpectation2") || "You can add students and teachers in bulk or one by one"}</li>
                      <li>{t("schoolExpectation3") || "Each user gets their own personalized learning experience"}</li>
                      <li>{t("schoolExpectation4") || "Access detailed analytics and performance reports"}</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-sm text-slate-700">
                    <h4 className="font-medium mb-2">{t("schoolSupportHeading") || "Support for schools"}:</h4>
                    <p className="mb-2">{t("schoolSupportText") || "Need help getting started? We offer comprehensive onboarding support for schools:"}</p>
                    <ul className="space-y-1 pl-4" style={{ listStyleType: 'disc' }}>
                      <li>{t("schoolSupport1") || "Dedicated support representative"}</li>
                      <li>{t("schoolSupport2") || "Training sessions for administrators and teachers"}</li>
                      <li>{t("schoolSupport3") || "Implementation guides and resources"}</li>
                      <li>{t("schoolSupport4") || "Data import assistance"}</li>
                    </ul>
                  </div>
                </div>
              </div>
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
