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
  ChevronRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface GenerationSession {
  id: string;
  subject: string;
  educationLevel: string;
  duration: string;
  status: 'created' | 'generating' | 'complete' | 'error';
  progress: number;
  createdAt: string;
  title?: string;
  description?: string;
  lastModified?: string;
}

const suggestedPrompts = [
  "Créer un cours de Mathématiques pour la 1ère Bac Sciences avec focus sur les fonctions logarithmiques",
  "Développer un curriculum de Physique-Chimie pour Terminale S incluant la mécanique quantique",
  "Concevoir un programme de Littérature Française pour 2nde avec analyse des œuvres classiques",
  "Élaborer un cours d'Histoire-Géographie pour Collège sur l'Empire Mérovingien"
];

const quickTemplates = [
  {
    title: "Cours Scientifique",
    description: "Mathématiques, Physique, Chimie",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    title: "Cours Littéraire",
    description: "Français, Philosophie, Histoire",
    icon: <BookOpen className="h-6 w-6" />,
    color: "bg-green-50 text-green-600 border-green-200"
  },
  {
    title: "Formation Pratique",
    description: "Ateliers, Labs, Projets",
    icon: <Lightbulb className="h-6 w-6" />,
    color: "bg-purple-50 text-purple-600 border-purple-200"
  },
  {
    title: "Cours Personnalisé",
    description: "Configuration avancée",
    icon: <Wand2 className="h-6 w-6" />,
    color: "bg-amber-50 text-amber-600 border-amber-200"
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Load from API or localStorage
      const storedSessions = localStorage.getItem('courseGenerationSessions');
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
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

  const handleCreateNewGeneration = () => {
    const sessionId = uuidv4();
    router.push(`/${locale}/dashboard/professor/ai/course-generator/${sessionId}`);
  };

  const handleOpenSession = (session: GenerationSession) => {
    router.push(`/${locale}/dashboard/professor/ai/course-generator/${session.id}`);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('courseGenerationSessions', JSON.stringify(updatedSessions));

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
    }
  };

  const handleStartWithPrompt = (prompt: string) => {
    const sessionId = uuidv4();
    sessionStorage.setItem(`course-gen-${sessionId}-initial-prompt`, prompt);
    router.push(`/${locale}/dashboard/professor/ai/course-generator/${sessionId}`);
  };

  const filteredSessions = sessions.filter(session =>
    session.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />;
      case 'complete':
        return <Star className="h-4 w-4 text-green-500" />;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'generating':
        return 'En cours...';
      case 'complete':
        return 'Terminé';
      case 'error':
        return 'Erreur';
      default:
        return 'Créé';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
        <Button onClick={handleCreateNewGeneration} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Génération
        </Button>
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
              onClick={handleCreateNewGeneration}
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
                    <p className="text-sm">{prompt}</p>
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
                        {session.status === 'generating' && (
                          <span className="flex items-center gap-1 text-primary">
                            {session.progress}% terminé
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                {t("noSessions") || "Aucune session de génération"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("startGenerating") || "Commencez à créer des cours personnalisés"}
              </p>
              <Button variant="outline" onClick={handleCreateNewGeneration}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Génération
              </Button>
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
