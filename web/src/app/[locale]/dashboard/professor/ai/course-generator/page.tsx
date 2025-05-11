"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Wand2,
  Clock,
  BookOpen,
  Trash2,
  MoreVertical,
  Star,
  History,
  Sparkles,
  Lightbulb,
  Calendar,
  GraduationCap,
  BarChart3,
  FileText,
  ChevronRight,
  Copy,
  Play,
  RefreshCw,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import courseGenerationService, { GenerationSession, CreateSessionRequest } from '@/services/CourseGenerationService';

interface GetSessionsResponse {
  sessions: GenerationSession[];
}

const suggestedPrompts = [
  {
    title: "Cours de Mathématiques pour 1ère Bac Sciences",
    prompt: "Créer un cours de Mathématiques pour la 1ère Bac Sciences avec focus sur les fonctions logarithmiques",
    preferences: {
      subject: "Mathématiques",
      educationLevel: "bac_1",
      duration: "semester",
      keyTopics: "fonctions logarithmiques, équations logarithmiques, propriétés des logarithmes"
    }
  },
  {
    title: "Physique-Chimie Terminale S",
    prompt: "Développer un curriculum de Physique-Chimie pour Terminale S incluant la mécanique quantique",
    preferences: {
      subject: "Physique-Chimie",
      educationLevel: "bac_2",
      duration: "semester",
      keyTopics: "mécanique quantique, optique, cinématique"
    }
  },
  {
    title: "Littérature Française 2nde",
    prompt: "Concevoir un programme de Littérature Française pour 2nde avec analyse des œuvres classiques",
    preferences: {
      subject: "Littérature",
      educationLevel: "lycee_2",
      duration: "semester",
      keyTopics: "littérature classique, analyse des œuvres, critique littéraire"
    }
  },
  {
    title: "Histoire-Géographie Collège",
    prompt: "Élaborer un cours d'Histoire-Géographie pour Collège sur l'Empire Mérovingien",
    preferences: {
      subject: "Histoire",
      educationLevel: "college",
      duration: "quarter",
      keyTopics: "Empire Mérovingien, Moyen Âge, géographie de l'Europe"
    }
  }
];

const quickTemplates = [
  {
    title: "Cours Scientifique",
    description: "Mathématiques, Physique, Chimie",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    defaultPreferences: {
      educationLevel: "university",
      duration: "semester",
      difficulty: "intermediate"
    }
  },
  {
    title: "Cours Littéraire",
    description: "Français, Philosophie, Histoire",
    icon: <BookOpen className="h-6 w-6" />,
    color: "bg-green-50 text-green-600 border-green-200",
    defaultPreferences: {
      educationLevel: "lycee",
      duration: "semester",
      difficulty: "intermediate"
    }
  },
  {
    title: "Formation Pratique",
    description: "Ateliers, Labs, Projets",
    icon: <Lightbulb className="h-6 w-6" />,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    defaultPreferences: {
      educationLevel: "professional",
      duration: "quarter",
      difficulty: "advanced"
    }
  },
  {
    title: "Cours Personnalisé",
    description: "Configuration avancée",
    icon: <Wand2 className="h-6 w-6" />,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    defaultPreferences: {}
  }
];

const CourseGeneratorPage = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<GenerationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, statusFilter]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await courseGenerationService.getSessions(statusFilter || undefined);
      setSessions(response);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions de génération",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewGeneration = async (preferences?: Partial<CreateSessionRequest>) => {
    // If no preferences provided, redirect to generator with empty session
    if (!preferences) {
      router.push(`/${locale}/dashboard/professor/ai/course-generator/new`);
      return;
    }

    try {
      const createRequest: CreateSessionRequest = {
        subject_area: preferences.subject_area || "General",
        education_level: preferences.education_level || "university",
        course_duration: preferences.course_duration || "semester",
        difficulty_level: preferences.difficulty_level || "intermediate",
        key_topics: preferences.key_topics,
        include_assessments: preferences.include_assessments ?? true,
        include_project_ideas: preferences.include_project_ideas ?? true,
        teaching_materials: preferences.teaching_materials ?? true,
        additional_context: preferences.additional_context,
      };

      const { sessionId } = await courseGenerationService.createSession(createRequest);
      router.push(`/${locale}/dashboard/professor/ai/course-generator/${sessionId}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer une nouvelle session",
        variant: "destructive"
      });
    }
  };

  const handleOpenSession = (session: GenerationSession) => {
    router.push(`/${locale}/dashboard/professor/ai/course-generator/${session.id}`);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setIsDeleting(sessionId);

    try {
      await courseGenerationService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast({
        title: "Supprimé",
        description: "La session de génération a été supprimée",
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la session",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicateSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setIsDuplicating(sessionId);

    try {
      const { sessionId: newSessionId } = await courseGenerationService.duplicateSession(sessionId);
      router.push(`/${locale}/dashboard/professor/ai/course-generator/${newSessionId}`);
    } catch (error) {
      console.error('Failed to duplicate session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la session",
        variant: "destructive"
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleStartSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setIsStarting(sessionId);

    try {
      await courseGenerationService.startSession(sessionId);
      router.push(`/${locale}/dashboard/professor/ai/course-generator/${sessionId}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la session",
        variant: "destructive"
      });
    } finally {
      setIsStarting(null);
    }
  };

  const handleStartWithPrompt = async (prompt: any) => {
    try {
      const createRequest: CreateSessionRequest = {
        subject_area: prompt.preferences.subject,
        education_level: prompt.preferences.educationLevel,
        course_duration: prompt.preferences.duration,
        key_topics: prompt.preferences.keyTopics,
        include_assessments: true,
        include_project_ideas: true,
        teaching_materials: true,
        additional_context: prompt.prompt,
      };

      const { sessionId } = await courseGenerationService.createSession(createRequest);

      // Start the session immediately
      await courseGenerationService.startSession(sessionId);

      router.push(`/${locale}/dashboard/professor/ai/course-generator/${sessionId}`);
    } catch (error) {
      console.error('Failed to start with prompt:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la génération",
        variant: "destructive"
      });
    }
  };

  const handleTemplateClick = async (template: any) => {
    // Open a dialog or page for configuring the course details
    handleCreateNewGeneration(template.defaultPreferences);
  };

  const handleExportToCourse = async (e: React.MouseEvent, session: GenerationSession) => {
    e.stopPropagation();
    if (session.status !== 'complete') return;

    try {
      const result = await courseGenerationService.exportToCourse(session.id);

      // Update the session in the list to reflect it's exported
      setSessions(sessions.map(s =>
        s.id === session.id
          ? { ...s, status: 'exported' as any }
          : s
      ));

      toast({
        title: "Course exported successfully!",
        description: `"${result.title}" is now available in your courses dashboard.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}${result.courseUrl}`)}
          >
            View Course
          </Button>
        ),
      });
    } catch (error: any) {
      console.error('Error exporting course:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'exporter le cours",
        variant: "destructive"
      });
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'brainstorming':
      case 'structuring':
      case 'detailing':
      case 'finalizing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'complete':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'exported':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'brainstorming':
        return 'Réflexion';
      case 'structuring':
        return 'Structuration';
      case 'detailing':
        return 'Détaillage';
      case 'finalizing':
        return 'Finalisation';
      case 'complete':
        return 'Terminé';
      case 'error':
        return 'Erreur';
      default:
        return 'Créé';
    }
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-light tracking-tight">
            {t("courseGenerator") || "Générateur de Cours"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {t("createPersonalizedCourses") || "Créez des cours personnalisés avec l'aide de l'IA"}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                {statusFilter ? getStatusText(statusFilter) : 'Tous les états'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                Tous les états
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('created')}>
                Créé
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('complete')}>
                Terminé
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('error')}>
                Erreur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => handleCreateNewGeneration()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Génération
          </Button>
        </div>
      </div>

      {/* Quick Start Templates */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">
          {t("quickTemplates") || "Modèles Rapides"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickTemplates.map((template, idx) => (
            <Card
              key={idx}
              className={`border cursor-pointer hover:shadow-md transition-all duration-200 ${template.color} border`}
              onClick={() => handleTemplateClick(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {template.icon}
                  <h3 className="font-medium">{template.title}</h3>
                </div>
                <p className="text-sm opacity-80">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          {t("suggestedPrompts") || "Suggestions de Prompts"}
        </h2>
        <div className="grid gap-3">
          {suggestedPrompts.map((prompt, idx) => (
            <Card
              key={idx}
              className="border hover:border-amber-200 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-all duration-200 cursor-pointer"
              onClick={() => handleStartWithPrompt(prompt)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-medium">{idx + 1}</span>
                    <div>
                      <h3 className="font-medium text-sm">{prompt.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{prompt.prompt}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <History className="h-5 w-5" />
          {t("recentSessions") || "Sessions Récentes"}
        </h2>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid gap-4">
            {filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="border hover:border-primary/20 transition-all duration-200 cursor-pointer"
                onClick={() => handleOpenSession(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(session.status)}
                        <h3 className="font-medium">
                          {session.title || `${session.subject} - ${session.educationLevel}`}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {getStatusText(session.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {session.description || `Cours de ${session.subject} pour ${session.educationLevel} - ${session.duration}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {session.educationLevel}
                        </span>
                        {session.status !== 'created' && session.status !== 'complete' && session.status !== 'error' && (
                          <span className="flex items-center gap-1 text-primary">
                            {session.progress}% terminé
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" disabled={isDeleting === session.id || isDuplicating === session.id || isStarting === session.id}>
                          {(isDeleting === session.id || isDuplicating === session.id || isStarting === session.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {session.status === 'created' && (
                          <DropdownMenuItem onClick={(e) => handleStartSession(e, session.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Démarrer
                          </DropdownMenuItem>
                        )}
                        {session.status === 'complete' && (
                          <DropdownMenuItem onClick={(e) => handleExportToCourse(e, session)}>
                            <Save className="h-4 w-4 mr-2" />
                            Exporter vers Cours
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => handleDuplicateSession(e, session.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDeleteSession(e, session.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="rounded-full p-4 bg-muted mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">
                {searchQuery ?
                  'Aucune session trouvée' :
                  (t("noSessions") || "Aucune session de génération")
                }
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ?
                  'Essayez de modifier vos critères de recherche.' :
                  (t("startGenerating") || "Commencez à créer des cours personnalisés")
                }
              </p>
              {!searchQuery && (
                <Button variant="outline" onClick={() => handleCreateNewGeneration()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Génération
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Features Overview */}
      <Card className="border-0 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full p-3 bg-primary/10 text-primary mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-1">IA Avancée</h3>
              <p className="text-sm text-muted-foreground">
                Génération automatique de contenu pédagogique adapté
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full p-3 bg-primary/10 text-primary mb-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-1">Personnalisation</h3>
              <p className="text-sm text-muted-foreground">
                Adaptez chaque cours à vos besoins spécifiques
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full p-3 bg-primary/10 text-primary mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-1">Export Facile</h3>
              <p className="text-sm text-muted-foreground">
                Téléchargez vos cours en plusieurs formats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGeneratorPage;
