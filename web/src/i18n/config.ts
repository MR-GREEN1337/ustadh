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
    search: string;

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

    // Registration additional fields
    childrenCount: string;
    optionalField: string;
    parentAccountInfo: string;
    studentAccountInfo: string;
    parentFeatures: string;
    trackProgress: string;
    receiveReports: string;
    communicateTeachers: string;
    manageAccounts: string;

    // Dashboard & Navigation
    dashboard: string;
    welcome: string;
    profile: string;
    settings: string;

    // Sidebar Navigation
    subjects: string;
    mySubjects: string;
    startSession: string;
    resumeSession: string;
    schedule: string;
    progress: string;
    analytics: string;
    achievements: string;
    reports: string;
    messages: string;
    inbox: string;
    notifications: string;
    myChildren: string;
    addChild: string;
    manageChildren: string;
    childProgress: string;
    learning: string;
    studySessions: string;

    // Student specific
    myTutors: string;
    startLearning: string;
    continueStudying: string;
    recommendations: string;

    // Error messages
    loginFailed: string;
    registrationFailed: string;
    networkError: string;

    studentLoginInfo: string;
    parentLoginInfo: string;
    dontHaveAccount: string;

    gradeLevelDesc: string;
    public: string;
    private: string;
    homeschool: string;
    online: string;

    // Not Found Page
    notFoundTitle: string;
    notFoundDescription: string;
    backToHome: string;
    errorCode: string;
    searchSuggestion: string;

    // Common translations
    retry: string,

    theme: string,
    light: string,
    dark: string,
    system: string,
    language: string
};
