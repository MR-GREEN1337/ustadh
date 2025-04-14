import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/providers/AuthProvider';
import {
  IntelligentNoteService,
  Note,
  NoteCollaborator,
  AISuggestion
} from '@/services/IntelligentNoteService';
import { useAISuggestions } from '@/hooks/useAISuggestions';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Save,
  Share2,
  Users,
  Clock,
  Trash2,
  MoreHorizontal,
  ArrowLeft,
  Lightbulb,
  Check,
  X,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface NoteEditorProps {
  noteId?: string;
  initialNote?: Note;
  isNewNote?: boolean;
  initialOpenShare?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  noteId,
  initialNote,
  isNewNote = false,
  initialOpenShare = false
}) => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [note, setNote] = useState<Note | null>(initialNote || null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialNote);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(initialOpenShare);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write' | 'admin'>('read');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Use the AI suggestions WebSocket hook
  const {
    isConnected: wsConnected,
    liveSuggestion,
    isGenerating: isGeneratingLive,
    sendContent: sendContentToWS,
    clearSuggestion
  } = useAISuggestions({
    noteId: note?.id,
    isAiEnabled: note?.ai_enhanced
  });

  const lastSavedRef = useRef({ title, content });
  const hasUnsavedChanges = title !== lastSavedRef.current.title || content !== lastSavedRef.current.content;

  // Fetch note data if noteId is provided and we don't have initialNote
  useEffect(() => {
    const fetchNoteData = async () => {
      if (!noteId || initialNote) return;

      try {
        setIsLoading(true);
        const data = await IntelligentNoteService.getNote(noteId);
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
        setCollaborators(data.collaborators || []);
        lastSavedRef.current = { title: data.title, content: data.content };

        // Also fetch AI suggestions if the note has them enabled
        if (data.ai_enhanced) {
          const suggestionsData = await IntelligentNoteService.getAISuggestions(noteId);
          setAiSuggestions(suggestionsData.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('Failed to load note. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoteData();
  }, [noteId, initialNote]);

  // If initialNote is provided, use its values
  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setCollaborators(initialNote.collaborators || []);
      lastSavedRef.current = { title: initialNote.title, content: initialNote.content };
    }
  }, [initialNote]);

  // Set up unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, isSaving, title, content]);

  // Debounce content changes to avoid sending too many WebSocket messages
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      if (note?.ai_enhanced) {
        sendContentToWS(newContent);
      }
    }, 1000); // Wait 1 second after typing stops

    setTypingTimeout(timeout);
  };

  // Apply live suggestion
  const applyLiveSuggestion = () => {
    if (liveSuggestion) {
      setContent(prev => prev + '\n\n' + liveSuggestion);
      clearSuggestion();
    }
  };

// Handle save
const handleSave = async () => {
  if (!hasUnsavedChanges) return;

  try {
    setIsSaving(true);
    setError(null);

    // Log initialNote to see if folder_id is present
    console.log("Initial note:", initialNote);
    console.log("Current note state:", note);

    const updateData = {
      title,
      content,
      folder_id: initialNote?.folder_id || note?.folder_id, // Include folder_id from initial or current note
      ai_enhanced: note?.ai_enhanced || false
    };

    console.log("Saving with data:", updateData); // Add for debugging

    if (note && noteId) {
      // Update existing note
      const updatedNote = await IntelligentNoteService.updateNote(noteId, updateData);
      setNote(updatedNote);
    } else {
      // Create new note
      const newNote = await IntelligentNoteService.createNote({
        ...updateData,
        folder_id: initialNote?.folder_id, // Explicitly include folder_id from initialNote
        ai_enhanced: true // Enable AI by default for new notes
      });
      setNote(newNote);

      // Update URL to include the new note ID if we're in a new note view
      if (isNewNote && newNote.id) {
        router.push(`/${locale}/dashboard/tutor/notes/${newNote.id}`);
      }
    }

    lastSavedRef.current = { title, content };
  } catch (error) {
    console.error('Error saving note:', error);
    setError('Failed to save note. Please try again.');
  } finally {
    setIsSaving(false);
  }
};

  // Generate AI suggestions
  const handleGenerateAISuggestions = async () => {
    if (!note?.id) return;

    try {
      setIsGeneratingSuggestions(true);
      setError(null);

      const data = await IntelligentNoteService.generateAISuggestions(note.id);
      setAiSuggestions(data.suggestions || []);
      setShowAiSuggestions(true);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setError('Failed to generate AI suggestions. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Apply AI suggestion
  const handleApplySuggestion = async (suggestionId: string) => {
    if (!note?.id) return;

    try {
      await IntelligentNoteService.applyAISuggestion(note.id, suggestionId);

      // Refresh the note data after applying the suggestion
      const updatedNote = await IntelligentNoteService.getNote(note.id);
      setNote(updatedNote);
      setTitle(updatedNote.title);
      setContent(updatedNote.content);
      lastSavedRef.current = { title: updatedNote.title, content: updatedNote.content };

      // Update the suggestion list
      const suggestionsData = await IntelligentNoteService.getAISuggestions(note.id);
      setAiSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
      setError('Failed to apply AI suggestion. Please try again.');
    }
  };

  // Share note with a collaborator
  const handleShareNote = async () => {
    if (!note?.id || !shareEmail) return;

    try {
      setIsSharing(true);
      setError(null);

      await IntelligentNoteService.shareNote({
        note_id: note.id,
        email: shareEmail,
        permissions: sharePermission
      });

      // Refresh collaborators list
      const updatedNote = await IntelligentNoteService.getNote(note.id);
      setCollaborators(updatedNote.collaborators || []);

      // Reset share form
      setShareEmail('');
      setShowShareDialog(false);
    } catch (error) {
      console.error('Error sharing note:', error);
      setError('Failed to share note. Please check the email and try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (userId: string) => {
    if (!note?.id) return;

    try {
      await IntelligentNoteService.removeCollaborator(note.id, userId);

      // Update collaborators list
      setCollaborators(collaborators.filter(c => c.user_id !== userId));
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setError('Failed to remove collaborator. Please try again.');
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!note?.id) return;

    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await IntelligentNoteService.deleteNote(note.id);
        router.push(`/${locale}/dashboard/tutor/notes`);
      } catch (error) {
        console.error('Error deleting note:', error);
        setError('Failed to delete note. Please try again.');
      }
    }
  };

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="text-center">
          <div className="mb-4">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="font-serif">{t('loadingNote') || 'Loading manuscript...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation and actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="p-0 text-muted-foreground hover:bg-transparent hover:text-foreground font-serif"
          onClick={() => router.push(`/${locale}/dashboard/tutor/notes`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToNotes') || 'Back to Notes'}
        </Button>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-muted-foreground text-sm font-light italic">
              {isSaving ? (t('saving') || 'Saving...') : (t('unsavedChanges') || 'Unsaved changes')}
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="font-serif"
          >
            <Save className="h-4 w-4 mr-2" />
            {t('save') || 'Save'}
          </Button>

          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="font-serif"
                disabled={!note?.id}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('share') || 'Share'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#f8f5f0] dark:bg-[#121212] border-stone-200 dark:border-stone-800">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">{t('shareNote') || 'Share Note'}</DialogTitle>
                <DialogDescription className="font-light">
                  {t('shareNoteDescription') || 'Invite others to collaborate on this note.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    {t('email') || 'Email'}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="bg-white/50 dark:bg-black/10 border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('permissions') || 'Permissions'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={sharePermission === 'read' ? 'default' : 'outline'}
                      onClick={() => setSharePermission('read')}
                      size="sm"
                      className="font-serif"
                    >
                      {t('canRead') || 'Can read'}
                    </Button>
                    <Button
                      type="button"
                      variant={sharePermission === 'write' ? 'default' : 'outline'}
                      onClick={() => setSharePermission('write')}
                      size="sm"
                      className="font-serif"
                    >
                      {t('canEdit') || 'Can edit'}
                    </Button>
                    <Button
                      type="button"
                      variant={sharePermission === 'admin' ? 'default' : 'outline'}
                      onClick={() => setSharePermission('admin')}
                      size="sm"
                      className="font-serif"
                    >
                      {t('admin') || 'Admin'}
                    </Button>
                  </div>
                </div>

                {collaborators.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-medium">{t('currentCollaborators') || 'Current Collaborators'}</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {collaborators.map((collaborator) => (
                        <div
                          key={collaborator.id}
                          className="flex items-center justify-between p-2 rounded-md bg-white/30 dark:bg-black/10"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {collaborator.name?.charAt(0).toUpperCase() || collaborator.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{collaborator.name || collaborator.email}</p>
                              <p className="text-xs text-muted-foreground capitalize">{collaborator.permissions}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowShareDialog(false)}
                  className="font-serif"
                >
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleShareNote}
                  disabled={!shareEmail || isSharing}
                  className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white font-serif"
                >
                  {isSharing ? (
                    <>{t('sharing') || 'Sharing...'}</>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('invite') || 'Invite'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="font-serif"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800">
              <DropdownMenuLabel className="font-serif">{t('options') || 'Options'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                if (note?.ai_enhanced) {
                  handleGenerateAISuggestions();
                } else if (note?.id) {
                  // Enable AI for this note
                  IntelligentNoteService.updateNote(note.id, { ai_enhanced: true })
                    .then(() => {
                      setNote({ ...note, ai_enhanced: true });
                      handleGenerateAISuggestions();
                    });
                }
              }}>
                <Sparkles className="h-4 w-4 mr-2" />
                {note?.ai_enhanced
                  ? (t('generateAISuggestions') || 'Generate AI Suggestions')
                  : (t('enableAI') || 'Enable AI Assistance')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAiSuggestions(!showAiSuggestions)} disabled={!aiSuggestions.length}>
                <Lightbulb className="h-4 w-4 mr-2" />
                {showAiSuggestions
                  ? (t('hideAISuggestions') || 'Hide AI Suggestions')
                  : (t('showAISuggestions') || 'Show AI Suggestions')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteNote} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deleteNote') || 'Delete Note'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* WebSocket connection status */}
      {note?.ai_enhanced && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <span className="text-xs text-muted-foreground">
            {wsConnected
              ? (t('aiAssistantConnected') || 'AI Assistant Connected')
              : (t('aiAssistantDisconnected') || 'AI Assistant Disconnected')}
          </span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-4 flex items-start">
          <div className="flex-1">{error}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-auto p-0 text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main note editor */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Content area - use conditional rendering instead of template literals */}
        <div className={`${showAiSuggestions && aiSuggestions.length > 0 ? 'md:col-span-8' : 'md:col-span-12'} space-y-6 w-full`}>
          {/* Note content */}
          <Card className="w-full overflow-hidden border-stone-200 dark:border-stone-800 bg-[#f8f5f0] dark:bg-black/10">
            <CardContent className="p-0">
              <div className="relative overflow-hidden">
                {/* Title */}
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/20">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('noteTitle') || 'Note Title'}
                    className="text-xl font-serif font-light border-0 p-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50 w-full"
                  />
                </div>

                {/* Illuminated manuscript decorative header */}
                {title && (
                  <div className="w-full overflow-hidden">
                    <svg width="100%" height="8" viewBox="0 0 100 2" preserveAspectRatio="none">
                      <pattern id="illuminated-border" width="20" height="2" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="1" x2="20" y2="1" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,3" className="text-amber-700 dark:text-amber-500" />
                      </pattern>
                      <rect width="100%" height="2" fill="url(#illuminated-border)" />
                    </svg>
                  </div>
                )}

                {/* Editor content */}
                <div className="p-6">
                  <div className="illuminated-text w-full">
                    {title && content && (
                      <div className="float-left mr-3 mb-1 relative">
                        <span className="text-4xl font-serif text-primary leading-none">
                          {content.charAt(0)}
                        </span>
                      </div>
                    )}
                    <Textarea
                      value={content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder={t('startWriting') || 'Start writing your notes here...'}
                      className="w-full min-h-[50vh] text-lg border-0 p-0 focus-visible:ring-0 bg-transparent font-light leading-relaxed resize-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live suggestion display */}
          {liveSuggestion && (
            <div className="relative p-4 border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10 rounded-md">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Sparkles className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                {t('liveSuggestion') || 'Live Suggestion'}
              </h3>
              <p className="text-sm font-light leading-relaxed mb-2">{liveSuggestion}</p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSuggestion}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('dismiss') || 'Dismiss'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyLiveSuggestion}
                  className="h-8 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {t('apply') || 'Apply'}
                </Button>
              </div>
            </div>
          )}

          {/* Note metadata */}
          <div className="flex flex-wrap items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {note?.updated_at
                    ? new Date(note.updated_at).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : t('notSavedYet') || 'Not saved yet'}
                </span>
              </div>

              {note?.version !== undefined && (
                <div className="flex items-center">
                  <span>{t('version') || 'Version'} {note.version}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {collaborators.length > 0 && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{collaborators.length} {collaborators.length === 1 ? t('collaborator') || 'collaborator' : t('collaborators') || 'collaborators'}</span>
                </div>
              )}

              {note?.ai_enhanced && (
                <Badge variant="outline" className="border-primary/20 bg-primary/5">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* AI Suggestions Panel - only show when suggestions are available and panel is toggled on */}
        {showAiSuggestions && aiSuggestions.length > 0 && (
          <div className="md:col-span-4 space-y-4">
            <Card className="border-stone-200 dark:border-stone-800 bg-[#f8f5f0] dark:bg-black/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg">{t('aiSuggestions') || 'AI Suggestions'}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAiSuggestions(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isGeneratingSuggestions ? (
                  <div className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-muted-foreground font-light">{t('generatingInsights') || 'Generating insights...'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {aiSuggestions.filter(s => !s.applied).map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 rounded-md bg-white/30 dark:bg-black/10 border border-amber-100 dark:border-amber-900/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="bg-transparent capitalize">
                            {suggestion.type}
                          </Badge>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApplySuggestion(suggestion.id)}
                                    className="h-6 w-6 p-0 text-emerald-600 dark:text-emerald-400"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('applySuggestion') || 'Apply suggestion'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <p className="text-sm font-light leading-relaxed">{suggestion.content}</p>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAISuggestions}
                      disabled={isGeneratingSuggestions}
                      className="w-full mt-2"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('generateMoreSuggestions') || 'Generate More Suggestions'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decorative AI diagram */}
            <div className="hidden md:block text-center">
              <svg width="100%" height="120" viewBox="0 0 100 100" className="text-primary/40">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,1" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.2" />

                {/* Network connections */}
                <circle cx="30" cy="30" r="1.5" fill="currentColor" />
                <circle cx="70" cy="30" r="1.5" fill="currentColor" />
                <circle cx="30" cy="70" r="1.5" fill="currentColor" />
                <circle cx="70" cy="70" r="1.5" fill="currentColor" />
                <circle cx="50" cy="20" r="1.5" fill="currentColor" />
                <circle cx="50" cy="80" r="1.5" fill="currentColor" />
                <circle cx="20" cy="50" r="1.5" fill="currentColor" />
                <circle cx="80" cy="50" r="1.5" fill="currentColor" />

                <line x1="30" y1="30" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="70" y1="30" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="30" y1="70" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="70" y1="70" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="50" y1="20" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="50" y1="80" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="20" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />
                <line x1="80" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="0.2" />

                <circle cx="50" cy="50" r="2" fill="currentColor" />
              </svg>
              <p className="text-xs text-muted-foreground font-light mt-2">
                {t('aiAssistanceDescription') || 'AI-enhanced insights drawn from centuries of knowledge'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
