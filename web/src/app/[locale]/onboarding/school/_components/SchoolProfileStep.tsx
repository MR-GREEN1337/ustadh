"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Info } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/config";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(2, { message: "School name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  region: z.string().min(1, { message: "Region is required" }),
  contact_email: z.string().email({ message: "Invalid email address" }),
  contact_phone: z.string().optional(),
  website: z.string().url({ message: "Invalid website URL" }).optional().or(z.literal("")),
  education_levels: z.array(z.string()).min(1, { message: "Select at least one education level" }),
  color_scheme: z.string().optional(),
});

// Available education levels
const educationLevels = [
  { value: "primary", label: "Primary School" },
  { value: "college", label: "College (Middle School)" },
  { value: "lycee", label: "Lycée (High School)" },
  { value: "university", label: "University" },
];

// Available regions in Morocco
const moroccoRegions = [
  { value: "casablanca_settat", label: "Casablanca-Settat" },
  { value: "rabat_sale_kenitra", label: "Rabat-Salé-Kénitra" },
  { value: "marrakech_safi", label: "Marrakech-Safi" },
  { value: "fes_meknes", label: "Fès-Meknès" },
  { value: "tanger_tetouan_alhoceima", label: "Tanger-Tétouan-Al Hoceïma" },
  { value: "oriental", label: "Oriental" },
  { value: "souss_massa", label: "Souss-Massa" },
  { value: "draa_tafilalet", label: "Drâa-Tafilalet" },
  { value: "beni_mellal_khenifra", label: "Béni Mellal-Khénifra" },
  { value: "guelmim_oued_noun", label: "Guelmim-Oued Noun" },
  { value: "laayoune_sakia_el_hamra", label: "Laâyoune-Sakia El Hamra" },
  { value: "dakhla_oued_ed_dahab", label: "Dakhla-Oued Ed-Dahab" },
];

// Color scheme options
const colorSchemes = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "purple", label: "Purple" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "teal", label: "Teal" },
  { value: "indigo", label: "Indigo" },
];

interface SchoolProfileStepProps {
  onCompleted: () => void;
  status: any;
}

export default function SchoolProfileStep({ onCompleted, status }: SchoolProfileStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataFromRegistration, setDataFromRegistration] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      region: "",
      contact_email: "",
      contact_phone: "",
      website: "",
      education_levels: [],
      color_scheme: "blue",
    },
  });

  // Fetch existing profile data
  useEffect(() => {
    const fetchSchoolProfile = async () => {
      try {
        // Use window.authFetch which is set by the AuthProvider
        const authFetch = (window as any).authFetch;

        if (!authFetch) {
          console.error("authFetch is not available");
          return;
        }

        const response = await authFetch(`${API_BASE_URL}/api/v1/school-onboarding/profile`);

        if (response.ok) {
          const schoolData = await response.json();

          // Check if we have data from a previous onboarding attempt
          const hasExistingData = schoolData.name || schoolData.address || schoolData.city ||
                                schoolData.region !== "" || schoolData.education_levels?.length > 0;

          if (hasExistingData) {
            // Populate form with existing data from previous onboarding attempt
            form.reset({
              name: schoolData.name || "",
              address: schoolData.address || "",
              city: schoolData.city || "",
              region: schoolData.region || "",
              contact_email: schoolData.contact_email || "",
              contact_phone: schoolData.contact_phone || "",
              website: schoolData.website || "",
              education_levels: schoolData.education_levels || [],
              color_scheme: schoolData.color_scheme || "blue",
            });
          } else if (user?.school) {
            // If no existing onboarding data but we have registration data, use that
            setDataFromRegistration(true);

            // Use data from registration
            form.reset({
              name: user.school.name || "",
              address: "",
              city: "",
              region: user.school.region || "",
              contact_email: user.email || "",
              contact_phone: user.school_profile?.contact_phone || "",
              website: "",
              education_levels: ["lycee"], // Default to high school
              color_scheme: "blue",
            });
          }
        } else {
          // If endpoint fails but we have user data from auth context, use that
          if (user?.school) {
            setDataFromRegistration(true);

            form.reset({
              name: user.school.name || "",
              address: "",
              city: "",
              region: user.school.region || "",
              contact_email: user.email || "",
              contact_phone: "",
              website: "",
              education_levels: ["lycee"], // Default to high school
              color_scheme: "blue",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching school profile:", error);

        // Even if there's an error, try to use registration data if available
        if (user?.school) {
          setDataFromRegistration(true);

          form.reset({
            name: user.school.name || "",
            address: "",
            city: "",
            region: user.school.region || "",
            contact_email: user.email || "",
            contact_phone: "",
            website: "",
            education_levels: ["lycee"], // Default to high school
            color_scheme: "blue",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolProfile();
  }, [form, user]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    setSubmitting(true);

    try {
      // Use window.authFetch which is set by the AuthProvider
      const authFetch = (window as any).authFetch;

      if (!authFetch) {
        toast({
          title: t("updateFailed") || "Update Failed",
          description: "Authentication service not available",
          variant: "destructive",
        });
        return;
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/school-onboarding/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        toast({
          title: t("profileUpdated") || "Profile Updated",
          description: t("schoolProfileSuccess") || "Your school profile was successfully updated",
          variant: "success",
        });

        // Call the onCompleted callback
        onCompleted();
      } else {
        const errorData = await response.json();

        toast({
          title: t("updateFailed") || "Update Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating school profile:", error);

      toast({
        title: t("updateFailed") || "Update Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      {dataFromRegistration && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("dataPreFilled") || "Data From Registration"}</AlertTitle>
          <AlertDescription>
            {t("registrationDataInfo") || "We've pre-filled some information based on your registration. Please complete the remaining fields and verify that all information is correct."}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("schoolName") || "School Name"}</FormLabel>
                <FormControl>
                  <Input placeholder="Al-Akhawayn School" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contactEmail") || "Contact Email"}</FormLabel>
                <FormControl>
                  <Input placeholder="info@school.edu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contactPhone") || "Contact Phone"}</FormLabel>
                <FormControl>
                  <Input placeholder="+212 5xx-xxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  {t("optionalField") || "Optional field"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("website") || "Website"}</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.school.edu" {...field} />
                </FormControl>
                <FormDescription>
                  {t("optionalField") || "Optional field"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("address") || "Address"}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="123 School Street"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("city") || "City"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Casablanca" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("region") || "Region"}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectRegion") || "Select region"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {moroccoRegions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {t(`region_${region.value}`) || region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="education_levels"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>{t("educationLevels") || "Education Levels"}</FormLabel>
                  <FormDescription>
                    {t("selectLevelsOffered") || "Select the education levels offered by your school"}
                  </FormDescription>
                </div>
                <div className="space-y-2">
                  {educationLevels.map((level) => (
                    <FormField
                      key={level.value}
                      control={form.control}
                      name="education_levels"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={level.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(level.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, level.value])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== level.value
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t(`level_${level.value}`) || level.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color_scheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("colorScheme") || "Color Scheme"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectColor") || "Select color scheme"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorSchemes.map((color) => (
                      <SelectItem
                        key={color.value}
                        value={color.value}
                        className="flex items-center"
                      >
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.value }}
                        />
                        {t(`color_${color.value}`) || color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t("colorSchemeDesc") || "This color will be used for your school's branding within the platform"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving") || "Saving..."}
              </>
            ) : status.profile_completed ? (
              t("updateProfile") || "Update Profile"
            ) : (
              t("saveAndContinue") || "Save & Continue"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
