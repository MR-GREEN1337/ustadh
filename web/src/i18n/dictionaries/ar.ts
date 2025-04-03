import { Dictionary } from '../config';

export const dictionary: Dictionary = {
    // Common
    appName: 'المُعلِّم الذكي',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجاح',

    // Auth pages
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    email: 'البريد الإلكتروني',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الكامل',
    userType: 'نوع المستخدم',
    student: 'طالب',
    parent: 'ولي أمر',
    gradeLevel: 'المستوى الدراسي',
    schoolType: 'نوع المدرسة',
    loginAs: 'تسجيل الدخول كـ',
    createAccount: 'إنشاء حساب',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    submit: 'إرسال',
    logout: 'تسجيل الخروج',
    primary: 'ابتدائي',
    middle: 'متوسط',
    highSchool: 'ثانوي',

    // Form validations
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'الرجاء إدخال بريد إلكتروني صحيح',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    passwordLength: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل',

    // Dashboard
    dashboard: 'لوحة التحكم',
    welcome: 'مرحباً، {name}!',
    subjects: 'المواد الدراسية',
    progress: 'التقدم',
    recommendations: 'التوصيات',
    schedule: 'الجدول',
    startLearning: 'ابدأ التعلم',
    continueStudying: 'استمر في الدراسة',

    // Student specific
    myTutors: 'المعلمين',
    mySubjects: 'موادي الدراسية',
    startSession: 'بدء جلسة',
    resumeSession: 'استئناف الجلسة',

    // Parent specific
    myChildren: 'أبنائي',
    addChild: 'إضافة ابن',
    childProgress: 'تقدم الابن',

    // Error messages
    loginFailed: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.',
    registrationFailed: 'فشل التسجيل. حاول مرة أخرى.',
    networkError: 'خطأ في الشبكة. يرجى التحقق من اتصالك.',

    childrenCount: 'عدد الأبناء',
    optionalField: 'حقل اختياري',
    parentAccountInfo: 'أنشئ حساب ولي أمر لمراقبة تقدم أبنائك وتلقي التحديثات.',
    studentAccountInfo: 'سجل كطالب للوصول إلى موارد التعلم وتتبع تقدمك.',
    parentFeatures: 'ميزات حساب ولي الأمر',
    trackProgress: 'تتبع التقدم الأكاديمي للأبناء',
    receiveReports: 'استلام تقارير أداء منتظمة',
    communicateTeachers: 'التواصل مع المعلمين',
    manageAccounts: 'إدارة حسابات الأبناء',

    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    search: 'بحث...',

    // Sidebar Navigation
    analytics: 'التحليلات',
    achievements: 'الإنجازات',
    reports: 'التقارير',
    messages: 'الرسائل',
    inbox: 'صندوق الوارد',
    notifications: 'الإشعارات',
    manageChildren: 'إدارة الأبناء',
    learning: 'التعلم',
    studySessions: 'جلسات الدراسة',

    studentLoginInfo: 'سجل الدخول للوصول إلى لوحة التحكم الشخصية ومواد الدراسة.',
    parentLoginInfo: 'سجل الدخول لمراقبة تقدم أبنائك والتواصل مع المعلمين.',
    dontHaveAccount: 'ليس لديك حساب؟',

    gradeLevelDesc: "أدخل رقمًا بين 0 و 12",
    public: "مدرسة حكومية",
    private: "مدرسة خاصة",
    homeschool: "تعليم منزلي",
    online: "مدرسة عبر الإنترنت",

    notFoundTitle: "الصفحة غير موجودة",
    notFoundDescription: "عذرًا، لم نتمكن من العثور على الصفحة التي تبحث عنها.",
    backToHome: "العودة إلى الصفحة الرئيسية",
    errorCode: "خطأ 404",
    searchSuggestion: "قد ترغب في التحقق من عنوان URL أو العودة إلى الصفحة الرئيسية.",

    // Common translations
    retry: "إعادة المحاولة",

    theme: "السمة",
    light: "فاتح",
    dark: "داكن",
    system: "النظام",
    language: "اللغة"
};
