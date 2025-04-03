import { Dictionary } from '../config';

export const dictionary: Dictionary = {
    // Common
    appName: 'Tuteur IA',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',

    // Auth pages
    login: 'Connexion',
    register: 'Inscription',
    email: 'Email',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    fullName: 'Nom complet',
    userType: 'Type d\'utilisateur',
    student: 'Étudiant',
    parent: 'Parent',
    gradeLevel: 'Niveau scolaire',
    schoolType: 'Type d\'école',
    loginAs: 'Se connecter en tant que',
    createAccount: 'Créer un compte',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    forgotPassword: 'Mot de passe oublié?',
    resetPassword: 'Réinitialiser le mot de passe',
    submit: 'Soumettre',
    logout: 'Déconnexion',
    primary: 'Primaire',
    middle: 'Collège',
    highSchool: 'Lycée',

    // Form validations
    required: 'Ce champ est obligatoire',
    invalidEmail: 'Veuillez entrer une adresse email valide',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    passwordLength: 'Le mot de passe doit contenir au moins 8 caractères',

    // Dashboard
    dashboard: 'Tableau de bord',
    welcome: 'Bienvenue, {name}!',
    subjects: 'Matières',
    progress: 'Progrès',
    recommendations: 'Recommandations',
    schedule: 'Emploi du temps',
    startLearning: 'Commencer à apprendre',
    continueStudying: 'Continuer à étudier',

    // Student specific
    myTutors: 'Mes tuteurs',
    mySubjects: 'Mes matières',
    startSession: 'Démarrer une session',
    resumeSession: 'Reprendre la session',

    // Parent specific
    myChildren: 'Mes enfants',
    addChild: 'Ajouter un enfant',
    childProgress: 'Progrès de l\'enfant',

    // Error messages
    loginFailed: 'Échec de la connexion. Veuillez vérifier vos identifiants.',
    registrationFailed: 'Échec de l\'inscription. Veuillez réessayer.',
    networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',

    childrenCount: 'Nombre d\'enfants',
    optionalField: 'Champ facultatif',
    parentAccountInfo: 'Créez un compte parent pour suivre les progrès de vos enfants et recevoir des mises à jour.',
    studentAccountInfo: 'Inscrivez-vous en tant qu\'étudiant pour accéder aux ressources d\'apprentissage et suivre vos progrès.',
    parentFeatures: 'Fonctionnalités du compte parent',
    trackProgress: 'Suivre les progrès académiques des enfants',
    receiveReports: 'Recevoir des rapports de performance réguliers',
    communicateTeachers: 'Communiquer avec les enseignants',
    manageAccounts: 'Gérer les comptes des enfants',

    // Header & Navigation
    profile: 'Profil',
    settings: 'Paramètres',
    search: 'Rechercher...',

    // Sidebar Navigation
    analytics: 'Analyses',
    achievements: 'Réalisations',
    reports: 'Rapports',
    messages: 'Messages',
    inbox: 'Boîte de réception',
    notifications: 'Notifications',
    manageChildren: 'Gérer les enfants',
    learning: 'Apprentissage',
    studySessions: 'Sessions d\'étude',

    studentLoginInfo: 'Connectez-vous pour accéder à votre tableau de bord d\'apprentissage personnalisé et à vos supports d\'étude.',
    parentLoginInfo: 'Connectez-vous pour suivre les progrès de vos enfants et communiquer avec les enseignants.',
    dontHaveAccount: 'Vous n\'avez pas de compte?',

    gradeLevelDesc: 'Entrez un nombre entre 0 et 12',
    public: 'École publique',
    private: 'École privée',
    homeschool: 'École à domicile',
    online: 'École en ligne',

    // Not Found Page
    notFoundTitle: "Page Non Trouvée",
    notFoundDescription: "Désolé, nous n'avons pas pu trouver la page que vous recherchez.",
    backToHome: "Retour à l'Accueil",
    errorCode: "Erreur 404",
    searchSuggestion: "Vous voudrez peut-être vérifier l'URL ou retourner à la page d'accueil.",

    // Common translations
    retry: "Réessayer",

    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
    language: "Langue"
};
