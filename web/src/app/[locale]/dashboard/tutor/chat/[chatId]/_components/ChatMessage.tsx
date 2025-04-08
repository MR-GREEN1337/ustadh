import React, { useState, useRef } from 'react';
import {
  Copy, Check, CornerUpLeft, Pencil, Bookmark
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  exchangeId?: number;
  isBookmarked?: boolean;
  hasWhiteboard?: boolean;
  whiteboardScreenshots?: Array<{
    pageId: string;
    image: string;
  }>;
  whiteboardState?: any;
}

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
  user: any;
  onToggleBookmark: (message: Message) => void;
  onResend: (content: string) => void;
  onEdit: (originalMessage: Message, newContent: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLatest,
  user,
  onToggleBookmark,
  onResend,
  onEdit
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Format @mentions to be bold
  const renderMessageContent = (content: string) => {
    const formattedContent = content.replace(
      /@(\w+)/g,
      '<strong>@$1</strong>'
    );

    return (
      <div
        className="whitespace-pre-wrap text-sm"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied to your clipboard.",
      duration: 2000,
    });
  };

  const handleResend = () => {
    // For user messages, we're regenerating the conversation from this point
    onResend(message.content);
    toast({
      title: "Regenerating response",
      description: "Continuing the conversation from this message.",
    });
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(0, 0);
      }
    }, 0);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);

      // Return formatted time (e.g. "14:35")
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const saveEdit = () => {
    if (editedContent.trim() !== message.content.trim()) {
      onEdit(message, editedContent);
      toast({
        title: "Message updated",
        description: "Your message has been updated and resent.",
      });
    }
    setIsEditing(false);
  };

  const renderActionButtons = () => {
    // Only show action buttons for assistant messages
    if (message.role !== 'assistant') return null;

    return (
      <div className="flex gap-4 mt-2 pl-1 items-center">
        <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>

        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  onClick={handleResend}
                >
                  <CornerUpLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate response</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {message.exchangeId && user && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                    onClick={() => onToggleBookmark(message)}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${message.isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{message.isBookmarked ? "Remove bookmark" : "Save for later"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  };

  const renderUserActionButtons = () => {
    if (message.role !== 'user') return null;

    return (
      <div className="flex justify-end gap-4 mt-2 pr-1 items-center">
        <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>

        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  onClick={startEdit}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-muted text-foreground border-border">
                <p>Edit message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                  onClick={handleResend}
                >
                  <CornerUpLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-muted text-foreground border-border">
                <p>Resend message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  return (
    <div className={`${isLatest ? 'mb-1' : 'mb-6'}`}>
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`flex gap-3 max-w-[80%] ${
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {message.role === 'user' ? (
            <Avatar className="h-8 w-8 mt-1">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-8 w-8 mt-1">
              <AvatarFallback className="bg-secondary">
                <Brain className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}

          <div>
            <div
              className={`rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[100px] text-sm border border-primary/20 bg-background text-foreground"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      className="h-7 text-xs"
                    >
                      Save & Resend
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {renderMessageContent(message.content)}

                  {/* Whiteboard indicator */}
                  {message.hasWhiteboard && message.role === 'user' && (
                    <div className="flex justify-start mt-2 opacity-80">
                      <div className="flex items-center text-xs gap-1">
                        <Pencil className="h-3 w-3" />
                        <span>Tableau blanc partagé</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Always visible action buttons */}
            {!isEditing && (
              <>
                {message.role === 'assistant' ? renderActionButtons() : renderUserActionButtons()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
