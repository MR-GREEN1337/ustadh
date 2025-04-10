// web/src/app/[locale]/dashboard/school/onboarding/_components/DepartmentsStep.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Plus, Trash2, Building, Edit } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";

// Validation schema for department creation
const departmentSchema = z.object({
  name: z.string().min(2, { message: "Department name must be at least 2 characters" }),
  code: z.string().min(2, { message: "Department code must be at least 2 characters" })
    .max(10, { message: "Department code must be at most 10 characters" })
    .regex(/^[A-Za-z0-9_-]+$/, { message: "Department code can only contain letters, numbers, underscores, and hyphens" }),
  description: z.string().optional(),
  education_level: z.string().optional(),
});

// Available education levels
const educationLevels = [
  { value: "primary", label: "Primary School" },
  { value: "college", label: "College (Middle School)" },
  { value: "lycee", label: "Lycée (High School)" },
  { value: "university", label: "University" },
];

interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  education_level: string | null;
  created_at: string;
}

interface DepartmentsStepProps {
  onCompleted: () => void;
  status: any;
}

export default function DepartmentsStep({ onCompleted, status }: DepartmentsStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      education_level: "",
    },
  });

  // Fetch existing departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: t("fetchError") || "Error",
        description: t("errorFetchingDepartments") || "Could not load departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Reset form when editing department changes
  useEffect(() => {
    if (editingDepartment) {
      form.reset({
        name: editingDepartment.name,
        code: editingDepartment.code,
        description: editingDepartment.description || "",
        education_level: editingDepartment.education_level || "",
      });
    } else {
      form.reset({
        name: "",
        code: "",
        description: "",
        education_level: "",
      });
    }
  }, [editingDepartment, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof departmentSchema>) => {
    setSubmitting(true);

    try {
      // Currently only creating new departments is supported
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/departments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const newDepartment = await response.json();

        toast({
          title: t("departmentCreated") || "Department Created",
          description: t("departmentAddedSuccessfully") || "Department was successfully added",
          variant: "success",
        });

        // Close the dialog and refresh the department list
        setDialogOpen(false);
        setEditingDepartment(null);
        form.reset();
        fetchDepartments();

        // If this is the first department, trigger the onCompleted callback
        if (departments.length === 0) {
          onCompleted();
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("creationFailed") || "Creation Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating department:", error);

      toast({
        title: t("creationFailed") || "Creation Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle editing a department
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleContinue = () => {
    if (departments.length > 0) {
      onCompleted();
    } else {
      toast({
        title: t("noDepartments") || "No Departments",
        description: t("createDepartmentFirst") || "Please create at least one department first",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{t("manageDepartments") || "Manage Departments"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("departmentsDescription") || "Create academic departments for your school"}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("addDepartment") || "Add Department"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment
                  ? t("editDepartment") || "Edit Department"
                  : t("addNewDepartment") || "Add New Department"}
              </DialogTitle>
              <DialogDescription>
                {t("departmentFormDescription") || "Fill in the details for the academic department"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("departmentName") || "Department Name"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("departmentCode") || "Department Code"}</FormLabel>
                      <FormControl>
                        <Input placeholder="CS" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("codeDescription") || "A short, unique identifier for the department"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("description") || "Description"}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("departmentDescription") || "Department of Computer Science and Information Technology"}
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
                  control={form.control}
                  name="education_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("primaryEducationLevel") || "Primary Education Level"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectEducationLevel") || "Select level"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {t(`level_${level.value}`) || level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("educationLevelDescription") || "The main education level this department serves"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingDepartment(null);
                    }}
                  >
                    {t("cancel") || "Cancel"}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving") || "Saving..."}
                      </>
                    ) : editingDepartment ? (
                      t("updateDepartment") || "Update Department"
                    ) : (
                      t("createDepartment") || "Create Department"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : departments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <Building className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              {t("noDepartmentsYet") || "No Departments Yet"}
            </CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noDepartmentsDescription") || "Create academic departments to organize your school structure. Departments can be used for grouping teachers, courses, and administrative functions."}
            </CardDescription>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addDepartment") || "Add Department"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name") || "Name"}</TableHead>
              <TableHead>{t("code") || "Code"}</TableHead>
              <TableHead>{t("educationLevel") || "Education Level"}</TableHead>
              <TableHead className="hidden md:table-cell">{t("description") || "Description"}</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell>{department.code}</TableCell>
                <TableCell>
                  {department.education_level
                    ? (t(`level_${department.education_level}`) || department.education_level)
                    : "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate">
                  {department.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(department)}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="sr-only">{t("edit") || "Edit"}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={departments.length === 0}>
          {t("saveAndContinue") || "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
