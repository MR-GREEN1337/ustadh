"use client";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import NoteEditor from '../_components/NoteEditor';
import { Note } from '@/services/IntelligentNoteService';

const NewNotePage = () => {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folder');

  const initialNote = {
    title: '',
    content: '',
    folder_id: folderId || undefined,
    ai_enhanced: true
  };

  //alert(initialNote.folder_id)

  return <NoteEditor isNewNote={true} initialNote={initialNote as Note} />;
};
export default NewNotePage;
