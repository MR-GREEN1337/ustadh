"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  Star,
  ChevronRight,
  Globe,
  Sparkles,
  Rocket,
  BookMarked,
  Compass,
  GraduationCap
} from 'lucide-react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import { Header } from '../../page';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

// Localized data for different languages
const localizedData = {
  en: {
    steps: [
      {
        title: "Welcome to your learning journey",
        description: "Let's personalize your experience to match your educational needs and interests."
      },
      {
        title: "Educational background",
        description: "Tell us about your educational background so we can customize your learning path."
      },
      {
        title: "Academic track",
        description: "Tell us about your academic track (filière) to provide relevant content for your curriculum."
      },
      {
        title: "Interests & goals",
        description: "Share your areas of interest and academic goals to help us recommend relevant content."
      },
      {
        title: "Learning preferences",
        description: "How do you prefer to learn? This helps us tailor our teaching methods to your style."
      },
      {
        title: "Almost there",
        description: "Just a few more preferences to complete your personalized profile."
      }
    ],
    educationLevels: [
      { value: "primary_1", label: "Primary school - 1st year" },
      { value: "primary_2", label: "Primary school - 2nd year" },
      { value: "primary_3", label: "Primary school - 3rd year" },
      { value: "primary_4", label: "Primary school - 4th year" },
      { value: "primary_5", label: "Primary school - 5th year" },
      { value: "primary_6", label: "Primary school - 6th year" },
      { value: "college_7", label: "College - 1st year (7th)" },
      { value: "college_8", label: "College - 2nd year (8th)" },
      { value: "college_9", label: "College - 3rd year (9th)" },
      { value: "tronc_commun", label: "High school - Tronc commun" },
      { value: "bac_1", label: "High school - 1st year Baccalaureate" },
      { value: "bac_2", label: "High school - 2nd year Baccalaureate" },
      { value: "university", label: "University" }
    ],
    schoolTypes: [
      { value: "public", label: "Public school" },
      { value: "private", label: "Private school" },
      { value: "mission", label: "Mission school" },
      { value: "international", label: "International school" },
      { value: "homeschool", label: "Homeschooling" }
    ],
    regions: [
      { value: "casablanca-settat", label: "Casablanca-Settat" },
      { value: "rabat-sale-kenitra", label: "Rabat-Salé-Kénitra" },
      { value: "marrakech-safi", label: "Marrakech-Safi" },
      { value: "fes-meknes", label: "Fès-Meknès" },
      { value: "tanger-tetouan-alhoceima", label: "Tanger-Tétouan-Al Hoceïma" },
      { value: "oriental", label: "Oriental" },
      { value: "souss-massa", label: "Souss-Massa" },
      { value: "draa-tafilalet", label: "Drâa-Tafilalet" },
      { value: "beni-mellal-khenifra", label: "Béni Mellal-Khénifra" },
      { value: "guelmim-oued-noun", label: "Guelmim-Oued Noun" },
      { value: "laayoune-sakia-el-hamra", label: "Laâyoune-Sakia El Hamra" },
      { value: "dakhla-oued-ed-dahab", label: "Dakhla-Oued Ed-Dahab" }
    ],
    subjects: [
      { value: "mathematics", label: "Mathematics" },
      { value: "physics", label: "Physics" },
      { value: "chemistry", label: "Chemistry" },
      { value: "biology", label: "Biology" },
      { value: "arabic", label: "Arabic Language & Literature" },
      { value: "french", label: "French Language" },
      { value: "english", label: "English Language" },
      { value: "history", label: "History" },
      { value: "geography", label: "Geography" },
      { value: "philosophy", label: "Philosophy" },
      { value: "islamic-education", label: "Islamic Education" },
      { value: "computer-science", label: "Computer Science" }
    ],
    learningStyles: [
      { value: "visual", label: "Visual learning", description: "Learn best through images, diagrams, and visual representations" },
      { value: "auditory", label: "Auditory learning", description: "Learn best through listening and verbal explanations" },
      { value: "reading", label: "Reading/Writing", description: "Learn best through reading texts and writing notes" },
      { value: "kinesthetic", label: "Hands-on learning", description: "Learn best through practical exercises and direct experience" }
    ],
    studyHabits: [
      { value: "morning", label: "Morning person" },
      { value: "evening", label: "Evening person" },
      { value: "concentrated", label: "Concentrated study sessions" },
      { value: "spaced", label: "Spaced practice throughout the day" },
      { value: "group", label: "Group study" },
      { value: "individual", label: "Individual study" }
    ],
    goals: [
      { value: "academic-excellence", label: "Academic excellence" },
      { value: "bac-preparation", label: "Baccalaureate preparation" },
      { value: "university-entry", label: "University entrance preparation" },
      { value: "competitions", label: "Academic competitions" },
      { value: "knowledge-enrichment", label: "General knowledge enrichment" },
      { value: "career-preparation", label: "Career preparation" }
    ],
    inspirationalQuotes: [
      {
        text: "The universe beckons those who seek knowledge with open minds and curious hearts.",
        author: "Unknown"
      },
      {
        text: "Education is not the filling of a pail, but the lighting of a fire.",
        author: "William Butler Yeats"
      },
      {
        text: "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.",
        author: "Carl Sagan"
      }
    ]
  },
  fr: {
    steps: [
      {
        title: "Bienvenue dans votre parcours d'apprentissage",
        description: "Personnalisons votre expérience pour qu'elle corresponde à vos besoins et intérêts éducatifs."
      },
      {
        title: "Parcours éducatif",
        description: "Parlez-nous de votre parcours éducatif afin que nous puissions personnaliser votre apprentissage."
      },
      {
        title: "Filière académique",
        description: "Parlez-nous de votre filière académique pour vous proposer un contenu pertinent pour votre cursus."
      },
      {
        title: "Intérêts et objectifs",
        description: "Partagez vos centres d'intérêt et vos objectifs académiques pour nous aider à recommander du contenu pertinent."
      },
      {
        title: "Préférences d'apprentissage",
        description: "Comment préférez-vous apprendre ? Cela nous aide à adapter nos méthodes d'enseignement à votre style."
      },
      {
        title: "Presque terminé",
        description: "Encore quelques préférences pour compléter votre profil personnalisé."
      }
    ],
    educationLevels: [
      { value: "primary_1", label: "École primaire - 1ère année" },
      { value: "primary_2", label: "École primaire - 2ème année" },
      { value: "primary_3", label: "École primaire - 3ème année" },
      { value: "primary_4", label: "École primaire - 4ème année" },
      { value: "primary_5", label: "École primaire - 5ème année" },
      { value: "primary_6", label: "École primaire - 6ème année" },
      { value: "college_7", label: "Collège - 1ère année (7ème)" },
      { value: "college_8", label: "Collège - 2ème année (8ème)" },
      { value: "college_9", label: "Collège - 3ème année (9ème)" },
      { value: "tronc_commun", label: "Lycée - Tronc commun" },
      { value: "bac_1", label: "Lycée - 1ère année Baccalauréat" },
      { value: "bac_2", label: "Lycée - 2ème année Baccalauréat" },
      { value: "university", label: "Université" }
    ],
    schoolTypes: [
      { value: "public", label: "École publique" },
      { value: "private", label: "École privée" },
      { value: "mission", label: "École de mission" },
      { value: "international", label: "École internationale" },
      { value: "homeschool", label: "Enseignement à domicile" }
    ],
    regions: [
      { value: "casablanca-settat", label: "Casablanca-Settat" },
      { value: "rabat-sale-kenitra", label: "Rabat-Salé-Kénitra" },
      { value: "marrakech-safi", label: "Marrakech-Safi" },
      { value: "fes-meknes", label: "Fès-Meknès" },
      { value: "tanger-tetouan-alhoceima", label: "Tanger-Tétouan-Al Hoceïma" },
      { value: "oriental", label: "Oriental" },
      { value: "souss-massa", label: "Souss-Massa" },
      { value: "draa-tafilalet", label: "Drâa-Tafilalet" },
      { value: "beni-mellal-khenifra", label: "Béni Mellal-Khénifra" },
      { value: "guelmim-oued-noun", label: "Guelmim-Oued Noun" },
      { value: "laayoune-sakia-el-hamra", label: "Laâyoune-Sakia El Hamra" },
      { value: "dakhla-oued-ed-dahab", label: "Dakhla-Oued Ed-Dahab" }
    ],
    subjects: [
      { value: "mathematics", label: "Mathématiques" },
      { value: "physics", label: "Physique" },
      { value: "chemistry", label: "Chimie" },
      { value: "biology", label: "Biologie" },
      { value: "arabic", label: "Langue et littérature arabes" },
      { value: "french", label: "Langue française" },
      { value: "english", label: "Langue anglaise" },
      { value: "history", label: "Histoire" },
      { value: "geography", label: "Géographie" },
      { value: "philosophy", label: "Philosophie" },
      { value: "islamic-education", label: "Éducation islamique" },
      { value: "computer-science", label: "Informatique" }
    ],
    learningStyles: [
      { value: "visual", label: "Apprentissage visuel", description: "Apprend mieux grâce aux images, diagrammes et représentations visuelles" },
      { value: "auditory", label: "Apprentissage auditif", description: "Apprend mieux en écoutant et avec des explications verbales" },
      { value: "reading", label: "Lecture/Écriture", description: "Apprend mieux en lisant des textes et en prenant des notes" },
      { value: "kinesthetic", label: "Apprentissage pratique", description: "Apprend mieux par des exercices pratiques et l'expérience directe" }
    ],
    studyHabits: [
      { value: "morning", label: "Personne matinale" },
      { value: "evening", label: "Personne du soir" },
      { value: "concentrated", label: "Sessions d'étude concentrées" },
      { value: "spaced", label: "Pratique espacée tout au long de la journée" },
      { value: "group", label: "Étude en groupe" },
      { value: "individual", label: "Étude individuelle" }
    ],
    goals: [
      { value: "academic-excellence", label: "Excellence académique" },
      { value: "bac-preparation", label: "Préparation au baccalauréat" },
      { value: "university-entry", label: "Préparation à l'entrée à l'université" },
      { value: "competitions", label: "Compétitions académiques" },
      { value: "knowledge-enrichment", label: "Enrichissement des connaissances générales" },
      { value: "career-preparation", label: "Préparation à la carrière" }
    ],
    inspirationalQuotes: [
      {
        text: "L'univers appelle ceux qui cherchent la connaissance avec un esprit ouvert et un cœur curieux.",
        author: "Inconnu"
      },
      {
        text: "L'éducation n'est pas le remplissage d'un seau, mais l'allumage d'un feu.",
        author: "William Butler Yeats"
      },
      {
        text: "Le cosmos est en nous. Nous sommes faits de poussière d'étoiles. Nous sommes un moyen pour l'univers de se connaître lui-même.",
        author: "Carl Sagan"
      }
    ]
  },
  ar: {
    steps: [
      {
        title: "مرحبًا بك في رحلة التعلم الخاصة بك",
        description: "دعنا نخصص تجربتك لتتناسب مع احتياجاتك واهتماماتك التعليمية."
      },
      {
        title: "الخلفية التعليمية",
        description: "أخبرنا عن خلفيتك التعليمية حتى نتمكن من تخصيص مسار التعلم الخاص بك."
      },
      {
        title: "المسار الأكاديمي",
        description: "أخبرنا عن مسارك الأكاديمي (الشعبة) لتوفير محتوى ملائم لمنهجك الدراسي."
      },
      {
        title: "الاهتمامات والأهداف",
        description: "شارك مجالات اهتمامك وأهدافك الأكاديمية لمساعدتنا في التوصية بمحتوى ذي صلة."
      },
      {
        title: "تفضيلات التعلم",
        description: "كيف تفضل التعلم؟ هذا يساعدنا على تكييف أساليب التدريس لدينا مع أسلوبك."
      },
      {
        title: "اقتربنا من النهاية",
        description: "بضعة تفضيلات أخرى لإكمال ملفك الشخصي المخصص."
      }
    ],
    educationLevels: [
      { value: "primary_1", label: "المدرسة الابتدائية - السنة الأولى" },
      { value: "primary_2", label: "المدرسة الابتدائية - السنة الثانية" },
      { value: "primary_3", label: "المدرسة الابتدائية - السنة الثالثة" },
      { value: "primary_4", label: "المدرسة الابتدائية - السنة الرابعة" },
      { value: "primary_5", label: "المدرسة الابتدائية - السنة الخامسة" },
      { value: "primary_6", label: "المدرسة الابتدائية - السنة السادسة" },
      { value: "college_7", label: "المدرسة الإعدادية - السنة الأولى" },
      { value: "college_8", label: "المدرسة الإعدادية - السنة الثانية" },
      { value: "college_9", label: "المدرسة الإعدادية - السنة الثالثة" },
      { value: "tronc_commun", label: "المدرسة الثانوية - الجذع المشترك" },
      { value: "bac_1", label: "المدرسة الثانوية - السنة الأولى باكالوريا" },
      { value: "bac_2", label: "المدرسة الثانوية - السنة الثانية باكالوريا" },
      { value: "university", label: "الجامعة" }
    ],
    schoolTypes: [
      { value: "public", label: "مدرسة عمومية" },
      { value: "private", label: "مدرسة خاصة" },
      { value: "mission", label: "مدرسة البعثة" },
      { value: "international", label: "مدرسة دولية" },
      { value: "homeschool", label: "التعليم المنزلي" }
    ],
    regions: [
      { value: "casablanca-settat", label: "الدار البيضاء-سطات" },
      { value: "rabat-sale-kenitra", label: "الرباط-سلا-القنيطرة" },
      { value: "marrakech-safi", label: "مراكش-آسفي" },
      { value: "fes-meknes", label: "فاس-مكناس" },
      { value: "tanger-tetouan-alhoceima", label: "طنجة-تطوان-الحسيمة" },
      { value: "oriental", label: "الشرق" },
      { value: "souss-massa", label: "سوس-ماسة" },
      { value: "draa-tafilalet", label: "درعة-تافيلالت" },
      { value: "beni-mellal-khenifra", label: "بني ملال-خنيفرة" },
      { value: "guelmim-oued-noun", label: "كلميم-واد نون" },
      { value: "laayoune-sakia-el-hamra", label: "العيون-الساقية الحمراء" },
      { value: "dakhla-oued-ed-dahab", label: "الداخلة-وادي الذهب" }
    ],
    subjects: [
      { value: "mathematics", label: "الرياضيات" },
      { value: "physics", label: "الفيزياء" },
      { value: "chemistry", label: "الكيمياء" },
      { value: "biology", label: "علم الأحياء" },
      { value: "arabic", label: "اللغة العربية وآدابها" },
      { value: "french", label: "اللغة الفرنسية" },
      { value: "english", label: "اللغة الإنجليزية" },
      { value: "history", label: "التاريخ" },
      { value: "geography", label: "الجغرافيا" },
      { value: "philosophy", label: "الفلسفة" },
      { value: "islamic-education", label: "التربية الإسلامية" },
      { value: "computer-science", label: "علوم الكمبيوتر" }
    ],
    learningStyles: [
      { value: "visual", label: "التعلم البصري", description: "يتعلم بشكل أفضل من خلال الصور والرسوم البيانية والتمثيلات المرئية" },
      { value: "auditory", label: "التعلم السمعي", description: "يتعلم بشكل أفضل من خلال الاستماع والشرح اللفظي" },
      { value: "reading", label: "القراءة/الكتابة", description: "يتعلم بشكل أفضل من خلال قراءة النصوص وكتابة الملاحظات" },
      { value: "kinesthetic", label: "التعلم العملي", description: "يتعلم بشكل أفضل من خلال التمارين العملية والخبرة المباشرة" }
    ],
    studyHabits: [
      { value: "morning", label: "شخص صباحي" },
      { value: "evening", label: "شخص مسائي" },
      { value: "concentrated", label: "جلسات دراسة مركزة" },
      { value: "spaced", label: "ممارسة متباعدة على مدار اليوم" },
      { value: "group", label: "الدراسة الجماعية" },
      { value: "individual", label: "الدراسة الفردية" }
    ],
    goals: [
      { value: "academic-excellence", label: "التميز الأكاديمي" },
      { value: "bac-preparation", label: "التحضير للبكالوريا" },
      { value: "university-entry", label: "التحضير لدخول الجامعة" },
      { value: "competitions", label: "المسابقات الأكاديمية" },
      { value: "knowledge-enrichment", label: "إثراء المعرفة العامة" },
      { value: "career-preparation", label: "التحضير للمهنة" }
    ],
    inspirationalQuotes: [
      {
        text: "الكون يدعو أولئك الذين يسعون للمعرفة بعقول منفتحة وقلوب فضولية.",
        author: "مجهول"
      },
      {
        text: "التعليم ليس ملء دلو، بل إشعال نار.",
        author: "ويليام بتلر ييتس"
      },
      {
        text: "الكون بداخلنا. نحن مصنوعون من مادة النجوم. نحن وسيلة للكون ليعرف نفسه.",
        author: "كارل ساغان"
      }
    ]
  }
};

// Form validation schema
const formSchema = z.object({
  educationLevel: z.string().min(1, { message: "Please select your education level" }),
  schoolType: z.string().min(1, { message: "Please select your school type" }),
  region: z.string().min(1, { message: "Please select your region" }),
  filiere: z.string().optional(),
  subjects: z.array(z.string()).min(1, { message: "Please select at least one subject" }),
  learningStyle: z.string().min(1, { message: "Please select your learning style" }),
  studyHabits: z.array(z.string()).min(1, { message: "Please select at least one study habit" }),
  goals: z.array(z.string()).min(1, { message: "Please select at least one goal" }),
  dataConsent: z.boolean().refine(value => value === true, {
    message: "You must consent to data collection to continue",
  }),
});

const Onboarding = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user, updateUserOnboarding } = useAuth();
  const { theme } = useTheme();
  const isRTL = locale === "ar";
  const isDark = theme === "dark";

  // Get the localized data based on the current locale
  const localeKey = (locale as string) in localizedData ? (locale as string) : 'en';
  const data = localizedData[localeKey as keyof typeof localizedData];

  // Current step state
  const [currentStep, setCurrentStep] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Random inspirational quote
  const quote = data.inspirationalQuotes[Math.floor(Math.random() * data.inspirationalQuotes.length)];

  // Form hook
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      educationLevel: "",
      schoolType: "",
      region: "",
      filiere: "",
      subjects: [],
      learningStyle: "",
      studyHabits: [],
      goals: [],
      dataConsent: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setFormSubmitting(true);
    try {
      console.log("Submitting onboarding data:", values);

      // Convert form values to the format expected by the updateUserOnboarding function
      const onboardingData = {
        education_level: values.educationLevel,
        school_type: values.schoolType,
        region: values.region,
        academic_track: values.filiere || undefined,
        learning_style: values.learningStyle,
        study_habits: values.studyHabits,
        academic_goals: values.goals,
        data_consent: values.dataConsent,
        subjects: values.subjects // This will need to be mapped to subject IDs on the backend
      };

      // Call the updateUserOnboarding function from useAuth hook
      const success = await updateUserOnboarding(onboardingData);

      if (success) {
        // Show success toast
        toast({
          title: t("onboardingComplete") || "Onboarding complete!",
          description: t("profileUpdated") || "Your profile has been updated successfully.",
          variant: "success",
        });

        // Redirect to dashboard
        router.push(`/${locale}/dashboard`);
      } else {
        // Show error toast
        toast({
          title: t("onboardingFailed") || "Onboarding failed",
          description: t("profileUpdateError") || "There was a problem updating your profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during onboarding:", error);

      // Show detailed error toast
      toast({
        title: t("onboardingFailed") || "Onboarding failed",
        description: error instanceof Error ? error.message : t("unexpectedError") || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle next step
  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, data.steps.length - 1));
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Starfield background effect - conditional based on theme
const StarfieldBackground = () => (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-indigo-950" />
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animation: `twinkle ${Math.random() * 5 + 3}s infinite alternate`
              }}
            />
          ))}
          <style jsx>{`
            @keyframes twinkle {
              0% { opacity: 0.2; }
              100% { opacity: 1; }
            }
          `}</style>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-indigo-100" />
      )}
    </div>
  );

  // Progress indicator - theme-aware colors
  const ProgressIndicator = () => (
    <div className="flex justify-center items-center gap-2 mt-4 mb-8">
      {data.steps.map((_, idx) => (
        <div
          key={idx}
          className={`h-2 rounded-full transition-all duration-500 ${
            idx === currentStep
              ? 'w-8 bg-primary'
              : idx < currentStep
                ? 'w-2 bg-primary/70'
                : 'w-2 bg-muted'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-8 ${isDark ? 'text-white' : 'text-slate-900'} ${isRTL ? 'text-right' : 'text-left'}`}>
      <StarfieldBackground />
      <Header />
      <div className={`max-w-3xl w-full mx-auto ${isDark ? 'bg-black/30' : 'bg-white/80'} backdrop-blur-md rounded-2xl p-6 md:p-8 border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light tracking-tight flex items-center justify-center gap-2">
            <Rocket className="h-8 w-8 text-primary animate-pulse" />
            {t("onboarding") || "Onboarding"}
          </h1>
          <ProgressIndicator />
        </div>

        <div className="space-y-8">
          {/* Step title and description */}
          <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h2 className="text-2xl font-light">{data.steps[currentStep].title}</h2>
            <p className={`${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{data.steps[currentStep].description}</p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Welcome & Basic Education Info */}
              {currentStep === 0 && (
                <div className="space-y-8">
                  <div className="mb-8">
                    <Card className={`${isDark ? 'bg-black/20 border-t border-white/10' : 'bg-white/90 border border-slate-200'} rounded-xl overflow-hidden backdrop-blur-sm`}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                              <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <p className="text-xl font-light italic text-center">{quote.text}</p>
                          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'} text-center`}>— {quote.author}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <FormField
                    control={form.control}
                    name="educationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("educationLevel") || "Education Level"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectEducationLevel") || "Select your education level"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {data.educationLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: School Type & Region */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="schoolType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("schoolType") || "School Type"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectSchoolType") || "Select your school type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {data.schoolTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("region") || "Region"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          dir={isRTL ? "rtl" : "ltr"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectRegion") || "Select your region"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {data.regions.map((region) => (
                              <SelectItem key={region.value} value={region.value}>{region.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className={`rounded-xl ${isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'} border p-4`}>
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-2 ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                        <Globe className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{t("moroccoCurriculum") || "Moroccan Curriculum"}</h3>
                        <p className={`text-sm ${isDark ? 'text-indigo-200/70' : 'text-indigo-600/90'} mt-1`}>
                          {t("curriculumInfo") || "We'll personalize your learning path based on the Moroccan education system and curriculum requirements."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Academic Track (Filière) */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className={`rounded-xl ${isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'} border p-4 mb-4`}>
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-2 ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                        <BookOpen className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{t("academicTrack") || "Academic Track (Filière)"}</h3>
                        <p className={`text-sm ${isDark ? 'text-indigo-200/70' : 'text-indigo-600/90'} mt-1`}>
                          {t("academicTrackDesc") || "Your academic track determines the specific curriculum you follow in high school."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* University Specializations */}
                  {form.watch('educationLevel') === 'university' && (
                    <FormField
                      control={form.control}
                      name="filiere"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("universitySpecialization") || "University Specialization"}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            dir={isRTL ? "rtl" : "ltr"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectUniversitySpecialization") || "Select your specialization"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                {/* Science & Technology */}
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'العلوم والتكنولوجيا' : locale === 'fr' ? 'Sciences et Technologies' : 'Science & Technology'}
                                </SelectLabel>
                                <SelectItem value="uni_fst">
                                  {locale === 'ar' ? 'كلية العلوم والتقنيات (FST)' : locale === 'fr' ? 'Faculté des Sciences et Techniques (FST)' : 'Faculty of Science & Technology (FST)'}
                                </SelectItem>
                                <SelectItem value="uni_ensam">
                                  {locale === 'ar' ? 'المدرسة الوطنية العليا للفنون والمهن (ENSAM)' : locale === 'fr' ? 'École Nationale Supérieure d\'Arts et Métiers (ENSAM)' : 'National School of Arts and Crafts (ENSAM)'}
                                </SelectItem>
                                <SelectItem value="uni_ensa">
                                  {locale === 'ar' ? 'المدرسة الوطنية للعلوم التطبيقية (ENSA)' : locale === 'fr' ? 'École Nationale des Sciences Appliquées (ENSA)' : 'National School of Applied Sciences (ENSA)'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Medicine & Health Sciences */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'الطب والعلوم الصحية' : locale === 'fr' ? 'Médecine et Sciences de la Santé' : 'Medicine & Health Sciences'}
                                </SelectLabel>
                                <SelectItem value="uni_medicine">
                                  {locale === 'ar' ? 'كلية الطب والصيدلة' : locale === 'fr' ? 'Faculté de Médecine et de Pharmacie' : 'Faculty of Medicine and Pharmacy'}
                                </SelectItem>
                                <SelectItem value="uni_dental">
                                  {locale === 'ar' ? 'كلية طب الأسنان' : locale === 'fr' ? 'Faculté de Médecine Dentaire' : 'Faculty of Dental Medicine'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Sciences */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'العلوم' : locale === 'fr' ? 'Sciences' : 'Sciences'}
                                </SelectLabel>
                                <SelectItem value="uni_fs">
                                  {locale === 'ar' ? 'كلية العلوم (FS)' : locale === 'fr' ? 'Faculté des Sciences (FS)' : 'Faculty of Sciences (FS)'}
                                </SelectItem>
                                <SelectItem value="uni_mathematics">
                                  {locale === 'ar' ? 'الرياضيات' : locale === 'fr' ? 'Mathématiques' : 'Mathematics'}
                                </SelectItem>
                                <SelectItem value="uni_physics">
                                  {locale === 'ar' ? 'الفيزياء' : locale === 'fr' ? 'Physique' : 'Physics'}
                                </SelectItem>
                                <SelectItem value="uni_chemistry">
                                  {locale === 'ar' ? 'الكيمياء' : locale === 'fr' ? 'Chimie' : 'Chemistry'}
                                </SelectItem>
                                <SelectItem value="uni_biology">
                                  {locale === 'ar' ? 'البيولوجيا' : locale === 'fr' ? 'Biologie' : 'Biology'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Law, Economics & Management */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'القانون والاقتصاد والتدبير' : locale === 'fr' ? 'Droit, Économie et Gestion' : 'Law, Economics & Management'}
                                </SelectLabel>
                                <SelectItem value="uni_fsjes">
                                  {locale === 'ar' ? 'كلية العلوم القانونية والاقتصادية والاجتماعية (FSJES)' : locale === 'fr' ? 'Faculté des Sciences Juridiques, Économiques et Sociales (FSJES)' : 'Faculty of Legal, Economic and Social Sciences (FSJES)'}
                                </SelectItem>
                                <SelectItem value="uni_economics">
                                  {locale === 'ar' ? 'العلوم الاقتصادية' : locale === 'fr' ? 'Sciences Économiques' : 'Economic Sciences'}
                                </SelectItem>
                                <SelectItem value="uni_management">
                                  {locale === 'ar' ? 'علوم التدبير' : locale === 'fr' ? 'Sciences de Gestion' : 'Management Sciences'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Literature & Humanities */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'الآداب والعلوم الإنسانية' : locale === 'fr' ? 'Lettres et Sciences Humaines' : 'Literature & Humanities'}
                                </SelectLabel>
                                <SelectItem value="uni_flsh">
                                  {locale === 'ar' ? 'كلية الآداب والعلوم الإنسانية (FLSH)' : locale === 'fr' ? 'Faculté des Lettres et des Sciences Humaines (FLSH)' : 'Faculty of Literature and Human Sciences (FLSH)'}
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t("universityCourseDesc") || "This helps us customize content for your university specialization."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* High School Filières */}
                  {(form.watch('educationLevel').includes('bac') || form.watch('educationLevel') === 'tronc_commun') && (
                    <FormField
                      control={form.control}
                      name="filiere"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("filiere") || "Filière (Academic Track)"}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            dir={isRTL ? "rtl" : "ltr"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("selectFiliere") || "Select your filière"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                {/* Scientific Tracks */}
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'المسارات العلمية' : locale === 'fr' ? 'Filières Scientifiques' : 'Scientific Tracks'}
                                </SelectLabel>
                                <SelectItem value="sciences_math_a">
                                  {locale === 'ar' ? 'العلوم الرياضية أ' : locale === 'fr' ? 'Sciences Mathématiques A' : 'Sciences Math A'}
                                </SelectItem>
                                <SelectItem value="sciences_math_b">
                                  {locale === 'ar' ? 'العلوم الرياضية ب' : locale === 'fr' ? 'Sciences Mathématiques B' : 'Sciences Math B'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Sciences Expérimentales Options */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'العلوم التجريبية' : locale === 'fr' ? 'Sciences Expérimentales' : 'Experimental Sciences'}
                                </SelectLabel>
                                <SelectItem value="svt_pc">
                                  {locale === 'ar' ? 'علوم الحياة والأرض والفيزياء والكيمياء' : locale === 'fr' ? 'SVT - PC (Sciences Physiques)' : 'Life/Earth Sciences - Physics/Chemistry'}
                                </SelectItem>
                                <SelectItem value="svt_math">
                                  {locale === 'ar' ? 'علوم الحياة والأرض والرياضيات' : locale === 'fr' ? 'SVT - Mathématiques' : 'Life/Earth Sciences - Mathematics'}
                                </SelectItem>
                                <SelectItem value="pc_svt">
                                  {locale === 'ar' ? 'الفيزياء والكيمياء وعلوم الحياة والأرض' : locale === 'fr' ? 'PC - SVT' : 'Physics/Chemistry - Life/Earth Sciences'}
                                </SelectItem>
                                <SelectItem value="pc_math">
                                  {locale === 'ar' ? 'الفيزياء والكيمياء والرياضيات' : locale === 'fr' ? 'PC - Mathématiques' : 'Physics/Chemistry - Mathematics'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Literary Tracks */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'الآداب والعلوم الإنسانية' : locale === 'fr' ? 'Lettres et Sciences Humaines' : 'Literature and Humanities'}
                                </SelectLabel>
                                <SelectItem value="lettres_lang_fr">
                                  {locale === 'ar' ? 'الآداب - اللغة الفرنسية' : locale === 'fr' ? 'Lettres - Langue Française' : 'Literature - French Language'}
                                </SelectItem>
                                <SelectItem value="lettres_lang_angl">
                                  {locale === 'ar' ? 'الآداب - اللغة الإنجليزية' : locale === 'fr' ? 'Lettres - Langue Anglaise' : 'Literature - English Language'}
                                </SelectItem>
                                <SelectItem value="lettres_geo_hist">
                                  {locale === 'ar' ? 'الآداب - التاريخ والجغرافيا' : locale === 'fr' ? 'Lettres - Histoire/Géographie' : 'Literature - History/Geography'}
                                </SelectItem>
                                <SelectItem value="lettres_phil">
                                  {locale === 'ar' ? 'الآداب - الفلسفة' : locale === 'fr' ? 'Lettres - Philosophie' : 'Literature - Philosophy'}
                                </SelectItem>

                                {/* Economic and Management Sciences */}
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'العلوم الاقتصادية والتدبير' : locale === 'fr' ? 'Sciences Économiques et Gestion' : 'Economic & Management Sciences'}
                                </SelectLabel>
                                <SelectItem value="eco_gestion">
                                  {locale === 'ar' ? 'الاقتصاد والتدبير' : locale === 'fr' ? 'Économie et Gestion' : 'Economics and Management'}
                                </SelectItem>
                                <SelectItem value="eco_comptabilite">
                                  {locale === 'ar' ? 'العلوم الاقتصادية - المحاسبة' : locale === 'fr' ? 'Sciences Économiques - Comptabilité' : 'Economic Sciences - Accounting'}
                                </SelectItem>
                              </SelectGroup>

                              {/* Professional Baccalaureate - Specialized Options */}
                              <SelectGroup>
                                <SelectLabel className="font-medium mt-2 mb-1">
                                  {locale === 'ar' ? 'البكالوريا المهنية' : locale === 'fr' ? 'Baccalauréat Professionnel' : 'Professional Baccalaureate'}
                                </SelectLabel>
                                <SelectItem value="bac_pro_commerce">
                                  {locale === 'ar' ? 'بكالوريا مهنية - التجارة' : locale === 'fr' ? 'Bac Pro - Commerce' : 'Professional Bac - Commerce'}
                                </SelectItem>
                                <SelectItem value="bac_pro_digital">
                                  {locale === 'ar' ? 'بكالوريا مهنية - الرقميات' : locale === 'fr' ? 'Bac Pro - Numérique' : 'Professional Bac - Digital Technology'}
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t("filiereDesc") || "This helps us tailor your content to match your curriculum exactly."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {!form.watch('educationLevel').includes('bac') && form.watch('educationLevel') !== 'tronc_commun' && form.watch('educationLevel') !== 'university' && (
                    <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-black/20' : 'bg-slate-100'}`}>
                      <p>{t("filiereNotApplicable") || "Filière selection is applicable for high school students (Tronc Commun and Baccalaureate) and university students."}
                      </p>
                    </div>
                  )}

                  <div className={`rounded-xl ${isDark ? 'bg-purple-600/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'} border p-4 mt-6`}>
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-2 ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                        <Star className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{t("moroccanCurriculumDetailed") || "Detailed Moroccan Curriculum"}</h3>
                        <p className={`text-sm ${isDark ? 'text-purple-200/70' : 'text-purple-600/90'} mt-1`}>
                          {t("moroccanCurriculumDetailedDesc") || "With your precise academic track information, we can provide you with targeted learning materials that align with your specific curriculum requirements."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Subjects & Interests */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="subjects"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>{t("favoriteSubjects") || "Favorite Subjects"}</FormLabel>
                          <FormDescription>
                            {t("selectSubjectsDesc") || "Select subjects you're most interested in learning"}
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {data.subjects.map((subject) => (
                            <FormField
                              key={subject.value}
                              control={form.control}
                              name="subjects"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={subject.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(subject.value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, subject.value])
                                            : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== subject.value
                                              )
                                            )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {subject.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>{t("academicGoals") || "Academic Goals"}</FormLabel>
                          <FormDescription>
                            {t("selectGoalsDesc") || "What are you hoping to achieve?"}
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {data.goals.map((goal) => (
                            <FormField
                              key={goal.value}
                              control={form.control}
                              name="goals"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={goal.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(goal.value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, goal.value])
                                            : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== goal.value
                                              )
                                            )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {goal.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 5: Final confirmations */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <Card className={`${isDark ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30' : 'bg-gradient-to-br from-purple-100 to-indigo-100'} border-0 rounded-xl overflow-hidden backdrop-blur-sm`}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-white" />
                          </div>
                        </div>

                        <h3 className={`text-xl font-medium text-center ${!isDark && 'text-indigo-900'}`}>
                          {t("almostReady") || "You're almost ready for your cosmic learning journey!"}
                        </h3>

                        <p className={`${isDark ? 'text-zinc-300' : 'text-slate-700'} text-center`}>
                          {t("personalizedExperience") || "We've gathered what we need to create your personalized learning experience. Get ready to explore new horizons of knowledge!"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <FormField
                    control={form.control}
                    name="dataConsent"
                    render={({ field }) => (
                      <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border ${isDark ? 'border-white/20' : 'border-slate-200'} p-4`}>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t("dataConsent") || "Data collection consent"}
                          </FormLabel>
                          <FormDescription>
                            {t("dataConsentDesc") || "I agree to the collection and processing of my data to personalize my learning experience."}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation buttons */}
              <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between pt-4`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`${isDark ? 'border-white/20 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-100'}`}
                >
                  {t("back") || "Back"}
                </Button>

                {currentStep < data.steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    {t("continue") || "Continue"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={formSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    {formSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        {t("submitting") || "Submitting..."}
                      </div>
                    ) : (
                      <>{t("startJourney") || "Start Your Journey"}</>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
