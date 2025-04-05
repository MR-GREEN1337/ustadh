export type UserType = "student" | "teacher" | "parent" | "admin";

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
  return subjects.filter(subject =>
    // Match education level
    subject.grade_level === user.education_level &&
    // For high school/university, match academic track if available
    (!user.academic_track || !subject.academic_track ||
     subject.academic_track === user.academic_track)
  );
}
