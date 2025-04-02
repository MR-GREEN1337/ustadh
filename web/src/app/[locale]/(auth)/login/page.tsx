"use client";

import { useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loading, error, setError } = useAuth();
  const [userType, setUserType] = useState<string>("student");
  const { locale } = useParams();

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
    if (!success) {
      toast.error(t("loginFailed"));
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-900 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
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
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">{t("student")}</TabsTrigger>
              <TabsTrigger value="parent">{t("parent")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm dark:bg-red-900/20">
              {error}
            </div>
          )}

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
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        autoComplete="current-password"
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
                  t("login")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            <Link
              href={`/${locale}/forgot-password`}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="text-sm text-center">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={`/${locale}/register`}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
            >
              {t("register")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
