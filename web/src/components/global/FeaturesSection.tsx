import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Brain,
  Sparkles,
  MessageCircle,
  Building,
  Users,
  BarChart2,
  Globe,
  Clock,
  FileText,
  Video,
  PenTool,
  Bot,
  User,
  School,
  LineChart,
  Gauge,
  UserCheck,
  FileCheck,
  Settings2,
  Files,
  Bell,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Info
} from 'lucide-react';
import { useLocale } from '@/i18n/client';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Lightbulb icon for professor section
const Lightbulb = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

// Enhanced screenshot carousel with fullscreen capability
const ScreenshotCarousel = ({ userType, locale, isFullscreen = false }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isRTL = locale === 'ar';

  // Screenshot images for the carousel
  const screenshotImages: any = {
    student: [
      '/screenshots/student_dashboard.png',
      '/screenshots/student_ai_tutor.png',
      '/screenshots/student_whiteboard.png',
      '/screenshots/student_community.png'
    ],
    parent: [
      '/screenshots/parent_dashboard.png',
      '/screenshots/parent_progress.png',
      '/screenshots/parent_communication.png',
      '/screenshots/parent_resources.png'
    ],
    professor: [
      '/screenshots/professor_dashboard.png',
      '/screenshots/professor_analytics.png',
      '/screenshots/professor_ai_tools.png',
      '/screenshots/professor_class_management.png'
    ],
    admin: [
      '/screenshots/admin_dashboard.png',
      '/screenshots/admin_users.png',
      '/screenshots/admin_analytics.png',
      '/screenshots/admin_settings.png'
    ]
  };

  // Descriptions of screenshots for each user type (multilingual)
  const screenshotDescriptions: any = {
    en: {
      student: [
        "Personalized dashboard showing student progress, upcoming sessions and learning suggestions",
        "AI tutor interface with chat, contextual explanations and learning resources",
        "Interactive whiteboard for solving math problems with AI assistance",
        "Community forums and study groups for collaborative learning"
      ],
      parent: [
        "Overview of your children's academic progress with important alerts",
        "Detailed progression charts by subject and comparison with goals",
        "Messaging interface to communicate with teachers and track appointments",
        "Resource library to support learning at home"
      ],
      professor: [
        "Teacher dashboard with class summary, assignments to grade and events",
        "Advanced analytics of class performance and individual student insights",
        "AI tools to generate lesson plans, assignments and personalized assessments",
        "Simplified class management with attendance tracking and materials organization"
      ],
      admin: [
        "Complete administrative console for school supervision",
        "Centralized user management: students, teachers and staff",
        "Analytical dashboards to track overall academic performance",
        "System configuration to adapt the platform to specific needs"
      ]
    },
    fr: {
      student: [
        "Tableau de bord personnalisé montrant les progrès de l'étudiant, prochaines sessions et suggestions d'apprentissage",
        "Interface du tuteur IA avec chat, explications contextuelles et ressources d'apprentissage",
        "Tableau blanc interactif permettant de résoudre des problèmes mathématiques avec assistance IA",
        "Forums communautaires et groupes d'étude pour l'apprentissage collaboratif"
      ],
      parent: [
        "Vue d'ensemble des progrès académiques de vos enfants avec alertes importantes",
        "Graphiques détaillés de progression par matière et comparaison avec les objectifs",
        "Interface de messagerie pour communiquer avec les enseignants et suivre les rendez-vous",
        "Bibliothèque de ressources pour accompagner l'apprentissage à domicile"
      ],
      professor: [
        "Tableau de bord enseignant avec résumé des classes, devoirs à évaluer et événements",
        "Analyses avancées des performances de classe et individuelles des étudiants",
        "Outils IA pour générer des plans de cours, des devoirs et des évaluations personnalisées",
        "Gestion simplifiée des classes avec prise des présences et organisation des matériaux"
      ],
      admin: [
        "Console administrative complète pour la supervision de l'établissement",
        "Gestion centralisée des utilisateurs: étudiants, enseignants et personnel",
        "Tableaux de bord analytiques pour suivre les performances académiques globales",
        "Configuration système permettant d'adapter la plateforme aux besoins spécifiques"
      ]
    },
    ar: {
      student: [
        "لوحة تحكم مخصصة تعرض تقدم الطالب والجلسات القادمة واقتراحات التعلم",
        "واجهة المعلم الذكي مع الدردشة والشروحات السياقية وموارد التعلم",
        "لوحة بيضاء تفاعلية لحل مسائل الرياضيات بمساعدة الذكاء الاصطناعي",
        "منتديات مجتمعية ومجموعات دراسية للتعلم التعاوني"
      ],
      parent: [
        "نظرة عامة على التقدم الأكاديمي لأطفالك مع تنبيهات مهمة",
        "رسوم بيانية مفصلة للتقدم حسب المادة ومقارنة بالأهداف",
        "واجهة المراسلة للتواصل مع المعلمين ومتابعة المواعيد",
        "مكتبة موارد لدعم التعلم في المنزل"
      ],
      professor: [
        "لوحة تحكم المعلم مع ملخص الفصول والواجبات للتقييم والأحداث",
        "تحليلات متقدمة لأداء الفصل ورؤى فردية للطلاب",
        "أدوات الذكاء الاصطناعي لإنشاء خطط الدروس والواجبات والتقييمات المخصصة",
        "إدارة مبسطة للفصول مع تتبع الحضور وتنظيم المواد"
      ],
      admin: [
        "وحدة تحكم إدارية كاملة للإشراف على المدرسة",
        "إدارة مركزية للمستخدمين: الطلاب والمعلمين والموظفين",
        "لوحات تحكم تحليلية لتتبع الأداء الأكاديمي العام",
        "تكوين النظام لتكييف المنصة مع الاحتياجات المحددة"
      ]
    }
  };

  const images = screenshotImages[userType] || [];
  const descriptions = screenshotDescriptions[locale]?.[userType] || [];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Colors by user type
  const colors: any = {
    student: {
      primary: 'bg-emerald-600 dark:bg-emerald-700',
      secondary: 'bg-emerald-500 dark:bg-emerald-600',
      light: 'bg-emerald-100 dark:bg-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      gradient: 'from-emerald-50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10',
      shadow: 'shadow-emerald-500/20 dark:shadow-emerald-700/30'
    },
    parent: {
      primary: 'bg-blue-600 dark:bg-blue-700',
      secondary: 'bg-blue-500 dark:bg-blue-600',
      light: 'bg-blue-100 dark:bg-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      gradient: 'from-blue-50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10',
      shadow: 'shadow-blue-500/20 dark:shadow-blue-700/30'
    },
    professor: {
      primary: 'bg-amber-600 dark:bg-amber-700',
      secondary: 'bg-amber-500 dark:bg-amber-600',
      light: 'bg-amber-100 dark:bg-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      gradient: 'from-amber-50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10',
      shadow: 'shadow-amber-500/20 dark:shadow-amber-700/30'
    },
    admin: {
      primary: 'bg-purple-600 dark:bg-purple-700',
      secondary: 'bg-purple-500 dark:bg-purple-600',
      light: 'bg-purple-100 dark:bg-purple-800',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      gradient: 'from-purple-50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10',
      shadow: 'shadow-purple-500/20 dark:shadow-purple-700/30'
    }
  };

  const color = colors[userType] || colors.student;

  // Auto-advance slides with an interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isFullscreen) { // Only auto-advance when not in fullscreen
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isFullscreen]);

  return (
    <div className={`${isFullscreen ? 'h-full w-full p-4' : 'p-6'} rounded-xl relative overflow-hidden bg-gradient-to-br ${color.gradient} ${color.border} transition-all duration-300 ${isFullscreen ? '' : `shadow-lg ${color.shadow} hover:shadow-xl`}`}>
      <div className={`relative group h-full ${isFullscreen ? 'max-h-[85vh]' : 'h-[400px] md:h-[450px] lg:h-[500px]'} rounded-lg overflow-hidden border shadow-lg`}>
        {/* App Interface Header */}
        <div className={`h-12 ${color.primary} flex items-center px-4 relative z-10`}>
          <div className="text-white font-bold truncate">
            Ustadh | {
              locale === 'en' ? (
                userType === 'student' ? 'Student Interface' :
                userType === 'parent' ? 'Parent Dashboard' :
                userType === 'professor' ? 'Teacher Interface' :
                'Administrative Console'
              ) :
              locale === 'fr' ? (
                userType === 'student' ? 'Interface Étudiant' :
                userType === 'parent' ? 'Espace Parent' :
                userType === 'professor' ? 'Interface Professeur' :
                'Console Administrative'
              ) :
              locale === 'ar' ? (
                userType === 'student' ? 'واجهة الطالب' :
                userType === 'parent' ? 'لوحة تحكم الوالدين' :
                userType === 'professor' ? 'واجهة المعلم' :
                'وحدة التحكم الإدارية'
              ) : ''
            }
          </div>

          {!isFullscreen && (
            <DialogTrigger asChild>
              <button
                className="ml-auto text-white opacity-70 hover:opacity-100 focus:outline-none p-1 transition-opacity"
                aria-label="View fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </DialogTrigger>
          )}
        </div>

        {/* Screenshot Images */}
        <div className="absolute inset-0 w-full h-full">
          {images.map((src: any, idx: any) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Real image with placeholder fallback */}
              <img
                src={src || `/api/placeholder/800/600`}
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-full object-contain"
              />

              {/* Description overlay - positioned at bottom */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="text-center bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg backdrop-blur-sm max-w-lg mx-auto">
                  <div className="flex items-center justify-center mb-1">
                    <div className={`h-2 w-2 rounded-full ${color.secondary} mr-2`}></div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {locale === 'en' ? 'Screen' : locale === 'fr' ? 'Écran' : 'شاشة'} {idx + 1}/{images.length}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {descriptions[currentIndex] || ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={prevSlide}
          className={`rounded-full p-3 ${color.light} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 ${color.border}`}
          aria-label="Previous slide"
        >
          <ChevronLeft className={`h-5 w-5 ${color.text} ${isRTL ? 'transform rotate-180' : ''}`} />
        </button>

        <div className="flex space-x-2">
          {images.map((_: any, idx: any) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 transition-all ${
                idx === currentIndex
                  ? `w-8 ${color.secondary}`
                  : `w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-400`
              } rounded-full`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className={`rounded-full p-3 ${color.light} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 ${color.border}`}
          aria-label="Next slide"
        >
          <ChevronRight className={`h-5 w-5 ${color.text} ${isRTL ? 'transform rotate-180' : ''}`} />
        </button>
      </div>

      {/* Small indicator showing view type */}
      {!isFullscreen && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-2 right-2 text-xs opacity-70 flex items-center">
                <Info className="h-3 w-3 mr-1" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{locale === 'en' ? 'Click fullscreen icon to view larger' :
                  locale === 'fr' ? 'Cliquez sur l\'icône plein écran pour agrandir' :
                  'انقر على أيقونة ملء الشاشة للعرض بشكل أكبر'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

// Main features section component
const FeaturesSection = () => {
  const [locale, setLocale] = useState('fr');
  const appLocale = useLocale(); // Get locale from app context
  const isRTL = locale === 'ar';

  // Sync local locale state with app locale when available
  useEffect(() => {
    if (appLocale) {
      setLocale(appLocale);
    }
  }, [appLocale]);

  // Translation object for all user types and features
  const translations: any = {
    en: {
      title: "How Ustadh transforms your learning",
      userTypes: {
        student: "Students",
        parent: "Parents",
        professor: "Teachers",
        admin: "Administration"
      },
      features: {
        student: [
          {
            title: "Personalized AI Tutoring",
            description: "Receive customized teaching with our AI tutor that adapts to your learning style and understands your specific needs. The AI identifies your strengths and weaknesses to offer a truly personalized educational experience.",
            icon: <Bot className="h-5 w-5" />
          },
          {
            title: "Interactive Dashboard",
            description: "Visualize your progress, access your subjects and plan your study sessions in an intuitive interface. Your personal dashboard displays your upcoming classes, assignments due and study suggestions.",
            icon: <BarChart2 className="h-5 w-5" />
          },
          {
            title: "Multiple Learning Modes",
            description: "Engage in different learning modes: conversational chat, smart notes, interactive whiteboard and video explanations. Each tool is designed to strengthen understanding and memorization.",
            icon: <Sparkles className="h-5 w-5" />
          },
          {
            title: "Learning Community",
            description: "Join discussion forums, study groups and participate in rankings for a social and motivating learning experience. Collaborate with other students on projects or revisions.",
            icon: <Users className="h-5 w-5" />
          }
        ],
        parent: [
          {
            title: "Child Progress Tracking",
            description: "Easily monitor your children's academic performance with detailed reports on their progress, attendance and achievements. Receive regular updates on their learning activities.",
            icon: <LineChart className="h-5 w-5" />
          },
          {
            title: "Teacher Communication",
            description: "Maintain direct contact with your children's teachers via our integrated messaging system. Schedule meetings, discuss progress and receive feedback on their academic journey.",
            icon: <MessageCircle className="h-5 w-5" />
          },
          {
            title: "Educational Resources",
            description: "Access a library of resources to help you support your child's learning at home. Discover expert tips, complementary activities, and support strategies.",
            icon: <BookOpen className="h-5 w-5" />
          },
          {
            title: "Alerts & Notifications",
            description: "Stay informed about important events, assignments due, and performance through a customizable alert system. Never miss a crucial moment in your child's educational journey.",
            icon: <Bell className="h-5 w-5" />
          }
        ],
        professor: [
          {
            title: "AI Teaching Tools",
            description: "Use AI to create course content, customized assignments, and lesson plans tailored to your students' needs. The AI assistant helps you prepare high-quality teaching materials in less time.",
            icon: <Brain className="h-5 w-5" />
          },
          {
            title: "Learning Analytics",
            description: "Explore detailed data on classroom performance, student engagement, and teaching effectiveness. Identify trends and adjust your pedagogical approach based on insights.",
            icon: <Gauge className="h-5 w-5" />
          },
          {
            title: "Class & Course Management",
            description: "Organize your classes efficiently, track attendance, and manage assignments in a unified system. Assign tasks, grade work, and provide feedback with just a few clicks.",
            icon: <Files className="h-5 w-5" />
          },
          {
            title: "Student Insights",
            description: "Get detailed insights into each student, revealing their strengths, challenges, and learning patterns. This information allows you to tailor your teaching to individual needs.",
            icon: <Lightbulb className="h-5 w-5" />
          }
        ],
        admin: [
          {
            title: "Administrative Dashboard",
            description: "Oversee all school operations with an overview of academic performance, teacher engagement, and student progress. Make decisions based on real-time data.",
            icon: <Building className="h-5 w-5" />
          },
          {
            title: "User Management",
            description: "Efficiently manage student, teacher, and staff accounts. Assign roles, manage permissions, and ensure everyone has access to the resources they need.",
            icon: <UserCheck className="h-5 w-5" />
          },
          {
            title: "Academic Reporting",
            description: "Generate detailed reports on academic metrics, attendance, and overall institution performance. Export data for presentations or advanced analysis.",
            icon: <FileCheck className="h-5 w-5" />
          },
          {
            title: "Institution Configuration",
            description: "Customize the platform according to your institution's specific needs: departments, courses, schedules, and policies. Adapt the Ustadh experience to your unique educational vision.",
            icon: <Settings2 className="h-5 w-5" />
          }
        ]
      }
    },
    fr: {
      title: "Comment Ustadh transforme votre apprentissage",
      userTypes: {
        student: "Étudiants",
        parent: "Parents",
        professor: "Enseignants",
        admin: "Administration"
      },
      features: {
        student: [
          {
            title: "Tutorat IA personnalisé",
            description: "Bénéficiez d'un enseignement sur mesure avec notre tuteur IA qui s'adapte à votre style d'apprentissage et comprend vos besoins spécifiques. L'IA identifie vos forces et faiblesses pour offrir une expérience éducative vraiment personnalisée.",
            icon: <Bot className="h-5 w-5" />
          },
          {
            title: "Tableau de bord interactif",
            description: "Visualisez vos progrès, accédez à vos matières et planifiez vos sessions d'étude dans une interface intuitive. Votre tableau de bord personnel affiche vos cours à venir, devoirs à rendre et suggestions d'étude.",
            icon: <BarChart2 className="h-5 w-5" />
          },
          {
            title: "Modes d'apprentissage multiples",
            description: "Engagez-vous dans différents modes d'apprentissage : chat conversationnel, notes intelligentes, tableau blanc interactif et explications vidéo. Chaque outil est conçu pour renforcer la compréhension et la mémorisation.",
            icon: <Sparkles className="h-5 w-5" />
          },
          {
            title: "Communauté d'apprentissage",
            description: "Rejoignez les forums de discussion, les groupes d'étude et participez aux classements pour une expérience d'apprentissage sociale et motivante. Collaborez avec d'autres étudiants sur des projets ou des révisions.",
            icon: <Users className="h-5 w-5" />
          }
        ],
        parent: [
          {
            title: "Suivi des progrès de l'enfant",
            description: "Surveillez facilement les performances académiques de vos enfants avec des rapports détaillés sur leurs progrès, leur assiduité et leurs réussites. Recevez des mises à jour régulières sur leurs activités d'apprentissage.",
            icon: <LineChart className="h-5 w-5" />
          },
          {
            title: "Communication avec les enseignants",
            description: "Maintenez un contact direct avec les enseignants de vos enfants via notre système de messagerie intégré. Planifiez des réunions, discutez des progrès et recevez des commentaires sur leur parcours académique.",
            icon: <MessageCircle className="h-5 w-5" />
          },
          {
            title: "Ressources éducatives",
            description: "Accédez à une bibliothèque de ressources pour vous aider à soutenir l'apprentissage de votre enfant à la maison. Découvrez des conseils d'experts, des activités complémentaires et des stratégies de soutien.",
            icon: <BookOpen className="h-5 w-5" />
          },
          {
            title: "Alertes et notifications",
            description: "Restez informé des événements importants, des devoirs à rendre et des performances grâce à un système d'alerte personnalisable. Ne manquez jamais un moment crucial dans le parcours éducatif de votre enfant.",
            icon: <Bell className="h-5 w-5" />
          }
        ],
        professor: [
          {
            title: "Outils d'enseignement IA",
            description: "Utilisez l'IA pour créer du contenu de cours, des devoirs personnalisés et des plans de leçon adaptés aux besoins de vos élèves. L'assistant IA vous aide à préparer des matériaux pédagogiques de haute qualité en moins de temps.",
            icon: <Brain className="h-5 w-5" />
          },
          {
            title: "Analyses d'apprentissage",
            description: "Explorez des données détaillées sur les performances en classe, l'engagement des élèves et l'efficacité de l'enseignement. Identifiez les tendances et ajustez votre approche pédagogique en fonction des insights.",
            icon: <Gauge className="h-5 w-5" />
          },
          {
            title: "Gestion des classes et des cours",
            description: "Organisez vos classes efficacement, suivez l'assiduité et gérez les devoirs dans un système unifié. Assignez des tâches, notez les travaux et fournissez des commentaires en quelques clics.",
            icon: <Files className="h-5 w-5" />
          },
          {
            title: "Insights sur les élèves",
            description: "Obtenez des informations détaillées sur chaque élève, révélant leurs forces, leurs défis et leurs schémas d'apprentissage. Ces informations vous permettent d'adapter votre enseignement aux besoins individuels.",
            icon: <Lightbulb className="h-5 w-5" />
          }
        ],
        admin: [
          {
            title: "Tableau de bord administratif",
            description: "Supervisez toutes les opérations scolaires avec une vue d'ensemble des performances académiques, de l'engagement des enseignants et des progrès des élèves. Prenez des décisions basées sur des données en temps réel.",
            icon: <Building className="h-5 w-5" />
          },
          {
            title: "Gestion des utilisateurs",
            description: "Gérez efficacement les comptes des élèves, des enseignants et du personnel. Attribuez des rôles, gérez les autorisations et assurez-vous que chacun a accès aux ressources dont il a besoin.",
            icon: <UserCheck className="h-5 w-5" />
          },
          {
            title: "Rapports académiques",
            description: "Générez des rapports détaillés sur les métriques académiques, l'assiduité et la performance globale de l'établissement. Exportez des données pour des présentations ou des analyses avancées.",
            icon: <FileCheck className="h-5 w-5" />
          },
          {
            title: "Configuration de l'établissement",
            description: "Personnalisez la plateforme selon les besoins spécifiques de votre établissement : départements, cours, horaires et politiques. Adaptez l'expérience Ustadh à votre vision éducative unique.",
            icon: <Settings2 className="h-5 w-5" />
          }
        ]
      }
    },
    ar: {
      title: "كيف يحوّل أستاذ طريقة تعلّمك",
      userTypes: {
        student: "الطلاب",
        parent: "أولياء الأمور",
        professor: "المعلمون",
        admin: "الإدارة"
      },
      features: {
        student: [
          {
            title: "تدريس شخصي بالذكاء الاصطناعي",
            description: "احصل على تعليم مخصص مع معلمنا الذكي الذي يتكيف مع أسلوب تعلمك ويفهم احتياجاتك المحددة. يحدد الذكاء الاصطناعي نقاط قوتك وضعفك لتقديم تجربة تعليمية شخصية حقًا.",
            icon: <Bot className="h-5 w-5" />
          },
          {
            title: "لوحة تحكم تفاعلية",
            description: "قم بتصور تقدمك والوصول إلى موادك وتخطيط جلسات الدراسة الخاصة بك في واجهة بديهية. تعرض لوحة التحكم الشخصية فصولك القادمة والواجبات المستحقة واقتراحات الدراسة.",
            icon: <BarChart2 className="h-5 w-5" />
          },
          {
            title: "أوضاع تعلم متعددة",
            description: "انخرط في أوضاع تعلم مختلفة: محادثة تفاعلية، ملاحظات ذكية، لوحة بيضاء تفاعلية وشروحات فيديو. تم تصميم كل أداة لتعزيز الفهم والحفظ.",
            icon: <Sparkles className="h-5 w-5" />
          },
          {
            title: "مجتمع التعلم",
            description: "انضم إلى منتديات المناقشة ومجموعات الدراسة وشارك في التصنيفات للحصول على تجربة تعليمية اجتماعية ومحفزة. تعاون مع طلاب آخرين في المشاريع أو المراجعات.",
            icon: <Users className="h-5 w-5" />
          }
        ],
        parent: [
          {
            title: "تتبع تقدم الطفل",
            description: "راقب بسهولة الأداء الأكاديمي لأطفالك من خلال تقارير مفصلة عن تقدمهم وحضورهم وإنجازاتهم. تلقى تحديثات منتظمة حول أنشطة التعلم الخاصة بهم.",
            icon: <LineChart className="h-5 w-5" />
          },
          {
            title: "التواصل مع المعلمين",
            description: "حافظ على اتصال مباشر مع معلمي أطفالك عبر نظام المراسلة المتكامل لدينا. قم بجدولة الاجتماعات ومناقشة التقدم وتلقي الملاحظات حول رحلتهم الأكاديمية.",
            icon: <MessageCircle className="h-5 w-5" />
          },
          {
            title: "الموارد التعليمية",
            description: "الوصول إلى مكتبة من الموارد لمساعدتك في دعم تعلم طفلك في المنزل. اكتشف نصائح الخبراء والأنشطة التكميلية واستراتيجيات الدعم.",
            icon: <BookOpen className="h-5 w-5" />
          },
          {
            title: "التنبيهات والإشعارات",
            description: "ابق على اطلاع بالأحداث المهمة والواجبات المستحقة والأداء من خلال نظام التنبيه القابل للتخصيص. لا تفوت أبدًا لحظة حاسمة في رحلة طفلك التعليمية.",
            icon: <Bell className="h-5 w-5" />
          }
        ],
        professor: [
          {
            title: "أدوات التدريس بالذكاء الاصطناعي",
            description: "استخدم الذكاء الاصطناعي لإنشاء محتوى الدورة والواجبات المخصصة وخطط الدروس المصممة لاحتياجات طلابك. يساعدك مساعد الذكاء الاصطناعي على إعداد مواد تعليمية عالية الجودة في وقت أقل.",
            icon: <Brain className="h-5 w-5" />
          },
          {
            title: "تحليلات التعلم",
            description: "استكشف بيانات مفصلة حول أداء فصولك الدراسية ومشاركة الطلاب وفعالية التدريس. حدد الاتجاهات وعدّل نهجك التربوي بناءً على الرؤى.",
            icon: <Gauge className="h-5 w-5" />
          },
          {
            title: "إدارة الفصول والدورات",
            description: "نظم فصولك بكفاءة، وتتبع الحضور، وإدارة الواجبات في نظام موحد. قم بتعيين المهام وتقييم العمل وتقديم الملاحظات بنقرات قليلة فقط.",
            icon: <Files className="h-5 w-5" />
          },
          {
            title: "رؤى الطلاب",
            description: "احصل على رؤى مفصلة عن كل طالب، مما يكشف عن نقاط قوتهم وتحدياتهم وأنماط تعلمهم. تتيح لك هذه المعلومات تكييف تدريسك مع الاحتياجات الفردية.",
            icon: <Lightbulb className="h-5 w-5" />
          }
        ],
        admin: [
          {
            title: "لوحة المعلومات الإدارية",
            description: "أشرف على جميع العمليات المدرسية مع نظرة عامة على الأداء الأكاديمي ومشاركة المعلمين وتقدم الطلاب. اتخذ قرارات بناءً على بيانات في الوقت الفعلي.",
            icon: <Building className="h-5 w-5" />
          },
          {
            title: "إدارة المستخدمين",
            description: "قم بإدارة حسابات الطلاب والمعلمين والموظفين بكفاءة. قم بتعيين الأدوار وإدارة الأذونات والتأكد من وصول الجميع إلى الموارد التي يحتاجونها.",
            icon: <UserCheck className="h-5 w-5" />
          },
          {
            title: "التقارير الأكاديمية",
            description: "قم بإنشاء تقارير مفصلة عن المقاييس الأكاديمية والحضور وأداء المؤسسة العام. قم بتصدير البيانات للعروض التقديمية أو التحليل المتقدم.",
            icon: <FileCheck className="h-5 w-5" />
          },
          {
            title: "تكوين المؤسسة",
            description: "قم بتخصيص المنصة وفقًا لاحتياجات مؤسستك المحددة: الأقسام والدورات والجداول والسياسات. قم بتكييف تجربة أستاذ مع رؤيتك التعليمية الفريدة.",
            icon: <Settings2 className="h-5 w-5" />
          }
        ]
      }
    }
  };

  // Get translations for current locale
  const t = translations[locale] || translations.en;

  // Function to render user type content
  const renderUserTypeContent = (userType: string) => {
    // Colors by user type
    const colors: any = {
      student: {
        cardBorder: "border-emerald-100 dark:border-emerald-900",
        iconText: "text-emerald-600 dark:text-emerald-400",
        cardHover: "hover:border-emerald-300 dark:hover:border-emerald-700"
      },
      parent: {
        cardBorder: "border-blue-100 dark:border-blue-900",
        iconText: "text-blue-600 dark:text-blue-400",
        cardHover: "hover:border-blue-300 dark:hover:border-blue-700"
      },
      professor: {
        cardBorder: "border-amber-100 dark:border-amber-900",
        iconText: "text-amber-600 dark:text-amber-400",
        cardHover: "hover:border-amber-300 dark:hover:border-amber-700"
      },
      admin: {
        cardBorder: "border-purple-100 dark:border-purple-900",
        iconText: "text-purple-600 dark:text-purple-400",
        cardHover: "hover:border-purple-300 dark:hover:border-purple-700"
      }
    };

    return (
      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left section - Screenshot carousel in dialog for fullscreen option */}
        <div className="lg:w-1/2">
          <Dialog>
            {/* Regular view */}
            <ScreenshotCarousel userType={userType} locale={locale} />

            {/* Fullscreen view */}
            <DialogContent className="max-w-[90vw] w-auto max-h-[90vh] h-auto p-0">
              <DialogClose className="absolute right-4 top-4 z-50">
                <Button variant="ghost" size="icon" className="bg-slate-800/70 text-white hover:bg-slate-700/90">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
              <ScreenshotCarousel userType={userType} locale={locale} isFullscreen={true} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Right section - Features */}
        <div className="lg:w-1/2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t?.features?.[userType]?.map((feature: any, index: any) => (
              <Card
                key={index}
                className={`p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80 hover:shadow-md transition-all overflow-hidden group border ${colors[userType].cardBorder} ${colors[userType].cardHover}`}
              >
                <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${(colors as any)[userType].iconText} group-hover:scale-110 transition-transform shadow-sm`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">{feature.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className={`py-16 bg-white dark:bg-slate-900 relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} id="features">
      {/* Background decorative elements */}
      <div className="absolute top-10 right-10 opacity-20 dark:opacity-30 pointer-events-none">
        <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
          <path
            d="M20,70 C40,30 60,90 80,50 C90,30 100,70 120,50 C140,30 160,90 180,50"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            className="opacity-70"
          />
          <circle cx="80" cy="40" r="2" fill="currentColor" className="animate-pulse" style={{ animationDuration: '3s' }} />
          <circle cx="120" cy="40" r="2" fill="currentColor" className="animate-pulse" style={{ animationDuration: '4s' }} />
          <circle cx="160" cy="40" r="2" fill="currentColor" className="animate-pulse" style={{ animationDuration: '5s' }} />
        </svg>
      </div>

      <div className="absolute bottom-10 left-10 opacity-20 dark:opacity-30 pointer-events-none rotate-180">
        <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
          <path d="M90,10 L110,60 L160,60 L120,90 L140,140 L90,110 L40,140 L60,90 L20,60 L70,60 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <circle cx="90" cy="90" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="90" cy="90" r="60" fill="none" stroke="currentColor" strokeWidth="0.3" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8 relative">
          <h2 className={`text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4 ${locale === 'ar' ? 'font-[El_Messiri]' : ''}`}>
            {t?.title || (
              locale === 'en' ? "How Ustadh transforms your learning" :
              locale === 'fr' ? "Comment Ustadh transforme votre apprentissage" :
              locale === 'ar' ? "كيف يحوّل أستاذ طريقة تعلّمك" :
              "How Ustadh transforms your learning"
            )}
          </h2>

          <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full mb-6"></div>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <TabsTrigger
              value="student"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/60 dark:data-[state=active]:text-emerald-300 rounded-lg transition-all"
            >
              <User className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t.userTypes.student}
            </TabsTrigger>
            <TabsTrigger
              value="parent"
              className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/60 dark:data-[state=active]:text-blue-300 rounded-lg transition-all"
            >
              <Users className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t.userTypes.parent}
            </TabsTrigger>
            <TabsTrigger
              value="professor"
              className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/60 dark:data-[state=active]:text-amber-300 rounded-lg transition-all"
            >
              <GraduationCap className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t.userTypes.professor}
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/60 dark:data-[state=active]:text-purple-300 rounded-lg transition-all"
            >
              <School className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t.userTypes.admin}
            </TabsTrigger>
          </TabsList>

          {/* Content for each user type */}
          <TabsContent value="student">
            {renderUserTypeContent('student')}
          </TabsContent>

          <TabsContent value="parent">
            {renderUserTypeContent('parent')}
          </TabsContent>

          <TabsContent value="professor">
            {renderUserTypeContent('professor')}
          </TabsContent>

          <TabsContent value="admin">
            {renderUserTypeContent('admin')}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default FeaturesSection;
