"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Plus, Building, Edit } from "lucide-react";

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

// Validation schema for academic unit creation
const unitSchema = z.object({
  name: z.string().min(2, { message: "name_min_length" }),
  code: z.string().min(2, { message: "code_min_length" })
    .max(10, { message: "code_max_length" })
    .regex(/^[A-Za-z0-9_-]+$/, { message: "code_format" }),
  description: z.string().optional(),
  education_level: z.string().optional(),
});

// Education levels based on French system
const educationLevels = [
  { value: "primaire", label: "primaire" },
  { value: "college", label: "college" },
  { value: "lycee", label: "lycee" },
];

interface Unit {
  id: number;
  name: string;
  code: string;
  description: string | null;
  education_level: string | null;
  created_at: string;
}

interface UnitStepProps {
  onCompleted: () => void;
  status: any;
}

export default function AcademicUnitsStep({ onCompleted, status }: UnitStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof unitSchema>>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      education_level: "",
    },
  });

  // Fetch existing academic units
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      console.error(t("error_fetching_units"), error);
      toast({
        title: t("fetchError"),
        description: t("errorFetchingUnits"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Reset form when editing unit changes
  useEffect(() => {
    if (editingUnit) {
      form.reset({
        name: editingUnit.name,
        code: editingUnit.code,
        description: editingUnit.description || "",
        education_level: editingUnit.education_level || "",
      });
    } else {
      form.reset({
        name: "",
        code: "",
        description: "",
        education_level: "",
      });
    }
  }, [editingUnit, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof unitSchema>) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/departments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const newUnit = await response.json();

        toast({
          title: t("unitCreated"),
          description: t("unitAddedSuccessfully"),
          variant: "success",
        });

        // Close the dialog and refresh the unit list
        setDialogOpen(false);
        setEditingUnit(null);
        form.reset();
        fetchUnits();

        // If this is the first unit, trigger the onCompleted callback
        if (units.length === 0) {
          onCompleted();
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("creationFailed"),
          description: errorData.detail || t("tryAgain"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(t("error_creating_unit"), error);

      toast({
        title: t("creationFailed"),
        description: t("unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle editing a unit
  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setDialogOpen(true);
  };

  const handleContinue = () => {
    if (units.length > 0) {
      onCompleted();
    } else {
      toast({
        title: t("noUnits"),
        description: t("createUnitFirst"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{t("manageAcademicUnits")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("academicUnitsDescription")}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("addUnit")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingUnit
                  ? t("editUnit")
                  : t("addNewUnit")}
              </DialogTitle>
              <DialogDescription>
                {t("unitFormDescription")}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("unitName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("unitNamePlaceholder")} {...field} />
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
                      <FormLabel>{t("unitCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("unitCodePlaceholder")} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("codeDescription")}
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
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("unitDescriptionPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("optionalField")}
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
                      <FormLabel>{t("primaryEducationLevel")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectEducationLevel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {t(`level_${level.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("educationLevelDescription")}
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
                      setEditingUnit(null);
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving")}
                      </>
                    ) : editingUnit ? (
                      t("updateUnit")
                    ) : (
                      t("createUnit")
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
      ) : units.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <Building className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              {t("noUnitsYet")}
            </CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noUnitsDescription")}
            </CardDescription>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addUnit")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("educationLevel")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("description")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">{unit.name}</TableCell>
                <TableCell>{unit.code}</TableCell>
                <TableCell>
                  {unit.education_level
                    ? t(`level_${unit.education_level}`)
                    : "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate">
                  {unit.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(unit)}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="sr-only">{t("edit")}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={units.length === 0}>
          {t("saveAndContinue")}
        </Button>
      </div>
    </div>
  );
}
