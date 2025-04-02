export const defaultLocale = 'en';
export const locales = ['en', 'fr', 'ar'];
export type Locale = (typeof locales)[number];

export const getDirection = (locale: Locale) => {
  return locale === 'ar' ? 'rtl' : 'ltr';
};

// Dictionary type for translations
export type Dictionary = {
  // Common
  appName: string;
  loading: string;
  error: string;
  success: string;

  // Auth pages
  login: string;
  register: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  userType: string;
  student: string;
  parent: string;
  gradeLevel: string;
  schoolType: string;
  loginAs: string;
  createAccount: string;
  alreadyHaveAccount: string;
  forgotPassword: string;
  resetPassword: string;
  submit: string;
  logout: string;
  primary: string;
  middle: string;
  highSchool: string;

  // Form validations
  required: string;
  invalidEmail: string;
  passwordMismatch: string;
  passwordLength: string;

  // Dashboard
  dashboard: string;
  welcome: string;
  subjects: string;
  progress: string;
  recommendations: string;
  schedule: string;
  startLearning: string;
  continueStudying: string;

  // Student specific
  myTutors: string;
  mySubjects: string;
  startSession: string;
  resumeSession: string;

  // Parent specific
  myChildren: string;
  addChild: string;
  childProgress: string;

  // Error messages
  loginFailed: string;
  registrationFailed: string;
  networkError: string;
};
