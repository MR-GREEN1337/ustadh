"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/client';
import { useAuth } from '@/providers/AuthProvider';
import { IntelligentNoteService } from '@/services/IntelligentNoteService';
import { useAISuggestions } from '@/hooks/useAISuggestions';

// UI Components
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Icons
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
  FileText,
  Link2,
  ImageIcon,
  ListIcon,
  ListOrdered,
  QuoteIcon,
  Code,
  TableIcon,
  CheckSquare,
  Scissors,
  MoveHorizontal,
} from 'lucide-react';

/**
 * Types
 */
interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_shared: boolean;
  collaborators?: NoteCollaborator[];
  tags?: string[];
  folder_id?: string;
  version?: number;
  ai_enhanced?: boolean;
  ai_suggestions?: AISuggestion[];
}

interface NoteCollaborator {
  id: string;
  user_id: string;
  note_id: string;
  permissions: 'read' | 'write' | 'admin';
  joined_at: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface AISuggestion {
  id: string;
  content: string;
  type: 'completion' | 'clarification' | 'connection' | 'insight';
  created_at: string;
  applied: boolean;
}

interface EnhancedEditorProps {
  noteId?: string;
  initialNote?: Note;
  isNewNote?: boolean;
  initialOpenShare?: boolean;
}

const NoteEditor: React.FC<EnhancedEditorProps> = ({
  noteId,
  initialNote,
  isNewNote = false,
  initialOpenShare = false
}) => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isRTL = locale === 'ar';

  // Editor state
  const [note, setNote] = useState<Note | null>(initialNote || null);
  const [title, setTitle] = useState(initialNote?.title || '');
  const [editorData, setEditorData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialNote);
  const [lastSaved, setLastSaved] = useState<Date | null>(initialNote?.updated_at ? new Date(initialNote.updated_at) : null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI and collaboration state
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>(initialNote?.collaborators || []);
  const [showShareDialog, setShowShareDialog] = useState(initialOpenShare);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write' | 'admin'>('read');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  // Tags and organization
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Editor instance ref
  const editorInstanceRef = useRef<any>(null);

  // Use the AI suggestions hook
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

  // Custom file uploader for EditorJS Image tool
  const imageUploader = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use your file upload service
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      return {
        success: 1,
        file: {
          url: data.url,
        }
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: 0,
        message: 'Upload failed'
      };
    }
  };

  // Initialize EditorJS
  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    // Load EditorJS dynamically only in the browser
    const initEditor = async () => {
      try {
        // Cleanup previous instance if it exists
        if (editorInstanceRef.current) {
          try {
            await editorInstanceRef.current.destroy();
          } catch (err) {
            console.error('Error destroying editor:', err);
          }
          editorInstanceRef.current = null;
        }

        // Dynamically import EditorJS
        const EditorJS = (await import('@editorjs/editorjs')).default;

        // Dynamically import tools with proper error handling
        let HeaderTool, ParagraphTool, ListTool, ChecklistTool, QuoteTool, CodeTool,
            DelimiterTool, TableTool, LinkTool, ImageTool, EmbedTool, MarkerTool, InlineCodeTool;

        try {
          HeaderTool = (await import('@editorjs/editorjs/')).default;
          ParagraphTool = (await import('@editorjs/editorjs')).default;
          ListTool = (await import('@editorjs/editorjs')).default;
          ChecklistTool = (await import('@editorjs/editorjs')).default;
          QuoteTool = (await import('@editorjs/editorjs')).default;
          CodeTool = (await import('@editorjs/editorjs')).default;
          DelimiterTool = (await import('@editorjs/editorjs')).default;
          TableTool = (await import('@editorjs/editorjs')).default;
          LinkTool = (await import('@editorjs/editorjs')).default;
          ImageTool = (await import('@editorjs/editorjs')).default;
          EmbedTool = (await import('@editorjs/editorjs')).default;
          MarkerTool = (await import('@editorjs/editorjs')).default;
          InlineCodeTool = (await import('@editorjs/editorjs')).default;
        } catch (err) {
          console.error('Error importing EditorJS tools:', err);
          // Fallback - if import fails, define minimal tools
          HeaderTool = class {
            static get toolbox() { return { title: 'Heading', icon: '<b>H</b>' }; }
          };
          ParagraphTool = class {
            static get toolbox() { return { title: 'Text', icon: 'P' }; }
          };
        }

        // Define tools configuration based on what was successfully imported
        const tools = {
          header: HeaderTool ? {
            class: HeaderTool,
            config: {
              levels: [1, 2, 3, 4],
              defaultLevel: 1
            }
          } : undefined,
          paragraph: ParagraphTool ? {
            class: ParagraphTool,
            inlineToolbar: true,
          } : undefined,
          list: ListTool ? {
            class: ListTool,
            inlineToolbar: true,
          } : undefined,
          checklist: ChecklistTool ? {
            class: ChecklistTool,
            inlineToolbar: true,
          } : undefined,
          quote: QuoteTool ? {
            class: QuoteTool,
            inlineToolbar: true,
          } : undefined,
          code: CodeTool ? {
            class: CodeTool,
          } : undefined,
          delimiter: DelimiterTool || undefined,
          table: TableTool ? {
            class: TableTool,
            inlineToolbar: true,
          } : undefined,
          linkTool: LinkTool ? {
            class: LinkTool,
            config: {
              endpoint: '/api/fetchUrl',
            }
          } : undefined,
          image: ImageTool ? {
            class: ImageTool,
            config: {
              uploader: {
                uploadByFile: imageUploader,
              }
            }
          } : undefined,
          embed: EmbedTool ? {
            class: EmbedTool,
            config: {
              services: {
                youtube: true,
                vimeo: true,
                codepen: true,
              }
            }
          } : undefined,
          marker: MarkerTool ? {
            class: MarkerTool,
            shortcut: 'CMD+M',
          } : undefined,
          inlineCode: InlineCodeTool ? {
            class: InlineCodeTool,
            shortcut: 'CMD+SHIFT+C',
          } : undefined,
        };

        // Clean the tools object to remove undefined values
        Object.keys(tools).forEach(key => {
          if (tools[key] === undefined) {
            delete tools[key];
          }
        });

        // Set initial data
        let initialData = {};
        if (initialNote?.content) {
          try {
            initialData = JSON.parse(initialNote.content);
          } catch (e) {
            console.error('Error parsing note content:', e);
            // Fallback for invalid JSON
            initialData = {
              blocks: [
                {
                  type: 'paragraph',
                  data: {
                    text: initialNote.content
                  }
                }
              ]
            };
          }
        }

        // Editor configuration
        const editorConfig = {
          holder: 'editorjs',
          autofocus: true,
          placeholder: t('startWriting') || 'Start writing your notes...',
          tools,
          onChange: async () => {
            setHasUnsavedChanges(true);

            // Get the current content
            if (editorInstanceRef.current) {
              try {
                const data = await editorInstanceRef.current.save();
                setEditorData(data);

                // Send to AI for live suggestions if enabled
                if (note?.ai_enhanced) {
                  const plainText = extractPlainText(data);
                  sendContentToWS(plainText);
                }
              } catch (err) {
                console.error('Error saving editor data:', err);
              }
            }
          },
          data: initialData,
          rtl: isRTL,
        };

        // Create editor instance
        const editor = new EditorJS(editorConfig);
        editorInstanceRef.current = editor;

        // Wait for editor to be ready
        await editor.isReady;
        console.log('Editor is ready');
        setEditorData(initialData);

      } catch (error) {
        console.error('Error initializing EditorJS:', error);
        setError('Error initializing editor. Please refresh the page.');
      }
    };

    // Initialize the editor
    initEditor();

    // Cleanup on unmount
    return () => {
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy()
            .catch((err: any) => console.error('Error destroying editor on unmount:', err));
        } catch (err) {
          console.error('Error during editor cleanup:', err);
        }
      }
    };
  }, [isLoading, note?.id, note?.ai_enhanced, initialNote?.content, isRTL, t, sendContentToWS]);

  // Helper function to insert block
  const handleBlockInsert = (type: string) => {
    if (editorInstanceRef.current && editorInstanceRef.current.blocks) {
      try {
        editorInstanceRef.current.blocks.insert(type);
      } catch (err) {
        console.error(`Error inserting ${type} block:`, err);
      }
    }
  };

  // Extract plain text from EditorJS data
  const extractPlainText = (data: any) => {
    if (!data || !data.blocks || !Array.isArray(data.blocks)) return '';

    return data.blocks.map((block: any) => {
      if (!block || typeof block !== 'object') return '';

      try {
        switch (block.type) {
          case 'header':
            return block.data?.text || '';
          case 'paragraph':
            return block.data?.text || '';
          case 'list':
            return Array.isArray(block.data?.items)
              ? block.data.items.join('\n')
              : '';
          case 'checklist':
            return Array.isArray(block.data?.items)
              ? block.data.items.map((item: any) => item?.text || '').join('\n')
              : '';
          case 'quote':
            return block.data?.text || '';
          case 'code':
            return block.data?.code || '';
          default:
            return '';
        }
      } catch (err) {
        console.error('Error extracting text from block:', err);
        return '';
      }
    }).join('\n\n');
  };

  // Fetch note data if noteId is provided
  useEffect(() => {
    const fetchNoteData = async () => {
      if (!noteId || initialNote) return;

      try {
        setIsLoading(true);
        const data = await IntelligentNoteService.getNote(noteId);
        setNote(data);
        setTitle(data.title);
        setTags(data.tags || []);
        setCollaborators(data.collaborators || []);

        // Set last saved time
        if (data.updated_at) {
          setLastSaved(new Date(data.updated_at));
        }

        // Also fetch AI suggestions if enabled
        if (data.ai_enhanced) {
          try {
            const suggestionsData = await IntelligentNoteService.getAISuggestions(noteId);
            setAiSuggestions(suggestionsData.suggestions || []);
          } catch (err) {
            console.error('Error fetching AI suggestions:', err);
          }
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

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, isSaving]);

  // Handle save
  const handleSave = async () => {
    if (!hasUnsavedChanges || !editorInstanceRef.current) return;

    try {
      setIsSaving(true);
      setError(null);

      // Get current editor content with safety check
      let outputData;
      try {
        outputData = await editorInstanceRef.current.save();
      } catch (err) {
        console.error('Error getting editor content:', err);
        setError('Error saving note content. Please try again.');
        setIsSaving(false);
        return;
      }

      // Prepare data for saving
      const updateData = {
        title,
        content: JSON.stringify(outputData),
        folder_id: initialNote?.folder_id || note?.folder_id,
        tags,
        ai_enhanced: note?.ai_enhanced || false
      };

      let savedNote;

      if (note && noteId) {
        // Update existing note
        savedNote = await IntelligentNoteService.updateNote(noteId, updateData);
      } else {
        // Create new note
        savedNote = await IntelligentNoteService.createNote({
          ...updateData,
          ai_enhanced: true // Enable AI by default for new notes
        });

        // Update URL for new notes
        if (isNewNote && savedNote.id) {
          router.push(`/${locale}/dashboard/tutor/notes/${savedNote.id}`);
        }
      }

      // Update state with saved note
      setNote(savedNote);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate AI suggestions
  const handleGenerateAISuggestions = async () => {
    if (!note?.id || !editorInstanceRef.current) return;

    try {
      setIsGeneratingSuggestions(true);
      setError(null);

      // Get current editor content for context
      const outputData = await editorInstanceRef.current.save();
      const plainText = extractPlainText(outputData);

      // Call API with current content for better suggestions
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
  const handleApplySuggestion = async (suggestionId: string, content: string) => {
    if (!note?.id || !editorInstanceRef.current) return;

    try {
      // Mark suggestion as applied in the API
      await IntelligentNoteService.applyAISuggestion(note.id, suggestionId);

      // Insert the suggestion into the editor at the current position
      editorInstanceRef.current.blocks.insert(
        "paragraph",
        { text: content }
      );

      // Remove from the active suggestions list
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));

      // Mark document as having unsaved changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
      setError('Failed to apply AI suggestion. Please try again.');
    }
  };

  // Apply live suggestion
  const applyLiveSuggestion = () => {
    if (liveSuggestion && editorInstanceRef.current) {
      editorInstanceRef.current.blocks.insert(
        "paragraph",
        { text: liveSuggestion }
      );
      clearSuggestion();
      setHasUnsavedChanges(true);
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

  // Handle tag actions
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
      setHasUnsavedChanges(true);
    }
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  // Generate AI analysis of the note
  const generateAIAnalysis = async () => {
    if (!note?.id || !editorInstanceRef.current) return;

    try {
      setIsGeneratingSuggestions(true);

      // Get current editor content
      const outputData = await editorInstanceRef.current.save();
      const plainText = extractPlainText(outputData);

      // Call AI analysis API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          content: plainText,
          title
        })
      });

      if (!response.ok) throw new Error('Analysis request failed');

      const data = await response.json();
      setAiAnalysis(data.analysis);
      setShowAiAnalysis(true);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setError('Failed to analyze note content. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
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
          <p className="font-medium">{t('loadingNote') || 'Loading note editor...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation and actions */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background/90 backdrop-blur-sm py-2 border-b">
        <Button
          variant="ghost"
          className="p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
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
          >
            <Save className="h-4 w-4 mr-2" />
            {t('save') || 'Save'}
          </Button>

          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!note?.id}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('share') || 'Share'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('shareNote') || 'Share Note'}</DialogTitle>
                <DialogDescription>
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
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('permissions') || 'Permissions'}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={sharePermission === 'read' ? 'default' : 'outline'}
                      onClick={() => setSharePermission('read')}
                      size="sm"
                    >
                      {t('canRead') || 'Can read'}
                    </Button>
                    <Button
                      type="button"
                      variant={sharePermission === 'write' ? 'default' : 'outline'}
                      onClick={() => setSharePermission('write')}
                      size="sm"
                    >
                      {t('canEdit') || 'Can edit'}
                    </Button>
                    <Button
                      type="button"
                      variant={sharePermission === 'admin' ? 'default' : 'outline'}
                      onClick={() => setSharePermission('admin')}
                      size="sm"
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
                          className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
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
                >
                  {t('cancel') || 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleShareNote}
                  disabled={!shareEmail || isSharing}
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
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('options') || 'Options'}</DropdownMenuLabel>
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
              <DropdownMenuItem onClick={generateAIAnalysis}>
                <MoveHorizontal className="h-4 w-4 mr-2" />
                {t('analyzeContent') || 'Analyze Content'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" />
                {t('export') || 'Export / Print'}
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

      {/* Editor toolbar */}
      <div className="flex flex-wrap gap-1 py-1 border-b items-center">
        {/* Block format tools */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('header')}
                className="h-8 px-2"
              >
                <span className="font-bold">H</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Header</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('paragraph')}
                className="h-8 px-2"
              >
                <span className="font-normal">P</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Paragraph</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('list')}
                className="h-8 px-2"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('checklist')}
                className="h-8 px-2"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Checklist</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-5 w-px bg-border mx-1"></div>

        {/* Media and formatting tools */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('image')}
                className="h-8 px-2"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Image</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('quote')}
                className="h-8 px-2"
              >
                <QuoteIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('code')}
                className="h-8 px-2"
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBlockInsert('table')}
                className="h-8 px-2"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Table</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-5 w-px bg-border mx-1"></div>

        {/* AI tools */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateAISuggestions}
                className="h-8 px-2 text-primary"
                disabled={!note?.ai_enhanced || isGeneratingSuggestions}
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate Suggestions</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Spacer to push tags to the right */}
        <div className="flex-grow"></div>

        {/* Tags */}
        <div className="flex items-center gap-1">
          {tags.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1 h-6 px-2">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTag(tag)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {showTagInput ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="h-6 py-1 px-2 text-xs w-24"
                placeholder="New tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  } else if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setNewTag('');
                  }
                }}
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={addTag}
                className="h-6 px-1"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagInput(true)}
              className="h-6 px-2 text-xs"
            >
              + Tag
            </Button>
          )}
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

      {/* Main editor layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Content area */}
        <div className={`${(showAiSuggestions && aiSuggestions.length > 0) || showAiAnalysis ? 'md:col-span-8' : 'md:col-span-12'} space-y-6`}>
          {/* Note title */}
          <div className="border-b pb-2">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder={t('noteTitle') || 'Note Title'}
              className="text-xl font-medium border-0 p-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground"
            />
          </div>

          {/* EditorJS container */}
          <Card className="overflow-hidden border">
            <CardContent className="p-0">
              <div className="p-4">
                <div id="editorjs" className="min-h-[60vh] prose prose-sm max-w-none dark:prose-invert prose-headings:mb-3 prose-p:my-2"></div>
              </div>
            </CardContent>
          </Card>

          {/* Live suggestion display */}
          {liveSuggestion && (
            <div className="relative p-4 border border-primary/20 bg-primary/5 rounded-md">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
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
                  className="h-8 bg-primary/10 border-primary/20"
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
                  {lastSaved
                    ? lastSaved.toLocaleDateString(typeof locale === 'string' ? locale : undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
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

        {/* AI Sidebar - shows either suggestions or analysis */}
        {((showAiSuggestions && aiSuggestions.length > 0) || showAiAnalysis) && (
          <div className="md:col-span-4 space-y-4">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                {/* AI Suggestions Panel */}
                {showAiSuggestions && aiSuggestions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">{t('aiSuggestions') || 'AI Suggestions'}</h3>
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
                        <p className="text-muted-foreground">{t('generatingInsights') || 'Generating insights...'}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {aiSuggestions.filter(s => !s.applied).map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className="p-3 rounded-md bg-secondary/30 border border-border"
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
                                        onClick={() => handleApplySuggestion(suggestion.id, suggestion.content)}
                                        className="h-6 w-6 p-0 text-primary"
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
                            <p className="text-sm leading-relaxed">{suggestion.content}</p>
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
                  </div>
                )}

                {/* AI Analysis Panel */}
                {showAiAnalysis && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">{t('contentAnalysis') || 'Content Analysis'}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAiAnalysis(false)}
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
                        <p className="text-muted-foreground">{t('analyzingContent') || 'Analyzing content...'}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {aiAnalysis ? (
                          <div className="space-y-3">
                            <div className="p-3 rounded-md bg-secondary/30 border border-border">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {aiAnalysis.split('\n').map((paragraph, i) => (
                                  <p key={i}>{paragraph}</p>
                                ))}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={generateAIAnalysis}
                              disabled={isGeneratingSuggestions}
                              className="w-full mt-2"
                            >
                              <MoveHorizontal className="h-4 w-4 mr-2" />
                              {t('refreshAnalysis') || 'Refresh Analysis'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">{t('noAnalysisYet') || 'No analysis available yet'}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={generateAIAnalysis}
                              className="mt-2"
                            >
                              <MoveHorizontal className="h-4 w-4 mr-2" />
                              {t('generateAnalysis') || 'Generate Analysis'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI assistant visualization */}
            <div className="hidden md:block text-center opacity-50">
              <svg width="100%" height="80" viewBox="0 0 200 100" className="text-primary">
                <rect x="40" y="10" width="120" height="80" rx="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                <circle cx="100" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="100" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                <line x1="70" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" />
                <line x1="110" y1="50" x2="130" y2="50" stroke="currentColor" strokeWidth="1" />
                <line x1="100" y1="20" x2="100" y2="40" stroke="currentColor" strokeWidth="1" />
                <line x1="100" y1="60" x2="100" y2="80" stroke="currentColor" strokeWidth="1" />
              </svg>
              <p className="text-xs text-muted-foreground mt-1">
                {t('aiAssistanceDescription') || 'AI assistant is analyzing your content in real-time'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
