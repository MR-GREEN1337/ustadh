"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from '@/i18n/client';
import { useParams } from 'next/navigation';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pencil, Book, Calendar, BarChart3, UserCog, Users, BookOpen, GraduationCap } from 'lucide-react';
import { ProfileService } from '@/services/ProfileService';
import { getInitials } from '@/lib/utils';
import EditProfile from './EditProfile';

// Admin Profile Component
const AdminProfile = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch school info for the admin
      const schoolData = await ProfileService.getSchoolInfo(user?.id);
      setSchoolInfo(schoolData);

      // Fetch additional data for admin dashboard
      if (schoolData) {
        const [departmentsData, staffData, activityData] = await Promise.all([
          ProfileService.getSchoolDepartments(schoolData.id),
          ProfileService.getSchoolStaff(schoolData.id, 1, 5), // First 5 staff members
          ProfileService.getActivityLog(1, 5) // Recent activity
        ]);

        setDepartments(departmentsData);
        setStaffMembers(staffData);
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
            <AvatarFallback className="text-lg bg-primary/5">{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-muted-foreground">School Administrator</p>
            <Badge variant="outline" className="mt-1">{schoolInfo?.name || 'Loading...'}</Badge>
          </div>
        </div>
        <Button
          onClick={() => setShowEditProfile(true)}
          variant="outline"
          size="sm"
          className="gap-1 h-9"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('editProfile') || 'Edit Profile'}
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="school">School Management</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrative Overview</CardTitle>
              <CardDescription>
                Key metrics and information about your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schoolInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Teachers</h3>
                        <p className="text-2xl font-bold">{schoolInfo.staffCount || 0}</p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Students</h3>
                        <p className="text-2xl font-bold">{schoolInfo.studentCount || 0}</p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Classes</h3>
                        <p className="text-2xl font-bold">{schoolInfo.classCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">School Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>School Name</Label>
                        <p className="text-sm">{schoolInfo.name}</p>
                      </div>
                      <div>
                        <Label>School Code</Label>
                        <p className="text-sm">{schoolInfo.code}</p>
                      </div>
                      <div>
                        <Label>School Type</Label>
                        <p className="text-sm capitalize">{schoolInfo.school_type}</p>
                      </div>
                      <div>
                        <Label>Region</Label>
                        <p className="text-sm">{schoolInfo.region}</p>
                      </div>
                      <div>
                        <Label>Subscription</Label>
                        <p className="text-sm capitalize">{schoolInfo.subscription_type}</p>
                      </div>
                      <div>
                        <Label>Active Status</Label>
                        <Badge variant={schoolInfo.is_active ? "outline" : "destructive"}>
                          {schoolInfo.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Detailed Reports</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Management</CardTitle>
              <CardDescription>
                Manage departments, staff, and school settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Departments</h3>
                  <p className="text-sm text-muted-foreground mb-2">Manage academic departments</p>
                  <Button size="sm">Manage Departments</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Staff</h3>
                  <p className="text-sm text-muted-foreground mb-2">View and manage school staff</p>
                  <Button size="sm">Manage Staff</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Classes</h3>
                  <p className="text-sm text-muted-foreground mb-2">Manage class schedules and assignments</p>
                  <Button size="sm">Manage Classes</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Students</h3>
                  <p className="text-sm text-muted-foreground mb-2">View and manage student enrollments</p>
                  <Button size="sm">Manage Students</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>School Settings</CardTitle>
              <CardDescription>
                Update your school profile and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" defaultValue={schoolInfo?.name} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input id="schoolCode" defaultValue={schoolInfo?.code} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" defaultValue={schoolInfo?.contact_email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" defaultValue={schoolInfo?.contact_phone} readOnly />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setShowEditProfile(true)}>Edit School Profile</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <p className="text-sm">{user?.full_name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm">{user?.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <p className="text-sm">{user?.username}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Language</Label>
                    <p className="text-sm">{user?.locale === 'ar' ? 'Arabic' : user?.locale === 'fr' ? 'French' : 'English'}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>Security</Label>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed: {user?.password_updated_at || 'Unknown'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowEditProfile(true)}>Change Password</Button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setShowEditProfile(true)}>Edit Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <EditProfile
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={() => {
            fetchData();
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
};

// Student Profile Component
const StudentProfile = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch student profile info
      const profileData = await ProfileService.getStudentInfo(user?.id);
      setStudentInfo(profileData);

      // Fetch multiple data types in parallel
      const [enrollmentsData, achievementsData, statsData] = await Promise.all([
        ProfileService.getStudentEnrollments(user?.id),
        ProfileService.getStudentAchievements(user?.id),
        ProfileService.getStudentActivityStats(user?.id)
      ]);

      setEnrollments(enrollmentsData);
      setAchievements(achievementsData);
      setActivityStats(statsData);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (isLoading) {
    return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
            <AvatarFallback className="text-lg bg-primary/5">{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-muted-foreground">Student</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="capitalize">{studentInfo?.education_level?.replace('_', ' ') || 'Not specified'}</Badge>
              {studentInfo?.academic_track && (
                <Badge variant="outline" className="capitalize">{studentInfo.academic_track.replace('_', ' ')}</Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowEditProfile(true)}
          variant="outline"
          size="sm"
          className="gap-1 h-9"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('editProfile') || 'Edit Profile'}
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Profile</CardTitle>
              <CardDescription>
                Your academic profile and learning information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Book className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Enrolled Courses</h3>
                        <p className="text-2xl font-bold">{enrollments.length}</p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Average Grade</h3>
                        <p className="text-2xl font-bold">{activityStats?.averageGrade || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Learning Hours</h3>
                        <p className="text-2xl font-bold">{activityStats?.totalLearningHours || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Academic Information</h3>
                      <div className="space-y-2">
                        <div>
                          <Label>Student ID</Label>
                          <p className="text-sm">{studentInfo.student_id}</p>
                        </div>
                        <div>
                          <Label>Education Level</Label>
                          <p className="text-sm capitalize">{studentInfo.education_level?.replace('_', ' ') || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label>Academic Track</Label>
                          <p className="text-sm capitalize">{studentInfo.academic_track?.replace('_', ' ') || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label>School</Label>
                          <p className="text-sm">{studentInfo.school?.name || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Learning Preferences</h3>
                      <div className="space-y-2">
                        <div>
                          <Label>Learning Style</Label>
                          <p className="text-sm capitalize">{user?.learning_style || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label>Study Habits</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user?.study_habits?.map((habit: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs capitalize">
                                {habit}
                              </Badge>
                            )) || 'None specified'}
                          </div>
                        </div>
                        <div>
                          <Label>Academic Goals</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user?.academic_goals?.map((goal: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs capitalize">
                                {goal.replace('-', ' ')}
                              </Badge>
                            )) || 'None specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setShowEditProfile(true)}>
                Update Learning Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>
                Courses you're currently enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="overflow-hidden">
                      <div className="h-2 bg-primary" />
                      <CardHeader>
                        <CardTitle className="text-base">{enrollment.course.title}</CardTitle>
                        <CardDescription>{enrollment.course.code}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="font-medium">{enrollment.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full"
                              style={{ width: `${enrollment.progress_percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Grade:</span>
                            <span className="font-medium">
                              {enrollment.grade ? `${enrollment.grade}/100 (${enrollment.grade_letter})` : 'Not graded'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline" className="text-xs">{enrollment.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">Continue Learning</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You're not enrolled in any courses yet.</p>
                  <Button variant="outline" className="mt-4">Explore Courses</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Achievements</CardTitle>
              <CardDescription>
                Badges, milestones, and accomplishments in your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="border rounded-lg p-4 text-center flex flex-col items-center hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <span className="text-2xl" dangerouslySetInnerHTML={{ __html: achievement.icon }} />
                      </div>
                      <h3 className="font-medium">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {new Date(achievement.awarded_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't earned any achievements yet.</p>
                  <Button variant="outline" className="mt-4">Start Learning</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <EditProfile
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={() => {
            fetchData();
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
};

// Generic User Profile Component (for other user types)
const GenericUserProfile = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
            <AvatarFallback className="text-lg bg-primary/5">{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-muted-foreground capitalize">{user?.user_type}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowEditProfile(true)}
          variant="outline"
          size="sm"
          className="gap-1 h-9"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('editProfile') || 'Edit Profile'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <p className="text-sm">{user?.full_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{user?.email}</p>
              </div>
              <div>
                <Label>Username</Label>
                <p className="text-sm">{user?.username}</p>
              </div>
              <div>
                <Label>User Type</Label>
                <p className="text-sm capitalize">{user?.user_type}</p>
              </div>
              <div>
                <Label>Preferred Language</Label>
                <p className="text-sm">
                  {user?.locale === 'ar' ? 'Arabic' : user?.locale === 'fr' ? 'French' : 'English'}
                </p>
              </div>
              <div>
                <Label>Account Created</Label>
                <p className="text-sm">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowEditProfile(true)}
          >
            Edit Profile
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <EditProfile
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
};

// Professor Profile Component
const ProfessorProfile = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [professorInfo, setProfessorInfo] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch professor profile info
      const profileData = await ProfileService.getProfessorInfo(user?.id);
      setProfessorInfo(profileData);

      // Fetch multiple data types in parallel
      const [coursesData, studentsData, assignmentsData] = await Promise.all([
        ProfileService.getProfessorCourses(user?.id),
        ProfileService.getProfessorStudents(user?.id),
        ProfileService.getProfessorAssignments(user?.id)
      ]);

      setCourses(coursesData);
      setStudents(studentsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching professor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
            <AvatarFallback className="text-lg bg-primary/5">{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-muted-foreground">{professorInfo?.title || ''} Professor</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{professorInfo?.academic_rank || ''}</Badge>
              <Badge variant="outline" className="capitalize">{professorInfo?.department?.name || 'No Department'}</Badge>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowEditProfile(true)}
          variant="outline"
          size="sm"
          className="gap-1 h-9"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t('editProfile') || 'Edit Profile'}
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Professor Overview</CardTitle>
              <CardDescription>
                Your academic profile and teaching information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {professorInfo && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Book className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Courses</h3>
                        <p className="text-2xl font-bold">{courses.length}</p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Students</h3>
                        <p className="text-2xl font-bold">{professorInfo.studentCount || 0}</p>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Teaching Hours</h3>
                        <p className="text-2xl font-bold">{professorInfo.teachingHours || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Academic Information</h3>
                      <div className="space-y-2">
                        <div>
                          <Label>Academic Rank</Label>
                          <p className="text-sm">{professorInfo.academic_rank}</p>
                        </div>
                        <div>
                          <Label>Department</Label>
                          <p className="text-sm">{professorInfo.department?.name || 'Not assigned'}</p>
                        </div>
                        <div>
                          <Label>Specializations</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {professorInfo.specializations?.map((spec: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            )) || 'None specified'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Contact Information</h3>
                      <div className="space-y-2">
                        <div>
                          <Label>Office Location</Label>
                          <p className="text-sm">{professorInfo.office_location || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label>Office Hours</Label>
                          <p className="text-sm">
                            {professorInfo.office_hours && Object.entries(professorInfo.office_hours).length > 0
                              ? Object.entries(professorInfo.office_hours).map(([day, hours]: [string, any]) =>
                                  `${day}: ${hours}`
                                ).join(', ')
                              : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <Label>Teaching Languages</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {professorInfo.teaching_languages?.map((lang: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {lang === 'ar' ? 'Arabic' : lang === 'fr' ? 'French' : 'English'}
                              </Badge>
                            )) || 'None specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>
                Courses you're currently teaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden">
                      <div className="h-2 bg-primary" />
                      <CardHeader>
                        <CardTitle className="text-base">{course.title}</CardTitle>
                        <CardDescription>{course.code}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Students:</span>
                            <span className="font-medium">{course.studentCount || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Academic Year:</span>
                            <span className="font-medium">{course.academic_year}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Education Level:</span>
                            <span className="font-medium capitalize">{course.education_level.replace('_', ' ')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">{course.status}</Badge>
                            {course.ai_tutoring_enabled && (
                              <Badge variant="secondary" className="text-xs">AI Tutoring</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">Manage Course</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You don't have any courses assigned yet.</p>
                  <Button variant="outline" className="mt-4">Request New Course</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Students</CardTitle>
              <CardDescription>
                Students enrolled in your courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {students.map((student: any) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{student.name}</div>
                                  <div className="text-xs text-muted-foreground">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{student.course}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={student.status === 'enrolled' ? 'outline' : student.status === 'completed' ? 'secondary' : 'destructive'}>
                                {student.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {student.grade ? (
                                <div className="flex items-center">
                                  <span className="text-sm font-medium mr-2">{student.grade}/100</span>
                                  {student.grade_letter && (
                                    <Badge variant="secondary" className="text-xs">{student.grade_letter}</Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not graded</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">View</Button>
                                <Button variant="outline" size="sm">Grade</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {students.length > 10 && (
                    <div className="flex justify-center mt-4">
                      <Button variant="outline">View All Students</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students are currently enrolled in your courses.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                View your profile and account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <p className="text-sm">{user?.full_name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <p className="text-sm">{professorInfo?.title}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm">{user?.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Office Location</Label>
                    <p className="text-sm">{professorInfo?.office_location || 'Not specified'}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>Teaching Preferences</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>AI Collaboration</Label>
                      <p className="text-sm">{professorInfo?.ai_collaboration_preferences?.status || 'Not configured'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Tutoring Availability</Label>
                      <Badge variant={professorInfo?.tutoring_availability ? "outline" : "secondary"}>
                        {professorInfo?.tutoring_availability ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>Security</Label>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed: {user?.password_updated_at || 'Unknown'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowEditProfile(true)}>Change Password</Button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={() => setShowEditProfile(true)}>Edit Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <EditProfile
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={() => {
            fetchData();
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
};

export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div className="container py-8">
      <UserConditionalComponent
        admin={<AdminProfile />}
        teacher={<ProfessorProfile />}
        student={<StudentProfile />}
        fallback={<GenericUserProfile />}
      />
    </div>
  );
};
