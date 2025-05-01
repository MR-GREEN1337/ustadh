"use client";

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslation } from '@/i18n/client';
import professorSchoolService, {
  SchoolData,
  Department,
  AdminContact,
  SchoolAnnouncement,
  SchoolStats
} from '@/services/ProfessorSchoolService';
import { toast } from 'sonner';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Building,
  Mail,
  Phone,
  Globe,
  Users,
  Book,
  FileText,
  Info,
  Bell,
  MessageSquare,
  User,
  BookOpen,
  Award,
  Calendar,
  Megaphone,
  Clock,
  AlertTriangle,
  Download,
  CheckCircle2,
  BarChart4,
  Lock,
  UserPlus,
  Send,
  PlusCircle,
  Map,
  Building2,
  School,
  GraduationCap,
  LibraryBig,
  AlertCircle
} from 'lucide-react';

// School Info Component
const SchoolInfoSection = ({ schoolData, isLoading }: { schoolData: SchoolData | null, isLoading: boolean }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!schoolData) {
    return <div className="text-center py-8 text-muted-foreground">{t("noSchoolDataAvailable")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {schoolData.logo_url && (
          <div className="mb-4 md:mb-0">
            <div className="bg-muted rounded-lg p-2 flex items-center justify-center" style={{ width: '100px', height: '100px' }}>
              <img
                src={schoolData.logo_url}
                alt={schoolData.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{schoolData.name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {schoolData.school_type}
            </Badge>
            {schoolData.education_levels.map((level, idx) => (
              <Badge key={idx} variant="secondary" className="capitalize">
                {level}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t("schoolCode")}: {schoolData.code}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-4 w-4" />
              {t("location")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">{schoolData.address}</p>
              <p className="text-sm">{schoolData.city}, {schoolData.region}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t("contactInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{schoolData.contact_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{schoolData.contact_phone}</span>
              </div>
              {schoolData.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={schoolData.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {schoolData.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Departments Section
const DepartmentsSection = ({ departments, isLoading, onRequestAccess }: {
  departments: Department[],
  isLoading: boolean,
  onRequestAccess: (departmentId: number) => void
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!departments.length) {
    return <div className="text-center py-8 text-muted-foreground">{t("noDepartmentsFound")}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("departments")}</CardTitle>
          <CardDescription>{t("departmentsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("code")}</TableHead>
                <TableHead>{t("educationLevel")}</TableHead>
                <TableHead>{t("headOfDepartment")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.education_level || "-"}</TableCell>
                  <TableCell>{dept.head_staff_name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestAccess(dept.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t("requestAccess")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Announcements Section
const AnnouncementsSection = ({ announcements, isLoading }: {
  announcements: SchoolAnnouncement[],
  isLoading: boolean
}) => {
  const { t } = useTranslation();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">{t("high")}</Badge>;
      case 'urgent':
        return <Badge variant="destructive" className="animate-pulse">{t("urgent")}</Badge>;
      case 'normal':
        return <Badge variant="secondary">{t("normal")}</Badge>;
      default:
        return <Badge variant="outline">{t("low")}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!announcements.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("announcements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-6">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noAnnouncementsAvailable")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("announcements")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            {announcements.map((announcement, idx) => (
              <div key={announcement.id} className="p-4 border-b last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{announcement.title}</h3>
                  {getPriorityBadge(announcement.priority)}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{announcement.content}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{announcement.published_by}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(announcement.published_at)}</span>
                  </div>
                </div>
                {announcement.expires_at && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{t("expiresOn")} {formatDate(announcement.expires_at)}</span>
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Contacts Section
const AdminContactsSection = ({ contacts, isLoading, onContactAdmin }: {
  contacts: AdminContact[],
  isLoading: boolean,
  onContactAdmin: (admin: AdminContact) => void
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  if (!contacts.length) {
    return <div className="text-center py-8 text-muted-foreground">{t("noAdminContactsAvailable")}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar_url} alt={contact.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => onContactAdmin(contact)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("contactAdmin")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// School Stats Section
const SchoolStatsSection = ({ stats, isLoading }: { stats: SchoolStats | null, isLoading: boolean }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">{t("noStatsAvailable")}</div>;
  }

  const statsCards = [
    {
      title: t("totalStudents"),
      value: stats.total_students,
      icon: <Users className="h-8 w-8 text-blue-500" />,
      color: 'bg-blue-500/10'
    },
    {
      title: t("totalTeachers"),
      value: stats.total_teachers,
      icon: <GraduationCap className="h-8 w-8 text-emerald-500" />,
      color: 'bg-emerald-500/10'
    },
    {
      title: t("departments"),
      value: stats.total_departments,
      icon: <Building2 className="h-8 w-8 text-amber-500" />,
      color: 'bg-amber-500/10'
    },
    {
      title: t("totalCourses"),
      value: stats.total_courses,
      icon: <BookOpen className="h-8 w-8 text-purple-500" />,
      color: 'bg-purple-500/10'
    },
    {
      title: t("activeCourses"),
      value: stats.active_courses,
      icon: <Book className="h-8 w-8 text-rose-500" />,
      color: 'bg-rose-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      {statsCards.map((stat, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`rounded-full p-3 ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Contact Admin Dialog
const ContactAdminDialog = ({
  isOpen,
  onClose,
  selectedAdmin,
  onSendMessage
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedAdmin: AdminContact | null;
  onSendMessage: (subject: string, message: string) => void;
}) => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error(t("pleaseCompleteAllFields"));
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(subject, message);
      setSubject("");
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedAdmin ? t("contactAdminName", { name: selectedAdmin.name }) : t("contactAdmin")}
          </DialogTitle>
          <DialogDescription>
            {t("contactAdminDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t("subject")}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("enterSubject")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("enterMessage")}
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t("sending")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t("sendMessage")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Request Department Access Dialog
const RequestAccessDialog = ({
  isOpen,
  onClose,
  departmentId,
  departments,
  onRequestAccess
}: {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number | null;
  departments: Department[];
  onRequestAccess: (departmentId: number, reason: string) => void;
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDepartment = departments.find(dept => dept.id === departmentId);

  const handleSubmit = async () => {
    if (!departmentId || !reason.trim()) {
      toast.error(t("pleaseProvideReason"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onRequestAccess(departmentId, reason);
      setReason("");
      onClose();
    } catch (error) {
      console.error("Error requesting access:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedDepartment
              ? t("requestAccessToDepartment", { department: selectedDepartment.name })
              : t("requestDepartmentAccess")}
          </DialogTitle>
          <DialogDescription>
            {t("requestDepartmentAccessDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t("requestReason")}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("enterRequestReason")}
              rows={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t("submitting")}
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("submitRequest")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main School Page Component (Continued)
const ProfessorSchoolPage = () => {
  const { t } = useTranslation();
  const locale = useLocale();

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState({
    school: true,
    departments: true,
    announcements: true,
    admins: true,
    stats: true
  });
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [adminContacts, setAdminContacts] = useState<AdminContact[]>([]);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);

  // Dialog state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminContact | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  // Load data
  const fetchSchoolData = async () => {
    try {
      const data = await professorSchoolService.getSchoolData();
      setSchoolData(data);
    } catch (error) {
      console.error("Error loading school data:", error);
      toast.error(t("errorLoadingSchoolData"));
    } finally {
      setLoading(prev => ({ ...prev, school: false }));
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await professorSchoolService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error(t("errorLoadingDepartments"));
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await professorSchoolService.getAnnouncements(10);
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);
      toast.error(t("errorLoadingAnnouncements"));
    } finally {
      setLoading(prev => ({ ...prev, announcements: false }));
    }
  };

  const fetchAdminContacts = async () => {
    try {
      const data = await professorSchoolService.getAdminContacts();
      setAdminContacts(data);
    } catch (error) {
      console.error("Error loading admin contacts:", error);
      toast.error(t("errorLoadingAdminContacts"));
    } finally {
      setLoading(prev => ({ ...prev, admins: false }));
    }
  };

  const fetchSchoolStats = async () => {
    try {
      const data = await professorSchoolService.getSchoolStats();
      setSchoolStats(data);
    } catch (error) {
      console.error("Error loading school stats:", error);
      toast.error(t("errorLoadingSchoolStats"));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Load all data on mount
  useEffect(() => {
    fetchSchoolData();
    fetchDepartments();
    fetchAnnouncements();
    fetchAdminContacts();
    fetchSchoolStats();
  }, []);

  // Additional useful data loading for active tab
  useEffect(() => {
    if (activeTab === "announcements") {
      fetchAnnouncements();
    } else if (activeTab === "departments") {
      fetchDepartments();
    } else if (activeTab === "contacts") {
      fetchAdminContacts();
    }
  }, [activeTab]);

  // Handlers
  const handleContactAdmin = (admin: AdminContact) => {
    setSelectedAdmin(admin);
    setContactDialogOpen(true);
  };

  const handleRequestAccess = (departmentId: number) => {
    setSelectedDepartmentId(departmentId);
    setAccessDialogOpen(true);
  };

  const handleSendMessage = async (subject: string, message: string) => {
    if (!selectedAdmin) return;

    try {
      const response = await professorSchoolService.sendMessageToAdmin({
        recipient_id: selectedAdmin.id,
        subject,
        content: message
      });

      if (response.success) {
        toast.success(t("messageSentSuccessfully"));
      } else {
        toast.error(response.message || t("errorSendingMessage"));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("errorSendingMessage"));
      throw error;
    }
  };

  const handleSubmitAccessRequest = async (departmentId: number, reason: string) => {
    try {
      const response = await professorSchoolService.requestDepartmentAccess(departmentId, reason);

      if (response.success) {
        toast.success(t("accessRequestSubmitted"));
      } else {
        toast.error(response.message || t("errorRequestingAccess"));
      }
    } catch (error) {
      console.error("Error requesting access:", error);
      toast.error(t("errorRequestingAccess"));
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          {t("schoolInformation")}
        </h1>
        <p className="text-muted-foreground">
          {t("schoolPageDescription")}
        </p>
      </div>

      {/* School stats overview cards */}
      <SchoolStatsSection stats={schoolStats} isLoading={loading.stats} />

      {/* Main content with tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{t("overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{t("departments")}</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{t("announcements")}</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{t("adminContacts")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SchoolInfoSection
            schoolData={schoolData}
            isLoading={loading.school}
          />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <DepartmentsSection
            departments={departments}
            isLoading={loading.departments}
            onRequestAccess={handleRequestAccess}
          />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <AnnouncementsSection
            announcements={announcements}
            isLoading={loading.announcements}
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <AdminContactsSection
            contacts={adminContacts}
            isLoading={loading.admins}
            onContactAdmin={handleContactAdmin}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ContactAdminDialog
        isOpen={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        selectedAdmin={selectedAdmin}
        onSendMessage={handleSendMessage}
      />

      <RequestAccessDialog
        isOpen={accessDialogOpen}
        onClose={() => setAccessDialogOpen(false)}
        departmentId={selectedDepartmentId}
        departments={departments}
        onRequestAccess={handleSubmitAccessRequest}
      />
    </div>
  );
};

export default ProfessorSchoolPage;
