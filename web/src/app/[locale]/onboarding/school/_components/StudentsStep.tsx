// web/src/app/[locale]/dashboard/school/onboarding/_components/StudentsStep.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { Loader2, Upload, FileSpreadsheet, DownloadCloud, Users } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// Schema for file upload validation
const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "CSV file is required" }).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB limit
    { message: "File must be less than 10MB" }
  ).refine(
    (file) => file.name.endsWith('.csv'),
    { message: "File must be a CSV" }
  ),
});

interface StudentsStepProps {
  onCompleted: () => void;
  status: any;
}

export default function StudentsStep({ onCompleted, status }: StudentsStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // File upload form
  const form = useForm<z.infer<typeof fileUploadSchema>>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {},
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Validate the file
      try {
        fileUploadSchema.parse({ file });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: t("invalidFile") || "Invalid File",
            description: error.errors[0].message,
            variant: "destructive",
          });
          setSelectedFile(null);
          e.target.value = ""; // Reset the input
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: t("noFileSelected") || "No File Selected",
        description: t("pleaseSelectFile") || "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Simulate progress using an interval
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress; // Cap at 90% until complete
        });
      }, 500);

      // Make API request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/import-students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      // Clear the progress interval
      clearInterval(progressInterval);

      if (response.ok) {
        setUploadProgress(100);
        const result = await response.json();

        // Update the imported count
        setImportedCount(prev => prev + result.success_count);

        toast({
          title: t("importSuccessful") || "Import Successful",
          description: t("studentsImported", { count: result.success_count }) ||
            `Successfully imported ${result.success_count} students`,
          variant: "success",
        });

        // Reset the file input
        setSelectedFile(null);
        form.reset();

        // If we've imported at least one student, mark the step as completed
        if (result.success_count > 0) {
          onCompleted();
        }

        // If there are failures, show warning
        if (result.failed_emails && result.failed_emails.length > 0) {
          console.error("Failed imports:", result.failed_emails);
          toast({
            title: t("someImportsFailed") || "Some Imports Failed",
            description: t("checkConsoleForDetails") || "Some student records could not be imported. Check console for details.",
            variant: "warning",
          });
        }
      } else {
        setUploadProgress(0);
        const errorData = await response.json();

        toast({
          title: t("importFailed") || "Import Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing students:", error);
      setUploadProgress(0);

      toast({
        title: t("importFailed") || "Import Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV content
    const csvContent = `email,full_name,student_id,education_level,academic_track,graduation_year,class_name
student1@example.com,Sara Ahmed,ST12345,bac_1,sciences_math_a,2026,Class 10A
student2@example.com,Mohamed Ali,ST12346,bac_1,sciences_math_a,2026,Class 10A
student3@example.com,Amal Lahrech,ST12347,bac_2,svt_pc,2025,Class 11B`;

    // Create a blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv' });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a link element to download the CSV
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';

    // Click the link to trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContinue = () => {
    if (importedCount > 0 || status.students_imported) {
      onCompleted();
    } else {
      toast({
        title: t("noStudentsImported") || "No Students Imported",
        description: t("importStudentsFirst") || "Please import students before continuing",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{t("importStudents") || "Import Students"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("importStudentsDescription") || "Upload a CSV file with student information"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("bulkImportStudents") || "Bulk Import Students"}</CardTitle>
          <CardDescription>
            {t("bulkImportStudentsDesc") || "Upload a CSV file with student information. Students will receive an email invitation to join the platform."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={downloadTemplate}>
                <DownloadCloud className="mr-2 h-4 w-4" />
                {t("downloadTemplate") || "Download Template"}
              </Button>
            </div>

            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-2">{t("csvFormat") || "CSV Format"}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t("csvFormatStudentsDesc") || "Your CSV should include these columns: email, full_name, student_id, education_level, academic_track (optional), graduation_year (optional), class_name (optional)"}
              </p>
              <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre overflow-x-auto">
                email,full_name,student_id,education_level,academic_track,graduation_year,class_name
student1@example.com,Sara Ahmed,ST12345,bac_1,sciences_math_a,2026,Class 10A
student2@example.com,Mohamed Ali,ST12346,bac_1,sciences_math_a,2026,Class 10A
student3@example.com,Amal Lahrech,ST12347,bac_2,svt_pc,2025,Class 11B
              </pre>
            </div>

            <Form {...form}>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>{t("selectCSVFile") || "Select CSV File"}</FormLabel>
                      <FormControl>
                        <Input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          disabled={uploading}
                          {...fieldProps}
                        />
                      </FormControl>
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>

            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("uploading") || "Uploading..."}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {importedCount > 0 && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-md flex items-center">
                <Users className="h-5 w-5 mr-2" />
                <span>
                  {t("totalStudentsImported", { count: importedCount }) ||
                    `Total students imported: ${importedCount}`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleContinue}
            disabled={importedCount === 0 && !status.students_imported}
          >
            {t("skipForNow") || "Skip for Now"}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("uploading") || "Uploading..."}
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {t("uploadAndImport") || "Upload & Import"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={importedCount === 0 && !status.students_imported}
        >
          {t("saveAndContinue") || "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}
