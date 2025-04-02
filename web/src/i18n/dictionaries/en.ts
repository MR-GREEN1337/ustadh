import { Dictionary } from '../config';

export const dictionary: Dictionary = {
  // Common
  appName: 'AI Tutor',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',

  // Auth pages
  login: 'Login',
  register: 'Register',
  email: 'Email',
  username: 'Username',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  fullName: 'Full Name',
  userType: 'User Type',
  student: 'Student',
  parent: 'Parent',
  gradeLevel: 'Grade Level',
  schoolType: 'School Type',
  loginAs: 'Login as',
  createAccount: 'Create Account',
  alreadyHaveAccount: 'Already have an account?',
  forgotPassword: 'Forgot Password?',
  resetPassword: 'Reset Password',
  submit: 'Submit',
  logout: 'Logout',
  primary: 'Primary',
  middle: 'Middle School',
  highSchool: 'High School',

  // Form validations
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  passwordMismatch: 'Passwords do not match',
  passwordLength: 'Password must be at least 8 characters',

  // Dashboard
  dashboard: 'Dashboard',
  welcome: 'Welcome, {name}!',
  subjects: 'Subjects',
  progress: 'Progress',
  recommendations: 'Recommendations',
  schedule: 'Schedule',
  startLearning: 'Start Learning',
  continueStudying: 'Continue Studying',

  // Student specific
  myTutors: 'My Tutors',
  mySubjects: 'My Subjects',
  startSession: 'Start Session',
  resumeSession: 'Resume Session',

  // Parent specific
  myChildren: 'My Children',
  addChild: 'Add Child',
  childProgress: 'Child Progress',

  // Error messages
  loginFailed: 'Login failed. Please check your credentials.',
  registrationFailed: 'Registration failed. Please try again.',
  networkError: 'Network error. Please check your connection.'
};
