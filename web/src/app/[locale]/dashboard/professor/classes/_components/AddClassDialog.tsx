"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { ProfessorService } from "@/services/ProfessorService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MultiCourseSelect } from "./MultiCourseSelect"; // Import our new component

// Define the form schema using Zod for validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  academicYear: z.string().min(4, { message: "Please select an academic year" }),
  educationLevel: z.string().min(1, { message: "Please select an education level" }),
  academicTrack: z.string().optional(),
  roomNumber: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  courseIds: z.array(z.number()).optional(),  // Changed from courseId to courseIds (array)
  departmentId: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
});

// Type for form values
type FormValues = z.infer<typeof formSchema>;

interface AddClassDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddClassDialog({ onSuccess, trigger }: AddClassDialogProps) {
  const { t } = useTranslation();
  const params = useParams();
  const locale = params.locale as string;
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [educationLevels, setEducationLevels] = useState<{id: string, name: string}[]>([]);
  const [academicTracks, setAcademicTracks] = useState<{id: string, name: string}[]>([]);
  const [courses, setCourses] = useState<{id: number, title: string}[]>([]);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      academicYear: new Date().getFullYear().toString(),
      educationLevel: "",
      academicTrack: "",
      roomNumber: "",
      capacity: undefined,
      courseIds: [],  // Initialize with empty array
      departmentId: undefined,
      description: "",
    },
  });

  // Generate a list of academic years as fallback
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -1; i < 4; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  };

  // Load form data when dialog opens
  useEffect(() => {
    if (open) {
      const loadFormData = async () => {
        setIsLoading(true);
        setMetadataError(null);
        try {
          // Load class metadata (could be a new service method)
          const metadata = await ProfessorService.getClassMetadata();

          // Set up form options
          setAcademicYears(metadata.academicYears || generateAcademicYears());
          setEducationLevels(metadata.educationLevels || []);
          setAcademicTracks(metadata.academicTracks || []);
          setCourses(metadata.courses || []);
          setDepartments(metadata.departments || []);

          // Set default academic year if available
          if (metadata.currentAcademicYear) {
            form.setValue("academicYear", metadata.currentAcademicYear);
          }
        } catch (error) {
          console.error("Error loading class metadata:", error);
          // Set error message
          setMetadataError(t("errorLoadingMetadata"));

          // Use fallback data
          setAcademicYears(generateAcademicYears());
          setEducationLevels([
            { id: "primary_1", name: t("primary") + " 1" },
            { id: "primary_2", name: t("primary") + " 2" },
            { id: "college_7", name: t("college") + " 1" },
            { id: "bac_1", name: t("highSchool") + " 1" },
            { id: "bac_2", name: t("highSchool") + " 2" },
          ]);
          setAcademicTracks([
            { id: "sciences_math_a", name: t("sciencesMathA") },
            { id: "svt_pc", name: t("sciencesPhysics") },
            { id: "lettres_humaines", name: t("artsHumanities") },
          ]);
        } finally {
          setIsLoading(false);
        }
      };

      loadFormData();
    }
  }, [open, form, t]);

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Create class with the primary course (if any)
      const createClassData = {
        name: data.name,
        academicYear: data.academicYear,
        educationLevel: data.educationLevel,
        academicTrack: data.academicTrack || undefined,
        roomNumber: data.roomNumber || undefined,
        capacity: data.capacity,
        courseId: data.courseIds && data.courseIds.length > 0 ? data.courseIds[0] : undefined,
        departmentId: data.departmentId,
        description: data.description,
      };

      // Call service to create the class
      const response = await ProfessorService.createClass(createClassData);

      // If more than one course is selected, assign additional courses to the class
      if (data.courseIds && data.courseIds.length > 1) {
        try {
          await ProfessorService.assignCoursesToClass(response.id, {
            course_ids: data.courseIds,
            academic_year: data.academicYear,
          });
        } catch (error) {
          console.error("Error assigning multiple courses to class:", error);
          // Show warning but don't fail the whole operation
          toast({
            title: t("classCreated"),
            description: t("classCreatedWithCourseWarning"),
            variant: "warning",
          });
        }
      }

      // Show success message
      toast({
        title: t("classCreated"),
        description: t("classCreatedDescription"),
      });

      // Close dialog and trigger success callback
      setOpen(false);
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating class:", error);
      // Show error message
      toast({
        title: t("errorCreatingClass"),
        description: typeof error === 'string' ? error : t("tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for multiple course selection
  const handleCourseSelection = (courseIds: number[]) => {
    form.setValue("courseIds", courseIds, { shouldValidate: true });
  };

  // Close handler that resets the form
  const handleClose = () => {
    setOpen(false);
    // Give time for the close animation before resetting
    setTimeout(() => {
      form.reset();
      setMetadataError(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("addClass")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t("addClass")}</DialogTitle>
          <DialogDescription>
            {t("addClassDescription")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t("loadingData")}</span>
          </div>
        ) : metadataError ? (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("errorLoadingData")}</AlertTitle>
              <AlertDescription>
                {metadataError}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              {t("usingFallbackData")}
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose} className="mr-2">
                {t("cancel")}
              </Button>
              <Button onClick={() => {
                setIsLoading(true);
                setMetadataError(null);
                setTimeout(() => {
                  setOpen(true);
                }, 100);
              }}>
                {t("tryAgain")}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Class Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("className")} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t("classNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic Year */}
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicYear")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectAcademicYear")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Education Level */}
                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("educationLevel")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectEducationLevel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic Track */}
                <FormField
                  control={form.control}
                  name="academicTrack"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicTrack")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectAcademicTrack")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t("none")}</SelectItem>
                          {academicTracks.map((track) => (
                            <SelectItem key={track.id} value={track.id}>
                              {track.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Room Number */}
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("roomNumber")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("roomNumberPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Capacity */}
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("capacity")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder={t("capacityPlaceholder")}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department */}
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("department")}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                        defaultValue={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectDepartment")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t("none")}</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Courses (Multiple) */}
              <FormField
                control={form.control}
                name="courseIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("linkedCourses")}</FormLabel>
                    <FormControl>
                      <MultiCourseSelect
                        courses={courses}
                        selectedCourseIds={field.value || []}
                        onSelectionChange={handleCourseSelection}
                        placeholder={t("selectCourses")}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("linkedCoursesDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("descriptionPlaceholder")}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? t("creating") : t("createClass")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
