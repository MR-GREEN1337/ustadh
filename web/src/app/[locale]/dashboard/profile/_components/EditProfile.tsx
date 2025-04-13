// @/app/[locale]/dashboard/profile/_components/EditProfile.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from '@/i18n/client';
import UserConditionalComponent from '@/components/UserConditionalComponent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Check, Save, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileService } from '@/services/ProfileService';
import { getInitials } from '@/lib/utils';
import fileService from '@/services/FileService';

// Types for profile edit
interface ProfileFormState {
  full_name: string;
  email: string;
  username: string;
  locale: string;
  avatar?: File | null;
  bio?: string;
  // Additional fields based on user type
  [key: string]: any;
}

const EditProfile = ({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const isRTL = locale === "ar";
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const [formState, setFormState] = useState<ProfileFormState>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
    locale: user?.locale || 'ar',
    bio: user?.bio || '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Effect to reset form when user changes
  useEffect(() => {
    if (user) {
      setFormState({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        locale: user.locale || 'ar',
        bio: user.bio || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload for avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset any previous errors
    setAvatarUploadError(null);

    // Validate file type client-side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarUploadError(t('invalidFileType') || 'Invalid file type. Please use JPEG, PNG, GIF or WebP images.');
      return;
    }

    // Validate file size client-side (2MB max)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setAvatarUploadError(t('fileTooLarge') || 'File too large. Maximum size is 2MB.');
      return;
    }

    // Set the file in the form state
    setFormState(prev => ({ ...prev, avatar: file }));

    // Create preview immediately for UI feedback
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Try to upload right away for immediate feedback
    try {
      setIsAvatarUploading(true);

      // Check if we're online
      if (navigator.onLine) {
        const uploadResult = await fileService.uploadAvatar(file);

        // Update form state with the permanent URL
        setFormState(prev => ({
          ...prev,
          avatar_url: uploadResult.permanent_url || uploadResult.url
        }));
      } else {
        // We're offline, store locally and will sync later
        await fileService.storeAvatarLocally(file);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarUploadError(t('avatarUploadError') || 'Failed to upload avatar. You can still save your profile changes.');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare form data with proper handling for the avatar URL
      const formData: Record<string, any> = {
        ...formState,
      };

      // Remove the File object from formData
      if (formData.avatar instanceof File) {
        delete formData.avatar;
      }

      // Call API to update profile
      const updatedUser = await ProfileService.updateProfile(formData);

      // If we have role-specific data, update it separately
      if (user?.user_type === 'teacher' || user?.user_type === 'professor') {
        // Extract professor-specific fields
        const professorData = {
          title: formState.title,
          academic_rank: formState.academic_rank,
          specializations: formState.specializations,
          office_location: formState.office_location,
          office_hours: formState.office_hours,
          tutoring_availability: formState.tutoring_availability
        };

        await ProfileService.updateProfessorProfile(professorData);
      } else if (user?.user_type === 'student') {
        // Extract student-specific fields
        const studentData = {
          education_level: formState.education_level,
          academic_track: formState.academic_track,
          learning_style: formState.learning_style,
          study_habits: formState.study_habits,
          academic_goals: formState.academic_goals
        };

        await ProfileService.updateStudentProfile(studentData);
      }

      // If password fields are filled, update password
      if (formState.current_password && formState.new_password) {
        if (formState.new_password !== formState.confirm_password) {
          setError(t('passwordsMismatch') || 'New passwords do not match');
          setIsLoading(false);
          return;
        }

        await ProfileService.changePassword({
          current_password: formState.current_password,
          new_password: formState.new_password
        });
      }

      // Update local user context
      if (updateUser && updatedUser) {
        updateUser(updatedUser);
      }

      // Try to sync any offline files now that we're online
      if (navigator.onLine) {
        try {
          await fileService.syncOfflineFiles();
        } catch (syncError) {
          console.warn('Failed to sync offline files:', syncError);
        }
      }

      // Show success message
      setSuccess(t('profileUpdated') || 'Profile successfully updated');

      // Callback for success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(t('updateError') || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Common profile fields for all user types
  const BasicProfileFields = () => (
<div className="flex flex-col items-center mb-6">
  <div className="relative group mb-4">
    <Avatar className="h-24 w-24">
      <AvatarImage src={avatarPreview || ''} alt={formState.full_name} />
      <AvatarFallback className="text-xl">{getInitials(formState.full_name)}</AvatarFallback>

      {/* Loading overlay */}
      {isAvatarUploading && (
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      )}

      {/* Upload button overlay */}
      {!isAvatarUploading && (
        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <label htmlFor="avatar-upload" className="cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <Upload className="h-5 w-5 text-white" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isAvatarUploading}
            />
          </label>
        </div>
      )}
    </Avatar>
  </div>

  <label htmlFor="avatar-upload" className={`text-sm ${isAvatarUploading ? 'text-muted-foreground' : 'text-muted-foreground cursor-pointer hover:text-primary'} transition-colors`}>
    {isAvatarUploading
      ? (t('uploadingAvatar') || 'Uploading avatar...')
      : (t('changeAvatar') || 'Change avatar')}
  </label>

  {/* Avatar upload error message */}
  {avatarUploadError && (
    <Alert variant="destructive" className="mt-2 py-2">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-xs">{avatarUploadError}</AlertDescription>
    </Alert>
  )}
</div>
  );

  // Admin-specific profile fields
  const AdminProfileFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin_title">{t('adminTitle') || 'Administrative Title'}</Label>
        <Input
          id="admin_title"
          name="admin_title"
          value={formState.admin_title || ''}
          onChange={handleInputChange}
          placeholder={t('enterAdminTitle') || 'E.g. School Principal, IT Administrator'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">{t('contactPhone') || 'Contact Phone'}</Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            value={formState.contact_phone || ''}
            onChange={handleInputChange}
            placeholder={t('enterPhone') || 'Enter phone number'}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="office_hours">{t('officeHours') || 'Office Hours'}</Label>
          <Input
            id="office_hours"
            name="office_hours"
            value={formState.office_hours || ''}
            onChange={handleInputChange}
            placeholder={t('enterOfficeHours') || 'E.g. Mon-Fri, 9am-5pm'}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="notifications_enabled"
          checked={formState.notifications_enabled || false}
          onCheckedChange={(checked) =>
            setFormState(prev => ({ ...prev, notifications_enabled: checked }))
          }
        />
        <Label htmlFor="notifications_enabled">
          {t('enableNotifications') || 'Enable administrative notifications'}
        </Label>
      </div>
    </div>
  );

  // Teacher/Professor-specific profile fields
  const TeacherProfileFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t('academicTitle') || 'Academic Title'}</Label>
          <Select
            value={formState.title || ''}
            onValueChange={(value) => handleSelectChange('title', value)}
          >
            <SelectTrigger id="title">
              <SelectValue placeholder={t('selectTitle') || 'Select title'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Prof.">{t('professor') || 'Professor'}</SelectItem>
              <SelectItem value="Dr.">{t('doctor') || 'Doctor'}</SelectItem>
              <SelectItem value="Mr.">{t('mister') || 'Mr.'}</SelectItem>
              <SelectItem value="Mrs.">{t('missus') || 'Mrs.'}</SelectItem>
              <SelectItem value="Ms.">{t('miss') || 'Ms.'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="academic_rank">{t('academicRank') || 'Academic Rank'}</Label>
          <Select
            value={formState.academic_rank || ''}
            onValueChange={(value) => handleSelectChange('academic_rank', value)}
          >
            <SelectTrigger id="academic_rank">
              <SelectValue placeholder={t('selectRank') || 'Select rank'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professor">{t('fullProfessor') || 'Full Professor'}</SelectItem>
              <SelectItem value="Associate Professor">{t('associateProfessor') || 'Associate Professor'}</SelectItem>
              <SelectItem value="Assistant Professor">{t('assistantProfessor') || 'Assistant Professor'}</SelectItem>
              <SelectItem value="Lecturer">{t('lecturer') || 'Lecturer'}</SelectItem>
              <SelectItem value="Instructor">{t('instructor') || 'Instructor'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specializations">{t('specializations') || 'Specializations'}</Label>
        <Input
          id="specializations"
          name="specializations"
          value={formState.specializations || ''}
          onChange={handleInputChange}
          placeholder={t('enterSpecializations') || 'E.g. Mathematics, Physics (comma separated)'}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t('specializationsHint') || 'Enter your areas of expertise, separated by commas'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="office_location">{t('officeLocation') || 'Office Location'}</Label>
        <Input
          id="office_location"
          name="office_location"
          value={formState.office_location || ''}
          onChange={handleInputChange}
          placeholder={t('enterOfficeLocation') || 'E.g. Building A, Room 101'}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('teachingLanguages') || 'Teaching Languages'}</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['ar', 'fr', 'en'].map(lang => (
            <Badge
              key={lang}
              variant={formState.teaching_languages?.includes(lang) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                const current = formState.teaching_languages || [];
                const updated = current.includes(lang)
                  ? current.filter(l => l !== lang)
                  : [...current, lang];
                setFormState(prev => ({ ...prev, teaching_languages: updated }));
              }}
            >
              {lang === 'ar' ? (t('arabic') || 'Arabic') :
               lang === 'fr' ? (t('french') || 'French') :
               (t('english') || 'English')}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="tutoring_availability"
          checked={formState.tutoring_availability || false}
          onCheckedChange={(checked) =>
            setFormState(prev => ({ ...prev, tutoring_availability: checked }))
          }
        />
        <Label htmlFor="tutoring_availability">
          {t('tutoringAvailability') || 'Available for AI tutoring assistance'}
        </Label>
      </div>
    </div>
  );

  // Student-specific profile fields
  const StudentProfileFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="education_level">{t('educationLevel') || 'Education Level'}</Label>
          <Select
            value={formState.education_level || ''}
            onValueChange={(value) => handleSelectChange('education_level', value)}
          >
            <SelectTrigger id="education_level">
              <SelectValue placeholder={t('selectEducationLevel') || 'Select education level'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary_1">{t('primary1') || 'Primary 1'}</SelectItem>
              <SelectItem value="primary_2">{t('primary2') || 'Primary 2'}</SelectItem>
              <SelectItem value="primary_3">{t('primary3') || 'Primary 3'}</SelectItem>
              <SelectItem value="primary_4">{t('primary4') || 'Primary 4'}</SelectItem>
              <SelectItem value="primary_5">{t('primary5') || 'Primary 5'}</SelectItem>
              <SelectItem value="primary_6">{t('primary6') || 'Primary 6'}</SelectItem>
              <SelectItem value="college_7">{t('college7') || 'College 7'}</SelectItem>
              <SelectItem value="college_8">{t('college8') || 'College 8'}</SelectItem>
              <SelectItem value="college_9">{t('college9') || 'College 9'}</SelectItem>
              <SelectItem value="tronc_commun">{t('troncCommun') || 'Tronc Commun'}</SelectItem>
              <SelectItem value="bac_1">{t('bac1') || 'BAC 1'}</SelectItem>
              <SelectItem value="bac_2">{t('bac2') || 'BAC 2'}</SelectItem>
              <SelectItem value="university">{t('university') || 'University'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="academic_track">{t('academicTrack') || 'Academic Track'}</Label>
          <Select
            value={formState.academic_track || ''}
            onValueChange={(value) => handleSelectChange('academic_track', value)}
          >
            <SelectTrigger id="academic_track">
              <SelectValue placeholder={t('selectAcademicTrack') || 'Select academic track'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sciences_math_a">{t('sciencesMathA') || 'Sciences Math A'}</SelectItem>
              <SelectItem value="sciences_math_b">{t('sciencesMathB') || 'Sciences Math B'}</SelectItem>
              <SelectItem value="svt_pc">{t('svtPc') || 'SVT-PC'}</SelectItem>
              <SelectItem value="lettres_phil">{t('lettresPhil') || 'Lettres & Philosophy'}</SelectItem>
              <SelectItem value="uni_medicine">{t('uniMedicine') || 'University - Medicine'}</SelectItem>
              <SelectItem value="uni_fst">{t('uniFst') || 'University - FST'}</SelectItem>
              <SelectItem value="uni_fsa">{t('uniFsa') || 'University - FSA'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('learningStyle') || 'Learning Style'}</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['visual', 'auditory', 'reading', 'kinesthetic'].map(style => (
            <Badge
              key={style}
              variant={formState.learning_style === style ? "default" : "outline"}
              className="cursor-pointer text-center"
              onClick={() => setFormState(prev => ({ ...prev, learning_style: style }))}
            >
              {style === 'visual' ? (t('visual') || 'Visual') :
               style === 'auditory' ? (t('auditory') || 'Auditory') :
               style === 'reading' ? (t('reading') || 'Reading') :
               (t('kinesthetic') || 'Kinesthetic')}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('studyHabits') || 'Study Habits'}</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {['morning', 'evening', 'concentrated', 'spaced', 'group', 'individual'].map(habit => (
            <Badge
              key={habit}
              variant={formState.study_habits?.includes(habit) ? "default" : "outline"}
              className="cursor-pointer text-center"
              onClick={() => {
                const current = formState.study_habits || [];
                const updated = current.includes(habit)
                  ? current.filter(h => h !== habit)
                  : [...current, habit];
                setFormState(prev => ({ ...prev, study_habits: updated }));
              }}
            >
              {habit === 'morning' ? (t('morning') || 'Morning') :
               habit === 'evening' ? (t('evening') || 'Evening') :
               habit === 'concentrated' ? (t('concentrated') || 'Concentrated') :
               habit === 'spaced' ? (t('spaced') || 'Spaced') :
               habit === 'group' ? (t('group') || 'Group') :
               (t('individual') || 'Individual')}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  // Security tab content - for password change
  const SecurityFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current_password">{t('currentPassword') || 'Current Password'}</Label>
        <Input
          id="current_password"
          name="current_password"
          type="password"
          value={formState.current_password || ''}
          onChange={handleInputChange}
          placeholder="••••••••"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="new_password">{t('newPassword') || 'New Password'}</Label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            value={formState.new_password || ''}
            onChange={handleInputChange}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">{t('confirmPassword') || 'Confirm Password'}</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            value={formState.confirm_password || ''}
            onChange={handleInputChange}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg mt-2">
        <p className="text-sm text-muted-foreground">
          {t('passwordRequirements') || 'Password should be at least 8 characters and include uppercase, lowercase, number, and special character.'}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editProfile') || 'Edit Profile'}</DialogTitle>
          <DialogDescription>
            {t('editProfileDescription') || 'Update your profile information and preferences'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
              <TabsTrigger value="basic">{t('basicInfo') || 'Basic Info'}</TabsTrigger>
              <TabsTrigger value="role">{t('roleSpecific') || 'Role Details'}</TabsTrigger>
              <TabsTrigger value="security">{t('security') || 'Security'}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <BasicProfileFields />
            </TabsContent>

            <TabsContent value="role" className="space-y-4 mt-4">
              <UserConditionalComponent
                admin={<AdminProfileFields />}
                teacher={<TeacherProfileFields />}
                student={<StudentProfileFields />}
                fallback={<div className="py-8 text-center text-muted-foreground">{t('noRoleSpecificSettings') || 'No role-specific settings available.'}</div>}
              />
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <SecurityFields />
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('saving') || 'Saving...'}
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('saveChanges') || 'Save Changes'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfile;
