// web/src/app/[locale]/dashboard/school/onboarding/_components/StaffStep.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/i18n/client";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Plus, Upload, User, GraduationCap, Mail, Users } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";

// Schema for administrator invitation
const adminSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  role: z.string().min(1, { message: "Role is required" }),
});

// Schema for professor invitation
const professorSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  title: z.string().min(1, { message: "Title is required" }),
  academic_rank: z.string().min(1, { message: "Academic rank is required" }),
  department_id: z.string().optional(),
  specializations: z.string().optional().transform(val =>
    val ? val.split(",").map(s => s.trim()) : []
  ),
});

// Schema for file upload validation
const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "CSV file is required" }).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB limit
    { message: "File must be less than 5MB" }
  ).refine(
    (file) => file.name.endsWith('.csv'),
    { message: "File must be a CSV" }
  ),
});

// Admin roles
const adminRoles = [
  { value: "admin", label: "Administrator" },
  { value: "academic_coordinator", label: "Academic Coordinator" },
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "counselor", label: "School Counselor" },
  { value: "librarian", label: "Librarian" },
  { value: "it_admin", label: "IT Administrator" },
];

// Professor titles
const professorTitles = [
  { value: "Dr.", label: "Dr." },
  { value: "Prof.", label: "Prof." },
  { value: "Mr.", label: "Mr." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Ms.", label: "Ms." },
];

// Academic ranks
const academicRanks = [
  { value: "Professor", label: "Professor" },
  { value: "Associate Professor", label: "Associate Professor" },
  { value: "Assistant Professor", label: "Assistant Professor" },
  { value: "Lecturer", label: "Lecturer" },
  { value: "Instructor", label: "Instructor" },
  { value: "Teacher", label: "Teacher" },
];

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Staff {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Professor {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  title: string;
  academic_rank: string;
  department_id: number | null;
  department_name?: string;
  specializations: string[];
  created_at: string;
}

interface StaffStepProps {
  onCompleted: () => void;
  status: any;
}

export default function StaffStep({ onCompleted, status }: StaffStepProps) {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { toast } = useToast();

  // State variables
  const [activeTab, setActiveTab] = useState<string>("professors");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [adminStaff, setAdminStaff] = useState<Staff[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [professorDialogOpen, setProfessorDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Initialize admin form
  const adminForm = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "admin",
    },
  });

  // Initialize professor form
  const professorForm = useForm<z.infer<typeof professorSchema>>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      email: "",
      full_name: "",
      title: "",
      academic_rank: "",
      department_id: "",
      specializations: "",
    },
  });

  // File upload form
  const fileUploadForm = useForm<z.infer<typeof fileUploadSchema>>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {},
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch departments
      const deptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/departments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (deptResponse.ok) {
        setDepartments(await deptResponse.json());
      }

      // TODO: Add API endpoints to fetch professors and admin staff
      // For now, we'll just use empty arrays
      setAdminStaff([]);
      setProfessors([]);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: t("fetchError") || "Error",
        description: t("errorFetchingData") || "Could not load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle admin form submission
  const onAdminSubmit = async (values: z.infer<typeof adminSchema>) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/invite-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: t("invitationSent") || "Invitation Sent",
          description: t("adminInvitationSent") || "Admin invitation has been sent successfully",
          variant: "success",
        });

        // Close the dialog and refresh the data
        setAdminDialogOpen(false);
        adminForm.reset();
        fetchData();

        // If this is the first admin, mark this step as completed
        if (adminStaff.length === 0) {
          onCompleted();
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("invitationFailed") || "Invitation Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error inviting admin:", error);

      toast({
        title: t("invitationFailed") || "Invitation Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle professor form submission
  const onProfessorSubmit = async (values: z.infer<typeof professorSchema>) => {
    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/invite-professor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: t("invitationSent") || "Invitation Sent",
          description: t("professorInvitationSent") || "Professor invitation has been sent successfully",
          variant: "success",
        });

        // Close the dialog and refresh the data
        setProfessorDialogOpen(false);
        professorForm.reset();
        fetchData();

        // If this is the first professor, mark this step as completed
        if (professors.length === 0) {
          onCompleted();
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("invitationFailed") || "Invitation Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error inviting professor:", error);

      toast({
        title: t("invitationFailed") || "Invitation Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast({
        title: t("noFile") || "No File",
        description: t("selectFileFirst") || "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Different endpoints for professors and admin staff
      const endpoint = activeTab === 'professors'
        ? 'bulk-invite-professors'
        : 'bulk-invite-admins'; // This endpoint would need to be created in the backend

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/school-onboarding/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();

        toast({
          title: t("uploadSuccess") || "Upload Successful",
          description: t("bulkInvitationsProcessed", { count: result.success_count }) ||
            `Successfully processed ${result.success_count} invitations`,
          variant: "success",
        });

        // Reset state and refresh data
        setSelectedFile(null);
        fetchData();

        // Mark this step as completed if we successfully sent invitations
        if (result.success_count > 0) {
          onCompleted();
        }

        // If there are failures, show warning
        if (result.failed_emails && result.failed_emails.length > 0) {
          console.error("Failed invitations:", result.failed_emails);
          toast({
            title: t("someInvitationsFailed") || "Some Invitations Failed",
            description: t("checkConsoleForDetails") || "Some invitations could not be sent. Check console for details.",
            variant: "warning",
          });
        }
      } else {
        const errorData = await response.json();

        toast({
          title: t("uploadFailed") || "Upload Failed",
          description: errorData.detail || t("tryAgain") || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing bulk upload:", error);

      toast({
        title: t("uploadFailed") || "Upload Failed",
        description: t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

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

  const handleContinue = () => {
    // If either professors or admin staff have been added, mark as completed
    if (professors.length > 0 || adminStaff.length > 0) {
      onCompleted();
    } else {
      toast({
        title: t("noStaffAdded") || "No Staff Added",
        description: t("addStaffFirst") || "Please add at least one administrator or professor",
        variant: "destructive",
      });
    }
  };

  const renderEmptyState = () => {
    if (activeTab === 'professors') {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              {t("noProfessorsYet") || "No Professors Yet"}
            </CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noProfessorsDescription") || "Invite professors to join your school platform. They will receive an email with instructions to set up their account."}
            </CardDescription>
            <div className="flex gap-2">
              <Button onClick={() => setProfessorDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("addProfessor") || "Add Professor"}
              </Button>
              <Button variant="outline" onClick={() => setUploadMode('bulk')}>
                <Upload className="w-4 h-4 mr-2" />
                {t("bulkUpload") || "Bulk Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg font-medium mb-2">
              {t("noAdminsYet") || "No Administrators Yet"}
            </CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noAdminsDescription") || "Invite administrators to help you manage your school platform. They will receive an email with instructions to set up their account."}
            </CardDescription>
            <div className="flex gap-2">
              <Button onClick={() => setAdminDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("addAdministrator") || "Add Administrator"}
              </Button>
              <Button variant="outline" onClick={() => setUploadMode('bulk')}>
                <Upload className="w-4 h-4 mr-2" />
                {t("bulkUpload") || "Bulk Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{t("manageStaff") || "Manage Staff & Faculty"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("staffDescription") || "Invite administrators and professors to your school platform"}
          </p>
        </div>

        <ToggleGroup type="single" value={uploadMode} onValueChange={(value) => value && setUploadMode(value as 'single' | 'bulk')}>
          <ToggleGroupItem value="single" aria-label="Single invite mode">
            <User className="h-4 w-4 mr-2" />
            {t("singleInvite") || "Single"}
          </ToggleGroupItem>
          <ToggleGroupItem value="bulk" aria-label="Bulk upload mode">
            <Upload className="h-4 w-4 mr-2" />
            {t("bulkUpload") || "Bulk"}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {uploadMode === 'single' ? (
        <>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="professors" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {t("professors") || "Professors"}
              </TabsTrigger>
              <TabsTrigger value="administrators" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("administrators") || "Administrators"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="professors">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setProfessorDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addProfessor") || "Add Professor"}
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : professors.length === 0 ? (
                renderEmptyState()
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name") || "Name"}</TableHead>
                      <TableHead>{t("title") || "Title"}</TableHead>
                      <TableHead>{t("department") || "Department"}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("email") || "Email"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("specializations") || "Specializations"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professors.map((professor) => (
                      <TableRow key={professor.id}>
                        <TableCell className="font-medium">{professor.full_name}</TableCell>
                        <TableCell>{professor.title} {professor.academic_rank}</TableCell>
                        <TableCell>
                          {professor.department_name || (professor.department_id ?
                            departments.find(d => d.id === professor.department_id)?.name :
                            t("noDepartment") || "None")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{professor.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {professor.specializations.map((spec, idx) => (
                              <Badge key={idx} variant="outline">{spec}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="administrators">
              <div className="flex justify-end mb-4">
                <Button onClick={() => setAdminDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addAdministrator") || "Add Administrator"}
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : adminStaff.length === 0 ? (
                renderEmptyState()
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name") || "Name"}</TableHead>
                      <TableHead>{t("role") || "Role"}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("email") || "Email"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("dateAdded") || "Date Added"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStaff.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.full_name}</TableCell>
                        <TableCell>
                          <Badge variant={admin.role === 'admin' ? 'default' : 'secondary'}>
                            {t(`role_${admin.role}`) || admin.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{admin.email}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("bulkUploadStaff") || "Bulk Upload Staff"}</CardTitle>
            <CardDescription>
              {activeTab === 'professors'
                ? t("bulkUploadProfessorsDesc") || "Upload a CSV file with professor information"
                : t("bulkUploadAdminsDesc") || "Upload a CSV file with administrator information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">{t("csvFormat") || "CSV Format"}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'professors'
                    ? t("csvFormatProfessorsDesc") || "Your CSV should include these columns: email, full_name, title, academic_rank, specializations (optional), department_code (optional)"
                    : t("csvFormatAdminsDesc") || "Your CSV should include these columns: email, full_name, role"}
                </p>
                <pre className="bg-muted p-2 rounded-md text-xs whitespace-pre overflow-x-auto">
                  {activeTab === 'professors'
                    ? 'email,full_name,title,academic_rank,specializations,department_code\nprofsmith@example.com,John Smith,Dr.,Professor,"mathematics,physics",MATH\nproflee@example.com,Jane Lee,Prof.,Associate Professor,"computer science",CS'
                    : 'email,full_name,role\nadmin@example.com,Admin User,admin\ncoordinator@example.com,Academic Coordinator,academic_coordinator'}
                </pre>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-upload">{t("selectCSVFile") || "Select CSV File"}</Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setUploadMode('single')}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={!selectedFile || uploadingFile}
            >
              {uploadingFile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("uploading") || "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("uploadAndSendInvitations") || "Upload & Send Invitations"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Professor invitation dialog */}
      <Dialog open={professorDialogOpen} onOpenChange={setProfessorDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {t("inviteProfessor") || "Invite Professor"}
            </DialogTitle>
            <DialogDescription>
              {t("professorInviteDesc") || "The professor will receive an email invitation to join the platform"}
            </DialogDescription>
          </DialogHeader>

          <Form {...professorForm}>
            <form onSubmit={professorForm.handleSubmit(onProfessorSubmit)} className="space-y-4">
              <FormField
                control={professorForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email") || "Email"}</FormLabel>
                    <FormControl>
                      <Input placeholder="professor@university.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={professorForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fullName") || "Full Name"}</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={professorForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("title") || "Title"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectTitle") || "Select title"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {professorTitles.map((title) => (
                            <SelectItem key={title.value} value={title.value}>
                              {t(`title_${title.value}`) || title.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={professorForm.control}
                  name="academic_rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("academicRank") || "Academic Rank"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectRank") || "Select rank"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicRanks.map((rank) => (
                            <SelectItem key={rank.value} value={rank.value}>
                              {t(`rank_${rank.value}`) || rank.label}
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
                control={professorForm.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("department") || "Department"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectDepartment") || "Select department"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">{t("noDepartment") || "No Department"}</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("optionalField") || "Optional field"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={professorForm.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("specializations") || "Specializations"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("specializationsPlaceholder") || "Mathematics, Physics, Computer Science"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("specializationsDesc") || "Comma-separated list of specializations"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProfessorDialogOpen(false)}
                >
                  {t("cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("sending") || "Sending..."}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {t("sendInvitation") || "Send Invitation"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Admin invitation dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {t("inviteAdministrator") || "Invite Administrator"}
            </DialogTitle>
            <DialogDescription>
              {t("adminInviteDesc") || "The administrator will receive an email invitation to join the platform"}
            </DialogDescription>
          </DialogHeader>

          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
              <FormField
                control={adminForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email") || "Email"}</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@school.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fullName") || "Full Name"}</FormLabel>
                    <FormControl>
                      <Input placeholder="Admin User" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role") || "Role"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectRole") || "Select role"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adminRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {t(`role_${role.value}`) || role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdminDialogOpen(false)}
                >
                  {t("cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("sending") || "Sending..."}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {t("sendInvitation") || "Send Invitation"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={professors.length === 0 && adminStaff.length === 0}>
          {t("saveAndContinue") || "Save & Continue"}
        </Button>
      </div>
    </div>
  );
}

// Helper component for file upload
const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {children}
    </label>
  );
};
