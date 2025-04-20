import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { X, BookOpen, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatService } from '@/services/ChatService';

// Interface for flashcard data
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags?: string[];
  created_at: string;
}

interface FlashcardPanelProps {
  onClose?: () => void;
  sessionId?: string;
  locale?: string;
}

const FlashcardPanel: React.FC<FlashcardPanelProps> = ({ onClose, sessionId, locale = 'en' }) => {
  const { t } = useTranslation();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCard, setNewCard] = useState<Omit<Flashcard, 'id' | 'created_at'>>({
    front: '',
    back: '',
    tags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch flashcards when session ID changes or when panel opens
  useEffect(() => {
    if (sessionId && isOpen) {
      fetchFlashcards();
    }
  }, [sessionId, isOpen]);

  useEffect(() => {
    const handleOpenPanel = (event: Event) => {
      console.log("Flashcard panel open event received");
      setIsOpen(true);

      // Small delay to ensure database operations are complete
      setTimeout(() => {
        console.log("Fetching flashcards after panel open event");
        fetchFlashcards();
      }, 500);

      // If the event includes flashcard data, use it directly
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.flashcards) {
        console.log("Received flashcards directly:", customEvent.detail.flashcards.length);
        setFlashcards(customEvent.detail.flashcards);
      }
    };

    window.addEventListener('open-flashcard-panel', handleOpenPanel as EventListener);

    return () => {
      window.removeEventListener('open-flashcard-panel', handleOpenPanel as EventListener);
    };
  }, []);

  // Fetch flashcards using the ChatService
  const fetchFlashcards = async () => {
    if (!sessionId) {
      console.error("Cannot fetch flashcards: No session ID provided");
      return;
    }

    console.log(`Fetching flashcards for session: ${sessionId}`);
    setIsLoading(true);

    try {
      const response = await ChatService.getFlashcards(sessionId);
      console.log(`Received ${response.flashcards?.length || 0} flashcards from API`);
      setFlashcards(response.flashcards || []);

      if (response.flashcards?.length === 0) {
        console.warn("API returned zero flashcards for this session");
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flashcards.length > 0) {
      console.log(`FlashcardPanel has ${flashcards.length} cards to display:`, flashcards);
    }
  }, [flashcards]);

  // Use ChatService for saving cards
  const handleSaveCard = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      if (isEditing && editingCard) {
        await ChatService.updateFlashcard(sessionId, {
          id: editingCard.id,
          front: editingCard.front,
          back: editingCard.back,
          tags: editingCard.tags
        });
      } else {
        await ChatService.createFlashcard(sessionId, {
          front: newCard.front,
          back: newCard.back,
          tags: newCard.tags
        });
      }

      await fetchFlashcards();
      setIsEditing(false);
      setIsCreating(false);
      setEditingCard(null);
      setNewCard({ front: '', back: '', tags: [] });
    } catch (error) {
      console.error('Error saving flashcard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use ChatService for deleting cards
  const handleDeleteCard = async (id: string) => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      await ChatService.deleteFlashcard(sessionId, id);
      await fetchFlashcards();
      if (currentIndex >= flashcards.length - 1) {
        setCurrentIndex(Math.max(0, flashcards.length - 2));
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (card: Flashcard) => {
    setEditingCard({ ...card });
    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreating = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingCard(null);
    setNewCard({ front: '', back: '', tags: [] });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditingCard(null);
  };

  const addTag = (card: any, tag: string) => {
    if (!tag.trim()) return;

    if (isEditing && editingCard) {
      const tags = [...(editingCard.tags || []), tag.trim()];
      setEditingCard({ ...editingCard, tags });
    } else if (isCreating) {
      const tags = [...(newCard.tags || []), tag.trim()];
      setNewCard({ ...newCard, tags });
    }

    setTagInput('');
  };

  const removeTag = (card: any, tagToRemove: string) => {
    if (isEditing && editingCard) {
      const tags = (editingCard.tags || []).filter(tag => tag !== tagToRemove);
      setEditingCard({ ...editingCard, tags });
    } else if (isCreating) {
      const tags = (newCard.tags || []).filter(tag => tag !== tagToRemove);
      setNewCard({ ...newCard, tags });
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const card = isEditing ? editingCard : newCard;
      addTag(card, tagInput);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setFlipped(false);
      // Add a small delay to allow flip animation to complete
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      // Add a small delay to allow flip animation to complete
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
      }, 150);
    }
  };

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  // Render edit form for flashcard
  const renderEditForm = () => {
    const card = isEditing ? editingCard : newCard;

    return (
      <div className="space-y-4 p-4">
        <div>
          <label className="text-sm font-medium mb-1 block">{t("flashcardFrontLabel")}</label>
          <Textarea
            value={isEditing ? editingCard?.front : newCard.front}
            onChange={(e) => isEditing
              ? setEditingCard({ ...editingCard!, front: e.target.value })
              : setNewCard({ ...newCard, front: e.target.value })
            }
            placeholder={t("flashcardFrontPlaceholder")}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t("flashcardBackLabel")}</label>
          <Textarea
            value={isEditing ? editingCard?.back : newCard.back}
            onChange={(e) => isEditing
              ? setEditingCard({ ...editingCard!, back: e.target.value })
              : setNewCard({ ...newCard, back: e.target.value })
            }
            placeholder={t("flashcardBackPlaceholder")}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">{t("tags")}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {card?.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(card, tag)} className="text-xs">
                  <X size={14} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder={t("addTagsPlaceholder")}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addTag(card, tagInput)}
            >
              {t("add")}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={cancelEditing}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSaveCard}
            disabled={isLoading || !card?.front || !card?.back}
          >
            {isLoading ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    );
  };

  // Display the flashcard or a message if there are no cards
  const renderFlashcardContent = () => {
    if (isEditing || isCreating) {
      return renderEditForm();
    }

    console.log("Rendering flashcard content, cards:", flashcards.length);

    if (!flashcards || flashcards.length === 0) {
      console.log("No flashcards to render, showing empty state");
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t("noFlashcardsYet")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("createFlashcardsHelp")}
          </p>
          <Button onClick={startCreating}>
            <Plus className="mr-2 h-4 w-4" /> {t("createFlashcard")}
          </Button>
        </div>
      );
    }

    // Safety check - ensure currentIndex is valid
    if (currentIndex >= flashcards.length) {
      console.warn(`Current index ${currentIndex} is out of bounds, resetting to 0`);
      setCurrentIndex(0);
    }

    const currentCard = flashcards[currentIndex];
    console.log("Rendering card:", currentCard);

    // Double check that we have a valid card
    if (!currentCard) {
      console.error("Current card is undefined despite flashcards being present");
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">{t("errorDisplayingFlashcard")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(0)}
              className="mt-4"
            >
              {t("reset")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Improved cartoonish card flip effect */}
        <div className="flex-1 perspective-1000 w-full">
          <div
            className={`relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
            onClick={toggleFlip}
          >
            {/* Front of card */}
            <div
              className="absolute w-full h-full flex items-center justify-center p-4 backface-hidden bg-card rounded-lg border-2 border-primary/10 shadow-md transform-style-3d"
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="text-center max-w-full">
                <div className="text-2xl font-bold mb-4 card-text-shadow">{currentCard.front}</div>
                <div className="absolute bottom-4 left-0 right-0 text-sm text-muted-foreground">
                  {t("tapToRevealAnswer")}
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div
              className="absolute w-full h-full flex items-center justify-center p-4 backface-hidden bg-card rounded-lg border-2 border-primary/10 shadow-md transform-style-3d"
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="text-center max-w-full">
                <div className="text-xl mb-4 card-text-shadow">{currentCard.back}</div>
                <div className="absolute bottom-4 left-0 right-0 text-sm text-muted-foreground">
                  {t("tapToSeeQuestion")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {currentCard.tags && currentCard.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 justify-center">
            {currentCard.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="animate-pop-in" style={{
                animationDelay: `${index * 0.1}s`
              }}>{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            {t("cardCount", { current: currentIndex + 1, total: flashcards.length })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="hover:scale-110 transition-transform"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="hover:scale-110 transition-transform"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hover:scale-105 transition-transform">
          <BookOpen className="h-4 w-4" />
          <span>{t('flashcards')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="flex flex-row justify-between items-center mb-2 mr-10">
          <SheetTitle className="card-text-shadow">{t('flashcards')}</SheetTitle>
          <div className="flex gap-1">
            {!isEditing && !isCreating && flashcards.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(flashcards[currentIndex])}
                  className="hover:scale-105 transition-transform"
                >
                  <Edit className="h-4 w-4 mr-2" /> {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCard(flashcards[currentIndex].id)}
                  className="text-destructive hover:bg-destructive/10 hover:scale-105 transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {!isEditing && !isCreating && (
              <Button
                size="sm"
                onClick={startCreating}
                className="hover:scale-105 transition-transform"
              >
                <Plus className="h-4 w-4 mr-2" /> {t("new")}
              </Button>
            )}
          </div>
        </SheetHeader>

        <Card className="mt-4 h-[calc(100vh-180px)] border-2 border-primary/20 shadow-lg transition-all duration-300 hover:shadow-primary/20">
          <CardContent className="p-0 h-full">
            {isLoading && flashcards.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderFlashcardContent()
            )}
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  );
};

// Add this CSS to your global stylesheet or component
const GlobalStyles = () => (
  <style jsx global>{`
    .perspective-1000 {
      perspective: 1000px;
    }

    .transform-style-3d {
      transform-style: preserve-3d;
    }

    .backface-hidden {
      backface-visibility: hidden;
    }

    .rotate-y-180 {
      transform: rotateY(180deg);
    }

    .card-text-shadow {
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }

    @keyframes popIn {
      0% {
        opacity: 0;
        transform: scale(0.8);
      }
      70% {
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-pop-in {
      animation: popIn 0.3s ease-out forwards;
    }
  `}</style>
);

const FlashcardPanelWithStyles: React.FC<FlashcardPanelProps> = (props) => (
  <>
    <GlobalStyles />
    <FlashcardPanel {...props} />
  </>
);

export default FlashcardPanelWithStyles;
