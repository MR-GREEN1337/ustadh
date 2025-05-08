import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, AtSign, PaperclipIcon, BookOpen, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// Types for @ mention options
interface AtMentionOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface FileItem {
  id: string;
  fileName: string;
  contentType: string;
  url: string;
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder: string;
  isRTL: boolean;
  atMentionOptions: AtMentionOption[];
  t: (key: string) => string;
  onFileUpload?: (files: File[]) => Promise<any>;
  uploadedFiles?: FileItem[];
  contextFiles?: FileItem[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSubmit,
  isLoading,
  placeholder,
  isRTL,
  atMentionOptions,
  t,
  onFileUpload,
  uploadedFiles = [],
  contextFiles = []
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showAtMentions, setShowAtMentions] = useState(false);
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);
  const [currentMentionType, setCurrentMentionType] = useState<string>('');
  const [atMentionFilter, setAtMentionFilter] = useState('');
  const [fileFilter, setFileFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const atMentionPopoverRef = useRef<HTMLDivElement>(null);
  const fileSuggestionsRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define which file types to show for each mention type
  const getMentionFileSuggestions = () => {
    switch (currentMentionType) {
      case 'support':
        return contextFiles;
      case 'reference':
        return [...uploadedFiles, ...contextFiles];
      case 'file':
        return uploadedFiles;
      default:
        return [];
    }
  };

  // Get relevant files based on current mention type and filter
  const filteredFiles = getMentionFileSuggestions().filter(file =>
    file.fileName.toLowerCase().includes(fileFilter.toLowerCase())
  );

  // Filter @ mention options based on input
  const filteredAtMentions = atMentionOptions.filter(option =>
    option.name.toLowerCase().includes(atMentionFilter.toLowerCase())
  );

  // Effect to handle clicks outside the popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        atMentionPopoverRef.current &&
        !atMentionPopoverRef.current.contains(e.target as Node) &&
        (!fileSuggestionsRef.current || !fileSuggestionsRef.current.contains(e.target as Node))
      ) {
        setShowAtMentions(false);
        setShowFileSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Focus the input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Store current cursor position
    setCursorPosition(e.target.selectionStart);

    // Check for @ mentions
    if (e.target.selectionStart) {
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);

      // Find the last @ symbol before cursor
      const lastAtPos = textBeforeCursor.lastIndexOf('@');

      if (
        lastAtPos >= 0 &&
        (lastAtPos === 0 || /\s/.test(textBeforeCursor.charAt(lastAtPos - 1)))
      ) {
        // Get the text between @ and cursor
        const mentionText = textBeforeCursor.substring(lastAtPos + 1);

        // If we have a space after the mention, close the popover
        if (mentionText.includes(' ')) {
          setShowAtMentions(false);

          // Check if this is a file-related mention that should open file suggestions
          const mentionParts = mentionText.split(' ')[0].toLowerCase();
          const isFileRelatedMention = ['support', 'reference', 'file'].includes(mentionParts);

          if (isFileRelatedMention && mentionText.split(' ').length === 1) {
            // If mention is complete but no file name started yet, show file suggestions
            setCurrentMentionType(mentionParts);
            setFileFilter('');
            setShowFileSuggestions(true);
          } else if (isFileRelatedMention) {
            // If file name being typed, filter file suggestions
            setCurrentMentionType(mentionParts);
            setFileFilter(mentionText.substring(mentionText.indexOf(' ') + 1));
            setShowFileSuggestions(true);
          } else {
            setShowFileSuggestions(false);
          }
        } else {
          // Show @ mention options if typing after @
          setAtMentionFilter(mentionText);
          setShowAtMentions(true);
          setShowFileSuggestions(false);
        }
      } else {
        // If no @ being typed, close both popovers
        setShowAtMentions(false);
        setShowFileSuggestions(false);
      }
    }
  };

  const insertAtMention = (mention: string) => {
    if (inputRef.current && cursorPosition !== null) {
      const beforeCursor = input.substring(0, cursorPosition);
      const afterCursor = input.substring(cursorPosition);

      // Find the position of the @ that triggered this
      const lastAtPos = beforeCursor.lastIndexOf('@');

      if (lastAtPos >= 0) {
        // Replace the partial @mention with the full one
        const newInput =
          beforeCursor.substring(0, lastAtPos) +
          `@${mention} ` +
          afterCursor;

        setInput(newInput);

        // Set cursor position after the inserted mention and space
        setTimeout(() => {
          if (inputRef.current) {
            const newPosition = lastAtPos + mention.length + 2; // @ + mention + space
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);

        // If this is a file-related mention, show file suggestions
        if (['support', 'reference', 'file'].includes(mention.toLowerCase())) {
          setCurrentMentionType(mention.toLowerCase());
          setFileFilter('');
          setShowFileSuggestions(true);
        }
      }
    }

    // Close the popover
    setShowAtMentions(false);
  };

  const insertFileSuggestion = (file: FileItem) => {
    if (inputRef.current && cursorPosition !== null) {
      const currentText = input;

      // Find the last mention position
      const lastAtPos = currentText.lastIndexOf(`@${currentMentionType}`);

      if (lastAtPos >= 0) {
        // Check if we already have a space after the mention
        const afterMention = currentText.substring(lastAtPos + currentMentionType.length + 1);
        const hasSpace = afterMention.startsWith(' ');

        // Build the new input with the file name
        const beforeMention = currentText.substring(0, lastAtPos + currentMentionType.length + 1);
        const separator = hasSpace ? '' : ' ';

        // If there's already text after the mention, replace it up to next line or end
        let endPos = currentText.length;
        const nextLinePos = currentText.indexOf('\n', lastAtPos);
        if (nextLinePos > -1) {
          endPos = nextLinePos;
        }

        const newInput = beforeMention + separator + file.fileName + currentText.substring(endPos);
        setInput(newInput);

        // Position cursor after the inserted file name
        setTimeout(() => {
          if (inputRef.current) {
            const newPosition = lastAtPos + currentMentionType.length + 2 + file.fileName.length;
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    }

    // Close the file suggestions
    setShowFileSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If @ mention popover is open, handle navigation
    if (showAtMentions && filteredAtMentions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Navigation would be implemented here
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertAtMention(filteredAtMentions[0].name);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAtMentions(false);
        return;
      }
    }

    // If file suggestions popover is open, handle navigation
    if (showFileSuggestions && filteredFiles.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Navigation would be implemented here
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertFileSuggestion(filteredFiles[0]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowFileSuggestions(false);
        return;
      }
    }

    // Normal Enter key handling (submit on Enter without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);

      // Add file reference to the input if appropriate
      const fileNames = newFiles.map(file => file.name).join(', ');
      setInput(prev => {
        if (prev.trim() === '') {
          return `@File ${fileNames}\n`;
        } else if (!prev.endsWith('\n')) {
          return `${prev}\n@File ${fileNames}\n`;
        } else {
          return `${prev}@File ${fileNames}\n`;
        }
      });

      // Upload files if the callback is provided
      if (onFileUpload) {
        await onFileUpload(newFiles);
      }
    }
  };

  // Clear a selected file
  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));

    // Remove file reference from input
    const filePattern = new RegExp(`@File ${fileToRemove.name}\\n?`, 'g');
    setInput(prev => prev.replace(filePattern, ''));
  };

  // Get icon for file content type
  const getFileIcon = (contentType: string) => {
    if (contentType.includes('image')) {
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>;
    } else if (contentType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-primary" />;
    } else if (contentType.includes('application')) {
      return <FileText className="h-4 w-4 text-primary" />;
    } else {
      return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  // Get appropriate header icon based on mention type
  const getHeaderIcon = (type: string) => {
    switch (type) {
      case 'support':
        return <BookOpen className="h-4 w-4 text-primary opacity-80" />;
      case 'reference':
        return <FileText className="h-4 w-4 text-primary opacity-80" />;
      case 'file':
        return <PaperclipIcon className="h-4 w-4 text-primary opacity-80" />;
      default:
        return <AtSign className="h-4 w-4 text-primary opacity-80" />;
    }
  };

  // Get header title based on mention type
  const getHeaderTitle = (type: string) => {
    switch (type) {
      case 'support':
        return t('supportMaterials');
      case 'reference':
        return t('references');
      case 'file':
        return t('files');
      default:
        return t('mentions');
    }
  };

  return (
    <div className="fixed bottom-6 inset-x-0 md:pl-60 mx-auto px-4 z-10">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          {/* File preview area */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 bg-background/60 backdrop-blur-sm rounded-t-lg p-2 border border-b-0">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-primary/5 rounded-md px-2 py-1 text-xs"
                >
                  <PaperclipIcon className="h-3 w-3" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground ml-1"
                    onClick={() => removeFile(file)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main input container */}
          <div className="relative flex items-center bg-background/80 backdrop-blur-md shadow-md rounded-lg border overflow-hidden">
            {/* File upload button */}
            <button
              type="button"
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelect}
            />

            {/* Textarea */}
            <Textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="border-0 focus-visible:ring-0 resize-none py-3 px-0 min-h-[45px] max-h-[200px] w-full bg-transparent"
              rows={Math.min(5, Math.max(1, (input.match(/\n/g) || []).length + 1))}
              disabled={isLoading}
            />

            {/* Send button */}
            <button
              type="submit"
              className="flex items-center justify-center h-10 w-10 ml-auto text-primary hover:text-primary/80 disabled:text-muted-foreground"
              disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
            >
              {isLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Sleek @ mention popover */}
          {showAtMentions && filteredAtMentions.length > 0 && (
            <div
              ref={atMentionPopoverRef}
              className="absolute bottom-full left-0 mb-2 max-w-md bg-background/70 backdrop-blur-lg rounded-lg shadow-lg border border-border/30 overflow-hidden z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-100"
              style={{ width: 'min(100%, 320px)' }}
            >
              {/* Minimal header */}
              <div className="p-2 flex items-center gap-2 text-xs text-muted-foreground">
                <AtSign className="h-3.5 w-3.5" />
                <span>{t("mentionSuggestions") || "Suggestions"}</span>
              </div>

              {/* Results with minimal styling */}
              <div className="max-h-48 overflow-y-auto">
                {filteredAtMentions.map(option => (
                  <div
                    key={option.id}
                    className="px-3 py-2 hover:bg-primary/5 cursor-pointer flex items-center gap-2.5 transition-colors"
                    onClick={() => insertAtMention(option.name)}
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {option.icon}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-foreground">{option.name.toLowerCase()}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sleek File suggestions popover */}
          {showFileSuggestions && (
            <div
              ref={fileSuggestionsRef}
              className="absolute bottom-full left-0 mb-2 max-w-md bg-background/70 backdrop-blur-lg rounded-lg shadow-lg border border-border/30 overflow-hidden z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-100"
              style={{ width: 'min(100%, 320px)' }}
            >
              {/* Minimal header with file type info */}
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getHeaderIcon(currentMentionType)}
                  <span>{getHeaderTitle(currentMentionType)}</span>
                </div>

                {/* Minimal search input */}
                <div className="flex items-center px-2 py-1 bg-muted/30 rounded-md">
                  <Search className="h-3 w-3 text-muted-foreground mr-1.5" />
                  <input
                    type="text"
                    placeholder={t("search") || "Search"}
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    className="w-24 text-xs bg-transparent border-none outline-none focus:ring-0 p-0 h-5"
                  />
                </div>
              </div>

              {/* Results with minimal styling */}
              <div className="max-h-48 overflow-y-auto">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map(file => (
                    <div
                      key={file.id}
                      className="px-3 py-2 hover:bg-primary/5 cursor-pointer flex items-center gap-2.5 transition-colors"
                      onClick={() => insertFileSuggestion(file)}
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {getFileIcon(file.contentType)}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-foreground">{file.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {file.contentType.split('/')[1] || file.contentType}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("noFilesFound") || "No files found"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
