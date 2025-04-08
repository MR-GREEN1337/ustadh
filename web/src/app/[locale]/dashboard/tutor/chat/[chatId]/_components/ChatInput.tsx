import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, CornerDownLeft, AtSign, PaperclipIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// Types for @ mention options
interface AtMentionOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
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
  uploadedFiles?: Array<{ id: string; fileName: string; contentType: string; url: string }>;
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
  uploadedFiles = []
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showAtMentions, setShowAtMentions] = useState(false);
  const [atMentionFilter, setAtMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const atMentionPopoverRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to handle clicks outside the @ mention popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        atMentionPopoverRef.current &&
        !atMentionPopoverRef.current.contains(e.target as Node)
      ) {
        setShowAtMentions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Filter @ mention options based on input
  const filteredAtMentions = atMentionOptions.filter(option =>
    option.name.toLowerCase().includes(atMentionFilter.toLowerCase())
  );

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
        } else {
          setAtMentionFilter(mentionText);
          setShowAtMentions(true);
        }
      } else {
        setShowAtMentions(false);
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

        // Set cursor position after the inserted mention
        setTimeout(() => {
          if (inputRef.current) {
            const newPosition = lastAtPos + mention.length + 2; // @ + mention + space
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
    }

    // Close the popover
    setShowAtMentions(false);
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
          return `@File: ${fileNames}\n`;
        } else if (!prev.endsWith('\n')) {
          return `${prev}\n@File: ${fileNames}\n`;
        } else {
          return `${prev}@File: ${fileNames}\n`;
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
    const filePattern = new RegExp(`@File: ${fileToRemove.name}\\n?`, 'g');
    setInput(prev => prev.replace(filePattern, ''));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-background/95 backdrop-blur-sm border-t z-10 p-4">
      <form onSubmit={handleSubmit} className="mx-auto">
        <div className="flex flex-col gap-2">
          {/* File preview area */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1 text-xs"
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

          <div className="flex items-end gap-2 relative">
            <div className="relative w-full">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-12 py-3 resize-none border-primary/20 focus-visible:ring-primary/30 pr-10 pl-10 rounded-xl w-full"
                rows={Math.min(5, Math.max(1, (input.match(/\n/g) || []).length + 1))}
                disabled={isLoading}
                style={{ caretColor: 'currentColor' }} // Match current text color
              />

              {/* @ mention popover */}
              {showAtMentions && filteredAtMentions.length > 0 && (
                <div
                  ref={atMentionPopoverRef}
                  className="absolute bottom-full left-0 mb-2 bg-card rounded-lg shadow-lg border border-border z-50 w-80 overflow-hidden"
                >
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Mentions</span>
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1">
                    {filteredAtMentions.map(option => (
                      <div
                        key={option.id}
                        className="px-3 py-2.5 hover:bg-accent rounded-md cursor-pointer flex items-center gap-3 transition-colors"
                        onClick={() => insertAtMention(option.name)}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {option.icon}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium text-foreground">{option.name.toLowerCase()}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File upload button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute left-2 bottom-2 rounded-full h-8 w-8 hover:bg-primary/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />

              {/* Send button */}
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 rounded-full h-8 w-8"
                disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              <span className="absolute right-12 bottom-[10px] text-xs text-muted-foreground">
                {isRTL ? <CornerDownLeft className="h-3 w-3 rotate-90" /> : <CornerDownLeft className="h-3 w-3" />}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
