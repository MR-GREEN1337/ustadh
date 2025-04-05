export const defaultLocale = 'fr';
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
    language: string,
    courses: string,
    exploreTopics: string,
    chatMode: string,
    whiteboard: string,
    aiTutor: string,
    videoExplain: string,
    smartNotes: string,
    sessionHistory: string,
    practice: string,
    community: string,
    forums: string,
    studyGroups: string,
    leaderboard: string,
    monitorProgress: string,
    hello: string,
    explorer: string,
    whatDiscover: string,
    searchPlaceholder: string,
    explore: string,
    continueJourney: string,
    viewAll: string,
    continue: string,
    expandHorizons: string,
    connectsConcepts: string,
    and: string,
    curiosityQuestions: string,
    interactiveTools: string,
    new: string,
    chat: string,
    create: string,
    open: string,
    startExploration: string,
    whatAreYouCuriousAbout: string,
    defaultPrompt: string,
    tutorChat: string,
    recentSessions: string,
    exploreWithAI: string,
    newChat: string,
    suggestedTopics: string,
    startNewJourney: string,
    askAnything: string,
    typeMessage: string,
    connectedLearning: string,
    tutorAIDescription: string,
    nameYourChat: string,
    course: string,
    learnDashboard: string,
    learnDashboardDesc: string,
    searchTopics: string,
    noSubjectsEnrolled: string,
    browseSubjects: string,
    enrollSubjectsDesc: string,
    recommendedForYou: string,
    popularTopics: string,
    myLearning: string,
    weeklyGoal: string,
    activeDays: string,
    hours: string,
    exploreMore: string,
    completedTopics: string,
    upcomingSchedule: string,
    add: string,
    noUpcomingEvents: string,
    createSchedule: string,
    noUpcomingEventsDesc: string,
    viewFullSchedule: string,
    viewFullScheduleDesc: string,
    quickActions: string,
    askAITutor: string,
    exploreConcepts: string,
    checkProgress: string,
    back: string,
    exploreSubjects: string,
    filterByGrade: string,
    allGrades: string,
    allSubjects: string,
    enroll: string,
    noSubjectsFound: string,
    tryChangingFilters: string,
    showAllSubjects: string,
    aiTutoringHub: string,
    tutoringHubDesc: string,
    chooseTutor: string,
    comingSoon: string,
    available: string,
    notifyMe: string,
    aiChat: string,
    aiChatDesc: string,
    interactiveWhiteboard: string,
    whiteboardDesc: string,
    smartNotesDesc: string,
    conceptVideos: string,
    videosDesc: string,
    insightfulQuestions: string,
    discover: string,
    cosmicLearning: string,
    adaptiveLearning: string,
    adaptiveDesc: string,
    conceptMapping: string,
    mappingDesc: string,
    instantFeedback: string,
    feedbackDesc: string,
    unlockCosmos: string,
    cosmosDesc: string,
    beginJourney: string,
    overview: string,
    backToDashboard: string,
    videoExplainer: string,
    quote_Thomas_Berger: string,
    Thomas_Berger: string,
    hour: string,
    minutes: string,
    exploreCourses: string,
    filterBySubject: string,
    filterByLevel: string,
    allLevels: string,
    noCoursesFound: string,
    resetFilters: string,
    quote_mandela: string,
    Nelson_Mandela: string,
    onboarding: string,
    educationLevel: string,
    selectSchoolType: string,
    selectEducationLevel: string,
    region: string,
    selectRegion: string,
    moroccoCurriculum: string,
    curriculumInfo: string,
    favoriteSubjects: string,
    selectSubjectsDesc: string,
    academicGoals: string,
    selectGoalsDesc: string,
    learningStyle: string,
    learningStyleDesc: string,
    almostThere: string,
    studyHabits: string,
    studyHabitsDesc: string,
    almostReady: string,
    personalizedExperience: string,
    dataConsent: string,
    dataConsentDesc: string,
    submitting: string,
    startJourney: string,

    trendingTopics: string,
    searchSubjects: string,
    filterSubjects: string,
    filterDescription: string,
    interests: string,
    clearFilters: string,
    applyFilters: string,
    activeFilters: string,
    clearAll: string,
    showingResults: string,
    enrollNow: string,
    continueSubject: string,
    enrolled: string,
    personalizedRecommendations: string,
    recommendationsDescription: string,
    noRecommendations: string,
    browseAllSubjects: string,
    findMoreSubjects: string,
    completeProfile: string,
    updateProfile: string,
    trendingDescription: string,
    exploreSubject: string,
    noTrendingTopics: string,
    studyGroupsDescription: string,
    exploreGroups: string,
    practiceProblems: string,
    practiceDescription: string,
    startPracticing: string,
    education_quote_william_butler_yeats: string,
    william_butler_yeats: string,

    selectFiliere: string,
    filiere: string,
    academicTrack: string,
    academicTrackDesc: string,
    universitySpecialization: string,
    selectUniversitySpecialization: string,
    universityCourseDesc: string,
    filiereDesc: string,
    filiereNotApplicable: string,
    moroccanCurriculumDetailed: string,
    moroccanCurriculumDetailedDesc: string,

    completeYourProfile: string,
    onboardingReminder: string,
    continueSetup: string,

    onboardingComplete: string,
    profileUpdated: string,
    onboardingFailed: string,
    profileUpdateError: string,
    unexpectedError: string,

    onboardingNote: string,
    parentOnboardingNote: string,


};
