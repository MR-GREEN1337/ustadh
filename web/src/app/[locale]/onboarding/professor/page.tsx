"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/client";
import { ProfessorService } from "@/services/ProfessorService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Brain,
  Sparkles,
  Compass,
  Rocket,
  Users,
  Star,
  BookOpen,
  GraduationCap,
  School,
  Atom,
  Globe,
  Lightbulb
} from "lucide-react";

interface ProfileStepProps {
  onComplete: () => void;
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Le titre doit contenir au moins 2 caractères.",
  }),
  teaching_role: z.string({
    required_error: "Veuillez sélectionner un rôle d'enseignement",
  }),
  contract_type: z.string().optional(),
  school_level: z.string({
    required_error: "Veuillez sélectionner un niveau scolaire",
  }),
  grade_taught: z.string().optional(),
  subject_specialty: z.string().optional(),
});

const MotionGradient = ({ children, className = "" }) => (
  <div className={`relative overflow-hidden rounded-xl ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/80 via-purple-600/50 to-pink-500/70 opacity-80" />
    <div className="relative z-10">{children}</div>
  </div>
);

const FloatingParticle = ({ size, delay, duration, top, left }) => (
  <motion.div
    className="absolute rounded-full bg-white"
    style={{
      width: size,
      height: size,
      top: `${top}%`,
      left: `${left}%`,
      filter: "blur(1px)",
      opacity: 0.6
    }}
    animate={{
      y: [0, -20, 0],
      opacity: [0.2, 0.6, 0.2],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    }}
  />
);

const ParticleField = () => {
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 3,
    top: Math.random() * 100,
    left: Math.random() * 100,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} {...particle} />
      ))}
    </div>
  );
};

// Icon components for the orbit
const OrbitingIcon = ({ icon: Icon, angle, size = 24, delay = 0 }) => {
  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        rotate: [angle, angle + 360],
      }}
      transition={{
        rotate: {
          duration: 20,
          repeat: Infinity,
          ease: "linear",
          delay,
        },
        opacity: {
          duration: 1,
          delay,
        },
      }}
      style={{
        transformOrigin: "center center",
        transform: `rotate(${angle}deg) translateX(130px)`,
      }}
    >
      <Icon size={size} className="text-blue-400 drop-shadow-lg" />
    </motion.div>
  );
};

const OrbitSystem = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-72 h-72">
        <motion.div
          className="absolute inset-0 rounded-full border border-blue-400/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        />
        <OrbitingIcon icon={Brain} angle={0} delay={0.2} />
        <OrbitingIcon icon={Rocket} angle={72} delay={0.4} />
        <OrbitingIcon icon={Globe} angle={144} delay={0.6} />
        <OrbitingIcon icon={Atom} angle={216} delay={0.8} />
        <OrbitingIcon icon={Lightbulb} angle={288} delay={1} />
      </div>
    </div>
  );
};

const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-1.5 rounded-full ${
            i === currentStep ? "w-8 bg-white" : "w-2 bg-white/50"
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
  );
};

const StepTitle = ({ title, description }) => {
  return (
    <motion.div
      className="text-center mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-blue-100">{description}</p>
    </motion.div>
  );
};

export default function ProfileStep({ onComplete }: ProfileStepProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const containerRef = useRef(null);
  const { theme } = useTheme();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      teaching_role: "",
      contract_type: "",
      school_level: "",
      grade_taught: "",
      subject_specialty: "",
    },
  });

  const steps = [
    {
      id: "welcome",
      title: t("bienvenue"),
      description: t("welcomeToTheFutureOfEducation"),
      icon: <Rocket className="w-12 h-12 text-blue-300" />,
    },
    {
      id: "identity",
      title: t("votreProfil"),
      description: t("tellUsAboutYourself"),
      icon: <Users className="w-12 h-12 text-purple-300" />,
      fields: ["title", "teaching_role", "contract_type"],
    },
    {
      id: "expertise",
      title: t("votreExpertise"),
      description: t("whereDoYouTeach"),
      icon: <GraduationCap className="w-12 h-12 text-pink-300" />,
      fields: ["school_level", "grade_taught"],
    },
    {
      id: "specialty",
      title: t("votreSpécialité"),
      description: t("whatSubjectsDoYouTeach"),
      icon: <Atom className="w-12 h-12 text-indigo-300" />,
      fields: ["subject_specialty"],
      conditional: (values) => values.school_level === "Collège" || values.school_level === "Lycée",
    },
    {
      id: "complete",
      title: t("c'estParti"),
      description: t("youreReadyToBegin"),
      icon: <Sparkles className="w-12 h-12 text-yellow-300" />,
    },
  ];

  const handleSchoolLevelChange = (value: string) => {
    form.setValue("school_level", value);
    form.setValue("grade_taught", ""); // Reset grade when school level changes

    switch(value) {
      case "Maternelle":
        setAvailableGrades(["Petite Section", "Moyenne Section", "Grande Section"]);
        break;
      case "Élémentaire":
        setAvailableGrades(["CP", "CE1", "CE2", "CM1", "CM2"]);
        break;
      case "Collège":
        setAvailableGrades(["6ème", "5ème", "4ème", "3ème"]);
        break;
      case "Lycée":
        setAvailableGrades(["2nde", "1ère", "Terminale"]);
        break;
      default:
        setAvailableGrades([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Filter steps based on conditional logic
  const filteredSteps = steps.filter(step => {
    if (!step.conditional) return true;
    return step.conditional(form.getValues());
  });

  const activeStep = filteredSteps[currentStep];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await ProfessorService.updateProfile(values);
      toast.success(t("profileUpdated"), {
        style: {
          background: "rgba(16, 24, 64, 0.9)",
          color: "white",
          borderRadius: "0.5rem",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        icon: <Sparkles className="h-5 w-5 text-blue-400" />,
      });
      onComplete();
    } catch (error) {
      console.error("Échec de la mise à jour du profil:", error);
      toast.error(t("failedToUpdateProfile"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const nextStep = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit form on last step
      form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Initial welcome animation
  if (!animationComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <ParticleField />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="text-center"
        >
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 20, repeat: Infinity, ease: "linear" }
            }}
            className="inline-block mb-6"
          >
            <School className="w-24 h-24 text-blue-500" />
          </motion.div>
          <motion.h1
            className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {t("eduNova")}
          </motion.h1>
          <motion.p
            className="text-xl text-blue-200"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {t("reimaginingEducation")}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden">
        <ParticleField />
      </div>

      {currentStep < filteredSteps.length - 1 && (
        <OrbitSystem />
      )}

      <StepIndicator
        currentStep={currentStep}
        totalSteps={filteredSteps.length}
      />

      <motion.div
        className="z-10 w-full max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MotionGradient className="p-8 backdrop-blur-xl">
          <div className="mb-6 flex justify-center">
            {activeStep.icon}
          </div>

          <StepTitle
            title={activeStep.title}
            description={activeStep.description}
          />

          <Form {...form}>
            <form className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeStep.id === "welcome" && (
                    <div className="text-center">
                      <motion.p
                        className="text-blue-100 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {t("welcomeText")}
                      </motion.p>

                      <motion.div
                        className="flex justify-center mt-8"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative"
                        >
                          <Button
                            onClick={nextStep}
                            className="bg-white hover:bg-blue-50 text-indigo-900 text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
                          >
                            <Compass className="mr-2 h-5 w-5" />
                            {t("commencerL'aventure")}
                          </Button>
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                              boxShadow: [
                                "0 0 0 0 rgba(255, 255, 255, 0)",
                                "0 0 0 15px rgba(255, 255, 255, 0)"
                              ]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "loop"
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    </div>
                  )}

                  {activeStep.id === "identity" && (
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-white/10 border-none text-white backdrop-blur-sm">
                                  <SelectValue placeholder={t("selectTitle")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-indigo-900/80 backdrop-blur-md border-indigo-500 text-white">
                                <SelectItem value="M.">M.</SelectItem>
                                <SelectItem value="Mme">Mme</SelectItem>
                                <SelectItem value="Dr.">Dr.</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-pink-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="teaching_role"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-white/10 border-none text-white backdrop-blur-sm">
                                  <SelectValue placeholder={t("selectTeachingRole")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-indigo-900/80 backdrop-blur-md border-indigo-500 text-white">
                                <SelectItem value="Professeur des écoles">Professeur des écoles</SelectItem>
                                <SelectItem value="Professeur certifié">Professeur certifié</SelectItem>
                                <SelectItem value="Professeur agrégé">Professeur agrégé</SelectItem>
                                <SelectItem value="Professeur contractuel">Professeur contractuel</SelectItem>
                                <SelectItem value="Directeur d'école">Directeur d'école</SelectItem>
                                <SelectItem value="Assistant d'éducation">Assistant d'éducation</SelectItem>
                                <SelectItem value="AESH">AESH</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-pink-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contract_type"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-white/10 border-none text-white backdrop-blur-sm">
                                  <SelectValue placeholder={t("selectContractType")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-indigo-900/80 backdrop-blur-md border-indigo-500 text-white">
                                <SelectItem value="Titulaire">Titulaire</SelectItem>
                                <SelectItem value="Contractuel">Contractuel</SelectItem>
                                <SelectItem value="Stagiaire">Stagiaire</SelectItem>
                                <SelectItem value="Vacataire">Vacataire</SelectItem>
                                <SelectItem value="Remplaçant">Remplaçant</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-pink-300" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {activeStep.id === "expertise" && (
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="school_level"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={handleSchoolLevelChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-white/10 border-none text-white backdrop-blur-sm">
                                  <SelectValue placeholder={t("selectSchoolLevel")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-indigo-900/80 backdrop-blur-md border-indigo-500 text-white">
                                <SelectItem value="Maternelle">Maternelle</SelectItem>
                                <SelectItem value="Élémentaire">Élémentaire</SelectItem>
                                <SelectItem value="Collège">Collège</SelectItem>
                                <SelectItem value="Lycée">Lycée</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-pink-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="grade_taught"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={availableGrades.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-white/10 border-none text-white backdrop-blur-sm">
                                  <SelectValue placeholder={availableGrades.length > 0
                                    ? t("selectGradeTaught")
                                    : t("selectSchoolLevelFirst")}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-indigo-900/80 backdrop-blur-md border-indigo-500 text-white">
                                {availableGrades.map((grade) => (
                                  <SelectItem key={grade} value={grade}>
                                    {grade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-pink-300" />
                          </FormItem>
                        )}
                      />

                      {availableGrades.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-4 p-4 rounded-lg bg-blue-600/20 backdrop-blur-md border border-blue-500/30"
                        >
                          <div className="flex items-start">
                            <Star className="text-yellow-300 mr-3 mt-1 w-5 h-5 flex-shrink-0" />
                            <p className="text-blue-100 text-sm">
                              {form.watch("school_level") === "Élémentaire"
                                ? t("elementaryClassInfo")
                                : t("classInfo")}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {activeStep.id === "specialty" && (
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="subject_specialty"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-white/10 border-none text-white backdrop-blur-sm">
                                  <SelectValue placeholder={t("selectSubjectSpecialty")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-indigo-900/80 backdrop-blur-md border-indigo-500 text-white">
                                <SelectItem value="Français">Français</SelectItem>
                                <SelectItem value="Mathématiques">Mathématiques</SelectItem>
                                <SelectItem value="Histoire-Géographie">Histoire-Géographie</SelectItem>
                                <SelectItem value="Anglais">Anglais</SelectItem>
                                <SelectItem value="Espagnol">Espagnol</SelectItem>
                                <SelectItem value="Allemand">Allemand</SelectItem>
                                <SelectItem value="SVT">SVT</SelectItem>
                                <SelectItem value="Physique-Chimie">Physique-Chimie</SelectItem>
                                <SelectItem value="EPS">EPS</SelectItem>
                                <SelectItem value="Arts plastiques">Arts plastiques</SelectItem>
                                <SelectItem value="Musique">Musique</SelectItem>
                                <SelectItem value="Technologie">Technologie</SelectItem>
                                <SelectItem value="SES">SES</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-pink-300" />
                          </FormItem>
                        )}
                      />

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 p-4 rounded-lg bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30"
                      >
                        <div className="flex items-start">
                          <BookOpen className="text-blue-300 mr-3 mt-1 w-5 h-5 flex-shrink-0" />
                          <p className="text-blue-100 text-sm">
                            {t("specialtyDescription")}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {activeStep.id === "complete" && (
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 flex justify-center"
                      >
                        <div className="relative">
                          <div className="absolute -inset-4">
                            <div className="w-full h-full max-w-sm mx-auto lg:mx-0 rounded-full blur-lg bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-75" />
                          </div>
                          <Sparkles className="relative w-20 h-20 text-white" />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                      >
                        <h3 className="text-2xl font-bold text-white mb-4">
                          {t("profileReadyTitle")}
                        </h3>
                        <p className="text-blue-100">
                          {t("profileReadyDescription")}
                        </p>
                      </motion.div>

                      <motion.div
                        className="mt-6 grid gap-4"
                        variants={{
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.2
                            }
                          }
                        }}
                        initial="hidden"
                        animate="show"
                      >
                        {form.watch("title") && (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            className="flex items-center justify-center p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                          >
                            <p className="text-white">
                              <span className="font-semibold">{t("title")}:</span> {form.watch("title")}
                            </p>
                          </motion.div>
                        )}

                        {form.watch("teaching_role") && (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            className="flex items-center justify-center p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                          >
                            <p className="text-white">
                              <span className="font-semibold">{t("role")}:</span> {form.watch("teaching_role")}
                            </p>
                          </motion.div>
                        )}

                        {form.watch("school_level") && (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            className="flex items-center justify-center p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                          >
                            <p className="text-white">
                              <span className="font-semibold">{t("level")}:</span> {form.watch("school_level")}
                            </p>
                            <p className="text-white">
                              <span className="font-semibold">{t("level")}:</span> {form.watch("school_level")}
                            </p>
                          </motion.div>
                        )}

                        {form.watch("grade_taught") && (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            className="flex items-center justify-center p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                          >
                            <p className="text-white">
                              <span className="font-semibold">{t("grade")}:</span> {form.watch("grade_taught")}
                            </p>
                          </motion.div>
                        )}

                        {form.watch("subject_specialty") && (
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              show: { opacity: 1, x: 0 }
                            }}
                            className="flex items-center justify-center p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                          >
                            <p className="text-white">
                              <span className="font-semibold">{t("specialty")}:</span> {form.watch("subject_specialty")}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8">
                {currentStep > 0 && currentStep < filteredSteps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      {t("précédent")}
                    </Button>
                  </motion.div>
                )}

                {currentStep === 0 && <div></div>}

                {currentStep < filteredSteps.length - 1 ? (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {currentStep === filteredSteps.length - 2 ? t("terminer") : t("suivant")}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Rocket className="h-5 w-5" />
                          </motion.div>
                          {t("creatingProfile")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          {t("lancerL'aventure")}
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </form>
          </Form>
        </MotionGradient>
      </motion.div>

      {/* Final success portal animation - appears after submission */}
      {isSubmitting && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute inset-0">
              <div className="w-full h-full rounded-full blur-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-60 animate-pulse" />
            </div>
            <div className="relative flex flex-col items-center justify-center p-12">
              <motion.div
                animate={{
                  rotate: 360,
                  transition: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
              >
                <School className="w-16 h-16 text-white mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">{t("creatingYourUniverse")}</h2>
              <p className="text-blue-200 text-center">
                {t("preparingYourDigitalClassroom")}
              </p>
              <motion.div
                className="mt-8 flex space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-white"
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
