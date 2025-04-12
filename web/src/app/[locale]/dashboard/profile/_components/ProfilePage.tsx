// @/app/[locale]/dashboard/profile/_components/ProfilePage.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ProfileService } from '@/services/ProfileService';
import { getInitials } from '@/lib/utils';

// Admin Profile Component
const AdminProfile = () => {
  const { user } = useAuth();
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
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

    if (user) {
      fetchAdminData();
    }
  }, [user]);

  if (isLoading) return <div className="flex justify-center p-8">Loading admin profile...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
          <AvatarFallback className="text-lg">{getInitials(user?.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user?.full_name}</h1>
          <p className="text-muted-foreground">School Administrator</p>
          <Badge variant="outline" className="mt-1">{schoolInfo?.name || 'Loading...'}</Badge>
        </div>
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
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Teachers</h3>
                      <p className="text-2xl font-bold">{schoolInfo.staffCount || 0}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Students</h3>
                      <p className="text-2xl font-bold">{schoolInfo.studentCount || 0}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Classes</h3>
                      <p className="text-2xl font-bold">{schoolInfo.classCount || 0}</p>
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
                    <Input id="schoolName" defaultValue={schoolInfo?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input id="schoolCode" defaultValue={schoolInfo?.code} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" defaultValue={schoolInfo?.contact_email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" defaultValue={schoolInfo?.contact_phone} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button>Save Changes</Button>
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
                Update your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue={user?.full_name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user?.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user?.username} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Preferred Language</Label>
                    <Input id="language" defaultValue={user?.locale === 'ar' ? 'Arabic' : user?.locale === 'fr' ? 'French' : 'English'} />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button>Update Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Professor Profile Component
const ProfessorProfile = () => {
  const { user } = useAuth();
  const [professorInfo, setProfessorInfo] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfessorData = async () => {
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

    if (user) {
      fetchProfessorData();
    }
  }, [user]);

  if (isLoading) return <div className="flex justify-center p-8">Loading professor profile...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
          <AvatarFallback className="text-lg">{getInitials(user?.full_name)}</AvatarFallback>
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
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Courses</h3>
                      <p className="text-2xl font-bold">{courses.length}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Students</h3>
                      <p className="text-2xl font-bold">{professorInfo.studentCount || 0}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-1">Teaching Hours</h3>
                      <p className="text-2xl font-bold">{professorInfo.teachingHours || 0}</p>
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
                Update your profile and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue={user?.full_name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" defaultValue={professorInfo?.title} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={user?.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officeLocation">Office Location</Label>
                    <Input id="officeLocation" defaultValue={professorInfo?.office_location} />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>Teaching Preferences</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiCollaboration">AI Collaboration Preferences</Label>
                      <Input id="aiCollaboration" placeholder="Set your AI teaching preferences" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tutoringAvailability">Tutoring Availability</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="tutoringAvailability"
                          defaultChecked={professorInfo?.tutoring_availability}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="tutoringAvailability" className="text-sm">
                          Available for AI tutoring assistance
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button>Update Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Generic User Profile Component (for other user types)
const GenericUserProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.avatar || ''} alt={user?.full_name} />
          <AvatarFallback className="text-lg">{getInitials(user?.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user?.full_name}</h1>
          <p className="text-muted-foreground capitalize">{user?.user_type}</p>
        </div>
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
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Edit Profile</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Main Profile Page Component using UserConditionalComponent
const ProfilePage = () => {
  return (
    <div className="container py-8">
      <UserConditionalComponent
        admin={<AdminProfile />}
        teacher={<ProfessorProfile />}
        fallback={<GenericUserProfile />}
      />
    </div>
  );
};

export default ProfilePage;
