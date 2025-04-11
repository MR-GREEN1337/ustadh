export type UserType = "student" | "teacher" | "parent" | "admin" | "school_admin" | "professor" | "school_staff";

export type SchoolData = {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  region: string;
  school_type: string;
  education_levels: string[];
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  logo_url?: string;
  color_scheme?: string;
  subscription_type?: string;
  subscription_expires?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type User = {
  id: number;
  email: string;
  username: string;
  full_name: string;
  user_type: UserType;
  avatar?: string;
  locale: string;

  // Enhanced education fields based on onboarding
  education_level?: string;
  school_type?: string;
  school_name?: string;
  region?: string;
  academic_track?: string;

  // School admin related fields
  school?: SchoolData;
  school_id?: number;
  school_profile?: {
    contact_phone?: string;
    staff_type?: string;
    is_teacher?: boolean;
    department_id?: number;
  };

  // Learning preferences
  learning_style?: string;
  study_habits?: string[];
  academic_goals?: string[];

  // Status flags
  is_active: boolean;
  is_verified: boolean;
  has_onboarded: boolean;
  data_consent?: boolean;

  // Timestamps
  created_at: string;
  updated_at?: string;
  last_login?: string;
};

export type OnboardingFormData = {
  educationLevel: string;
  schoolType: string;
  region: string;
  filiere?: string;
  subjects: string[];
  learningStyle: string;
  studyHabits: string[];
  goals: string[];
  dataConsent: boolean;
};

export type Subject = {
  id: number;
  name: string;
  description: string;
  grade_level: string;
  icon?: string;
  color_scheme?: string;
  subject_code: string;
  teaching_language?: string;
  academic_track?: string;
  university_track?: string;
};

export type SubjectInterest = {
  id: number;
  user_id: number;
  subject_id: number;
  interest_level: number;
  created_at: string;
};

export type Enrollment = {
  id: number;
  user_id: number;
  subject_id: number;
  enrolled_at: string;
  active: boolean;
  completed: boolean;
  progress_percentage: number;
  completed_at?: string;
  last_activity_at?: string;
  progress_data?: Record<string, any>;
};

export type SchoolStaff = {
  id: number;
  user_id: number;
  school_id: number;
  staff_type: string;
  employee_id?: string;
  is_teacher: boolean;
  qualifications?: string[];
  expertise_subjects?: string[];
  hire_date?: string;
  is_active: boolean;
  work_email?: string;
  work_phone?: string;
  created_at: string;
  updated_at?: string;
};

export type SchoolProfessor = {
  id: number;
  user_id: number;
  school_id: number;
  title: string;
  department_id?: number;
  specializations: string[];
  academic_rank: string;
  tenure_status?: string;
  teaching_languages: string[];
  preferred_subjects: string[];
  education_levels: string[];
  office_location?: string;
  office_hours?: Record<string, any>;
  is_active: boolean;
  account_status: string;
  joined_at: string;
  last_active?: string;
};

export type OnboardingStatus = {
  school_id: number;
  profile_completed: boolean;
  departments_created: boolean;
  admin_staff_invited: boolean;
  professors_invited: boolean;
  courses_created: boolean;
  classes_created: boolean;
  students_imported: boolean;
  onboarding_completed: boolean;
  completion_percentage: number;
};

// Used for onboarding to dashboard navigation
export function mapOnboardingToUser(userId: number, data: OnboardingFormData): Partial<User> {
  return {
    id: userId,
    education_level: data.educationLevel,
    school_type: data.schoolType,
    region: data.region,
    academic_track: data.filiere,
    learning_style: data.learningStyle,
    study_habits: data.studyHabits,
    academic_goals: data.goals,
    has_onboarded: true,
    data_consent: data.dataConsent
  };
}

// Used for subject recommendation based on user profile
export function getRecommendedSubjects(
  subjects: Subject[],
  user: User
): Subject[] {
  // For school admins, provide a broader set of subjects based on school's education levels
  if (user.user_type === "school_admin" && user.school?.education_levels?.length) {
    return subjects.filter(subject =>
      user.school?.education_levels.some(level =>
        mapEducationLevelToGradeLevel(level).includes(subject.grade_level)
      )
    );
  }

  return subjects.filter(subject =>
    // Match education level
    subject.grade_level === user.education_level &&
    // For high school/university, match academic track if available
    (!user.academic_track || !subject.academic_track ||
     subject.academic_track === user.academic_track)
  );
}

// Helper function to map school education levels to specific grade levels
function mapEducationLevelToGradeLevel(level: string): string[] {
  switch(level) {
    case "primary":
      return ["primary_1", "primary_2", "primary_3", "primary_4", "primary_5", "primary_6"];
    case "college":
      return ["college_7", "college_8", "college_9"];
    case "lycee":
      return ["tronc_commun", "bac_1", "bac_2"];
    case "university":
      return ["university"];
    default:
      return [level];
  }
}
