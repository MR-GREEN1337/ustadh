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
  networkError: 'Erreur réseau. Veuillez vérifier votre connexion.'
};
