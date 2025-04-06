"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { API_BASE_URL } from "@/lib/config";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, BookOpen, Shield } from "lucide-react";
import { useParams } from "next/navigation";
import { useDictionary } from "@/i18n/client";
import GuardianManagement from "./GuardianManagement";
import { ProfileService } from "@/services/ProfileService";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const locale = params?.locale as string || "en";
  const [guardians, setGuardians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    full_name: "",
    grade_level: "",
    school_type: "",
  });

  // Fetch profile data and guardians
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);

        setProfileData({
          username: user.username || "",
          email: user.email || "",
          full_name: user.full_name || "",
          grade_level: (user as any).grade_level?.toString() || "",
          school_type: user.school_type || "",
        });

        // Fetch guardians if the user is a student
        if (user.user_type === "student") {
          try {
            const guardiansData = await ProfileService.getGuardians();
            setGuardians(guardiansData);
          } catch (error) {
            console.error("Error fetching guardians:", error);
            toast({
              title: "Error",
              description: "Failed to load guardian data. Please try again.",
              variant: "destructive",
            });
          }
        }

        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profileData,
          grade_level: profileData.grade_level ? parseInt(profileData.grade_level) : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
        setEditMode(false);
      } else {
        const error = await response.json();
        toast({
          title: "Update failed",
          description: error.detail || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need to be logged in to view this page.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper to render Guardian Management section based on user type
  const renderGuardianSection = () => {
    if (user.user_type === "student") {
      return <GuardianManagement initialGuardians={guardians} studentMode={true} />;
    } else if (user.user_type === "parent" || user.user_type === "teacher") {
      return <GuardianManagement studentMode={false} />;
    }
    return null;
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Personal Info</span>
          </TabsTrigger>
          {(user.user_type === "student" || user.user_type === "parent" || user.user_type === "teacher") && (
            <TabsTrigger value="guardians" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{user.user_type === "student" ? "Guardians" : "Students"}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Card */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    View and manage your personal information
                  </CardDescription>
                </div>
                <Button
                  variant={editMode ? "default" : "outline"}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? "Cancel" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.full_name} />
                    <AvatarFallback>{user.full_name?.charAt(0) || user.username?.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 text-center md:text-left flex-1">
                    <h3 className="text-2xl font-bold">{user.full_name}</h3>
                    <p className="text-muted-foreground">{user.username}</p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                      <Badge variant="outline" className="capitalize">
                        {user.user_type}
                      </Badge>
                      {(user as any).grade_level && (
                        <Badge variant="secondary">
                          Grade {(user as any).grade_level}
                        </Badge>
                      )}
                      {(user as any).school_type && (
                        <Badge variant="secondary" className="capitalize">
                          {user.school_type} School
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={profileData.full_name}
                        onChange={handleInputChange}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profileData.username}
                        onChange={handleInputChange}
                        disabled={!editMode}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                  </div>

                  {user.user_type === "student" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade_level">Grade Level</Label>
                        <Select
                          disabled={!editMode}
                          value={profileData.grade_level}
                          onValueChange={(value) => handleSelectChange("grade_level", value)}
                        >
                          <SelectTrigger id="grade_level">
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(12)].map((_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                Grade {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school_type">School Type</Label>
                        <Select
                          disabled={!editMode}
                          value={profileData.school_type}
                          onValueChange={(value) => handleSelectChange("school_type", value)}
                        >
                          <SelectTrigger id="school_type">
                            <SelectValue placeholder="Select school type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="homeschool">Homeschool</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              {editMode && (
                <CardFooter>
                  <Button
                    onClick={saveProfile}
                    disabled={saving}
                    className="ml-auto"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Stats Card */}
            <Card className="md:w-80">
              <CardHeader>
                <CardTitle>Learning Stats</CardTitle>
                <CardDescription>Your learning progress overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed Lessons</span>
                    <span className="font-bold">24</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Study Streak</span>
                    <span className="font-bold">7 days</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Assignments</span>
                    <span className="font-bold">5/8</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '62.5%' }}></div>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Learning Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guardians">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            renderGuardianSection()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
