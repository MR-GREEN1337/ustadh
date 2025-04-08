"use client";

import React, { useState, useRef, useEffect } from 'react';
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
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

  // Custom renderer for code blocks with syntax highlighting
  const renderers = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  // Handle @mentions separately
  const processMentions = (content: string) => {
    // Extract any @mentions to process them separately
    const mentionMatches = content.match(/@(\w+)/g) || [];

    // Replace @mentions with placeholders that won't be processed by markdown
    let processedContent = content;
    mentionMatches.forEach((mention, index) => {
      processedContent = processedContent.replace(
        mention,
        `<!--mention-${index}-->`
      );
    });

    return { processedContent, mentionMatches };
  };

  // Format content with Markdown and LaTeX
  const renderMessageContent = (content: string) => {
    const { processedContent, mentionMatches } = processMentions(content);

    return (
      <div className="markdown-content whitespace-pre-wrap text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={renderers}
        >
          {processedContent}
        </ReactMarkdown>

        {/* Restore @mentions after markdown processing */}
        {mentionMatches.length > 0 && (
          <div className="mentions mt-2">
            {mentionMatches.map((mention, index) => (
              <span key={index} className="font-semibold mr-2">{mention}</span>
            ))}
          </div>
        )}
      </div>
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

  // Add custom styles for LaTeX and markdown
  useEffect(() => {
    // You can add additional custom styles if needed
    const style = document.createElement('style');
    style.innerHTML = `
      .markdown-content {
        font-family: system-ui, -apple-system, sans-serif;
      }
      .markdown-content h1,
      .markdown-content h2,
      .markdown-content h3 {
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
        font-weight: 600;
      }
      .markdown-content h1 {
        font-size: 1.5rem;
      }
      .markdown-content h2 {
        font-size: 1.25rem;
      }
      .markdown-content h3 {
        font-size: 1.125rem;
      }
      .markdown-content p {
        margin-bottom: 0.75rem;
      }
      .markdown-content ul,
      .markdown-content ol {
        margin-left: 1.5rem;
        margin-bottom: 0.75rem;
      }
      .markdown-content ul {
        list-style-type: disc;
      }
      .markdown-content ol {
        list-style-type: decimal;
      }
      .markdown-content blockquote {
        border-left: 3px solid #e2e8f0;
        padding-left: 1rem;
        margin-left: 0;
        margin-right: 0;
        font-style: italic;
      }
      .markdown-content pre {
        margin-bottom: 1rem;
        border-radius: 0.375rem;
      }
      .markdown-content code {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.875rem;
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        background-color: rgba(0, 0, 0, 0.05);
      }
      .markdown-content .math-display {
        overflow-x: auto;
        padding: 0.5rem 0;
      }
      .markdown-content table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1rem;
      }
      .markdown-content th,
      .markdown-content td {
        border: 1px solid #e2e8f0;
        padding: 0.5rem;
        text-align: left;
      }
      .markdown-content th {
        background-color: rgba(0, 0, 0, 0.05);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
                {user?.full_name?.split(' ').map((n: any) => n[0]).join('') || 'U'}
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
                      className="h-7 text-xs bg-primary text-primary-foreground"
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
