import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import {
  IntelligentNoteService,
  Note,
  NoteFolder,
  NoteSearchParams
} from '@/services/IntelligentNoteService';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Search,
  Plus,
  FolderPlus,
  BookOpen,
  Clock,
  Users,
  Sparkles,
  MoreHorizontal,
  ChevronRight,
  Bookmark,
  Share2,
  Trash2,
  Edit,
  FolderOpen,
  Filter,
  SortAsc,
  SortDesc,
  CalendarDays,
  Check
} from 'lucide-react';

const NotesList = () => {
  const { t } = useTranslation();
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isRTL = locale === 'ar';

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterShared, setFilterShared] = useState(false);
  const [filterEnhanced, setFilterEnhanced] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch notes and folders
  useEffect(() => {
    const fetchNotesAndFolders = async () => {
      try {
        setIsLoading(true);

        // Prepare search parameters
        const searchParams: NoteSearchParams = {
          query: searchQuery || undefined,
          folder_id: selectedFolder || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          shared: filterShared || undefined,
          ai_enhanced: filterEnhanced || undefined
        };

        // Fetch notes based on search parameters
        const notesData = await IntelligentNoteService.getNotes(searchParams);
        setNotes(notesData.notes || []);

        // Fetch folders
        const foldersData = await IntelligentNoteService.getNoteFolders();
        setFolders(foldersData.folders || []);
      } catch (error) {
        console.error('Error fetching notes and folders:', error);
        setError('Failed to load notes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotesAndFolders();
  }, [searchQuery, selectedFolder, sortBy, sortOrder, filterShared, filterEnhanced]);

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const parentId = selectedFolder || undefined;
      await IntelligentNoteService.createFolder(newFolderName, parentId);

      // Refresh folders
      const foldersData = await IntelligentNoteService.getNoteFolders();
      setFolders(foldersData.folders || []);

      // Reset form
      setNewFolderName('');
      setShowNewFolderDialog(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder. Please try again.');
    }
  };

  // Handle note creation
  const handleCreateNote = () => {
    router.push(`/${locale}/dashboard/tutor/notes/new${selectedFolder ? `?folder=${selectedFolder}` : ''}`);
  };

  // Get parent folders for breadcrumb navigation
  const getParentFolders = (folderId: string | null): NoteFolder[] => {
    if (!folderId) return [];

    const result: NoteFolder[] = [];
    let currentId = folderId;

    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        result.unshift(folder);
        currentId = folder.parent_id || null;
      } else {
        break;
      }
    }

    return result;
  };

  // Get child folders
  const getChildFolders = (parentId: string | null): NoteFolder[] => {
    return folders.filter(folder => folder.parent_id === parentId);
  };

  // Get folder path string
  const getFolderPathString = (folderId: string | null): string => {
    const path = getParentFolders(folderId);
    if (path.length === 0) return '';
    return path.map(folder => folder.name).join(' / ');
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await IntelligentNoteService.deleteNote(noteId);

        // Refresh notes list
        setNotes(notes.filter(note => note.id !== noteId));
      } catch (error) {
        console.error('Error deleting note:', error);
        setError('Failed to delete note. Please try again.');
      }
    }
  };

  // Filter notes that belong to the current selected folder
  const filteredNotes = selectedFolder
    ? notes.filter(note => note.folder_id === selectedFolder)
    : notes.filter(note => !note.folder_id);

  return (
    <div className="space-y-8">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">{t('notesTitle') || 'Manuscripts'}</h1>
          <p className="text-muted-foreground font-light mt-1">
            {t('notesDescription') || 'Record and organize your thoughts and knowledge.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNewFolderDialog(true)}
            className="font-serif"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            {t('newCollection') || 'New Collection'}
          </Button>

          <Button
            onClick={handleCreateNote}
            className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white font-serif"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newNote') || 'New Note'}
          </Button>
        </div>
      </div>

      {/* Folder creation dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{t('newCollection') || 'New Collection'}</DialogTitle>
            <DialogDescription className="font-light">
              {t('newCollectionDescription') || 'Create a new collection to organize your notes.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="folder-name">
                {t('name') || 'Name'}
              </label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('collectionNamePlaceholder') || 'Enter collection name'}
                className="bg-white/50 dark:bg-black/10 border-stone-200 dark:border-stone-700"
              />
            </div>

            {selectedFolder && (
              <div className="text-sm text-muted-foreground">
                {t('willBeCreatedIn') || 'Will be created in'}: <span className="font-medium">{getFolderPathString(selectedFolder)}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNewFolderDialog(false)}
              className="font-serif"
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white font-serif"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              {t('createCollection') || 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder={t('searchNotes') || 'Search your manuscripts...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-serif">
                <SortAsc className="h-4 w-4 mr-2" />
                {t('sortBy') || 'Sort by'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800">
              <DropdownMenuLabel className="font-serif">{t('sortBy') || 'Sort by'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('updated_at')} className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {t('lastUpdated') || 'Last updated'}
                {sortBy === 'updated_at' && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created_at')} className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2" />
                {t('created') || 'Created'}
                {sortBy === 'created_at' && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')} className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('title') || 'Title'}
                {sortBy === 'title' && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="flex items-center">
                {sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="h-4 w-4 mr-2" />
                    {t('ascending') || 'Ascending'}
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4 mr-2" />
                    {t('descending') || 'Descending'}
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="font-serif">
                <Filter className="h-4 w-4 mr-2" />
                {t('filter') || 'Filter'}
                {(filterShared || filterEnhanced) && (
                  <Badge className="ml-2 h-5 px-1 bg-primary text-white">{(filterShared ? 1 : 0) + (filterEnhanced ? 1 : 0)}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800">
              <DropdownMenuLabel className="font-serif">{t('filter') || 'Filter'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterShared(!filterShared)} className="flex items-center">
                <Share2 className="h-4 w-4 mr-2" />
                {t('shared') || 'Shared'}
                {filterShared && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterEnhanced(!filterEnhanced)} className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                {t('aiEnhanced') || 'AI Enhanced'}
                {filterEnhanced && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Folder navigation breadcrumbs */}
      {/* Folder navigation breadcrumbs */}
      {selectedFolder && (
        <div className="flex items-center gap-1 my-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 font-serif"
            onClick={() => setSelectedFolder(null)}
          >
            {t('allManuscripts') || 'All Manuscripts'}
          </Button>

          {getParentFolders(selectedFolder).map((folder, index, array) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-1 font-serif ${index === array.length - 1 ? 'font-medium' : ''}`}
                onClick={() => setSelectedFolder(folder.id)}
              >
                {folder.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-4 flex items-start">
          <div className="flex-1">{error}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-auto p-0 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main content with folders and notes */}
      <div className="space-y-6">
        {/* Subfolders if any */}
        {getChildFolders(selectedFolder).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg">{t('collections') || 'Collections'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getChildFolders(selectedFolder).map(folder => (
                <Card
                  key={folder.id}
                  className="cursor-pointer bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800 hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/5">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-base font-medium truncate">{folder.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(folder.created_at).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notes list */}
        <div className="space-y-3">
          <h2 className="font-serif text-lg">{t('manuscripts') || 'Manuscripts'}</h2>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="font-serif">{t('searchingArchives') || 'Searching the archives...'}</p>
              </div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 bg-[#f8f5f0] dark:bg-black/10 rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="mb-4">
                <svg width="60" height="60" viewBox="0 0 100 100" className="inline-block text-muted-foreground">
                  <rect x="30" y="20" width="40" height="60" fill="none" stroke="currentColor" strokeWidth="1" />
                  <line x1="40" y1="30" x2="60" y2="30" stroke="currentColor" strokeWidth="1" />
                  <line x1="40" y1="40" x2="60" y2="40" stroke="currentColor" strokeWidth="1" />
                  <line x1="40" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="1" />
                </svg>
              </div>
              <h3 className="font-serif text-lg mb-2">{t('noManuscriptsFound') || 'No manuscripts found'}</h3>
              <p className="text-muted-foreground font-light max-w-md mx-auto mb-6">
                {searchQuery
                  ? t('noSearchResults') || 'No manuscripts match your search criteria'
                  : selectedFolder
                  ? t('emptyCollection') || 'This collection is empty'
                  : t('noManuscriptsYet') || 'You haven\'t created any manuscripts yet'}
              </p>
              <Button onClick={handleCreateNote} className="font-serif">
                <Plus className="h-4 w-4 mr-2" />
                {t('createFirstManuscript') || 'Create your first manuscript'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <Card
                  key={note.id}
                  className="cursor-pointer bg-[#f8f5f0] dark:bg-black/10 border-stone-200 dark:border-stone-800 hover:border-primary/30 transition-colors"
                  onClick={() => router.push(`/${locale}/dashboard/tutor/notes/${note.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-medium mb-1 truncate">{note.title || t('untitledNote') || 'Untitled Note'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 font-light">
                          {note.content
                            ? note.content.slice(0, 150) + (note.content.length > 150 ? '...' : '')
                            : t('emptyNote') || 'Empty note'}
                        </p>
                      </div>

                      <div className="flex items-center ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${locale}/dashboard/tutor/notes/${note.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {t('edit') || 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle favorite/bookmark logic
                              }}
                            >
                              <Bookmark className="h-4 w-4 mr-2" />
                              {t('bookmark') || 'Bookmark'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${locale}/dashboard/tutor/notes/${note.id}?share=true`);
                              }}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              {t('share') || 'Share'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteNote(note.id, e)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('delete') || 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {new Date(note.updated_at).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {note.collaborators && note.collaborators.length > 0 && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{note.collaborators.length}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {note.is_shared && (
                          <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 h-5">
                            <Share2 className="h-3 w-3 mr-1" />
                            {t('shared') || 'Shared'}
                          </Badge>
                        )}

                        {note.ai_enhanced && (
                          <Badge variant="outline" className="border-primary/20 bg-primary/5 h-5">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {t('aiEnhanced') || 'AI'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decorative SVG */}
      <div className="hidden md:block text-center mt-8 opacity-30">
        <svg width="200" height="60" viewBox="0 0 200 60" className="mx-auto text-muted-foreground">
          <path d="M20,40 C20,20 50,20 50,40" stroke="currentColor" fill="none" strokeWidth="0.5" />
          <path d="M150,40 C150,20 180,20 180,40" stroke="currentColor" fill="none" strokeWidth="0.5" />
          <line x1="50" y1="40" x2="150" y2="40" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="30" cy="30" r="10" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <circle cx="170" cy="30" r="10" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <rect x="90" y="30" width="20" height="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <line x1="90" y1="30" x2="110" y2="50" stroke="currentColor" strokeWidth="0.3" />
          <line x1="110" y1="30" x2="90" y2="50" stroke="currentColor" strokeWidth="0.3" />
        </svg>
      </div>
    </div>
  );
};

export default NotesList;
