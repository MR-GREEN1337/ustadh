"use client";
import React from 'react';
import { useSearchParams } from 'next/navigation';
import NoteEditor from '../_components/NoteEditor';

const NewNotePage = () => {
  const searchParams = useSearchParams();
  const folderId = searchParams.get('folder');

  const initialNote = {
    title: '',
    content: '',
    folder_id: folderId || undefined,
    ai_enhanced: true
  };

  return <NoteEditor isNewNote={true} initialNote={initialNote} />;
};
export default NewNotePage;
