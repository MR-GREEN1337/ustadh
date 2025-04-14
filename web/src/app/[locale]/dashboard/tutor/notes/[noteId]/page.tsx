"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { IntelligentNoteService } from '@/services/IntelligentNoteService';
import NoteEditor from '../_components/NoteEditor';

const NoteDetailPage = () => {
  const { noteId } = useParams();
  const searchParams = useSearchParams();
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch note data if it's not a new note
    if (noteId !== 'new') {
      IntelligentNoteService.getNote(noteId)
        .then(data => {
          setNote(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching note:', err);
          setError('Failed to load note. Please try again later.');
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [noteId]);

  // For share parameter
  const shouldShowShareDialog = searchParams.get('share') === 'true';

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-60">
          <div className="text-center">
            <div className="mb-4">
              <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-primary inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="font-serif">Loading manuscript...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-60">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-md font-serif"
            >
              Return to Notes
            </button>
          </div>
        </div>
      ) : (
        <NoteEditor
          noteId={noteId === 'new' ? undefined : noteId}
          initialNote={note}
          isNewNote={noteId === 'new'}
          initialOpenShare={shouldShowShareDialog}
        />
      )}
    </>
  );
};
export default NoteDetailPage;
